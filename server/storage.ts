import {
  users,
  twitterAccounts,
  contentTopics,
  userTopics,
  tweets,
  analytics,
  type User,
  type UpsertUser,
  type TwitterAccount,
  type InsertTwitterAccount,
  type ContentTopic,
  type InsertContentTopic,
  type UserTopic,
  type InsertUserTopic,
  type Tweet,
  type InsertTweet,
  type Analytics,
  type InsertAnalytics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Twitter account operations
  getTwitterAccountsByUserId(userId: string): Promise<TwitterAccount[]>;
  createTwitterAccount(account: InsertTwitterAccount): Promise<TwitterAccount>;
  updateTwitterAccount(id: string, updates: Partial<InsertTwitterAccount>): Promise<TwitterAccount | undefined>;
  getTwitterAccountById(id: string): Promise<TwitterAccount | undefined>;

  // Content topics operations
  getAllContentTopics(): Promise<ContentTopic[]>;
  createContentTopic(topic: InsertContentTopic): Promise<ContentTopic>;
  getUserTopics(userId: string): Promise<(UserTopic & { topic: ContentTopic })[]>;
  setUserTopics(userId: string, topicIds: string[]): Promise<void>;

  // Tweet operations
  createTweet(tweet: InsertTweet): Promise<Tweet>;
  getTweetsByUserId(userId: string): Promise<Tweet[]>;
  getTweetsByStatus(userId: string, status: string): Promise<Tweet[]>;
  updateTweet(id: string, updates: Partial<InsertTweet>): Promise<Tweet | undefined>;
  getScheduledTweets(): Promise<Tweet[]>;
  getTweetById(id: string): Promise<Tweet | undefined>;

  // Analytics operations
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByTwitterAccount(twitterAccountId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  getLatestAnalytics(twitterAccountId: string): Promise<Analytics | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Twitter account operations
  async getTwitterAccountsByUserId(userId: string): Promise<TwitterAccount[]> {
    return await db
      .select()
      .from(twitterAccounts)
      .where(eq(twitterAccounts.userId, userId))
      .orderBy(desc(twitterAccounts.createdAt));
  }

  async createTwitterAccount(account: InsertTwitterAccount): Promise<TwitterAccount> {
    const [twitterAccount] = await db
      .insert(twitterAccounts)
      .values(account)
      .returning();
    return twitterAccount;
  }

  async updateTwitterAccount(id: string, updates: Partial<InsertTwitterAccount>): Promise<TwitterAccount | undefined> {
    const [updated] = await db
      .update(twitterAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(twitterAccounts.id, id))
      .returning();
    return updated;
  }

  async getTwitterAccountById(id: string): Promise<TwitterAccount | undefined> {
    const [account] = await db
      .select()
      .from(twitterAccounts)
      .where(eq(twitterAccounts.id, id));
    return account;
  }

  // Content topics operations
  async getAllContentTopics(): Promise<ContentTopic[]> {
    return await db
      .select()
      .from(contentTopics)
      .where(eq(contentTopics.isActive, true))
      .orderBy(contentTopics.name);
  }

  async createContentTopic(topic: InsertContentTopic): Promise<ContentTopic> {
    const [created] = await db
      .insert(contentTopics)
      .values(topic)
      .returning();
    return created;
  }

  async getUserTopics(userId: string): Promise<(UserTopic & { topic: ContentTopic })[]> {
    return await db
      .select({
        id: userTopics.id,
        userId: userTopics.userId,
        topicId: userTopics.topicId,
        createdAt: userTopics.createdAt,
        topic: contentTopics,
      })
      .from(userTopics)
      .innerJoin(contentTopics, eq(userTopics.topicId, contentTopics.id))
      .where(eq(userTopics.userId, userId));
  }

  async setUserTopics(userId: string, topicIds: string[]): Promise<void> {
    // Delete existing topics
    await db
      .delete(userTopics)
      .where(eq(userTopics.userId, userId));

    // Insert new topics
    if (topicIds.length > 0) {
      const topicData = topicIds.map(topicId => ({
        userId,
        topicId,
      }));
      await db.insert(userTopics).values(topicData);
    }
  }

  // Tweet operations
  async createTweet(tweet: InsertTweet): Promise<Tweet> {
    const [created] = await db
      .insert(tweets)
      .values(tweet)
      .returning();
    return created;
  }

  async getTweetsByUserId(userId: string): Promise<Tweet[]> {
    return await db
      .select()
      .from(tweets)
      .where(eq(tweets.userId, userId))
      .orderBy(desc(tweets.createdAt));
  }

  async getTweetsByStatus(userId: string, status: string): Promise<Tweet[]> {
    return await db
      .select()
      .from(tweets)
      .where(and(eq(tweets.userId, userId), eq(tweets.status, status)))
      .orderBy(desc(tweets.createdAt));
  }

  async updateTweet(id: string, updates: Partial<InsertTweet>): Promise<Tweet | undefined> {
    const [updated] = await db
      .update(tweets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tweets.id, id))
      .returning();
    return updated;
  }

  async getScheduledTweets(): Promise<Tweet[]> {
    const now = new Date();
    return await db
      .select()
      .from(tweets)
      .where(and(
        eq(tweets.status, 'scheduled'),
        eq(tweets.approvalStatus, 'approved'),
        lte(tweets.scheduledFor, now)
      ))
      .orderBy(tweets.scheduledFor);
  }

  async getTweetById(id: string): Promise<Tweet | undefined> {
    const [tweet] = await db
      .select()
      .from(tweets)
      .where(eq(tweets.id, id));
    return tweet;
  }

  // Analytics operations
  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [created] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return created;
  }

  async getAnalyticsByTwitterAccount(
    twitterAccountId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Analytics[]> {
    let query = db
      .select()
      .from(analytics)
      .where(eq(analytics.twitterAccountId, twitterAccountId));

    if (startDate && endDate) {
      query = db
        .select()
        .from(analytics)
        .where(and(
          eq(analytics.twitterAccountId, twitterAccountId),
          gte(analytics.date, startDate),
          lte(analytics.date, endDate)
        ));
    }

    return await query.orderBy(desc(analytics.date));
  }

  async getLatestAnalytics(twitterAccountId: string): Promise<Analytics | undefined> {
    const [latest] = await db
      .select()
      .from(analytics)
      .where(eq(analytics.twitterAccountId, twitterAccountId))
      .orderBy(desc(analytics.date))
      .limit(1);
    return latest;
  }
}

export const storage = new DatabaseStorage();
