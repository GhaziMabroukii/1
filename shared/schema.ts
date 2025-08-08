import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  userType: text("user_type").notNull().default("tenant"), // tenant, owner
  createdAt: timestamp("created_at").defaultNow(),
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // studio, apartment, villa, etc.
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceType: text("price_type").notNull().default("mois"), // mois, semaine, jour
  surface: integer("surface"),
  rooms: integer("rooms"),
  bathrooms: integer("bathrooms"),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  amenities: text("amenities").array(),
  rules: text("rules").array(),
  images: text("images").array(),
  status: text("status").notNull().default("Disponible"), // Disponible, Loué, Indisponible
  deposit: decimal("deposit", { precision: 10, scale: 2 }),
  fees: decimal("fees", { precision: 10, scale: 2 }),
  utilities: text("utilities"),
  utilitiesIncluded: boolean("utilities_included").default(false),
  // New property categorization fields
  categories: text("categories").array(), // Famille, Étudiant, Maison d'été, Vue sur mer, Proche de la plage
  geographicHighlight: text("geographic_highlight"), // e.g., "À 200m de l'INSAT"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Property offers/agreements
export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  tenantId: integer("tenant_id").notNull().references(() => users.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 10, scale: 2 }).notNull(),
  deposit: decimal("deposit", { precision: 10, scale: 2 }),
  conditions: text("conditions"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, contract_requested
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contracts table
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id").notNull().references(() => offers.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  tenantId: integer("tenant_id").notNull().references(() => users.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  contractData: jsonb("contract_data").notNull(), // All contract details
  ownerSignature: text("owner_signature"), // Base64 signature data
  tenantSignature: text("tenant_signature"), // Base64 signature data
  ownerSignedAt: timestamp("owner_signed_at"),
  tenantSignedAt: timestamp("tenant_signed_at"),
  status: text("status").notNull().default("draft"), // draft, owner_signed, fully_signed, active, expired, cancelled, terminated, waiting_for_modification, modified
  tenantSignDeadline: timestamp("tenant_sign_deadline"), // 3 days from owner signature
  pdfUrl: text("pdf_url"),
  // Enhanced contract management fields
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),
  modificationSummary: text("modification_summary"), // Summary of modifications made
  terminationReason: text("termination_reason"), // Reason for early termination
  terminatedBy: integer("terminated_by").references(() => users.id), // User who initiated termination
  terminatedAt: timestamp("terminated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // offer, contract, signature, etc.
  relatedId: integer("related_id"), // ID of related offer/contract
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversations table for messaging
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  tenantId: integer("tenant_id").notNull().references(() => users.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"), // text, image, file
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews table for property reviews
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  userId: integer("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract versions table for tracking contract modifications
export const contractVersions = pgTable("contract_versions", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  version: integer("version").notNull().default(1), // Version number (1, 2, 3, etc.)
  contractData: jsonb("contract_data").notNull(), // Contract data for this version
  ownerSignature: text("owner_signature"),
  tenantSignature: text("tenant_signature"),
  ownerSignedAt: timestamp("owner_signed_at"),
  tenantSignedAt: timestamp("tenant_signed_at"),
  status: text("status").notNull().default("draft"), // draft, owner_signed, fully_signed, active, superseded
  modificationReason: text("modification_reason"), // Why this version was created
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract modification requests table
export const contractModificationRequests = pgTable("contract_modification_requests", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id), // Always owner
  requestedChanges: jsonb("requested_changes").notNull(), // Details of requested changes
  fieldsToModify: text("fields_to_modify").array(), // Fields owner wants to modify (name, cin, signature, address, etc.)
  modificationReason: text("modification_reason").notNull(), // Reason for modification request
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, modification_in_progress, completed
  tenantResponse: text("tenant_response"), // Optional message from tenant
  respondedAt: timestamp("responded_at"),
  modificationDeadline: timestamp("modification_deadline"), // 24h from acceptance
  createdAt: timestamp("created_at").defaultNow(),
});

// Contract termination requests table
export const contractTerminationRequests = pgTable("contract_termination_requests", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id), // Owner requesting early termination
  reason: text("reason").notNull(), // Reason for termination request (required)
  detailedReason: text("detailed_reason"), // More detailed explanation
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  tenantResponse: text("tenant_response"), // Optional message from tenant
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  sentOffers: many(offers, { relationName: "tenant_offers" }),
  receivedOffers: many(offers, { relationName: "owner_offers" }),
  tenantContracts: many(contracts, { relationName: "tenant_contracts" }),
  ownerContracts: many(contracts, { relationName: "owner_contracts" }),
  notifications: many(notifications),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
  offers: many(offers),
  contracts: many(contracts),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  property: one(properties, { fields: [offers.propertyId], references: [properties.id] }),
  tenant: one(users, { fields: [offers.tenantId], references: [users.id], relationName: "tenant_offers" }),
  owner: one(users, { fields: [offers.ownerId], references: [users.id], relationName: "owner_offers" }),
  contract: one(contracts, { fields: [offers.id], references: [contracts.offerId] }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  offer: one(offers, { fields: [contracts.offerId], references: [offers.id] }),
  property: one(properties, { fields: [contracts.propertyId], references: [properties.id] }),
  tenant: one(users, { fields: [contracts.tenantId], references: [users.id], relationName: "tenant_contracts" }),
  owner: one(users, { fields: [contracts.ownerId], references: [users.id], relationName: "owner_contracts" }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const contractModificationRequestsRelations = relations(contractModificationRequests, ({ one }) => ({
  contract: one(contracts, { fields: [contractModificationRequests.contractId], references: [contracts.id] }),
  requestedBy: one(users, { fields: [contractModificationRequests.requestedBy], references: [users.id] }),
}));

export const contractTerminationRequestsRelations = relations(contractTerminationRequests, ({ one }) => ({
  contract: one(contracts, { fields: [contractTerminationRequests.contractId], references: [contracts.id] }),
  requestedBy: one(users, { fields: [contractTerminationRequests.requestedBy], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  userType: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
  endDate: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  lastMessageAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertContractModificationRequestSchema = createInsertSchema(contractModificationRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
  modificationDeadline: true,
});

export const insertContractTerminationRequestSchema = createInsertSchema(contractTerminationRequests).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ContractModificationRequest = typeof contractModificationRequests.$inferSelect;
export type InsertContractModificationRequest = z.infer<typeof insertContractModificationRequestSchema>;
export type ContractTerminationRequest = typeof contractTerminationRequests.$inferSelect;
export type InsertContractTerminationRequest = z.infer<typeof insertContractTerminationRequestSchema>;
