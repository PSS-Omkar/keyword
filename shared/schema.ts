import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
  numeric,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advertisers table
export const advertisers = pgTable("advertisers", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  channelIds: text("channel_ids").array().notNull().default([]),
  domains: text("domains").array().notNull().default([]),
  sampleUrl: varchar("sample_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  topics: text("topics").array().notNull().default([]),
  languages: text("languages").array().notNull().default([]),
  countries: text("countries").array().notNull().default([]),
  keywordsVolume: integer("keywords_volume"),
  keywordsBid: decimal("keywords_bid", { precision: 10, scale: 2 }),
  numberOfKeywords: integer("number_of_keywords").notNull().default(30),
  advertiserId: serial("advertiser_id").references(() => advertisers.id),
  status: varchar("status").notNull().default("draft"), // draft, active, paused
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id),
  advertiserId: serial("advertiser_id").references(() => advertisers.id),
  keyword: varchar("keyword").notNull(),
  trafficSource: varchar("traffic_source").notNull(), // Now required
  status: varchar("status").notNull().default("draft"), // draft, active, paused
  // AI Creation Prompt Fields (compulsory)
  aiPrimaryText: text("ai_primary_text").notNull().default("Create engaging primary text for this campaign that highlights the key benefits and drives action."),
  aiHeadline: text("ai_headline").notNull().default("Write a compelling headline that grabs attention and clearly communicates the main value proposition."),
  aiCta: text("ai_cta").notNull().default("Generate a strong call-to-action that encourages immediate user engagement and conversions."),
  aiImage: text("ai_image").notNull().default("Describe the ideal image for this campaign that visually represents the product/service and appeals to the target audience."),
  aiVideo: text("ai_video").notNull().default("Outline the concept for a video ad that tells a compelling story and showcases the key features effectively."),
  aiVariants: integer("ai_variants").notNull().default(1),
  // Optional fields
  url: varchar("url"),
  channelId: varchar("channel_id"),
  primaryText: text("primary_text"),
  headline: varchar("headline"),
  description: text("description"),
  cta: varchar("cta"), // Call to Action
  image: varchar("image"), // Image URL
  video: varchar("video"), // Video URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Keywords table
export const keywords = pgTable("keywords", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id, { onDelete: "cascade" }),
  keyword: varchar("keyword").notNull(),
  volume: integer("volume"),
  bid: text("bid"), // Keep as text to handle large micros values
  highTopOfPageBidUSD: text("high_top_of_page_bid_usd"), // CoinGecko-based USD conversion
  coinGeckoRate: text("coin_gecko_rate"), // Rate used for conversion
  status: varchar("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Traffic Sources table
export const trafficSources = pgTable("traffic_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  fields: jsonb("fields").notNull(), // Array of field definitions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign Groups table
export const campaignGroups = pgTable("campaign_groups", {
  id: serial("id").primaryKey(),
  projectId: serial("project_id").references(() => projects.id),
  advertiserId: serial("advertiser_id").references(() => advertisers.id),
  name: varchar("name", { length: 255 }).notNull(),
  trafficSource: varchar("traffic_source").notNull(),
  status: varchar("status").notNull().default("draft"), // draft, active, paused
  // AI Creation Prompt Fields (compulsory)
  aiPrimaryText: text("ai_primary_text").notNull().default("Create engaging primary text for this campaign that highlights the key benefits and drives action."),
  aiHeadline: text("ai_headline").notNull().default("Write a compelling headline that grabs attention and clearly communicates the main value proposition."),
  aiCta: text("ai_cta").notNull().default("Generate a strong call-to-action that encourages immediate user engagement and conversions."),
  aiImage: text("ai_image").notNull().default("Describe the ideal image for this campaign that visually represents the product/service and appeals to the target audience."),
  aiVideo: text("ai_video").notNull().default("Outline the concept for a video ad that tells a compelling story and showcases the key features effectively."),
  aiVariants: integer("ai_variants").notNull().default(1),
  // Optional fields (same as campaigns)
  url: varchar("url"),
  channelId: varchar("channel_id"),
  primaryText: text("primary_text"),
  headline: varchar("headline"),
  description: text("description"),
  cta: varchar("cta"), // Call to Action
  image: varchar("image"), // Image URL
  video: varchar("video"), // Video URL
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  advertiser: one(advertisers, {
    fields: [projects.advertiserId],
    references: [advertisers.id],
  }),
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
  campaignGroups: many(campaignGroups),
  keywords: many(keywords),
}));

export const advertisersRelations = relations(advertisers, ({ many }) => ({
  projects: many(projects),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  project: one(projects, {
    fields: [campaigns.projectId],
    references: [projects.id],
  }),
  advertiser: one(advertisers, {
    fields: [campaigns.advertiserId],
    references: [advertisers.id],
  }),
}));

export const campaignGroupsRelations = relations(campaignGroups, ({ one }) => ({
  project: one(projects, {
    fields: [campaignGroups.projectId],
    references: [projects.id],
  }),
  advertiser: one(advertisers, {
    fields: [campaignGroups.advertiserId],
    references: [advertisers.id],
  }),
}));

export const keywordsRelations = relations(keywords, ({ one }) => ({
  project: one(projects, {
    fields: [keywords.projectId],
    references: [projects.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const trafficSourcesRelations = relations(trafficSources, ({ many }) => ({
  campaigns: many(campaigns),
}));

// Schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  keywordsVolume: z.number().int().positive().optional(),
  keywordsBid: z.number().positive().optional(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdvertiserSchema = createInsertSchema(advertisers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKeywordSchema = createInsertSchema(keywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrafficSourceSchema = createInsertSchema(trafficSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignGroupSchema = createInsertSchema(campaignGroups).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Meta Ads storage table
export const metaCampaigns = pgTable("meta_campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  campaignNameStructure: varchar("campaign_name_structure"),
  selectedCampaigns: text("selected_campaigns").array(),
  selectedCampaignGroups: text("selected_campaign_groups").array(),
  advertiserId: integer("advertiser_id"),
  adAccount: varchar("ad_account"),
  adAccountUser: varchar("ad_account_user"),
  locationTargeting: text("location_targeting").array(),
  language: text("language").array(),
  campaignBudget: integer("campaign_budget"),
  campaignBid: numeric("campaign_bid", { precision: 10, scale: 2 }),
  pixel: varchar("pixel"),
  conversionEvent: varchar("conversion_event"),
  adFormat: varchar("ad_format"),
  objective: varchar("objective"),
  goal: varchar("goal"),
  biddingStrategy: varchar("bidding_strategy"),
  placementType: varchar("placement_type"),
  finalUrl: text("final_url"),
  campaignSuffix: text("campaign_suffix"),
  urlExtraParameters: text("url_extra_parameters"),
  keyword: varchar("keyword"), // Store the keyword used for this campaign
  status: varchar("status").default("draft"),
  metaCampaignId: varchar("meta_campaign_id"), // ID from Meta API
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertMetaCampaign = typeof metaCampaigns.$inferInsert;
export type MetaCampaign = typeof metaCampaigns.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Advertiser = typeof advertisers.$inferSelect;
export type InsertAdvertiser = z.infer<typeof insertAdvertiserSchema>;
export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type TrafficSource = typeof trafficSources.$inferSelect;
export type InsertTrafficSource = z.infer<typeof insertTrafficSourceSchema>;
export type CampaignGroup = typeof campaignGroups.$inferSelect;
export type InsertCampaignGroup = z.infer<typeof insertCampaignGroupSchema>;
