// Mock API service for blog admin
export interface Tag {
  id: string;
  name: string;
}

export interface ArticleListItem {
  id: string;
  title: string;
  description: string;
  slug: string;
  status: 'done' | 'processing' | 'error';
  is_published: boolean;
  tags: Tag[];
  created_at: string;
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
}

export interface CreateArticleRequest {
  topic: string;
  additional_context_url?: string;
  images?: Array<{ url: string }>;
}

export interface UpdateArticleRequest {
  title: string;
  description: string;
  content: string;
  tag_ids: string[];
}

export interface ImageUploadResponse {
  images: Array<{
    filename: string;
    original_name: string;
  }>;
  article_slug: string;
}

class BlogAPI {
  private baseURL = 'https://api.example.com';
  private username: string = '';
  private password: string = '';

  setCredentials(username: string, password: string) {
    this.username = username;
    this.password = password;
    // Save to localStorage for persistence
    localStorage.setItem('admin_username', username);
    localStorage.setItem('admin_password', password);
  }

  loadCredentials(): boolean {
    const username = localStorage.getItem('admin_username');
    const password = localStorage.getItem('admin_password');
    if (username && password) {
      this.username = username;
      this.password = password;
      return true;
    }
    return false;
  }

  clearCredentials() {
    this.username = '';
    this.password = '';
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_password');
  }

  async verifyAuth(): Promise<void> {
    // Mock auth verification - in real app would make API call
    if (this.username === 'admin' && this.password === 'password') {
      return Promise.resolve();
    }
    throw new Error('Authentication required');
  }

  // Mock data for development
  private mockArticles: ArticleListItem[] = [
    {
      id: '1',
      title: 'Как скачать проект из Поехали!',
      description: 'Подробный гайд по экспорту вашего проекта из конструктора сайтов',
      slug: 'how-to-download-project',
      status: 'done',
      is_published: true,
      tags: [{ id: '1', name: 'Руководство' }, { id: '2', name: 'Экспорт' }],
      created_at: '2024-12-01T10:00:00Z'
    },
    {
      id: '2', 
      title: 'Интеграция с GitHub',
      description: 'Настройка автоматической синхронизации с репозиторием GitHub',
      slug: 'github-integration',
      status: 'processing',
      is_published: false,
      tags: [{ id: '3', name: 'GitHub' }, { id: '1', name: 'Руководство' }],
      created_at: '2024-12-02T14:30:00Z'
    },
    {
      id: '3',
      title: 'Публикация сайта в интернет',
      description: 'Как опубликовать ваш сайт и настроить собственный домен',
      slug: 'publish-website',
      status: 'error',
      is_published: false,
      tags: [{ id: '4', name: 'Публикация' }, { id: '5', name: 'Домены' }],
      created_at: '2024-11-28T09:15:00Z'
    }
  ];

  async getArticles(options?: { limit?: number }): Promise<ArticleListItem[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!this.username || !this.password) {
      throw new Error('Authentication required');
    }

    return this.mockArticles.slice(0, options?.limit || 10);
  }

  async getArticle(id: string): Promise<ArticleDetail> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const article = this.mockArticles.find(a => a.id === id);
    if (!article) {
      throw new Error('Article not found');
    }

    return {
      ...article,
      content: `# ${article.title}

${article.description}

## Введение

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Основные шаги

1. Первый шаг
2. Второй шаг  
3. Третий шаг

## Заключение

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`
    };
  }

  async createArticle(data: CreateArticleRequest): Promise<ArticleListItem> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newArticle: ArticleListItem = {
      id: Date.now().toString(),
      title: data.topic,
      description: `Автоматически созданная статья по теме: ${data.topic}`,
      slug: data.topic.toLowerCase().replace(/[^а-я0-9a-z]+/gi, '-'),
      status: 'processing',
      is_published: false,
      tags: [{ id: '1', name: 'Руководство' }],
      created_at: new Date().toISOString()
    };

    this.mockArticles.unshift(newArticle);
    return newArticle;
  }

  async updateArticle(id: string, data: UpdateArticleRequest): Promise<ArticleListItem> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.mockArticles.findIndex(a => a.id === id);
    if (index === -1) {
      throw new Error('Article not found');
    }

    this.mockArticles[index] = {
      ...this.mockArticles[index],
      title: data.title,
      description: data.description
    };

    return this.mockArticles[index];
  }

  async publishArticle(id: string, isPublished: boolean): Promise<{ is_published: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const article = this.mockArticles.find(a => a.id === id);
    if (article) {
      article.is_published = isPublished;
    }

    return { is_published: isPublished };
  }

  async deleteArticle(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = this.mockArticles.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockArticles.splice(index, 1);
    }
  }

  async uploadImages(files: File[], articleSlug?: string): Promise<ImageUploadResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const uploadedImages = files.map(file => ({
      filename: `https://cdn.example.com/images/${Date.now()}-${file.name}`,
      original_name: file.name
    }));

    return {
      images: uploadedImages,
      article_slug: articleSlug || `article-${Date.now()}`
    };
  }
}

export const blogAPI = new BlogAPI();