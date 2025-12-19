#!/usr/bin/env tsx

/**
 * Test script for email count functionality
 */

import { AuthService } from './src/services/auth.service.js';
import { GmailAPIClient } from './src/services/gmail-api.client.js';
import { EmailService } from './src/services/email.service.js';
import { EmailBuilder } from './src/builders/email.builder.js';
import { LabelService } from './src/services/label.service.js';

async function testEmailCount() {
  try {
    console.log('Initializing services...');
    const authService = new AuthService();
    await authService.loadCredentials();

    if (!authService.isAuthenticated()) {
      console.error('Not authenticated. Please run: npm run auth');
      process.exit(1);
    }

    const gmailClient = new GmailAPIClient(authService);
    const emailBuilder = new EmailBuilder();
    const emailService = new EmailService(gmailClient, emailBuilder);
    const labelService = new LabelService(gmailClient);

    console.log('\n📊 Getting email counts using Gmail API...\n');

    // Test count_emails with different queries
    const queries = [
      { name: 'All emails', query: 'in:all' },
      { name: 'Inbox', query: 'in:inbox' },
      { name: 'Unread', query: 'is:unread' },
      { name: 'Starred', query: 'is:starred' },
    ];

    for (const { name, query } of queries) {
      const count = await emailService.getEmailCount(query);
      console.log(`${name}: ${count.estimatedTotal.toLocaleString()} emails`);
    }

    // Test label-based counts (exact counts)
    console.log('\n📋 Getting exact counts from label metadata...\n');
    const labels = await labelService.listLabels();
    
    // Get counts for common system labels
    const commonLabels = ['INBOX', 'UNREAD', 'STARRED', 'SENT'];
    for (const labelName of commonLabels) {
      const label = labels.all.find(l => l.name === labelName);
      if (label) {
        const labelCount = await labelService.getLabelEmailCount(label.id);
        console.log(`${labelName}: ${labelCount.messagesTotal.toLocaleString()} total, ${labelCount.messagesUnread.toLocaleString()} unread`);
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Note: resultSizeEstimate provides fast approximate counts.');
    console.log('   Label metadata provides exact counts but only for specific labels.');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testEmailCount();

