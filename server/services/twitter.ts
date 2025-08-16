interface TwitterAPIResponse {
  data?: any;
  errors?: any[];
}

export class TwitterService {
  private apiBaseUrl = 'https://api.twitter.com/2';

  async postTweet(accessToken: string, content: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: content
        }),
      });

      const data: TwitterAPIResponse = await response.json();

      if (!response.ok) {
        throw new Error(`Twitter API error: ${JSON.stringify(data.errors)}`);
      }

      return data.data?.id || null;
    } catch (error) {
      console.error('Failed to post tweet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to post tweet: ${errorMessage}`);
    }
  }

  async getUserProfile(accessToken: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/users/me?user.fields=public_metrics,profile_image_url`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data: TwitterAPIResponse = await response.json();

      if (!response.ok) {
        throw new Error(`Twitter API error: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch user profile: ${errorMessage}`);
    }
  }

  async getTweetMetrics(accessToken: string, tweetId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/tweets/${tweetId}?tweet.fields=public_metrics`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data: TwitterAPIResponse = await response.json();

      if (!response.ok) {
        throw new Error(`Twitter API error: ${JSON.stringify(data.errors)}`);
      }

      return data.data?.public_metrics || {};
    } catch (error) {
      console.error('Failed to fetch tweet metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch tweet metrics: ${errorMessage}`);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string }> {
    try {
      const clientId = process.env.TWITTER_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Twitter OAuth credentials not configured');
      }

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Twitter OAuth error: ${JSON.stringify(data)}`);
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to refresh access token: ${errorMessage}`);
    }
  }

  generateAuthUrl(userId: string): string {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twitter/callback`);
    const state = userId; // Use user ID as state for security
    
    const scopes = [
      'tweet.read',
      'tweet.write', 
      'users.read',
      'offline.access'
    ].join('%20');

    return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
  }

  async exchangeCodeForTokens(code: string, userId: string): Promise<{ access_token: string; refresh_token: string }> {
    try {
      const clientId = process.env.TWITTER_CLIENT_ID;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET;
      const redirectUri = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/twitter/callback`;

      if (!clientId || !clientSecret) {
        throw new Error('Twitter OAuth credentials not configured');
      }

      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: 'challenge',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Twitter OAuth error: ${JSON.stringify(data)}`);
      }

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to exchange code for tokens: ${errorMessage}`);
    }
  }
}

export const twitterService = new TwitterService();
