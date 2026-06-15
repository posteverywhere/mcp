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
import { readFileSync } from 'node:fs';
import { PostEverywhereClient } from './client.js';
import { registerTools } from './tools.js';

// Advertise the real package version (read from package.json) so inspectors,
// Glama, and the MCP registry see an accurate, bumpable version — never a
// stale hardcoded constant.
const pkg = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

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

// Accept POSTEVERYWHERE_BASE_URL (documented / Glama schema) or the legacy
// POSTEVERYWHERE_API_URL alias; default to production.
const baseUrl =
  process.env.POSTEVERYWHERE_BASE_URL ||
  process.env.POSTEVERYWHERE_API_URL ||
  'https://app.posteverywhere.ai';

const client = new PostEverywhereClient({ baseUrl, apiKey });
const server = new McpServer({
  name: 'posteverywhere',
  version: pkg.version,
});

registerTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
