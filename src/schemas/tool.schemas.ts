/**
 * Zod schemas for tool input validation
 */

import { z } from 'zod';

/**
 * Schema for sending an email
 */
export const SendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1).describe('List of recipient email addresses'),
  subject: z.string().min(1).describe('Email subject'),
  body: z.string().describe('Email body content (used for text/plain or when htmlBody not provided)'),
  htmlBody: z.string().optional().describe('HTML version of the email body'),
  mimeType: z.enum(['text/plain', 'text/html', 'multipart/alternative']).optional().default('text/plain').describe('Email content type'),
  cc: z.array(z.string().email()).optional().describe('List of CC recipients'),
  bcc: z.array(z.string().email()).optional().describe('List of BCC recipients'),
  threadId: z.string().optional().describe('Thread ID to reply to'),
  inReplyTo: z.string().optional().describe('Message ID being replied to'),
  attachments: z.array(z.string()).optional().describe('List of file paths to attach to the email'),
});

/**
 * Schema for reading an email
 */
export const ReadEmailSchema = z.object({
  messageId: z.string().min(1).describe('ID of the email message to retrieve'),
});

/**
 * Schema for searching emails
 */
export const SearchEmailsSchema = z.object({
  query: z.string().min(1).describe('Gmail search query (e.g., "from:example@gmail.com")'),
  maxResults: z.number().int().positive().max(500).optional().default(10).describe('Maximum number of results to return'),
});

/**
 * Schema for counting emails (exact counts from label metadata)
 */
export const CountEmailsSchema = z.object({
  labelId: z.string().optional().describe('Label ID to get exact count for (e.g., "INBOX", "UNREAD", "STARRED", "SENT", or user label ID)'),
  labelName: z.string().optional().describe('Label name to get exact count for (e.g., "INBOX", "UNREAD", "STARRED", "SENT", or user label name). If provided, will look up the label ID.'),
}).refine((data) => data.labelId || data.labelName, {
  message: 'Either labelId or labelName must be provided',
});

/**
 * Schema for modifying an email
 */
export const ModifyEmailSchema = z.object({
  messageId: z.string().min(1).describe('ID of the email message to modify'),
  addLabelIds: z.array(z.string()).optional().describe('List of label IDs to add to the message'),
  removeLabelIds: z.array(z.string()).optional().describe('List of label IDs to remove from the message'),
});

/**
 * Schema for deleting an email
 */
export const DeleteEmailSchema = z.object({
  messageId: z.string().min(1).describe('ID of the email message to delete'),
});

/**
 * Schema for downloading an attachment
 */
export const DownloadAttachmentSchema = z.object({
  messageId: z.string().min(1).describe('ID of the email message containing the attachment'),
  attachmentId: z.string().min(1).describe('ID of the attachment to download'),
  filename: z.string().optional().describe('Filename to save the attachment as (if not provided, uses original filename)'),
  savePath: z.string().optional().describe('Directory path to save the attachment (defaults to current directory)'),
});

/**
 * Schema for listing email labels
 */
export const ListEmailLabelsSchema = z.object({}).describe('Retrieves all available Gmail labels');

/**
 * Schema for creating a label
 */
export const CreateLabelSchema = z.object({
  name: z.string().min(1).max(225).describe('Name for the new label'),
  messageListVisibility: z.enum(['show', 'hide']).optional().describe('Whether to show or hide the label in the message list'),
  labelListVisibility: z.enum(['labelShow', 'labelShowIfUnread', 'labelHide']).optional().describe('Visibility of the label in the label list'),
}).describe('Creates a new Gmail label');

/**
 * Schema for updating a label
 */
export const UpdateLabelSchema = z.object({
  id: z.string().min(1).describe('ID of the label to update'),
  name: z.string().min(1).max(225).optional().describe('New name for the label'),
  messageListVisibility: z.enum(['show', 'hide']).optional().describe('Whether to show or hide the label in the message list'),
  labelListVisibility: z.enum(['labelShow', 'labelShowIfUnread', 'labelHide']).optional().describe('Visibility of the label in the label list'),
}).describe('Updates an existing Gmail label');

/**
 * Schema for deleting a label
 */
export const DeleteLabelSchema = z.object({
  id: z.string().min(1).describe('ID of the label to delete'),
}).describe('Deletes a Gmail label');

