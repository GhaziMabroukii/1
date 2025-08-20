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
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<boolean>;
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
}

// In-memory storage implementation for development
export class MemStorage implements IStorage {
  private users: User[] = [];
  private properties: Property[] = [];
  private offers: Offer[] = [];
  private contracts: Contract[] = [];
  private notifications: Notification[] = [];
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
}

// Use in-memory storage for development, database storage for production
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
