# MCP Configuration Setup

Configuration instructions for the Gmail MCP server.

## Configuration

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

Replace `/absolute/path/to/gmail-mcp` with your project path.

## Platform Setup

### Cursor IDE

1. Create or edit `.cursor/mcp.json` in project root
2. Add configuration above
3. Update paths
4. Restart Cursor

**Location**: `.cursor/mcp.json`

### Claude Desktop

1. Edit configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`
2. Add Gmail server to `mcpServers`
3. Restart Claude Desktop

### Gemini

1. Locate Gemini MCP configuration (varies by integration)
2. Add Gmail server configuration
3. Restart integration

## Using npm Package

If installed globally:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "gmail-mcp"
    }
  }
}
```

If installed locally with npx:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "gmail-mcp"]
    }
  }
}
```

## Required Files

- `gcp-oauth.keys.json` - OAuth credentials from Google Cloud Console
  - Place in current directory or `~/.gmail-mcp/`
- `~/.gmail-mcp/credentials.json` - Created after authentication (`npm run auth`)

## Authentication

Before using the server, authenticate:

```bash
npm run auth
```

Or with custom callback URL (for cloud environments):

```bash
npm run auth https://your-domain.com/oauth2callback
```

## Environment Variables

Optional environment variables:

- `GMAIL_OAUTH_PATH`: Path to OAuth keys file (default: `~/.gmail-mcp/gcp-oauth.keys.json`)
- `GMAIL_CREDENTIALS_PATH`: Path to credentials file (default: `~/.gmail-mcp/credentials.json`)

## Verification

1. Restart IDE/AI assistant
2. Gmail server should appear in available MCP servers
3. Test with `list_email_labels` or `search_emails`
4. If auth required, run `npm run auth`

## Troubleshooting

**Server not found:**
- Verify `dist/index.js` path is correct
- Run `npm run build`
- Check Node.js is in PATH

**Authentication errors:**
- Run `npm run auth`
- Verify `gcp-oauth.keys.json` exists and is valid
- Check file permissions
- Ensure OAuth credentials are Desktop app or Web application type

**Path issues:**
- Use absolute paths
- Windows: Use forward slashes or escaped backslashes (`C:\\path\\to\\file`)
- Verify all paths point to existing files

**OAuth callback issues:**
- For Desktop app credentials: Use default `http://localhost:3000/oauth2callback`
- For Web application credentials: Add callback URL to authorized redirect URIs in Google Cloud Console
- For cloud environments: Use custom callback URL and configure reverse proxy

