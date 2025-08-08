import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertOfferSchema, insertContractSchema, insertNotificationSchema, insertConversationSchema, insertMessageSchema, insertReviewSchema, insertContractModificationRequestSchema, insertContractTerminationRequestSchema, contracts, users, conversations, messages, reviews, properties, offers, contractModificationRequests, contractTerminationRequests, contractVersions } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { z } from "zod";

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
      
      let whereCondition;
      let offers;
      
      if (userType === 'owner') {
        // Base condition for owner
        whereCondition = eq(offersTable.ownerId, userId);
        
        // Add status filter if provided
        if (statusFilter) {
          whereCondition = and(whereCondition, eq(offersTable.status, statusFilter));
        }

        // Owners see offers received for their properties
        offers = await db.select({
          id: offersTable.id,
          propertyId: offersTable.propertyId,
          tenantId: offersTable.tenantId,
          ownerId: offersTable.ownerId,
          startDate: offersTable.startDate,
          endDate: offersTable.endDate,
          monthlyRent: offersTable.monthlyRent,
          deposit: offersTable.deposit,
          conditions: offersTable.conditions,
          status: offersTable.status,
          createdAt: offersTable.createdAt,
          updatedAt: offersTable.updatedAt,
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
        .from(offersTable)
        .leftJoin(properties, eq(offersTable.propertyId, properties.id))
        .leftJoin(users, eq(offersTable.tenantId, users.id))
        .where(whereCondition)
        .orderBy(desc(offersTable.createdAt));
      } else {
        // Base condition for tenant
        whereCondition = eq(offersTable.tenantId, userId);
        
        // Add status filter if provided
        if (statusFilter) {
          whereCondition = and(whereCondition, eq(offersTable.status, statusFilter));
        }

        // Tenants see offers they sent
        offers = await db.select({
          id: offersTable.id,
          propertyId: offersTable.propertyId,
          tenantId: offersTable.tenantId,
          ownerId: offersTable.ownerId,
          startDate: offersTable.startDate,
          endDate: offersTable.endDate,
          monthlyRent: offersTable.monthlyRent,
          deposit: offersTable.deposit,
          conditions: offersTable.conditions,
          status: offersTable.status,
          createdAt: offersTable.createdAt,
          updatedAt: offersTable.updatedAt,
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
        .from(offersTable)
        .leftJoin(properties, eq(offersTable.propertyId, properties.id))
        .leftJoin(users, eq(offersTable.ownerId, users.id))
        .where(whereCondition)
        .orderBy(desc(offersTable.createdAt));
      }
      
      console.log(`Found ${offers.length} offers for user ${userId} (${userType}) with status: ${statusFilter || 'all'}`);
      res.json(offers);
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

      // ENFORCEMENT: Check if there's already an active contract for this property
      const existingActiveContract = await storage.getActiveContractForProperty(validatedData.propertyId);
      if (existingActiveContract) {
        return res.status(400).json({ 
          error: "Cette propriété a déjà un contrat actif. Impossible de créer un nouveau contrat tant que l'actuel n'est pas terminé ou expiré.",
          details: "Contract creation is restricted when an active contract exists"
        });
      }

      // ENFORCEMENT: Additional check for contracts that might not be expired yet
      const activeContracts = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.propertyId, validatedData.propertyId),
            eq(contracts.status, 'active')
          )
        );
      
      if (activeContracts.length > 0) {
        return res.status(400).json({
          error: "Un contrat actif existe déjà pour cette propriété. Vous devez attendre soit l'expiration naturelle du contrat, soit obtenir l'accord du locataire pour un arrêt anticipé.",
          details: "Active contract prevents new contract creation"
        });
      }
      
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

  // Contract modification request - Owner requests modification from tenant
  app.post("/api/contracts/:id/request-modification", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { requestedBy, requestedChanges, fieldsToModify, modificationReason } = req.body;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Only allow modification requests for active contracts
      if (contract.status !== 'active') {
        return res.status(400).json({ error: "Can only request modifications for active contracts" });
      }

      // Only owner can request modifications
      if (contract.ownerId !== requestedBy) {
        return res.status(403).json({ error: "Only the owner can request contract modifications" });
      }

      // Validate required fields
      if (!modificationReason || !fieldsToModify || fieldsToModify.length === 0) {
        return res.status(400).json({ error: "Modification reason and fields to modify are required" });
      }

      // Create modification request
      const [modificationRequest] = await db
        .insert(contractModificationRequests)
        .values({
          contractId,
          requestedBy,
          requestedChanges,
          fieldsToModify,
          modificationReason,
          status: 'pending'
        })
        .returning();

      // Notify tenant of modification request
      await storage.createNotification({
        userId: contract.tenantId,
        title: "Demande de modification de contrat",
        message: `Le propriétaire demande des modifications au contrat. Raison: ${modificationReason}. Champs à modifier: ${fieldsToModify.join(', ')}.`,
        type: "contract_modification_request",
        relatedId: contractId,
      });

      res.status(201).json(modificationRequest);
    } catch (error) {
      console.error("Contract modification request error:", error);
      res.status(500).json({ error: "Failed to create modification request" });
    }
  });

  // Apply contract modifications - Owner can modify contract after modification request is pending
  app.put("/api/contracts/:id/modify", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { modifications, modificationRequestId } = req.body;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Only allow modifications for active contracts
      if (contract.status !== 'active') {
        return res.status(400).json({ error: "Can only modify active contracts" });
      }

      // Update contract data with modifications
      const updatedContractData = { ...(contract.contractData || {}) };
      
      // Apply field modifications
      if (modifications.tenant_name) updatedContractData.tenantName = modifications.tenant_name;
      if (modifications.tenant_address) updatedContractData.propertyAddress = modifications.tenant_address;
      if (modifications.monthly_rent) updatedContractData.monthlyRent = modifications.monthly_rent;
      if (modifications.deposit) updatedContractData.deposit = modifications.deposit;
      if (modifications.special_conditions) updatedContractData.specialConditions = modifications.special_conditions;
      if (modifications.payment_terms) updatedContractData.paymentDueDate = modifications.payment_terms;
      if (modifications.start_date) updatedContractData.startDate = modifications.start_date;
      if (modifications.end_date) updatedContractData.endDate = modifications.end_date;

      // Update contract in database
      const [updatedContract] = await db
        .update(contracts)
        .set({
          contractData: updatedContractData,
          status: 'modified', // Set status to modified to indicate changes
          updatedAt: new Date()
        })
        .where(eq(contracts.id, contractId))
        .returning();

      // Mark modification request as completed if provided
      if (modificationRequestId) {
        await db
          .update(contractModificationRequests)
          .set({
            status: 'completed',
            respondedAt: new Date()
          })
          .where(eq(contractModificationRequests.id, modificationRequestId));
      }

      // Notify tenant of completed modification
      await storage.createNotification({
        userId: contract.tenantId,
        title: "Contrat modifié",
        message: "Le propriétaire a appliqué les modifications demandées au contrat.",
        type: "contract_modified",
        relatedId: contractId,
      });

      res.json(updatedContract);
    } catch (error) {
      console.error("Contract modification error:", error);
      res.status(500).json({ error: "Failed to modify contract" });
    }
  });

  // Get individual contract modification request
  app.get("/api/contract-modification-requests/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      
      const [request] = await db
        .select()
        .from(contractModificationRequests)
        .where(eq(contractModificationRequests.id, requestId));
        
      if (!request) {
        return res.status(404).json({ error: "Modification request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Get modification request error:", error);
      res.status(500).json({ error: "Failed to fetch modification request" });
    }
  });

  // Respond to contract modification request - Tenant responds
  app.put("/api/contract-modification-requests/:id/respond", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { response, tenantResponse, userId } = req.body; // response: 'accepted' | 'rejected'
      
      const [request] = await db
        .select()
        .from(contractModificationRequests)
        .where(eq(contractModificationRequests.id, requestId));
        
      if (!request) {
        return res.status(404).json({ error: "Modification request not found" });
      }

      const contract = await storage.getContract(request.contractId);
      if (!contract || contract.tenantId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update request status
      const [updatedRequest] = await db
        .update(contractModificationRequests)
        .set({
          status: response,
          tenantResponse,
          respondedAt: new Date()
        })
        .where(eq(contractModificationRequests.id, requestId))
        .returning();

      if (response === 'accepted') {
        // Set modification deadline to 24 hours from now
        const modificationDeadline = new Date();
        modificationDeadline.setHours(modificationDeadline.getHours() + 24);

        // Update modification request with deadline
        await db
          .update(contractModificationRequests)
          .set({ modificationDeadline })
          .where(eq(contractModificationRequests.id, requestId));

        // Update contract status to waiting for modification
        await db
          .update(contracts)
          .set({ 
            status: 'waiting_for_modification',
            modificationSummary: `En attente de modification - Échéance: ${modificationDeadline.toLocaleString('fr-FR')}`,
            updatedAt: new Date()
          })
          .where(eq(contracts.id, request.contractId));

        // Notify owner that they can now modify the contract
        await storage.createNotification({
          userId: contract.ownerId,
          title: "Modification acceptée - 24h pour modifier",
          message: `Le locataire a accepté votre demande de modification. Vous avez 24 heures pour modifier le contrat (jusqu'au ${modificationDeadline.toLocaleString('fr-FR')}).`,
          type: "contract_modification_accepted",
          relatedId: request.contractId,
        });
      } else {
        // Notify owner of rejection
        await storage.createNotification({
          userId: contract.ownerId,
          title: "Modification refusée",
          message: "Le locataire a refusé votre demande de modification. Le contrat reste inchangé.",
          type: "contract_modification_rejected",
          relatedId: request.contractId,
        });
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Contract modification response error:", error);
      res.status(500).json({ error: "Failed to respond to modification request" });
    }
  });

  // Contract early termination request - Owner requests early termination
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

  // Modify contract by owner (within 24h deadline)
  app.put("/api/contracts/:id/modify", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { contractData, userId, modificationReason } = req.body;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Only owner can modify contracts
      if (contract.ownerId !== userId) {
        return res.status(403).json({ error: "Only the owner can modify contracts" });
      }

      // Check if contract is in waiting_for_modification status
      if (contract.status !== 'waiting_for_modification') {
        return res.status(400).json({ error: "Contract is not in modification state" });
      }

      // Check if modification deadline has passed
      const [modRequest] = await db
        .select()
        .from(contractModificationRequests)
        .where(eq(contractModificationRequests.contractId, contractId))
        .orderBy(desc(contractModificationRequests.id))
        .limit(1);

      if (modRequest?.modificationDeadline && new Date() > modRequest.modificationDeadline) {
        return res.status(400).json({ error: "Modification deadline has passed" });
      }

      // Create new contract version
      const currentVersion = await db
        .select({ version: contractVersions.version })
        .from(contractVersions)
        .where(eq(contractVersions.contractId, contractId))
        .orderBy(desc(contractVersions.version))
        .limit(1);

      const newVersion = (currentVersion[0]?.version || 0) + 1;

      // Save current contract data as previous version
      await db
        .insert(contractVersions)
        .values({
          contractId,
          version: newVersion - 1,
          contractData: contract.contractData,
          ownerSignature: contract.ownerSignature,
          tenantSignature: contract.tenantSignature,
          ownerSignedAt: contract.ownerSignedAt,
          tenantSignedAt: contract.tenantSignedAt,
          status: 'superseded',
          modificationReason: 'Original version before modification'
        });

      // Update main contract with new data and reset signatures
      await db
        .update(contracts)
        .set({
          contractData,
          ownerSignature: null,
          tenantSignature: null,
          ownerSignedAt: null,
          tenantSignedAt: null,
          status: 'draft',
          modificationSummary: `Contrat modifié (Version ${newVersion}) - ${modificationReason || 'Modifications apportées'}`,
          updatedAt: new Date()
        })
        .where(eq(contracts.id, contractId));

      // Notify tenant of contract modification
      await storage.createNotification({
        userId: contract.tenantId,
        title: "Contrat modifié - Signature requise",
        message: `Le propriétaire a modifié le contrat. Veuillez examiner et signer la nouvelle version.`,
        type: "contract_modified",
        relatedId: contractId,
      });

      res.json({ success: true, newVersion });
    } catch (error) {
      console.error("Contract modification error:", error);
      res.status(500).json({ error: "Failed to modify contract" });
    }
  });

  // Get contract versions for a specific contract
  app.get("/api/contracts/:id/versions", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      const versions = await db
        .select()
        .from(contractVersions)
        .where(eq(contractVersions.contractId, contractId))
        .orderBy(desc(contractVersions.version));
        
      res.json(versions);
    } catch (error) {
      console.error("Get contract versions error:", error);
      res.status(500).json({ error: "Failed to fetch contract versions" });
    }
  });

  // Respond to contract termination request - Tenant responds
  app.put("/api/contract-termination-requests/:id/respond", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { response, tenantResponse, userId } = req.body; // response: 'accepted' | 'rejected'
      
      const [request] = await db
        .select()
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.id, requestId));
        
      if (!request) {
        return res.status(404).json({ error: "Termination request not found" });
      }

      const contract = await storage.getContract(request.contractId);
      if (!contract || contract.tenantId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Update request status
      const [updatedRequest] = await db
        .update(contractTerminationRequests)
        .set({
          status: response,
          tenantResponse,
          respondedAt: new Date()
        })
        .where(eq(contractTerminationRequests.id, requestId))
        .returning();

      if (response === 'accepted') {
        // Terminate contract immediately and make property available
        await db
          .update(contracts)
          .set({ 
            status: 'terminated',
            terminationReason: request.reason || 'Early termination accepted by tenant',
            terminatedBy: contract.ownerId,
            terminatedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(contracts.id, request.contractId));

        // Update property status to available
        await storage.updatePropertyStatus(contract.propertyId, 'Disponible');

        // Notify owner that termination was accepted
        await storage.createNotification({
          userId: contract.ownerId,
          title: "Arrêt anticipé accepté",
          message: "Le locataire a accepté l'arrêt anticipé du contrat. La propriété est maintenant disponible.",
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

  // Get pending requests for a contract
  app.get("/api/contracts/:id/pending-requests", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      // Get modification requests
      const modificationRequests = await db
        .select({
          id: contractModificationRequests.id,
          type: sql<string>`'modification'`,
          status: contractModificationRequests.status,
          createdAt: contractModificationRequests.createdAt,
          modificationDeadline: contractModificationRequests.modificationDeadline,
          fieldsToModify: contractModificationRequests.fieldsToModify,
        })
        .from(contractModificationRequests)
        .where(eq(contractModificationRequests.contractId, contractId));

      // Get termination requests
      const terminationRequests = await db
        .select({
          id: contractTerminationRequests.id,
          type: sql<string>`'termination'`,
          status: contractTerminationRequests.status,
          createdAt: contractTerminationRequests.createdAt,
        })
        .from(contractTerminationRequests)
        .where(eq(contractTerminationRequests.contractId, contractId));

      const allRequests = [...modificationRequests, ...terminationRequests];
      res.json(allRequests);
    } catch (error) {
      console.error("Failed to fetch pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  // Get specific modification request
  app.get("/api/contract-modification-requests/:id", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const [request] = await db
        .select()
        .from(contractModificationRequests)
        .where(eq(contractModificationRequests.id, requestId));
        
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Failed to fetch modification request:", error);
      res.status(500).json({ error: "Failed to fetch modification request" });
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

      // Get modification requests for all user contracts
      const modificationRequests = await db
        .select({
          id: contractModificationRequests.id,
          type: sql<string>`'modification'`,
          status: contractModificationRequests.status,
          createdAt: contractModificationRequests.createdAt,
          contractId: contractModificationRequests.contractId,
        })
        .from(contractModificationRequests)
        .where(inArray(contractModificationRequests.contractId, contractIds));

      // Get termination requests for all user contracts
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

      console.log(`Found ${modificationRequests.length} modification requests and ${terminationRequests.length} termination requests for user ${userId}`);
      console.log("Modification requests:", modificationRequests);
      console.log("Termination requests:", terminationRequests);

      const allRequests = [...modificationRequests, ...terminationRequests];
      res.json(allRequests);
    } catch (error) {
      console.error("Failed to fetch tenant requests:", error);
      res.status(500).json({ error: "Failed to fetch tenant requests" });
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
      
      // In real implementation, you'd verify password hash here
      // For testing, we'll check if the password matches what's stored in the database
      if (password !== user.password) {
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
      
      // Create user
      const newUser = await storage.createUser({
        username,
        password, // In production, hash this password
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

  // Get modification requests for a user (owner or tenant)
  app.get("/api/modification-requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const userType = req.query.userType as string;
      
      if (userType === 'owner') {
        // Owner sees their sent modification requests
        const requests = await db
          .select({
            id: contractModificationRequests.id,
            contractId: contractModificationRequests.contractId,
            requestedChanges: contractModificationRequests.requestedChanges,
            fieldsToModify: contractModificationRequests.fieldsToModify,
            modificationReason: contractModificationRequests.modificationReason,
            status: contractModificationRequests.status,
            tenantResponse: contractModificationRequests.tenantResponse,
            respondedAt: contractModificationRequests.respondedAt,
            createdAt: contractModificationRequests.createdAt,
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
          .from(contractModificationRequests)
          .leftJoin(contracts, eq(contractModificationRequests.contractId, contracts.id))
          .leftJoin(properties, eq(contracts.propertyId, properties.id))
          .leftJoin(users, eq(contracts.tenantId, users.id))
          .where(eq(contractModificationRequests.requestedBy, userId))
          .orderBy(desc(contractModificationRequests.createdAt));
        
        res.json(requests);
      } else {
        // Tenant sees modification requests received for their contracts
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
            id: contractModificationRequests.id,
            contractId: contractModificationRequests.contractId,
            requestedChanges: contractModificationRequests.requestedChanges,
            fieldsToModify: contractModificationRequests.fieldsToModify,
            modificationReason: contractModificationRequests.modificationReason,
            status: contractModificationRequests.status,
            tenantResponse: contractModificationRequests.tenantResponse,
            respondedAt: contractModificationRequests.respondedAt,
            createdAt: contractModificationRequests.createdAt,
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
          .from(contractModificationRequests)
          .leftJoin(contracts, eq(contractModificationRequests.contractId, contracts.id))
          .leftJoin(properties, eq(contracts.propertyId, properties.id))
          .leftJoin(users, eq(contractModificationRequests.requestedBy, users.id))
          .where(inArray(contractModificationRequests.contractId, contractIds))
          .orderBy(desc(contractModificationRequests.createdAt));
        
        res.json(requests);
      }
    } catch (error) {
      console.error("Get modification requests error:", error);
      res.status(500).json({ error: "Failed to fetch modification requests" });
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

  // Get contract versions (history) for a contract
  app.get("/api/contracts/:id/versions", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      
      const versions = await db
        .select()
        .from(contractVersions)
        .where(eq(contractVersions.contractId, contractId))
        .orderBy(desc(contractVersions.version));
      
      res.json(versions);
    } catch (error) {
      console.error("Get contract versions error:", error);
      res.status(500).json({ error: "Failed to fetch contract versions" });
    }
  });

  // Complete contract modification - Owner modifies and signs, creates new version
  app.post("/api/contracts/:id/complete-modification", async (req, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const { modificationRequestId, modifiedContractData, ownerSignature, userId } = req.body;
      
      const contract = await storage.getContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }

      // Only owner can complete modifications
      if (contract.ownerId !== userId) {
        return res.status(403).json({ error: "Only the owner can complete contract modifications" });
      }

      // Verify modification request exists and is accepted
      const [modificationRequest] = await db
        .select()
        .from(contractModificationRequests)
        .where(eq(contractModificationRequests.id, modificationRequestId));

      if (!modificationRequest || modificationRequest.status !== 'accepted') {
        return res.status(400).json({ error: "Valid accepted modification request required" });
      }

      // Get current version number
      const existingVersions = await db
        .select()
        .from(contractVersions)
        .where(eq(contractVersions.contractId, contractId))
        .orderBy(desc(contractVersions.version));

      const newVersion = existingVersions.length > 0 ? existingVersions[0].version + 1 : 1;

      // Create new contract version
      const [newContractVersion] = await db
        .insert(contractVersions)
        .values({
          contractId,
          version: newVersion,
          contractData: modifiedContractData,
          ownerSignature,
          ownerSignedAt: new Date(),
          status: 'owner_signed',
          modificationReason: modificationRequest.modificationReason,
        })
        .returning();

      // Update main contract with modified data and status
      await db
        .update(contracts)
        .set({
          contractData: modifiedContractData,
          ownerSignature,
          ownerSignedAt: new Date(),
          tenantSignature: null, // Reset tenant signature
          tenantSignedAt: null,
          status: 'modification_in_progress',
          modificationSummary: `Version ${newVersion} - ${modificationRequest.modificationReason}`,
          updatedAt: new Date()
        })
        .where(eq(contracts.id, contractId));

      // Update modification request status
      await db
        .update(contractModificationRequests)
        .set({ status: 'modification_in_progress' })
        .where(eq(contractModificationRequests.id, modificationRequestId));

      // Notify tenant to sign the modified contract
      await storage.createNotification({
        userId: contract.tenantId,
        title: "Contrat modifié - Signature requise",
        message: `Le propriétaire a modifié le contrat (Version ${newVersion}). Veuillez examiner et signer la nouvelle version.`,
        type: "contract_modification_ready",
        relatedId: contractId,
      });

      res.status(201).json(newContractVersion);
    } catch (error) {
      console.error("Complete contract modification error:", error);
      res.status(500).json({ error: "Failed to complete contract modification" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
