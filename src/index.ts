#!/usr/bin/env node

/**
 * Gmail MCP Server Entry Point
 */

import { AuthService } from './services/auth.service.js';
import { GmailAPIClient } from './services/gmail-api.client.js';
import { EmailService } from './services/email.service.js';
import { LabelService } from './services/label.service.js';
import { FilterService } from './services/filter.service.js';
import { EmailBuilder } from './builders/email.builder.js';
import { createMCPServer, startMCPServer } from './server/mcp-server.js';

/**
 * Main function
 */
async function main() {
  // Handle authentication command
  if (process.argv[2] === 'auth') {
    const callbackUrl = process.argv[3];
    const authService = new AuthService({ callbackUrl });
    
    try {
      await authService.loadCredentials();
      await authService.authenticate(callbackUrl);
      console.log('Authentication completed successfully');
      process.exit(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Authentication failed:', errorMessage);
      process.exit(1);
    }
  }

  // Initialize services
  const authService = new AuthService({
    oauthPath: process.env.GMAIL_OAUTH_PATH,
    credentialsPath: process.env.GMAIL_CREDENTIALS_PATH,
  });

  try {
    await authService.loadCredentials();

    if (!authService.isAuthenticated()) {
      console.error('Not authenticated. Please run: npm run auth');
      process.exit(1);
    }

    const gmailClient = new GmailAPIClient(authService);
    const emailBuilder = new EmailBuilder();
    const emailService = new EmailService(gmailClient, emailBuilder);
    const labelService = new LabelService(gmailClient);
    const filterService = new FilterService(gmailClient);

    // Create MCP server
    const server = createMCPServer({
      emailService,
      labelService,
      filterService,
    });

    // Start server
    await startMCPServer(server);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Server error:', errorMessage);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

