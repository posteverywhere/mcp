---
name: 🐛 Bug report
about: Report a bug or unexpected behavior in the PostEverywhere MCP Server
title: "[Bug] "
labels: bug
assignees: ''
---

## What happened?

<!-- A clear description of the bug. -->

## Expected behavior

<!-- What you expected the AI agent to do or the MCP server to return. -->

## The natural-language prompt that triggered it

<!-- What did you ask Claude / Cursor / your MCP client to do? -->
> "..."

## The MCP tool call(s) the agent made

<!--
If your client shows tool calls (Claude Code does in the terminal), paste them here.
Example: list_posts({"status": "scheduled", "limit": 10})
-->

```json
```

## Error / output returned to the agent

```
<paste the error message or unexpected output>
```

## Environment

- **MCP server version:** <!-- e.g. 1.1.1 — usually shown in your MCP client logs -->
- **MCP client:** <!-- Claude Code / Claude Desktop / Cursor / other -->
- **MCP client version:** <!-- e.g. Claude Code 1.x.x -->
- **Node.js version:** <!-- run `node --version` -->
- **OS:** <!-- macOS 14 / Ubuntu 22.04 / Windows 11 / etc. -->

## Additional context

<!--
- Did the same prompt work in a previous version?
- Is this specific to one social platform (e.g. only fails for Instagram)?
- Have you connected the relevant accounts at app.posteverywhere.ai/accounts?
-->

---

> 🔐 **Security issue?** Don't file it here. Email [support@posteverywhere.ai](mailto:support@posteverywhere.ai) — see [SECURITY.md](../../SECURITY.md).
> 📖 **Looking for help, not a bug?** Try the [API docs](https://developers.posteverywhere.ai), the [Help Center](https://posteverywhere.ai/support), or the [MCP spec](https://modelcontextprotocol.io) first.
> 📦 **Building a programmatic integration?** The companion [Node.js SDK](https://github.com/posteverywhere/sdk) might be a better fit.
