#!/usr/bin/env node

/**
 * Setup script to create MCP configuration files
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root
const projectRoot = path.resolve(__dirname);
const serverPath = path.join(projectRoot, 'dist', 'index.js');

// MCP configuration
const mcpConfig = {
  mcpServers: {
    gmail: {
      command: 'node',
      args: [serverPath],
    },
  },
};

// Platform-specific config locations
const configs = {
  cursor: {
    path: path.join(projectRoot, '.cursor', 'mcp.json'),
    description: 'Cursor IDE (project-local)',
  },
  claudeDesktop: {
    path:
      process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
        : process.platform === 'win32'
        ? path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json')
        : path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json'),
    description: 'Claude Desktop',
  },
};

console.log('🔧 Gmail MCP Server Setup\n');
console.log('Server path:', serverPath);
console.log('Credentials location: ~/.gmail-mcp/credentials.json\n');

// Check if server is built
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server not built. Run: npm run build');
  process.exit(1);
}

// Check if credentials exist
const credentialsPath = path.join(os.homedir(), '.gmail-mcp', 'credentials.json');
if (!fs.existsSync(credentialsPath)) {
  console.warn('⚠️  Credentials not found. Run: npm run auth\n');
} else {
  console.log('✅ Credentials found at:', credentialsPath, '\n');
}

// Create Cursor config
console.log('Creating Cursor configuration...');
const cursorDir = path.dirname(configs.cursor.path);
if (!fs.existsSync(cursorDir)) {
  fs.mkdirSync(cursorDir, { recursive: true });
}

// Read existing Cursor config if it exists
let cursorConfig = {};
if (fs.existsSync(configs.cursor.path)) {
  try {
    cursorConfig = JSON.parse(fs.readFileSync(configs.cursor.path, 'utf8'));
  } catch (error) {
    console.warn('⚠️  Could not read existing Cursor config, will create new one');
  }
}

// Merge with existing config
cursorConfig.mcpServers = cursorConfig.mcpServers || {};
cursorConfig.mcpServers.gmail = mcpConfig.mcpServers.gmail;

fs.writeFileSync(configs.cursor.path, JSON.stringify(cursorConfig, null, 2));
console.log(`✅ Created: ${configs.cursor.path}`);

// Claude Desktop config
console.log('\nClaude Desktop configuration:');
console.log(`📝 Location: ${configs.claudeDesktop.path}`);

if (fs.existsSync(configs.claudeDesktop.path)) {
  try {
    const claudeConfig = JSON.parse(fs.readFileSync(configs.claudeDesktop.path, 'utf8'));
    if (claudeConfig.mcpServers && claudeConfig.mcpServers.gmail) {
      console.log('✅ Gmail server already configured in Claude Desktop');
    } else {
      console.log('⚠️  Claude Desktop config exists but Gmail server not configured');
      console.log('   Add this to your Claude Desktop config:');
      console.log(JSON.stringify(mcpConfig, null, 2));
    }
  } catch (error) {
    console.log('⚠️  Could not read Claude Desktop config');
    console.log('   Create or edit the file and add:');
    console.log(JSON.stringify(mcpConfig, null, 2));
  }
} else {
  console.log('⚠️  Claude Desktop config file does not exist');
  console.log('   Create the file and add:');
  console.log(JSON.stringify(mcpConfig, null, 2));
}

console.log('\n📋 Summary:');
console.log('   ✅ Cursor config created at:', configs.cursor.path);
console.log('   📝 Claude Desktop: Edit manually at:', configs.claudeDesktop.path);
console.log('   🔑 Credentials:', credentialsPath);
console.log('\n✨ Setup complete! Restart your IDE/AI assistant to use the Gmail MCP server.');

