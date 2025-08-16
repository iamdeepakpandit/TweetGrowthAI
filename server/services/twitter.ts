interface TwitterAPIResponse {
  data?: any;
  errors?: any[];
}

export class TwitterService {
  private apiBaseUrl = 'https://api.twitter.com/2';
  private oauthBaseUrl = 'https://api.twitter.com/2/oauth2';

  generateAuthUrl(userId: string): string {
    const clientId = process.env.TWITTER_CLIENT_ID;
    if (!clientId) {
      throw new Error('Twitter Client ID not configured');
    }

    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.REPL_SLUG;
    const baseUrl = domain ? `https://${domain}.replit.dev` : 'http://0.0.0.0:5000';
    const redirectUri = `${baseUrl}/api/twitter/callback`;
    const state = userId; // Use userId as state for security
    const scope = 'tweet.read tweet.write users.read offline.access';
    
    // Generate a proper code challenge for PKCE
    const codeChallenge = Buffer.from('tweetbot-challenge-' + userId).toString('base64url');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'plain',
    });

    console.log('Generated auth URL with redirect:', redirectUri);
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, userId: string): Promise<{access_token: string, refresh_token?: string}> {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Twitter OAuth credentials not configured');
    }

    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || process.env.REPL_SLUG;
    const baseUrl = domain ? `https://${domain}.replit.dev` : 'http://0.0.0.0:5000';
    const redirectUri = `${baseUrl}/api/twitter/callback`;
    
    // Generate the same code verifier as used in the auth URL
    const codeVerifier = 'tweetbot-challenge-' + userId;
    
    try {
      console.log('Exchanging code for tokens with redirect URI:', redirectUri);
      
      const response = await fetch(`${this.oauthBaseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: clientId,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Twitter token exchange error:', data);
        throw new Error(`Twitter token exchange failed: ${JSON.stringify(data)}`);
      }

      console.log('Successfully exchanged code for tokens');
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

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

  
}

export const twitterService = new TwitterService();
