/**
 * MCP tool handlers
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EmailService } from '../services/email.service.js';
import { LabelService } from '../services/label.service.js';
import { FilterService } from '../services/filter.service.js';
import { GmailMCPError } from '../utils/error.util.js';
import * as schemas from '../schemas/tool.schemas.js';

/**
 * Tool handler dependencies
 */
export interface ToolHandlerDependencies {
  emailService: EmailService;
  labelService: LabelService;
  filterService: FilterService;
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema;
}

/**
 * Gets all tool definitions
 * @returns Array of tool definitions
 */
export function getToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'send_email',
      description: 'Sends a new email',
      inputSchema: schemas.SendEmailSchema,
    },
    {
      name: 'draft_email',
      description: 'Draft a new email',
      inputSchema: schemas.SendEmailSchema,
    },
    {
      name: 'read_email',
      description: 'Retrieves the content of a specific email',
      inputSchema: schemas.ReadEmailSchema,
    },
    {
      name: 'search_emails',
      description: 'Searches for emails using Gmail search syntax',
      inputSchema: schemas.SearchEmailsSchema,
    },
    {
      name: 'count_emails',
      description: 'Gets exact email count for a label using Gmail API label metadata (provides total and unread counts)',
      inputSchema: schemas.CountEmailsSchema,
    },
    {
      name: 'modify_email',
      description: 'Modifies email labels (move to different folders)',
      inputSchema: schemas.ModifyEmailSchema,
    },
    {
      name: 'delete_email',
      description: 'Permanently deletes an email',
      inputSchema: schemas.DeleteEmailSchema,
    },
    {
      name: 'download_attachment',
      description: 'Downloads an email attachment to a specified location',
      inputSchema: schemas.DownloadAttachmentSchema,
    },
    {
      name: 'batch_modify_emails',
      description: 'Modifies labels for multiple emails in batches',
      inputSchema: schemas.BatchModifyEmailsSchema,
    },
    {
      name: 'batch_delete_emails',
      description: 'Permanently deletes multiple emails in batches',
      inputSchema: schemas.BatchDeleteEmailsSchema,
    },
    {
      name: 'list_email_labels',
      description: 'Retrieves all available Gmail labels',
      inputSchema: schemas.ListEmailLabelsSchema,
    },
    {
      name: 'create_label',
      description: 'Creates a new Gmail label',
      inputSchema: schemas.CreateLabelSchema,
    },
    {
      name: 'update_label',
      description: 'Updates an existing Gmail label',
      inputSchema: schemas.UpdateLabelSchema,
    },
    {
      name: 'delete_label',
      description: 'Deletes a Gmail label',
      inputSchema: schemas.DeleteLabelSchema,
    },
    {
      name: 'get_or_create_label',
      description: 'Gets an existing label by name or creates it if it doesn\'t exist',
      inputSchema: schemas.GetOrCreateLabelSchema,
    },
    {
      name: 'create_filter',
      description: 'Creates a new Gmail filter with custom criteria and actions',
      inputSchema: schemas.CreateFilterSchema,
    },
    {
      name: 'list_filters',
      description: 'Retrieves all Gmail filters',
      inputSchema: schemas.ListFiltersSchema,
    },
    {
      name: 'get_filter',
      description: 'Gets details of a specific Gmail filter',
      inputSchema: schemas.GetFilterSchema,
    },
    {
      name: 'delete_filter',
      description: 'Deletes a Gmail filter',
      inputSchema: schemas.DeleteFilterSchema,
    },
    {
      name: 'create_filter_from_template',
      description: 'Creates a filter using a pre-defined template for common scenarios',
      inputSchema: schemas.CreateFilterFromTemplateSchema,
    },
  ];
}

/**
 * Converts tool definitions to MCP tool format
 * @param tools - Tool definitions
 * @returns MCP tools array
 */
export function toolsToMCPFormat(tools: ToolDefinition[]) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema),
  }));
}

/**
 * Handles tool execution
 * @param toolName - Name of the tool to execute
 * @param args - Tool arguments
 * @param deps - Tool handler dependencies
 * @returns Tool result
 */
