#!/usr/bin/env node

/**
 * PostEverywhere MCP Server
 *
 * Connects Claude Desktop, Claude Code, Cursor, and other MCP clients
 * to PostEverywhere for social media management via natural language.
 *
 * Usage:
 *   POSTEVERYWHERE_API_KEY=pe_live_... npx @posteverywhere/mcp
 *
 * Claude Desktop config (~/.claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "posteverywhere": {
 *         "command": "npx",
 *         "args": ["-y", "@posteverywhere/mcp"],
 *         "env": { "POSTEVERYWHERE_API_KEY": "pe_live_..." }
 *       }
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PostEverywhereClient } from './client.js';
import { registerTools } from './tools.js';

const apiKey = process.env.POSTEVERYWHERE_API_KEY;
if (!apiKey) {
  console.error('Error: POSTEVERYWHERE_API_KEY environment variable is required.');
  console.error('');
  console.error('Get your API key from: https://app.posteverywhere.ai/developers');
  process.exit(1);
}

if (!apiKey.startsWith('pe_live_')) {
  console.error('Error: API key must start with "pe_live_".');
  process.exit(1);
}

const baseUrl = process.env.POSTEVERYWHERE_API_URL || 'https://app.posteverywhere.ai';

const client = new PostEverywhereClient({ baseUrl, apiKey });
const server = new McpServer({
  name: 'posteverywhere',
  version: '0.1.0',
});

registerTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
