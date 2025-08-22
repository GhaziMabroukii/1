import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertPropertySchema, insertOfferSchema, insertContractSchema, insertNotificationSchema, insertConversationSchema, insertMessageSchema, insertReviewSchema, insertContractTerminationRequestSchema, contracts, users, conversations, messages, reviews, properties, offers, contractTerminationRequests } from "@shared/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";

// Conditionally import db only if DATABASE_URL is available
let db: any = null;
if (process.env.DATABASE_URL) {
  try {
    db = require("./db").db;
  } catch (error) {
    console.log("Database not available, using in-memory storage only");
  }
}

// Alias tables for clarity in joins
const offersTable = offers;

// Authentication middleware
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "No token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    // Extract user ID from session token
    const tokenParts = token.split('_');
    if (tokenParts.length < 4 || tokenParts[0] !== 'session') {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    const userId = parseInt(tokenParts[1]);
    const userType = tokenParts[2];
    
    const user = await storage.getUser(userId);
    if (!user || user.userType !== userType) {
      return res.status(401).json({ error: "Invalid session" });
    }
    
    // Add user info to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      userType: user.userType,
    };
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ error: "Invalid session" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Properties routes
  app.get("/api/properties", async (req, res) => {
    try {
      const ownerId = req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined;
      const properties = await storage.getProperties(ownerId);
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      console.log("Received property data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertPropertySchema.parse(req.body);
      console.log("Validated property data:", JSON.stringify(validatedData, null, 2));
      const property = await storage.createProperty(validatedData);
      res.status(201).json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: "Invalid property data", details: error.errors });
      }
      console.log("Property creation error:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const property = await storage.updateProperty(id, updates);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  // Offers routes
  app.get("/api/offers", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const userType = req.query.userType as string;
      const statusFilter = req.query.status as string;
      
      console.log(`Fetching offers for userId: ${userId}, userType: ${userType}, status: ${statusFilter}`);
      
      // Get offers using storage interface
      const allOffers = await storage.getOffers();
      
      // Filter offers based on user type and criteria
      let filteredOffers = [];
      
      if (userType === 'owner') {
        // Owners see offers received for their properties
        filteredOffers = allOffers.filter(offer => offer.ownerId === userId);
      } else {
        // Tenants see offers they sent
        filteredOffers = allOffers.filter(offer => offer.tenantId === userId);
      }
      
      // Apply status filter if provided
      if (statusFilter) {
        filteredOffers = filteredOffers.filter(offer => offer.status === statusFilter);
      }
      
      // Enrich offers with property and user data
      const enrichedOffers = await Promise.all(
        filteredOffers.map(async (offer) => {
          const property = await storage.getProperty(offer.propertyId);
          const tenant = await storage.getUser(offer.tenantId);
          const owner = await storage.getUser(offer.ownerId);
          
          return {
            ...offer,
            property: property ? {
              title: property.title,
              address: property.address,
            } : null,
            tenant: tenant ? {
              firstName: tenant.firstName,
              lastName: tenant.lastName,
              email: tenant.email,
            } : null,
            owner: owner ? {
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email,
            } : null
          };
        })
      );
      
      // Sort by creation date (newest first)
      enrichedOffers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`Found ${enrichedOffers.length} offers for user ${userId} (${userType}) with status: ${statusFilter || 'all'}`);
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Failed to fetch offers:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/offers", async (req, res) => {
    try {
      console.log("Received offer creation request:", req.body);
      const validatedData = insertOfferSchema.parse(req.body);
      console.log("Validated offer data:", validatedData);
      
      // Check for existing pending offers for this property from this tenant
      const existingOffers = await storage.getOffersByTenantAndProperty(validatedData.tenantId, validatedData.propertyId);
      const pendingOffers = existingOffers.filter(offer => offer.status === 'pending');
      
      if (pendingOffers.length > 0) {
        return res.status(400).json({ 
          error: "Vous avez déjà une offre en attente pour cette propriété. Attendez la réponse du propriétaire." 
        });
      }
      
      console.log("Creating offer with data:", validatedData);
      const offer = await storage.createOffer(validatedData);
      
      // Get property details for notifications
      const property = await storage.getProperty(validatedData.propertyId);
      
      // Notify owner about new offer
      await storage.createNotification({
        userId: validatedData.ownerId,
        title: "Nouvelle offre reçue",
        message: `Un locataire a envoyé une offre pour votre propriété ${property?.title || ''}.`,
        type: "offer",
        relatedId: offer.id,
      });

      // Notify tenant about their sent offer
      await storage.createNotification({
        userId: validatedData.tenantId,
        title: "Nouvelle offre envoyée",
        message: `Vous avez envoyé une offre au propriétaire pour ${property?.title || 'la propriété'}.`,
        type: "offer",
        relatedId: offer.id,
      });
      
      res.status(201).json(offer);
    } catch (error) {
      console.error("Error creating offer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid offer data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create offer", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update offer status (owner accepts/declines offer)
  app.put("/api/offers/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const offer = await storage.updateOfferStatus(id, status);
      
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      // Create notifications for both parties
      if (status === 'accepted') {
        // Notify tenant about acceptance
        await storage.createNotification({
          userId: offer.tenantId,
          title: "Offre acceptée",
          message: "Votre offre a été acceptée! Vous pouvez maintenant demander un contrat.",
          type: "offer",
          relatedId: offer.id,
        });

        // Notify owner about acceptance confirmation
        await storage.createNotification({
          userId: offer.ownerId,
          title: "Offre acceptée",
          message: "Vous avez accepté l'offre. Le locataire peut maintenant demander un contrat.",
          type: "offer",
          relatedId: offer.id,
        });
      } else if (status === 'rejected') {
        // Notify tenant about rejection
        await storage.createNotification({
          userId: offer.tenantId,
          title: "Offre refusée",
          message: "Votre offre a été refusée. Vous pouvez faire une nouvelle offre.",
          type: "offer",
          relatedId: offer.id,
        });

        // Notify owner about rejection confirmation
        await storage.createNotification({
          userId: offer.ownerId,
          title: "Offre refusée",
          message: "Vous avez refusé l'offre.",
          type: "offer",
          relatedId: offer.id,
        });
      }

      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update offer status" });
    }
  });

  // Contract request endpoint (tenant requests contract after accepted offer)
  app.put("/api/offers/:id/request-contract", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const offer = await storage.getOffer(id);
      
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }

      if (offer.status !== 'accepted') {
        return res.status(400).json({ error: "Offer must be accepted before requesting contract" });
      }

      const updatedOffer = await storage.updateOfferStatus(id, "contract_requested");

      // Create notifications for both parties
      await storage.createNotification({
        userId: offer.ownerId,
        title: "Demande de contrat",
        message: "Un locataire demande la création d'un contrat pour son offre acceptée",
        type: "contract_request",
        relatedId: offer.id,
      });

      await storage.createNotification({
        userId: offer.tenantId,
        title: "Contrat demandé",
        message: "Votre demande de contrat a été envoyée au propriétaire",
        type: "contract_request",
        relatedId: offer.id,
      });

      res.json(updatedOffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to request contract" });
    }
  });

  // Contracts routes
  app.get("/api/contracts", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const ownerOnly = req.query.ownerOnly === 'true';
      
      console.log(`Fetching contracts for userId: ${userId}, ownerOnly: ${ownerOnly}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Valid userId required" });
      }
      
      const contracts = ownerOnly ? 
        await storage.getOwnerContracts(userId) : 
        await storage.getContracts(userId);
        
      console.log(`Found ${contracts.length} contracts for user ${userId}`);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Failed to fetch contracts", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      console.log("Received contract data:", req.body);
      const validatedData = insertContractSchema.parse(req.body);
      
      // Verify that the offer exists and is in contract_requested status
      const offer = await storage.getOffer(validatedData.offerId);
      if (!offer) {
        return res.status(400).json({ error: "Offer not found" });
      }
      if (offer.status !== "contract_requested") {
        return res.status(400).json({ error: "Contract can only be created for requested offers" });
      }

      // Check if there's already an active contract for this property
      try {
        const existingActiveContract = await storage.getActiveContractForProperty(validatedData.propertyId);
        if (existingActiveContract) {
          return res.status(400).json({ 
            error: "Cette propriété a déjà un contrat actif. Impossible de créer un nouveau contrat tant que l'actuel n'est pas terminé ou expiré.",
            details: "Contract creation is restricted when an active contract exists"
          });
        }
      } catch (storageError) {
        console.log("Warning: Could not check for existing contracts:", storageError);
      }

      // Note: The storage.getActiveContractForProperty check above covers most cases
      // Additional checks would need storage interface methods to be implemented
      
      const contract = await storage.createContract(validatedData);
      
      // Create notification for tenant
      await storage.createNotification({
        userId: contract.tenantId,
        title: "Contrat créé",
        message: "Un contrat a été créé pour votre offre. Attendez la signature du propriétaire.",
        type: "contract",
        relatedId: contract.id,
      });

      res.status(201).json(contract);
    } catch (error) {
      console.error("Contract creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid contract data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create contract", details: (error as Error).message });
    }
  });

  app.put("/api/contracts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Check if contract exists and can be modified
      const existingContract = await storage.getContract(id);
      if (!existingContract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Only allow modifications if tenant hasn't signed yet
      if (existingContract.tenantSignature) {
        return res.status(400).json({ error: "Cannot modify contract after tenant signature" });
      }
      
      // Reset owner signature if contract data is modified
      const resetSignature = {
        ownerSignature: null,
        ownerSignedAt: null,
        tenantSignDeadline: null,
        status: 'draft'
      };
      
      const contract = await storage.updateContract(id, { ...updates, ...resetSignature });
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  app.put("/api/contracts/:id/sign", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { signatureType, signatureData } = req.body;
      
      if (!['owner', 'tenant'].includes(signatureType)) {
        return res.status(400).json({ error: "Invalid signature type" });
      }

      const contract = await storage.updateContractSignature(id, signatureType, signatureData);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Handle owner signature - set 3-day deadline for tenant
      if (signatureType === 'owner' && contract.status === 'owner_signed') {
        // Set tenant sign deadline to 3 days from now
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 3);
        await storage.updateContractDeadline(id, deadline);

        // Notify tenant with deadline
        await storage.createNotification({
          userId: contract.tenantId,
          title: "Nouveau contrat à signer",
          message: `Le propriétaire a signé le contrat. Vous avez 3 jours pour le signer avant expiration (deadline: ${deadline.toLocaleDateString('fr-FR')})`,
          type: "contract_signature_required",
          relatedId: contract.id,
        });
      }

      // Handle tenant signature - activate contract and update property
      if (signatureType === 'tenant' && contract.status === 'fully_signed') {
        // Check if tenant signed within deadline
        const currentContract = await storage.getContract(id);
        if (currentContract?.tenantSignDeadline && new Date() > new Date(currentContract.tenantSignDeadline)) {
          return res.status(400).json({ error: "Contract expired. Signing deadline has passed." });
        }

        // Check for other active contracts on this property
        const existingActiveContract = await storage.getActiveContractForProperty(contract.propertyId);
        if (existingActiveContract) {
          return res.status(400).json({ error: "This property already has an active contract." });
        }

        // Activate contract and update property status
        await storage.updateContractStatus(id, 'active');
        await storage.updatePropertyStatus(contract.propertyId, 'Loué');

        // Notify owner that contract is fully signed and active
        await storage.createNotification({
          userId: contract.ownerId,
          title: "Contrat activé",
          message: "Le locataire a signé le contrat. Le contrat est maintenant actif et la propriété est marquée comme louée.",
          type: "contract_active",
          relatedId: contract.id,
        });
      }

      res.json(contract);
    } catch (error) {
      console.error("Contract signing error:", error);
      res.status(500).json({ error: "Failed to sign contract" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationRead(id);
      if (!success) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationRead(id);
      if (!success) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Contract expiration check endpoint
  app.post("/api/contracts/expire-check", async (req, res) => {
    try {
      await storage.expireContracts();
      res.json({ success: true, message: "Contract expiration check completed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to check contract expiration" });
    }
  });

  // Contract modification
  app.put("/api/contracts/:id/modify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { contractData } = req.body;
      
      const contract = await storage.getContract(id);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Only allow modification if contract is not fully signed yet
      if (contract.status === 'active') {
        return res.status(400).json({ error: "Cannot modify an active contract" });
      }

      // Reset signatures if contract data is modified
      const [updated] = await db
        .update(contracts)
        .set({ 
          contractData, 
          ownerSignature: null, 
          tenantSignature: null,
          ownerSignedAt: null,
          tenantSignedAt: null,
          status: 'draft',
          tenantSignDeadline: null,
          updatedAt: new Date() 
        })
        .where(eq(contracts.id, id))
        .returning();

      // Notify both parties about the modification
      await storage.createNotification({
        userId: contract.ownerId,
        title: "Contrat modifié",
        message: "Le contrat a été modifié. Veuillez le réviser et le signer à nouveau.",
        type: "contract_modified",
        relatedId: contract.id,
      });

      await storage.createNotification({
        userId: contract.tenantId,
        title: "Contrat modifié",
        message: "Le contrat a été modifié par le propriétaire. Les signatures précédentes ont été supprimées.",
        type: "contract_modified",
        relatedId: contract.id,
      });

      res.json(updated);
    } catch (error) {
      console.error("Contract modification error:", error);
      res.status(500).json({ error: "Failed to modify contract" });
    }
  });









  // Enhanced bilateral contract termination endpoints
  
  // Get termination request for a contract
  app.get('/api/contracts/:id/termination-request', async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      // For now, return a simple response since termination requests are not fully implemented in storage
      // In the future, this would query termination requests from storage
      return res.status(404).json({ error: 'No termination request found' });
      
    } catch (error) {
      console.error('Error getting termination request:', error);
      res.status(500).json({ error: 'Failed to get termination request' });
    }
  });

  // Create termination request (simplified endpoint)
  app.post('/api/contracts/:id/termination-request', async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { requestedBy, reason, detailedReason, terminationType, proposedTerms } = req.body;
      
      console.log('Creating termination request:', { contractId, requestedBy, reason, terminationType });
      
      // Validate required fields
      if (requestedBy === undefined || requestedBy === null || !reason?.trim() || !terminationType) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      // Create termination request using storage interface
      const terminationRequest = {
        contractId,
        requestedBy,
        reason: reason.trim(),
        detailedReason: detailedReason?.trim(),
        terminationType,
        proposedTerms,
        status: 'pending' as const,
        ownerPasswordConfirmed: false,
        tenantPasswordConfirmed: false,
        ownerSignature: null,
        tenantSignature: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Get contract to validate and get user info
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Create termination request using storage interface
      const createdRequest = await storage.createTerminationRequest(terminationRequest);

      // Create notifications for both parties
      const targetUserId = requestedBy === contract.ownerId ? contract.tenantId : contract.ownerId;
      const initiatorType = requestedBy === contract.ownerId ? 'propriétaire' : 'locataire';
      
      await storage.createNotification({
        userId: targetUserId,
        title: 'Nouvelle demande d\'arrêt de contrat',
        message: `Le ${initiatorType} a créé une demande d'arrêt de contrat avec signature bilatérale requise.`,
        type: 'termination_request',
        relatedId: contractId
      });
      
      await storage.createNotification({
        userId: requestedBy,
        title: 'Demande d\'arrêt créée',
        message: `Votre demande d'arrêt de contrat a été créée. En attente de la réponse de l'autre partie.`,
        type: 'termination_request',
        relatedId: contractId
      });

      // Return success response with request ID for redirection
      res.status(201).json({ 
        message: 'Termination request created successfully',
        requestId: createdRequest.id,
        contractId,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating termination request:', error);
      res.status(500).json({ error: 'Failed to create termination request' });
    }
  });

  // Create enhanced termination request
  app.post('/api/contracts/:id/create-termination-request', async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { requestedBy, reason, detailedReason, terminationType, proposedTerms } = req.body;
      
      console.log('Termination request debug:', {
        contractId,
        requestedBy,
        reason,
        reasonTrimmed: reason?.trim(),
        terminationType,
        proposedTerms,
        hasRequestedBy: !!requestedBy,
        hasReason: !!reason?.trim(),
        hasTerminationType: !!terminationType,
        hasProposedTerms: !!proposedTerms
      });
      
      if (requestedBy === undefined || requestedBy === null || !reason?.trim() || !terminationType || !proposedTerms) {
        console.log('Validation failed:', {
          requestedByFail: requestedBy === undefined || requestedBy === null,
          reasonFail: !reason?.trim(),
          terminationTypeFail: !terminationType,
          proposedTermsFail: !proposedTerms
        });
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      // Create termination request using storage interface
      const terminationRequest = {
        contractId,
        requestedBy,
        reason: reason.trim(),
        detailedReason: detailedReason?.trim(),
        terminationType,
        proposedTerms,
        status: 'pending' as const,
        ownerPasswordConfirmed: false,
        tenantPasswordConfirmed: false,
        ownerSignature: null,
        tenantSignature: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Get contract to validate and get user info
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Create termination request using storage interface
      const createdRequest = await storage.createTerminationRequest(terminationRequest);

      // Create notifications for both parties
      const targetUserId = requestedBy === contract.ownerId ? contract.tenantId : contract.ownerId;
      const initiatorType = requestedBy === contract.ownerId ? 'propriétaire' : 'locataire';
      
      await storage.createNotification({
        userId: targetUserId,
        title: 'Nouvelle demande d\'arrêt de contrat',
        message: `Le ${initiatorType} a créé une demande d'arrêt de contrat avec signature bilatérale requise.`,
        type: 'termination_request',
        relatedId: contractId
      });
      
      await storage.createNotification({
        userId: requestedBy,
        title: 'Demande d\'arrêt créée',
        message: `Votre demande d'arrêt de contrat a été créée. En attente de la réponse de l'autre partie.`,
        type: 'termination_request',
        relatedId: contractId
      });

      // Return success response with request ID for redirection
      res.status(201).json({ 
        message: 'Termination request created successfully',
        requestId: createdRequest.id,
        contractId,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating termination request:', error);
      res.status(500).json({ error: 'Failed to create termination request' });
    }
  });

  // Confirm termination with password
  app.post('/api/contracts/:id/confirm-termination-password', async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { password, userType } = req.body;
      
      if (!password?.trim() || !userType) {
        return res.status(400).json({ error: 'Password and userType are required' });
      }

      // Get termination request using storage interface
      const terminationRequests = await storage.getContractTerminationRequests(contractId);
      const terminationRequest = terminationRequests.find((req: any) => req.status === 'accepted');
      
      if (!terminationRequest) {
        return res.status(404).json({ error: 'No active termination request found' });
      }

      // Get contract using storage interface
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Get the user to verify password
      const userId = userType === 'owner' ? contract.ownerId : contract.tenantId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password.trim(), user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Mot de passe incorrect' });
      }

      // Update password confirmation using storage interface
      const updateData: any = {};
      
      if (userType === 'owner') {
        updateData.ownerPasswordConfirmed = true;
        updateData.ownerConfirmedAt = new Date();
      } else {
        updateData.tenantPasswordConfirmed = true;
        updateData.tenantConfirmedAt = new Date();
      }
      
      // Update the termination request using storage interface
      let updatedRequest;
      if (db) {
        // Use database if available
        [updatedRequest] = await db
          .update(contractTerminationRequests)
          .set(updateData)
          .where(eq(contractTerminationRequests.id, terminationRequest.id))
          .returning();
      } else {
        // Use storage interface for in-memory storage
        console.log('Using storage interface for password confirmation update');
        updatedRequest = await storage.updateContractTerminationRequest(terminationRequest.id, updateData);
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error('Error confirming password:', error);
      res.status(500).json({ error: 'Failed to confirm password' });
    }
  });

  // Get termination request data for PDF generation
  app.get('/api/contracts/:id/termination-data', requireAuth, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      // Get contract details
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Get termination request
      const terminationRequests = await storage.getContractTerminationRequests(contractId);
      const terminationRequest = terminationRequests[0];
      
      if (!terminationRequest) {
        return res.status(404).json({ error: 'No termination request found' });
      }

      // Get user details
      const owner = await storage.getUser(contract.ownerId);
      const tenant = await storage.getUser(contract.tenantId);
      
      // Get property details
      const property = await storage.getProperty(contract.propertyId);
      
      const terminationData = {
        contract: {
          id: contract.id,
          propertyTitle: contract.contractData?.propertyTitle || 'N/A',
          propertyAddress: contract.contractData?.propertyAddress || 'N/A',
          monthlyRent: contract.contractData?.monthlyRent || 'N/A',
          startDate: contract.contractData?.startDate || 'N/A',
          endDate: contract.contractData?.endDate || 'N/A',
          terminatedAt: contract.terminatedAt || new Date(),
          terminationReason: contract.terminationReason || 'N/A'
        },
        termination: {
          id: terminationRequest.id,
          reason: terminationRequest.reason,
          detailedReason: terminationRequest.detailedReason,
          terminationType: terminationRequest.terminationType,
          proposedTerms: terminationRequest.proposedTerms,
          status: terminationRequest.status,
          ownerPasswordConfirmed: terminationRequest.ownerPasswordConfirmed,
          tenantPasswordConfirmed: terminationRequest.tenantPasswordConfirmed,
          ownerSignature: terminationRequest.ownerSignature,
          tenantSignature: terminationRequest.tenantSignature,
          ownerSignedAt: terminationRequest.ownerSignedAt,
          tenantSignedAt: terminationRequest.tenantSignedAt,
          terminationEffectiveDate: terminationRequest.terminationEffectiveDate,
          createdAt: terminationRequest.createdAt,
          updatedAt: terminationRequest.updatedAt
        },
        parties: {
          owner: {
            name: `${owner?.firstName || ''} ${owner?.lastName || ''}`.trim() || 'N/A',
            email: owner?.email || 'N/A'
          },
          tenant: {
            name: `${tenant?.firstName || ''} ${tenant?.lastName || ''}`.trim() || 'N/A',
            email: tenant?.email || 'N/A'
          }
        },
        property: {
          title: property?.title || 'N/A',
          address: property?.address || 'N/A'
        }
      };
      
      res.json(terminationData);
    } catch (error) {
      console.error('Error fetching termination data:', error);
      res.status(500).json({ error: 'Failed to fetch termination data' });
    }
  });

  // Submit digital signature - requires authentication
  app.post('/api/contracts/:id/submit-termination-signature', requireAuth, async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { signature, userType } = req.body;
      
      if (!signature?.trim() || !userType) {
        return res.status(400).json({ error: 'Signature and userType are required' });
      }

      // Get termination request using storage interface
      let terminationRequest;
      if (db) {
        [terminationRequest] = await db
          .select()
          .from(contractTerminationRequests)
          .where(eq(contractTerminationRequests.contractId, contractId));
      } else {
        // Use storage interface
        const allRequests = await storage.getContractTerminationRequests(contractId);
        terminationRequest = allRequests[0];
      }
      
      if (!terminationRequest) {
        return res.status(404).json({ error: 'No termination request found' });
      }

      // Check if password was confirmed first
      if ((userType === 'owner' && !terminationRequest.ownerPasswordConfirmed) ||
          (userType === 'tenant' && !terminationRequest.tenantPasswordConfirmed)) {
        return res.status(400).json({ error: 'Vous devez d\'abord confirmer avec votre mot de passe' });
      }

      // Update signature
      const updateData: any = { updatedAt: new Date() };
      
      if (userType === 'owner') {
        updateData.ownerSignature = signature.trim();
        updateData.ownerSignedAt = new Date();
      } else {
        updateData.tenantSignature = signature.trim();
        updateData.tenantSignedAt = new Date();
      }

      // Update signature using storage interface
      let updatedRequest;
      if (db) {
        [updatedRequest] = await db
          .update(contractTerminationRequests)
          .set(updateData)
          .where(eq(contractTerminationRequests.id, terminationRequest.id))
          .returning();
      } else {
        console.log('Using storage interface for signature update');
        updatedRequest = await storage.updateContractTerminationRequest(terminationRequest.id, updateData);
      }

      // Check if both parties have signed and confirmed passwords
      const bothSigned = updatedRequest.ownerSignature && updatedRequest.tenantSignature;
      const bothConfirmed = updatedRequest.ownerPasswordConfirmed && updatedRequest.tenantPasswordConfirmed;
      
      if (bothSigned && bothConfirmed) {
        // Complete the termination - all 5 steps are now complete
        if (db) {
          await db.update(contractTerminationRequests)
            .set({ 
              status: 'completed', 
              terminationEffectiveDate: new Date(),
              finalTerms: terminationRequest.proposedTerms,
              updatedAt: new Date()
            })
            .where(eq(contractTerminationRequests.id, terminationRequest.id));
            
          await db.update(contracts)
            .set({ 
              status: 'terminated', 
              terminationReason: terminationRequest.reason, 
              terminatedBy: terminationRequest.requestedBy,
              terminatedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(contracts.id, contractId));

          // Update property status to available
          const [contract] = await db
            .select()
            .from(contracts)
            .where(eq(contracts.id, contractId));
            
          if (contract) {
            await storage.updatePropertyStatus(contract.propertyId, 'Disponible');
            
            // Notify both parties of completion
            await storage.createNotification({
              userId: contract.ownerId,
              title: "🎉 Contrat résilié avec succès",
              message: "Le contrat a été officiellement terminé. Toutes les signatures ont été complétées. Vous pouvez télécharger le PDF de résiliation.",
              type: "contract_terminated",
              relatedId: contractId,
            });
            
            await storage.createNotification({
              userId: contract.tenantId,
              title: "🎉 Contrat résilié avec succès", 
              message: "Le contrat a été officiellement terminé. Toutes les signatures ont été complétées. Vous pouvez télécharger le PDF de résiliation.",
              type: "contract_terminated",
              relatedId: contractId,
            });
          }
        } else {
          // Storage interface fallback for completing termination
          console.log('Using storage interface for termination completion');
          await storage.updateContractTerminationRequest(terminationRequest.id, {
            status: 'completed',
            terminationEffectiveDate: new Date(),
            finalTerms: terminationRequest.proposedTerms,
            updatedAt: new Date()
          });
          
          // Update contract status to terminated in storage
          await storage.updateContract(contractId, {
            status: 'terminated',
            terminationReason: terminationRequest.reason,
            terminatedBy: terminationRequest.requestedBy,
            terminatedAt: new Date(),
            updatedAt: new Date()
          });
          
          // Get contract details for property update and notifications
          const contract = await storage.getContract(contractId);
          if (contract) {
            // Update property status to available
            await storage.updatePropertyStatus(contract.propertyId, 'Disponible');
            
            // Notify both parties of completion with sweet alert style
            await storage.createNotification({
              userId: contract.ownerId,
              title: "🎉 Contrat résilié avec succès",
              message: "Le contrat a été officiellement terminé. La propriété est maintenant disponible. Vous pouvez télécharger le PDF de résiliation.",
              type: "contract_terminated_success",
              relatedId: contractId,
            });
            
            await storage.createNotification({
              userId: contract.tenantId,
              title: "🎉 Contrat résilié avec succès", 
              message: "Le contrat a été officiellement terminé. Toutes les signatures ont été complétées. Vous pouvez télécharger le PDF de résiliation.",
              type: "contract_terminated_success",
              relatedId: contractId,
            });
          }
        }
      }

      // Send success response with completion notification
      res.json({
        success: true,
        message: 'Signature ajoutée avec succès',
        data: updatedRequest,
        terminationCompleted: bothSigned && bothConfirmed
      });
    } catch (error) {
      console.error('Error submitting signature:', error);
      res.status(500).json({ error: 'Failed to submit signature' });
    }
  });

  // Owner-specific termination request endpoint
  app.post('/api/contracts/:id/owner-termination-request', async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { requestedBy, reason, detailedReason, terminationType, proposedTerms } = req.body;
      
      console.log('Creating OWNER termination request:', { contractId, requestedBy, reason, terminationType });
      
      // Validate required fields
      if (requestedBy === undefined || requestedBy === null || !reason?.trim() || !terminationType) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      // Get contract to validate ownership
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Verify the requester is the owner
      if (contract.ownerId !== requestedBy) {
        return res.status(403).json({ error: 'Only the property owner can use this endpoint' });
      }

      // Create termination request using storage interface
      const terminationRequest = {
        contractId,
        requestedBy,
        reason: reason.trim(),
        detailedReason: detailedReason?.trim(),
        terminationType,
        proposedTerms,
        status: 'pending' as const,
        ownerPasswordConfirmed: false,
        tenantPasswordConfirmed: false,
        ownerSignature: null,
        tenantSignature: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdRequest = await storage.createTerminationRequest(terminationRequest);

      // Create notifications - notify TENANT about OWNER's request
      await storage.createNotification({
        userId: contract.tenantId,
        title: 'Demande d\'arrêt de contrat du propriétaire',
        message: `Le propriétaire a créé une demande d'arrêt de contrat. Veuillez examiner et répondre à cette demande.`,
        type: 'termination_request',
        relatedId: contractId
      });
      
      // Confirm to owner that request was created
      await storage.createNotification({
        userId: requestedBy,
        title: 'Demande d\'arrêt créée',
        message: `Votre demande d'arrêt de contrat a été créée. En attente de la réponse du locataire.`,
        type: 'termination_request',
        relatedId: contractId
      });

      res.status(201).json({
        message: 'Owner termination request created successfully',
        requestId: createdRequest.id,
        contractId: contractId,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating owner termination request:', error);
      res.status(500).json({ error: 'Failed to create owner termination request' });
    }
  });

  // Tenant-specific termination request endpoint  
  app.post('/api/contracts/:id/tenant-termination-request', async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { requestedBy, reason, detailedReason, terminationType, proposedTerms } = req.body;
      
      console.log('Creating TENANT termination request:', { contractId, requestedBy, reason, terminationType });
      
      // Validate required fields
      if (requestedBy === undefined || requestedBy === null || !reason?.trim() || !terminationType) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      // Get contract to validate tenancy
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Verify the requester is the tenant
      if (contract.tenantId !== requestedBy) {
        return res.status(403).json({ error: 'Only the tenant can use this endpoint' });
      }

      // Create termination request using storage interface
      const terminationRequest = {
        contractId,
        requestedBy,
        reason: reason.trim(),
        detailedReason: detailedReason?.trim(),
        terminationType,
        proposedTerms,
        status: 'pending' as const,
        ownerPasswordConfirmed: false,
        tenantPasswordConfirmed: false,
        ownerSignature: null,
        tenantSignature: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdRequest = await storage.createTerminationRequest(terminationRequest);

      // Create notifications - notify OWNER about TENANT's request
      await storage.createNotification({
        userId: contract.ownerId,
        title: 'Demande d\'arrêt de contrat du locataire',
        message: `Le locataire a créé une demande d'arrêt de contrat. Veuillez examiner et répondre à cette demande.`,
        type: 'termination_request',
        relatedId: contractId
      });
      
      // Confirm to tenant that request was created
      await storage.createNotification({
        userId: requestedBy,
        title: 'Demande d\'arrêt créée',
        message: `Votre demande d'arrêt de contrat a été créée. En attente de la réponse du propriétaire.`,
        type: 'termination_request',
        relatedId: contractId
      });

      res.status(201).json({
        message: 'Tenant termination request created successfully', 
        requestId: createdRequest.id,
        contractId: contractId,
        status: 'pending'
      });
    } catch (error) {
      console.error('Error creating tenant termination request:', error);
      res.status(500).json({ error: 'Failed to create tenant termination request' });
    }
  });

  // Legacy termination endpoint for compatibility  
  app.post("/api/contracts/:id/request-termination", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { requestedBy, reason, detailedReason } = req.body;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Only allow termination requests for active contracts
      if (contract.status !== 'active') {
        return res.status(400).json({ error: "Can only request termination for active contracts" });
      }

      // Only owner can request early termination
      if (contract.ownerId !== requestedBy) {
        return res.status(403).json({ error: "Only the owner can request early termination" });
      }

      // Validate required reason
      if (!reason) {
        return res.status(400).json({ error: "Termination reason is required" });
      }

      // Create termination request
      const [terminationRequest] = await db
        .insert(contractTerminationRequests)
        .values({
          contractId,
          requestedBy,
          reason,
          detailedReason,
          terminationType: 'early_by_owner',
          proposedTerms: {
            financialTerms: 'Résiliation anticipée',
            timeline: 'Immédiat',
            depositHandling: 'Remboursement selon les termes du bail'
          },
          status: 'pending'
        })
        .returning();

      // Notify tenant of termination request
      await storage.createNotification({
        userId: contract.tenantId,
        title: "Demande d'arrêt anticipé du contrat",
        message: `Le propriétaire demande l'arrêt anticipé du contrat. Raison: ${reason}${detailedReason ? `. Détails: ${detailedReason}` : ''}`,
        type: "contract_termination_request",
        relatedId: contractId,
      });

      res.status(201).json(terminationRequest);
    } catch (error) {
      console.error("Contract termination request error:", error);
      res.status(500).json({ error: "Failed to create termination request" });
    }
  });




  // Respond to contract termination request - Both tenant and owner can respond
  app.put("/api/contract-termination-requests/:id/respond", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { response, tenantResponse, ownerResponse, userId } = req.body; // response: 'accepted' | 'rejected'
      
      const request = await storage.getTerminationRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: "Termination request not found" });
      }

      const contract = await storage.getContract(request.contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Check if user is either tenant or owner
      const isTenant = contract.tenantId === userId;
      const isOwner = contract.ownerId === userId;
      
      if (!isTenant && !isOwner) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update request status using storage interface
      await storage.updateTerminationRequestStatus(requestId, response);
      
      // Get the updated request
      const updatedRequest = await storage.getTerminationRequest(requestId);

      if (response === 'accepted') {
        // DO NOT terminate contract immediately - follow the 5-step workflow
        // Only notify owner that tenant accepted and next steps are needed
        await storage.createNotification({
          userId: contract.ownerId,
          title: "Demande d'arrêt acceptée",
          message: "Le locataire a accepté votre demande d'arrêt. Veuillez procéder aux étapes de validation.",
          type: "contract_termination_accepted",
          relatedId: request.contractId,
        });
      } else {
        // Notify owner of rejection
        await storage.createNotification({
          userId: contract.ownerId,
          title: "Arrêt anticipé refusé",
          message: "Le locataire a refusé l'arrêt anticipé. Le contrat reste actif jusqu'à son expiration naturelle.",
          type: "contract_termination_rejected",
          relatedId: request.contractId,
        });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Contract termination response error:", error);
      res.status(500).json({ error: "Failed to respond to termination request" });
    }
  });

  // Contract PDF download
  app.get("/api/contracts/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contract = await storage.getContract(id);
      
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Only allow download if contract is fully signed
      if (contract.status !== 'active' && contract.status !== 'fully_signed') {
        return res.status(400).json({ error: "Contract must be fully signed to download" });
      }

      // Generate PDF URL (in real implementation, this would generate/retrieve actual PDF)
      const pdfUrl = `/api/contracts/${id}/pdf`;
      
      res.json({ 
        downloadUrl: pdfUrl,
        filename: `contrat_${id}_${(contract.contractData as any)?.propertyTitle?.replace(/\s+/g, '_') || 'property'}.pdf`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate download link" });
    }
  });

  // Users routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("User fetch error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Enhanced Conversations routes with real-time messaging and media support
  
  // Get all conversations for a user
  // Clean up duplicate conversations (dev only) - merge conversations by user pairs
  app.post("/api/dev/cleanup-conversations", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Only available in development" });
    }

    try {
      // Call the storage method to merge conversations
      const result = await (storage as any).mergeConversationsByUserPairs();
      const { duplicatesRemoved, conversationsMerged } = result;
      
      res.json({ 
        message: `Cleanup completed. Merged ${conversationsMerged} user pairs, removed ${duplicatesRemoved} duplicate conversations.`,
        duplicatesRemoved,
        conversationsMerged
      });
    } catch (error) {
      console.error('Cleanup error:', error);
      res.status(500).json({ error: 'Failed to cleanup conversations' });
    }
  });

  app.get("/api/conversations", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Create conversation or send message
  app.post("/api/conversations", async (req, res) => {
    try {
      const { propertyId, tenantId, ownerId, message, messageType = 'text', fileUrl } = req.body;
      
      if (!tenantId || !ownerId) {
        return res.status(400).json({ error: "tenantId and ownerId are required" });
      }
      
      // Get or create conversation
      const conversation = await storage.getOrCreateConversation(
        propertyId || null, 
        tenantId, 
        ownerId
      );
      
      let newMessage = null;
      
      // Create message if provided
      if (message) {
        newMessage = await storage.createMessage({
          conversationId: conversation.id,
          senderId: tenantId, // Usually tenant sends initial message
          content: message,
          messageType,
          fileUrl
        });
        
        // Broadcast real-time message to participants
        const server = req.app.get('server') || (req as any).server;
        if (server && server.broadcastToUsers) {
          const messageData = {
            type: 'new_message',
            conversationId: conversation.id,
            message: newMessage
          };
          server.broadcastToUsers([tenantId, ownerId], messageData);
        }
      }
      
      res.json({ 
        success: true, 
        conversationId: conversation.id,
        conversation,
        message: newMessage 
      });
    } catch (error) {
      console.error("Conversation error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  
  // Send message to existing conversation
  app.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { senderId, content, messageType = 'text', fileUrl } = req.body;
      
      if (!senderId || !content) {
        return res.status(400).json({ error: "Sender ID and content are required" });
      }
      
      // Create message
      const newMessage = await storage.createMessage({
        conversationId,
        senderId,
        content,
        messageType,
        fileUrl
      });
      
      // Get conversation to find participants
      const conversation = await storage.getConversation(conversationId);
      if (conversation) {
        const participants = [conversation.tenantId, conversation.ownerId];
        
        // Broadcast real-time message to participants
        const server = req.app.get('server') || (req as any).server;
        if (server && server.broadcastToUsers) {
          const messageData = {
            type: 'new_message',
            conversationId,
            message: newMessage
          };
          server.broadcastToUsers(participants, messageData);
        }
      }
      
      res.json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messagesList = await storage.getConversationMessages(conversationId);
      res.json(messagesList);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  // Mark message as read
  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const success = await storage.markMessageAsRead(messageId);
      
      if (!success) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });

  // User search endpoint for messaging
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const userId = parseInt(req.query.userId as string);
      
      if (!query || !userId) {
        return res.json([]);
      }
      
      if (query.length < 2) {
        return res.json([]);
      }
      
      const searchResults = await storage.searchUsers(query, userId);
      
      // Add additional info for display
      const enhancedResults = searchResults.map(user => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`,
        displayInfo: `${user.firstName} ${user.lastName} (${user.userType})`,
        email: user.email,
        phone: user.phone
      }));
      
      res.json(enhancedResults);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Block user endpoint
  app.post("/api/users/:id/block", async (req, res) => {
    try {
      const blockedId = parseInt(req.params.id);
      const { blockerId } = req.body;
      
      if (!blockerId || !blockedId) {
        return res.status(400).json({ error: "Blocker ID and blocked user ID are required" });
      }
      
      const block = await storage.blockUser(blockerId, blockedId);
      res.json({ success: true, block });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  // Unblock user endpoint
  app.delete("/api/users/:id/block", async (req, res) => {
    try {
      const blockedId = parseInt(req.params.id);
      const { blockerId } = req.body;
      
      if (!blockerId || !blockedId) {
        return res.status(400).json({ error: "Blocker ID and blocked user ID are required" });
      }
      
      const success = await storage.unblockUser(blockerId, blockedId);
      res.json({ success });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // Reviews routes
  app.get("/api/properties/:id/reviews", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      const reviewsList = await db.select()
        .from(reviews)
        .where(eq(reviews.propertyId, propertyId))
        .orderBy(desc(reviews.createdAt));
      res.json(reviewsList);
    } catch (error) {
      console.error("Reviews fetch error:", error);
      res.json([]); // Return empty array instead of error
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      const [review] = await db.insert(reviews).values(validatedData).returning();
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid review data", details: error.errors });
      }
      console.error("Review creation error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Get pending requests for a contract (only termination requests now)
  app.get("/api/contracts/:id/pending-requests", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      // Get termination requests only
      const terminationRequests = await db
        .select({
          id: contractTerminationRequests.id,
          type: sql<string>`'termination'`,
          status: contractTerminationRequests.status,
          createdAt: contractTerminationRequests.createdAt,
        })
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.contractId, contractId));

      res.json(terminationRequests);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });



  // Get specific termination request
  app.get("/api/contract-termination-requests/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      console.log(`Fetching termination request ${requestId}`);
      
      const request = await storage.getTerminationRequest(requestId);
      if (!request) {
        console.log(`Termination request ${requestId} not found`);
        return res.status(404).json({ error: "Request not found" });
      }

      console.log(`Found termination request ${requestId}:`, request);
      res.json(request);
    } catch (error) {
      console.error("Failed to fetch termination request:", error);
      res.status(500).json({ error: "Failed to fetch termination request" });
    }
  });

  // Get tenant's requests
  app.get("/api/tenant-requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      console.log(`Fetching tenant requests for user ${userId}`);
      const requests = await storage.getTerminationRequestsByTenant(userId);
      res.json(requests);
    } catch (error) {
      console.error("Failed to fetch tenant requests:", error);
      res.status(500).json({ error: "Failed to fetch tenant requests" });
    }
  });

  // Get owner's requests
  app.get("/api/owner-requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      console.log(`Fetching owner requests for user ${userId}`);
      const requests = await storage.getTerminationRequestsByOwner(userId);
      res.json(requests);
    } catch (error) {
      console.error("Failed to fetch owner requests:", error);
      res.status(500).json({ error: "Failed to fetch owner requests" });
    }
  });

  // Authentication routes with proper user type handling
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Verify password hash using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Create session token with user type
      const sessionToken = `session_${user.id}_${user.userType}_${Date.now()}`;
      
      // Return user info with session token
      const responseUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        userType: user.userType,
      };
      
      res.json({ 
        user: responseUser, 
        token: sessionToken,
        userType: user.userType,
        message: `Connexion réussie en tant que ${user.userType === 'owner' ? 'propriétaire' : 'locataire'}` 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Get current user session info
  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No token provided" });
      }
      
      const token = authHeader.split(' ')[1];
      // Extract user ID from session token
      const tokenParts = token.split('_');
      if (tokenParts.length < 4 || tokenParts[0] !== 'session') {
        return res.status(401).json({ error: "Invalid token" });
      }
      
      const userId = parseInt(tokenParts[1]);
      const userType = tokenParts[2];
      
      const user = await storage.getUser(userId);
      if (!user || user.userType !== userType) {
        return res.status(401).json({ error: "Invalid session" });
      }
      
      const responseUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        userType: user.userType,
      };
      
      res.json({ user: responseUser });
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(401).json({ error: "Invalid session" });
    }
  });

  // Registration with automatic user type detection
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, firstName, lastName, phone } = req.body;
      
      if (!username || !password || !email) {
        return res.status(400).json({ error: "Username, password, and email required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      // Auto-detect user type based on email patterns
      let userType = 'tenant'; // Default to tenant
      const emailLower = email.toLowerCase();
      
      // Check for student email patterns
      const isStudent = emailLower.includes('etudiant') || 
                       emailLower.includes('student') || 
                       emailLower.endsWith('.tn') ||
                       emailLower.includes('universite') ||
                       emailLower.includes('university') ||
                       emailLower.includes('fst') ||
                       emailLower.includes('iset') ||
                       emailLower.includes('enis');
      
      // If not clearly a student email, check for owner patterns
      if (!isStudent) {
        const isOwner = emailLower.includes('proprietaire') ||
                       emailLower.includes('owner') ||
                       emailLower.includes('agence') ||
                       emailLower.includes('immobilier') ||
                       (!emailLower.endsWith('.tn') && 
                        (emailLower.includes('gmail') || emailLower.includes('outlook') || emailLower.includes('hotmail')));
        
        if (isOwner) {
          userType = 'owner';
        }
      }
      
      // Hash password before storing
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        phone,
        userType,
      });
      
      // Create session token
      const sessionToken = `session_${newUser.id}_${newUser.userType}_${Date.now()}`;
      
      const responseUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        userType: newUser.userType,
      };
      
      res.status(201).json({ 
        user: responseUser, 
        token: sessionToken,
        userType: newUser.userType,
        message: `Compte créé avec succès en tant que ${newUser.userType === 'owner' ? 'propriétaire' : 'locataire'}` 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });



  // Get termination requests for a user (owner or tenant)
  app.get("/api/termination-requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userType = req.query.userType as string;
      
      if (userType === 'owner') {
        // Owner sees their sent termination requests
        const requests = await db
          .select({
            id: contractTerminationRequests.id,
            contractId: contractTerminationRequests.contractId,
            reason: contractTerminationRequests.reason,
            detailedReason: contractTerminationRequests.detailedReason,
            status: contractTerminationRequests.status,
            tenantResponse: contractTerminationRequests.tenantResponse,
            respondedAt: contractTerminationRequests.respondedAt,
            createdAt: contractTerminationRequests.createdAt,
            property: {
              title: properties.title,
              address: properties.address,
            },
            tenant: {
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
            }
          })
          .from(contractTerminationRequests)
          .leftJoin(contracts, eq(contractTerminationRequests.contractId, contracts.id))
          .leftJoin(properties, eq(contracts.propertyId, properties.id))
          .leftJoin(users, eq(contracts.tenantId, users.id))
          .where(eq(contractTerminationRequests.requestedBy, userId))
          .orderBy(desc(contractTerminationRequests.createdAt));
        
        res.json(requests);
      } else {
        // Tenant sees termination requests received for their contracts
        const userContracts = await db
          .select({ id: contracts.id })
          .from(contracts)
          .where(eq(contracts.tenantId, userId));
        
        if (userContracts.length === 0) {
          return res.json([]);
        }
        
        const contractIds = userContracts.map(c => c.id);
        const requests = await db
          .select({
            id: contractTerminationRequests.id,
            contractId: contractTerminationRequests.contractId,
            reason: contractTerminationRequests.reason,
            detailedReason: contractTerminationRequests.detailedReason,
            status: contractTerminationRequests.status,
            tenantResponse: contractTerminationRequests.tenantResponse,
            respondedAt: contractTerminationRequests.respondedAt,
            createdAt: contractTerminationRequests.createdAt,
            property: {
              title: properties.title,
              address: properties.address,
            },
            owner: {
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
            }
          })
          .from(contractTerminationRequests)
          .leftJoin(contracts, eq(contractTerminationRequests.contractId, contracts.id))
          .leftJoin(properties, eq(contracts.propertyId, properties.id))
          .leftJoin(users, eq(contractTerminationRequests.requestedBy, users.id))
          .where(inArray(contractTerminationRequests.contractId, contractIds))
          .orderBy(desc(contractTerminationRequests.createdAt));
        
        res.json(requests);
      }
    } catch (error) {
      console.error("Get termination requests error:", error);
      res.status(500).json({ error: "Failed to fetch termination requests" });
    }
  });

  // Development route to initialize test users
  app.post("/api/dev/init-users", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Only available in development" });
    }

    try {
      // Check if users already exist
      const existingTenant = await storage.getUserByUsername('locataire@test.com');
      const existingOwner = await storage.getUserByUsername('proprietaire@test.com');
      
      if (existingTenant && existingOwner) {
        return res.json({
          message: 'Test users already exist',
          users: [
            { username: 'locataire@test.com', password: 'password123', type: 'tenant', name: 'Ahmed Ben Ali' },
            { username: 'proprietaire@test.com', password: 'password123', type: 'owner', name: 'Fatma Trabelsi' }
          ]
        });
      }

      // Create tenant user
      const tenantPassword = await bcrypt.hash('password123', 10);
      const tenant = await storage.createUser({
        username: 'locataire@test.com',
        password: tenantPassword,
        email: 'ahmed.student@enis.tn',
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        phone: '+216 20 123 456',
        userType: 'tenant'
      });

      // Create owner user
      const ownerPassword = await bcrypt.hash('password123', 10);
      const owner = await storage.createUser({
        username: 'proprietaire@test.com',
        password: ownerPassword,
        email: 'fatma.immobilier@gmail.com',
        firstName: 'Fatma',
        lastName: 'Trabelsi',
        phone: '+216 98 765 432',
        userType: 'owner'
      });

      // Create sample properties for the owner
      const property1 = await storage.createProperty({
        ownerId: owner.id,
        title: 'Studio moderne près de l\'INSAT',
        description: 'Studio entièrement meublé, parfait pour étudiants. Proche des transports en commun.',
        type: 'studio',
        price: '400',
        priceType: 'mois',
        surface: 30,
        rooms: 1,
        bathrooms: 1,
        address: 'Rue de la Liberté, Tunis',
        latitude: '36.8065',
        longitude: '10.1815',
        amenities: ['wifi', 'cuisine_equipee', 'climatisation'],
        rules: ['non_fumeur', 'pas_animaux'],
        images: [],
        status: 'Disponible',
        deposit: '200',
        utilities: 'Électricité incluse',
        utilitiesIncluded: true,
        categories: ['Étudiant'],
        geographicHighlight: 'À 500m de l\'INSAT'
      });

      const property2 = await storage.createProperty({
        ownerId: owner.id,
        title: 'Appartement familial 3 pièces',
        description: 'Appartement spacieux avec balcon, idéal pour famille. Quartier calme et sécurisé.',
        type: 'apartment',
        price: '800',
        priceType: 'mois',
        surface: 85,
        rooms: 3,
        bathrooms: 2,
        address: 'Avenue Habib Bourguiba, Sfax',
        latitude: '34.7406',
        longitude: '10.7603',
        amenities: ['parking', 'ascenseur', 'balcon', 'chauffage'],
        rules: ['famille_preferee'],
        images: [],
        status: 'Disponible',
        deposit: '400',
        utilities: 'Eau incluse',
        utilitiesIncluded: false,
        categories: ['Famille'],
        geographicHighlight: 'Centre ville de Sfax'
      });

      res.json({
        message: 'Test users and properties created successfully',
        users: [
          { username: 'locataire@test.com', password: 'password123', type: 'tenant', name: 'Ahmed Ben Ali' },
          { username: 'proprietaire@test.com', password: 'password123', type: 'owner', name: 'Fatma Trabelsi' }
        ],
        properties: [property1.title, property2.title]
      });
    } catch (error) {
      console.error('Error creating test users:', error);
      res.status(500).json({ error: 'Failed to create test users' });
    }
  });

  // Debug endpoint to check users
  app.get("/api/dev/debug-users", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Only available in development" });
    }

    try {
      const tenant = await storage.getUserByUsername('locataire@test.com');
      const owner = await storage.getUserByUsername('proprietaire@test.com');
      
      res.json({
        tenant: tenant ? { id: tenant.id, username: tenant.username, userType: tenant.userType } : null,
        owner: owner ? { id: owner.id, username: owner.username, userType: owner.userType } : null,
        message: 'Current user status'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check users', details: error });
    }
  });

  // Create test contract for testing termination workflow
  app.post("/api/dev/create-test-contract", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Only available in development" });
    }

    try {
      // Get the first available property from the owner
      const properties = await storage.getProperties();
      const ownerProperty = properties.find(p => p.ownerId === 2 && p.status === 'Disponible');
      
      if (!ownerProperty) {
        return res.status(400).json({ error: "No available property found for owner" });
      }

      // First create an offer
      const offerData = {
        propertyId: ownerProperty.id,
        tenantId: 1, // student_ahmed
        monthlyRent: parseInt(ownerProperty.price),
        deposit: parseInt(ownerProperty.deposit || '0'),
        message: 'Je suis intéressé par cette propriété pour un bail de 12 mois.',
        status: 'contract_requested'
      };

      const offer = await storage.createOffer(offerData);

      // Now create a contract with realistic data
      const contractData = {
        offerId: offer.id,
        propertyId: ownerProperty.id,
        ownerId: 2, // owner_fatma
        tenantId: 1, // student_ahmed
        status: 'fully_signed',
        ownerSignature: 'Owner Signature Data',
        tenantSignature: 'Tenant Signature Data',
        ownerSignedAt: new Date(),
        tenantSignedAt: new Date(),
        contractData: {
          propertyTitle: ownerProperty.title,
          propertyAddress: ownerProperty.address,
          landlordName: 'Fatma Trabelsi',
          tenantName: 'Ahmed Ben Ali',
          monthlyRent: ownerProperty.price,
          deposit: ownerProperty.deposit,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          terms: [
            "Le locataire s'engage à payer le loyer avant le 5 de chaque mois",
            "Aucun animal domestique autorisé",
            "Interdiction de fumer dans les locaux",
            "Durée du bail: 12 mois renouvelable"
          ]
        }
      };

      const contract = await storage.createContract(contractData);
      
      // Update property status to rented
      await storage.updatePropertyStatus(ownerProperty.id, 'Loué');

      res.json({ 
        message: 'Test contract created successfully',
        contract: contract,
        offer: offer
      });
    } catch (error) {
      console.error('Error creating test contract:', error);
      res.status(500).json({ error: 'Failed to create test contract', details: error.message });
    }
  });

  // User profile endpoints
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Remove sensitive fields from updates
      const { password, emailVerificationCode, phoneVerificationCode, ...safeUpdates } = updates;
      
      const updatedUser = await storage.updateUser(id, safeUpdates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't send password in response
      const { password: pwd, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Configure multer for file uploads (photos, videos, documents)
  const storage_config = multer.memoryStorage();
  const upload = multer({ 
    storage: storage_config,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for videos
    fileFilter: (req, file, cb) => {
      // Allow images, videos, and common document types
      const allowedTypes = /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|pdf|doc|docx)$/i;
      if (file.mimetype.startsWith('image/') || 
          file.mimetype.startsWith('video/') || 
          allowedTypes.test(file.originalname)) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed'), false);
      }
    }
  });
  
  // Search users for messaging
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const currentUserId = parseInt(req.query.userId as string);
      
      if (!query || !currentUserId) {
        return res.status(400).json({ error: "Query and user ID are required" });
      }
      
      const users = await storage.searchUsers(query, currentUserId);
      res.json(users);
    } catch (error) {
      console.error("Failed to search users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // Block/unblock user
  app.post("/api/users/:userId/block", async (req, res) => {
    try {
      const blockerId = parseInt(req.body.blockerId);
      const blockedId = parseInt(req.params.userId);
      
      if (!blockerId || !blockedId) {
        return res.status(400).json({ error: "Blocker and blocked user IDs are required" });
      }
      
      const block = await storage.blockUser(blockerId, blockedId);
      res.json({ message: "User blocked successfully", block });
    } catch (error) {
      console.error("Failed to block user:", error);
      res.status(500).json({ error: "Failed to block user" });
    }
  });

  app.delete("/api/users/:userId/block", async (req, res) => {
    try {
      const blockerId = parseInt(req.body.blockerId);
      const blockedId = parseInt(req.params.userId);
      
      if (!blockerId || !blockedId) {
        return res.status(400).json({ error: "Blocker and blocked user IDs are required" });
      }
      
      const success = await storage.unblockUser(blockerId, blockedId);
      if (success) {
        res.json({ message: "User unblocked successfully" });
      } else {
        res.status(404).json({ error: "Block relationship not found" });
      }
    } catch (error) {
      console.error("Failed to unblock user:", error);
      res.status(500).json({ error: "Failed to unblock user" });
    }
  });

  // Get user online status
  app.get("/api/users/:userId/status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const status = await storage.getUserOnlineStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Failed to get user status:", error);
      res.status(500).json({ error: "Failed to get user status" });
    }
  });

  // Update user online status
  app.post("/api/users/:userId/status", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { isOnline } = req.body;
      
      await storage.updateUserOnlineStatus(userId, isOnline);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Failed to update user status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // File upload endpoint for messages
  app.post("/api/upload/message-file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // In a real implementation, you'd save to cloud storage
      // For demo, we'll create a data URL from the uploaded file
      const base64Data = req.file.buffer.toString('base64');
      const fileUrl = `data:${req.file.mimetype};base64,${base64Data}`;
      
      const fileInfo = {
        url: fileUrl,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 
              req.file.mimetype.startsWith('video/') ? 'video' : 'file'
      };
      
      res.json(fileInfo);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Default avatars based on gender
  const getDefaultAvatar = (gender: string) => {
    const avatars = {
      male: [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=male1&gender=male',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=male2&gender=male',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=male3&gender=male'
      ],
      female: [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=female1&gender=female', 
        'https://api.dicebear.com/7.x/avataaars/svg?seed=female2&gender=female',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=female3&gender=female'
      ]
    };
    
    const genderAvatars = avatars[gender.toLowerCase() as keyof typeof avatars] || avatars.male;
    return genderAvatars[Math.floor(Math.random() * genderAvatars.length)];
  };

  // Get available avatars endpoint
  app.get("/api/avatars", (req, res) => {
    const { gender } = req.query;
    const maleAvatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=John&gender=male&backgroundColor=b6e3f4&topType=ShortHairDreads01&hairColor=BrownDark',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike&gender=male&backgroundColor=c0aede&topType=ShortHairTheCaesar&hairColor=Black',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&gender=male&backgroundColor=ffd93d&topType=ShortHairShortCurly&hairColor=Brown',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=David&gender=male&backgroundColor=ffdfbf&topType=ShortHairSides&hairColor=Blonde',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=James&gender=male&backgroundColor=d1d4f9&topType=ShortHairShortFlat&hairColor=Auburn'
    ];
    
    const femaleAvatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&gender=female&backgroundColor=ffd93d&topType=LongHairStraight&hairColor=BrownDark',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia&gender=female&backgroundColor=ffdfbf&topType=LongHairCurly&hairColor=Black',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya&gender=female&backgroundColor=c0aede&topType=LongHairBigHair&hairColor=Brown',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria&gender=female&backgroundColor=b6e3f4&topType=LongHairStraight2&hairColor=Blonde',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&gender=female&backgroundColor=d1d4f9&topType=LongHairCurvy&hairColor=Auburn'
    ];
    
    if (gender === 'male') {
      res.json({ avatars: maleAvatars });
    } else if (gender === 'female') {
      res.json({ avatars: femaleAvatars });
    } else {
      res.json({ 
        male: maleAvatars,
        female: femaleAvatars 
      });
    }
  });

  // File upload endpoint for profile photos
  app.post("/api/upload/profile-photo", upload.single('photo'), async (req, res) => {
    try {
      const userId = req.body.userId;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      let profilePictureUrl;
      
      if (req.file) {
        // In a real implementation, you'd save to cloud storage
        // For demo, we'll create a data URL from the uploaded file
        const base64Data = req.file.buffer.toString('base64');
        profilePictureUrl = `data:${req.file.mimetype};base64,${base64Data}`;
      } else {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Update user with new profile picture URL
      const updatedUser = await storage.updateUser(parseInt(userId), {
        profilePicture: profilePictureUrl
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        profilePictureUrl,
        message: "Profile photo uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ error: "Failed to upload profile photo" });
    }
  });

  // Set avatar endpoint
  app.post("/api/set-avatar", async (req, res) => {
    try {
      const { userId, avatarUrl } = req.body;
      
      if (!userId || !avatarUrl) {
        return res.status(400).json({ error: "User ID and avatar URL required" });
      }
      
      const updatedUser = await storage.updateUser(parseInt(userId), {
        profilePicture: avatarUrl
      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        profilePictureUrl: avatarUrl,
        message: "Avatar updated successfully" 
      });
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ error: "Failed to set avatar" });
    }
  });

  // Verification endpoints
  app.post("/api/verification/send-code", async (req, res) => {
    try {
      const { type, userId } = req.body;
      
      if (!type || !userId || !['email', 'phone'].includes(type)) {
        return res.status(400).json({ error: "Invalid verification type or user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Update user with verification code
      const updateData = type === 'email' 
        ? { emailVerificationCode: code, emailVerificationExpiry: expiry }
        : { phoneVerificationCode: code, phoneVerificationExpiry: expiry };

      await storage.updateUser(userId, updateData);

      // In a real implementation, send email/SMS here
      const contactInfo = type === 'email' ? user.email : user.phone;
      console.log(`Verification code for ${contactInfo}: ${code}`);

      // For demo purposes, always succeed
      res.json({ 
        message: `Verification code sent to ${contactInfo}`,
        // In development, return code for testing
        ...(process.env.NODE_ENV === 'development' && { code })
      });
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  app.post("/api/verification/verify-code", async (req, res) => {
    try {
      const { type, code, userId } = req.body;
      
      if (!type || !code || !userId || !['email', 'phone'].includes(type)) {
        return res.status(400).json({ error: "Invalid verification data" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const storedCode = type === 'email' ? user.emailVerificationCode : user.phoneVerificationCode;
      const expiry = type === 'email' ? user.emailVerificationExpiry : user.phoneVerificationExpiry;

      if (!storedCode || !expiry) {
        return res.status(400).json({ error: "No verification code found" });
      }

      if (new Date() > expiry) {
        return res.status(400).json({ error: "Verification code expired" });
      }

      if (storedCode !== code) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      // Mark as verified and clear verification data
      const updateData = type === 'email' 
        ? { 
            emailVerified: true, 
            emailVerificationCode: null, 
            emailVerificationExpiry: null,
            verificationScore: user.phoneVerified ? 50 : 25
          }
        : { 
            phoneVerified: true, 
            phoneVerificationCode: null, 
            phoneVerificationExpiry: null,
            verificationScore: user.emailVerified ? 50 : 25
          };

      // Update overall verification status
      if ((type === 'email' && user.phoneVerified) || (type === 'phone' && user.emailVerified)) {
        updateData.verificationScore = user.documentVerified ? 100 : 50;
      }

      if (updateData.verificationScore && updateData.verificationScore >= 50) {
        (updateData as any).isVerified = true;
      }

      const updatedUser = await storage.updateUser(userId, updateData);

      res.json({ 
        message: `${type} verification successful`,
        verified: true,
        verificationScore: updateData.verificationScore
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.post("/api/verification/upload-document", async (req, res) => {
    try {
      // For this demo, we'll simulate document upload
      const { documentType, userId } = req.body;
      
      if (!documentType || !userId || !['cin', 'passport'].includes(documentType)) {
        return res.status(400).json({ error: "Invalid document type or user ID" });
      }

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Simulate document upload URLs
      const frontUrl = `/uploads/documents/${userId}_${documentType}_front_${Date.now()}.jpg`;
      const backUrl = documentType === 'cin' ? `/uploads/documents/${userId}_${documentType}_back_${Date.now()}.jpg` : null;

      // Update user with document info (simulating verification success)
      const updateData = {
        documentType,
        documentFrontUrl: frontUrl,
        documentBackUrl: backUrl,
        documentVerified: true, // In real implementation, this would be manual verification
        documentVerifiedAt: new Date(),
        verificationScore: (user.emailVerified ? 25 : 0) + (user.phoneVerified ? 25 : 0) + 50,
        isVerified: true // Full verification achieved
      };

      const updatedUser = await storage.updateUser(parseInt(userId), updateData);

      res.json({ 
        message: "Document uploaded successfully and verified",
        documentType,
        frontUrl,
        backUrl,
        verified: true,
        verificationScore: updateData.verificationScore
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<number, WebSocket>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'auth') {
          // Store client with user ID for targeted messaging
          const userId = data.userId;
          clients.set(userId, ws);
          console.log(`User ${userId} connected to WebSocket`);
          
          ws.send(JSON.stringify({ type: 'auth_success', userId }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client from map when disconnected
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
  });
  
  // Function to broadcast message to specific users
  const broadcastToUsers = (userIds: number[], message: any) => {
    userIds.forEach(userId => {
      const client = clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  };
  
  // Store broadcast function for use in routes
  (httpServer as any).broadcastToUsers = broadcastToUsers;
  
  return httpServer;
}
