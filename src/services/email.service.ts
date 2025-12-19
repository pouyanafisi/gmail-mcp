/**
 * Email service for Gmail operations
 */

import { gmail_v1 } from 'googleapis';
import fs from 'fs';
import path from 'path';
import {
  SendEmailParams,
  EmailContent,
  EmailSearchResult,
  GmailMessagePart,
  EmailAttachment,
  EmailHeaders,
  ModifyEmailParams,
  BatchResult,
} from '../types/email.types.js';
import { GmailAPIClient } from './gmail-api.client.js';
import { EmailBuilder } from '../builders/email.builder.js';
import { createAPIError, createNotFoundError } from '../utils/error.util.js';

/**
 * Service for email operations
 */
export class EmailService {
  constructor(
    private readonly gmailClient: GmailAPIClient,
    private readonly emailBuilder: EmailBuilder
  ) {}

  /**
   * Sends an email
   * @param params - Email parameters
   * @returns Message ID of the sent email
   */
  async sendEmail(params: SendEmailParams): Promise<string> {
    const gmail = await this.gmailClient.getGmailAPI();
    const message = await this.emailBuilder.buildEmail(params);

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const messageRequest: gmail_v1.Schema$Message = {
      raw: encodedMessage,
    };

    if (params.threadId) {
      messageRequest.threadId = params.threadId;
    }

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: messageRequest,
      });

      if (!response.data.id) {
        throw createAPIError('Failed to send email: No message ID returned');
      }

      return response.data.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to send email: ${errorMessage}`);
    }
  }

  /**
   * Creates a draft email
   * @param params - Email parameters
   * @returns Draft ID
   */
  async createDraft(params: SendEmailParams): Promise<string> {
    const gmail = await this.gmailClient.getGmailAPI();
    const message = await this.emailBuilder.buildEmail(params);

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const messageRequest: gmail_v1.Schema$Message = {
      raw: encodedMessage,
    };

    if (params.threadId) {
      messageRequest.threadId = params.threadId;
    }

    try {
      const response = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: messageRequest,
        },
      });

      if (!response.data.id) {
        throw createAPIError('Failed to create draft: No draft ID returned');
      }

      return response.data.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to create draft: ${errorMessage}`);
    }
  }

  /**
   * Recursively extracts email content from MIME message parts
   * @param messagePart - Gmail message part
   * @returns Extracted email content
   */
  private extractEmailContent(messagePart: GmailMessagePart): { text: string; html: string } {
    let textContent = '';
    let htmlContent = '';

    if (messagePart.body && messagePart.body.data) {
      const content = Buffer.from(messagePart.body.data, 'base64').toString('utf8');

      if (messagePart.mimeType === 'text/plain') {
        textContent = content;
      } else if (messagePart.mimeType === 'text/html') {
        htmlContent = content;
      }
    }

    if (messagePart.parts && messagePart.parts.length > 0) {
      for (const part of messagePart.parts) {
        const { text, html } = this.extractEmailContent(part);
        if (text) textContent += text;
        if (html) htmlContent += html;
      }
    }

    return { text: textContent, html: htmlContent };
  }

  /**
   * Extracts attachment information from message parts
   * @param part - Gmail message part
   * @param attachments - Array to collect attachments
   */
  private extractAttachments(part: GmailMessagePart, attachments: EmailAttachment[]): void {
    if (part.body && part.body.attachmentId) {
      const filename = part.filename || `attachment-${part.body.attachmentId}`;
      attachments.push({
        id: part.body.attachmentId,
        filename: filename,
        mimeType: part.mimeType || 'application/octet-stream',
        size: part.body.size || 0,
      });
    }

    if (part.parts) {
      part.parts.forEach((subpart) => this.extractAttachments(subpart, attachments));
    }
  }

  /**
   * Reads an email by message ID
   * @param messageId - Gmail message ID
   * @returns Email content
   */
  async readEmail(messageId: string): Promise<EmailContent> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      if (!response.data.payload) {
        throw createNotFoundError(`Email with ID ${messageId} not found`);
      }

      const headers = response.data.payload.headers || [];
      const getHeader = (name: string): string => {
        const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
        return header?.value || '';
      };

      const emailHeaders: EmailHeaders = {
        subject: getHeader('subject'),
        from: getHeader('from'),
        to: getHeader('to'),
        date: getHeader('date'),
      };

      const cc = getHeader('cc');
      if (cc) emailHeaders.cc = cc;

      const bcc = getHeader('bcc');
      if (bcc) emailHeaders.bcc = bcc;

      const { text, html } = this.extractEmailContent(response.data.payload as GmailMessagePart);

      const attachments: EmailAttachment[] = [];
      this.extractAttachments(response.data.payload as GmailMessagePart, attachments);

      return {
        text: text || html || '',
        html: html || '',
        attachments,
        headers: emailHeaders,
        threadId: response.data.threadId || undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw createNotFoundError(`Email with ID ${messageId} not found`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to read email: ${errorMessage}`);
    }
  }


  /**
   * Searches for emails
   * @param query - Gmail search query
   * @param maxResults - Maximum number of results
   * @returns Array of email search results
   */
  async searchEmails(query: string, maxResults: number = 10): Promise<EmailSearchResult[]> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: Math.min(maxResults, 500),
      });

      const messages = response.data.messages || [];
      const results = await Promise.all(
        messages.map(async (msg) => {
          if (!msg.id) {
            throw createAPIError('Message ID missing in search results');
          }

          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['Subject', 'From', 'Date'],
          });

          const headers = detail.data.payload?.headers || [];
          const getHeader = (name: string): string => {
            const header = headers.find((h) => h.name === name);
            return header?.value || '';
          };

          return {
            id: msg.id,
            subject: getHeader('Subject'),
            from: getHeader('From'),
            date: getHeader('Date'),
          };
        })
      );

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to search emails: ${errorMessage}`);
    }
  }

  /**
   * Modifies email labels
   * @param messageId - Gmail message ID
   * @param params - Modification parameters
   */
  async modifyEmail(messageId: string, params: ModifyEmailParams): Promise<void> {
    const gmail = await this.gmailClient.getGmailAPI();

    const requestBody: gmail_v1.Schema$ModifyMessageRequest = {};

    if (params.addLabelIds && params.addLabelIds.length > 0) {
      requestBody.addLabelIds = params.addLabelIds;
    }

    if (params.removeLabelIds && params.removeLabelIds.length > 0) {
      requestBody.removeLabelIds = params.removeLabelIds;
    }

    try {
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: requestBody,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to modify email: ${errorMessage}`);
    }
  }

  /**
   * Deletes an email
   * @param messageId - Gmail message ID
   */
  async deleteEmail(messageId: string): Promise<void> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to delete email: ${errorMessage}`);
    }
  }

  /**
   * Downloads an email attachment
   * @param messageId - Gmail message ID
   * @param attachmentId - Attachment ID
   * @param savePath - Optional directory to save the file
   * @param filename - Optional custom filename
   * @returns Path to the downloaded file
   */
  async downloadAttachment(
    messageId: string,
    attachmentId: string,
    savePath?: string,
    filename?: string
  ): Promise<string> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      const attachmentResponse = await gmail.users.messages.attachments.get({
        userId: 'me',
        messageId: messageId,
        id: attachmentId,
      });

      if (!attachmentResponse.data.data) {
        throw createAPIError('No attachment data received');
      }

      const data = attachmentResponse.data.data;
      const buffer = Buffer.from(data, 'base64url');

      const finalSavePath = savePath || process.cwd();
      let finalFilename = filename;

      if (!finalFilename) {
        // Get original filename from message
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: messageId,
          format: 'full',
        });

        const findAttachment = (part: GmailMessagePart): string | null => {
          if (part.body && part.body.attachmentId === attachmentId) {
            return part.filename || `attachment-${attachmentId}`;
          }
          if (part.parts) {
            for (const subpart of part.parts) {
              const found = findAttachment(subpart);
              if (found) return found;
            }
          }
          return null;
        };

        finalFilename = findAttachment(messageResponse.data.payload as GmailMessagePart) || `attachment-${attachmentId}`;
      }

      if (!fs.existsSync(finalSavePath)) {
        fs.mkdirSync(finalSavePath, { recursive: true });
      }

      const fullPath = path.join(finalSavePath, finalFilename);
      fs.writeFileSync(fullPath, buffer);

      return fullPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to download attachment: ${errorMessage}`);
    }
  }

  /**
   * Processes operations in batches
   * @param items - Items to process
   * @param batchSize - Size of each batch
   * @param processFn - Function to process each batch
   * @returns Batch result with successes and failures
   */
  private async processBatches<T>(
    items: T[],
    batchSize: number,
    processFn: (batch: T[]) => Promise<void>
  ): Promise<BatchResult> {
    const successes: string[] = [];
    const failures: Array<{ item: string; error: string }> = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        await processFn(batch);
        batch.forEach((item) => successes.push(String(item)));
      } catch (error) {
        // If batch fails, try individual items
        for (const item of batch) {
          try {
            await processFn([item]);
            successes.push(String(item));
          } catch (itemError) {
            const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
            failures.push({ item: String(item), error: errorMessage });
          }
        }
      }
    }

    return { successes: successes.length, failures };
  }

  /**
   * Batch modifies emails
   * @param messageIds - Array of message IDs
   * @param params - Modification parameters
   * @param batchSize - Batch size (default: 50)
   * @returns Batch result
   */
  async batchModifyEmails(
    messageIds: string[],
    params: ModifyEmailParams,
    batchSize: number = 50
  ): Promise<BatchResult> {
    return this.processBatches(messageIds, batchSize, async (batch) => {
      await Promise.all(
        batch.map((messageId) => this.modifyEmail(messageId, params))
      );
    });
  }

  /**
   * Batch deletes emails
   * @param messageIds - Array of message IDs
   * @param batchSize - Batch size (default: 50)
   * @returns Batch result
   */
  async batchDeleteEmails(messageIds: string[], batchSize: number = 50): Promise<BatchResult> {
    return this.processBatches(messageIds, batchSize, async (batch) => {
      await Promise.all(
        batch.map((messageId) => this.deleteEmail(messageId))
      );
    });
  }
}

