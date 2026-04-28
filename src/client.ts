/**
 * PostEverywhere API v1 Client
 *
 * Typed HTTP client wrapping the public REST API.
 * Used by the MCP server to call PostEverywhere endpoints.
 */

export interface ApiResponse<T = unknown> {
  data: T;
  error: { message: string; details?: unknown } | null;
  meta: { request_id: string; timestamp: string };
}

export interface Account {
  id: number;
  platform: string;
  account_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  health: { status: string; can_post: boolean };
}

export interface PostDestination {
  id: string;
  platform: string;
  status: string;
  account_name: string | null;
  account_id: number | null;
  published_at: string | null;
  platform_post_id: string | null;
  error: unknown | null;
  attempts: number;
}

export interface Post {
  id: string;
  content: string;
  media: unknown[];
  scheduled_for: string;
  timezone: string;
  status: string;
  destinations: PostDestination[];
  created_at: string;
  updated_at: string;
}

export interface PostResult {
  id: string;
  platform: string;
  status: string;
  account_name: string | null;
  account_id: number | null;
  published_at: string | null;
  platform_post_id: string | null;
  platform_post_url: string | null;
  error: unknown | null;
  attempts: number;
  next_retry_at: string | null;
}

export interface MediaItem {
  id: string;
  type: string;
  mime_type: string;
  file_size: number;
  status: string;
  original_name: string | null;
  url: string | null;
  thumbnail_url: string | null;
  dimensions: { width: number; height: number } | null;
  aspect_ratio: number | null;
  orientation: string | null;
  created_at: string;
}

export class PostEverywhereClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(opts: { baseUrl?: string; apiKey: string }) {
    this.baseUrl = (opts.baseUrl ?? 'https://app.posteverywhere.ai').replace(/\/$/, '');
    this.apiKey = opts.apiKey;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const resp = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await resp.json() as ApiResponse<T>;

    if (json.error) {
      throw new Error(json.error.message);
    }

    return json.data;
  }

  // ─── Accounts ──────────────────────────────────────────────

  async listAccounts(): Promise<{ accounts: Account[] }> {
    return this.request('GET', '/accounts');
  }

  async getAccount(id: number): Promise<Account> {
    return this.request('GET', `/accounts/${id}`);
  }

  // ─── Posts ─────────────────────────────────────────────────

  async listPosts(params?: { status?: string; platform?: string; limit?: number; offset?: number }): Promise<{ posts: Post[]; pagination: { limit: number; offset: number } }> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.platform) qs.set('platform', params.platform);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return this.request('GET', `/posts${query ? '?' + query : ''}`);
  }

  async getPost(id: string): Promise<Post> {
    return this.request('GET', `/posts/${id}`);
  }

  async createPost(body: {
    content: string;
    account_ids: number[];
    scheduled_for?: string;
    timezone?: string;
    media_ids?: string[];
    platform_content?: Record<string, unknown>;
  }): Promise<{ post_id: string; status: string; scheduled_for: string | null; accounts_count: number; message: string }> {
    return this.request('POST', '/posts', body);
  }

  async updatePost(id: string, body: {
    content?: string;
    scheduled_for?: string;
    timezone?: string;
    account_ids?: number[];
    media_ids?: string[];
  }): Promise<Post> {
    return this.request('PATCH', `/posts/${id}`, body);
  }

  async deletePost(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request('DELETE', `/posts/${id}`);
  }

  // ─── Post Results ──────────────────────────────────────────

  async getPostResults(id: string): Promise<{ post_id: string; post_status: string; results: PostResult[] }> {
    return this.request('GET', `/posts/${id}/results`);
  }

  // ─── Retry ─────────────────────────────────────────────────

  async retryPost(id: string): Promise<{ retried_count: number; destinations: Array<{ id: string; platform: string; new_status: string }> }> {
    return this.request('POST', `/posts/${id}/retry`);
  }

  // ─── Media ─────────────────────────────────────────────────

  async listMedia(params?: { type?: string; limit?: number; offset?: number }): Promise<{ media: MediaItem[]; pagination: { limit: number; offset: number } }> {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return this.request('GET', `/media${query ? '?' + query : ''}`);
  }

  async uploadMedia(body: {
    filename: string;
    content_type: string;
    size: number;
    platforms?: string[];
    width?: number;
    height?: number;
    duration?: number;
  }): Promise<{ media_id: string; upload_url: string; provider: string; protocol: string; expires_in: number; max_size: number }> {
    return this.request('POST', '/media/upload', body);
  }

  async getMediaStatus(id: string): Promise<{
    id: string;
    type: string;
    mime_type: string;
    file_size: number;
    status: string;
    dimensions: { width: number; height: number } | null;
    aspect_ratio: number | null;
    orientation: string | null;
    created_at: string;
  }> {
    return this.request('GET', `/media/${id}`);
  }

  async deleteMedia(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request('DELETE', `/media/${id}`);
  }

  // ─── AI ───────────────────────────────────────────────────

  async generateImage(body: {
    prompt: string;
    aspect_ratio?: string;
    model?: string;
  }): Promise<{ media_id: string; model: string; aspect_ratio: string; credits_used: number; credits_remaining: number; message: string }> {
    return this.request('POST', '/ai/generate-image', body);
  }
}
