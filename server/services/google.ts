
interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export class GoogleService {
  private apiBaseUrl = 'https://www.googleapis.com/oauth2/v2';
  private oauthBaseUrl = 'https://oauth2.googleapis.com';

  generateAuthUrl(userId: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google Client ID not configured');
    }

    // Get the correct domain from Replit environment
    let baseUrl;
    if (process.env.REPLIT_DOMAINS) {
      const domain = process.env.REPLIT_DOMAINS.split(',')[0];
      baseUrl = `https://${domain}`;
    } else if (process.env.REPL_SLUG) {
      baseUrl = `https://${process.env.REPL_SLUG}.replit.dev`;
    } else {
      baseUrl = 'http://0.0.0.0:5000';
    }
    const redirectUri = `${baseUrl}/api/google/callback`;
    const state = userId;
    const scope = 'openid email profile';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    console.log('Generated Google auth URL with redirect:', redirectUri);
    return `${this.oauthBaseUrl}/auth?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, userId: string): Promise<GoogleTokenResponse> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Get the correct domain from Replit environment
    let baseUrl;
    if (process.env.REPLIT_DOMAINS) {
      const domain = process.env.REPLIT_DOMAINS.split(',')[0];
      baseUrl = `https://${domain}`;
    } else if (process.env.REPL_SLUG) {
      baseUrl = `https://${process.env.REPL_SLUG}.replit.dev`;
    } else {
      baseUrl = 'http://0.0.0.0:5000';
    }
    const redirectUri = `${baseUrl}/api/google/callback`;
    
    try {
      console.log('Exchanging code for tokens with redirect URI:', redirectUri);
      
      const response = await fetch(`${this.oauthBaseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Google token exchange error:', data);
        throw new Error(`Google token exchange failed: ${JSON.stringify(data)}`);
      }

      console.log('Successfully exchanged code for tokens');
      return data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Google API error: ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch user profile: ${errorMessage}`);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Google OAuth credentials not configured');
      }

      const response = await fetch(`${this.oauthBaseUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Google OAuth error: ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to refresh access token: ${errorMessage}`);
    }
  }
}

export const googleService = new GoogleService();
