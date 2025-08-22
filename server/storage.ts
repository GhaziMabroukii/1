import { 
  users, properties, offers, contracts, notifications,
  type User, type InsertUser, type Property, type InsertProperty,
  type Offer, type InsertOffer, type Contract, type InsertContract,
  type Notification, type InsertNotification 
} from "@shared/schema";
// Database is only available in production
let db: any = null;
import { eq, desc, and, lt, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Property operations
  getProperties(ownerId?: number): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Offer operations
  getOffers(): Promise<Offer[]>;
  getOffer(id: number): Promise<Offer | undefined>;
  getOffersByTenantAndProperty(tenantId: number, propertyId: number): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOfferStatus(id: number, status: string): Promise<Offer | undefined>;
  
  // Contract operations
  getContracts(userId: number): Promise<Contract[]>;
  getOwnerContracts(ownerId: number): Promise<Contract[]>;
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, updates: Partial<InsertContract>): Promise<Contract | undefined>;
  updateContractSignature(id: number, signatureType: 'owner' | 'tenant', signatureData: string): Promise<Contract | undefined>;
  updateContractDeadline(id: number, deadline: Date): Promise<void>;
  updateContractStatus(id: number, status: string): Promise<void>;
  getActiveContractForProperty(propertyId: number): Promise<Contract | undefined>;
  updatePropertyStatus(propertyId: number, status: string): Promise<void>;
  expireContracts(): Promise<void>;
  
  // Termination request operations
  createTerminationRequest(request: any): Promise<any>;
  getTerminationRequestsByUser(userId: number, userType: string): Promise<any[]>;
  getTerminationRequestsByTenant(userId: number): Promise<any[]>;
  getTerminationRequestsByOwner(userId: number): Promise<any[]>;
  getTerminationRequest(id: number): Promise<any | undefined>;
  updateTerminationRequestStatus(id: number, status: string): Promise<any | undefined>;
  updateContractTerminationRequest(id: number, updates: Partial<any>): Promise<any | undefined>;
  getContractTerminationRequests(contractId: number): Promise<any[]>;
  getContractById(contractId: number): Promise<any | undefined>;
  getUserById(userId: number): Promise<any | undefined>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<boolean>;
  
  // Conversation and messaging operations
  getConversations(userId: number): Promise<any[]>;
  getConversation(id: number): Promise<any | undefined>;
  createConversation(conversation: any): Promise<any>;
  getConversationMessages(conversationId: number): Promise<any[]>;
  createMessage(message: any): Promise<any>;
  markMessageAsRead(messageId: number): Promise<boolean>;
  getOrCreateConversation(propertyId: number, tenantId: number, ownerId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  // Property operations
  async getProperties(ownerId?: number): Promise<Property[]> {
    if (ownerId) {
      return await db.select().from(properties).where(eq(properties.ownerId, ownerId));
    }
    return await db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db
      .insert(properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const [updated] = await db
      .update(properties)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Offer operations
  async getOffers(userId: number, type: 'sent' | 'received'): Promise<Offer[]> {
    const field = type === 'sent' ? offers.tenantId : offers.ownerId;
    return await db.select().from(offers)
      .where(eq(field, userId))
      .orderBy(desc(offers.createdAt));
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    const [offer] = await db.select().from(offers).where(eq(offers.id, id));
    return offer || undefined;
  }

  async getOffersByTenantAndProperty(tenantId: number, propertyId: number): Promise<Offer[]> {
    return await db.select()
      .from(offers)
      .where(and(eq(offers.tenantId, tenantId), eq(offers.propertyId, propertyId)));
  }

  async createOffer(offer: InsertOffer): Promise<Offer> {
    const [newOffer] = await db
      .insert(offers)
      .values(offer)
      .returning();
    return newOffer;
  }

  async updateOfferStatus(id: number, status: string): Promise<Offer | undefined> {
    const [updated] = await db
      .update(offers)
      .set({ status, updatedAt: new Date() })
      .where(eq(offers.id, id))
      .returning();
    return updated || undefined;
  }

  // Contract operations
  async getContracts(userId: number): Promise<Contract[]> {
    return await db.select().from(contracts)
      .where(or(eq(contracts.ownerId, userId), eq(contracts.tenantId, userId)))
      .orderBy(desc(contracts.createdAt));
  }

  async getOwnerContracts(ownerId: number): Promise<Contract[]> {
    return await db.select().from(contracts)
      .where(eq(contracts.ownerId, ownerId))
      .orderBy(desc(contracts.createdAt));
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db
      .insert(contracts)
      .values(contract)
      .returning();
    return newContract;
  }

  async updateContract(id: number, updates: Partial<InsertContract>): Promise<Contract | undefined> {
    const [updated] = await db
      .update(contracts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return updated || undefined;
  }

  async updateContractSignature(id: number, signatureType: 'owner' | 'tenant', signatureData: string): Promise<Contract | undefined> {
    const updateData = signatureType === 'owner' ? 
      { ownerSignature: signatureData, ownerSignedAt: new Date(), status: 'owner_signed' } :
      { tenantSignature: signatureData, tenantSignedAt: new Date(), status: 'fully_signed' };

    const [updated] = await db
      .update(contracts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return updated || undefined;
  }

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Additional contract methods
  async updateContractDeadline(id: number, deadline: Date): Promise<void> {
    await db
      .update(contracts)
      .set({ tenantSignDeadline: deadline, updatedAt: new Date() })
      .where(eq(contracts.id, id));
  }

  async updateContractStatus(id: number, status: string): Promise<void> {
    await db
      .update(contracts)
      .set({ status, updatedAt: new Date() })
      .where(eq(contracts.id, id));
  }

  async getActiveContractForProperty(propertyId: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts)
      .where(and(
        eq(contracts.propertyId, propertyId),
        eq(contracts.status, 'active')
      ));
    return contract || undefined;
  }

  async updatePropertyStatus(propertyId: number, status: string): Promise<void> {
    await db
      .update(properties)
      .set({ status, updatedAt: new Date() })
      .where(eq(properties.id, propertyId));
  }

  async expireContracts(): Promise<void> {
    // Find contracts that are past deadline and still waiting for tenant signature
    const expiredContracts = await db.select().from(contracts)
      .where(and(
        eq(contracts.status, 'owner_signed'),
        lt(contracts.tenantSignDeadline, new Date())
      ));

    for (const contract of expiredContracts) {
      // Update contract status to expired
      await this.updateContractStatus(contract.id, 'expired');
      
      // Reset property status back to available
      await this.updatePropertyStatus(contract.propertyId, 'Disponible');
      
      // Notify both parties
      await this.createNotification({
        userId: contract.ownerId,
        title: "Contrat expiré",
        message: "Le contrat a expiré car le locataire n'a pas signé dans les délais.",
        type: "contract_expired",
        relatedId: contract.id,
      });

      await this.createNotification({
        userId: contract.tenantId,
        title: "Contrat expiré",
        message: "Vous avez dépassé le délai de signature. Le contrat a expiré.",
        type: "contract_expired",
        relatedId: contract.id,
      });
    }
  }

  // Termination request operations (database implementation)
  async createTerminationRequest(request: any): Promise<any> {
    // For now return a mock object since we don't have database setup
    return { id: Math.floor(Math.random() * 1000), ...request };
  }

  async getTerminationRequestsByUser(userId: number, userType: string): Promise<any[]> {
    // For now return empty array since we don't have database setup
    return [];
  }

  async getTerminationRequestsByTenant(userId: number): Promise<any[]> {
    // For now return empty array since we don't have database setup
    return [];
  }

  async getTerminationRequestsByOwner(userId: number): Promise<any[]> {
    // For now return empty array since we don't have database setup
    return [];
  }

  async getTerminationRequest(id: number): Promise<any | undefined> {
    // For now return undefined since we don't have database setup
    return undefined;
  }

  async updateTerminationRequestStatus(id: number, status: string): Promise<any | undefined> {
    // For now return undefined since we don't have database setup
    return undefined;
  }
}

// In-memory storage implementation for development
export class MemStorage implements IStorage {
  private users: User[] = [];
  private properties: Property[] = [];
  private offers: Offer[] = [];
  private contracts: Contract[] = [];
  private notifications: Notification[] = [];
  private terminationRequests: any[] = [];
  private conversations: any[] = [];
  private messages: any[] = [];
  private nextId = 1;

  private getNextId() {
    return this.nextId++;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.getNextId(),
      ...insertUser,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.users[index];
  }

  // Property operations
  async getProperties(ownerId?: number): Promise<Property[]> {
    if (ownerId) {
      return this.properties.filter(p => p.ownerId === ownerId);
    }
    return [...this.properties].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.find(p => p.id === id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const property: Property = {
      id: this.getNextId(),
      ...insertProperty,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.properties.push(property);
    return property;
  }

  async updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const index = this.properties.findIndex(p => p.id === id);
    if (index === -1) return undefined;
    
    this.properties[index] = {
      ...this.properties[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.properties[index];
  }

  async deleteProperty(id: number): Promise<boolean> {
    const index = this.properties.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.properties.splice(index, 1);
    return true;
  }

  // Offer operations
  async getOffers(): Promise<Offer[]> {
    return [...this.offers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOffer(id: number): Promise<Offer | undefined> {
    return this.offers.find(offer => offer.id === id);
  }

  async getOffersByTenantAndProperty(tenantId: number, propertyId: number): Promise<Offer[]> {
    return this.offers.filter(offer => 
      offer.tenantId === tenantId && offer.propertyId === propertyId
    );
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const offer: Offer = {
      id: this.getNextId(),
      ...insertOffer,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.offers.push(offer);
    return offer;
  }

  async updateOfferStatus(id: number, status: string): Promise<Offer | undefined> {
    const index = this.offers.findIndex(offer => offer.id === id);
    if (index === -1) return undefined;
    
    this.offers[index] = {
      ...this.offers[index],
      status,
      updatedAt: new Date()
    };
    return this.offers[index];
  }

  // Contract operations
  async getContracts(userId: number): Promise<Contract[]> {
    return this.contracts
      .filter(contract => contract.ownerId === userId || contract.tenantId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOwnerContracts(ownerId: number): Promise<Contract[]> {
    return this.contracts
      .filter(contract => contract.ownerId === ownerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.find(contract => contract.id === id);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const contract: Contract = {
      id: this.getNextId(),
      ...insertContract,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.contracts.push(contract);
    return contract;
  }

  async updateContract(id: number, updates: Partial<InsertContract>): Promise<Contract | undefined> {
    const index = this.contracts.findIndex(contract => contract.id === id);
    if (index === -1) return undefined;
    
    this.contracts[index] = {
      ...this.contracts[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.contracts[index];
  }

  async updateContractSignature(id: number, signatureType: 'owner' | 'tenant', signatureData: string): Promise<Contract | undefined> {
    const index = this.contracts.findIndex(contract => contract.id === id);
    if (index === -1) return undefined;
    
    const updateData = signatureType === 'owner' ? 
      { ownerSignature: signatureData, ownerSignedAt: new Date(), status: 'owner_signed' } :
      { tenantSignature: signatureData, tenantSignedAt: new Date(), status: 'fully_signed' };
    
    this.contracts[index] = {
      ...this.contracts[index],
      ...updateData,
      updatedAt: new Date()
    };
    return this.contracts[index];
  }

  async updateContractDeadline(id: number, deadline: Date): Promise<void> {
    const index = this.contracts.findIndex(contract => contract.id === id);
    if (index !== -1) {
      this.contracts[index] = {
        ...this.contracts[index],
        tenantSignDeadline: deadline,
        updatedAt: new Date()
      };
    }
  }

  async updateContractStatus(id: number, status: string): Promise<void> {
    const index = this.contracts.findIndex(contract => contract.id === id);
    if (index !== -1) {
      this.contracts[index] = {
        ...this.contracts[index],
        status,
        updatedAt: new Date()
      };
    }
  }

  async getActiveContractForProperty(propertyId: number): Promise<Contract | undefined> {
    return this.contracts.find(contract => 
      contract.propertyId === propertyId && contract.status === 'active'
    );
  }

  async updatePropertyStatus(propertyId: number, status: string): Promise<void> {
    const index = this.properties.findIndex(property => property.id === propertyId);
    if (index !== -1) {
      this.properties[index] = {
        ...this.properties[index],
        status,
        updatedAt: new Date()
      };
    }
  }

  async expireContracts(): Promise<void> {
    const now = new Date();
    const expiredContracts = this.contracts.filter(contract => 
      contract.status === 'owner_signed' && 
      contract.tenantSignDeadline && 
      contract.tenantSignDeadline < now
    );

    for (const contract of expiredContracts) {
      await this.updateContractStatus(contract.id, 'expired');
      await this.updatePropertyStatus(contract.propertyId, 'Disponible');
      
      // Create notifications
      await this.createNotification({
        userId: contract.ownerId,
        title: "Contrat expiré",
        message: "Le contrat a expiré car le locataire n'a pas signé dans les délais.",
        type: "contract_expired",
        relatedId: contract.id,
      });

      await this.createNotification({
        userId: contract.tenantId,
        title: "Contrat expiré",
        message: "Vous avez dépassé le délai de signature. Le contrat a expiré.",
        type: "contract_expired",
        relatedId: contract.id,
      });
    }
  }

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return this.notifications
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      id: this.getNextId(),
      ...insertNotification,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.notifications.push(notification);
    return notification;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    const index = this.notifications.findIndex(notification => notification.id === id);
    if (index === -1) return false;
    
    this.notifications[index] = {
      ...this.notifications[index],
      read: true
    };
    return true;
  }

  // Conversation operations
  async getConversations(userId: number): Promise<any[]> {
    const userConversations = this.conversations.filter(conv => 
      conv.tenantId === userId || conv.ownerId === userId
    );
    
    // Enrich with property, participant, and last message info
    const enrichedConversations = await Promise.all(
      userConversations.map(async (conv) => {
        const property = await this.getProperty(conv.propertyId);
        const tenant = await this.getUser(conv.tenantId);
        const owner = await this.getUser(conv.ownerId);
        
        // Get last message
        const conversationMessages = this.messages
          .filter(msg => msg.conversationId === conv.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const lastMessage = conversationMessages[0];
        const unreadCount = conversationMessages.filter(msg => 
          msg.senderId !== userId && !msg.readAt
        ).length;
        
        return {
          ...conv,
          property: property ? {
            title: property.title,
            address: property.address,
            images: property.images
          } : null,
          tenant: tenant ? {
            id: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            profilePicture: tenant.profilePicture
          } : null,
          owner: owner ? {
            id: owner.id,
            firstName: owner.firstName,
            lastName: owner.lastName,
            profilePicture: owner.profilePicture
          } : null,
          lastMessage,
          unreadCount,
          participant: userId === conv.tenantId ? {
            id: owner?.id,
            name: `${owner?.firstName} ${owner?.lastName}`,
            profilePicture: owner?.profilePicture,
            role: 'Propriétaire'
          } : {
            id: tenant?.id,
            name: `${tenant?.firstName} ${tenant?.lastName}`,
            profilePicture: tenant?.profilePicture,
            role: 'Locataire'
          }
        };
      })
    );
    
    return enrichedConversations.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }
  
  async getConversation(id: number): Promise<any | undefined> {
    return this.conversations.find(conv => conv.id === id);
  }
  
  async createConversation(conversation: any): Promise<any> {
    const newConversation = {
      id: this.getNextId(),
      ...conversation,
      lastMessageAt: new Date(),
      createdAt: new Date()
    };
    this.conversations.push(newConversation);
    return newConversation;
  }
  
  async getOrCreateConversation(propertyId: number, tenantId: number, ownerId: number): Promise<any> {
    let conversation = this.conversations.find(conv => 
      conv.propertyId === propertyId && 
      conv.tenantId === tenantId && 
      conv.ownerId === ownerId
    );
    
    if (!conversation) {
      conversation = await this.createConversation({
        propertyId,
        tenantId,
        ownerId
      });
    }
    
    return conversation;
  }
  
  async getConversationMessages(conversationId: number): Promise<any[]> {
    const conversationMessages = this.messages
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
    // Enrich messages with sender info
    const enrichedMessages = await Promise.all(
      conversationMessages.map(async (msg) => {
        const sender = await this.getUser(msg.senderId);
        return {
          ...msg,
          sender: sender ? {
            id: sender.id,
            firstName: sender.firstName,
            lastName: sender.lastName,
            profilePicture: sender.profilePicture
          } : null
        };
      })
    );
    
    return enrichedMessages;
  }
  
  async createMessage(message: any): Promise<any> {
    const newMessage = {
      id: this.getNextId(),
      ...message,
      createdAt: new Date()
    };
    this.messages.push(newMessage);
    
    // Update conversation last message time
    const convIndex = this.conversations.findIndex(conv => conv.id === message.conversationId);
    if (convIndex !== -1) {
      this.conversations[convIndex].lastMessageAt = new Date();
    }
    
    return newMessage;
  }
  
  async markMessageAsRead(messageId: number): Promise<boolean> {
    const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return false;
    
    this.messages[messageIndex].readAt = new Date();
    return true;
  }
  
  // Termination request operations
  async createTerminationRequest(request: any): Promise<any> {
    const terminationRequest = {
      id: this.getNextId(),
      ...request,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.terminationRequests.push(terminationRequest);
    return terminationRequest;
  }

  async getTerminationRequestsByUser(userId: number, userType: string): Promise<any[]> {
    // Legacy method - use specific methods instead
    if (userType === 'owner') {
      return this.getTerminationRequestsByOwner(userId);
    } else {
      return this.getTerminationRequestsByTenant(userId);
    }
  }

  // Returns termination requests created by tenants
  // For /api/tenant-requests/:userId
  async getTerminationRequestsByTenant(userId: number): Promise<any[]> {
    // Find all contracts where the given userId is either the tenant (for sent requests)
    // or the owner (for received requests from tenants)
    const userContracts = this.contracts.filter(c => c.tenantId === userId || c.ownerId === userId);
    const contractIds = userContracts.map(c => c.id);
    
    // Get termination requests for these contracts where a tenant was the requester
    const tenantRequests = [];
    
    for (const request of this.terminationRequests) {
      if (contractIds.includes(request.contractId)) {
        // Find the contract to determine who is tenant/owner
        const contract = this.contracts.find(c => c.id === request.contractId);
        if (contract && contract.tenantId === request.requestedBy) {
          tenantRequests.push(request);
        }
      }
    }
    
    return tenantRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Returns termination requests created by owners
  // For /api/owner-requests/:userId  
  async getTerminationRequestsByOwner(userId: number): Promise<any[]> {
    // Find all contracts where the given userId is either the owner (for sent requests)
    // or the tenant (for received requests from owners)
    const userContracts = this.contracts.filter(c => c.ownerId === userId || c.tenantId === userId);
    const contractIds = userContracts.map(c => c.id);
    
    // Get termination requests for these contracts where an owner was the requester
    const ownerRequests = [];
    
    for (const request of this.terminationRequests) {
      if (contractIds.includes(request.contractId)) {
        // Find the contract to determine who is tenant/owner
        const contract = this.contracts.find(c => c.id === request.contractId);
        if (contract && contract.ownerId === request.requestedBy) {
          ownerRequests.push(request);
        }
      }
    }
    
    return ownerRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTerminationRequest(id: number): Promise<any | undefined> {
    return this.terminationRequests.find(req => req.id === id);
  }

  async updateTerminationRequestStatus(id: number, status: string): Promise<any | undefined> {
    const index = this.terminationRequests.findIndex(req => req.id === id);
    if (index === -1) return undefined;
    
    this.terminationRequests[index] = {
      ...this.terminationRequests[index],
      status,
      updatedAt: new Date()
    };
    return this.terminationRequests[index];
  }

  async updateContractTerminationRequest(id: number, updates: Partial<any>): Promise<any | undefined> {
    const index = this.terminationRequests.findIndex(req => req.id === id);
    if (index === -1) return undefined;
    
    this.terminationRequests[index] = {
      ...this.terminationRequests[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.terminationRequests[index];
  }

  async getContractTerminationRequests(contractId: number): Promise<any[]> {
    return this.terminationRequests.filter(req => req.contractId === contractId);
  }

  async getContractById(contractId: number): Promise<any | undefined> {
    return this.contracts.find(c => c.id === contractId);
  }

  async getUserById(userId: number): Promise<any | undefined> {
    return this.users.find(u => u.id === userId);
  }
}

// Use in-memory storage for development, database storage for production
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
