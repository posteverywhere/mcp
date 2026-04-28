# Contributing to the PostEverywhere MCP Server

Thanks for your interest in contributing to the [PostEverywhere MCP server](https://www.npmjs.com/package/@posteverywhere/mcp)! This guide covers reporting issues, proposing features, and submitting code.

## TL;DR

- **🐛 Bug reports** → [open an issue](https://github.com/posteverywhere/mcp/issues/new) with a minimal reproduction
- **💡 Feature/tool requests** → [open an issue](https://github.com/posteverywhere/mcp/issues/new) describing the use case
- **🔧 Pull requests** → fork, branch, change, test, PR
- **📧 Private/security** → [support@posteverywhere.ai](mailto:support@posteverywhere.ai) (see [SECURITY.md](SECURITY.md))

## Reporting bugs

The [issue tracker on GitHub](https://github.com/posteverywhere/mcp/issues) is the best place. A good report includes:

1. MCP server version (`npm ls @posteverywhere/mcp` or check `~/.cache/npm/_npx/...`)
2. Your MCP client + version (Claude Code / Claude Desktop / Cursor / etc.)
3. Node.js version (`node --version`)
4. The natural-language prompt that triggered the issue
5. The actual MCP tool call(s) the agent attempted (visible in client logs)
6. The full error message returned to the agent

## What is MCP?

If you're new to the [Model Context Protocol](https://modelcontextprotocol.io), start with the [user quickstart](https://modelcontextprotocol.io/quickstart/user) and [Anthropic's announcement](https://www.anthropic.com/news/model-context-protocol). This server implements the standard `stdio` transport and exposes PostEverywhere's API as MCP tools.

## Local development

```bash
# Clone
git clone https://github.com/posteverywhere/mcp.git
cd mcp

# Install
npm install

# Build
npm run build

# Run locally with your own API key
export POSTEVERYWHERE_API_KEY=pe_live_...
node dist/index.js
```

To test it inside Claude Code, point the `command` at your local checkout:

```json
{
  "mcpServers": {
    "posteverywhere-dev": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/index.js"],
      "env": { "POSTEVERYWHERE_API_KEY": "pe_live_..." }
    }
  }
}
```

You'll need a PostEverywhere account. [Sign up free](https://app.posteverywhere.ai/signup) (7-day trial, no credit card required for the trial period), connect a few social accounts, then [create an API key](https://app.posteverywhere.ai/developers).

## Pull request checklist

- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] If you added a new MCP tool, update the README's "Available Tools" section
- [ ] Test the new tool from inside an MCP client (Claude Code is fastest)
- [ ] Don't bump the package version yourself — we'll do it on merge

## Adding a new MCP tool

Tools live in [`src/tools.ts`](src/tools.ts). The pattern:

1. Add a Zod schema describing the input parameters
2. Register the tool with `server.tool(name, description, schema, handler)`
3. The handler calls the underlying [PostEverywhere REST API](https://developers.posteverywhere.ai) via the typed client in [`src/client.ts`](src/client.ts)
4. Return the result as `{ content: [{ type: 'text', text: JSON.stringify(...) }] }`

Tool names should be `snake_case` (e.g. `list_posts`, `create_post`). Descriptions should be **action-oriented** so AI agents pick the right tool for natural-language prompts.

## Code style

- TypeScript, strict mode, 2-space indent
- Keep tool descriptions concise but complete — the LLM uses them to plan tool calls
- One PR per logical change

## Project layout

```
mcp-server/
├─ src/
│  ├─ index.ts         # MCP server entrypoint (stdio transport)
│  ├─ tools.ts         # MCP tool definitions
│  └─ client.ts        # Typed HTTP client wrapping the REST API
├─ dist/               # Built artifacts (gitignored)
├─ package.json
└─ README.md
```

## Releases

Releases are tagged on GitHub and published to npm by the maintainers. Versioning follows [Semantic Versioning](https://semver.org). See [CHANGELOG.md](CHANGELOG.md) for history.

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).

## Resources

- 🧠 [Model Context Protocol spec](https://modelcontextprotocol.io)
- 📖 [PostEverywhere API Documentation](https://developers.posteverywhere.ai)
- 📦 [Companion Node.js SDK](https://github.com/posteverywhere/sdk)
- 🌐 [PostEverywhere homepage](https://posteverywhere.ai)
- 📚 [Help Center](https://posteverywhere.ai/support)
