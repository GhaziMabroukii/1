import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal, varchar, unique } from "drizzle-orm/pg-core";
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
  userType: text("user_type").notNull().default("tenant"), // tenant, owner, agency
  
  // Profile and verification fields
  profilePicture: text("profile_picture"), // URL to uploaded profile photo
  bio: text("bio"), // User biography
  isVerified: boolean("is_verified").default(false), // Overall verification status
  verificationScore: integer("verification_score").default(0), // Verification score for ranking
  
  // Email verification
  emailVerified: boolean("email_verified").default(false),
  emailVerificationCode: text("email_verification_code"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  
  // Phone verification
  phoneVerified: boolean("phone_verified").default(false),
  phoneVerificationCode: text("phone_verification_code"),
  phoneVerificationExpiry: timestamp("phone_verification_expiry"),
  
  // Document verification (CIN/Passport)
  documentVerified: boolean("document_verified").default(false),
  documentType: text("document_type"), // "cin" or "passport"
  documentNumber: text("document_number"),
  documentFrontUrl: text("document_front_url"), // Scanned document front
  documentBackUrl: text("document_back_url"), // Scanned document back
  documentVerifiedAt: timestamp("document_verified_at"),
  
  // Agency-specific fields
  agencyName: text("agency_name"), // Business name for agencies
  agencyLicense: text("agency_license"), // Professional license number
  agencyAddress: text("agency_address"), // Business address
  agencyWebsite: text("agency_website"), // Agency website
  
  // User statistics for badges
  responseTime: text("response_time"), // "fast", "normal", "slow"
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"), // User rating
  contractsCount: integer("contracts_count").default(0),
  
  // Social profile enhancements
  disciplineScore: integer("discipline_score").default(100), // 0-100, starts at 100
  profileViews: integer("profile_views").default(0),
  socialLinks: jsonb("social_links"), // {facebook, instagram, linkedin, twitter, website}
  isPublicProfile: boolean("is_public_profile").default(true),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  trustScore: integer("trust_score").default(0), // Calculated trust score
  
  // Achievement counters
  totalLogins: integer("total_logins").default(0),
  totalMessages: integer("total_messages").default(0),
  totalOffers: integer("total_offers").default(0),
  completedContracts: integer("completed_contracts").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // studio, apartment, villa, maison_dhotes, bureau, depot, garage, magasin, etc.
  propertyTags: text("property_tags").array().default([]), // Enhanced tagging system
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
  // Furniture fields
  furnished: boolean("furnished").default(false),
  furniture: jsonb("furniture"), // Array of {item: string, condition: string}
  // Availability fields
  availability: jsonb("availability"), // {available: boolean, availableFrom: string, minimumStay: string, maximumStay: string}
  // Enhanced features
  city: text("city").notNull(), // One of 24 Tunisian cities
  
  // View tracking
  views: integer("views").default(0),
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
  ownerPasswordConfirmed: boolean("owner_password_confirmed").default(false),
  tenantPasswordConfirmed: boolean("tenant_password_confirmed").default(false),
  ownerConfirmedAt: timestamp("owner_confirmed_at"),
  tenantConfirmedAt: timestamp("tenant_confirmed_at"),
  status: text("status").notNull().default("draft"), // draft, owner_signed, fully_signed, active, expired, cancelled, terminated
  tenantSignDeadline: timestamp("tenant_sign_deadline"), // 3 days from owner signature
  pdfUrl: text("pdf_url"),
  // Enhanced contract management fields
  contractStartDate: timestamp("contract_start_date"),
  contractEndDate: timestamp("contract_end_date"),

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
  propertyId: integer("property_id").references(() => properties.id),
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
  messageType: text("message_type").notNull().default("text"), // text, image, file, voice
  fileUrl: text("file_url"), // URL for uploaded files/images/voice messages
  fileName: text("file_name"), // Original filename
  fileSize: integer("file_size"), // File size in bytes
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User blocks table for blocking functionality
export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id),
  blockedId: integer("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User favorites table
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  addedAt: timestamp("added_at").defaultNow(),
}, (table) => ({
  uniqueUserProperty: unique().on(table.userId, table.propertyId),
}));

