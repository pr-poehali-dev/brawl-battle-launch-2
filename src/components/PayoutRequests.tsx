import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { PayoutRequestCard } from './PayoutRequestCard';
import { ReviewPayoutDialog } from './ReviewPayoutDialog';
import { EmployeeRecommendationsDialog } from './EmployeeRecommendationsDialog';
import { EmployeeProfileDialog } from './EmployeeProfileDialog';

export interface PayoutRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  paymentMethod?: string;
  paymentDetails?: string;
  adminComment?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  candidateName?: string;
  candidateEmail?: string;
  vacancyTitle?: string;
  recommendationId?: number;
}

interface PayoutRequestsProps {
  requests: PayoutRequest[];
  companyId?: number;
  onUpdateStatus: (requestId: number, status: string, comment?: string) => void;
  onVacancyClick?: (vacancyId: number) => void;
}

export function PayoutRequests({ requests, companyId = 1, onUpdateStatus, onVacancyClick }: PayoutRequestsProps) {
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'paid'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false);
  const [employeeRecommendations, setEmployeeRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showEmployeeProfile, setShowEmployeeProfile] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);

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

  const handleReview = (request: PayoutRequest) => {
    setSelectedRequest(request);
    setReviewStatus(request.status === 'approved' ? 'paid' : 'approved');
    setReviewComment('');
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (selectedRequest) {
      onUpdateStatus(selectedRequest.id, reviewStatus, reviewComment);
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewComment('');
    }
  };

  const handleShowRecommendations = async (request: PayoutRequest) => {
    setSelectedRequest(request);
    setShowRecommendationsDialog(true);
    setLoadingRecommendations(true);
    
    try {
      const recommendations = await api.getRecommendations(companyId, undefined, request.userId);
      setEmployeeRecommendations(recommendations);
    } catch (error) {
      console.error('Ошибка загрузки рекомендаций:', error);
      setEmployeeRecommendations([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleShowEmployeeProfile = async (request: PayoutRequest) => {
    setSelectedRequest(request);
    setShowEmployeeProfile(true);
    setLoadingEmployee(true);
    
    try {
      const employees = await api.getEmployees(companyId);
      const employee = employees.find(emp => emp.id === request.userId);
      if (employee) {
        const recommendations = await api.getRecommendations(companyId, undefined, request.userId);
        setEmployeeData({ ...employee, recommendations });
      }
    } catch (error) {
      console.error('Ошибка загрузки данных сотрудника:', error);
      setEmployeeData(null);
    } finally {
      setLoadingEmployee(false);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const paidRequests = requests.filter(r => r.status === 'paid');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  return (
    <>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="pending" className="text-[10px] sm:text-sm px-1 sm:px-3 py-2 whitespace-normal leading-tight">
            <span className="hidden md:inline">На рассмотрении</span>
            <span className="md:hidden">Рассм.</span>
            {pendingRequests.length > 0 && <span className="ml-0.5">({pendingRequests.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-[10px] sm:text-sm px-1 sm:px-3 py-2 whitespace-normal leading-tight">
            <span className="hidden sm:inline">Одобрено</span>
            <span className="sm:hidden">Одобр.</span>
            {approvedRequests.length > 0 && <span className="ml-0.5">({approvedRequests.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="paid" className="text-[10px] sm:text-sm px-1 sm:px-3 py-2 whitespace-normal leading-tight">
            <span className="hidden sm:inline">Выплачено</span>
            <span className="sm:hidden">Выпл.</span>
            {paidRequests.length > 0 && <span className="ml-0.5">({paidRequests.length})</span>}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-[10px] sm:text-sm px-1 sm:px-3 py-2 whitespace-normal leading-tight">
            <span className="hidden sm:inline">Отклонено</span>
            <span className="sm:hidden">Откл.</span>
            {rejectedRequests.length > 0 && <span className="ml-0.5">({rejectedRequests.length})</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет запросов на рассмотрении</p>
          ) : (
            pendingRequests.map(request => (
              <PayoutRequestCard
                key={request.id}
                request={request}
                getStatusBadge={getStatusBadge}
                onReview={handleReview}
                onShowRecommendations={handleShowRecommendations}
                onShowEmployeeProfile={handleShowEmployeeProfile}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approvedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет одобренных запросов</p>
          ) : (
            approvedRequests.map(request => (
              <PayoutRequestCard
                key={request.id}
                request={request}
                getStatusBadge={getStatusBadge}
                onReview={handleReview}
                onShowRecommendations={handleShowRecommendations}
                onShowEmployeeProfile={handleShowEmployeeProfile}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4 mt-4">
          {paidRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет выплаченных запросов</p>
          ) : (
            paidRequests.map(request => (
              <PayoutRequestCard
                key={request.id}
                request={request}
                getStatusBadge={getStatusBadge}
                onReview={handleReview}
                onShowRecommendations={handleShowRecommendations}
                onShowEmployeeProfile={handleShowEmployeeProfile}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4 mt-4">
          {rejectedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет отклонённых запросов</p>
          ) : (
            rejectedRequests.map(request => (
              <PayoutRequestCard
                key={request.id}
                request={request}
                getStatusBadge={getStatusBadge}
                onReview={handleReview}
                onShowRecommendations={handleShowRecommendations}
                onShowEmployeeProfile={handleShowEmployeeProfile}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <ReviewPayoutDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        selectedRequest={selectedRequest}
        reviewStatus={reviewStatus}
        reviewComment={reviewComment}
        onReviewStatusChange={setReviewStatus}
        onReviewCommentChange={setReviewComment}
        onSubmit={handleSubmitReview}
      />

      <EmployeeRecommendationsDialog
        open={showRecommendationsDialog}
        onOpenChange={setShowRecommendationsDialog}
        selectedRequest={selectedRequest}
        recommendations={employeeRecommendations}
        loading={loadingRecommendations}
        getRecommendationStatusBadge={getRecommendationStatusBadge}
        onVacancyClick={onVacancyClick}
      />

      <EmployeeProfileDialog
        open={showEmployeeProfile}
        onOpenChange={setShowEmployeeProfile}
        selectedRequest={selectedRequest}
        employeeData={employeeData}
        loading={loadingEmployee}
        getRecommendationStatusBadge={getRecommendationStatusBadge}
      />
    </>
  );
}