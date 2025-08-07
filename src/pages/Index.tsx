import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { blogAPI, ArticleListItem, ArticleDetail, ArticleTag } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUpload {
  filename: string; // URL from S3
  original_name: string;
  file?: File; // Keep file for upload
}

interface IndexProps {
  onLogout: () => void;
}

export default function Index({ onLogout }: IndexProps) {
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [newArticle, setNewArticle] = useState({
    topic: '',
    additional_context_url: '',
    images: [] as ImageUpload[],
    articleSlug: '' // Temporary slug for organizing images
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [createStatus, setCreateStatus] = useState<'success' | 'error' | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'processing': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return 'CheckCircle';
      case 'processing': return 'Clock';
      case 'error': return 'XCircle';
      default: return 'Circle';
    }
  };

  const handleCreateArticle = async () => {
    try {
      const createdArticle = await blogAPI.createArticle({
        topic: newArticle.topic,
        additional_context_url: newArticle.additional_context_url || undefined,
        images: newArticle.images.map(img => ({
          url: img.filename
        }))
      });
      
      // Add new article to the list at the beginning
      setArticles([createdArticle, ...articles]);
      
      // Clear the form
      setNewArticle({ topic: '', additional_context_url: '', images: [], articleSlug: '' });
      
      // Show success message
      setCreateStatus('success');
      setTimeout(() => setCreateStatus(null), 5000); // Hide after 5 seconds
      
      // Start polling for article generation status
      pollArticleStatus(createdArticle.id);
    } catch (error) {
      console.error('Failed to create article:', error);
      setCreateStatus('error');
      setTimeout(() => setCreateStatus(null), 5000); // Hide after 5 seconds
    }
  };

  const pollArticleStatus = async (articleId: string) => {
    let pollCount = 0;
    const maxPolls = 100; // Maximum 100 polls = 5 minutes
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const article = await blogAPI.getArticle(articleId);
        
        // Update article in the list
        setArticles(prev => prev.map(a => 
          a.id === articleId ? article : a
        ));
        
        // Stop polling if article is done or has error
        if (article.status === 'done' || article.status === 'error') {
          clearInterval(pollInterval);
        }
        
        // Stop polling after max attempts (5 minutes)
        if (pollCount >= maxPolls) {
          console.log('Polling timeout reached for article', articleId);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll article status:', error);
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleUpdateArticle = async (updatedArticle: ArticleDetail) => {
    try {
      const updated = await blogAPI.updateArticle(updatedArticle.id, {
        title: updatedArticle.title,
        description: updatedArticle.description,
        content: updatedArticle.content,
        tag_ids: updatedArticle.tags.map(tag => tag.id)
      });
      
      // Update in local state
      setArticles(prev => prev.map(a => a.id === updated.id ? updated : a));
      
      // Show success indicator
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000); // Hide after 3 seconds
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
      
      // Update in local state
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
      // Remove from local state
      setArticles(prev => prev.filter(a => a.id !== articleId));
      setShowDeleteDialog(false);
      setDeletingArticleId(null);
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Ошибка при удалении статьи');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      // Upload images to S3
      const response = await blogAPI.uploadImages(
        Array.from(files),
        newArticle.articleSlug || undefined
      );

      // Update state with uploaded images
      setNewArticle(prev => ({
        ...prev,
        images: [...prev.images, ...response.images],
        articleSlug: response.article_slug // Save the slug for future uploads
      }));
    } catch (error) {
      console.error('Failed to upload images:', error);
      alert('Ошибка при загрузке изображений');
    } finally {
      setUploadingImages(false);
      // Clear the input
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
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

          {/* Articles List */}
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
              ) : articles.map((article) => (
                <Card key={article.id} className="border-gray-200 hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {article.title || 'Без названия'}
                          </h3>
                          {article.status && (
                            <Badge className={getStatusColor(article.status)} variant="outline">
                              <Icon name={getStatusIcon(article.status)} size={12} className="mr-1" />
                              {article.status === 'done' && 'Готово'}
                              {article.status === 'processing' && 'Генерация'}
                              {article.status === 'error' && 'Ошибка'}
                            </Badge>
                          )}
                          {article.is_published && (
                            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                              <Icon name="Globe" size={12} className="mr-1" />
                              Опубликовано
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {article.description || 'Описание отсутствует'}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Icon name="Link" size={14} />
                            <span>/{article.slug}</span>
                          </div>
                          {article.tags.length > 0 && (
                            <div className="flex gap-1">
                              {article.tags.map((tag) => (
                                <Badge key={tag.id} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                  {tag.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-6">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 hover:bg-gray-50"
                              onClick={async () => {
                                setLoadingArticle(true);
                                try {
                                  const fullArticle = await blogAPI.getArticle(article.id);
                                  setEditingArticle(fullArticle);
                                } catch (error) {
                                  console.error('Failed to load article:', error);
                                  // Fallback to partial data
                                  setEditingArticle({
                                    ...article,
                                    content: ''
                                  } as ArticleDetail);
                                } finally {
                                  setLoadingArticle(false);
                                }
                              }}
                            >
                              <Icon name="Edit" size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Icon name="Edit" size={20} />
                                Редактировать статью
                              </DialogTitle>
                            </DialogHeader>
                            {loadingArticle ? (
                              <div className="space-y-4 py-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-40 w-full" />
                              </div>
                            ) : editingArticle && (
                              <div className="space-y-4 py-4">
                                <div>
                                  <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700">
                                    Заголовок
                                  </Label>
                                  <Input
                                    id="edit-title"
                                    value={editingArticle.title}
                                    onChange={(e) => setEditingArticle({
                                      ...editingArticle,
                                      title: e.target.value
                                    })}
                                    className="mt-1 border-gray-300 focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                                    Описание
                                  </Label>
                                  <Textarea
                                    id="edit-description"
                                    value={editingArticle.description}
                                    onChange={(e) => setEditingArticle({
                                      ...editingArticle,
                                      description: e.target.value
                                    })}
                                    className="mt-1 border-gray-300 focus:border-blue-500"
                                    rows={3}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="edit-content" className="text-sm font-medium text-gray-700">
                                    Контент
                                  </Label>
                                  <Textarea
                                    id="edit-content"
                                    value={editingArticle.content}
                                    onChange={(e) => setEditingArticle({
                                      ...editingArticle,
                                      content: e.target.value
                                    })}
                                    className="mt-1 border-gray-300 focus:border-blue-500"
                                    rows={8}
                                  />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                  <Button 
                                    onClick={() => handleUpdateArticle(editingArticle)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    Сохранить изменения
                                  </Button>
                                  {updateSuccess && (
                                    <div className="flex items-center text-green-600">
                                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                        <Icon name="Check" size={16} className="text-green-600" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingArticleId(article.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                        
                        <Button
                          variant={article.is_published ? "outline" : "default"}
                          size="sm"
                          onClick={() => togglePublish(article.id)}
                          className={article.is_published 
                            ? "text-gray-600 border-gray-300 hover:bg-gray-50" 
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                          }
                        >
                          {article.is_published ? (
                            <>
                              <Icon name="EyeOff" size={16} className="mr-1" />
                              Скрыть
                            </>
                          ) : (
                            <>
                              <Icon name="Eye" size={16} className="mr-1" />
                              Опубликовать
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Create Article */}
          <TabsContent value="create">
            <Card className="border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon name="Sparkles" size={20} className="text-blue-600" />
                    Создать статью
                  </CardTitle>
                  {createStatus === 'success' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Icon name="CheckCircle" size={12} className="mr-1" />
                      Создание запущено
                    </Badge>
                  )}
                  {createStatus === 'error' && (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <Icon name="XCircle" size={12} className="mr-1" />
                      Ошибка
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="topic" className="text-sm font-medium text-gray-700">
                    Тема статьи *
                  </Label>
                  <Input
                    id="topic"
                    placeholder="Как скачать сайт из билдера Поехали!"
                    value={newArticle.topic}
                    onChange={(e) => setNewArticle({ ...newArticle, topic: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="context-url" className="text-sm font-medium text-gray-700">
                    Дополнительный контекст (URL)
                  </Label>
                  <Input
                    id="context-url"
                    placeholder="https://docs.poehali.dev/deploy/download_project"
                    value={newArticle.additional_context_url}
                    onChange={(e) => setNewArticle({ ...newArticle, additional_context_url: e.target.value })}
                    className="mt-1 border-gray-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="image-upload" className="text-sm font-medium text-gray-700">
                    Изображения для статьи
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    className="mt-1 border-gray-300"
                  />
                  {uploadingImages && (
                    <p className="text-sm text-blue-600 mt-2 flex items-center gap-2">
                      <Icon name="Loader2" size={14} className="animate-spin" />
                      Загрузка изображений...
                    </p>
                  )}
                  {newArticle.images.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {newArticle.images.map((img, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-3 flex-1">
                            <Icon name="Image" size={16} className="text-gray-500" />
                            <span className="text-sm truncate font-medium">{img.original_name}</span>
                            {img.filename.startsWith('http') && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                <Icon name="CheckCircle" size={10} className="mr-1" />
                                Загружено
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setNewArticle(prev => ({
                                ...prev,
                                images: prev.images.filter((_, i) => i !== index)
                              }));
                            }}
                            className="text-gray-500 hover:text-red-600"
                          >
                            <Icon name="X" size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <Button 
                  onClick={handleCreateArticle} 
                  disabled={!newArticle.topic.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
                >
                  <Icon name="Wand2" size={16} className="mr-2" />
                  Создать статью
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="AlertTriangle" size={20} className="text-red-600" />
                Подтвердите удаление
              </DialogTitle>
              <DialogDescription className="pt-2">
                Точно ли вы хотите удалить эту статью? Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingArticleId(null);
                }}
                className="border-gray-300"
              >
                Отменить
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingArticleId) {
                    handleDeleteArticle(deletingArticleId);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}