// User online status
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  lastSeen: timestamp("last_seen").defaultNow(),
  isOnline: boolean("is_online").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
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



// Property likes/dislikes for social interactions
export const propertyLikes = pgTable("property_likes", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserProperty: unique().on(table.userId, table.propertyId),
}));

// Review likes/dislikes
export const reviewLikes = pgTable("review_likes", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  isLike: boolean("is_like").notNull(), // true for like, false for dislike
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserReview: unique().on(table.userId, table.reviewId),
}));

// Price negotiations - simple offer/counter-offer system
export const priceNegotiations = pgTable("price_negotiations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  tenantId: integer("tenant_id").notNull().references(() => users.id),
  ownerId: integer("owner_id").notNull().references(() => users.id),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  proposedPrice: decimal("proposed_price", { precision: 10, scale: 2 }).notNull(),
  counterPrice: decimal("counter_price", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, counter_offered
  message: text("message"),
  responseMessage: text("response_message"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

// Enhanced bilateral contract termination requests with password confirmation and digital signing
export const contractTerminationRequests = pgTable("contract_termination_requests", {
  id: serial("id").primaryKey(),
  contractId: integer("contract_id").notNull().references(() => contracts.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id), // Owner or tenant requesting termination
  reason: text("reason").notNull(), // Reason for termination request (required)
  detailedReason: text("detailed_reason"), // More detailed explanation
  terminationType: text("termination_type").notNull(), // mutual, early_by_owner, early_by_tenant, dispute
  proposedTerms: jsonb("proposed_terms").notNull(), // financial terms, timeline, etc.
  status: text("status").notNull().default("pending"), // pending, negotiating, accepted, rejected, signed, completed
  
  // Bilateral response and negotiation
  tenantResponse: text("tenant_response"), // Response message from tenant
  ownerResponse: text("owner_response"), // Response message from owner
  respondedAt: timestamp("responded_at"),
  
  // Password confirmations (both parties must confirm with password)
  ownerPasswordConfirmed: boolean("owner_password_confirmed").default(false),
  tenantPasswordConfirmed: boolean("tenant_password_confirmed").default(false),
  ownerConfirmedAt: timestamp("owner_confirmed_at"),
  tenantConfirmedAt: timestamp("tenant_confirmed_at"),
  
  // Digital signatures (both parties must sign the termination document)
  ownerSignature: text("owner_signature"),
  tenantSignature: text("tenant_signature"),
  ownerSignedAt: timestamp("owner_signed_at"),
  tenantSignedAt: timestamp("tenant_signed_at"),
  
  // Document generation and final terms
  terminationDocumentUrl: text("termination_document_url"), // PDF of signed termination agreement
  finalTerms: jsonb("final_terms"), // Final agreed terms after any negotiation
  terminationEffectiveDate: timestamp("termination_effective_date"), // When termination becomes effective
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contract renewal requests table
export const contractRenewalRequests = pgTable("contract_renewal_requests", {
  id: serial("id").primaryKey(),
  originalContractId: integer("original_contract_id").notNull().references(() => contracts.id),
  requestedBy: integer("requested_by").notNull().references(() => users.id), // Owner or tenant requesting renewal
  
  // New contract terms
  proposedChanges: jsonb("proposed_changes").notNull(), // Changes to price, terms, duration, etc.
  newStartDate: timestamp("new_start_date").notNull(),
  newEndDate: timestamp("new_end_date").notNull(),
  newRentAmount: decimal("new_rent_amount", { precision: 10, scale: 2 }),
  
  // Negotiation process
  status: text("status").notNull().default("pending"), // pending, negotiating, accepted, rejected, signed, completed
  tenantResponse: text("tenant_response"),
  ownerResponse: text("owner_response"),
  respondedAt: timestamp("responded_at"),
  
  // Password confirmations (both parties must confirm with password)
  ownerPasswordConfirmed: boolean("owner_password_confirmed").default(false),
  tenantPasswordConfirmed: boolean("tenant_password_confirmed").default(false),
  ownerConfirmedAt: timestamp("owner_confirmed_at"),
  tenantConfirmedAt: timestamp("tenant_confirmed_at"),
  
  // Digital signatures for new contract
  ownerSignature: text("owner_signature"),
  tenantSignature: text("tenant_signature"),
  ownerSignedAt: timestamp("owner_signed_at"),
  tenantSignedAt: timestamp("tenant_signed_at"),
  
  // New contract generation
  newContractId: integer("new_contract_id").references(() => contracts.id), // Reference to the new generated contract
  finalTerms: jsonb("final_terms"), // Final agreed terms after negotiation
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  sentOffers: many(offers, { relationName: "tenant_offers" }),
  receivedOffers: many(offers, { relationName: "owner_offers" }),
  tenantContracts: many(contracts, { relationName: "tenant_contracts" }),
  ownerContracts: many(contracts, { relationName: "owner_contracts" }),
  notifications: many(notifications),
  favorites: many(userFavorites),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, { fields: [properties.ownerId], references: [users.id] }),
  offers: many(offers),
  contracts: many(contracts),
  favorites: many(userFavorites),
  likes: many(propertyLikes),
  negotiations: many(priceNegotiations),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  user: one(users, { fields: [userFavorites.userId], references: [users.id] }),
  property: one(properties, { fields: [userFavorites.propertyId], references: [properties.id] }),
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



export const contractTerminationRequestsRelations = relations(contractTerminationRequests, ({ one }) => ({
  contract: one(contracts, { fields: [contractTerminationRequests.contractId], references: [contracts.id] }),
  requestedBy: one(users, { fields: [contractTerminationRequests.requestedBy], references: [users.id] }),
}));

export const propertyLikesRelations = relations(propertyLikes, ({ one }) => ({
  property: one(properties, { fields: [propertyLikes.propertyId], references: [properties.id] }),
  user: one(users, { fields: [propertyLikes.userId], references: [users.id] }),
}));

export const reviewLikesRelations = relations(reviewLikes, ({ one }) => ({
  review: one(reviews, { fields: [reviewLikes.reviewId], references: [reviews.id] }),
  user: one(users, { fields: [reviewLikes.userId], references: [users.id] }),
}));

export const priceNegotiationsRelations = relations(priceNegotiations, ({ one }) => ({
  property: one(properties, { fields: [priceNegotiations.propertyId], references: [properties.id] }),
  tenant: one(users, { fields: [priceNegotiations.tenantId], references: [users.id] }),
  owner: one(users, { fields: [priceNegotiations.ownerId], references: [users.id] }),
}));

// Insert schemas for new tables
export const insertPropertyLikeSchema = createInsertSchema(propertyLikes).omit({
  id: true,
  createdAt: true,
});

export const insertReviewLikeSchema = createInsertSchema(reviewLikes).omit({
  id: true,
  createdAt: true,
});

export const insertPriceNegotiationSchema = createInsertSchema(priceNegotiations).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

// Updated user schema to include agency fields
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  userType: true,
  agencyName: true,
  agencyLicense: true,
  agencyAddress: true,
  agencyWebsite: true,
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

export const insertUserBlockSchema = createInsertSchema(userBlocks).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  updatedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).omit({
  id: true,
  addedAt: true,
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
export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = z.infer<typeof insertUserBlockSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;

export type ContractTerminationRequest = typeof contractTerminationRequests.$inferSelect;
export type InsertContractTerminationRequest = z.infer<typeof insertContractTerminationRequestSchema>;

// New types
export type PropertyLike = typeof propertyLikes.$inferSelect;
export type InsertPropertyLike = z.infer<typeof insertPropertyLikeSchema>;
export type ReviewLike = typeof reviewLikes.$inferSelect;
export type InsertReviewLike = z.infer<typeof insertReviewLikeSchema>;
export type PriceNegotiation = typeof priceNegotiations.$inferSelect;
export type InsertPriceNegotiation = z.infer<typeof insertPriceNegotiationSchema>;

// === SOCIAL PROFILE SYSTEM TABLES ===

// User Posts/Activities for social profile
export const userPosts = pgTable("user_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // "property_listing", "contract_signed", "review", "achievement", "custom"
  title: text("title").notNull(),
  content: text("content"),
  media: text("media").array(), // Images/videos attached
  relatedPropertyId: integer("related_property_id").references(() => properties.id),
  relatedContractId: integer("related_contract_id").references(() => contracts.id),
  visibility: text("visibility").notNull().default("public"), // "public", "friends", "private"
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  shares: integer("shares").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Activity Tracking
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // "login", "view_property", "send_message", "create_offer", etc.
  target: text("target"), // What was acted upon
  targetId: integer("target_id"), // ID of the target
  metadata: jsonb("metadata"), // Additional context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Profile Views Tracking
export const profileViews = pgTable("profile_views", {
  id: serial("id").primaryKey(),
  profileUserId: integer("profile_user_id").notNull().references(() => users.id),
  viewerUserId: integer("viewer_user_id").references(() => users.id), // Null for anonymous views
  viewerIp: text("viewer_ip"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Advanced Badge System
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  badgeId: text("badge_id").notNull(), // Unique badge identifier
  badgeName: text("badge_name").notNull(),
  badgeDescription: text("badge_description"),
  badgeIcon: text("badge_icon"), // Emoji or icon name
  badgeColor: text("badge_color").default("#3B82F6"), // Badge color
  rarity: text("rarity").notNull().default("common"), // "common", "rare", "epic", "legendary"
  earnedAt: timestamp("earned_at").defaultNow(),
  category: text("category").notNull(), // "verification", "activity", "achievement", "social"
  points: integer("points").default(0), // Points value of badge
});

// Post Comments for social interaction
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => userPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentCommentId: integer("parent_comment_id"), // Self-reference for nested comments
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Post Likes
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => userPosts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniquePostLike: unique().on(table.postId, table.userId),
}));

// User Followers (Follow system)
export const userFollowers = pgTable("user_followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id), // User who follows
  followingId: integer("following_id").notNull().references(() => users.id), // User being followed
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueFollow: unique().on(table.followerId, table.followingId),
}));

// User Profile Likes
export const userProfileLikes = pgTable("user_profile_likes", {
  id: serial("id").primaryKey(),
  likerId: integer("liker_id").notNull().references(() => users.id), // User who likes
  likedUserId: integer("liked_user_id").notNull().references(() => users.id), // User being liked
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueProfileLike: unique().on(table.likerId, table.likedUserId),
}));

// Social Schemas
export const insertUserPostSchema = createInsertSchema(userPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  comments: true,
  shares: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivities).omit({
  id: true,
  createdAt: true,
});

export const insertProfileViewSchema = createInsertSchema(profileViews).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

export const insertUserFollowerSchema = createInsertSchema(userFollowers).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileLikeSchema = createInsertSchema(userProfileLikes).omit({
  id: true,
  createdAt: true,
});

// Social Types
export type UserPost = typeof userPosts.$inferSelect;
export type InsertUserPost = z.infer<typeof insertUserPostSchema>;
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type ProfileView = typeof profileViews.$inferSelect;
export type InsertProfileView = z.infer<typeof insertProfileViewSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type UserFollower = typeof userFollowers.$inferSelect;
export type InsertUserFollower = z.infer<typeof insertUserFollowerSchema>;
export type UserProfileLike = typeof userProfileLikes.$inferSelect;
export type InsertUserProfileLike = z.infer<typeof insertUserProfileLikeSchema>;
