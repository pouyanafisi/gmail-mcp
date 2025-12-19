# Gmail MCP Guidelines for Gemini

Guidelines for using the Gmail MCP server with Gemini.

## Available Operations

19 operations available for comprehensive Gmail management.

### Email Operations (9)
- `send_email` - Send emails with optional attachments (plain text, HTML, or multipart)
- `draft_email` - Create email drafts with attachments support
- `read_email` - Read email content with full MIME parsing and attachment information
- `search_emails` - Search emails using Gmail search syntax
- `modify_email` - Modify email labels (add/remove labels)
- `delete_email` - Permanently delete emails
- `download_attachment` - Download email attachments to local filesystem
- `batch_modify_emails` - Modify labels for multiple emails in batches
- `batch_delete_emails` - Delete multiple emails in batches

### Label Management (5)
- `list_email_labels` - List all Gmail labels (system and user)
- `create_label` - Create a new Gmail label with visibility settings
- `update_label` - Update label properties (name, visibility)
- `delete_label` - Delete a user-created label
- `get_or_create_label` - Get existing label by name or create if it doesn't exist

### Filter Management (5)
- `create_filter` - Create a custom Gmail filter with criteria and actions
- `list_filters` - List all Gmail filters
- `get_filter` - Get details of a specific filter
- `delete_filter` - Delete a Gmail filter
- `create_filter_from_template` - Create a filter using pre-built templates

## Usage Guidelines

### Before Operations
1. Verify authentication status - if authentication fails, guide user to run `npm run auth`
2. For email operations, check if message IDs are valid
3. For label operations, check if labels exist before creating duplicates
4. For filter operations, understand the user's filtering needs

### Email Operations

#### Sending Emails
- Use `send_email` for immediate sending
- Use `draft_email` to create drafts for review
- Support attachments by providing file paths in the `attachments` array
- Support HTML emails with `htmlBody` parameter
- Support multipart emails (both plain text and HTML) with `mimeType: "multipart/alternative"`

#### Reading Emails
- `read_email` returns full email content including:
  - Headers (subject, from, to, date)
  - Plain text and HTML content
  - Attachment information (filename, type, size, download ID)
  - Thread ID for conversation context

#### Searching Emails
- Use Gmail search syntax: `from:example@gmail.com`, `subject:meeting`, `has:attachment`, etc.
- Combine operators: `from:boss@company.com after:2024/01/01 has:attachment`
- Limit results with `maxResults` parameter (default: 10, max: 500)

#### Counting Emails
- Use `count_emails` to get exact counts from label metadata (no pagination needed)
- Provides both total and unread message counts
- Use `labelId` or `labelName` parameter (e.g., "INBOX", "UNREAD", "STARRED", "SENT", or user label names)
- Common system labels: `INBOX`, `UNREAD`, `STARRED`, `SENT`, `DRAFT`, `TRASH`, `SPAM`
- Use `list_email_labels` first to see all available labels and their IDs

#### Modifying Emails
- Use `modify_email` to add/remove labels
- Common labels: `INBOX`, `UNREAD`, `IMPORTANT`, `STARRED`, `TRASH`
- Use `batch_modify_emails` for bulk operations (up to 50 per batch)

### Label Management

#### Creating Labels
- Use descriptive names: `Work - Urgent` not `label1`
- Set visibility options:
  - `messageListVisibility`: `show` or `hide`
  - `labelListVisibility`: `labelShow`, `labelShowIfUnread`, or `labelHide`
- Use `get_or_create_label` to avoid duplicates

#### Organizing with Labels
- List all labels first to see existing structure
- Create labels before applying them to emails
- System labels cannot be deleted or modified

### Filter Management

#### Creating Filters
- Define criteria: `from`, `to`, `subject`, `query`, `hasAttachment`, `size`, etc.
- Define actions: `addLabelIds`, `removeLabelIds`, `forward`
- Use templates for common scenarios:
  - `fromSender` - Filter emails from specific sender
  - `withSubject` - Filter by subject text
  - `withAttachments` - Filter emails with attachments
  - `largeEmails` - Filter emails larger than specified size
  - `containingText` - Filter emails containing specific text
  - `mailingList` - Filter mailing list emails

#### Filter Templates
- `fromSender`: Archive emails from specific sender
- `withSubject`: Mark emails with specific subject as read
- `withAttachments`: Label all emails with attachments
- `largeEmails`: Label large emails for review
- `containingText`: Mark important emails containing specific keywords
- `mailingList`: Archive mailing list emails

### Attachment Handling

#### Sending Attachments
- Provide file paths in `attachments` array
- Files are automatically detected and attached
- Gmail has 25MB limit per email
- All common file types supported (PDF, DOCX, images, etc.)

#### Downloading Attachments
- First read email to get attachment IDs
- Use `download_attachment` with message ID and attachment ID
- Optionally specify `savePath` and `filename`
- Original filename used if not specified

## Common Workflows

### Organizing Inbox
1. List all labels to see current structure
2. Create new labels as needed
3. Search for emails to organize
4. Use `batch_modify_emails` to apply labels in bulk
5. Create filters to auto-organize future emails

### Email Cleanup
1. Search for emails to delete (e.g., `from:newsletter@company.com older_than:1y`)
2. Use `batch_delete_emails` for bulk deletion
3. Create filters to auto-archive or delete similar emails

### Setting Up Filters
1. Identify email patterns (sender, subject, content)
2. Choose appropriate template or create custom filter
3. Define labels to apply
4. Test filter with existing emails
5. Create filter to automate future emails

### Managing Attachments
1. Search for emails with attachments: `has:attachment`
2. Read email to see attachment details
3. Download important attachments
4. Create filter to label emails with attachments

## Error Handling

- **Authentication fails**: Guide user to run `npm run auth` or place `gcp-oauth.keys.json` in correct location
- **Invalid message ID**: Use `search_emails` to find correct message IDs
- **Label not found**: Use `list_email_labels` to find correct label IDs
- **File not found**: Verify attachment file paths are correct and accessible
- **API errors**: Check Gmail API quotas and rate limits
- **Permission errors**: Verify OAuth scopes include `gmail.modify` and `gmail.settings.basic`

## Important Notes

- **Message IDs**: Gmail message IDs are long alphanumeric strings
- **Label IDs**: System labels use uppercase (e.g., `INBOX`, `UNREAD`), user labels use `Label_` prefix
- **Batch operations**: Process up to 50 emails per batch (configurable)
- **Attachments**: 25MB limit per email, files processed locally
- **OAuth tokens**: Auto-refresh when expired
- **Thread IDs**: Use thread IDs to maintain conversation context
- **Search syntax**: Use Gmail's powerful search operators for precise filtering

## Best Practices

1. **Always verify before deleting**: Use `read_email` to confirm before `delete_email`
2. **Use batch operations**: More efficient for multiple emails
3. **Create filters proactively**: Set up filters to prevent inbox clutter
4. **Organize with labels**: Create a label hierarchy for better organization
5. **Test filters**: Create filters and test with existing emails before relying on them
6. **Backup important emails**: Download attachments before bulk operations
7. **Use search effectively**: Combine search operators for precise results

