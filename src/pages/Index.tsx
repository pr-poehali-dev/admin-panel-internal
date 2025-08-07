import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { blogAPI, ArticleListItem, ArticleDetail } from '@/services/api';
import ArticleCard from '@/components/ArticleCard';
import CreateArticleForm from '@/components/CreateArticleForm';
import EditArticleDialog from '@/components/EditArticleDialog';
import DeleteArticleDialog from '@/components/DeleteArticleDialog';

interface IndexProps {
  onLogout: () => void;
}

export default function Index({ onLogout }: IndexProps) {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await blogAPI.getArticles({ limit: 100 });
      setArticles(data);
    } catch (err) {
      setError('Не удалось загрузить статьи. Проверьте подключение к серверу.');
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const pollArticleStatus = async (articleId: string) => {
    let pollCount = 0;
    const maxPolls = 100;
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const article = await blogAPI.getArticle(articleId);
        
        setArticles(prev => prev.map(a => 
          a.id === articleId ? article : a
        ));
        
        if (article.status === 'done' || article.status === 'error') {
          clearInterval(pollInterval);
        }
        
        if (pollCount >= maxPolls) {
          console.log('Polling timeout reached for article', articleId);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll article status:', error);
        clearInterval(pollInterval);
      }
    }, 3000);
  };

  const handleArticleCreated = (createdArticle: ArticleListItem) => {
    setArticles([createdArticle, ...articles]);
    pollArticleStatus(createdArticle.id);
  };

  const handleEditArticle = async (articleId: string) => {
    setLoadingArticle(true);
    try {
      const fullArticle = await blogAPI.getArticle(articleId);
      setEditingArticle(fullArticle);
    } catch (error) {
      console.error('Failed to load article:', error);
      const article = articles.find(a => a.id === articleId);
      if (article) {
        setEditingArticle({
          ...article,
          content: ''
        } as ArticleDetail);
      }
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleUpdateArticle = async (updatedArticle: ArticleDetail) => {
    try {
      const updated = await blogAPI.updateArticle(updatedArticle.id, {
        title: updatedArticle.title,
        description: updatedArticle.description,
        content: updatedArticle.content,
        tag_ids: updatedArticle.tags.map(tag => tag.id)
      });
      
      setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
      
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update article:', error);
      alert('Ошибка при обновлении статьи');
    }
  };

  const togglePublish = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    
    try {
      const updated = await blogAPI.publishArticle(id, !article.is_published);
      
      setArticles(prev => prev.map(a => 
        a.id === id ? { ...a, is_published: updated.is_published } : a
      ));
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      alert('Ошибка при изменении статуса публикации');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    try {
      await blogAPI.deleteArticle(articleId);
      setArticles(prev => prev.filter(a => a.id !== articleId));
      setShowDeleteDialog(false);
      setDeletingArticleId(null);
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Ошибка при удалении статьи');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#000000]">
                <Icon name="Rocket" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Админка</h1>
                <p className="text-sm text-gray-600">Управление статьями блога</p>
              </div>
            </div>
            <Button
              variant="outline" 
              onClick={onLogout}
              className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
            >
              <Icon name="LogOut" size={16} />
              Выйти
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="articles" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100 p-1">
            <TabsTrigger 
              value="articles" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Icon name="FileText" size={16} />
              Статьи
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Icon name="Plus" size={16} />
              Создать
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <Icon name="AlertCircle" size={16} className="text-red-500" />
                <AlertDescription className="text-red-700 ml-2">{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Skeleton className="h-6 w-3/4 mb-3" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-9" />
                          <Skeleton className="h-9 w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : articles.length === 0 ? (
                <Card className="border-gray-200">
                  <CardContent className="p-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Icon name="FileText" size={32} className="text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Статей пока нет</h3>
                        <p className="text-gray-500">Создайте первую статью во вкладке "Создать"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onEdit={handleEditArticle}
                  onDelete={(id) => {
                    setDeletingArticleId(id);
                    setShowDeleteDialog(true);
                  }}
                  onTogglePublish={togglePublish}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <CreateArticleForm onArticleCreated={handleArticleCreated} />
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingArticle} onOpenChange={(open) => !open && setEditingArticle(null)}>
          <EditArticleDialog
            article={editingArticle}
            loading={loadingArticle}
            onUpdate={handleUpdateArticle}
            updateSuccess={updateSuccess}
          />
        </Dialog>

        <DeleteArticleDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={() => {
            if (deletingArticleId) {
              handleDeleteArticle(deletingArticleId);
            }
          }}
          onCancel={() => {
            setShowDeleteDialog(false);
            setDeletingArticleId(null);
          }}
        />
      </div>
    </div>
  );
}