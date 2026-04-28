# @posteverywhere/mcp — Social Media MCP Server for Claude, Cursor & AI Agents

[![npm version](https://img.shields.io/npm/v/@posteverywhere/mcp.svg?style=flat-square)](https://www.npmjs.com/package/@posteverywhere/mcp)
[![npm downloads](https://img.shields.io/npm/dw/@posteverywhere/mcp.svg?style=flat-square)](https://www.npmjs.com/package/@posteverywhere/mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/posteverywhere/mcp?style=flat-square)](https://github.com/posteverywhere/mcp)

Official [Model Context Protocol](https://modelcontextprotocol.io) server for [PostEverywhere](https://posteverywhere.ai) — let [Claude Code](https://docs.claude.com/en/docs/claude-code/overview), [Claude Desktop](https://claude.ai/download), [Cursor](https://cursor.sh), and other MCP-compatible AI clients **schedule and publish social media posts to Instagram, TikTok, YouTube, LinkedIn, Facebook, X (Twitter), Threads, and Pinterest** using natural language.

> 💡 **Building a programmatic integration?** Use the companion [`posteverywhere`](https://www.npmjs.com/package/posteverywhere) Node.js SDK instead — full TypeScript types, retry handling, error classes.

## 🔗 Quick Links

| Resource | URL |
|---|---|
| 🌐 **Homepage** | [posteverywhere.ai](https://posteverywhere.ai) |
| 🛠️ **Developers landing page** | [posteverywhere.ai/developers](https://posteverywhere.ai/developers) |
| 📖 **API Documentation** | [developers.posteverywhere.ai](https://developers.posteverywhere.ai) |
| 📦 **This MCP on npm** | [npmjs.com/package/@posteverywhere/mcp](https://www.npmjs.com/package/@posteverywhere/mcp) |
| 💻 **This MCP on GitHub** | [github.com/posteverywhere/mcp](https://github.com/posteverywhere/mcp) |
| 📦 **Node SDK (npm)** | [npmjs.com/package/posteverywhere](https://www.npmjs.com/package/posteverywhere) |
| 💻 **Node SDK (GitHub)** | [github.com/posteverywhere/sdk](https://github.com/posteverywhere/sdk) |
| 🎛️ **Dashboard** | [app.posteverywhere.ai](https://app.posteverywhere.ai) |
| 🔑 **Get an API key** | [app.posteverywhere.ai/developers](https://app.posteverywhere.ai/developers) |
| 💵 **Pricing** | [posteverywhere.ai/pricing](https://posteverywhere.ai/pricing) |
| 📚 **Help Center** | [posteverywhere.ai/docs/help-center](https://posteverywhere.ai/docs/help-center) |
| 🧠 **Model Context Protocol** | [modelcontextprotocol.io](https://modelcontextprotocol.io) |
| 🐛 **Issues / bug reports** | [github.com/posteverywhere/mcp/issues](https://github.com/posteverywhere/mcp/issues) |
| 📧 **Support** | [support@posteverywhere.ai](mailto:support@posteverywhere.ai) |

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) is an open standard from [Anthropic](https://www.anthropic.com) that lets AI assistants connect to external tools and data sources. Once you connect this MCP server, your AI assistant can:

- **Schedule posts** across all your connected social accounts
- **Generate AI images** and attach them to posts
- **List, edit, retry, and delete** scheduled or published posts
- **Surface per-platform publishing results** including failure reasons

…all from natural-language prompts inside [Claude](https://claude.ai), [Cursor](https://cursor.sh), or any [MCP-compatible client](https://modelcontextprotocol.io/clients).

## Quick Start

### 1. Get an API key

Sign up free at [posteverywhere.ai/signup](https://app.posteverywhere.ai/signup) (7-day trial), connect your social accounts, then create an API key at [Settings → Developers](https://app.posteverywhere.ai/developers). Choose your scopes:

- **Read** — list accounts, posts, and media
- **Write** — create, edit, delete posts and media
- **AI** — generate images using AI models

### 2. Add the MCP server to your AI client

#### Claude Code

```bash
claude mcp add posteverywhere -- npx -y @posteverywhere/mcp
```

Then set `POSTEVERYWHERE_API_KEY` in your environment, or pass it as an argument:

```bash
claude mcp add posteverywhere -e POSTEVERYWHERE_API_KEY=pe_live_your_key_here -- npx -y @posteverywhere/mcp
```

📖 [Claude Code MCP docs →](https://docs.claude.com/en/docs/claude-code/mcp)

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

Restart Claude Desktop. The PostEverywhere tools will appear in the 🔨 menu.

📖 [Claude Desktop MCP docs →](https://modelcontextprotocol.io/quickstart/user)

#### Cursor

In Cursor, open **Settings → MCP → Add new MCP server** and paste:

```json
{
  "posteverywhere": {
    "command": "npx",
    "args": ["-y", "@posteverywhere/mcp"],
    "env": {
      "POSTEVERYWHERE_API_KEY": "pe_live_your_key_here"
    }
  }
}
```

📖 [Cursor MCP docs →](https://docs.cursor.com/context/model-context-protocol)

#### Other MCP clients

This package exposes a standard `stdio` MCP server. Any [MCP-compatible client](https://modelcontextprotocol.io/clients) can connect using the same configuration shape.

### 3. Try it out

Once connected, ask your AI assistant things like:

> "List my connected social accounts"

> "Schedule a post to all my accounts for tomorrow at 2pm: Just shipped a new feature 🚀"

> "Show me my recent posts and their publishing status"

> "Generate an image of a sunset over mountains in 16:9 and post it to Instagram and X"

> "Retry the failed destinations on my latest post"

> "What are my last 10 posts on TikTok?"

## Available Tools

### Accounts
- `list_accounts` — list all connected social accounts and their health status
- `get_account` — get details for a specific account (token expiry, can-post status)

### Posts
- `list_posts` — list posts filtered by status (`scheduled`, `published`, `failed`, `draft`) or platform
- `get_post` — get full details for a single post including all destinations
- `create_post` — create and schedule a post to one, several, or all connected accounts
- `update_post` — modify a scheduled or draft post (content, schedule time, accounts)
- `delete_post` — delete a scheduled or draft post
- `get_post_results` — per-platform publishing results, errors, and live URLs
- `retry_failed_post` — retry every failed destination of a post

### Media
- `list_media` — list files in your media library
- `get_media` — get media file details and processing status
- `delete_media` — remove a media file

### AI
- `generate_image` — generate an image from a text prompt (4 models, 7 aspect ratios)

📖 [Full tool reference and parameters →](https://developers.posteverywhere.ai)

## Example Prompts

These all work out of the box once the server is connected:

### Scheduling
- *"Schedule a Christmas post for December 25th at 9am: Merry Christmas to our amazing community 🎄"*
- *"Post this to Instagram and TikTok only: Behind-the-scenes of our latest feature drop"*
- *"Queue up a week of daily morning posts starting Monday at 9am"*

### Content generation
- *"Generate a 9:16 image of a coffee shop at sunrise and schedule it as a TikTok post for tomorrow"*
- *"Create a square image of abstract green shapes for a LinkedIn carousel"*

### Monitoring
- *"What posts failed in the last week and why?"*
- *"Show me the publishing results for my last Instagram Reel"*
- *"Which of my accounts need to be reconnected?"*

### Recovery
- *"Retry the failed LinkedIn destination on post abc-123"*
- *"Delete all my draft posts older than 30 days"*

Each natural-language prompt maps to one or more MCP tool calls — the agent figures out the right sequence.

## Supported Platforms

All eight platforms work on every plan:

- **[Instagram](https://posteverywhere.ai/instagram-scheduler)** — feed, reels, stories, carousels
- **[TikTok](https://posteverywhere.ai/tiktok-scheduler)** — videos, photo carousels
- **[YouTube](https://posteverywhere.ai/youtube-scheduler)** — videos with thumbnails, descriptions, tags
- **[LinkedIn](https://posteverywhere.ai/linkedin-scheduler)** — text, images, video, document carousels
- **[Facebook](https://posteverywhere.ai/facebook-scheduler)** — pages, video, reels, multi-image
- **X (Twitter)** — text, threads, media (tier-aware char limits)
- **Threads** — text and media posts
- **Pinterest** — pins to boards

## Configuration

| Environment variable | Required | Description |
|---|---|---|
| `POSTEVERYWHERE_API_KEY` | ✅ | Your API key from [Settings → Developers](https://app.posteverywhere.ai/developers). Format: `pe_live_...` |
| `POSTEVERYWHERE_BASE_URL` | ❌ | Override base URL (default `https://app.posteverywhere.ai`). Useful for self-hosted deployments. |

## Rate Limits

| Resource | Per minute | Per hour | Per day |
|---|---|---|---|
| **General API calls** | 60 | 1,000 | — |
| **Posts** | 60 | 200 | 1,000 |
| **AI generation** | — | 60 | — |

Hitting a 429? The MCP server returns a clear `rate_limit_exceeded` code with `retry_after` seconds — the agent will know to wait and retry.

📖 [Rate limit details →](https://developers.posteverywhere.ai/rate-limits)

## How it compares

| | This MCP server | [PostEverywhere SDK](https://github.com/posteverywhere/sdk) | Direct REST API |
|---|---|---|---|
| Use with Claude / Cursor / MCP clients | ✅ Native | ❌ | ❌ |
| Use in Node.js code | ❌ (use SDK) | ✅ | ✅ |
| Natural-language scheduling | ✅ | ❌ | ❌ |
| TypeScript types | ✅ | ✅ | Manual |
| Auto-retry / backoff | ✅ | ✅ | Manual |
| Best for | AI-assisted social media | Programmatic integrations | Any HTTP client / language |

## Documentation

- 📖 [Full API Reference](https://developers.posteverywhere.ai) — every tool, every parameter
- 🔐 [Authentication & Scopes](https://developers.posteverywhere.ai/authentication)
- ⚠️ [Error Handling](https://developers.posteverywhere.ai/errors) — including the `retryable` flag agents should respect
- ⏱️ [Rate Limits](https://developers.posteverywhere.ai/rate-limits) — per-minute, per-hour, per-day caps
- 🖼️ [Media Requirements](https://developers.posteverywhere.ai/media-requirements) — file size, format, aspect ratio per platform
- 🤖 [Agent System Prompts](https://developers.posteverywhere.ai/integrations/agent-system-prompt) — recommended prompts for AI agent integrations
- 🧠 [About MCP](https://modelcontextprotocol.io/introduction) — the open protocol behind this server
- 🚀 [Quick Start Guide](https://developers.posteverywhere.ai/quick-start) — first post in 60 seconds
- 🔗 [Webhooks](https://developers.posteverywhere.ai/webhooks) — receive publish events on your endpoints
- 🏷️ [API Scopes](https://developers.posteverywhere.ai/scopes) — fine-grained permission control
- 📋 [Changelog](https://developers.posteverywhere.ai/changelog) — what's new in the API

## MCP & AI Tooling Resources

- 🧠 [Model Context Protocol — Specification](https://modelcontextprotocol.io)
- 🛠️ [MCP Quickstart for Users](https://modelcontextprotocol.io/quickstart/user)
- 👨‍💻 [MCP Quickstart for Developers](https://modelcontextprotocol.io/quickstart/server)
- 🗂️ [Browse all MCP servers (community list)](https://modelcontextprotocol.io/examples)
- 💼 [Anthropic — MCP announcement](https://www.anthropic.com/news/model-context-protocol)
- 🔧 [Claude Code — Get started](https://docs.claude.com/en/docs/claude-code/overview)
- 🔧 [Claude Code — MCP setup](https://docs.claude.com/en/docs/claude-code/mcp)
- 🖥️ [Claude Desktop](https://claude.ai/download)
- 🖱️ [Cursor — MCP docs](https://docs.cursor.com/context/model-context-protocol)
- 💬 [Anthropic Claude](https://claude.ai)

## PostEverywhere Around the Web

- 🌐 [PostEverywhere Homepage](https://posteverywhere.ai)
- 🛠️ [Developers Landing Page](https://posteverywhere.ai/developers) — overview of API, SDK, MCP, integrations
- 🤖 [AI Agents Page](https://posteverywhere.ai/agents) — using PostEverywhere with Claude, ChatGPT, Cursor, and more
- 💵 [Pricing](https://posteverywhere.ai/pricing) — Starter ($19), Growth ($39), Pro ($79); 7-day free trial
- ✍️ [Blog](https://posteverywhere.ai/blog) — guides, tutorials, product updates
- 📚 [Help Center](https://posteverywhere.ai/docs/help-center) — guides, troubleshooting, FAQs
- 🎛️ [Dashboard (sign in)](https://app.posteverywhere.ai)
- ✨ [Sign Up — 7-day free trial](https://app.posteverywhere.ai/signup)
- 🔑 [Get an API key](https://app.posteverywhere.ai/developers)
- 📦 [Node.js SDK (npm)](https://www.npmjs.com/package/posteverywhere)
- 💻 [Node.js SDK (GitHub)](https://github.com/posteverywhere/sdk)
- 📦 [MCP Server (npm — this package)](https://www.npmjs.com/package/@posteverywhere/mcp)
- 💻 [MCP Server (GitHub — this repo)](https://github.com/posteverywhere/mcp)
- 🏢 [PostEverywhere on GitHub](https://github.com/posteverywhere)

## Per-Platform Schedulers

PostEverywhere is the backend for all of these — every plan includes every platform:

- 📷 [Instagram Scheduler](https://posteverywhere.ai/instagram-scheduler) — feed posts, reels, stories, carousels
- 🎵 [TikTok Scheduler](https://posteverywhere.ai/tiktok-scheduler) — videos, photo carousels, full content disclosure flags
- 📺 [YouTube Scheduler](https://posteverywhere.ai/youtube-scheduler) — videos with thumbnails, tags, descriptions, privacy controls
- 💼 [LinkedIn Scheduler](https://posteverywhere.ai/linkedin-scheduler) — personal + Company Page posts, document carousels, video
- 👍 [Facebook Scheduler](https://posteverywhere.ai/facebook-scheduler) — Pages, Reels, video, multi-image carousels
- 🐦 X (Twitter), Threads, Pinterest — all included on every plan

## Related

- 📦 **[`posteverywhere`](https://github.com/posteverywhere/sdk)** — Node.js / TypeScript SDK ([npm](https://www.npmjs.com/package/posteverywhere))
- 🌐 **[posteverywhere.ai](https://posteverywhere.ai)** — Web dashboard, AI Studio, calendar UI
- 📚 **[Help Center](https://posteverywhere.ai/docs/help-center)** — Guides, troubleshooting, FAQ
- 💵 **[Pricing](https://posteverywhere.ai/pricing)** — From $19/mo, 7-day free trial

## Support

- 📧 Email: [support@posteverywhere.ai](mailto:support@posteverywhere.ai)
- 🐛 Issues: [github.com/posteverywhere/mcp/issues](https://github.com/posteverywhere/mcp/issues)
- 💬 [Help Center](https://posteverywhere.ai/docs/help-center)

## License

MIT — see [LICENSE](LICENSE).

---

Built by the team at [PostEverywhere](https://posteverywhere.ai). The smarter way to schedule social media to [Instagram](https://posteverywhere.ai/instagram-scheduler), [TikTok](https://posteverywhere.ai/tiktok-scheduler), [YouTube](https://posteverywhere.ai/youtube-scheduler), [LinkedIn](https://posteverywhere.ai/linkedin-scheduler), [Facebook](https://posteverywhere.ai/facebook-scheduler), X, Threads, and Pinterest — now with native [MCP support](https://modelcontextprotocol.io) for AI agents.
