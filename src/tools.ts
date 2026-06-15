/**
 * MCP Tool Definitions for PostEverywhere
 *
 * Each tool maps 1:1 to a REST API v1 endpoint.
 * Tool descriptions follow Anthropic's best practices: 3-4 sentences
 * explaining what, when, and what it returns.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { PostEverywhereClient } from './client.js';

export function registerTools(server: McpServer, client: PostEverywhereClient) {

  // ─── Accounts ──────────────────────────────────────────────

  server.tool(
    'list_accounts',
    'List all connected social media accounts on PostEverywhere. Returns account IDs, platform names, usernames, and health status (whether each account can currently post). Use this to see which platforms are available before creating a post.',
    {},
    async () => {
      const result = await client.listAccounts();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.accounts, null, 2) }],
      };
    }
  );

  server.tool(
    'get_account',
    'Get detailed information about a specific connected social media account on PostEverywhere. Returns the account platform, username, health status, and whether it can currently post. Use this to check the status of a single account by its ID.',
    {
      account_id: z.number().describe('The numeric ID of the social account to retrieve'),
    },
    async ({ account_id }) => {
      const result = await client.getAccount(account_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── Posts ─────────────────────────────────────────────────

  server.tool(
    'list_posts',
    'List scheduled, published, or draft posts on PostEverywhere. Supports filtering by status (scheduled, published, draft) and platform. Returns post content, scheduling info, and per-platform destination statuses. Use this to check what posts are queued or to review published content.',
    {
      status: z.enum(['scheduled', 'published', 'draft']).optional().describe('Filter by post status'),
      platform: z.string().optional().describe('Filter by platform (e.g., instagram, linkedin, x)'),
      limit: z.number().min(1).max(100).optional().default(20).describe('Number of posts to return'),
    },
    async ({ status, platform, limit }) => {
      const result = await client.listPosts({ status, platform, limit });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.posts, null, 2) }],
      };
    }
  );

  server.tool(
    'get_post',
    'Get detailed information about a specific post on PostEverywhere, including its content, media attachments, schedule, and the publishing status on each destination platform. Use this to check if a post was published successfully or to see error details for failed destinations.',
    {
      post_id: z.string().uuid().describe('The UUID of the post to retrieve'),
    },
    async ({ post_id }) => {
      const result = await client.getPost(post_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'create_post',
    'Create a social media post on PostEverywhere. Three modes: (1) PUBLISH NOW — give content + account_ids, omit scheduled_for; (2) SCHEDULE — add scheduled_for; (3) DRAFT for human review — set draft: true, which saves the post WITHOUT publishing it (it appears in the user\'s PostEverywhere app and via list_posts(status:"draft"); you then publish it with schedule_post once approved). Use draft mode whenever a human wants to check posts before they go live. Supports per-platform overrides and media. Returns the post ID, its status, and the next step to take.',
    {
      content: z.string().describe('The text content of the post'),
      account_ids: z.array(z.number()).optional().describe('Social account IDs to post to (from list_accounts). REQUIRED to publish or schedule; OPTIONAL for a draft (accounts can be chosen later when you call schedule_post).'),
      scheduled_for: z.string().optional().describe('ISO 8601 datetime to schedule the post (e.g., 2026-03-15T14:00:00Z). Omit to publish immediately. When draft:true this is optional and just pre-fills the draft\'s suggested time.'),
      timezone: z.string().optional().default('UTC').describe('IANA timezone for scheduling (e.g., America/New_York)'),
      media_ids: z.array(z.string()).optional().describe('Array of media UUIDs to attach. Get these from upload_media_from_url (recommended) or generate_image. Existing library files can be looked up with list_media.'),
      draft: z.boolean().optional().describe('Set true to save as a DRAFT for human review instead of publishing or scheduling. The draft is NOT published until you call schedule_post on it. Review drafts with list_posts(status:"draft") or get_post.'),
    },
    async ({ content, account_ids, scheduled_for, timezone, media_ids, draft }) => {
      const result = await client.createPost({
        content,
        account_ids,
        scheduled_for,
        timezone,
        media_ids,
        draft,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'schedule_post',
    'Publish or schedule a DRAFT (created with create_post(draft: true)). Pass scheduled_for to schedule it for a future time, or publish_now: true to publish it right away. Optionally pass account_ids to set/override which accounts it posts to (defaults to the accounts saved on the draft). This is the final step of the review workflow: create_post(draft:true) → review with list_posts(status:"draft")/get_post → schedule_post. Only works on drafts — to re-time an already-scheduled post, use update_post.',
    {
      post_id: z.string().uuid().describe('The UUID of the draft to publish (from create_post or list_posts)'),
      scheduled_for: z.string().optional().describe('ISO 8601 datetime to schedule for (e.g., 2026-06-20T14:00:00Z). Provide this OR publish_now.'),
      publish_now: z.boolean().optional().describe('Set true to publish the draft immediately instead of scheduling it.'),
      account_ids: z.array(z.number()).optional().describe('Optional: accounts to publish to, overriding the draft\'s saved targets.'),
      timezone: z.string().optional().describe('IANA timezone for display (does not change when the post fires).'),
    },
    async ({ post_id, scheduled_for, publish_now, account_ids, timezone }) => {
      const result = await client.schedulePost(post_id, { scheduled_for, publish_now, account_ids, timezone });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'update_post',
    'Update a scheduled or draft post on PostEverywhere. You can change the content, schedule time, timezone, target accounts, or media attachments. Only posts with status "scheduled" or "draft" can be edited — published posts cannot be modified. Returns the updated post with all its details.',
    {
      post_id: z.string().uuid().describe('The UUID of the post to update'),
      content: z.string().optional().describe('New text content for the post'),
      scheduled_for: z.string().optional().describe('New ISO 8601 datetime to schedule the post'),
      timezone: z.string().optional().describe('New IANA timezone for scheduling'),
      account_ids: z.array(z.number()).optional().describe('New array of social account IDs to post to'),
      media_ids: z.array(z.string()).optional().describe('New array of media UUIDs to attach. Get these from upload_media_from_url or generate_image.'),
    },
    async ({ post_id, content, scheduled_for, timezone, account_ids, media_ids }) => {
      const result = await client.updatePost(post_id, {
        content,
        scheduled_for,
        timezone,
        account_ids,
        media_ids,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'delete_post',
    'Delete a scheduled or draft post from PostEverywhere. This permanently removes the post and all its platform destinations. Cannot delete posts that have already been published. Use with caution as this action cannot be undone.',
    {
      post_id: z.string().uuid().describe('The UUID of the post to delete'),
    },
    async ({ post_id }) => {
      const result = await client.deletePost(post_id);
      return {
        content: [{ type: 'text' as const, text: `Post ${post_id} deleted successfully.` }],
      };
    }
  );

  // ─── Post Results ──────────────────────────────────────────

  server.tool(
    'get_post_results',
    'Get the per-platform publishing results for a specific post on PostEverywhere. Returns detailed status for each destination including published URLs, error messages, attempt counts, and retry schedules. Use this to check which platforms succeeded or failed after publishing.',
    {
      post_id: z.string().uuid().describe('The UUID of the post to get results for'),
    },
    async ({ post_id }) => {
      const result = await client.getPostResults(post_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── Retry ─────────────────────────────────────────────────

  server.tool(
    'retry_failed_post',
    'Retry all failed platform destinations for a specific post on PostEverywhere. Resets failed destinations back to queued status so they will be re-attempted by the publishing system. Use this when a post failed due to temporary issues like rate limits or token expiry (after the token has been refreshed).',
    {
      post_id: z.string().uuid().describe('The UUID of the post with failed destinations'),
    },
    async ({ post_id }) => {
      const result = await client.retryPost(post_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── Media ─────────────────────────────────────────────────

  server.tool(
    'list_media',
    'List media files in the PostEverywhere media library. Supports filtering by type (image, video, document) and pagination. Returns file metadata including URLs, dimensions, and upload status. Use this to find existing media to attach to posts.',
    {
      type: z.enum(['image', 'video', 'document']).optional().describe('Filter by media type'),
      limit: z.number().min(1).max(100).optional().default(20).describe('Number of items to return'),
    },
    async ({ type, limit }) => {
      const result = await client.listMedia({ type, limit });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.media, null, 2) }],
      };
    }
  );

  server.tool(
    'get_media',
    'Get detailed information about a specific media file on PostEverywhere, including its type, dimensions, file size, upload status, and aspect ratio. Use this to check if an uploaded media file has finished processing before attaching it to a post.',
    {
      media_id: z.string().uuid().describe('The UUID of the media file to retrieve'),
    },
    async ({ media_id }) => {
      const result = await client.getMediaStatus(media_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'delete_media',
    'Delete a media file from the PostEverywhere media library. This permanently removes the file from storage and cannot be undone. Any posts that reference this media will no longer have the attachment. Use with caution.',
    {
      media_id: z.string().uuid().describe('The UUID of the media file to delete'),
    },
    async ({ media_id }) => {
      const result = await client.deleteMedia(media_id);
      return {
        content: [{ type: 'text' as const, text: `Media ${media_id} deleted successfully.` }],
      };
    }
  );

  server.tool(
    'upload_media_from_url',
    'Import an image from a public URL into the PostEverywhere media library. The image is fetched server-side, stored, and immediately ready to attach to posts via media_ids. Supported: JPEG, PNG, GIF, WebP, HEIC, HEIF — up to 25 MB. Image-only for now; videos still require the 3-step REST flow (POST /v1/media/upload → PUT presigned URL → POST /v1/media/{id}/complete). Returns { media_id, url, content_type, size } — pass media_id directly to create_post.',
    {
      url: z.string().url().describe('Public HTTPS URL pointing to the image. Must be reachable from the public internet (no private/loopback addresses).'),
      filename: z.string().optional().describe('Optional filename to record in the library. If omitted, derived from the URL path.'),
    },
    async ({ url, filename }) => {
      const result = await client.uploadMediaFromUrl({ url, filename });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── AI ───────────────────────────────────────────────────

  server.tool(
    'generate_image',
    'Generate an AI image from a text prompt on PostEverywhere. The image is saved to your media library and can be attached to posts via media_ids. Choose from 4 models: gemini-3-pro (default, balanced quality, 5 credits), nano-banana-pro (photorealism, 15 credits), ideogram-v2 (best for text-in-image, 8 credits), flux-schnell (fastest, 1 credit). Requires the "ai" scope on your API key.',
    {
      prompt: z.string().max(2000).describe('Text description of the image to generate'),
      aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '4:5', '5:4']).optional().default('1:1').describe('Aspect ratio for the generated image'),
      model: z.enum(['nano-banana-pro', 'ideogram-v2', 'gemini-3-pro', 'flux-schnell']).optional().default('gemini-3-pro').describe('AI model to use for generation'),
    },
    async ({ prompt, aspect_ratio, model }) => {
      const result = await client.generateImage({ prompt, aspect_ratio, model });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    'generate_caption',
    'Generate 1-5 AI caption variants for a social media post on PostEverywhere. Provide a topic and optionally tone, platform, length, hashtag/emoji preferences. Captions respect per-platform character limits (X: 280, Bluesky: 300, LinkedIn: 3000, IG: 2200, FB: 5000, etc) and follow platform conventions. Costs 1 AI credit per caption returned. Companion to generate_image — together they let you compose a complete post in two calls.',
    {
      topic: z.string().max(1000).describe('What the post should be about'),
      platform: z.enum(['instagram','facebook','x','twitter','linkedin','youtube','tiktok','threads','pinterest','bluesky']).optional().describe('Target platform — sets character limit + style conventions'),
      tone: z.enum(['professional','casual','witty','enthusiastic','urgent','inspirational']).optional().default('professional').describe('Tone of voice for the caption'),
      length: z.enum(['short','medium','long']).optional().default('medium').describe('Approximate caption length'),
      include_hashtags: z.boolean().optional().default(true).describe('Whether to include hashtags (defaults to platform-appropriate)'),
      include_emojis: z.boolean().optional().default(true).describe('Whether to include emojis'),
      count: z.number().min(1).max(5).optional().default(1).describe('Number of caption variants to return (1-5)'),
    },
    async (args) => {
      const result = await client.generateCaption(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Introspection ────────────────────────────────────────

  server.tool(
    'get_me',
    "Get the current API key context on PostEverywhere — who you are, what scopes your key has, what plan the organization is on, and what's remaining on each quota (accounts/AI credits/storage). Use this as the FIRST CALL when initializing an MCP session to self-discover the organization_id, scopes, and quota state.",
    {},
    async () => {
      const result = await client.getMe();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Analytics ────────────────────────────────────────────

  server.tool(
    'get_analytics_summary',
    'Get aggregate posting metrics over a time window on PostEverywhere. Returns counts (scheduled/published/failed), per-platform breakdown, total views/likes/comments/shares/impressions/clicks across all published posts, and AI credit usage. One call answers "how many posts have I published this week?" without listing every post.',
    {
      period: z.enum(['today','week','month','all','custom']).optional().default('month').describe('Time window — defaults to last 30 days'),
      from: z.string().optional().describe('ISO timestamp lower bound (required if period=custom)'),
      to: z.string().optional().describe('ISO timestamp upper bound (required if period=custom)'),
    },
    async (args) => {
      const result = await client.getAnalyticsSummary(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Campaigns ────────────────────────────────────────────

  server.tool(
    'list_campaigns',
    'List campaigns in the current workspace on PostEverywhere. Campaigns group related posts (e.g., "Q3 Launch", "Holiday 2026") and can be referenced via campaign_id when creating or filtering posts. Returns id, name, color, status, post_count for each.',
    {
      status: z.enum(['active','archived']).optional().describe('Filter by campaign status'),
      limit: z.number().min(1).max(100).optional().default(50).describe('Page size'),
      offset: z.number().min(0).optional().default(0).describe('Pagination offset'),
    },
    async (args) => {
      const result = await client.listCampaigns(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'create_campaign',
    'Create a new campaign on PostEverywhere for grouping related posts. Returns the campaign id, which can then be passed as campaign_id when creating posts via create_post.',
    {
      name: z.string().min(1).max(100).describe('Campaign name'),
      description: z.string().max(500).optional().describe('Optional description'),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Hex color like #3b82f6'),
      status: z.enum(['active','archived']).optional().default('active'),
    },
    async (args) => {
      const result = await client.createCampaign(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'get_campaign',
    'Get details of a single campaign on PostEverywhere by its id, including post_count.',
    { id: z.number().describe('Campaign id') },
    async ({ id }) => {
      const result = await client.getCampaign(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'update_campaign',
    'Update a campaign on PostEverywhere (name, description, color, or active/archived status).',
    {
      id: z.number().describe('Campaign id'),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      status: z.enum(['active','archived']).optional(),
    },
    async ({ id, ...body }) => {
      const result = await client.updateCampaign(id, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'delete_campaign',
    'Delete a campaign on PostEverywhere. Posts in the campaign survive — their campaign_id is set to NULL.',
    { id: z.number().describe('Campaign id') },
    async ({ id }) => {
      const result = await client.deleteCampaign(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Bulk Posts ───────────────────────────────────────────

  server.tool(
    'bulk_create_posts',
    'Create up to 50 posts in one PostEverywhere API call (counts as ONE API-rate-limit hit instead of 50). Each post goes through the same validation as create_post. Returns per-item success/error so you can handle partial failures. Use this for bulk scheduling workflows.',
    {
      posts: z.array(z.any()).min(1).max(50).describe('Array of post objects (same shape as create_post body). Max 50.'),
    },
    async ({ posts }) => {
      const result = await client.bulkCreatePosts(posts);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'retry_failed_posts',
    'Retry all failed destinations on PostEverywhere that match a filter (account_id, platform, date range, or explicit post_ids). Saves you from making one retry call per failed post. Requires at least one filter — refuses to retry the entire failure history.',
    {
      post_ids: z.array(z.string().uuid()).max(200).optional().describe('Explicit list of post UUIDs to retry failed destinations on'),
      account_id: z.number().optional().describe('Retry only failures on this social account'),
      platform: z.enum(['instagram','facebook','x','twitter','linkedin','youtube','tiktok','threads','pinterest','bluesky','telegram','discord']).optional(),
      failed_after: z.string().optional().describe('ISO timestamp — only retry failures after this'),
      failed_before: z.string().optional().describe('ISO timestamp — only retry failures before this'),
      max_attempts: z.number().min(1).max(10).optional().describe('Skip destinations with attempt_count >= this'),
    },
    async (args) => {
      const result = await client.retryFailedPosts(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Account Health + Reconnect ───────────────────────────

  server.tool(
    'get_account_health',
    'Check the health of a connected social account on PostEverywhere. Returns status (healthy|warning|broken), can_post boolean, token expiry, needs_reconnection flag, recent failure count, last successful publish. Use this before publishing to detect a dead token BEFORE it causes a failed post.',
    { id: z.number().describe('Social account id') },
    async ({ id }) => {
      const result = await client.getAccountHealth(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Webhooks ─────────────────────────────────────────────

  server.tool(
    'list_webhooks',
    'List all webhook subscriptions on PostEverywhere for the current organization. Returns id, url, subscribed events, is_active, recent delivery stats. Note: the signing secret is NEVER included in list responses.',
    {},
    async () => {
      const result = await client.listWebhooks();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'create_webhook',
    "Create a webhook subscription on PostEverywhere. PostEverywhere will POST event payloads to the URL whenever a subscribed event occurs (post.published, post.failed, account.reconnect_needed, etc). Each request is signed with HMAC-SHA256 via the X-PostEverywhere-Signature header — verify it against the returned secret. The secret is shown ONLY ONCE in this response. Available events: post.scheduled, post.publishing, post.published, post.failed, post.partially_failed, post.updated, post.deleted, account.connected, account.disconnected, account.reconnect_needed, media.uploaded, media.deleted.",
    {
      url: z.string().url().describe('HTTPS URL where events will be POSTed (must be public)'),
      events: z.array(z.string()).min(1).describe('Array of event names to subscribe to'),
      name: z.string().max(100).optional().describe('Human-readable name for the subscription'),
      description: z.string().max(500).optional(),
    },
    async (args) => {
      const result = await client.createWebhook(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'get_webhook',
    'Get details of a single webhook subscription on PostEverywhere (does NOT include the signing secret).',
    { id: z.string().uuid().describe('Webhook id') },
    async ({ id }) => {
      const result = await client.getWebhook(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'update_webhook',
    'Update a webhook subscription on PostEverywhere — change url/events/name/description/is_active. Setting is_active=true on an auto-disabled webhook clears the consecutive_failures counter.',
    {
      id: z.string().uuid(),
      url: z.string().url().optional(),
      events: z.array(z.string()).min(1).optional(),
      name: z.string().max(100).optional(),
      description: z.string().max(500).optional(),
      is_active: z.boolean().optional(),
    },
    async ({ id, ...body }) => {
      const result = await client.updateWebhook(id, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'delete_webhook',
    'Delete a webhook subscription on PostEverywhere. Cascades to delete the delivery history.',
    { id: z.string().uuid() },
    async ({ id }) => {
      const result = await client.deleteWebhook(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'test_webhook',
    'Send a synthetic test ping to a webhook URL on PostEverywhere so you can verify your endpoint receives the request and validates the HMAC signature. Returns the receiver\'s HTTP status + duration.',
    { id: z.string().uuid() },
    async ({ id }) => {
      const result = await client.testWebhook(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Enhanced list_posts (advanced filters) ───────────────

  server.tool(
    'list_posts_advanced',
    'List posts on PostEverywhere with the FULL set of filters available on the API (since June 2026). Like list_posts but accepts comma-separated multi-status (e.g. "failed,partially_failed"), comma-separated platforms, date ranges (created/scheduled/published/updated), account_id and campaign_id filters, content search, and sort options. Use this for any non-trivial query — e.g. "all failed TikTok posts from last week" — that the basic list_posts can\'t express.',
    {
      status: z.string().optional().describe('Comma-separated statuses (scheduled,publishing,published,partially_failed,failed,draft)'),
      platform: z.string().optional().describe('Comma-separated platforms (e.g. "instagram,facebook")'),
      account_id: z.number().optional().describe('Filter to one social account'),
      campaign_id: z.number().optional().describe('Filter to a campaign'),
      created_after: z.string().optional().describe('ISO timestamp lower bound on posts.created_at'),
      created_before: z.string().optional(),
      scheduled_after: z.string().optional().describe('ISO timestamp lower bound on posts.scheduled_for'),
      scheduled_before: z.string().optional(),
      published_after: z.string().optional().describe('ISO timestamp lower bound on destination published_at'),
      published_before: z.string().optional(),
      updated_after: z.string().optional().describe('ISO timestamp lower bound — for incremental sync polling'),
      search: z.string().optional().describe('Full-text search on post content'),
      sort: z.enum(['created_at','scheduled_for','published_at','updated_at']).optional().default('created_at'),
      order: z.enum(['asc','desc']).optional().default('desc'),
      limit: z.number().min(1).max(100).optional().default(20),
      offset: z.number().min(0).optional().default(0),
    },
    async (args) => {
      const result = await client.listPostsAdvanced(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
