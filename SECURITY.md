# Security Policy

The [PostEverywhere MCP Server](https://www.npmjs.com/package/@posteverywhere/mcp) handles API keys that grant access to social media accounts and content publishing. We take security seriously and appreciate responsible disclosure.

## Reporting a Vulnerability

**Do not file a public GitHub issue for security vulnerabilities.**

Please report security issues privately to **[support@posteverywhere.ai](mailto:support@posteverywhere.ai)** with the subject line: `[SECURITY] <short summary>`.

Include:
- A description of the issue and its potential impact
- Steps to reproduce (or a proof-of-concept)
- Affected version(s) of the SDK or API
- Any suggested mitigation

We aim to acknowledge reports within **2 business days** and provide a status update within **7 business days**. Critical issues affecting paying customers receive immediate attention.

## Supported Versions

We provide security fixes for the latest minor version of the SDK. Older versions are best-effort.

| Version | Supported |
|---|---|
| 1.2.x | ✅ |
| 1.1.x | ⚠️ Best-effort |
| 1.0.x | ❌ Please upgrade |

## What's in scope

- Vulnerabilities in the SDK code itself (auth bypass, credential leakage, prototype pollution, etc.)
- Vulnerabilities in the [PostEverywhere REST API](https://developers.posteverywhere.ai) reachable via the SDK
- Supply-chain concerns affecting the published [npm package](https://www.npmjs.com/package/@posteverywhere/mcp)

## What's not in scope

- Vulnerabilities in upstream dependencies (please report to those projects)
- Social engineering of PostEverywhere staff or customers
- Issues requiring physical access to a user's device
- Self-XSS where the user is already an admin

## Recognition

We don't currently run a bug bounty program, but we credit reporters in release notes (with permission).

## Related

- 🔐 [API Authentication & Scopes](https://developers.posteverywhere.ai/authentication)
- 🤖 [Companion Node.js SDK security policy](https://github.com/posteverywhere/sdk/blob/main/SECURITY.md)
- 📚 [Help Center](https://posteverywhere.ai/support)
- 📧 [support@posteverywhere.ai](mailto:support@posteverywhere.ai)
