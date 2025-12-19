/**
 * Email-related type definitions
 */

/**
 * Email attachment information
 */
export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

/**
 * Email content (text and HTML)
 */
export interface EmailContent {
  text: string;
  html: string;
  attachments: EmailAttachment[];
  headers: EmailHeaders;
  threadId?: string;
}

/**
 * Email headers
 */
export interface EmailHeaders {
  subject: string;
  from: string;
  to: string;
  date: string;
  cc?: string;
  bcc?: string;
}

/**
 * Gmail message part structure
 */
export interface GmailMessagePart {
  partId?: string;
  mimeType?: string;
  filename?: string;
  headers?: Array<{
    name: string;
    value: string;
  }>;
  body?: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailMessagePart[];
}

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
  to: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  mimeType?: 'text/plain' | 'text/html' | 'multipart/alternative';
  cc?: string[];
  bcc?: string[];
  threadId?: string;
  inReplyTo?: string;
  attachments?: string[];
}

/**
 * Parameters for reading an email
 */
export interface ReadEmailParams {
  messageId: string;
}

/**
 * Parameters for searching emails
 */
export interface SearchEmailParams {
  query: string;
  maxResults?: number;
}

/**
 * Parameters for modifying an email
 */
export interface ModifyEmailParams {
  addLabelIds?: string[];
  removeLabelIds?: string[];
}

/**
 * Parameters for downloading an attachment
 */
export interface DownloadAttachmentParams {
  messageId: string;
  attachmentId: string;
  filename?: string;
  savePath?: string;
}

/**
 * Email search result
 */
export interface EmailSearchResult {
  id: string;
  subject: string;
  from: string;
  date: string;
}

/**
 * Batch operation result
 */
export interface BatchResult {
  successes: number;
  failures: Array<{
    item: string;
    error: string;
  }>;
}

/**
 * Label email count (exact counts from label metadata)
 */
export interface LabelEmailCount {
  labelId: string;
  labelName: string;
  messagesTotal: number;
  messagesUnread: number;
}

