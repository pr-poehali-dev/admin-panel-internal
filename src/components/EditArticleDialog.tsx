import React, { useState, useEffect } from 'react';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { ArticleDetail } from '@/services/api';

interface EditArticleDialogProps {
  article: ArticleDetail | null;
  loading: boolean;
  onUpdate: (article: ArticleDetail) => void;
  updateSuccess: boolean;
}

export default function EditArticleDialog({ article, loading, onUpdate, updateSuccess }: EditArticleDialogProps) {
  const [editingArticle, setEditingArticle] = useState<ArticleDetail | null>(null);

  useEffect(() => {
    setEditingArticle(article);
  }, [article]);

  if (loading) {
    return (
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Edit" size={20} />
            Редактировать статью
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DialogContent>
    );
  }

  if (!editingArticle) return null;

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon name="Edit" size={20} />
          Редактировать статью
        </DialogTitle>
      </DialogHeader>
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
            onClick={() => onUpdate(editingArticle)}
            className="bg-black hover:bg-gray-800"
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
    </DialogContent>
  );
}