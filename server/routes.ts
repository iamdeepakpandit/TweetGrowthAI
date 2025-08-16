import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateTweetContent, generateMultipleTweets } from "./services/openai";
import { twitterService } from "./services/twitter";
import { schedulerService } from "./services/scheduler";
import { insertTwitterAccountSchema, insertTweetSchema, insertUserTopicSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default content topics
  await initializeContentTopics();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Twitter Account Routes
  app.get('/api/twitter/accounts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getTwitterAccountsByUserId(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching Twitter accounts:", error);
      res.status(500).json({ message: "Failed to fetch Twitter accounts" });
    }
  });

  app.get('/api/twitter/auth-url', isAuthenticated, async (req: any, res) => {
    try {
      // Check if Twitter credentials are configured
      const clientId = process.env.TWITTER_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error("Twitter OAuth credentials not configured");
        return res.status(500).json({ 
          message: "Twitter OAuth credentials not configured. Please add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to your environment variables." 
        });
      }

      const userId = req.user.claims.sub;
      const authUrl = twitterService.generateAuthUrl(userId);
      console.log("Generated Twitter auth URL for user:", userId);
      res.json({ authUrl });
    } catch (error) {
      console.error("Error generating Twitter auth URL:", error);
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });

  app.get('/api/twitter/callback', async (req, res) => {
    try {
      const { code, state, error } = req.query;
      const userId = state as string;

      console.log("Twitter callback received:", { code: !!code, state: userId, error });

      if (error) {
        console.error("Twitter OAuth error:", error);
        return res.redirect(`/?error=twitter_oauth_error&details=${encodeURIComponent(error as string)}`);
      }

      if (!code || !userId) {
        console.error("Missing code or state parameter", { code: !!code, userId: !!userId });
        return res.redirect(`/?error=missing_parameters`);
      }

      console.log("Exchanging code for tokens for user:", userId);
      const tokens = await twitterService.exchangeCodeForTokens(code as string, userId);
      
      console.log("Getting user profile...");
      const profile = await twitterService.getUserProfile(tokens.access_token);
      console.log("Got profile for user:", profile.username);

      // Check if account already exists for this user
      const existingAccounts = await storage.getTwitterAccountsByUserId(userId);
      const existingAccount = existingAccounts.find(acc => acc.twitterUserId === profile.id);

      if (existingAccount) {
        // Update existing account
        await storage.updateTwitterAccount(existingAccount.id, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + 7200 * 1000), // 2 hours
          isActive: true,
          followerCount: profile.public_metrics?.followers_count || 0,
          followingCount: profile.public_metrics?.following_count || 0,
          updatedAt: new Date()
        });
        console.log("Updated existing Twitter account:", profile.username);
      } else {
        // Create new account
        const twitterAccount = await storage.createTwitterAccount({
          userId,
          twitterUserId: profile.id,
          username: profile.username,
          displayName: profile.name || profile.username,
          profileImageUrl: profile.profile_image_url,
          followerCount: profile.public_metrics?.followers_count || 0,
          followingCount: profile.public_metrics?.following_count || 0,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + 7200 * 1000), // 2 hours
          isActive: true,
        });
        console.log("Created new Twitter account:", profile.username);
      }

      res.redirect(`/?connected=true`);
    } catch (error) {
      console.error("Error in Twitter callback:", error);
      res.redirect(`/?error=twitter_connection_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
    }
  });

  // Disconnect Twitter account
  app.delete('/api/twitter/accounts/:accountId', isAuthenticated, async (req: any, res) => {
    try {
      const { accountId } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify account belongs to user before deletion
      const account = await storage.getTwitterAccountById(accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ error: 'Account not found' });
      }
      
      await storage.deleteTwitterAccount(accountId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting Twitter account:', error);
      res.status(500).json({ error: 'Failed to disconnect account' });
    }
  });

  // Content Topics Routes
  app.get('/api/content-topics', isAuthenticated, async (req, res) => {
    try {
      const topics = await storage.getAllContentTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching content topics:", error);
      res.status(500).json({ message: "Failed to fetch content topics" });
    }
  });

  app.get('/api/user-topics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userTopics = await storage.getUserTopics(userId);
      res.json(userTopics);
    } catch (error) {
      console.error("Error fetching user topics:", error);
      res.status(500).json({ message: "Failed to fetch user topics" });
    }
  });

  app.post('/api/user-topics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topicIds } = req.body;
      
      if (!Array.isArray(topicIds)) {
        return res.status(400).json({ message: "topicIds must be an array" });
      }

      await storage.setUserTopics(userId, topicIds);
      const updatedTopics = await storage.getUserTopics(userId);
      
      res.json(updatedTopics);
    } catch (error) {
      console.error("Error updating user topics:", error);
      res.status(500).json({ message: "Failed to update user topics" });
    }
  });

  // Content Generation Routes
  app.post('/api/generate-content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { topicIds, style, length, includeHashtags, includeEmojis, count = 1 } = req.body;

      // Get topic names
      const userTopics = await storage.getUserTopics(userId);
      const selectedTopics = userTopics
        .filter(ut => topicIds?.includes(ut.topicId))
        .map(ut => ut.topic.name);

      if (selectedTopics.length === 0) {
        return res.status(400).json({ message: "No valid topics selected" });
      }

      const options = {
        topics: selectedTopics,
        style,
        length,
        includeHashtags,
        includeEmojis,
      };

      let generatedContent;
      if (count > 1) {
        generatedContent = await generateMultipleTweets(options, count);
      } else {
        generatedContent = [await generateTweetContent(options)];
      }

      res.json({ content: generatedContent });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Tweet Routes
  app.get('/api/tweets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.query;
      
      let tweets;
      if (status) {
        tweets = await storage.getTweetsByStatus(userId, status as string);
      } else {
        tweets = await storage.getTweetsByUserId(userId);
      }
      
      res.json(tweets);
    } catch (error) {
      console.error("Error fetching tweets:", error);
      res.status(500).json({ message: "Failed to fetch tweets" });
    }
  });

  app.post('/api/tweets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tweetData = insertTweetSchema.parse({
        ...req.body,
        userId,
      });

      const tweet = await storage.createTweet(tweetData);
      res.json(tweet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tweet data", errors: error.errors });
      }
      console.error("Error creating tweet:", error);
      res.status(500).json({ message: "Failed to create tweet" });
    }
  });

  app.patch('/api/tweets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const tweet = await storage.updateTweet(id, updates);
      if (!tweet) {
        return res.status(404).json({ message: "Tweet not found" });
      }
      
      res.json(tweet);
    } catch (error) {
      console.error("Error updating tweet:", error);
      res.status(500).json({ message: "Failed to update tweet" });
    }
  });

  app.post('/api/tweets/:id/post-now', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await schedulerService.scheduleImmediatePost(id);
      res.json({ message: "Tweet scheduled for immediate posting" });
    } catch (error) {
      console.error("Error scheduling immediate post:", error);
      res.status(500).json({ message: "Failed to schedule tweet" });
    }
  });

  // Analytics Routes
  app.get('/api/analytics/:twitterAccountId', isAuthenticated, async (req, res) => {
    try {
      const { twitterAccountId } = req.params;
      const { startDate, endDate } = req.query;
      
      const analytics = await storage.getAnalyticsByTwitterAccount(
        twitterAccountId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/dashboard-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's Twitter accounts
      const twitterAccounts = await storage.getTwitterAccountsByUserId(userId);
      
      if (twitterAccounts.length === 0) {
        return res.json({
          followerCount: 0,
          engagementRate: 0,
          tweetsThisMonth: 0,
          pendingApprovals: 0,
        });
      }

      // Get tweets
      const allTweets = await storage.getTweetsByUserId(userId);
      const pendingTweets = await storage.getTweetsByStatus(userId, 'draft');
      
      // Calculate this month's tweets
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const tweetsThisMonth = allTweets.filter(tweet => 
        tweet.createdAt && new Date(tweet.createdAt) >= thisMonth
      ).length;

      // Get primary account stats
      const primaryAccount = twitterAccounts[0];
      const latestAnalytics = await storage.getLatestAnalytics(primaryAccount.id);
      
      res.json({
        followerCount: primaryAccount.followerCount || 0,
        engagementRate: latestAnalytics?.engagementRate || 0,
        tweetsThisMonth,
        pendingApprovals: pendingTweets.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeContentTopics() {
  try {
    const existingTopics = await storage.getAllContentTopics();
    
    if (existingTopics.length === 0) {
      const defaultTopics = [
        { name: 'Technology', icon: 'fas fa-laptop-code', description: 'Latest tech trends, programming, and software development' },
        { name: 'Business', icon: 'fas fa-chart-line', description: 'Business insights, entrepreneurship, and industry news' },
        { name: 'Innovation', icon: 'fas fa-lightbulb', description: 'Breakthrough innovations and cutting-edge ideas' },
        { name: 'Movies', icon: 'fas fa-film', description: 'Film reviews, movie news, and entertainment' },
        { name: 'News', icon: 'fas fa-newspaper', description: 'Current events and trending news topics' },
        { name: 'Science', icon: 'fas fa-atom', description: 'Scientific discoveries and research' },
        { name: 'Health', icon: 'fas fa-heart', description: 'Health tips, wellness, and medical news' },
        { name: 'Education', icon: 'fas fa-graduation-cap', description: 'Learning resources and educational content' },
      ];

      for (const topic of defaultTopics) {
        await storage.createContentTopic(topic);
      }
      
      console.log('Initialized default content topics');
    }
  } catch (error) {
    console.error('Error initializing content topics:', error);
  }
}
