/**
 * Label-related type definitions
 */

/**
 * Gmail label visibility options
 */
export type MessageListVisibility = 'show' | 'hide';
export type LabelListVisibility = 'labelShow' | 'labelShowIfUnread' | 'labelHide';

/**
 * Gmail label interface
 */
export interface GmailLabel {
  id: string;
  name: string;
  type?: 'system' | 'user';
  messageListVisibility?: MessageListVisibility;
  labelListVisibility?: LabelListVisibility;
  messagesTotal?: number;
  messagesUnread?: number;
  color?: {
    textColor?: string;
    backgroundColor?: string;
  };
}

/**
 * Options for creating a label
 */
export interface LabelOptions {
  messageListVisibility?: MessageListVisibility;
  labelListVisibility?: LabelListVisibility;
}

/**
 * Parameters for updating a label
 */
export interface UpdateLabelParams {
  name?: string;
  messageListVisibility?: MessageListVisibility;
  labelListVisibility?: LabelListVisibility;
}

/**
 * Result of listing labels
 */
export interface LabelListResult {
  all: GmailLabel[];
  system: GmailLabel[];
  user: GmailLabel[];
  count: {
    total: number;
    system: number;
    user: number;
  };
}