export async function handleTool(
  toolName: string,
  args: unknown,
  deps: ToolHandlerDependencies
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const { emailService, labelService, filterService } = deps;

  try {
    switch (toolName) {
      case 'send_email': {
        const params = schemas.SendEmailSchema.parse(args);
        const messageId = await emailService.sendEmail(params);
        return {
          content: [
            {
              type: 'text',
              text: `Email sent successfully with ID: ${messageId}`,
            },
          ],
        };
      }

      case 'draft_email': {
        const params = schemas.SendEmailSchema.parse(args);
        const draftId = await emailService.createDraft(params);
        return {
          content: [
            {
              type: 'text',
              text: `Email draft created successfully with ID: ${draftId}`,
            },
          ],
        };
      }

      case 'read_email': {
        const { messageId } = schemas.ReadEmailSchema.parse(args);
        const email = await emailService.readEmail(messageId);

        const attachmentInfo =
          email.attachments.length > 0
            ? `\n\nAttachments (${email.attachments.length}):\n` +
              email.attachments
                .map(
                  (a) =>
                    `- ${a.filename} (${a.mimeType}, ${Math.round(a.size / 1024)} KB, ID: ${a.id})`
                )
                .join('\n')
            : '';

        const contentTypeNote = !email.text && email.html
          ? '[Note: This email is HTML-formatted. Plain text version not available.]\n\n'
          : '';

        return {
          content: [
            {
              type: 'text',
              text: `Thread ID: ${email.threadId || 'N/A'}\nSubject: ${email.headers.subject}\nFrom: ${email.headers.from}\nTo: ${email.headers.to}\nDate: ${email.headers.date}\n\n${contentTypeNote}${email.text || email.html}${attachmentInfo}`,
            },
          ],
        };
      }

      case 'search_emails': {
        const { query, maxResults } = schemas.SearchEmailsSchema.parse(args);
        const results = await emailService.searchEmails(query, maxResults);

        const resultsText = results
          .map((r) => `ID: ${r.id}\nSubject: ${r.subject}\nFrom: ${r.from}\nDate: ${r.date}\n`)
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: resultsText || 'No emails found.',
            },
          ],
        };
      }

      case 'count_emails': {
        const { labelId, labelName } = schemas.CountEmailsSchema.parse(args);
        
        // Find label by name if labelName provided
        let finalLabelId = labelId;
        if (labelName && !labelId) {
          const foundLabel = await labelService.findLabelByName(labelName);
          if (!foundLabel) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Label "${labelName}" not found. Use list_email_labels to see available labels.`,
                },
              ],
            };
          }
          finalLabelId = foundLabel.id;
        }

        if (!finalLabelId) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: labelId or labelName must be provided',
              },
            ],
          };
        }

        const labelCount = await labelService.getLabelEmailCount(finalLabelId);

        return {
          content: [
            {
              type: 'text',
              text: `Label: ${labelCount.labelName} (${labelCount.labelId})\nTotal Messages: ${labelCount.messagesTotal.toLocaleString()}\nUnread Messages: ${labelCount.messagesUnread.toLocaleString()}`,
            },
          ],
        };
      }

      case 'modify_email': {
        const { messageId, addLabelIds, removeLabelIds } = schemas.ModifyEmailSchema.parse(args);
        await emailService.modifyEmail(messageId, { addLabelIds, removeLabelIds });

        return {
          content: [
            {
              type: 'text',
              text: `Email ${messageId} labels updated successfully`,
            },
          ],
        };
      }

      case 'delete_email': {
        const { messageId } = schemas.DeleteEmailSchema.parse(args);
        await emailService.deleteEmail(messageId);

        return {
          content: [
            {
              type: 'text',
              text: `Email ${messageId} deleted successfully`,
            },
          ],
        };
      }

      case 'download_attachment': {
        const { messageId, attachmentId, filename, savePath } =
          schemas.DownloadAttachmentSchema.parse(args);
        const filePath = await emailService.downloadAttachment(
          messageId,
          attachmentId,
          savePath,
          filename
        );

        return {
          content: [
            {
              type: 'text',
              text: `Attachment downloaded successfully:\nFile: ${filename || 'original filename'}\nSaved to: ${filePath}`,
            },
          ],
        };
      }

      case 'batch_modify_emails': {
        const { messageIds, addLabelIds, removeLabelIds, batchSize } =
          schemas.BatchModifyEmailsSchema.parse(args);
        const result = await emailService.batchModifyEmails(
          messageIds,
          { addLabelIds, removeLabelIds },
          batchSize
        );

        let resultText = `Batch label modification complete.\n`;
        resultText += `Successfully processed: ${result.successes} messages\n`;

        if (result.failures.length > 0) {
          resultText += `Failed to process: ${result.failures.length} messages\n\n`;
          resultText += `Failed message IDs:\n`;
          resultText += result.failures
            .map((f) => `- ${f.item.substring(0, 16)}... (${f.error})`)
            .join('\n');
        }

        return {
          content: [
            {
              type: 'text',
              text: resultText,
            },
          ],
        };
      }

      case 'batch_delete_emails': {
        const { messageIds, batchSize } = schemas.BatchDeleteEmailsSchema.parse(args);
        const result = await emailService.batchDeleteEmails(messageIds, batchSize);

        let resultText = `Batch delete operation complete.\n`;
        resultText += `Successfully deleted: ${result.successes} messages\n`;

        if (result.failures.length > 0) {
          resultText += `Failed to delete: ${result.failures.length} messages\n\n`;
          resultText += `Failed message IDs:\n`;
          resultText += result.failures
            .map((f) => `- ${f.item.substring(0, 16)}... (${f.error})`)
            .join('\n');
        }

        return {
          content: [
            {
              type: 'text',
              text: resultText,
            },
          ],
        };
      }

      case 'list_email_labels': {
        const labelResults = await labelService.listLabels();

        const systemLabelsText =
          'System Labels:\n' +
          labelResults.system.map((l) => `ID: ${l.id}\nName: ${l.name}\n`).join('\n');

        const userLabelsText =
          '\nUser Labels:\n' +
          labelResults.user.map((l) => `ID: ${l.id}\nName: ${l.name}\n`).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${labelResults.count.total} labels (${labelResults.count.system} system, ${labelResults.count.user}):\n\n${systemLabelsText}${userLabelsText}`,
            },
          ],
        };
      }

      case 'create_label': {
        const { name, messageListVisibility, labelListVisibility } =
          schemas.CreateLabelSchema.parse(args);
        const result = await labelService.createLabel(name, {
          messageListVisibility,
          labelListVisibility,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Label created successfully:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type || 'user'}`,
            },
          ],
        };
      }

      case 'update_label': {
        const { id, name, messageListVisibility, labelListVisibility } =
          schemas.UpdateLabelSchema.parse(args);
        const result = await labelService.updateLabel(id, {
          name,
          messageListVisibility,
          labelListVisibility,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Label updated successfully:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type || 'user'}`,
            },
          ],
        };
      }

      case 'delete_label': {
        const { id } = schemas.DeleteLabelSchema.parse(args);
        await labelService.deleteLabel(id);

        return {
          content: [
            {
              type: 'text',
              text: `Label ${id} deleted successfully.`,
            },
          ],
        };
      }

      case 'get_or_create_label': {
        const { name, messageListVisibility, labelListVisibility } =
          schemas.GetOrCreateLabelSchema.parse(args);
        const result = await labelService.getOrCreateLabel(name, {
          messageListVisibility,
          labelListVisibility,
        });

        const action = result.name === name ? 'found existing' : 'created new';

        return {
          content: [
            {
              type: 'text',
              text: `Successfully ${action} label:\nID: ${result.id}\nName: ${result.name}\nType: ${result.type || 'user'}`,
            },
          ],
        };
      }

      case 'create_filter': {
        const { criteria, action } = schemas.CreateFilterSchema.parse(args);
        const result = await filterService.createFilter(criteria, action);

        const criteriaText = Object.entries(criteria)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

        const actionText = Object.entries(action)
          .filter(([_, value]) => value !== undefined && (Array.isArray(value) ? value.length > 0 : true))
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');

        return {
          content: [
            {
              type: 'text',
              text: `Filter created successfully:\nID: ${result.id}\nCriteria: ${criteriaText}\nActions: ${actionText}`,
            },
          ],
        };
      }

      case 'list_filters': {
        const filters = await filterService.listFilters();

        if (filters.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No filters found.',
              },
            ],
          };
        }

        const filtersText = filters
          .map((filter) => {
            const criteriaEntries = Object.entries(filter.criteria || {})
              .filter(([_, value]) => value !== undefined)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ');

            const actionEntries = Object.entries(filter.action || {})
              .filter(([_, value]) => value !== undefined && (Array.isArray(value) ? value.length > 0 : true))
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(', ');

            return `ID: ${filter.id}\nCriteria: ${criteriaEntries}\nActions: ${actionEntries}\n`;
          })
          .join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${filters.length} filters:\n\n${filtersText}`,
            },
          ],
        };
      }

      case 'get_filter': {
        const { filterId } = schemas.GetFilterSchema.parse(args);
        const result = await filterService.getFilter(filterId);

        const criteriaText = Object.entries(result.criteria || {})
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');

        const actionText = Object.entries(result.action || {})
          .filter(([_, value]) => value !== undefined && (Array.isArray(value) ? value.length > 0 : true))
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');

        return {
          content: [
            {
              type: 'text',
              text: `Filter details:\nID: ${result.id}\nCriteria: ${criteriaText}\nActions: ${actionText}`,
            },
          ],
        };
      }

      case 'delete_filter': {
        const { filterId } = schemas.DeleteFilterSchema.parse(args);
        await filterService.deleteFilter(filterId);

        return {
          content: [
            {
              type: 'text',
              text: `Filter ${filterId} deleted successfully.`,
            },
          ],
        };
      }

      case 'create_filter_from_template': {
        const { template, parameters } = schemas.CreateFilterFromTemplateSchema.parse(args);
        const filterConfig = filterService.createFilterFromTemplate(template, parameters);
        const result = await filterService.createFilter(filterConfig.criteria, filterConfig.action);

        return {
          content: [
            {
              type: 'text',
              text: `Filter created from template '${template}':\nID: ${result.id}\nTemplate used: ${template}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          },
        ],
      };
    }

    if (error instanceof GmailMCPError) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
      };
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
    };
  }
}

