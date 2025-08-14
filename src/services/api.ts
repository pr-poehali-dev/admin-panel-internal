const API_BASE_URL = 'https://api.poehali.dev/api';

export interface ArticleTag {
  id: string;
  name: string;
  slug: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: ArticleTag[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  is_published: boolean;
  status: 'processing' | 'done' | 'error';
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
}

export interface ArticlesListResponse {
  items: ArticleListItem[];
  total: number;
}

export interface ArticleUpdateRequest {
  title?: string;
  description?: string;
  content?: string;
  tag_ids?: string[];
}

export interface PublishRequest {
  is_published: boolean;
}

export interface ImageUploadResponse {
  filename: string; // Full URL of uploaded image
  original_name: string;
}

export interface ImagesUploadResponse {
  images: ImageUploadResponse[];
  article_slug: string;
}

export interface ArticleCreateRequest {
  topic: string;
  additional_context_url?: string;
  images?: Array<{ url: string }>;
}

class BlogAPI {
  private credentials: { username: string; password: string } | null = null;

  setCredentials(username: string, password: string) {
    this.credentials = { username, password };
    // Save to localStorage for persistence
    localStorage.setItem('adminCredentials', btoa(JSON.stringify(this.credentials)));
  }

  clearCredentials() {
    this.credentials = null;
    localStorage.removeItem('adminCredentials');
  }

  loadCredentials(): boolean {
    const stored = localStorage.getItem('adminCredentials');
    if (stored) {
      try {
        this.credentials = JSON.parse(atob(stored));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  hasCredentials(): boolean {
    return this.credentials !== null;
  }
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    // Add auth for admin endpoints
    if (endpoint.includes('/admin/')) {
      if (!this.credentials) {
        throw new Error('Authentication required');
      }
      const auth = btoa(`${this.credentials.username}:${this.credentials.password}`);
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      mode: 'cors',
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearCredentials();
        throw new Error('Authentication failed: 401');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getArticles(params?: {
    tag_id?: string;
    is_published?: boolean | null;
    limit?: number;
    offset?: number;
  }): Promise<ArticleListItem[]> {
    const queryParams = new URLSearchParams();
    if (params?.tag_id) queryParams.append('tag_id', params.tag_id);
    // Если is_published не указан или null - не добавляем параметр вообще
    if (params?.is_published !== undefined && params.is_published !== null) {
      queryParams.append('is_published', params.is_published.toString());
    }
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    const url = `/blog/list${query ? `?${query}` : ''}`;

    return this.request<ArticleListItem[]>(url);
  }

  async getTags(): Promise<ArticleTag[]> {
    return this.request<ArticleTag[]>('/blog/tags');
  }

  async getArticle(id: string): Promise<ArticleDetail> {
    return this.request<ArticleDetail>(`/blog/get?id=${id}`);
  }

  async updateArticle(id: string, data: ArticleUpdateRequest): Promise<ArticleDetail> {
    return this.request<ArticleDetail>(`/blog/admin/update?article_id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async publishArticle(id: string, isPublished: boolean): Promise<ArticleDetail> {
    return this.request<ArticleDetail>(`/blog/admin/publish?article_id=${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_published: isPublished }),
    });
  }

  async createArticle(data: ArticleCreateRequest): Promise<ArticleDetail> {
    return this.request<ArticleDetail>('/blog/admin/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadImages(files: File[], topic: string): Promise<ImagesUploadResponse> {
    // Check file sizes before upload
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      const sizes = oversizedFiles.map(f => `${f.name}: ${(f.size / 1024 / 1024).toFixed(2)}MB`).join(', ');
      throw new Error(`Файлы слишком большие (максимум 10MB): ${sizes}`);
    }

    // Try uploading files one by one if multiple files fail
    if (files.length > 1) {
      try {
        // First try all at once
        return await this.uploadImagesInternal(files, topic);
      } catch (error) {
        console.log('Batch upload failed, trying one by one...');
        
        // Upload one by one
        const allImages: any[] = [];
        let resultSlug = '';
        
        for (const file of files) {
          try {
            const result = await this.uploadImagesInternal([file], topic);
            allImages.push(...result.images);
            resultSlug = result.article_slug;
          } catch (err) {
            console.error(`Failed to upload ${file.name}:`, err);
            throw err;
          }
        }
        
        return {
          images: allImages,
          article_slug: resultSlug || ''
        };
      }
    }
    
    return this.uploadImagesInternal(files, topic);
  }

  private async uploadImagesInternal(files: File[], topic: string): Promise<ImagesUploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const url = `/blog/admin/images/upload?topic=${encodeURIComponent(topic)}`;

    const headers: Record<string, string> = {};
    // Add auth for admin endpoints
    if (!this.credentials) {
      throw new Error('Authentication required');
    }
    const auth = btoa(`${this.credentials.username}:${this.credentials.password}`);
    headers['Authorization'] = `Basic ${auth}`;
    // Don't set Content-Type for FormData - browser will set it with boundary

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers,
        body: formData,
        mode: 'cors',
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearCredentials();
          throw new Error('Authentication failed: 401');
        }
        if (response.status === 413) {
          throw new Error('Файл слишком большой. Максимальный размер: 10MB');
        }
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Upload error details:', error);
      throw error;
    }
  }

  async deleteArticle(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/blog/admin/delete?article_id=${id}`, {
      method: 'DELETE',
    });
  }

  async verifyAuth(): Promise<{ authenticated: boolean }> {
    // Use the dedicated verify endpoint
    return this.request<{ authenticated: boolean }>('/blog/admin/verify');
  }
}

export const blogAPI = new BlogAPI();