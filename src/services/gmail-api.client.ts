/**
 * Gmail API client wrapper
 */

import { google, gmail_v1 } from 'googleapis';
import { AuthService } from './auth.service.js';
import { createAPIError } from '../utils/error.util.js';

/**
 * Wrapper for Gmail API client
 */
export class GmailAPIClient {
  private gmail: gmail_v1.Gmail | null = null;

  constructor(private readonly authService: AuthService) {}

  /**
   * Gets the Gmail API instance, ensuring authentication
   * @returns Gmail API instance
   */
  async getGmailAPI(): Promise<gmail_v1.Gmail> {
    if (!this.gmail) {
      await this.ensureAuthenticated();
      const oauth2Client = this.authService.getOAuth2Client();
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    }
    return this.gmail;
  }

  /**
   * Ensures the user is authenticated
   * @throws Error if not authenticated
   */
  async ensureAuthenticated(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      throw createAPIError('Not authenticated. Please run authentication first.', 401);
    }
  }
}

