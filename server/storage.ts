import { 
  users, properties, offers, contracts, notifications,
  type User, type InsertUser, type Property, type InsertProperty,
  type Offer, type InsertOffer, type Contract, type InsertContract,
  type Notification, type InsertNotification 
} from "@shared/schema";
import { db } from "./db";
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
  getOffers(userId: number, type: 'sent' | 'received'): Promise<Offer[]>;
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

export const storage = new DatabaseStorage();
