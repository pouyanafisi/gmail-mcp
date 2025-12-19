/**
 * Label service for Gmail label management
 */

import { gmail_v1 } from 'googleapis';
import { GmailLabel, LabelOptions, UpdateLabelParams, LabelListResult } from '../types/label.types.js';
import { LabelEmailCount } from '../types/email.types.js';
import { GmailAPIClient } from './gmail-api.client.js';
import { createAPIError, createNotFoundError } from '../utils/error.util.js';

/**
 * Service for Gmail label operations
 */
export class LabelService {
  constructor(private readonly gmailClient: GmailAPIClient) {}

  /**
   * Creates a new Gmail label
   * @param name - Label name
   * @param options - Optional label settings
   * @returns Created label
   */
  async createLabel(name: string, options: LabelOptions = {}): Promise<GmailLabel> {
    const gmail = await this.gmailClient.getGmailAPI();

    const messageListVisibility = options.messageListVisibility || 'show';
    const labelListVisibility = options.labelListVisibility || 'labelShow';

    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: name,
          messageListVisibility,
          labelListVisibility,
        },
      });

      return response.data as GmailLabel;
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw createAPIError(`Label "${name}" already exists. Please use a different name.`, 409);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to create label: ${errorMessage}`);
    }
  }

  /**
   * Updates an existing Gmail label
   * @param id - Label ID
   * @param updates - Properties to update
   * @returns Updated label
   */
  async updateLabel(id: string, updates: UpdateLabelParams): Promise<GmailLabel> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      // Verify the label exists before updating
      await gmail.users.labels.get({
        userId: 'me',
        id: id,
      });

      const requestBody: gmail_v1.Schema$Label = {};
      if (updates.name) requestBody.name = updates.name;
      if (updates.messageListVisibility) requestBody.messageListVisibility = updates.messageListVisibility;
      if (updates.labelListVisibility) requestBody.labelListVisibility = updates.labelListVisibility;

      const response = await gmail.users.labels.update({
        userId: 'me',
        id: id,
        requestBody: requestBody,
      });

      return response.data as GmailLabel;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw createNotFoundError(`Label with ID "${id}" not found.`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to update label: ${errorMessage}`);
    }
  }

  /**
   * Deletes a Gmail label
   * @param id - Label ID
   */
  async deleteLabel(id: string): Promise<void> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      // Ensure we're not trying to delete system labels
      const label = await gmail.users.labels.get({
        userId: 'me',
        id: id,
      });

      if (label.data.type === 'system') {
        throw createAPIError(`Cannot delete system label with ID "${id}".`, 403);
      }

      await gmail.users.labels.delete({
        userId: 'me',
        id: id,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        throw createNotFoundError(`Label with ID "${id}" not found.`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to delete label: ${errorMessage}`);
    }
  }

  /**
   * Lists all Gmail labels
   * @returns Label list result
   */
  async listLabels(): Promise<LabelListResult> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      const response = await gmail.users.labels.list({
        userId: 'me',
      });

      const labels = (response.data.labels || []) as GmailLabel[];

      const systemLabels = labels.filter((label) => label.type === 'system');
      const userLabels = labels.filter((label) => label.type === 'user');

      return {
        all: labels,
        system: systemLabels,
        user: userLabels,
        count: {
          total: labels.length,
          system: systemLabels.length,
          user: userLabels.length,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to list labels: ${errorMessage}`);
    }
  }

  /**
   * Finds a label by name (case-insensitive)
   * @param name - Label name to find
   * @returns Found label or null
   */
  async findLabelByName(name: string): Promise<GmailLabel | null> {
    try {
      const labelList = await this.listLabels();
      const foundLabel = labelList.all.find(
        (label) => label.name.toLowerCase() === name.toLowerCase()
      );

      return foundLabel || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to find label: ${errorMessage}`);
    }
  }

  /**
   * Gets an existing label by name or creates it if it doesn't exist
   * @param name - Label name
   * @param options - Optional label settings (used only if creating)
   * @returns Existing or newly created label
   */
  async getOrCreateLabel(name: string, options: LabelOptions = {}): Promise<GmailLabel> {
    try {
      const existingLabel = await this.findLabelByName(name);

      if (existingLabel) {
        return existingLabel;
      }

      return await this.createLabel(name, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to get or create label: ${errorMessage}`);
    }
  }

  /**
   * Gets email count for a specific label using label metadata
   * @param labelId - Label ID
   * @returns Label email count
   */
  async getLabelEmailCount(labelId: string): Promise<LabelEmailCount> {
    const gmail = await this.gmailClient.getGmailAPI();

    try {
      const response = await gmail.users.labels.get({
        userId: 'me',
        id: labelId,
      });

      const label = response.data as GmailLabel;

      return {
        labelId: label.id,
        labelName: label.name,
        messagesTotal: label.messagesTotal || 0,
        messagesUnread: label.messagesUnread || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw createAPIError(`Failed to get label email count: ${errorMessage}`);
    }
  }
}

