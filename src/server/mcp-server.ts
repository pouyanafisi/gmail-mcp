/**
 * MCP Server setup
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getToolDefinitions, toolsToMCPFormat, handleTool, ToolHandlerDependencies } from '../tools/tool-handlers.js';

/**
 * Creates and configures the MCP server
 * @param deps - Tool handler dependencies
 * @returns Configured MCP server
 */
export function createMCPServer(deps: ToolHandlerDependencies): Server {
  const server = new Server({
    name: 'gmail-mcp',
    version: '2.0.0',
    capabilities: {
      tools: {},
    },
  });

  const toolDefinitions = getToolDefinitions();

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolsToMCPFormat(toolDefinitions),
    };
  });

  // Register call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleTool(name, args, deps);
  });

  return server;
}

/**
 * Starts the MCP server
 * @param server - MCP server instance
 */
export async function startMCPServer(server: Server): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

