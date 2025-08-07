import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface DeleteArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteArticleDialog({ open, onOpenChange, onConfirm, onCancel }: DeleteArticleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={onCancel}
            className="border-gray-300"
          >
            Отменить
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700"
          >
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}