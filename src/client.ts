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

  async uploadMediaFromUrl(body: {
    url: string;
    filename?: string;
  }): Promise<{
    media_id: string;
    media_ids: string[];
    media_status: 'ready';
    type: 'image';
    url: string;
    filename: string;
    size: number;
    content_type: string;
    source_url: string;
    next_step: string;
  }> {
    return this.request('POST', '/media/upload-from-url', body);
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

  async generateCaption(body: {
    topic: string;
    platform?: string;
    tone?: string;
    length?: string;
    include_hashtags?: boolean;
    include_emojis?: boolean;
    count?: number;
  }): Promise<{ captions: string[]; platform: string | null; tone: string; length: string; count_requested: number; count_returned: number; credits_used: number; credits_remaining: number }> {
    return this.request('POST', '/ai/generate-caption', body);
  }

  // ─── Introspection ─────────────────────────────────────────

  async getMe(): Promise<{
    api_key: { id: string; key_prefix: string; name: string; scopes: string[]; last_used_at: string; created_at: string; expires_at: string | null } | null;
    scopes: string[];
    user: { id: number; email: string; name: string };
    organization: { id: string; name: string; subscription_plan: string; subscription_status: string; entitled: boolean };
    workspace: { id: string; name: string };
    quota: {
      accounts: { used: number; limit: number };
      ai_credits: { used: number; limit: number; bonus: number };
      storage_bytes: { used: number; limit: number };
      team_seats: { limit: number };
    };
    stats: { posts_last_30d: number; total_posts: number };
  }> {
    return this.request('GET', '/me');
  }

  // ─── Analytics ─────────────────────────────────────────────

  async getAnalyticsSummary(params?: { period?: 'today' | 'week' | 'month' | 'all' | 'custom'; from?: string; to?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.period) q.set('period', params.period);
    if (params?.from)   q.set('from', params.from);
    if (params?.to)     q.set('to', params.to);
    const qs = q.toString();
    return this.request('GET', `/analytics/summary${qs ? `?${qs}` : ''}`);
  }

  // ─── Campaigns ─────────────────────────────────────────────

  async listCampaigns(params?: { status?: 'active' | 'archived'; limit?: number; offset?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.limit !== undefined)  q.set('limit', String(params.limit));
    if (params?.offset !== undefined) q.set('offset', String(params.offset));
    const qs = q.toString();
    return this.request('GET', `/campaigns${qs ? `?${qs}` : ''}`);
  }
  async createCampaign(body: { name: string; description?: string; color?: string; status?: 'active' | 'archived' }): Promise<any> {
    return this.request('POST', '/campaigns', body);
  }
  async getCampaign(id: number): Promise<any> {
    return this.request('GET', `/campaigns/${id}`);
  }
  async updateCampaign(id: number, body: { name?: string; description?: string; color?: string; status?: 'active' | 'archived' }): Promise<any> {
    return this.request('PATCH', `/campaigns/${id}`, body);
  }
  async deleteCampaign(id: number): Promise<any> {
    return this.request('DELETE', `/campaigns/${id}`);
  }

  // ─── Bulk Posts ────────────────────────────────────────────

  async bulkCreatePosts(posts: any[]): Promise<{ summary: { total: number; succeeded: number; failed: number }; results: any[] }> {
    return this.request('POST', '/posts/bulk', { posts });
  }
  async retryFailedPosts(filter: {
    post_ids?: string[];
    account_id?: number;
    platform?: string;
    failed_after?: string;
    failed_before?: string;
    max_attempts?: number;
  }): Promise<{ retried_count: number; destinations: any[]; message: string }> {
    return this.request('POST', '/posts/retry-failed', filter);
  }

  // ─── Account Health ────────────────────────────────────────

  async getAccountHealth(id: number): Promise<any> {
    return this.request('GET', `/accounts/${id}/health`);
  }

  // ─── Webhooks ──────────────────────────────────────────────

  async listWebhooks(): Promise<{ webhooks: any[] }> {
    return this.request('GET', '/webhooks');
  }
  async createWebhook(body: { url: string; events: string[]; name?: string; description?: string }): Promise<{ id: string; url: string; events: string[]; secret: string; secret_warning: string }> {
    return this.request('POST', '/webhooks', body);
  }
  async getWebhook(id: string): Promise<any> {
    return this.request('GET', `/webhooks/${id}`);
  }
  async updateWebhook(id: string, body: { url?: string; events?: string[]; name?: string; description?: string; is_active?: boolean }): Promise<any> {
    return this.request('PATCH', `/webhooks/${id}`, body);
  }
  async deleteWebhook(id: string): Promise<{ id: string; deleted: boolean }> {
    return this.request('DELETE', `/webhooks/${id}`);
  }
  async testWebhook(id: string): Promise<{ ok: boolean; status: number; duration_ms: number; error: string | null; message: string }> {
    return this.request('POST', `/webhooks/${id}/test`);
  }

  // ─── Enhanced listPosts (overload with new filters) ────────

  async listPostsAdvanced(params?: {
    status?: string;            // comma-separated
    platform?: string;          // comma-separated
    account_id?: number;
    campaign_id?: number;
    created_after?: string;
    created_before?: string;
    scheduled_after?: string;
    scheduled_before?: string;
    published_after?: string;
    published_before?: string;
    updated_after?: string;
    search?: string;
    sort?: 'created_at' | 'scheduled_for' | 'published_at' | 'updated_at';
    order?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{ posts: Post[]; pagination: { limit: number; offset: number; total: number; has_more: boolean } }> {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v !== undefined && v !== null) q.set(k, String(v));
    }
    const qs = q.toString();
    return this.request('GET', `/posts${qs ? `?${qs}` : ''}`);
  }
}
