import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { ArticleListItem } from '@/services/api';

interface ArticleCardProps {
  article: ArticleListItem;
  onEdit: (articleId: string) => void;
  onDelete: (articleId: string) => void;
  onTogglePublish: (articleId: string) => void;
}

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

export default function ArticleCard({ article, onEdit, onDelete, onTogglePublish }: ArticleCardProps) {
  return (
    <Card className="border-gray-200 hover:shadow-md transition-all duration-200">
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
                  onClick={() => onEdit(article.id)}
                >
                  <Icon name="Edit" size={16} />
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(article.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Icon name="Trash2" size={16} />
            </Button>
            
            <Button
              variant={article.is_published ? "outline" : "default"}
              size="sm"
              onClick={() => onTogglePublish(article.id)}
              className={article.is_published 
                ? "text-gray-600 border-gray-300 hover:bg-gray-50" 
                : "bg-primary hover:bg-primary/90 text-white"
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
  );
}