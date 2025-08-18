import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Twitter accounts connected by users
export const twitterAccounts = pgTable("twitter_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  twitterId: varchar("twitter_id").notNull().unique(),
  username: varchar("username").notNull(),
  displayName: varchar("display_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add social accounts table
export const socialAccounts = pgTable("social_accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // 'google', 'facebook', 'twitter'
  providerId: text("provider_id").notNull(),
  username: text("username"),
  email: text("email"),
  profileImageUrl: text("profile_image_url"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  followerCount: integer("follower_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content topics for AI generation
export const contentTopics = pgTable("content_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  icon: varchar("icon").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User selected topics
export const userTopics = pgTable("user_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id").notNull().references(() => contentTopics.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Generated and scheduled tweets
export const tweets = pgTable("tweets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  twitterAccountId: varchar("twitter_account_id").notNull().references(() => twitterAccounts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  scheduledFor: timestamp("scheduled_for"),
  postedAt: timestamp("posted_at"),
  twitterTweetId: varchar("twitter_tweet_id"),
  status: varchar("status").notNull().default("draft"), // draft, scheduled, posted, failed
  approvalStatus: varchar("approval_status").notNull().default("pending"), // pending, approved, rejected
  topics: jsonb("topics"), // Array of topic IDs used for generation
  aiPrompt: text("ai_prompt"),
  engagementData: jsonb("engagement_data"), // likes, retweets, replies, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Analytics data
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  twitterAccountId: varchar("twitter_account_id").notNull().references(() => twitterAccounts.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  tweetsCount: integer("tweets_count").default(0),
  engagementRate: real("engagement_rate").default(0),
  impressions: integer("impressions").default(0),
  profileVisits: integer("profile_visits").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  twitterAccounts: many(twitterAccounts),
  tweets: many(tweets),
  userTopics: many(userTopics),
}));

export const twitterAccountsRelations = relations(twitterAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [twitterAccounts.userId],
    references: [users.id],
  }),
  tweets: many(tweets),
  analytics: many(analytics),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
}));

export const contentTopicsRelations = relations(contentTopics, ({ many }) => ({
  userTopics: many(userTopics),
}));

export const userTopicsRelations = relations(userTopics, ({ one }) => ({
  user: one(users, {
    fields: [userTopics.userId],
    references: [users.id],
  }),
  topic: one(contentTopics, {
    fields: [userTopics.topicId],
    references: [contentTopics.id],
  }),
}));

export const tweetsRelations = relations(tweets, ({ one }) => ({
  user: one(users, {
    fields: [tweets.userId],
    references: [users.id],
  }),
  twitterAccount: one(twitterAccounts, {
    fields: [tweets.twitterAccountId],
    references: [twitterAccounts.id],
  }),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  twitterAccount: one(twitterAccounts, {
    fields: [analytics.twitterAccountId],
    references: [twitterAccounts.id],
  }),
}));

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTwitterAccount = typeof twitterAccounts.$inferInsert;
export type TwitterAccount = typeof twitterAccounts.$inferSelect;

export type InsertContentTopic = typeof contentTopics.$inferInsert;
export type ContentTopic = typeof contentTopics.$inferSelect;

export type InsertUserTopic = typeof userTopics.$inferInsert;
export type UserTopic = typeof userTopics.$inferSelect;

export type InsertTweet = typeof tweets.$inferInsert;
export type Tweet = typeof tweets.$inferSelect;

export type InsertAnalytics = typeof analytics.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

// Insert schemas for validation
export const insertTwitterAccountSchema = createInsertSchema(twitterAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTweetSchema = createInsertSchema(tweets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTopicSchema = createInsertSchema(userTopics).omit({
  id: true,
  createdAt: true,
});

export const insertContentTopicSchema = createInsertSchema(contentTopics).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  createdAt: true,
});

