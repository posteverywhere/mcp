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
    'Create and schedule a social media post on PostEverywhere. Specify the content text, which social accounts to post to (by account ID), and optionally when to schedule it. If no scheduled_for is provided, the post is published immediately. Supports platform-specific content overrides and media attachments. Returns the post ID and scheduling confirmation.',
    {
      content: z.string().describe('The text content of the post'),
      account_ids: z.array(z.number()).min(1).describe('Array of social account IDs to post to (get these from list_accounts)'),
      scheduled_for: z.string().optional().describe('ISO 8601 datetime to schedule the post (e.g., 2026-03-15T14:00:00Z). Omit to publish immediately.'),
      timezone: z.string().optional().default('UTC').describe('IANA timezone for scheduling (e.g., America/New_York)'),
      media_ids: z.array(z.string()).optional().describe('Array of media UUIDs (from upload_media) to attach'),
    },
    async ({ content, account_ids, scheduled_for, timezone, media_ids }) => {
      const result = await client.createPost({
        content,
        account_ids,
        scheduled_for,
        timezone,
        media_ids,
      });
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
      media_ids: z.array(z.string()).optional().describe('New array of media UUIDs to attach'),
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

  // ─── AI ───────────────────────────────────────────────────

  server.tool(
    'generate_image',
    'Generate an AI image from a text prompt on PostEverywhere. The image is saved to your media library and can be attached to posts via media_ids. Choose from 4 models: nano-banana-pro (best quality, 15 credits), ideogram-v2 (best for text-in-image, 8 credits), gemini-3-pro (balanced, 5 credits), flux-schnell (fastest, 1 credit). Requires the "ai" scope on your API key.',
    {
      prompt: z.string().max(2000).describe('Text description of the image to generate'),
      aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '4:5', '5:4']).optional().default('1:1').describe('Aspect ratio for the generated image'),
      model: z.enum(['nano-banana-pro', 'ideogram-v2', 'gemini-3-pro', 'flux-schnell']).optional().default('nano-banana-pro').describe('AI model to use for generation'),
    },
    async ({ prompt, aspect_ratio, model }) => {
      const result = await client.generateImage({ prompt, aspect_ratio, model });
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
