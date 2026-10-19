# Installing the PostEverywhere MCP server (for AI agents such as Cline)

PostEverywhere is a social media scheduler. This MCP server lets an AI agent write, schedule and publish posts to Instagram, TikTok, YouTube, LinkedIn, Facebook, X, Threads, Pinterest, Bluesky, Telegram, Discord, WordPress and Google Business Profile, plan a content calendar, cross-post video, and find and retry failed posts. Website: https://posteverywhere.ai · Docs: https://posteverywhere.ai/mcp

There are two ways to connect. Option A needs no key and nothing installed.

## Option A (recommended): hosted server, sign in with OAuth

Add this to the MCP settings (Cline: MCP Servers -> Configure -> `cline_mcp_settings.json`):

```json
{
  "mcpServers": {
    "posteverywhere": {
      "type": "streamableHttp",
      "url": "https://mcp.posteverywhere.ai/mcp"
    }
  }
}
```

On first use a browser window opens to sign in to PostEverywhere and approve access (OAuth 2.1 with dynamic client registration; no client ID or secret to configure). A PostEverywhere account is required: https://app.posteverywhere.ai/signup

## Option B: local server with an API key

1. Create an API key at https://app.posteverywhere.ai/developers (it starts with `pe_live_`).
2. Add this to the MCP settings:

```json
{
  "mcpServers": {
    "posteverywhere": {
      "command": "npx",
      "args": ["-y", "@posteverywhere/mcp"],
      "env": {
        "POSTEVERYWHERE_API_KEY": "pe_live_your_key_here"
      }
    }
  }
}
```

Requires Node.js 18 or later. Ask the user for their API key; never invent one.

## Check it works

Call `list_accounts`. It returns the social accounts connected in the user's PostEverywhere workspace. If it is empty, call `create_connect_link` with a platform (for example `instagram`) and give the user the link to connect one.

Publishing a post cannot be undone once a social network accepts it. To let the user review first, call `create_post` with `draft: true`.
