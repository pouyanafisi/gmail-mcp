/**
 * Configuration-related type definitions
 */

import { OAuth2Client } from 'google-auth-library';

/**
 * Authentication configuration
 */
export interface AuthConfig {
  oauthPath?: string;
  credentialsPath?: string;
  configDir?: string;
  callbackUrl?: string;
}

/**
 * Server configuration
 */
export interface ServerConfig {
  name: string;
  version: string;
}

/**
 * OAuth2 client wrapper
 */
export interface OAuth2ClientWrapper {
  client: OAuth2Client;
  isAuthenticated: boolean;
}

