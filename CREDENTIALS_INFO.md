# Credentials and Configuration Locations

## Credentials Storage

After running `npm run auth`, your OAuth credentials are stored at:

**Location**: `~/.gmail-mcp/credentials.json`

This file contains:
- `access_token` - Current access token
- `refresh_token` - Token for refreshing access (persistent)
- `scope` - OAuth scopes granted
- `token_type` - Usually "Bearer"
- `expiry_date` - Token expiration timestamp

**Security Note**: This file contains sensitive authentication data. Never commit it to version control.

## OAuth Keys

Your OAuth keys file is stored at:

**Location**: `~/.gmail-mcp/gcp-oauth.keys.json`

This file contains your Google Cloud OAuth client credentials.

## MCP Configuration Files

MCP configuration files are **NOT** stored in the project directory. They must be placed in tool-specific locations:

### Cursor IDE

**Location**: `.cursor/mcp.json` (in your project root)

Run `npm run setup` to automatically create this file.

### Claude Desktop

**Location** (macOS): `~/Library/Application Support/Claude/claude_desktop_config.json`

**Location** (Windows): `%APPDATA%\Claude\claude_desktop_config.json`

**Location** (Linux): `~/.config/Claude/claude_desktop_config.json`

You need to manually edit this file and add the Gmail server configuration. Run `npm run setup` for instructions.

### Why `example.mcp.json` exists

The `example.mcp.json` file is just a **template** showing what the configuration should look like. It's not automatically used by MCP tools because:

1. Each MCP client (Cursor, Claude Desktop, etc.) has its own configuration file location
2. The configuration needs to be merged with existing MCP server configurations
3. Paths need to be absolute and specific to your system

## Quick Setup

Run this command to automatically set up MCP configuration:

```bash
npm run setup
```

This will:
- ✅ Create `.cursor/mcp.json` with the correct configuration
- 📝 Show you where to add Claude Desktop configuration
- 🔍 Check if credentials exist
- ✅ Verify the server is built

## Manual Setup

If you prefer to set up manually:

1. **For Cursor**: Create `.cursor/mcp.json` in your project root:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/absolute/path/to/gmail-mcp/dist/index.js"]
    }
  }
}
```

2. **For Claude Desktop**: Edit the config file at the location above and add the same configuration to the `mcpServers` object.

## Verification

After setup, verify:
1. Credentials exist: `ls ~/.gmail-mcp/credentials.json`
2. Server is built: `ls dist/index.js`
3. Config file exists: `ls .cursor/mcp.json` (for Cursor)
4. Restart your IDE/AI assistant
5. Test with: `list_email_labels` or `count_emails`

