# Changelog — `@posteverywhere/mcp`

All notable changes to the [PostEverywhere MCP Server](https://www.npmjs.com/package/@posteverywhere/mcp) are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] — 2026-06-14

### Added — draft workflow (human-in-the-loop)

- **`create_post` now supports `draft: true`** — save a post as a **draft** for human review instead of publishing or scheduling it. `account_ids` is optional for drafts (choose them later).
- **New `schedule_post` tool** — publish or schedule a draft created with `create_post(draft: true)`: pass `scheduled_for` (ISO 8601 UTC) to schedule, or `publish_now: true` to publish immediately. Optionally override `account_ids`.
- **`list_posts(status: "draft")` and `get_post`** now return a draft's target accounts and per-platform content, so an agent can review a draft before publishing.

Together these enable the review loop: `create_post(draft: true)` → `list_posts(status: "draft")` / `get_post` → `schedule_post`.

### Changed

- Docs now reflect **ChatGPT** (via the hosted connector) and **OpenAI Codex** as supported MCP clients, alongside Claude Code, Claude Desktop, and Cursor.
- `User-Agent` bumped to `posteverywhere-mcp/1.4.0`.

## [1.3.0] — 2026-06-11

### Added — 18 new tools

**Introspection & analytics**
- **`get_me`** — current API key context, scopes, organization, quota, plan limits.
- **`get_analytics_summary`** — aggregate counters (today/week/month/custom) for posts, per-platform breakdown, total metrics, AI credit usage.

**Campaigns CRUD**
- **`list_campaigns`** / **`create_campaign`** / **`get_campaign`** / **`update_campaign`** / **`delete_campaign`** — group related posts under named campaigns, filter posts by `campaign_id`.

**Webhooks (subscribe to events instead of polling)**
- **`list_webhooks`** / **`create_webhook`** / **`get_webhook`** / **`update_webhook`** / **`delete_webhook`** / **`test_webhook`** — 12 event types (`post.published`, `post.failed`, `account.reconnect_needed`, …) signed with HMAC-SHA256.

**Bulk + power-user tools**
- **`bulk_create_posts`** — create up to 50 posts in a single API call.
- **`retry_failed_posts`** — bulk-retry failed destinations by filter (account_id, platform, date range).
- **`list_posts_advanced`** — full filter set on `GET /v1/posts`: comma-separated status/platform, date ranges, sort/order, search.

**Account + AI**
- **`get_account_health`** — token expiry, can-post status, recent failure count.
- **`generate_caption`** — AI captions tuned per-platform (character limits, hashtag conventions, tone, length).

### Changed
- Underlying `PostEverywhereClient` (`src/client.ts`) extended with corresponding typed methods. Existing tools (`list_accounts`, `list_posts`, `create_post`, etc.) are untouched.
- See the [PostEverywhere API Changelog](https://docs.posteverywhere.ai/changelog#2026-06-11--major-api-upgrade-introspection-webhooks-campaigns-bulk-ops) for server-side details.

## [1.2.0] — 2026-05-24

### Added
- **`upload_media_from_url` tool** — import an image from any public URL directly into the PostEverywhere media library, no 3-step REST dance required. Server fetches the bytes, stores on Cloudflare Images, and returns a `media_id` ready to attach to `create_post`. Supports JPEG, PNG, GIF, WebP, HEIC, HEIF up to 25 MB.

### Changed
- `create_post.media_ids` description corrected — previously referenced a non-existent `upload_media` tool. Now points to `upload_media_from_url` (recommended) or `generate_image`; existing library files can be found with `list_media`.
- `update_post.media_ids` description updated to match.

### Notes
- Video URLs are not supported by `upload_media_from_url` yet — they still need the 3-step REST flow (`POST /v1/media/upload` → `PUT` presigned URL → `POST /v1/media/{id}/complete`). The tool will return a 415 with a clear hint if you pass a video URL.

## [1.1.2] — 2026-04-28

### Fixed
- README references to the companion Node.js SDK now correctly point to [`@posteverywhere/sdk`](https://www.npmjs.com/package/@posteverywhere/sdk) (v1.1.1 was published with stale references to the deprecated `posteverywhere` package name)
- CHANGELOG link to the SDK npm page corrected

## [1.1.1] — 2026-04-28

### Added
- Comprehensive SEO-optimized README with quick-links table, MCP tooling resources (links to the [Model Context Protocol spec](https://modelcontextprotocol.io), [Anthropic's MCP announcement](https://www.anthropic.com/news/model-context-protocol), [Claude Code MCP docs](https://docs.claude.com/en/docs/claude-code/mcp), [Claude Desktop](https://claude.ai/download), and [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol)) and detailed setup instructions for every major MCP-compatible AI client
- 21 new SEO keywords on the published package (now 28 total — was 7), covering all 8 social platforms (Instagram, TikTok, YouTube, LinkedIn, Facebook, X/Twitter, Threads, Pinterest), all major MCP clients, and AI-agent terminology
- `repository` field on the published package linking to [`github.com/posteverywhere/mcp`](https://github.com/posteverywhere/mcp) — previously empty on npm, causing a missing "Repository" sidebar link
- `engines.node` field declaring Node.js 18+ as the minimum supported runtime (required by the MCP SDK)
- `publishConfig.access: public` and `prepublishOnly` build hook for safe publishes
- MIT `LICENSE` file shipped in the published tarball

### Changed
- **Package renamed** from `@posteverywhere/mcp-server` (in source) to `@posteverywhere/mcp` (matches the published package name on npm — the previous mismatch would have caused future publishes to land on the wrong package)
- Description text expanded to enumerate all 8 platforms and every supported AI client
- Repository transferred to the [`posteverywhere`](https://github.com/posteverywhere) GitHub organization with public access

### Fixed
- Broken `posteverywhere.ai/docs/help-center` link replaced with the working [`/support`](https://posteverywhere.ai/support) Help Center

## [1.1.0] — 2026-03-18

### Added
- Initial public release of the MCP server
- Tools for accounts, posts, media, and AI image generation
- Setup instructions for Claude Desktop, Claude Code, and Cursor
- Standard `stdio` MCP transport — works with any [MCP-compatible client](https://modelcontextprotocol.io/clients)

---

## Resources

- 📦 **[npm package](https://www.npmjs.com/package/@posteverywhere/mcp)**
- 💻 **[GitHub repository](https://github.com/posteverywhere/mcp)**
- 📦 **[Companion Node.js SDK](https://www.npmjs.com/package/@posteverywhere/sdk)** for programmatic integrations
- 📖 **[Full API documentation](https://developers.posteverywhere.ai)**
- 🌐 **[PostEverywhere homepage](https://posteverywhere.ai)**
- 🧠 **[Model Context Protocol](https://modelcontextprotocol.io)** — the open standard this server implements
- 💵 **[Pricing](https://posteverywhere.ai/pricing)** — Starter ($19), Growth ($39), Pro ($79); 7-day free trial
- 📚 **[Help Center](https://posteverywhere.ai/support)**
- 📧 **[support@posteverywhere.ai](mailto:support@posteverywhere.ai)**
