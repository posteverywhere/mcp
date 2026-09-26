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

export interface RegisterToolsOptions {
  /**
   * Hide the generate_image tool. AI image generation is an unsupported use
   * case for the Anthropic Connectors Directory, so the hosted /claude
   * endpoint sets this; every other surface keeps the full toolset.
   * Defaults to the MCP_DISABLE_IMAGE_GENERATION env var.
   */
  disableImageGeneration?: boolean;
}

export function registerTools(server: McpServer, client: PostEverywhereClient, opts?: RegisterToolsOptions) {
  const hideImageGeneration = opts?.disableImageGeneration ?? (process.env.MCP_DISABLE_IMAGE_GENERATION === '1');

  // ─── Posting queue ─────────────────────────────────────────

  server.registerTool(
    'get_queue',
    {
      title: 'Get Posting Queue',
      description: 'Show the workspace posting queue: the recurring weekly slots it posts at, and the next openings coming up. Use this before create_post(use_queue: true) so you can tell the user exactly when their post will go out, and use it when they ask "when is my next slot" or "what does my schedule look like". The upcoming list is a FORECAST, not a reservation: a slot is only taken when a post is actually created with use_queue. If no queue is set up the queue field is null and the message explains where to create one.',
      inputSchema: {
        preview: z.number().optional().describe('How many upcoming openings to return (1-30, default 10).'),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ preview }) => {
      const result = await client.getQueue({ preview });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── Accounts ──────────────────────────────────────────────

  server.registerTool(
    'list_accounts',
    {
      title: 'List Accounts',
      description: 'List all connected social media accounts on PostEverywhere. Returns account IDs, platform names, usernames, and health status (whether each account can currently post). Use this to see which platforms are available before creating a post.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const result = await client.listAccounts();
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.accounts, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_account',
    {
      title: 'Get Account',
      description: 'Get detailed information about a specific connected social media account on PostEverywhere. Returns the account platform, username, health status, and whether it can currently post (Pinterest also lists its boards; WordPress names its site). Use this to check the status of a single account by its ID.',
      inputSchema: {
      account_id: z.number().describe('The numeric ID of the social account to retrieve'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ account_id }) => {
      const result = await client.getAccount(account_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── Posts ─────────────────────────────────────────────────

  server.registerTool(
    'list_posts',
    {
      title: 'List Posts',
      description: 'List scheduled, published, or draft posts on PostEverywhere. Supports filtering by status (scheduled, published, draft) and platform. Returns post content, scheduling info, and per-platform destination statuses. Use this to check what posts are queued or to review published content.',
      inputSchema: {
      status: z.enum(['scheduled', 'published', 'draft']).optional().describe('Filter by post status'),
      platform: z.string().optional().describe('Filter by platform (e.g., instagram, linkedin, x, wordpress)'),
      limit: z.number().min(1).max(100).optional().default(20).describe('Number of posts to return'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ status, platform, limit }) => {
      const result = await client.listPosts({ status, platform, limit });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.posts, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_post',
    {
      title: 'Get Post',
      description: 'Get detailed information about a specific post on PostEverywhere, including its content, media attachments, schedule, and the publishing status on each destination platform. Use this to check if a post was published successfully or to see error details for failed destinations.',
      inputSchema: {
      post_id: z.string().uuid().describe('The UUID of the post to retrieve'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ post_id }) => {
      const result = await client.getPost(post_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'create_post',
    {
      title: 'Create Post',
      description: 'Create a social media post on PostEverywhere. Three modes: (1) PUBLISH NOW — give content + account_ids, omit scheduled_for; (2) SCHEDULE — add scheduled_for; (3) DRAFT for human review — set draft: true, which saves the post WITHOUT publishing it (it appears in the user\'s PostEverywhere app and via list_posts(status:"draft"); you then publish it with schedule_post once approved). Use draft mode whenever a human wants to check posts before they go live. Supports per-platform overrides and media. Returns the post ID, its status, and the next step to take.',
      inputSchema: {
      content: z.string().describe('The text content of the post'),
      account_ids: z.array(z.number()).optional().describe('Social account IDs to post to (from list_accounts). REQUIRED to publish or schedule; OPTIONAL for a draft (accounts can be chosen later when you call schedule_post).'),
      scheduled_for: z.string().optional().describe('ISO 8601 datetime to schedule the post (e.g., 2026-03-15T14:00:00Z). Omit to publish immediately. When draft:true this is optional and just pre-fills the draft\'s suggested time.'),
      timezone: z.string().optional().default('UTC').describe('IANA timezone for scheduling (e.g., America/New_York)'),
      media_ids: z.array(z.string()).optional().describe('Array of media UUIDs to attach. Get these from upload_media_from_url (recommended) or generate_image. Existing library files can be looked up with list_media.'),
      draft: z.boolean().optional().describe('Set true to save as a DRAFT for human review instead of publishing or scheduling. The draft is NOT published until you call schedule_post on it. Review drafts with list_posts(status:"draft") or get_post.'),
      use_queue: z.boolean().optional().describe('Set true to let the workspace posting queue choose the time: the next free slot is allocated at create time. Use this instead of scheduled_for when the user says "add it to the queue", "post it at my usual times", or "whenever is next free". Mutually exclusive with scheduled_for - sending both is rejected. Call get_queue first if you want to tell the user WHICH slot they will get.'),
      platform_content: z.record(z.any()).optional().describe('Per-platform overrides keyed by platform name (e.g. {"instagram": {...}}). Each entry may set "content" (platform-specific caption) and "contentType" (the post format for that platform). contentType values: Instagram "Post" | "Reels" | "Story" | "Trial Reel"; Facebook "Post" | "Reels" | "Story"; YouTube "Video" | "Short". Omit contentType to use the platform default (video media defaults to Reels on Instagram). Each entry may also set "settings" with platform-specific options, e.g. Pinterest {"settings": {"boardId": "...", "link": "https://...", "title": "..."}} to pick the board and destination link, YouTube {"settings": {"title": "..."}}. X: {"x": {"settings": {"made_with_ai": true, "paid_partnership": true, "community_id": "<numeric X Community id>"}}} adds X\'s disclosure labels or posts into a Community the account belongs to. X ARTICLE (long-form, X Premium accounts only): {"x": {"content": "<body: # headings, - lists, > quotes, **bold**, *italic*, [links](https://...)>", "settings": {"post_type": "article", "title": "<max 100 chars>"}}} with ONLY X account ids, up to 5 images in media_ids (the first is the cover, 2000x800 looks best; place others inline with a line ![caption](image:2), or they go at the end), no video, body up to 25,000 characters. The body also supports --- dividers, ```code``` blocks, | tables |, a line that is just an X post link (embeds it) and ![caption](https://image-url). Limited to 2 published articles per X account per 24 hours. WORDPRESS BLOG POST: {"wordpress": {"content": "<body, same formatting as X Articles; raw HTML is kept as-is>", "settings": {"title": "<max 200 chars; default = a leading # Heading, else the first line>", "status": "publish|draft|pending|private", "excerpt": "<max 1000>", "tags": ["a"], "categories": ["News"], "slug": "...", "featuredImage": "first|none"}}} with WordPress account ids (other platforms in the same call use the top-level content), up to 20 images + 1 video in media_ids (the first image is the featured image; place others inline with ![caption](image:N), or they go at the end; the video goes at the top), body up to 200,000 characters. tags/categories take arrays or a comma string (categories also take numeric ids); missing tags are created. A blog post with no title is refused with a 400.'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ content, account_ids, scheduled_for, timezone, media_ids, draft, platform_content, use_queue }) => {
      const result = await client.createPost({
        content,
        account_ids,
        scheduled_for,
        timezone,
        media_ids,
        draft,
        platform_content,
        use_queue,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'schedule_post',
    {
      title: 'Schedule Post',
      description: 'Publish or schedule a DRAFT (created with create_post(draft: true)). Pass scheduled_for to schedule it for a future time, or publish_now: true to publish it right away. Optionally pass account_ids to set/override which accounts it posts to (defaults to the accounts saved on the draft). This is the final step of the review workflow: create_post(draft:true) → review with list_posts(status:"draft")/get_post → schedule_post. Only works on drafts — to re-time an already-scheduled post, use update_post. A draft that targets a WordPress account must have a blog title (platform_content.wordpress.settings.title or a leading "# Heading"), or this returns a 400.',
      inputSchema: {
      post_id: z.string().uuid().describe('The UUID of the draft to publish (from create_post or list_posts)'),
      scheduled_for: z.string().optional().describe('ISO 8601 datetime to schedule for (e.g., 2026-06-20T14:00:00Z). Provide this OR publish_now.'),
      publish_now: z.boolean().optional().describe('Set true to publish the draft immediately instead of scheduling it.'),
      account_ids: z.array(z.number()).optional().describe('Optional: accounts to publish to, overriding the draft\'s saved targets.'),
      timezone: z.string().optional().describe('IANA timezone for display (does not change when the post fires).'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ post_id, scheduled_for, publish_now, account_ids, timezone }) => {
      const result = await client.schedulePost(post_id, { scheduled_for, publish_now, account_ids, timezone });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'update_post',
    {
      title: 'Update Post',
      description: 'Update a scheduled or draft post on PostEverywhere. You can change the content, schedule time, timezone, target accounts, media attachments, or per-platform content (including a WordPress blog post\'s title, status, tags and categories). Only posts with status "scheduled" or "draft" can be edited — published posts cannot be modified. Returns the updated post with all its details.',
      inputSchema: {
      post_id: z.string().uuid().describe('The UUID of the post to update'),
      content: z.string().optional().describe('New text content for the post'),
      scheduled_for: z.string().optional().describe('New ISO 8601 datetime to schedule the post'),
      timezone: z.string().optional().describe('New IANA timezone for scheduling'),
      account_ids: z.array(z.number()).optional().describe('New array of social account IDs to post to'),
      media_ids: z.array(z.string()).optional().describe('New array of media UUIDs to attach. Get these from upload_media_from_url or generate_image.'),
      platform_content: z.record(z.any()).optional().describe('Per-platform overrides keyed by platform name, same shape as create_post. Use this to correct a queued post, e.g. set the Pinterest board and destination link: {"pinterest": {"settings": {"boardId": "...", "link": "https://..."}}}. Settings merge into the post before it publishes. For an X Article, set {"x": {"settings": {"post_type": "article", "title": "..."}}}. For a WordPress blog post, set {"wordpress": {"content": "...", "settings": {"title": "...", "status": "draft", "tags": ["a"]}}}.'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ post_id, content, scheduled_for, timezone, account_ids, media_ids, platform_content }) => {
      const result = await client.updatePost(post_id, {
        content,
        scheduled_for,
        timezone,
        account_ids,
        media_ids,
        platform_content,
      });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'delete_post',
    {
      title: 'Delete Post',
      description: 'Delete a post from PostEverywhere. This permanently removes the post and all its platform destinations from PostEverywhere. A post that has ALREADY PUBLISHED stays live on the social platforms by default; set delete_on_x: true to also delete its published X (Twitter) copy (other platforms are not deleted). Only set delete_on_x when the user explicitly asks to remove the post from X. Cannot be undone.',
      inputSchema: {
      post_id: z.string().uuid().describe('The UUID of the post to delete'),
      delete_on_x: z.boolean().optional().describe('Also delete the published X copy of this post. Default false. Only when the user explicitly asks.'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        // delete_on_x reaches X, an external system.
        openWorldHint: true,
      },
    },
    async ({ post_id, delete_on_x }) => {
      const result: any = await client.deletePost(post_id, { deleteOnX: delete_on_x === true });
      const xd: any[] = Array.isArray(result?.x_deletion) ? result.x_deletion : [];
      const xNote = delete_on_x
        ? (xd.length === 0 ? ' It had no published X copy.' : xd.every((r) => r.deleted) ? ' Its X copy was deleted too.' : ` X did not delete it: ${xd.find((r) => !r.deleted)?.error || 'unknown error'}.`)
        : '';
      return {
        content: [{ type: 'text' as const, text: `Post ${post_id} deleted successfully.${xNote}` }],
      };
    }
  );

  // ─── Post Results ──────────────────────────────────────────

  server.registerTool(
    'get_post_results',
    {
      title: 'Get Post Results',
      description: 'Get the per-platform publishing results for a specific post on PostEverywhere. Returns detailed status for each destination including published URLs, error messages, attempt counts, and retry schedules. Use this to check which platforms succeeded or failed after publishing.',
      inputSchema: {
      post_id: z.string().uuid().describe('The UUID of the post to get results for'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ post_id }) => {
      const result = await client.getPostResults(post_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── Retry ─────────────────────────────────────────────────

  server.registerTool(
    'retry_failed_post',
    {
      title: 'Retry Failed Post',
      description: 'Retry all failed platform destinations for a specific post on PostEverywhere. Resets failed destinations back to queued status so they will be re-attempted by the publishing system. Use this when a post failed due to temporary issues like rate limits or token expiry (after the token has been refreshed).',
      inputSchema: {
      post_id: z.string().uuid().describe('The UUID of the post with failed destinations'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ post_id }) => {
      const result = await client.retryPost(post_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── Media ─────────────────────────────────────────────────

  server.registerTool(
    'list_media',
    {
      title: 'List Media',
      description: 'List media files in the PostEverywhere media library. Supports filtering by type (image, video, document) and pagination. Returns file metadata including URLs, dimensions, and upload status. Use this to find existing media to attach to posts.',
      inputSchema: {
      type: z.enum(['image', 'video', 'document']).optional().describe('Filter by media type'),
      limit: z.number().min(1).max(100).optional().default(20).describe('Number of items to return'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ type, limit }) => {
      const result = await client.listMedia({ type, limit });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result.media, null, 2) }],
      };
    }
  );

  server.registerTool(
    'get_media',
    {
      title: 'Get Media',
      description: 'Get detailed information about a specific media file on PostEverywhere, including its type, dimensions, file size, upload status, and aspect ratio. Use this to check if an uploaded media file has finished processing before attaching it to a post.',
      inputSchema: {
      media_id: z.string().uuid().describe('The UUID of the media file to retrieve'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ media_id }) => {
      const result = await client.getMediaStatus(media_id);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.registerTool(
    'delete_media',
    {
      title: 'Delete Media',
      description: 'Delete a media file from the PostEverywhere media library. This permanently removes the file from storage and cannot be undone. Any posts that reference this media will no longer have the attachment. Use with caution.',
      inputSchema: {
      media_id: z.string().uuid().describe('The UUID of the media file to delete'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ media_id }) => {
      const result = await client.deleteMedia(media_id);
      return {
        content: [{ type: 'text' as const, text: `Media ${media_id} deleted successfully.` }],
      };
    }
  );

  server.registerTool(
    'upload_media_from_url',
    {
      title: 'Upload Media from URL',
      description: 'Import an image OR VIDEO from a public URL into the PostEverywhere media library, ready to attach to posts via media_ids. IMAGES (JPEG, PNG, GIF, WebP, HEIC, HEIF — up to 25 MB) import synchronously: the response media_id is ready immediately. VIDEOS (MP4 only — up to 4 GB) import ASYNCHRONOUSLY: the response returns media_id with media_status "uploading" right away while the file streams in server-side — poll get_media until media_status is "ready" (typically well under a minute), THEN attach it to a post. If media_status becomes "failed", get_media\'s error_message states exactly why (file too large, not actually an MP4, storage quota, unreachable URL). Never attach a media_id whose status you have not seen reach "ready".',
      inputSchema: {
      url: z.string().url().describe('Public HTTPS URL pointing to the image or MP4 video. Must be reachable from the public internet (no private/loopback addresses).'),
      filename: z.string().optional().describe('Optional filename to record in the library. If omitted, derived from the URL path.'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ url, filename }) => {
      const result = await client.uploadMediaFromUrl({ url, filename });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ─── AI ───────────────────────────────────────────────────

  // AI image generation is an unsupported use case for the Anthropic
  // Connectors Directory (rejection criterion). The hosted connector sets
  // MCP_DISABLE_IMAGE_GENERATION=1 to drop this tool from its listing;
  // stdio/npm installs and the v1 API keep it unless they opt out too.
  if (!hideImageGeneration) {
    server.registerTool(
      'generate_image',
      {
        title: 'Generate AI Image',
        description: 'Generate an AI image from a text prompt on PostEverywhere. The image is saved to your media library and can be attached to posts via media_ids. Choose from 4 models: gemini-3-pro (default, balanced quality, 5 credits), nano-banana-pro (photorealism, 15 credits), ideogram-v2 (best for text-in-image, 8 credits), flux-schnell (fastest, 1 credit). Requires the "ai" scope on your API key.',
        inputSchema: {
        prompt: z.string().max(2000).describe('Text description of the image to generate'),
        aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '4:5', '5:4']).optional().default('1:1').describe('Aspect ratio for the generated image'),
        model: z.enum(['nano-banana-pro', 'ideogram-v2', 'gemini-3-pro', 'flux-schnell']).optional().default('gemini-3-pro').describe('AI model to use for generation'),
      },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async ({ prompt, aspect_ratio, model }) => {
        const result = await client.generateImage({ prompt, aspect_ratio, model });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
        };
      }
    );
  }

  server.registerTool(
    'generate_caption',
    {
      title: 'Generate AI Caption',
      description: 'Generate 1-5 AI caption variants for a social media post on PostEverywhere. Provide a topic and optionally tone, platform, length, hashtag/emoji preferences. Captions respect per-platform character limits (X: 280, Bluesky: 300, LinkedIn: 3000, IG: 2200, FB: 5000, etc) and follow platform conventions. Costs 1 AI credit per caption returned. Companion to generate_image — together they let you compose a complete post in two calls.',
      inputSchema: {
      topic: z.string().max(1000).describe('What the post should be about'),
      platform: z.enum(['instagram','facebook','x','twitter','linkedin','youtube','tiktok','threads','pinterest','bluesky','wordpress']).optional().describe('Target platform — sets character limit + style conventions'),
      tone: z.enum(['professional','casual','witty','enthusiastic','urgent','inspirational']).optional().default('professional').describe('Tone of voice for the caption'),
      length: z.enum(['short','medium','long']).optional().default('medium').describe('Approximate caption length'),
      include_hashtags: z.boolean().optional().default(true).describe('Whether to include hashtags (defaults to platform-appropriate)'),
      include_emojis: z.boolean().optional().default(true).describe('Whether to include emojis'),
      count: z.number().min(1).max(5).optional().default(1).describe('Number of caption variants to return (1-5)'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = await client.generateCaption(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Introspection ────────────────────────────────────────

  server.registerTool(
    'get_me',
    {
      title: 'Get Workspace Info',
      description: "Get the current API key context on PostEverywhere — who you are, what scopes your key has, what plan the organization is on, and what's remaining on each quota (accounts/AI credits/storage). Use this as the FIRST CALL when initializing an MCP session to self-discover the organization_id, scopes, and quota state.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const result = await client.getMe();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Platform rules ───────────────────────────────────────

  server.registerTool(
    'get_platform_rules',
    {
      title: 'Get Platform Rules',
      description: "Get the per-platform publishing limits PostEverywhere enforces: character limit, image and video constraints (size, dimensions, duration, formats), and supported features (threads, carousels, reels, alt text, link cards, blog posts). WordPress also lists its blog post fields under platforms.wordpress.blog. Call this BEFORE composing a post for an unfamiliar platform, or when a post was rejected for length or media format — it is the difference between one correct call and a failed publish. Server-authoritative and cheap: the values are static per deploy and cached, so a platform added server-side appears here with no update on your side. Takes no arguments and returns every platform at once.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const result = await client.getPlatformRules();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Analytics ────────────────────────────────────────────

  server.registerTool(
    'get_analytics_summary',
    {
      title: 'Get Analytics Summary',
      description: 'Get aggregate posting metrics over a time window on PostEverywhere. Returns counts (scheduled/published/failed), per-platform breakdown, total views/likes/comments/shares/impressions/clicks across all published posts, AI credit usage, and AUDIENCE — the latest follower count per connected account plus its change over the period. One call answers "how many posts have I published this week and did my audience grow?" without listing every post. Follower snapshots begin 2026-08-31; an account with only one reading reports change_in_period as null, because a single point is not a trend.',
      inputSchema: {
      period: z.enum(['today','week','month','all','custom']).optional().default('month').describe('Time window — defaults to last 30 days'),
      from: z.string().optional().describe('ISO timestamp lower bound (required if period=custom)'),
      to: z.string().optional().describe('ISO timestamp upper bound (required if period=custom)'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = await client.getAnalyticsSummary(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Campaigns ────────────────────────────────────────────

  server.registerTool(
    'list_campaigns',
    {
      title: 'List Campaigns',
      description: 'List campaigns in the current workspace on PostEverywhere. Campaigns group related posts (e.g., "Q3 Launch", "Holiday 2026") and can be referenced via campaign_id when creating or filtering posts. Returns id, name, color, status, post_count for each.',
      inputSchema: {
      status: z.enum(['active','archived']).optional().describe('Filter by campaign status'),
      limit: z.number().min(1).max(100).optional().default(50).describe('Page size'),
      offset: z.number().min(0).optional().default(0).describe('Pagination offset'),
    },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = await client.listCampaigns(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create_campaign',
    {
      title: 'Create Campaign',
      description: 'Create a new campaign on PostEverywhere for grouping related posts. Returns the campaign id, which can then be passed as campaign_id when creating posts via create_post.',
      inputSchema: {
      name: z.string().min(1).max(100).describe('Campaign name'),
      description: z.string().max(500).optional().describe('Optional description'),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Hex color like #3b82f6'),
      status: z.enum(['active','archived']).optional().default('active'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = await client.createCampaign(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get_campaign',
    {
      title: 'Get Campaign',
      description: 'Get details of a single campaign on PostEverywhere by its id, including post_count.',
      inputSchema: { id: z.number().describe('Campaign id') },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const result = await client.getCampaign(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update_campaign',
    {
      title: 'Update Campaign',
      description: 'Update a campaign on PostEverywhere (name, description, color, or active/archived status).',
      inputSchema: {
      id: z.number().describe('Campaign id'),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      status: z.enum(['active','archived']).optional(),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, ...body }) => {
      const result = await client.updateCampaign(id, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete_campaign',
    {
      title: 'Delete Campaign',
      description: 'Delete a campaign on PostEverywhere. Posts in the campaign survive — their campaign_id is set to NULL.',
      inputSchema: { id: z.number().describe('Campaign id') },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const result = await client.deleteCampaign(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Bulk Posts ───────────────────────────────────────────

  server.registerTool(
    'bulk_create_posts',
    {
      title: 'Bulk Create Posts',
      description: 'Create up to 50 posts in one PostEverywhere API call (counts as ONE API-rate-limit hit instead of 50). Each post goes through the same validation as create_post, including X Articles and WordPress blog posts (platform_content.wordpress). Returns per-item success/error so you can handle partial failures. Use this for bulk scheduling workflows.',
      inputSchema: {
      posts: z.array(z.any()).min(1).max(50).describe('Array of post objects (same shape as create_post body). Max 50.'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ posts }) => {
      const result = await client.bulkCreatePosts(posts);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'retry_failed_posts',
    {
      title: 'Retry Failed Posts',
      description: 'Retry all failed destinations on PostEverywhere that match a filter (account_id, platform, date range, or explicit post_ids). Saves you from making one retry call per failed post. Requires at least one filter — refuses to retry the entire failure history.',
      inputSchema: {
      post_ids: z.array(z.string().uuid()).max(200).optional().describe('Explicit list of post UUIDs to retry failed destinations on'),
      account_id: z.number().optional().describe('Retry only failures on this social account'),
      platform: z.enum(['instagram','facebook','x','twitter','linkedin','youtube','tiktok','threads','pinterest','bluesky','telegram','discord','wordpress']).optional(),
      failed_after: z.string().optional().describe('ISO timestamp — only retry failures after this'),
      failed_before: z.string().optional().describe('ISO timestamp — only retry failures before this'),
      max_attempts: z.number().min(1).max(10).optional().describe('Skip destinations with attempt_count >= this'),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) => {
      const result = await client.retryFailedPosts(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Account Health + Reconnect ───────────────────────────

  server.registerTool(
    'get_account_health',
    {
      title: 'Get Account Health',
      description: 'Check the health of a connected social account on PostEverywhere. Returns status (healthy|warning|broken), can_post boolean, token expiry, needs_reconnection flag, recent failure count, last successful publish. Use this before publishing to detect a dead token BEFORE it causes a failed post.',
      inputSchema: { id: z.number().describe('Social account id') },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const result = await client.getAccountHealth(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Account Connect (agent-driven) ───────────────────────

  server.registerTool(
    'create_connect_link',
    {
      title: 'Create Account Connect Link',
      description: 'Generate a short-lived authorization URL (10 min) to connect a NEW social account via OAuth: x, instagram, facebook, youtube, pinterest, threads, linkedin, or tiktok. Give the URL to the account owner to open in any browser and approve; the connected account then appears in list_accounts (poll it to confirm). For telegram, discord, bluesky or wordpress use connect_credential_account instead (no browser needed).',
      inputSchema: {
        platform: z.enum(['x', 'instagram', 'facebook', 'youtube', 'pinterest', 'threads', 'linkedin', 'tiktok']).describe('OAuth platform to connect'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ platform }) => {
      const result = await client.createConnectLink(platform);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create_reconnect_link',
    {
      title: 'Create Account Reconnect Link',
      description: 'Generate a short-lived authorization URL (10 min) to FIX an existing OAuth account whose token died (needs_reconnection from get_account_health). The owner opens it, approves while logged in as that same profile, and the existing account is repaired in place. Verify afterwards with get_account_health.',
      inputSchema: { account_id: z.number().describe('Social account id to reconnect') },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ account_id }) => {
      const result = await client.createReconnectLink(account_id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'connect_credential_account',
    {
      title: 'Connect Credential Account',
      description: 'Connect telegram, discord, bluesky or wordpress entirely in this conversation, no browser needed. telegram: bot_token (from @BotFather, bot must be channel admin) + channel (@username or chat id). discord: webhook_url. bluesky: handle + app_password (Settings > App Passwords, never the main password). wordpress (self-hosted, WordPress 5.6+): site_url + username + app_password (WordPress: Users > Profile > Application Passwords, never the login password). Credentials are validated live before saving; re-submitting for an existing account updates it in place.',
      inputSchema: {
        platform: z.enum(['telegram', 'discord', 'bluesky', 'wordpress']).describe('Credential-based platform'),
        bot_token: z.string().optional().describe('telegram only: bot token from @BotFather'),
        channel: z.string().optional().describe('telegram only: @channelusername or numeric chat id'),
        webhook_url: z.string().optional().describe('discord only: incoming webhook URL'),
        handle: z.string().optional().describe('bluesky only: account handle, e.g. me.bsky.social'),
        app_password: z.string().optional().describe('bluesky or wordpress: app password / Application Password, not the main password'),
        site_url: z.string().optional().describe('wordpress only: site address, e.g. https://example.com'),
        username: z.string().optional().describe('wordpress only: the WordPress login name'),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (args) => {
      const result = await client.connectCredentialAccount(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Webhooks ─────────────────────────────────────────────

  server.registerTool(
    'list_webhooks',
    {
      title: 'List Webhooks',
      description: 'List all webhook subscriptions on PostEverywhere for the current organization. Returns id, url, subscribed events, is_active, recent delivery stats. Note: the signing secret is NEVER included in list responses.',
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const result = await client.listWebhooks();
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'create_webhook',
    {
      title: 'Create Webhook',
      description: "Create a webhook subscription on PostEverywhere. PostEverywhere will POST event payloads to the URL whenever a subscribed event occurs (post.published, post.failed, account.reconnect_needed, etc). Each request is signed with HMAC-SHA256 via the X-PostEverywhere-Signature header — verify it against the returned secret. The secret is shown ONLY ONCE in this response. Available events: post.scheduled, post.publishing, post.published, post.failed, post.partially_failed, post.updated, post.deleted, account.connected, account.disconnected, account.reconnect_needed, media.uploaded, media.deleted.",
      inputSchema: {
      url: z.string().url().describe('HTTPS URL where events will be POSTed (must be public)'),
      events: z.array(z.string()).min(1).describe('Array of event names to subscribe to'),
      name: z.string().max(100).optional().describe('Human-readable name for the subscription'),
      description: z.string().max(500).optional(),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = await client.createWebhook(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'get_webhook',
    {
      title: 'Get Webhook',
      description: 'Get details of a single webhook subscription on PostEverywhere (does NOT include the signing secret).',
      inputSchema: { id: z.string().uuid().describe('Webhook id') },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const result = await client.getWebhook(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'update_webhook',
    {
      title: 'Update Webhook',
      description: 'Update a webhook subscription on PostEverywhere — change url/events/name/description/is_active. Setting is_active=true on an auto-disabled webhook clears the consecutive_failures counter.',
      inputSchema: {
      id: z.string().uuid(),
      url: z.string().url().optional(),
      events: z.array(z.string()).min(1).optional(),
      name: z.string().max(100).optional(),
      description: z.string().max(500).optional(),
      is_active: z.boolean().optional(),
    },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, ...body }) => {
      const result = await client.updateWebhook(id, body);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'delete_webhook',
    {
      title: 'Delete Webhook',
      description: 'Delete a webhook subscription on PostEverywhere. Cascades to delete the delivery history.',
      inputSchema: { id: z.string().uuid() },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const result = await client.deleteWebhook(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.registerTool(
    'test_webhook',
    {
      title: 'Test Webhook',
      description: 'Send a synthetic test ping to a webhook URL on PostEverywhere so you can verify your endpoint receives the request and validates the HMAC signature. Returns the receiver\'s HTTP status + duration.',
      inputSchema: { id: z.string().uuid() },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ id }) => {
      const result = await client.testWebhook(id);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ─── Enhanced list_posts (advanced filters) ───────────────

  server.registerTool(
    'list_posts_advanced',
    {
      title: 'Advanced Post Search',
      description: 'List posts on PostEverywhere with the FULL set of filters available on the API (since June 2026). Like list_posts but accepts comma-separated multi-status (e.g. "failed,partially_failed"), comma-separated platforms, date ranges (created/scheduled/published/updated), account_id and campaign_id filters, content search, and sort options. Use this for any non-trivial query — e.g. "all failed TikTok posts from last week" — that the basic list_posts can\'t express.',
      inputSchema: {
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
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (args) => {
      const result = await client.listPostsAdvanced(args);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
}
