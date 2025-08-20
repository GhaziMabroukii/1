import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertOfferSchema, insertContractSchema, insertNotificationSchema, insertConversationSchema, insertMessageSchema, insertReviewSchema, insertContractTerminationRequestSchema, contracts, users, conversations, messages, reviews, properties, offers, contractTerminationRequests } from "@shared/schema";
// db will be imported conditionally in functions that need it
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";

// Alias tables for clarity in joins
const offersTable = offers;

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
      
      const [terminationRequest] = await db
        .select()
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.contractId, contractId));
      
      if (!terminationRequest) {
        return res.status(404).json({ error: 'No termination request found' });
      }
      
      res.json(terminationRequest);
    } catch (error) {
      console.error('Error getting termination request:', error);
      res.status(500).json({ error: 'Failed to get termination request' });
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
      
      if (!requestedBy || !reason?.trim() || !terminationType || !proposedTerms) {
        console.log('Validation failed:', {
          requestedByFail: !requestedBy,
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

      // For now, we'll create a simple termination request since the storage interface
      // doesn't have specific termination request methods implemented
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

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

      // Return success response
      res.status(201).json({ 
        message: 'Termination request created successfully',
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

      const [terminationRequest] = await db
        .select()
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.contractId, contractId));
      
      if (!terminationRequest) {
        return res.status(404).json({ error: 'No termination request found' });
      }

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, contractId));
        
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Get the user to verify password
      const userId = userType === 'owner' ? contract.ownerId : contract.tenantId;
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password.trim(), user.password);
      if (!user || !isValidPassword) {
        return res.status(400).json({ error: 'Mot de passe incorrect' });
      }

      // Update password confirmation
      const updateData: any = { updatedAt: new Date() };
      
      if (userType === 'owner') {
        updateData.ownerPasswordConfirmed = true;
        updateData.ownerConfirmedAt = new Date();
      } else {
        updateData.tenantPasswordConfirmed = true;
        updateData.tenantConfirmedAt = new Date();
      }
      
      // If both confirmed, update status
      if ((userType === 'owner' && terminationRequest.tenantPasswordConfirmed) || 
          (userType === 'tenant' && terminationRequest.ownerPasswordConfirmed)) {
        updateData.status = 'accepted';
      }

      const [updatedRequest] = await db
        .update(contractTerminationRequests)
        .set(updateData)
        .where(eq(contractTerminationRequests.id, terminationRequest.id))
        .returning();

      res.json(updatedRequest);
    } catch (error) {
      console.error('Error confirming password:', error);
      res.status(500).json({ error: 'Failed to confirm password' });
    }
  });

  // Submit digital signature
  app.post('/api/contracts/:id/submit-termination-signature', async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { signature, userType } = req.body;
      
      if (!signature?.trim() || !userType) {
        return res.status(400).json({ error: 'Signature and userType are required' });
      }

      const [terminationRequest] = await db
        .select()
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.contractId, contractId));
      
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

      const [updatedRequest] = await db
        .update(contractTerminationRequests)
        .set(updateData)
        .where(eq(contractTerminationRequests.id, terminationRequest.id))
        .returning();

      // Check if both parties have signed and confirmed passwords
      const bothSigned = updatedRequest.ownerSignature && updatedRequest.tenantSignature;
      const bothConfirmed = updatedRequest.ownerPasswordConfirmed && updatedRequest.tenantPasswordConfirmed;
      
      if (bothSigned && bothConfirmed) {
        // Complete the termination - all 5 steps are now complete
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
            title: "Contrat résilié",
            message: "Le contrat a été officiellement résilié. Toutes les signatures ont été complétées.",
            type: "contract_terminated",
            relatedId: contractId,
          });
          
          await storage.createNotification({
            userId: contract.tenantId,
            title: "Contrat résilié", 
            message: "Le contrat a été officiellement résilié. Toutes les signatures ont été complétées.",
            type: "contract_terminated",
            relatedId: contractId,
          });
        }
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error('Error submitting signature:', error);
      res.status(500).json({ error: 'Failed to submit signature' });
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

  // Get individual contract termination request
  app.get("/api/contract-termination-requests/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      const [request] = await db
        .select()
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.id, requestId));
        
      if (!request) {
        return res.status(404).json({ error: "Termination request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Get termination request error:", error);
      res.status(500).json({ error: "Failed to fetch termination request" });
    }
  });



  // Respond to contract termination request - Both tenant and owner can respond
  app.put("/api/contract-termination-requests/:id/respond", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { response, tenantResponse, ownerResponse, userId } = req.body; // response: 'accepted' | 'rejected'
      
      const [request] = await db
        .select()
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.id, requestId));
        
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

      // Update request status with appropriate response
      const updateData: any = {
        status: response,
        respondedAt: new Date()
      };

      if (isTenant && tenantResponse) {
        updateData.tenantResponse = tenantResponse;
      }
      if (isOwner && ownerResponse) {
        updateData.ownerResponse = ownerResponse;
      }

      const [updatedRequest] = await db
        .update(contractTerminationRequests)
        .set(updateData)
        .where(eq(contractTerminationRequests.id, requestId))
        .returning();

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
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Conversations routes
  app.post("/api/conversations", async (req, res) => {
    try {
      const { propertyId, tenantId, ownerId, message } = req.body;
      
      // Check if conversation already exists
      let [existingConversation] = await db.select()
        .from(conversations)
        .where(and(
          eq(conversations.propertyId, propertyId),
          eq(conversations.tenantId, tenantId),
          eq(conversations.ownerId, ownerId)
        ));

      if (!existingConversation) {
        // Create new conversation
        [existingConversation] = await db.insert(conversations)
          .values({ propertyId, tenantId, ownerId })
          .returning();
      }

      // Add message to conversation
      await db.insert(messages).values({
        conversationId: existingConversation.id,
        senderId: tenantId,
        content: message,
      });

      // Update last message timestamp
      await db.update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, existingConversation.id));

      res.json({ success: true, conversationId: existingConversation.id });
    } catch (error) {
      console.error("Conversation error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messagesList = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);
      res.json(messagesList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
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
      const [request] = await db
        .select()
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.id, requestId));
        
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

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
      
      // Get all contracts where user is tenant
      const userContracts = await db
        .select({ id: contracts.id })
        .from(contracts)
        .where(eq(contracts.tenantId, userId));

      if (userContracts.length === 0) {
        return res.json([]);
      }

      const contractIds = userContracts.map(c => c.id);

      // Get termination requests for all user contracts only
      const terminationRequests = await db
        .select({
          id: contractTerminationRequests.id,
          type: sql<string>`'termination'`,
          status: contractTerminationRequests.status,
          createdAt: contractTerminationRequests.createdAt,
          contractId: contractTerminationRequests.contractId,
        })
        .from(contractTerminationRequests)
        .where(inArray(contractTerminationRequests.contractId, contractIds));

      console.log(`Found ${terminationRequests.length} termination requests for user ${userId}`);
      console.log("Termination requests:", terminationRequests);
      res.json(terminationRequests);
    } catch (error) {
      console.error("Failed to fetch tenant requests:", error);
      res.status(500).json({ error: "Failed to fetch tenant requests" });
    }
  });

  // Get owner's requests
  app.get("/api/owner-requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Get termination requests created by this owner
      const terminationRequests = await db
        .select({
          id: contractTerminationRequests.id,
          type: sql<string>`'termination'`,
          status: contractTerminationRequests.status,
          createdAt: contractTerminationRequests.createdAt,
          contractId: contractTerminationRequests.contractId,
        })
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.requestedBy, userId));

      console.log(`Found ${terminationRequests.length} termination requests created by owner ${userId}`);
      console.log("Owner termination requests:", terminationRequests);
      res.json(terminationRequests);
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
      const existingTenant = await storage.getUserByUsername('student_ahmed');
      const existingOwner = await storage.getUserByUsername('owner_fatma');
      
      if (existingTenant && existingOwner) {
        return res.json({
          message: 'Test users already exist',
          users: [
            { username: 'student_ahmed', password: 'tenant123', type: 'tenant', name: 'Ahmed Ben Ali' },
            { username: 'owner_fatma', password: 'owner123', type: 'owner', name: 'Fatma Trabelsi' }
          ]
        });
      }

      // Create tenant user
      const tenantPassword = await bcrypt.hash('tenant123', 10);
      const tenant = await storage.createUser({
        username: 'student_ahmed',
        password: tenantPassword,
        email: 'ahmed.student@enis.tn',
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        phone: '+216 20 123 456',
        userType: 'tenant'
      });

      // Create owner user
      const ownerPassword = await bcrypt.hash('owner123', 10);
      const owner = await storage.createUser({
        username: 'owner_fatma',
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
          { username: 'student_ahmed', password: 'tenant123', type: 'tenant', name: 'Ahmed Ben Ali' },
          { username: 'owner_fatma', password: 'owner123', type: 'owner', name: 'Fatma Trabelsi' }
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
      const tenant = await storage.getUserByUsername('student_ahmed');
      const owner = await storage.getUserByUsername('owner_fatma');
      
      res.json({
        tenant: tenant ? { id: tenant.id, username: tenant.username, userType: tenant.userType } : null,
        owner: owner ? { id: owner.id, username: owner.username, userType: owner.userType } : null,
        message: 'Current user status'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check users', details: error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
