import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { PayoutRequest } from '../PayoutRequests';

interface PayoutReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PayoutRequest | null;
  onSubmit: (status: 'approved' | 'rejected' | 'paid', comment: string) => void;
}

export function PayoutReviewDialog({
  open,
  onOpenChange,
  request,
  onSubmit
}: PayoutReviewDialogProps) {
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'paid'>('approved');
  const [reviewComment, setReviewComment] = useState('');

  const handleSubmit = () => {
    onSubmit(reviewStatus, reviewComment);
    setReviewComment('');
    setReviewStatus('approved');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Рассмотрение запроса на выплату</DialogTitle>
          <DialogDescription>
            {request && (
              <>
                Запрос от {request.userName} на сумму{' '}
                <span className="font-semibold">{request.amount.toLocaleString('ru-RU')} ₽</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Решение</Label>
            <Select value={reviewStatus} onValueChange={(v) => setReviewStatus(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Одобрить</SelectItem>
                <SelectItem value="rejected">Отклонить</SelectItem>
                <SelectItem value="paid">Выплачено</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Комментарий (опционально)</Label>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Добавьте комментарий к решению..."
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1">
              <Icon name="Check" size={16} className="mr-2" />
              Подтвердить
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
