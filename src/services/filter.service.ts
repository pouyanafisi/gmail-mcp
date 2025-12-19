/**
 * Filter service for Gmail filter management
 */

import { GmailFilterCriteria, GmailFilterAction, GmailFilter, FilterTemplate, FilterTemplateParams } from '../types/filter.types.js';
import { GmailAPIClient } from './gmail-api.client.js';
import { createAPIError, createNotFoundError } from '../utils/error.util.js';

/**
 * Service for Gmail filter operations
 */
export class FilterService {
  constructor(private readonly gmailClient: GmailAPIClient) {}

  /**
   * Creates a new Gmail filter
   * @param criteria - Filter criteria
   * @param action - Filter actions
   * @returns Created filter
   */
  async createFilter(criteria: GmailFilterCriteria, action: GmailFilterAction): Promise<GmailFilter> {
    const gmail = await this.gmailClient.getGmailAPI();

    const filterBody: GmailFilter = {
      criteria,
      action,
    };

    try {
      const response = await gmail.users.settings.filters.create({
        userId: 'me',
        requestBody: filterBody,
      });

      return response.data as GmailFilter;
    } catch (error) {
      if (error instanceof Error && error.message.includes('400')) {
        throw createAPIError(`Invalid filter criteria or action: ${error.message}`, 400);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to create filter: ${errorMessage}`);
    }
  }

  /**
   * Lists all Gmail filters
   * @returns Array of filters
   */
  async listFilters(): Promise<GmailFilter[]> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      const response = await gmail.users.settings.filters.list({
        userId: 'me',
      });

      return (response.data.filter || []) as GmailFilter[];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to list filters: ${errorMessage}`);
    }
  }

  /**
   * Gets a specific Gmail filter by ID
   * @param filterId - Filter ID
   * @returns Filter details
   */
  async getFilter(filterId: string): Promise<GmailFilter> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      const response = await gmail.users.settings.filters.get({
        userId: 'me',
        id: filterId,
      });

      return response.data as GmailFilter;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw createNotFoundError(`Filter with ID "${filterId}" not found.`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to get filter: ${errorMessage}`);
    }
  }

  /**
   * Deletes a Gmail filter
   * @param filterId - Filter ID
   */
  async deleteFilter(filterId: string): Promise<void> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      await gmail.users.settings.filters.delete({
        userId: 'me',
        id: filterId,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw createNotFoundError(`Filter with ID "${filterId}" not found.`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to delete filter: ${errorMessage}`);
    }
  }

  /**
   * Creates a filter from a pre-defined template
   * @param template - Template name
   * @param params - Template parameters
   * @returns Filter configuration (criteria and action)
   */
  createFilterFromTemplate(
    template: FilterTemplate,
    params: FilterTemplateParams
  ): { criteria: GmailFilterCriteria; action: GmailFilterAction } {
    switch (template) {
      case 'fromSender':
        if (!params.senderEmail) {
          throw createAPIError('senderEmail is required for fromSender template', 400);
        }
        return {
          criteria: { from: params.senderEmail },
          action: {
            addLabelIds: params.labelIds,
            removeLabelIds: params.archive ? ['INBOX'] : undefined,
          },
        };

      case 'withSubject':
        if (!params.subjectText) {
          throw createAPIError('subjectText is required for withSubject template', 400);
        }
        return {
          criteria: { subject: params.subjectText },
          action: {
            addLabelIds: params.labelIds,
            removeLabelIds: params.markAsRead ? ['UNREAD'] : undefined,
          },
        };

      case 'withAttachments':
        return {
          criteria: { hasAttachment: true },
          action: { addLabelIds: params.labelIds },
        };

      case 'largeEmails':
        if (!params.sizeInBytes) {
          throw createAPIError('sizeInBytes is required for largeEmails template', 400);
        }
        return {
          criteria: { size: params.sizeInBytes, sizeComparison: 'larger' },
          action: { addLabelIds: params.labelIds },
        };

      case 'containingText':
        if (!params.searchText) {
          throw createAPIError('searchText is required for containingText template', 400);
        }
        return {
          criteria: { query: `"${params.searchText}"` },
          action: {
            addLabelIds: params.markImportant ? [...(params.labelIds || []), 'IMPORTANT'] : params.labelIds,
          },
        };

      case 'mailingList':
        if (!params.listIdentifier) {
          throw createAPIError('listIdentifier is required for mailingList template', 400);
        }
        return {
          criteria: { query: `list:${params.listIdentifier} OR subject:[${params.listIdentifier}]` },
          action: {
            addLabelIds: params.labelIds,
            removeLabelIds: params.archive ? ['INBOX'] : undefined,
          },
        };

      default:
        throw createAPIError(`Unknown template: ${template}`, 400);
    }
  }
}

