/**
 * Authentication service for Gmail OAuth2
 */

import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';
import open from 'open';
import { AuthConfig } from '../types/config.types.js';
import { createAuthError } from '../utils/error.util.js';

/**
 * Service for handling Gmail OAuth2 authentication
 */
export class AuthService {
  private oauth2Client: OAuth2Client | null = null;
  private readonly configDir: string;
  private readonly oauthPath: string;
  private readonly credentialsPath: string;

  constructor(private readonly config: AuthConfig = {}) {
    this.configDir = config.configDir || path.join(os.homedir(), '.gmail-mcp');
    this.oauthPath = config.oauthPath || path.join(this.configDir, 'gcp-oauth.keys.json');
    this.credentialsPath = config.credentialsPath || path.join(this.configDir, 'credentials.json');
  }

  /**
   * Loads OAuth credentials and initializes the OAuth2 client
   */
  async loadCredentials(): Promise<void> {
    try {
      // Create config directory if it doesn't exist
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      // Check for OAuth keys in current directory first, then in config directory
      const localOAuthPath = path.join(process.cwd(), 'gcp-oauth.keys.json');

      if (fs.existsSync(localOAuthPath)) {
        // If found in current directory, copy to config directory
        fs.copyFileSync(localOAuthPath, this.oauthPath);
        console.log('OAuth keys found in current directory, copied to global config.');
      }

      if (!fs.existsSync(this.oauthPath)) {
        throw createAuthError(
          `OAuth keys file not found. Please place gcp-oauth.keys.json in current directory or ${this.configDir}`
        );
      }

      const keysContent = JSON.parse(fs.readFileSync(this.oauthPath, 'utf8'));
      const keys = keysContent.installed || keysContent.web;

      if (!keys) {
        throw createAuthError(
          'Invalid OAuth keys file format. File should contain either "installed" or "web" credentials.'
        );
      }

      const callback = this.config.callbackUrl || 'http://localhost:3000/oauth2callback';

      this.oauth2Client = new OAuth2Client(
        keys.client_id,
        keys.client_secret,
        callback
      );

      if (fs.existsSync(this.credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
        this.oauth2Client.setCredentials(credentials);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw createAuthError(`Error loading credentials: ${error.message}`);
      }
      throw createAuthError('Unknown error loading credentials');
    }
  }

  /**
   * Performs OAuth2 authentication flow
   * @param callbackUrl - Optional custom callback URL for cloud environments
   */
  async authenticate(callbackUrl?: string): Promise<void> {
    if (!this.oauth2Client) {
      await this.loadCredentials();
    }

    if (!this.oauth2Client) {
      throw createAuthError('OAuth2 client not initialized');
    }

    const server = http.createServer();
    const port = 3000;
    server.listen(port);

    return new Promise<void>((resolve, reject) => {
      const finalCallbackUrl = callbackUrl || this.config.callbackUrl || 'http://localhost:3000/oauth2callback';
      
      // Update OAuth2 client with custom callback if provided
      if (callbackUrl && callbackUrl !== 'http://localhost:3000/oauth2callback') {
        const keysContent = JSON.parse(fs.readFileSync(this.oauthPath, 'utf8'));
        const keys = keysContent.installed || keysContent.web;
        if (this.oauth2Client) {
          this.oauth2Client = new OAuth2Client(
            keys.client_id,
            keys.client_secret,
            callbackUrl
          );
        }
      }

      if (!this.oauth2Client) {
        throw createAuthError('OAuth2 client not initialized');
      }

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.settings.basic',
        ],
      });

      console.log('Please visit this URL to authenticate:', authUrl);
      open(authUrl);

      server.on('request', async (req, res) => {
        if (!req.url?.startsWith('/oauth2callback')) {
          return;
        }

        const url = new URL(req.url, finalCallbackUrl);
        const code = url.searchParams.get('code');

        if (!code) {
          res.writeHead(400);
          res.end('No code provided');
          reject(createAuthError('No authorization code provided'));
          server.close();
          return;
        }

        try {
          const { tokens } = await this.oauth2Client!.getToken(code);
          this.oauth2Client!.setCredentials(tokens);
          fs.writeFileSync(this.credentialsPath, JSON.stringify(tokens, null, 2));

          res.writeHead(200);
          res.end('Authentication successful! You can close this window.');
          server.close();
          resolve();
        } catch (error) {
          res.writeHead(500);
          res.end('Authentication failed');
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          reject(createAuthError(`Authentication failed: ${errorMessage}`));
          server.close();
        }
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        server.close();
        reject(createAuthError('Authentication timeout'));
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Gets the OAuth2 client instance
   * @returns OAuth2Client instance
   */
  getOAuth2Client(): OAuth2Client {
    if (!this.oauth2Client) {
      throw createAuthError('OAuth2 client not initialized. Call loadCredentials() first.');
    }
    return this.oauth2Client;
  }

  /**
   * Checks if the user is authenticated
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    if (!this.oauth2Client) {
      return false;
    }
    const credentials = this.oauth2Client.credentials;
    return !!(credentials.access_token || credentials.refresh_token);
  }

  /**
   * Gets the credentials file path
   * @returns Path to credentials file
   */
  getCredentialsPath(): string {
    return this.credentialsPath;
  }
}

