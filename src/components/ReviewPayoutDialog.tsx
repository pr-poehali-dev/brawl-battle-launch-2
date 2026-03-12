import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { PayoutRequest } from './PayoutRequests';

interface ReviewPayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: PayoutRequest | null;
  reviewStatus: 'approved' | 'rejected' | 'paid';
  reviewComment: string;
  onReviewStatusChange: (value: 'approved' | 'rejected' | 'paid') => void;
  onReviewCommentChange: (value: string) => void;
  onSubmit: () => void;
}

export function ReviewPayoutDialog({
  open,
  onOpenChange,
  selectedRequest,
  reviewStatus,
  reviewComment,
  onReviewStatusChange,
  onReviewCommentChange,
  onSubmit
}: ReviewPayoutDialogProps) {
  if (!selectedRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Рассмотрение запроса на выплату</DialogTitle>
          <DialogDescription>
            Запрос от {selectedRequest.userName} на сумму {selectedRequest.amount.toLocaleString('ru-RU')} ₽
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Статус</Label>
            <Select value={reviewStatus} onValueChange={onReviewStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedRequest.status === 'approved' ? (
                  <>
                    <SelectItem value="paid">Выплачено</SelectItem>
                    <SelectItem value="rejected">Отклонить</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="approved">Одобрить</SelectItem>
                    <SelectItem value="rejected">Отклонить</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Комментарий (необязательно)</Label>
            <Textarea
              placeholder="Причина отклонения или комментарий..."
              value={reviewComment}
              onChange={(e) => onReviewCommentChange(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSubmit} className="flex-1">
              Подтвердить
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}