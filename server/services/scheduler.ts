import { storage } from '../storage';
import { twitterService } from './twitter';
import cron from 'node-cron';

class SchedulerService {
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    // Check for scheduled tweets every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledTweets();
    });

    this.isRunning = true;
    console.log('Tweet scheduler started');
  }

  stop() {
    this.isRunning = false;
    console.log('Tweet scheduler stopped');
  }

  async processScheduledTweets() {
    try {
      const scheduledTweets = await storage.getScheduledTweets();
      
      for (const tweet of scheduledTweets) {
        try {
          const twitterAccount = await storage.getTwitterAccountById(tweet.twitterAccountId);
          if (!twitterAccount) {
            console.error(`Twitter account not found for tweet ${tweet.id}`);
            continue;
          }

          let accessToken = twitterAccount.accessToken;

          // Check if token needs refresh
          if (twitterAccount.tokenExpiresAt && new Date() >= twitterAccount.tokenExpiresAt) {
            if (twitterAccount.refreshToken) {
              try {
                const tokens = await twitterService.refreshAccessToken(twitterAccount.refreshToken);
                accessToken = tokens.access_token;
                
                // Update stored tokens
                await storage.updateTwitterAccount(twitterAccount.id, {
                  accessToken,
                  refreshToken: tokens.refresh_token || twitterAccount.refreshToken,
                  tokenExpiresAt: new Date(Date.now() + 7200 * 1000), // 2 hours
                });
              } catch (error) {
                console.error(`Failed to refresh token for account ${twitterAccount.id}:`, error);
                await storage.updateTweet(tweet.id, { 
                  status: 'failed',
                  updatedAt: new Date()
                });
                continue;
              }
            } else {
              console.error(`No refresh token available for account ${twitterAccount.id}`);
              await storage.updateTweet(tweet.id, { 
                status: 'failed',
                updatedAt: new Date()
              });
              continue;
            }
          }

          // Post the tweet
          const twitterTweetId = await twitterService.postTweet(accessToken, tweet.content);
          
          if (twitterTweetId) {
            await storage.updateTweet(tweet.id, {
              status: 'posted',
              postedAt: new Date(),
              twitterTweetId,
              updatedAt: new Date()
            });
            
            console.log(`Successfully posted tweet ${tweet.id} as ${twitterTweetId}`);
          } else {
            throw new Error('Failed to get tweet ID from Twitter API');
          }
        } catch (error) {
          console.error(`Failed to post scheduled tweet ${tweet.id}:`, error);
          await storage.updateTweet(tweet.id, { 
            status: 'failed',
            updatedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error processing scheduled tweets:', error);
    }
  }

  async scheduleImmediatePost(tweetId: string): Promise<void> {
    const tweet = await storage.getTweetById(tweetId);
    if (!tweet) {
      throw new Error('Tweet not found');
    }

    // Update tweet to be scheduled for immediate posting
    await storage.updateTweet(tweetId, {
      scheduledFor: new Date(),
      status: 'scheduled',
      approvalStatus: 'approved',
      updatedAt: new Date()
    });
  }
}

export const schedulerService = new SchedulerService();

// Auto-start the scheduler when the service is imported
schedulerService.start();
