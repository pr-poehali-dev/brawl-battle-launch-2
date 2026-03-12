import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { PayoutRequest } from '../PayoutRequests';

interface EmployeeProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PayoutRequest | null;
  employeeData: any;
  loading: boolean;
}

export function EmployeeProfileDialog({
  open,
  onOpenChange,
  request,
  employeeData,
  loading
}: EmployeeProfileDialogProps) {
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Профиль сотрудника</DialogTitle>
          <DialogDescription>
            {request && `Полная информация о ${request.userName}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" className="animate-spin text-primary" size={32} />
            </div>
          ) : employeeData ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {employeeData.avatar_url ? (
                      <img src={employeeData.avatar_url} alt={employeeData.first_name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon name="User" size={32} className="text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle>{employeeData.first_name} {employeeData.last_name}</CardTitle>
                      <CardDescription>{employeeData.position} • {employeeData.department}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Уровень</p>
                      <p className="text-2xl font-bold text-primary">{employeeData.level}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Опыт</p>
                      <p className="text-2xl font-bold">{employeeData.experience_points} XP</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Рекомендаций</p>
                      <p className="text-2xl font-bold text-blue-600">{employeeData.total_recommendations}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Успешных наймов</p>
                      <p className="text-2xl font-bold text-green-600">{employeeData.successful_hires}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Всего заработано</p>
                      <p className="text-3xl font-bold text-green-600">{employeeData.total_earnings.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {employeeData.email && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Контакты</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {employeeData.email && (
                        <div className="flex items-center gap-2">
                          <Icon name="Mail" size={16} className="text-muted-foreground" />
                          <span className="text-sm">{employeeData.email}</span>
                        </div>
                      )}
                      {employeeData.phone && (
                        <div className="flex items-center gap-2">
                          <Icon name="Phone" size={16} className="text-muted-foreground" />
                          <span className="text-sm">{employeeData.phone}</span>
                        </div>
                      )}
                      {employeeData.telegram && (
                        <div className="flex items-center gap-2">
                          <Icon name="Send" size={16} className="text-muted-foreground" />
                          <span className="text-sm">{employeeData.telegram}</span>
                        </div>
                      )}
                      {employeeData.vk && (
                        <div className="flex items-center gap-2">
                          <Icon name="MessageCircle" size={16} className="text-muted-foreground" />
                          <span className="text-sm">{employeeData.vk}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {employeeData.recommendations && employeeData.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">История рекомендаций</CardTitle>
                    <CardDescription>{employeeData.recommendations.length} {employeeData.recommendations.length === 1 ? 'рекомендация' : 'рекомендаций'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {employeeData.recommendations.map((rec: any) => (
                        <div key={rec.id} className="border rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{rec.candidate_name}</p>
                              <p className="text-xs text-muted-foreground">{rec.vacancy_title}</p>
                            </div>
                            {getRecommendationStatusBadge(rec.status)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(rec.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Не удалось загрузить данные сотрудника</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
