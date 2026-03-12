import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { PayoutRequest } from '../PayoutRequests';

interface EmployeeRecommendationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PayoutRequest | null;
  recommendations: any[];
  loading: boolean;
}

export function EmployeeRecommendationsDialog({
  open,
  onOpenChange,
  request,
  recommendations,
  loading
}: EmployeeRecommendationsDialogProps) {
  const getRecommendationStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary' },
      accepted: { label: 'Принято', variant: 'default' },
      rejected: { label: 'Отклонено', variant: 'destructive' },
      interview: { label: 'Интервью', variant: 'outline' },
      hired: { label: 'Нанят', variant: 'default' },
    };
    const cfg = config[status] || config.pending;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Рекомендации сотрудника</DialogTitle>
          <DialogDescription>
            {request && `${request.userName} — все рекомендации кандидатов`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" className="animate-spin text-primary" size={32} />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-3 opacity-50" />
              <p>У этого сотрудника пока нет рекомендаций</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{rec.candidate_name}</CardTitle>
                        <CardDescription className="text-xs">{rec.candidate_email}</CardDescription>
                      </div>
                      {getRecommendationStatusBadge(rec.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {rec.vacancy_title && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Вакансия</p>
                          <p className="font-medium">{rec.vacancy_title}</p>
                        </div>
                      )}
                      {rec.candidate_phone && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Телефон</p>
                          <p>{rec.candidate_phone}</p>
                        </div>
                      )}
                      {rec.comment && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Комментарий</p>
                          <p className="text-xs">{rec.comment}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Дата рекомендации</p>
                        <p className="text-xs">{new Date(rec.created_at).toLocaleString('ru-RU')}</p>
                      </div>
                      {rec.status === 'hired' && (
                        <div className="bg-green-50 p-2 rounded-md border border-green-200">
                          <p className="text-xs font-medium text-green-800">
                            <Icon name="CheckCircle" size={14} className="inline mr-1" />
                            Вознаграждение: {rec.reward_amount.toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
