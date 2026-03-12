import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { PayoutRequest } from './PayoutRequests';

interface EmployeeProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: PayoutRequest | null;
  employeeData: any;
  loading: boolean;
  getRecommendationStatusBadge: (status: string) => JSX.Element;
}

export function EmployeeProfileDialog({
  open,
  onOpenChange,
  selectedRequest,
  employeeData,
  loading,
  getRecommendationStatusBadge
}: EmployeeProfileDialogProps) {
  if (!selectedRequest) return null;

  const hiredCount = employeeData?.recommendations?.filter((r: any) => r.status === 'hired').length || 0;
  const totalReward = employeeData?.recommendations?.reduce((sum: number, r: any) => 
    r.status === 'hired' ? sum + (r.reward_amount || 0) : sum, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Профиль сотрудника</DialogTitle>
          <DialogDescription>Информация о сотруднике и его активности</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !employeeData ? (
          <div className="text-center py-12">
            <Icon name="AlertCircle" size={48} className="mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Не удалось загрузить данные сотрудника</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl">
                  {employeeData.first_name?.[0]}{employeeData.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">
                  {employeeData.first_name} {employeeData.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{employeeData.email}</p>
                {employeeData.position && (
                  <p className="text-sm font-medium mt-1">{employeeData.position}</p>
                )}
                {employeeData.department && (
                  <p className="text-sm text-muted-foreground">{employeeData.department}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icon name="Users" className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{employeeData.recommendations?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Рекомендаций</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icon name="CheckCircle2" className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{hiredCount}</p>
                    <p className="text-xs text-muted-foreground">Успешно нанято</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Icon name="DollarSign" className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{totalReward.toLocaleString('ru-RU')}</p>
                    <p className="text-xs text-muted-foreground">₽ заработано</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {employeeData.recommendations && employeeData.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Последние рекомендации</h4>
                <div className="space-y-2">
                  {employeeData.recommendations.slice(0, 5).map((rec: any) => (
                    <Card key={rec.id}>
                      <CardContent className="py-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{rec.candidate_name}</p>
                              <p className="text-sm text-muted-foreground">{rec.candidate_email}</p>
                            </div>
                            {getRecommendationStatusBadge(rec.status)}
                          </div>
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-muted-foreground">Вакансия: </span>
                              <span className="font-medium">{rec.vacancy_title || 'Не указано'}</span>
                            </div>
                            {rec.reward_amount && (
                              <div>
                                <span className="text-muted-foreground">Вознаграждение: </span>
                                <span className="font-medium text-green-600">
                                  {rec.reward_amount.toLocaleString('ru-RU')} ₽
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Дата: </span>
                              <span>{new Date(rec.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}