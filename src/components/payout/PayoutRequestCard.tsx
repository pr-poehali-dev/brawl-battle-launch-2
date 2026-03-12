import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { PayoutRequest } from '../PayoutRequests';

interface PayoutRequestCardProps {
  request: PayoutRequest;
  onShowRecommendations: (request: PayoutRequest) => void;
  onReview: (request: PayoutRequest) => void;
  onShowEmployeeProfile: (request: PayoutRequest) => void;
  onUpdateStatus: (requestId: number, status: string) => void;
}

export function PayoutRequestCard({
  request,
  onShowRecommendations,
  onReview,
  onShowEmployeeProfile,
  onUpdateStatus
}: PayoutRequestCardProps) {
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      pending: { label: 'На рассмотрении', variant: 'secondary' },
      approved: { label: 'Одобрено', variant: 'default' },
      rejected: { label: 'Отклонено', variant: 'destructive' },
      paid: { label: 'Выплачено', variant: 'outline' },
    };
    const cfg = config[status] || config.pending;
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle 
              className="text-base cursor-pointer hover:text-primary transition-colors"
              onClick={() => onShowEmployeeProfile(request)}
            >
              {request.userName}
            </CardTitle>
            <CardDescription>{request.userEmail}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(request.status)}
            <div className="text-lg font-bold text-green-600">
              {request.amount.toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {request.candidateName && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Кандидат</p>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-800">{request.candidateName}</p>
                {request.candidateEmail && (
                  <p className="text-xs text-blue-600">{request.candidateEmail}</p>
                )}
                {request.vacancyTitle && (
                  <p className="text-xs text-blue-600">Вакансия: {request.vacancyTitle}</p>
                )}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Дата запроса</p>
            <p className="text-sm">{new Date(request.createdAt).toLocaleString('ru-RU')}</p>
          </div>
          {request.paymentMethod && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Способ выплаты</p>
              <p className="text-sm">{request.paymentMethod}</p>
            </div>
          )}
          {request.paymentDetails && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Детали выплаты</p>
              <p className="text-sm">{request.paymentDetails}</p>
            </div>
          )}
          {request.adminComment && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Комментарий администратора</p>
              <p className="text-sm">{request.adminComment}</p>
            </div>
          )}
          {request.reviewedAt && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Дата рассмотрения</p>
              <p className="text-sm">{new Date(request.reviewedAt).toLocaleString('ru-RU')}</p>
            </div>
          )}
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={() => onShowRecommendations(request)} variant="outline" className="w-full">
              <Icon name="Users" size={16} className="mr-2" />
              Показать рекомендации
            </Button>
            {request.status === 'pending' && (
              <Button onClick={() => onReview(request)} className="w-full">
                <Icon name="CheckCircle" size={16} className="mr-2" />
                Рассмотреть запрос
              </Button>
            )}
            {request.status === 'approved' && (
              <Button onClick={() => onUpdateStatus(request.id, 'paid')} className="w-full" variant="outline">
                <Icon name="DollarSign" size={16} className="mr-2" />
                Отметить как выплачено
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
