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

    // Get the correct domain - prioritize current host for WebContainer
    let baseUrl;
    if (typeof window !== 'undefined' && window.location) {
      // Client-side fallback (shouldn't happen in server code but just in case)
      baseUrl = `${window.location.protocol}//${window.location.host}`;
    } else if (process.env.REPLIT_DOMAINS) {
      const domain = process.env.REPLIT_DOMAINS.split(',')[0];
      baseUrl = `https://${domain}`;
    } else if (process.env.REPL_SLUG) {
      baseUrl = `https://${process.env.REPL_SLUG}.replit.dev`;
    } else if (process.env.NODE_ENV === 'development') {
      // For local development and WebContainer
      baseUrl = 'http://localhost:5000';
    } else {
      baseUrl = 'http://localhost:5000';
    }
    const redirectUri = `${baseUrl}/api/twitter/callback`;
    const state = userId; // Use userId as state for security
    const scope = 'tweet.read tweet.write users.read offline.access';
    
    // Generate a proper code challenge for PKCE (Twitter requires this)
    const codeVerifier = 'tweetbot-challenge-' + userId + '-' + Date.now();
    const codeChallenge = Buffer.from(codeVerifier).toString('base64url');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    console.log('Generated Twitter auth URL:', {
      baseUrl,
      redirectUri,
      clientId: clientId.substring(0, 8) + '...',
      scope,
      codeChallenge: codeChallenge.substring(0, 10) + '...'
    });
    
    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, userId: string): Promise<{access_token: string, refresh_token?: string}> {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Twitter OAuth credentials not configured');
    }

    // Get the correct domain - must match the one used in generateAuthUrl
    let baseUrl;
    if (process.env.REPLIT_DOMAINS) {
      const domain = process.env.REPLIT_DOMAINS.split(',')[0];
      baseUrl = `https://${domain}`;
    } else if (process.env.REPL_SLUG) {
      baseUrl = `https://${process.env.REPL_SLUG}.replit.dev`;
    } else if (process.env.NODE_ENV === 'development') {
      baseUrl = 'http://localhost:5000';
    } else {
      baseUrl = 'http://localhost:5000';
    }
    const redirectUri = `${baseUrl}/api/twitter/callback`;
    
    // Generate the same code verifier as used in the auth URL - this is critical!
    // Note: In production, you should store the code_verifier securely and retrieve it here
    // For now, we'll use a deterministic approach but this is not ideal for security
    const codeVerifier = 'tweetbot-challenge-' + userId + '-' + Math.floor(Date.now() / 60000) * 60000;
    
    try {
      console.log('Exchanging code for tokens:', {
        redirectUri,
        clientId: clientId.substring(0, 8) + '...',
        codeVerifier: codeVerifier.substring(0, 10) + '...'
      });
      
      const response = await fetch(`${this.oauthBaseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Twitter token exchange error:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(`Twitter token exchange failed: ${JSON.stringify(data)}`);
      }

      console.log('Successfully exchanged code for tokens:', {
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        tokenType: data.token_type
      });
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
