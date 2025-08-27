import { 
  users, properties, offers, contracts, notifications, conversations, messages, userBlocks, userSessions, userFavorites, reviews,
  propertyLikes, reviewLikes, priceNegotiations,
  type User, type InsertUser, type Property, type InsertProperty,
  type Offer, type InsertOffer, type Contract, type InsertContract,
  type Notification, type InsertNotification, type Message, type InsertMessage,
  type UserBlock, type InsertUserBlock, type UserSession, type InsertUserSession,
  type UserFavorite, type InsertUserFavorite, type Review, type InsertReview,
  type PropertyLike, type InsertPropertyLike, type ReviewLike, type InsertReviewLike,
  type PriceNegotiation, type InsertPriceNegotiation
} from "@shared/schema";
// Database is only available in production
let db: any = null;
import { eq, desc, and, lt, or, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Property operations
  getProperties(ownerId?: number): Promise<Property[]>;
  getPropertiesWithOwners(ownerId?: number): Promise<any[]>;
  getProperty(id: number): Promise<Property | undefined>;
  getPropertyWithOwner(id: number): Promise<any | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, updates: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  incrementPropertyViews(id: number): Promise<void>;
  
  // Offer operations
  getOffers(userId?: number, type?: 'sent' | 'received'): Promise<Offer[]>;
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
  getConversationMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<boolean>;
  getOrCreateConversation(propertyId: number, tenantId: number, ownerId: number): Promise<any>;
  
  // User blocking operations
  blockUser(blockerId: number, blockedId: number): Promise<UserBlock>;
  unblockUser(blockerId: number, blockedId: number): Promise<boolean>;
  getBlockedUsers(userId: number): Promise<number[]>;
  
  // Favorites operations
  addToFavorites(userId: number, propertyId: number): Promise<UserFavorite>;
  removeFromFavorites(userId: number, propertyId: number): Promise<boolean>;
  getUserFavorites(userId: number): Promise<Property[]>;
  isPropertyFavorited(userId: number, propertyId: number): Promise<boolean>;
  isUserBlocked(blockerId: number, blockedId: number): Promise<boolean>;
  
  // User session operations
  updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void>;
  getUserOnlineStatus(userId: number): Promise<{ isOnline: boolean; lastSeen: Date | null }>;
  searchUsers(query: string, currentUserId: number): Promise<User[]>;

  // Favorites operations
  addToFavorites(userId: number, propertyId: number): Promise<UserFavorite>;
  removeFromFavorites(userId: number, propertyId: number): Promise<boolean>;
  getUserFavorites(userId: number): Promise<Property[]>;
  isPropertyFavorited(userId: number, propertyId: number): Promise<boolean>;

  // Review operations
  getPropertyReviews(propertyId: number): Promise<any[]>;
  createReview(review: InsertReview): Promise<Review>;
  getReview(id: number): Promise<Review | undefined>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;
  
  // Property likes operations
  likeProperty(userId: number, propertyId: number, isLike: boolean): Promise<PropertyLike>;
  getPropertyLikes(propertyId: number): Promise<{ likes: number; dislikes: number }>;
  getUserPropertyLike(userId: number, propertyId: number): Promise<PropertyLike | undefined>;
  
  // Review likes operations
  likeReview(userId: number, reviewId: number, isLike: boolean): Promise<ReviewLike>;
  getReviewLikes(reviewId: number): Promise<{ likes: number; dislikes: number }>;
  getUserReviewLike(userId: number, reviewId: number): Promise<ReviewLike | undefined>;
  
  // Price negotiation operations
  createPriceNegotiation(negotiation: InsertPriceNegotiation): Promise<PriceNegotiation>;
  getPriceNegotiations(propertyId: number): Promise<PriceNegotiation[]>;
  getUserNegotiations(userId: number, type: 'sent' | 'received'): Promise<PriceNegotiation[]>;
  updateNegotiationStatus(id: number, status: string, counterPrice?: string, responseMessage?: string): Promise<PriceNegotiation | undefined>;
  
  // Enhanced search with cities
  searchProperties(filters: any): Promise<any[]>;
  getTunisianCities(): string[];
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
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

  async getPropertiesWithOwners(ownerId?: number): Promise<any[]> {
    const query = db.select({
      id: properties.id,
      ownerId: properties.ownerId,
      title: properties.title,
      description: properties.description,
      type: properties.type,
      price: properties.price,
      priceType: properties.priceType,
      surface: properties.surface,
      rooms: properties.rooms,
      bathrooms: properties.bathrooms,
      address: properties.address,
      latitude: properties.latitude,
      longitude: properties.longitude,
      amenities: properties.amenities,
      rules: properties.rules,
      images: properties.images,
      status: properties.status,
      deposit: properties.deposit,
      fees: properties.fees,
      utilities: properties.utilities,
      utilitiesIncluded: properties.utilitiesIncluded,
      categories: properties.categories,
      geographicHighlight: properties.geographicHighlight,
      furnished: properties.furnished,
      furniture: properties.furniture,
      availability: properties.availability,
      views: properties.views,
      createdAt: properties.createdAt,
      updatedAt: properties.updatedAt,
      owner: sql`${users.firstName} || ' ' || ${users.lastName}`.as('owner'),
      ownerVerified: users.isVerified,
      ownerRating: users.rating,
      ownerVerificationScore: users.verificationScore,
      ownerEmail: users.email,
      ownerPhone: users.phone
    })
    .from(properties)
    .leftJoin(users, eq(properties.ownerId, users.id));

    if (ownerId) {
      return await query.where(eq(properties.ownerId, ownerId)).orderBy(desc(properties.createdAt));
    }
    return await query.orderBy(desc(properties.createdAt));
  }

  async getPropertyWithOwner(id: number): Promise<any | undefined> {
    const [result] = await db.select({
      id: properties.id,
      ownerId: properties.ownerId,
      title: properties.title,
      description: properties.description,
      type: properties.type,
      price: properties.price,
      priceType: properties.priceType,
      surface: properties.surface,
      rooms: properties.rooms,
      bathrooms: properties.bathrooms,
      address: properties.address,
      latitude: properties.latitude,
      longitude: properties.longitude,
      amenities: properties.amenities,
      rules: properties.rules,
      images: properties.images,
      status: properties.status,
      deposit: properties.deposit,
      fees: properties.fees,
      utilities: properties.utilities,
      utilitiesIncluded: properties.utilitiesIncluded,
      categories: properties.categories,
      geographicHighlight: properties.geographicHighlight,
      furnished: properties.furnished,
      furniture: properties.furniture,
      availability: properties.availability,
      views: properties.views,
      createdAt: properties.createdAt,
      updatedAt: properties.updatedAt,
      owner: sql`${users.firstName} || ' ' || ${users.lastName}`.as('owner'),
      ownerVerified: users.isVerified,
      ownerRating: users.rating,
      ownerVerificationScore: users.verificationScore,
      ownerEmail: users.email,
      ownerPhone: users.phone
    })
    .from(properties)
    .leftJoin(users, eq(properties.ownerId, users.id))
    .where(eq(properties.id, id));
    
    return result || undefined;
  }

  async incrementPropertyViews(id: number): Promise<void> {
    await db
      .update(properties)
      .set({ 
        views: sql`${properties.views} + 1`,
        updatedAt: new Date() 
      })
      .where(eq(properties.id, id));
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

  async updateContractTerminationRequest(id: number, updates: Partial<any>): Promise<any | undefined> {
    // For now return undefined since we don't have database setup
    return undefined;
  }

  async getContractTerminationRequests(contractId: number): Promise<any[]> {
    // For now return empty array since we don't have database setup
    return [];
  }

  async getContractById(contractId: number): Promise<any | undefined> {
    // For now return undefined since we don't have database setup
    return undefined;
  }

  async getUserById(userId: number): Promise<any | undefined> {
    // For now return undefined since we don't have database setup
    return undefined;
  }

  // Messaging operations
  async getConversations(userId: number): Promise<any[]> {
    const userConversations = await db.select()
      .from(conversations)
      .where(or(eq(conversations.tenantId, userId), eq(conversations.ownerId, userId)))
      .orderBy(desc(conversations.lastMessageAt));
    
    return Promise.all(userConversations.map(async (conv) => {
      const property = await this.getProperty(conv.propertyId);
      const participant = conv.tenantId === userId 
        ? await this.getUser(conv.ownerId)
        : await this.getUser(conv.tenantId);
      
      const lastMessage = await db.select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      
      const unreadCount = await db.select({ count: sql`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.conversationId, conv.id),
          eq(messages.senderId, userId === conv.tenantId ? conv.ownerId : conv.tenantId),
          sql`read_at IS NULL`
        ));
      
      return {
        ...conv,
        property,
        participant,
        lastMessage: lastMessage[0] || null,
        unreadCount: unreadCount[0]?.count || 0
      };
    }));
  }

  async getConversation(id: number): Promise<any | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(conversation: any): Promise<any> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Update conversation last message timestamp
    await db.update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
    
    return newMessage;
  }

  async markMessageAsRead(messageId: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(eq(messages.id, messageId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getOrCreateConversation(propertyId: number | null, tenantId: number, ownerId: number): Promise<any> {
    // Search for existing conversation between these users
    let whereConditions;
    
    if (propertyId) {
      // Look for property-specific conversation
      whereConditions = and(
        eq(conversations.propertyId, propertyId),
        eq(conversations.tenantId, tenantId),
        eq(conversations.ownerId, ownerId)
      );
    } else {
      // Look for general conversation (property is null)
      whereConditions = and(
        isNull(conversations.propertyId),
        eq(conversations.tenantId, tenantId),
        eq(conversations.ownerId, ownerId)
      );
    }
    
    const [existing] = await db.select()
      .from(conversations)
      .where(whereConditions);
    
    if (existing) {
      return existing;
    }
    
    // Create new conversation
    return await this.createConversation({
      propertyId,
      tenantId,
      ownerId
    });
  }

  // User blocking operations
  async blockUser(blockerId: number, blockedId: number): Promise<UserBlock> {
    const [block] = await db
      .insert(userBlocks)
      .values({ blockerId, blockedId })
      .returning();
    return block;
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<boolean> {
    const result = await db
      .delete(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedId, blockedId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBlockedUsers(userId: number): Promise<number[]> {
    const blocks = await db.select({ blockedId: userBlocks.blockedId })
      .from(userBlocks)
      .where(eq(userBlocks.blockerId, userId));
    return blocks.map(b => b.blockedId);
  }

  async isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const [block] = await db.select()
      .from(userBlocks)
      .where(and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedId, blockedId)
      ));
    return !!block;
  }

  // Favorites operations
  async addToFavorites(userId: number, propertyId: number): Promise<UserFavorite> {
    const [favorite] = await db
      .insert(userFavorites)
      .values({ userId, propertyId })
      .returning();
    return favorite;
  }

  async removeFromFavorites(userId: number, propertyId: number): Promise<boolean> {
    const result = await db
      .delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.propertyId, propertyId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUserFavorites(userId: number): Promise<Property[]> {
    const result = await db.select({
      id: properties.id,
      ownerId: properties.ownerId,
      title: properties.title,
      description: properties.description,
      type: properties.type,
      price: properties.price,
      priceType: properties.priceType,
      surface: properties.surface,
      rooms: properties.rooms,
      bathrooms: properties.bathrooms,
      address: properties.address,
      latitude: properties.latitude,
      longitude: properties.longitude,
      amenities: properties.amenities,
      rules: properties.rules,
      images: properties.images,
      status: properties.status,
      deposit: properties.deposit,
      fees: properties.fees,
      utilities: properties.utilities,
      utilitiesIncluded: properties.utilitiesIncluded,
      categories: properties.categories,
      geographicHighlight: properties.geographicHighlight,
      furnished: properties.furnished,
      furniture: properties.furniture,
      availability: properties.availability,
      createdAt: properties.createdAt,
      updatedAt: properties.updatedAt,
      addedAt: userFavorites.addedAt
    })
    .from(userFavorites)
    .innerJoin(properties, eq(userFavorites.propertyId, properties.id))
    .where(eq(userFavorites.userId, userId))
    .orderBy(desc(userFavorites.addedAt));
    
    return result.map(row => ({
      ...row,
      addedToFavorites: row.addedAt?.toISOString() || new Date().toISOString()
    }));
  }

  async isPropertyFavorited(userId: number, propertyId: number): Promise<boolean> {
    const [favorite] = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.propertyId, propertyId)
      ));
    return !!favorite;
  }

  // User session operations
  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    const [existing] = await db.select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId));
    
    if (existing) {
      await db.update(userSessions)
        .set({ 
          isOnline, 
          lastSeen: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userSessions.userId, userId));
    } else {
      await db.insert(userSessions)
        .values({ 
          userId, 
          isOnline, 
          lastSeen: new Date()
        });
    }
  }

  async getUserOnlineStatus(userId: number): Promise<{ isOnline: boolean; lastSeen: Date | null }> {
    const [session] = await db.select()
      .from(userSessions)
      .where(eq(userSessions.userId, userId));
    
    if (!session) {
      return { isOnline: false, lastSeen: null };
    }
    
    return {
      isOnline: session.isOnline,
      lastSeen: session.lastSeen
    };
  }

  async searchUsers(query: string, currentUserId: number): Promise<User[]> {
    const blockedUsers = await this.getBlockedUsers(currentUserId);
    
    const searchResults = await db.select()
      .from(users)
      .where(and(
        or(
          sql`first_name ILIKE ${`%${query}%`}`,
          sql`last_name ILIKE ${`%${query}%`}`,
          sql`username ILIKE ${`%${query}%`}`,
          sql`email ILIKE ${`%${query}%`}`,
          sql`phone ILIKE ${`%${query}%`}`,
          sql`CONCAT(first_name, ' ', last_name) ILIKE ${`%${query}%`}`
        ),
        sql`id != ${currentUserId}`
      ))
      .limit(20);
    
    return searchResults.filter(user => !blockedUsers.includes(user.id));
  }

  // Review operations
  async getPropertyReviews(propertyId: number): Promise<any[]> {
    const reviewsList = await db.select({
      id: reviews.id,
      propertyId: reviews.propertyId,
      userId: reviews.userId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      // User information
      userFirstName: users.firstName,
      userLastName: users.lastName,
      userIsVerified: users.isVerified,
      userProfilePicture: users.profilePicture
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.propertyId, propertyId))
    .orderBy(desc(reviews.createdAt));

    // Transform to include user object
    return reviewsList.map(review => ({
      id: review.id,
      propertyId: review.propertyId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        id: review.userId,
        firstName: review.userFirstName,
        lastName: review.userLastName,
        isVerified: review.userIsVerified,
        profilePicture: review.userProfilePicture
      }
    }));
  }

  async createReview(review: any): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const [updated] = await db
      .update(reviews)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteReview(id: number): Promise<boolean> {
    const result = await db.delete(reviews).where(eq(reviews.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Price negotiation operations
  async createPriceNegotiation(negotiation: InsertPriceNegotiation): Promise<PriceNegotiation> {
    const [newNegotiation] = await db
      .insert(priceNegotiations)
      .values(negotiation)
      .returning();
    return newNegotiation;
  }

  async getPriceNegotiations(propertyId: number): Promise<PriceNegotiation[]> {
    return await db.select().from(priceNegotiations)
      .where(eq(priceNegotiations.propertyId, propertyId))
      .orderBy(desc(priceNegotiations.createdAt));
  }

  async getUserNegotiations(userId: number, type: 'sent' | 'received'): Promise<PriceNegotiation[]> {
    const field = type === 'sent' ? priceNegotiations.tenantId : priceNegotiations.ownerId;
    return await db.select().from(priceNegotiations)
      .where(eq(field, userId))
      .orderBy(desc(priceNegotiations.createdAt));
  }

  async updateNegotiationStatus(id: number, status: string, counterPrice?: string, responseMessage?: string): Promise<PriceNegotiation | undefined> {
    const [updated] = await db
      .update(priceNegotiations)
      .set({
        status,
        counterPrice: counterPrice || null,
        responseMessage: responseMessage || null,
        respondedAt: new Date()
      })
      .where(eq(priceNegotiations.id, id))
      .returning();
    return updated || undefined;
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
  private userBlocks: any[] = [];
  private userSessions: any[] = [];
  private userFavorites: UserFavorite[] = [];
  private reviews: Review[] = [];
  private priceNegotiations: PriceNegotiation[] = [];
  private nextId = 1;

  constructor() {
    // Initialize with test users and sample conversations
    this.initializeTestData();
  }

  private initializeTestData() {
    // Only initialize test data in development mode
    if (process.env.NODE_ENV !== 'development') {
      this.users = [];
      this.nextId = 1;
      return;
    }
    
    // Create test users with hashed passwords (bcrypt hash of 'password123') - DEVELOPMENT ONLY
    const hashedPassword = '$2b$10$9409EDjn9m.1RE0NkAnNSuq9s1iLjXGQChlbq1H5S7lq.uXC9am7K';
    
    this.users = [
      {
        id: 1,
        username: "locataire@test.com",
        password: hashedPassword,
        email: "locataire@test.com",
        firstName: "Jean",
        lastName: "Dupont",
        phone: "+33 1 23 45 67 89",
        userType: "tenant",
        profilePicture: null,
        documentNumber: "12345678",
        bio: "Locataire sérieux et respectueux",
        // Add missing required fields
        isVerified: false,
        verificationScore: 0,
        emailVerified: false,
        emailVerificationCode: null,
        phoneVerified: false,
        phoneVerificationCode: null,
        documentVerified: false,
        identityScore: 0,
        backgroundCheckScore: 0,
        referencesScore: 0,
        criminalRecordCheck: false,
        incomeVerified: false,
        studentStatus: false,
        employmentStatus: null,
        monthlyIncome: null,
        guarantorInfo: null,
        emergencyContact: null,
        preferences: null,
        tags: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        username: "proprietaire@test.com",
        password: hashedPassword,
        email: "proprietaire@test.com",
        firstName: "Marie",
        lastName: "Martin",
        phone: "+33 1 98 76 54 32",
        userType: "owner",
        profilePicture: null,
        documentNumber: "87654321",
        bio: "Propriétaire attentif et disponible",
        // Add missing required fields
        isVerified: false,
        verificationScore: 0,
        emailVerified: false,
        emailVerificationCode: null,
        phoneVerified: false,
        phoneVerificationCode: null,
        documentVerified: false,
        identityScore: 0,
        backgroundCheckScore: 0,
        referencesScore: 0,
        criminalRecordCheck: false,
        incomeVerified: false,
        studentStatus: false,
        employmentStatus: null,
        monthlyIncome: null,
        guarantorInfo: null,
        emergencyContact: null,
        preferences: null,
        tags: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    this.nextId = 3;
    
    // Create sample properties
    this.properties = [
      {
        id: 1,
        title: "Appartement moderne à Tunis Centre",
        description: "Magnifique appartement de 85m² avec vue sur mer",
        price: 850,
        location: "Tunis Centre",
        latitude: "36.8065",
        longitude: "10.1815",
        bedrooms: 2,
        bathrooms: 1,
        surface: 85,
        furnished: true,
        category: "Appartement",
        amenities: ["wifi", "climatisation", "parking"],
        images: [],
        availability: "Disponible",
        ownerId: 2,
        views: 23,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date()
      },
      {
        id: 2,
        title: "Studio cozy près de l'université",
        description: "Studio parfait pour étudiant avec tout équipé",
        price: 420,
        location: "Manouba",
        latitude: "36.8189",
        longitude: "10.0983",
        bedrooms: 1,
        bathrooms: 1,
        surface: 35,
        furnished: true,
        category: "Studio",
        amenities: ["wifi", "climatisation"],
        images: [],
        availability: "Disponible",
        ownerId: 2,
        views: 41,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date()
      }
    ];
    
    // Create sample conversations - ONE conversation per user pair
    this.conversations = [
      {
        id: 1,
        propertyId: null, // General conversation covering all properties
        tenantId: 1,
        ownerId: 2,
        lastMessageAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];
    
    // Create sample messages with diverse content
    this.messages = [
      // Conversation 1 messages
      {
        id: 1,
        conversationId: 1,
        senderId: 1,
        content: "Bonjour ! Je suis très intéressé par votre appartement à Tunis Centre. Serait-il possible de le visiter cette semaine ? 😊",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        conversationId: 1,
        senderId: 2,
        content: "Bonjour Jean ! Bien sûr, je serais ravi de vous faire visiter. Êtes-vous disponible demain après-midi vers 15h ?",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
      },
      {
        id: 3,
        conversationId: 1,
        senderId: 1,
        content: "Parfait ! 15h me convient très bien. Pouvez-vous m'envoyer l'adresse exacte ?",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000)
      },
      {
        id: 4,
        conversationId: 1,
        senderId: 2,
        content: "🎤 Message vocal (0:15)",
        messageType: "voice",
        fileUrl: "/uploads/voice_sample.wav",
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
      },
      {
        id: 5,
        conversationId: 1,
        senderId: 1,
        content: "Merci beaucoup ! L'appartement a l'air magnifique sur les photos 📸",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 6,
        conversationId: 1,
        senderId: 2,
        content: "Merci ! J'espère qu'il vous plaira encore plus en vrai. À demain ! 🏡✨",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 20 * 60 * 1000)
      },
      {
        id: 7,
        conversationId: 1,
        senderId: 1,
        content: "Hâte de le voir ! Bonne soirée 🌙",
        messageType: "text",
        fileUrl: null,
        readAt: null,
        createdAt: new Date(Date.now() - 10 * 60 * 1000)
      },
      
      // Conversation 2 messages
      {
        id: 8,
        conversationId: 1,
        senderId: 1,
        content: "Bonsoir Marie ! Votre studio près de l'université m'intéresse beaucoup. Est-il toujours disponible ?",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 9,
        conversationId: 1,
        senderId: 2,
        content: "Bonsoir ! Oui il est encore disponible. C'est parfait pour un étudiant, tout est inclus dans le prix 👨‍🎓",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
      },
      {
        id: 10,
        conversationId: 1,
        senderId: 1,
        content: "📷 Image",
        messageType: "image",
        fileUrl: "/uploads/student_room.jpg",
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        id: 11,
        conversationId: 1,
        senderId: 2,
        content: "Belle photo ! Vous êtes étudiant dans quelle faculté ?",
        messageType: "text",
        fileUrl: null,
        readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000),
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
      },
      {
        id: 12,
        conversationId: 1,
        senderId: 1,
        content: "Je suis en master informatique à l'ISAMM. Le studio est vraiment proche du campus ? 🎓💻",
        messageType: "text",
        fileUrl: null,
        readAt: null,
        createdAt: new Date(Date.now() - 5 * 60 * 1000)
      }
    ];

    // Initialize sample reviews for properties
    this.reviews = [
      {
        id: 1,
        propertyId: 1,
        userId: 3,
        rating: 5,
        comment: "Appartement magnifique avec une vue imprenable ! Le propriétaire est très accueillant et l'emplacement est parfait pour mes études. Je recommande vivement ! 🏠✨",
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        propertyId: 1,
        userId: 4,
        rating: 4,
        comment: "Très bon logement, bien situé près des transports. Quelques petits détails à améliorer mais dans l'ensemble très satisfait de mon séjour.",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        propertyId: 2,
        userId: 5,
        rating: 5,
        comment: "Studio parfait pour un étudiant ! Tout est inclus, très propre et le propriétaire répond rapidement. L'université est à 5 minutes à pied. Top ! 🎓",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 4,
        propertyId: 2,
        userId: 6,
        rating: 4,
        comment: "Bon studio dans l'ensemble. La cuisine est un peu petite mais tout le nécessaire y est. Parking facile et quartier calme.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];

    // Add some additional users for the reviews
    const additionalUsers = [
      {
        id: 3,
        username: "ahmed.ben@example.com",
        password: hashedPassword,
        email: "ahmed.ben@example.com",
        firstName: "Ahmed",
        lastName: "Ben Ali",
        phone: "+216 22 123 456",
        userType: "tenant",
        profilePicture: null,
        documentNumber: "12345679",
        bio: "Étudiant en médecine",
        isVerified: true,
        verificationScore: 85,
        emailVerified: true,
        emailVerificationCode: null,
        phoneVerified: true,
        phoneVerificationCode: null,
        documentVerified: true,
        identityScore: 90,
        backgroundCheckScore: 85,
        referencesScore: 80,
        criminalRecordCheck: true,
        incomeVerified: false,
        studentStatus: true,
        employmentStatus: null,
        monthlyIncome: null,
        guarantorInfo: null,
        emergencyContact: null,
        preferences: null,
        tags: null,
        lastLoginAt: null,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 4,
        username: "fatma.k@example.com",
        password: hashedPassword,
        email: "fatma.k@example.com",
        firstName: "Fatma",
        lastName: "Khelifi",
        phone: "+216 25 987 654",
        userType: "tenant",
        profilePicture: null,
        documentNumber: "12345680",
        bio: "Jeune professionnelle",
        isVerified: true,
        verificationScore: 92,
        emailVerified: true,
        emailVerificationCode: null,
        phoneVerified: true,
        phoneVerificationCode: null,
        documentVerified: true,
        identityScore: 95,
        backgroundCheckScore: 90,
        referencesScore: 90,
        criminalRecordCheck: true,
        incomeVerified: true,
        studentStatus: false,
        employmentStatus: "employed",
        monthlyIncome: 1500,
        guarantorInfo: null,
        emergencyContact: null,
        preferences: null,
        tags: null,
        lastLoginAt: null,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 5,
        username: "youssef.m@example.com",
        password: hashedPassword,
        email: "youssef.m@example.com",
        firstName: "Youssef",
        lastName: "Mejri",
        phone: "+216 28 456 789",
        userType: "tenant",
        profilePicture: null,
        documentNumber: "12345681",
        bio: "Étudiant en informatique",
        isVerified: true,
        verificationScore: 78,
        emailVerified: true,
        emailVerificationCode: null,
        phoneVerified: true,
        phoneVerificationCode: null,
        documentVerified: true,
        identityScore: 80,
        backgroundCheckScore: 75,
        referencesScore: 80,
        criminalRecordCheck: true,
        incomeVerified: false,
        studentStatus: true,
        employmentStatus: null,
        monthlyIncome: null,
        guarantorInfo: null,
        emergencyContact: null,
        preferences: null,
        tags: null,
        lastLoginAt: null,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      },
      {
        id: 6,
        username: "leila.s@example.com",
        password: hashedPassword,
        email: "leila.s@example.com",
        firstName: "Leila",
        lastName: "Sassi",
        phone: "+216 24 789 123",
        userType: "tenant",
        profilePicture: null,
        documentNumber: "12345682",
        bio: "Étudiante en architecture",
        isVerified: true,
        verificationScore: 88,
        emailVerified: true,
        emailVerificationCode: null,
        phoneVerified: true,
        phoneVerificationCode: null,
        documentVerified: true,
        identityScore: 85,
        backgroundCheckScore: 90,
        referencesScore: 90,
        criminalRecordCheck: true,
        incomeVerified: false,
        studentStatus: true,
        employmentStatus: null,
        monthlyIncome: null,
        guarantorInfo: null,
        emergencyContact: null,
        preferences: null,
        tags: null,
        lastLoginAt: null,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date()
      }
    ];

    this.users.push(...additionalUsers);
    
    // Update nextId to avoid conflicts
    this.nextId = 100;
  }

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

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    return this.users.find(user => user.phone === phone);
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

  async getPropertiesWithOwners(ownerId?: number): Promise<any[]> {
    let filteredProperties = ownerId ? 
      this.properties.filter(p => p.ownerId === ownerId) : 
      [...this.properties];
    
    return filteredProperties
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(property => {
        const owner = this.users.find(u => u.id === property.ownerId);
        return {
          ...property,
          owner: owner ? `${owner.firstName} ${owner.lastName}` : 'Propriétaire inconnu',
          ownerVerified: owner?.isVerified || false,
          ownerRating: owner?.rating || '0',
          ownerVerificationScore: owner?.verificationScore || 0,
          ownerEmail: owner?.email || '',
          ownerPhone: owner?.phone || ''
        };
      });
  }

  async getPropertyWithOwner(id: number): Promise<any | undefined> {
    const property = this.properties.find(p => p.id === id);
    if (!property) return undefined;
    
    const owner = this.users.find(u => u.id === property.ownerId);
    return {
      ...property,
      owner: owner ? `${owner.firstName} ${owner.lastName}` : 'Propriétaire inconnu',
      ownerVerified: owner?.isVerified || false,
      ownerRating: owner?.rating || '0',
      ownerVerificationScore: owner?.verificationScore || 0,
      ownerEmail: owner?.email || '',
      ownerPhone: owner?.phone || ''
    };
  }

  async incrementPropertyViews(id: number): Promise<void> {
    const property = this.properties.find(p => p.id === id);
    if (property) {
      property.views = (property.views || 0) + 1;
      property.updatedAt = new Date();
    }
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

  async markAllNotificationsRead(userId: number): Promise<boolean> {
    this.notifications
      .filter(notification => notification.userId === userId && !notification.read)
      .forEach(notification => {
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index] = {
            ...this.notifications[index],
            read: true
          };
        }
      });
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
  
  async getOrCreateConversation(propertyId: number | null, tenantId: number, ownerId: number): Promise<any> {
    // Find any existing conversation between these two users, regardless of property
    let conversation = this.conversations.find(conv => 
      conv.tenantId === tenantId && conv.ownerId === ownerId
    );
    
    if (!conversation) {
      // Create new conversation - set propertyId to null for general conversation
      conversation = await this.createConversation({
        propertyId: null, // Always null to make it a general conversation that covers all properties
        tenantId,
        ownerId
      });
    }
    
    return conversation;
  }

  // Add methods for cleanup
  async getAllConversations(): Promise<any[]> {
    return [...this.conversations];
  }

  async deleteConversation(conversationId: number): Promise<boolean> {
    const index = this.conversations.findIndex(conv => conv.id === conversationId);
    if (index === -1) return false;
    
    // Delete all messages in the conversation first
    this.messages = this.messages.filter(msg => msg.conversationId !== conversationId);
    
    // Delete the conversation
    this.conversations.splice(index, 1);
    return true;
  }

  // Manual merge of conversations by user pairs
  async mergeConversationsByUserPairs(): Promise<{duplicatesRemoved: number, conversationsMerged: number}> {
    const userPairGroups = new Map();
    
    // Group conversations by tenantId-ownerId
    for (const conv of this.conversations) {
      const key = `${conv.tenantId}-${conv.ownerId}`;
      if (!userPairGroups.has(key)) {
        userPairGroups.set(key, []);
      }
      userPairGroups.get(key).push(conv);
    }
    
    let duplicatesRemoved = 0;
    let conversationsMerged = 0;
    
    // Merge conversations for each user pair
    for (const [key, conversations] of userPairGroups) {
      if (conversations.length > 1) {
        // Sort by creation date, keep the first (oldest)
        conversations.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const toKeep = conversations[0];
        const toMerge = conversations.slice(1);
        
        // Update the kept conversation to have null propertyId (general conversation)
        toKeep.propertyId = null;
        
        // Move all messages from duplicate conversations to the kept one
        for (const conv of toMerge) {
          // Update all messages to reference the kept conversation
          for (const message of this.messages) {
            if (message.conversationId === conv.id) {
              message.conversationId = toKeep.id;
            }
          }
          
          // Remove the duplicate conversation
          const index = this.conversations.findIndex(c => c.id === conv.id);
          if (index !== -1) {
            this.conversations.splice(index, 1);
            duplicatesRemoved++;
          }
        }
        conversationsMerged++;
      }
    }
    
    return { duplicatesRemoved, conversationsMerged };
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

  // User blocking operations
  async blockUser(blockerId: number, blockedId: number): Promise<UserBlock> {
    const block = {
      id: this.getNextId(),
      blockerId,
      blockedId,
      createdAt: new Date()
    };
    // Note: In memory, we'll use a simple array to track blocks
    if (!this.userBlocks) this.userBlocks = [];
    this.userBlocks.push(block);
    return block as UserBlock;
  }

  async unblockUser(blockerId: number, blockedId: number): Promise<boolean> {
    if (!this.userBlocks) return false;
    const index = this.userBlocks.findIndex(b => b.blockerId === blockerId && b.blockedId === blockedId);
    if (index === -1) return false;
    this.userBlocks.splice(index, 1);
    return true;
  }

  async getBlockedUsers(userId: number): Promise<number[]> {
    if (!this.userBlocks) return [];
    return this.userBlocks
      .filter(b => b.blockerId === userId)
      .map(b => b.blockedId);
  }

  async isUserBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    if (!this.userBlocks) return false;
    return this.userBlocks.some(b => b.blockerId === blockerId && b.blockedId === blockedId);
  }

  // User session operations
  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    if (!this.userSessions) this.userSessions = [];
    const existingIndex = this.userSessions.findIndex(s => s.userId === userId);
    
    if (existingIndex !== -1) {
      this.userSessions[existingIndex] = {
        ...this.userSessions[existingIndex],
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date()
      };
    } else {
      this.userSessions.push({
        id: this.getNextId().toString(),
        userId,
        isOnline,
        lastSeen: new Date(),
        updatedAt: new Date()
      });
    }
  }

  async getUserOnlineStatus(userId: number): Promise<{ isOnline: boolean; lastSeen: Date | null }> {
    if (!this.userSessions) return { isOnline: false, lastSeen: null };
    const session = this.userSessions.find(s => s.userId === userId);
    
    if (!session) {
      return { isOnline: false, lastSeen: null };
    }
    
    return {
      isOnline: session.isOnline,
      lastSeen: session.lastSeen
    };
  }

  async searchUsers(query: string, currentUserId: number): Promise<User[]> {
    const blockedUsers = await this.getBlockedUsers(currentUserId);
    const lowerQuery = query.toLowerCase();
    
    return this.users.filter(user => {
      if (user.id === currentUserId) return false;
      if (blockedUsers.includes(user.id)) return false;
      
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const username = (user.username || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      
      return fullName.includes(lowerQuery) || 
             username.includes(lowerQuery) || 
             email.includes(lowerQuery);
    }).slice(0, 20);
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

  // Favorites operations
  async addToFavorites(userId: number, propertyId: number): Promise<UserFavorite> {
    // Check if already favorited
    const existing = this.userFavorites.find(f => f.userId === userId && f.propertyId === propertyId);
    if (existing) {
      return existing;
    }

    const favorite: UserFavorite = {
      id: this.getNextId(),
      userId,
      propertyId,
      addedAt: new Date()
    };
    
    this.userFavorites.push(favorite);
    return favorite;
  }

  async removeFromFavorites(userId: number, propertyId: number): Promise<boolean> {
    const index = this.userFavorites.findIndex(f => f.userId === userId && f.propertyId === propertyId);
    if (index === -1) return false;
    
    this.userFavorites.splice(index, 1);
    return true;
  }

  async getUserFavorites(userId: number): Promise<Property[]> {
    const userFavoriteIds = this.userFavorites
      .filter(f => f.userId === userId)
      .map(f => f.propertyId);
    
    const favoriteProperties = this.properties.filter(p => userFavoriteIds.includes(p.id));
    
    // Add the addedToFavorites date for each property
    return favoriteProperties.map(property => {
      const favorite = this.userFavorites.find(f => f.userId === userId && f.propertyId === property.id);
      return {
        ...property,
        addedToFavorites: favorite?.addedAt?.toISOString() || new Date().toISOString()
      };
    }).sort((a, b) => new Date(b.addedToFavorites).getTime() - new Date(a.addedToFavorites).getTime());
  }

  async isPropertyFavorited(userId: number, propertyId: number): Promise<boolean> {
    return this.userFavorites.some(f => f.userId === userId && f.propertyId === propertyId);
  }

  // Review operations
  async getPropertyReviews(propertyId: number): Promise<any[]> {
    const propertyReviews = this.reviews
      .filter(r => r.propertyId === propertyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Add user information to each review
    return propertyReviews.map(review => {
      const user = this.users.find(u => u.id === review.userId);
      return {
        ...review,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture
        } : null
      };
    });
  }

  async createReview(reviewData: any): Promise<Review> {
    const review: Review = {
      id: this.getNextId(),
      propertyId: reviewData.propertyId,
      userId: reviewData.userId,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.reviews.push(review);
    return review;
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.find(r => r.id === id);
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const index = this.reviews.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    this.reviews[index] = {
      ...this.reviews[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return this.reviews[index];
  }

  async deleteReview(id: number): Promise<boolean> {
    const index = this.reviews.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.reviews.splice(index, 1);
    return true;
  }

  // Price negotiation operations
  async createPriceNegotiation(negotiation: InsertPriceNegotiation): Promise<PriceNegotiation> {
    const newNegotiation: PriceNegotiation = {
      id: this.getNextId(),
      propertyId: negotiation.propertyId,
      tenantId: negotiation.tenantId,
      ownerId: negotiation.ownerId,
      originalPrice: negotiation.originalPrice,
      proposedPrice: negotiation.proposedPrice,
      counterPrice: negotiation.counterPrice || null,
      status: negotiation.status || "pending",
      message: negotiation.message || null,
      responseMessage: negotiation.responseMessage || null,
      createdAt: new Date(),
      respondedAt: negotiation.respondedAt || null
    };
    
    this.priceNegotiations.push(newNegotiation);
    return newNegotiation;
  }

  async getPriceNegotiations(propertyId: number): Promise<PriceNegotiation[]> {
    return this.priceNegotiations
      .filter(n => n.propertyId === propertyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUserNegotiations(userId: number, type: 'sent' | 'received'): Promise<PriceNegotiation[]> {
    const field = type === 'sent' ? 'tenantId' : 'ownerId';
    return this.priceNegotiations
      .filter(n => n[field] === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateNegotiationStatus(id: number, status: string, counterPrice?: string, responseMessage?: string): Promise<PriceNegotiation | undefined> {
    const index = this.priceNegotiations.findIndex(n => n.id === id);
    if (index === -1) return undefined;

    this.priceNegotiations[index] = {
      ...this.priceNegotiations[index],
      status,
      counterPrice: counterPrice || this.priceNegotiations[index].counterPrice,
      responseMessage: responseMessage || this.priceNegotiations[index].responseMessage,
      respondedAt: new Date()
    };

    return this.priceNegotiations[index];
  }
}

// Use in-memory storage for development, database storage for production
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
