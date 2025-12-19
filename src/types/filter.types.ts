/**
 * Filter-related type definitions
 */

/**
 * Gmail filter criteria
 */
export interface GmailFilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  query?: string;
  negatedQuery?: string;
  hasAttachment?: boolean;
  excludeChats?: boolean;
  size?: number;
  sizeComparison?: 'unspecified' | 'smaller' | 'larger';
}

/**
 * Gmail filter action
 */
export interface GmailFilterAction {
  addLabelIds?: string[];
  removeLabelIds?: string[];
  forward?: string;
}

/**
 * Gmail filter interface
 */
export interface GmailFilter {
  id?: string;
  criteria: GmailFilterCriteria;
  action: GmailFilterAction;
}

/**
 * Filter template types
 */
export type FilterTemplate =
  | 'fromSender'
  | 'withSubject'
  | 'withAttachments'
  | 'largeEmails'
  | 'containingText'
  | 'mailingList';

/**
 * Parameters for filter templates
 */
export interface FilterTemplateParams {
  senderEmail?: string;
  subjectText?: string;
  searchText?: string;
  listIdentifier?: string;
  sizeInBytes?: number;
  labelIds?: string[];
  archive?: boolean;
  markAsRead?: boolean;
  markImportant?: boolean;
}

