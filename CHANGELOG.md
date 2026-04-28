# Changelog — `@posteverywhere/mcp`

All notable changes to the [PostEverywhere MCP Server](https://www.npmjs.com/package/@posteverywhere/mcp) are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
