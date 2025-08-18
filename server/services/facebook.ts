
interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface FacebookUserProfile {
  id: string;
  name: string;
  email: string;
  picture: {
    data: {
      url: string;
    };
  };
}

export class FacebookService {
  private apiBaseUrl = 'https://graph.facebook.com/v18.0';
  private oauthBaseUrl = 'https://www.facebook.com/v18.0/dialog/oauth';

  generateAuthUrl(userId: string): string {
    const clientId = process.env.FACEBOOK_APP_ID;
    if (!clientId) {
      throw new Error('Facebook App ID not configured');
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
    const redirectUri = `${baseUrl}/api/facebook/callback`;
    const state = userId;
    const scope = 'email,public_profile';
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope,
      response_type: 'code',
    });

    console.log('Generated Facebook auth URL with redirect:', redirectUri);
    return `${this.oauthBaseUrl}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string, userId: string): Promise<FacebookTokenResponse> {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Facebook OAuth credentials not configured');
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
    const redirectUri = `${baseUrl}/api/facebook/callback`;
    
    try {
      console.log('Exchanging code for tokens with redirect URI:', redirectUri);
      
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      });

      const response = await fetch(`${this.apiBaseUrl}/oauth/access_token?${params.toString()}`);

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Facebook token exchange error:', data);
        throw new Error(`Facebook token exchange failed: ${JSON.stringify(data)}`);
      }

      console.log('Successfully exchanged code for tokens');
      return data;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw new Error(`Failed to exchange code for tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserProfile(accessToken: string): Promise<FacebookUserProfile> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/me?fields=id,name,email,picture&access_token=${accessToken}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Facebook API error: ${JSON.stringify(data)}`);
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch user profile: ${errorMessage}`);
    }
  }
}

export const facebookService = new FacebookService();
