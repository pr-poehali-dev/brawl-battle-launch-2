import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { PayoutRequest } from './PayoutRequests';

interface PayoutRequestCardProps {
  request: PayoutRequest;
  getStatusBadge: (status: string) => JSX.Element;
  onReview: (request: PayoutRequest) => void;
  onShowRecommendations: (request: PayoutRequest) => void;
  onShowEmployeeProfile: (request: PayoutRequest) => void;
}

export function PayoutRequestCard({
  request,
  getStatusBadge,
  onReview,
  onShowRecommendations,
  onShowEmployeeProfile
}: PayoutRequestCardProps) {
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
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Детали выплаты</p>
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-md text-sm">
                {request.paymentDetails.split('\n').map((line, idx) => {
                  const [label, value] = line.split(':').map(s => s.trim());
                  return value ? (
                    <div key={idx}>
                      <span className="text-muted-foreground text-xs">{label}:</span>
                      <p className="font-medium">{value}</p>
                    </div>
                  ) : (
                    <p key={idx} className="col-span-2 font-medium">{line}</p>
                  );
                })}
              </div>
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
            {request.status === 'pending' && (
              <Button onClick={() => onReview(request)} className="w-full">
                Рассмотреть запрос
              </Button>
            )}
            {request.status === 'approved' && (
              <Button onClick={() => onReview(request)} className="w-full">
                Отметить как выплаченное
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onShowRecommendations(request)}
              className="w-full"
            >
              <Icon name="Users" className="w-4 h-4 mr-2" />
              Все рекомендации сотрудника
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
