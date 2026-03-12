import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { PayoutRequest } from './PayoutRequests';

interface EmployeeRecommendationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: PayoutRequest | null;
  recommendations: any[];
  loading: boolean;
  getRecommendationStatusBadge: (status: string) => JSX.Element;
  onVacancyClick?: (vacancyId: number) => void;
}

export function EmployeeRecommendationsDialog({
  open,
  onOpenChange,
  selectedRequest,
  recommendations,
  loading,
  getRecommendationStatusBadge,
  onVacancyClick
}: EmployeeRecommendationsDialogProps) {
  if (!selectedRequest) return null;

  const hiredRecommendations = recommendations.filter(r => r.status === 'hired');
  const totalReward = hiredRecommendations.reduce((sum, r) => sum + (r.reward_amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Все рекомендации сотрудника</DialogTitle>
          <DialogDescription>
            {selectedRequest.userName} • {selectedRequest.userEmail}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Users" size={48} className="mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Нет рекомендаций</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Всего рекомендаций</p>
                    <p className="text-3xl font-bold">{recommendations.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Успешно нанято</p>
                    <p className="text-3xl font-bold text-green-600">{hiredRecommendations.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Заработано: {totalReward.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{rec.candidate_name}</p>
                        <p className="text-sm text-muted-foreground">{rec.candidate_email}</p>
                      </div>
                      {getRecommendationStatusBadge(rec.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Вакансия: </span>
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-primary hover:underline"
                          onClick={() => {
                            if (rec.vacancy_id && onVacancyClick) {
                              onVacancyClick(rec.vacancy_id);
                              onOpenChange(false);
                            }
                          }}
                        >
                          {rec.vacancy_title || 'Не указано'}
                          <Icon name="ExternalLink" className="ml-1" size={14} />
                        </Button>
                      </div>
                      {rec.reward_amount && (
                        <div>
                          <span className="text-muted-foreground">Вознаграждение: </span>
                          <span className="font-medium text-green-600">{rec.reward_amount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Дата: </span>
                        <span>{new Date(rec.created_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                      {rec.comment && (
                        <div>
                          <span className="text-muted-foreground">Комментарий: </span>
                          <span className="text-sm">{rec.comment}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}