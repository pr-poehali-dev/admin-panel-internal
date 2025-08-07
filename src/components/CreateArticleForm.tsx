import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { blogAPI } from '@/services/api';

interface ImageUpload {
  filename: string;
  original_name: string;
  file?: File;
}

interface CreateArticleFormProps {
  onArticleCreated: (article: any) => void;
}

export default function CreateArticleForm({ onArticleCreated }: CreateArticleFormProps) {
  const [newArticle, setNewArticle] = useState({
    topic: '',
    additional_context_url: '',
    images: [] as ImageUpload[],
    articleSlug: ''
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [createStatus, setCreateStatus] = useState<'success' | 'error' | null>(null);

  const handleCreateArticle = async () => {
    try {
      const createdArticle = await blogAPI.createArticle({
        topic: newArticle.topic,
        additional_context_url: newArticle.additional_context_url || undefined,
        images: newArticle.images.map(img => ({
          url: img.filename
        }))
      });
      
      onArticleCreated(createdArticle);
      
      setNewArticle({ topic: '', additional_context_url: '', images: [], articleSlug: '' });
      
      setCreateStatus('success');
      setTimeout(() => setCreateStatus(null), 5000);
    } catch (error) {
      console.error('Failed to create article:', error);
      setCreateStatus('error');
      setTimeout(() => setCreateStatus(null), 5000);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const response = await blogAPI.uploadImages(
        Array.from(files),
        newArticle.articleSlug || undefined
      );

      setNewArticle(prev => ({
        ...prev,
        images: [...prev.images, ...response.images],
        articleSlug: response.article_slug
      }));
    } catch (error) {
      console.error('Failed to upload images:', error);
      if (error instanceof Error) {
        alert(`Ошибка при загрузке изображений: ${error.message}`);
      } else {
        alert('Ошибка при загрузке изображений');
      }
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  return (
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
  );
}