/**
 * Schema for getting or creating a label
 */
export const GetOrCreateLabelSchema = z.object({
  name: z.string().min(1).max(225).describe('Name of the label to get or create'),
  messageListVisibility: z.enum(['show', 'hide']).optional().describe('Whether to show or hide the label in the message list'),
  labelListVisibility: z.enum(['labelShow', 'labelShowIfUnread', 'labelHide']).optional().describe('Visibility of the label in the label list'),
}).describe('Gets an existing label by name or creates it if it doesn\'t exist');

/**
 * Schema for creating a filter
 */
export const CreateFilterSchema = z.object({
  criteria: z.object({
    from: z.string().email().optional().describe('Sender email address to match'),
    to: z.string().email().optional().describe('Recipient email address to match'),
    subject: z.string().optional().describe('Subject text to match'),
    query: z.string().optional().describe('Gmail search query (e.g., "has:attachment")'),
    negatedQuery: z.string().optional().describe('Text that must NOT be present'),
    hasAttachment: z.boolean().optional().describe('Whether to match emails with attachments'),
    excludeChats: z.boolean().optional().describe('Whether to exclude chat messages'),
    size: z.number().int().positive().optional().describe('Email size in bytes'),
    sizeComparison: z.enum(['unspecified', 'smaller', 'larger']).optional().describe('Size comparison operator'),
  }).describe('Criteria for matching emails'),
  action: z.object({
    addLabelIds: z.array(z.string()).optional().describe('Label IDs to add to matching emails'),
    removeLabelIds: z.array(z.string()).optional().describe('Label IDs to remove from matching emails'),
    forward: z.string().email().optional().describe('Email address to forward matching emails to'),
  }).describe('Actions to perform on matching emails'),
}).describe('Creates a new Gmail filter');

/**
 * Schema for listing filters
 */
export const ListFiltersSchema = z.object({}).describe('Retrieves all Gmail filters');

/**
 * Schema for getting a filter
 */
export const GetFilterSchema = z.object({
  filterId: z.string().min(1).describe('ID of the filter to retrieve'),
}).describe('Gets details of a specific Gmail filter');

/**
 * Schema for deleting a filter
 */
export const DeleteFilterSchema = z.object({
  filterId: z.string().min(1).describe('ID of the filter to delete'),
}).describe('Deletes a Gmail filter');

/**
 * Schema for creating a filter from a template
 */
export const CreateFilterFromTemplateSchema = z.object({
  template: z.enum(['fromSender', 'withSubject', 'withAttachments', 'largeEmails', 'containingText', 'mailingList']).describe('Pre-defined filter template to use'),
  parameters: z.object({
    senderEmail: z.string().email().optional().describe('Sender email (for fromSender template)'),
    subjectText: z.string().optional().describe('Subject text (for withSubject template)'),
    searchText: z.string().optional().describe('Text to search for (for containingText template)'),
    listIdentifier: z.string().optional().describe('Mailing list identifier (for mailingList template)'),
    sizeInBytes: z.number().int().positive().optional().describe('Size threshold in bytes (for largeEmails template)'),
    labelIds: z.array(z.string()).optional().describe('Label IDs to apply'),
    archive: z.boolean().optional().describe('Whether to archive (skip inbox)'),
    markAsRead: z.boolean().optional().describe('Whether to mark as read'),
    markImportant: z.boolean().optional().describe('Whether to mark as important'),
  }).describe('Template-specific parameters'),
}).describe('Creates a filter using a pre-defined template');

/**
 * Schema for batch modifying emails
 */
export const BatchModifyEmailsSchema = z.object({
  messageIds: z.array(z.string().min(1)).min(1).describe('List of message IDs to modify'),
  addLabelIds: z.array(z.string()).optional().describe('List of label IDs to add to all messages'),
  removeLabelIds: z.array(z.string()).optional().describe('List of label IDs to remove from all messages'),
  batchSize: z.number().int().positive().max(100).optional().default(50).describe('Number of messages to process in each batch (default: 50)'),
});

/**
 * Schema for batch deleting emails
 */
export const BatchDeleteEmailsSchema = z.object({
  messageIds: z.array(z.string().min(1)).min(1).describe('List of message IDs to delete'),
  batchSize: z.number().int().positive().max(100).optional().default(50).describe('Number of messages to process in each batch (default: 50)'),
});

