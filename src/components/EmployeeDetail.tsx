import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Employee, Recommendation } from '@/types';

interface EmployeeDetailProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: Recommendation[];
}

export function EmployeeDetail({ employee, open, onOpenChange, recommendations }: EmployeeDetailProps) {
  if (!employee) return null;

  const employeeRecommendations = recommendations.filter(r => r.employeeId === employee.id);
  
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
      pending:   { label: 'На рассмотрении', variant: 'secondary',    className: 'bg-yellow-500 text-white' },
      interview: { label: 'На интервью',     variant: 'default',      className: 'bg-blue-600 text-white' },
      hired:     { label: 'Принят',          variant: 'default',      className: 'bg-green-600 text-white' },
      accepted:  { label: 'Принят',          variant: 'default',      className: 'bg-green-600 text-white' },
      rejected:  { label: 'Отклонён',        variant: 'destructive',  className: 'text-white' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {employee.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Должность</p>
              <p className="font-medium">{employee.position}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Отдел</p>
              <p className="font-medium">{employee.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Телефон</p>
              <p className="font-medium">{employee.phone || '—'}</p>
            </div>
            {employee.telegram && (
              <div>
                <p className="text-sm text-muted-foreground">Telegram</p>
                <p className="font-medium">{employee.telegram}</p>
              </div>
            )}
            {employee.vk && (
              <div>
                <p className="text-sm text-muted-foreground">VK</p>
                <p className="font-medium">{employee.vk}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Рекомендации сотрудника</h3>
            {employeeRecommendations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-8">
                    <Icon name="UserX" size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Нет рекомендаций</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {employeeRecommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-base">{rec.candidateName}</CardTitle>
                            {getStatusBadge(rec.status)}
                          </div>
                          <CardDescription>
                            <div className="flex items-center gap-2 mt-1">
                              <Icon name="Mail" size={14} />
                              <span>{rec.candidateEmail}</span>
                            </div>
                            {rec.candidatePhone && (
                              <div className="flex items-center gap-2 mt-1">
                                <Icon name="Phone" size={14} />
                                <span>{rec.candidatePhone}</span>
                              </div>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Вакансия</p>
                          <p className="text-sm">{rec.vacancyTitle}</p>
                        </div>
                        {rec.comment && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Комментарий</p>
                            <p className="text-sm">{rec.comment}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Дата рекомендации</p>
                          <p className="text-sm">{new Date(rec.date).toLocaleDateString('ru-RU')}</p>
                        </div>
                        {rec.reward && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Вознаграждение</p>
                            <p className="text-sm font-semibold text-green-600">{rec.reward.toLocaleString('ru-RU')} ₽</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}