# MCP Registry + Anthropic Connectors Directory submission package (Jul 24, 2026)

## 1. Official MCP Registry (ai.posteverywhere/mcp)

Status: server.json written + VALIDATED against the live registry. Blocked only on the DNS TXT record.

- server.json: this repo, validated (schema 2025-12-11), remotes-only v1
  (npm package deferred: @posteverywhere/mcp@1.4.1 lacks the required `mcpName`
  field; add in next npm release, then append the `packages` block and republish)
- Keypair: /home/jamiepartridge/.mcp-registry-ed25519.pem (chmod 600 — do not lose;
  it is the permanent publish credential for the ai.posteverywhere namespace)
- TXT record needed on posteverywhere.ai:
  `v=MCPv1; k=ed25519; p=3mhT46649DKClxRth0shgAcHelriOBqNy6UwXxXxfYo=`
  (script ready: posteverywhere-app/.cfdns.mjs — uses CLOUDFLARE_OPS_API_TOKEN)
- Then publish:
  ```
  mcp-publisher login dns --domain posteverywhere.ai \
    --private-key $(openssl pkey -in ~/.mcp-registry-ed25519.pem -outform DER | tail -c 32 | xxd -p -c 64)
  cd ~/projects/mcp && mcp-publisher publish
  ```
- Listing auto-feeds PulseMCP + OpenTools.

## 2. Anthropic Connectors Directory (remote MCP form)

Checklist audit:

| Requirement | Status |
| --- | --- |
| Remote HTTPS + Streamable HTTP | PASS (mcp.posteverywhere.ai/mcp, 401 challenge = OAuth handshake correct) |
| OAuth w/ claude.ai callback | PASS (already live as claude.ai connector, OAuth 2.1) |
| Read/write separated tools | PASS (34 tools, granular list_/get_ vs create_/update_/delete_) |
| Tool titles + readOnlyHint/destructiveHint | FAIL (0 of 34 tools annotated) |
| Square SVG logo hosted | PASS https://app.posteverywhere.ai/favicon.svg (543x543) |
| Privacy policy | PASS https://posteverywhere.ai/privacy |
| Public docs | PASS https://developers.posteverywhere.ai |
| 3-5 example prompts | drafted below |

Example prompts for the form:
1. "Post this product photo to Instagram, Facebook and LinkedIn with a caption in my brand voice, and schedule X and Threads versions for 9am tomorrow."
2. "What were my top 5 posts by engagement this month across all platforms?"
3. "Take this blog post URL and turn it into a week of scheduled posts across my connected accounts."
4. "Check the health of my connected accounts and retry any posts that failed this week."
5. "Generate an image for tomorrow's post about our summer sale and schedule it to all my accounts at each platform's best time."

Remaining work before submitting the form: add title + readOnlyHint/destructiveHint
annotations to all 34 tools in src/tools.ts, release to npm + redeploy hosted
endpoint, retest as custom connector, then fill the form (human step, ~6 pages).

## 3. Other submissions ready to do (no PR volume needed)
- Smithery: smithery.ai/new (paste hosted URL)
- mcp.so: comment on chatmcp/mcpso issue #1
- mcpservers.org/submit
