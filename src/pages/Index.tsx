import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { QRCodeSVG } from 'qrcode.react';
import { api, type Vacancy as ApiVacancy, type Employee as ApiEmployee, type Recommendation as ApiRecommendation, type Company, type WalletData, type Chat } from '@/lib/api';
import type { UserRole, Vacancy, Employee, Recommendation, ChatMessage, NewsPost, NewsComment, PayoutRequest } from '@/types';
import { EmployeeDetail } from '@/components/EmployeeDetail';
import { PayoutRequests } from '@/components/PayoutRequests';
import { VacancyDetail } from '@/components/VacancyDetail';
import { CandidateDetail } from '@/components/CandidateDetail';
import { SubscriptionExpiredBlock } from '@/components/SubscriptionExpiredBlock';
import Onboarding from '@/components/Onboarding';
import ScrollableTabs from '@/components/ScrollableTabs';
import GamesTab from '@/components/GamesTab';

function Index() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const saved = localStorage.getItem('userRole');
      return (saved as UserRole) || 'guest';
    }
    return 'guest';
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [activeVacancy, setActiveVacancy] = useState<Vacancy | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showCompanySettingsDialog, setShowCompanySettingsDialog] = useState(false);
  const [companyEditForm, setCompanyEditForm] = useState({ description: '', website: '', industry: '', telegram: '', vk: '' });
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [activeChatEmployee, setActiveChatEmployee] = useState<Employee | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCompanyProfileDialog, setShowCompanyProfileDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPersonalDataDialog, setShowPersonalDataDialog] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ token: '', password: '', confirmPassword: '' });
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatPollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const chatMessagesEndRef = React.useRef<HTMLDivElement>(null);
  const [newReward, setNewReward] = useState('30000');
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [chats, setChats] = useState<Chat[]>([]);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [employeeEditForm, setEmployeeEditForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    department: ''
  });
  const [showIntegrationsDialog, setShowIntegrationsDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState(0);
  
  const isSubscriptionExpired = subscriptionDaysLeft <= 0;
  const [notifications, setNotifications] = useState<Array<{id: number; type: string; message: string; date: string; read: boolean}>>([]);
  
  const currentEmployeeId = currentUser?.id;
  const currentCompanyId = currentUser?.company_id;
  
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [prevRecommendationsCount, setPrevRecommendationsCount] = useState<number>(0);
  const [newRecommendationsCount, setNewRecommendationsCount] = useState<number>(0);
  const [prevEmployeesCount, setPrevEmployeesCount] = useState<number>(0);
  const [newEmployeesCount, setNewEmployeesCount] = useState<number>(0);
  const [prevPayoutsCount, setPrevPayoutsCount] = useState<number>(0);
  const [newPayoutsCount, setNewPayoutsCount] = useState<number>(0);
  const [prevVacanciesCount, setPrevVacanciesCount] = useState<number>(0);
  const [newVacanciesCount, setNewVacanciesCount] = useState<number>(0);
  const [newNewsCount, setNewNewsCount] = useState<number>(() => 0);
  const [newNotificationsCount, setNewNotificationsCount] = useState<number>(() => 0);
  const [employeeTabsInitialized, setEmployeeTabsInitialized] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDetail, setShowEmployeeDetail] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<'all' | 'active' | 'fired' | 'admin'>('active');
  const [selectedVacancyDetail, setSelectedVacancyDetail] = useState<Vacancy | null>(null);
  const [showVacancyDetail, setShowVacancyDetail] = useState(false);
  const [showRecommendDialog, setShowRecommendDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Recommendation | null>(null);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [vacancySearchQuery, setVacancySearchQuery] = useState('');
  const [recommendationSearchQuery, setRecommendationSearchQuery] = useState('');
  const [recommendationStatusFilter, setRecommendationStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    paymentMethod: 'card',
    paymentDetails: '',
    bankName: '',
    accountFullName: '',
    accountBank: '',
    accountNumber: '',
    accountBik: ''
  });
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: '',
    telegram: '',
    vk: '',
    avatar: ''
  });
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [integrationForm, setIntegrationForm] = useState({
    source: '1c',
    apiUrl: '',
    apiKey: '',
    syncInterval: 'manual'
  });
  
  const [editProfileForm, setEditProfileForm] = useState({
    firstName: '',
    lastName: '',
    position: '',
    department: ''
  });
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [contactFormSubmitting, setContactFormSubmitting] = useState(false);
  const [contactFormSuccess, setContactFormSuccess] = useState(false);

  const [showDemoDialog, setShowDemoDialog] = useState(false);
  const [demoForm, setDemoForm] = useState({
    companyName: '',
    name: '',
    phone: '',
    email: '',
    employeeCount: ''
  });
  const [demoFormSubmitting, setDemoFormSubmitting] = useState(false);
  
  const [vacancyForm, setVacancyForm] = useState({
    title: '',
    department: '',
    salary: '',
    description: '',
    requirements: '',
    reward: '30000',
    payoutDelay: '30',
    city: '',
    isRemote: false
  });
  
  const [recommendationForm, setRecommendationForm] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  });

  const [registerForm, setRegisterForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    inn: '',
    employeeCount: '50'
  });

  const [innVerificationState, setInnVerificationState] = useState<{
    isChecking: boolean;
    isVerified: boolean;
    error: string | null;
    companyData: any | null;
  }>({
    isChecking: false,
    isVerified: false,
    error: null,
    companyData: null
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [resendVerificationEmail, setResendVerificationEmail] = useState('');
  const [resendVerificationTimer, setResendVerificationTimer] = useState(0);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    position: '',
    department: ''
  });

  const [vacancyFilter, setVacancyFilter] = useState({
    search: '',
    department: 'all',
    status: 'all'
  });

  const [referralLink, setReferralLink] = useState('');
  const [showReferralLinkDialog, setShowReferralLinkDialog] = useState(false);
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null);
  const [showRecommendationDetailsDialog, setShowRecommendationDetailsDialog] = useState(false);
  const [loginType, setLoginType] = useState<'employer' | 'employee'>('employer');
  const [employeeToEditRoles, setEmployeeToEditRoles] = useState<Employee | null>(null);
  const [showEditRolesDialog, setShowEditRolesDialog] = useState(false);
  const [rolesForm, setRolesForm] = useState({
    isAdmin: false
  });

  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [showCreateNewsDialog, setShowCreateNewsDialog] = useState(false);
  const [showEditNewsDialog, setShowEditNewsDialog] = useState(false);
  const [newsToEdit, setNewsToEdit] = useState<NewsPost | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category: 'news' as 'news' | 'achievement' | 'announcement' | 'blog'
  });
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [activeNewsPost, setActiveNewsPost] = useState<NewsPost | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (userRole !== 'guest') {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);

  useEffect(() => {
    if (resendVerificationTimer > 0) {
      const timer = setTimeout(() => {
        setResendVerificationTimer(resendVerificationTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendVerificationTimer]);

  useEffect(() => {
    if (authToken && userRole !== 'guest') {
      verifyToken();
      if (localStorage.getItem('showOnboarding') === 'true' && !localStorage.getItem('onboarding_completed')) {
        setShowOnboarding(true);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('token');
    if (resetToken) {
      setResetPasswordForm({ token: resetToken, password: '', confirmPassword: '' });
      setShowResetPasswordDialog(true);
      // Очищаем URL от токена
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'X-Auth-Token': authToken || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        if (data.user?.role !== 'admin') {
          if (data.user?.is_admin) {
            setUserRole('employer');
            localStorage.setItem('userRole', 'employer');
          } else {
            setUserRole('employee');
          }
        }
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('authToken');
      localStorage.removeItem('showOnboarding');
      localStorage.removeItem('onboarding_completed');
      setUserRole('guest');
      setAuthToken(null);
      setCurrentUser(null);
      setShowOnboarding(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const loadChatMessages = async (chatId: number) => {
    try {
      const msgs = await api.getMessages(chatId);
      const mapped: ChatMessage[] = msgs.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name || 'Сотрудник',
        message: m.message,
        timestamp: new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isOwn: m.sender_id === currentUser?.id,
      }));
      setChatMessages(mapped);
      setTimeout(() => chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  const handleSelectChatEmployee = async (emp: Employee) => {
    setActiveChatEmployee(emp);
    setChatMessages([]);
    setActiveChatId(null);
    try {
      const chat = await api.createChat(currentCompanyId || 0, emp.id);
      const chatId = Number(chat.chat_id || chat.id);
      if (!chatId) { console.error('No chatId returned', chat); return; }
      setActiveChatId(chatId);
      await loadChatMessages(chatId);
      if (currentUser?.id) {
        api.markMessagesRead(chatId, currentUser.id);
        setChats(prev => prev.map(c => (c.id === chatId || c.chat_id === chatId) ? { ...c, unread_count: 0 } : c));
        setUnreadMessagesCount(prev => {
          const chatUnread = chats.find(c => c.id === chatId || c.chat_id === chatId)?.unread_count || 0;
          return Math.max(0, prev - chatUnread);
        });
      }
      if (chatPollRef.current) clearInterval(chatPollRef.current);
      chatPollRef.current = setInterval(() => loadChatMessages(chatId), 5000);
    } catch (e) {
      console.error('Failed to open chat:', e);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !activeChatId || isSendingMessage) return;
    setIsSendingMessage(true);
    try {
      await api.sendMessage(activeChatId, currentUser?.id || 0, newMessage.trim());
      setNewMessage('');
      setSelectedFiles([]);
      await loadChatMessages(activeChatId);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleOpenChat = () => {
    setShowChatDialog(true);
    setUnreadMessagesCount(0);
  };

  useEffect(() => {
    if (showChatDialog && activeChatEmployee) {
      handleSelectChatEmployee(activeChatEmployee);
    }
  }, [showChatDialog, activeChatEmployee?.id]);

  useEffect(() => {
    if ((userRole === 'employer' || userRole === 'employee') && currentUser) {
      loadData();
      const pollInterval = setInterval(() => loadData(true), 30000);
      return () => clearInterval(pollInterval);
    }
  }, [userRole, currentUser]);

  useEffect(() => {
    if (userRole === 'employee' && !isLoading && !employeeTabsInitialized) {
      setNewNotificationsCount(notifications.filter(n => !n.read).length);
      setEmployeeTabsInitialized(true);
    }
  }, [userRole, isLoading, employeeTabsInitialized]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const vacancyStatus = userRole === 'employer' ? 'all' : 'active';
      const [vacanciesData, employeesData, recommendationsData, companyData, payoutsData, chatsData] = await Promise.all([
        api.getVacancies(currentCompanyId, vacancyStatus).catch(() => []),
        api.getEmployees(currentCompanyId).catch(() => []),
        userRole === 'employer'
          ? api.getRecommendations(currentCompanyId).catch(() => [])
          : api.getRecommendations(currentCompanyId, undefined, currentEmployeeId).catch(() => []),
        api.getCompany(currentCompanyId).catch(() => null),
        userRole === 'employer' 
          ? fetch(`https://functions.poehali.dev/f88ab2cf-1304-40dd-82e4-a7a1f7358901?company_id=${currentCompanyId}`)
              .then(res => res.json()).catch(() => [])
          : Promise.resolve([]),
        userRole === 'employer' && currentUser?.id
          ? api.getChats(currentUser.id, currentCompanyId).catch(() => [])
          : Promise.resolve([])
      ]);

      const mappedVacancies: Vacancy[] = vacanciesData.map((v: ApiVacancy) => ({
        id: v.id,
        title: v.title,
        department: v.department,
        salary: v.salary_display,
        status: v.status,
        recommendations: v.recommendations_count || 0,
        reward: v.reward_amount,
        payoutDelayDays: v.payout_delay_days || 30,
        description: v.description || '',
        requirements: v.requirements || '',
        referralLink: v.referral_token && userRole === 'employee' ? `${window.location.origin}/r/${v.referral_token}?ref=${currentEmployeeId}` : ''
      }));

      const mappedEmployees: Employee[] = employeesData.map((e: ApiEmployee) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        position: e.position,
        department: e.department,
        avatar: e.avatar_url || '',
        recommendations: e.total_recommendations,
        hired: e.successful_hires,
        earnings: Number(e.total_earned ?? e.total_earnings),
        level: e.level,
        experiencePoints: e.experience_points || 0,
        email: e.email,
        phone: e.phone,
        telegram: e.telegram,
        vk: e.vk,
        isAdmin: e.is_admin || false,
        isFired: e.is_fired || false
      }));

      const mappedRecommendations: Recommendation[] = recommendationsData.map((r: ApiRecommendation) => {
        return {
          id: r.id,
          candidateName: r.candidate_name,
          candidateEmail: r.candidate_email,
          candidatePhone: r.candidate_phone,
          vacancy: r.vacancy_title || '',
          vacancyTitle: r.vacancy_title || '',
          status: r.status as 'pending' | 'interview' | 'hired' | 'rejected' | 'accepted',
          date: new Date(r.created_at).toISOString().split('T')[0],
          acceptedDate: r.accepted_at ? new Date(r.accepted_at).toISOString().split('T')[0] : undefined,
          reward: r.reward_amount,
          recommendedBy: r.recommended_by_name,
          employeeId: r.recommended_by,
          comment: r.comment,
          resumeUrl: r.resume_url,
          payoutDelayDays: r.payout_delay_days ?? 30
        };
      });

      if (userRole === 'employee') {
        if (prevVacanciesCount > 0) {
          const vacDiff = mappedVacancies.length - prevVacanciesCount;
          if (vacDiff > 0) {
            setNewVacanciesCount(prev => prev + vacDiff);
            const newVacs = mappedVacancies.slice(mappedVacancies.length - vacDiff);
            setNotifications(prev => [
              ...newVacs.map((v, i) => ({
                id: Date.now() + i,
                type: 'vacancy',
                message: `Новая вакансия: "${v.title}" — ${v.salary}`,
                date: new Date().toISOString(),
                read: false
              })),
              ...prev
            ]);
          }
        }
        setPrevVacanciesCount(mappedVacancies.length);

        if (prevRecommendationsCount > 0) {
          const prevRecs = recommendations;
          mappedRecommendations.forEach((rec) => {
            const prevRec = prevRecs.find(r => r.id === rec.id);
            if (prevRec && prevRec.status !== rec.status) {
              const statusLabels: Record<string, string> = {
                pending: 'На рассмотрении',
                accepted: 'Принят',
                rejected: 'Отклонён',
                hired: 'Нанят',
                interview: 'На собеседовании'
              };
              setNotifications(prev => [{
                id: Date.now() + rec.id,
                type: 'recommendation',
                message: `Статус кандидата "${rec.candidateName}" изменён: ${statusLabels[rec.status] || rec.status}`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            }
          });
        }
      }
      setVacancies(mappedVacancies);

      if (prevEmployeesCount > 0) {
        const empDiff = mappedEmployees.length - prevEmployeesCount;
        if (empDiff > 0) setNewEmployeesCount(prev => prev + empDiff);
      }
      setPrevEmployeesCount(mappedEmployees.length);
      setEmployees(mappedEmployees);

      if (prevRecommendationsCount > 0) {
        const recDiff = mappedRecommendations.length - prevRecommendationsCount;
        if (recDiff > 0) setNewRecommendationsCount(prev => prev + recDiff);
      }
      setPrevRecommendationsCount(mappedRecommendations.length);
      setRecommendations(mappedRecommendations);
      setCompany(companyData);
      if (companyData?.subscription_expires_at) {
        const expires = new Date(companyData.subscription_expires_at);
        const now = new Date();
        const days = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setSubscriptionDaysLeft(days);
      }
      
      if (userRole === 'employer' && Array.isArray(payoutsData)) {
        const mappedPayouts: PayoutRequest[] = payoutsData.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          userName: p.user_name,
          userEmail: p.user_email,
          amount: parseFloat(p.amount),
          status: p.status,
          paymentMethod: p.payment_method,
          paymentDetails: p.payment_details,
          adminComment: p.admin_comment,
          createdAt: p.created_at,
          reviewedAt: p.reviewed_at,
          reviewedBy: p.reviewed_by
        }));

        if (prevPayoutsCount > 0) {
          const payDiff = mappedPayouts.length - prevPayoutsCount;
          if (payDiff > 0) {
            setNewPayoutsCount(prev => prev + payDiff);
            const newPays = mappedPayouts.filter(p => !payoutRequests.find(ex => ex.id === p.id));
            newPays.forEach((pay, i) => {
              setNotifications(prev => [{
                id: Date.now() + 60 + i,
                type: 'payout',
                message: `Новый запрос на выплату от ${pay.userName}: ${pay.amount.toLocaleString()} ₽`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            });
          }
        }
        setPrevPayoutsCount(mappedPayouts.length);
        setPayoutRequests(mappedPayouts);
      }

      if (Array.isArray(chatsData) && chatsData.length > 0) {
        setChats(chatsData);
        const totalUnread = chatsData.reduce((sum: number, c: Chat) => sum + (c.unread_count || 0), 0);
        if (userRole === 'employer' && totalUnread > unreadMessagesCount && prevRecommendationsCount > 0) {
          setNotifications(prev => [{
            id: Date.now() + 10,
            type: 'chat',
            message: `Новые сообщения в чате (${totalUnread} непрочитанных)`,
            date: new Date().toISOString(),
            read: false
          }, ...prev]);
        }
        setUnreadMessagesCount(totalUnread);
      }

      if (userRole === 'employer') {
        if (prevEmployeesCount > 0) {
          const newEmps = mappedEmployees.filter(e => !employees.find(ex => ex.id === e.id));
          newEmps.forEach((emp, i) => {
            setNotifications(prev => [{
              id: Date.now() + 20 + i,
              type: 'employee',
              message: `Зарегистрировался новый сотрудник: ${emp.name} (${emp.position})`,
              date: new Date().toISOString(),
              read: false
            }, ...prev]);
          });
        }

        if (prevRecommendationsCount > 0) {
          const newRecs = mappedRecommendations.filter(r => !recommendations.find(ex => ex.id === r.id));
          newRecs.forEach((rec, i) => {
            setNotifications(prev => [{
              id: Date.now() + 30 + i,
              type: 'recommendation',
              message: `Новая рекомендация: "${rec.candidateName}" на вакансию "${rec.vacancyTitle || rec.vacancy}"`,
              date: new Date().toISOString(),
              read: false
            }, ...prev]);
          });

          const statusLabels: Record<string, string> = {
            pending: 'На рассмотрении', accepted: 'Принят',
            rejected: 'Отклонён', hired: 'Нанят', interview: 'На собеседовании'
          };
          mappedRecommendations.forEach((rec, i) => {
            const prevRec = recommendations.find(r => r.id === rec.id);
            if (prevRec && prevRec.status !== rec.status) {
              setNotifications(prev => [{
                id: Date.now() + 40 + i,
                type: 'recommendation',
                message: `Статус кандидата "${rec.candidateName}" изменён на "${statusLabels[rec.status] || rec.status}"`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            }
          });
        }

        if (subscriptionDaysLeft <= 3 && subscriptionDaysLeft > 0) {
          setNotifications(prev => {
            const alreadyExists = prev.some(n => n.type === 'subscription' && n.message.includes('подписка'));
            if (alreadyExists) return prev;
            return [{
              id: Date.now() + 50,
              type: 'subscription',
              message: `⚠️ Через ${subscriptionDaysLeft} дн. истекает подписка на сервис. Продлите, чтобы не потерять доступ.`,
              date: new Date().toISOString(),
              read: false
            }, ...prev];
          });
        }
      }

      if (userRole === 'employee') {
        const wallet = await api.getWallet(currentEmployeeId).catch(() => null);
        if (wallet && walletData) {
          const prevBalance = walletData.wallet?.wallet_balance || 0;
          const newBalance = wallet.wallet?.wallet_balance || 0;
          if (newBalance > prevBalance) {
            setNotifications(prev => [{
              id: Date.now(),
              type: 'wallet',
              message: `Баланс пополнен: +${(newBalance - prevBalance).toLocaleString()} ₽`,
              date: new Date().toISOString(),
              read: false
            }, ...prev]);
          }
          const prevTxCount = walletData.transactions?.length || 0;
          const newTxCount = wallet.transactions?.length || 0;
          if (newTxCount > prevTxCount) {
            const newTx = wallet.transactions[0];
            if (newTx) {
              setNotifications(prev => [{
                id: Date.now() + 1,
                type: 'wallet',
                message: `Новая запись в истории кошелька: ${newTx.description || 'Транзакция'} (${newTx.amount > 0 ? '+' : ''}${newTx.amount.toLocaleString()} ₽)`,
                date: new Date().toISOString(),
                read: false
              }, ...prev]);
            }
          }
        }
        setWalletData(wallet);
      }

      if (userRole === 'employee') {
        const employeeChats = Array.isArray(chatsData) ? chatsData : [];
        const totalUnread = employeeChats.reduce((sum: number, c: Chat) => sum + (c.unread_count || 0), 0);
        if (totalUnread > unreadMessagesCount && unreadMessagesCount >= 0 && prevRecommendationsCount > 0) {
          setNotifications(prev => [{
            id: Date.now() + 2,
            type: 'chat',
            message: `Новые сообщения в чате с HR (${totalUnread} непрочитанных)`,
            date: new Date().toISOString(),
            read: false
          }, ...prev]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEmployeeRank = (emp: Employee) => {
    const sortedEmployees = [...employees].sort((a, b) => {
      if (b.hired !== a.hired) return b.hired - a.hired;
      if (b.recommendations !== a.recommendations) return b.recommendations - a.recommendations;
      return b.earnings - a.earnings;
    });
    return sortedEmployees.findIndex(e => e.id === emp.id) + 1;
  };

  const handleSaveCompany = async () => {
    try {
      setIsSavingCompany(true);
      let logoUrl: string | undefined;
      if (companyLogoFile) {
        logoUrl = await api.uploadResume(companyLogoFile);
      }
      await api.updateCompany(currentCompanyId, {
        description: companyEditForm.description,
        website: companyEditForm.website,
        industry: companyEditForm.industry,
        telegram: companyEditForm.telegram,
        vk: companyEditForm.vk,
        ...(logoUrl ? { logo_url: logoUrl } : {})
      });
      setCompanyLogoFile(null);
      setCompanyLogoPreview(null);
      await loadData();
      setShowCompanySettingsDialog(false);
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setIsSavingCompany(false);
    }
  };

  const handleCreateVacancy = async () => {
    if (!vacancyForm.title || !vacancyForm.department || !vacancyForm.salary) {
      alert('Заполните обязательные поля');
      return;
    }
    
    try {
      await api.createVacancy({
        company_id: currentCompanyId,
        title: vacancyForm.title,
        department: vacancyForm.department,
        salary_display: vacancyForm.salary,
        description: vacancyForm.description,
        requirements: vacancyForm.requirements,
        reward_amount: parseInt(vacancyForm.reward),
        payout_delay_days: parseInt(vacancyForm.payoutDelay),
        created_by: currentEmployeeId,
        city: vacancyForm.city,
        is_remote: vacancyForm.isRemote
      });
      await loadData();
      setVacancyForm({ title: '', department: '', salary: '', description: '', requirements: '', reward: '30000', payoutDelay: '30', city: '', isRemote: false });
      alert('Вакансия успешно создана!');
    } catch (error) {
      console.error('Ошибка создания вакансии:', error);
      alert('Не удалось создать вакансию');
    }
  };

  const handleCreateRecommendation = async (data: { vacancyId: number; name: string; email: string; phone: string; comment: string }) => {
    if (!data.name || !data.phone || !data.comment) {
      alert('Заполните обязательные поля: ФИО, Телефон и Сопроводительное письмо');
      return;
    }
    
    try {
      await api.createRecommendation({
        vacancy_id: data.vacancyId,
        recommended_by: currentEmployeeId,
        candidate_name: data.name,
        candidate_email: data.email,
        candidate_phone: data.phone,
        comment: data.comment
      });
      await loadData();
      setRecommendationForm({ name: '', email: '', phone: '', comment: '' });
      alert('Рекомендация успешно отправлена!');
    } catch (error) {
      console.error('Ошибка создания рекомендации:', error);
      alert('Не удалось отправить рекомендацию');
    }
  };

  const handleUpdateRecommendationStatus = async (id: number, status: string) => {
    try {
      await api.updateRecommendationStatus(id, status);
      await loadData();
      if (status === 'accepted') {
        alert('Кандидат принят!');
      } else if (status === 'rejected') {
        alert('Рекомендация отклонена.');
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус рекомендации');
    }
  };

  const handleDeleteEmployee = async (userId: number) => {
    if (!authToken) return;
    try {
      await api.deleteEmployee(authToken, userId);
      await loadData();
      setShowDeleteDialog(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Ошибка удаления сотрудника:', error);
      alert('Не удалось удалить сотрудника');
    }
  };

  const handleUpdateVacancy = async () => {
    if (!activeVacancy || !vacancyForm.title || !vacancyForm.department || !vacancyForm.salary) {
      alert('Заполните обязательные поля');
      return;
    }
    
    try {
      await api.updateVacancy(activeVacancy.id, {
        title: vacancyForm.title,
        department: vacancyForm.department,
        salary_display: vacancyForm.salary,
        description: vacancyForm.description,
        requirements: vacancyForm.requirements,
        reward_amount: parseInt(vacancyForm.reward),
        payout_delay_days: parseInt(vacancyForm.payoutDelay)
      });
      await loadData();
      setActiveVacancy(null);
      setVacancyForm({ title: '', department: '', salary: '', description: '', requirements: '', reward: '30000', payoutDelay: '30', city: '', isRemote: false });
      alert('Вакансия успешно обновлена!');
    } catch (error) {
      console.error('Ошибка обновления вакансии:', error);
      alert('Не удалось обновить вакансию');
    }
  };

  const handleArchiveVacancy = async (vacancyId: number) => {
    try {
      await api.updateVacancy(vacancyId, { status: 'archived' });
      await loadData();
      alert('Вакансия перенесена в архив');
    } catch (error) {
      console.error('Ошибка архивирования вакансии:', error);
      alert('Не удалось архивировать вакансию');
    }
  };

  const handleRestoreVacancy = async (vacancyId: number) => {
    try {
      await api.updateVacancy(vacancyId, { status: 'active' });
      await loadData();
      alert('Вакансия восстановлена в активные');
    } catch (error) {
      console.error('Ошибка восстановления вакансии:', error);
      alert('Не удалось восстановить вакансию');
    }
  };

  const handleDeleteVacancy = async (vacancyId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить вакансию? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await api.deleteVacancy(vacancyId);
      await loadData();
      alert('Вакансия удалена');
    } catch (error) {
      console.error('Ошибка удаления вакансии:', error);
      alert('Не удалось удалить вакансию');
    }
  };

  const handleGenerateReferralLink = () => {
    if (company?.invite_token) {
      const link = `${window.location.origin}/employee-register?token=${company.invite_token}`;
      setReferralLink(link);
      setShowEmployeeDetail(false);
      setShowReferralLinkDialog(true);
    } else {
      alert('Ошибка: токен компании не найден');
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Ссылка скопирована в буфер обмена');
  };

  const handleUpdateProfile = async () => {
    try {
      await api.updateEmployee(currentEmployeeId, {
        phone: profileForm.phone,
        telegram: profileForm.telegram,
        vk: profileForm.vk,
        avatar_url: profileForm.avatar
      });
      await loadData();
      setShowProfileEditDialog(false);
      alert('Профиль успешно обновлён!');
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      alert('Не удалось обновить профиль');
    }
  };

  const handleUpdateEmployeeData = async () => {
    if (!employeeToEdit) return;
    
    try {
      await api.updateEmployee(employeeToEdit.id, {
        first_name: employeeEditForm.firstName,
        last_name: employeeEditForm.lastName,
        position: employeeEditForm.position,
        department: employeeEditForm.department
      });
      await loadData();
      setShowEditEmployeeDialog(false);
      setEmployeeToEdit(null);
      alert('Данные сотрудника обновлены!');
    } catch (error) {
      console.error('Ошибка обновления данных сотрудника:', error);
      alert('Не удалось обновить данные сотрудника');
    }
  };

  const handleInviteEmployee = async () => {
    if (!inviteForm.firstName || !inviteForm.lastName || !inviteForm.email || !inviteForm.password || !inviteForm.position || !inviteForm.department) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (inviteForm.password.length < 8) {
      alert('Пароль должен быть минимум 8 символов');
      return;
    }

    if (!authToken || !currentUser?.company_id) {
      alert('Ошибка: не найдена информация о компании');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken
        },
        body: JSON.stringify({
          action: 'invite_employee',
          email: inviteForm.email,
          password: inviteForm.password,
          first_name: inviteForm.firstName,
          last_name: inviteForm.lastName,
          position: inviteForm.position,
          department: inviteForm.department,
          company_id: currentUser.company_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Сотрудник успешно добавлен!');
        setShowInviteDialog(false);
        setInviteForm({ firstName: '', lastName: '', email: '', password: '', position: '', department: '' });
        await loadData();
      } else {
        alert(data.error || 'Ошибка создания аккаунта сотрудника');
      }
    } catch (error) {
      console.error('Ошибка создания аккаунта сотрудника:', error);
      alert('Не удалось создать аккаунт сотрудника');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyInn = async (inn: string) => {
    if (!inn || inn.length < 10) {
      setInnVerificationState({
        isChecking: false,
        isVerified: false,
        error: 'ИНН должен содержать 10 или 12 цифр',
        companyData: null
      });
      return;
    }

    setInnVerificationState({
      isChecking: true,
      isVerified: false,
      error: null,
      companyData: null
    });

    try {
      const response = await fetch('https://functions.poehali.dev/822a1d32-f349-4962-9727-e0f529a73b8e', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inn })
      });

      const data = await response.json();

      if (response.ok) {
        setInnVerificationState({
          isChecking: false,
          isVerified: true,
          error: null,
          companyData: data
        });

        if (data.name?.short && !registerForm.companyName) {
          setRegisterForm({
            ...registerForm,
            companyName: data.name.short
          });
        }
      } else {
        setInnVerificationState({
          isChecking: false,
          isVerified: false,
          error: data.error || 'Не удалось проверить ИНН',
          companyData: null
        });
      }
    } catch (error) {
      console.error('Ошибка проверки ИНН:', error);
      setInnVerificationState({
        isChecking: false,
        isVerified: false,
        error: 'Ошибка соединения с сервисом проверки',
        companyData: null
      });
    }
  };

  const handleDemoFormSubmit = async () => {
    if (!demoForm.companyName || !demoForm.name || !demoForm.phone || !demoForm.email) {
      alert('Заполните все обязательные поля');
      return;
    }
    setDemoFormSubmitting(true);
    try {
      const response = await fetch('https://functions.poehali.dev/7316b3af-fb17-41b7-a4f3-9195c9f48288', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: demoForm.name,
          email: 'info@i-hunt.ru',
          message: `ЗАПРОС НА ДЕМОНСТРАЦИЮ\n\nКомпания: ${demoForm.companyName}\nИмя: ${demoForm.name}\nТелефон: ${demoForm.phone}\nПочта: ${demoForm.email}\nКоличество сотрудников: ${demoForm.employeeCount || 'не указано'}`
        })
      });
      if (response.ok) {
        setShowDemoDialog(false);
        setDemoForm({ companyName: '', name: '', phone: '', email: '', employeeCount: '' });
        alert('✅ Заявка на демонстрацию отправлена! Мы свяжемся с вами в ближайшее время.');
      } else {
        alert('❌ Ошибка при отправке. Попробуйте позже.');
      }
    } catch {
      alert('❌ Не удалось отправить заявку. Проверьте подключение к интернету.');
    } finally {
      setDemoFormSubmitting(false);
    }
  };

  const handleContactFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    setContactFormSubmitting(true);
    setContactFormSuccess(false);

    try {
      const response = await fetch('https://functions.poehali.dev/7316b3af-fb17-41b7-a4f3-9195c9f48288', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          message: `${contactForm.phone ? `Телефон: ${contactForm.phone}\n\n` : ''}${contactForm.message}`
        })
      });

      const data = await response.json();

      if (response.ok) {
        setContactFormSuccess(true);
        setContactForm({ name: '', email: '', phone: '', message: '' });
        alert('✅ Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.');
      } else {
        alert('❌ Ошибка при отправке: ' + (data.error || 'Попробуйте позже'));
      }
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      alert('❌ Не удалось отправить сообщение. Проверьте подключение к интернету.');
    } finally {
      setContactFormSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!registerForm.companyName || !registerForm.firstName || !registerForm.lastName || !registerForm.email || !registerForm.password || !registerForm.inn) {
      alert('Заполните все обязательные поля');
      return;
    }

    if (registerForm.password.length < 8) {
      alert('Пароль должен быть минимум 8 символов');
      return;
    }

    if (!innVerificationState.isVerified) {
      alert('Пожалуйста, проверьте ИНН компании перед регистрацией');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: registerForm.email,
          password: registerForm.password,
          first_name: registerForm.firstName,
          last_name: registerForm.lastName,
          company_name: registerForm.companyName,
          company_inn: registerForm.inn || undefined,
          employee_count: parseInt(registerForm.employeeCount)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowRegisterDialog(false);
        setRegisterForm({ companyName: '', firstName: '', lastName: '', email: '', password: '', inn: '', employeeCount: '50' });
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'registration');
        alert(`✅ Регистрация успешна!\n\nМы отправили письмо с подтверждением на ${registerForm.email}.\nПожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации аккаунта.`);
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      alert('Не удалось зарегистрироваться');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      alert('Введите email и пароль');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginForm.email,
          password: loginForm.password,
          userType: loginType
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        const role = (data.user.role === 'admin' || data.user.is_admin) ? 'employer' : 'employee';
        localStorage.setItem('userRole', role);
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setUserRole(role);
        setShowLoginDialog(false);
        setLoginForm({ email: '', password: '' });
        if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'login');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (response.status === 403) {
        setResendVerificationEmail(loginForm.email);
        alert('❌ Email не подтверждён!\n\nМы отправили письмо с подтверждением на вашу почту при регистрации.\nПожалуйста, проверьте почту (в том числе папку "Спам") и перейдите по ссылке в письме для активации аккаунта.');
      } else {
        alert(data.error || 'Неверный email или пароль');
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      alert('Не удалось войти в систему');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendVerificationEmail) {
      alert('Email не найден');
      return;
    }

    if (resendVerificationTimer > 0) {
      alert(`Подождите ${resendVerificationTimer} секунд перед повторной отправкой`);
      return;
    }

    setIsResendingVerification(true);
    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_verification',
          email: resendVerificationEmail
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResendVerificationTimer(30);
        alert('✅ Письмо с подтверждением отправлено повторно!\n\nПроверьте вашу почту (в том числе папку "Спам").');
      } else {
        alert(data.error || 'Не удалось отправить письмо');
      }
    } catch (error) {
      console.error('Ошибка отправки письма:', error);
      alert('Не удалось отправить письмо с подтверждением');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    if (!forgotPasswordEmail.trim()) {
      alert('Введите email');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/ec8d2e7d-ee4d-47cc-86ee-91464da954c3', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordResetMessage('Если email существует, на него отправлена ссылка для восстановления пароля');
      } else {
        setPasswordResetMessage(data.error || 'Произошла ошибка');
      }
    } catch (error) {
      console.error('Ошибка запроса восстановления:', error);
      setPasswordResetMessage('Не удалось отправить запрос');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      setPasswordResetMessage('Пароли не совпадают');
      return;
    }

    if (resetPasswordForm.password.length < 6) {
      setPasswordResetMessage('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsAuthLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/490186ec-0761-4387-8b05-813aea3e8f94', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetPasswordForm.token,
          password: resetPasswordForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordResetMessage('Пароль успешно изменен! Теперь вы можете войти с новым паролем.');
        setTimeout(() => {
          setShowResetPasswordDialog(false);
          setShowLoginDialog(true);
          setResetPasswordForm({ token: '', password: '', confirmPassword: '' });
          setPasswordResetMessage('');
        }, 2000);
      } else {
        setPasswordResetMessage(data.error || 'Произошла ошибка');
      }
    } catch (error) {
      console.error('Ошибка сброса пароля:', error);
      setPasswordResetMessage('Не удалось изменить пароль');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateNews = () => {
    if (!newsForm.title || !newsForm.content) {
      alert('Заполните все поля');
      return;
    }

    const newPost: NewsPost = {
      id: newsPosts.length + 1,
      title: newsForm.title,
      content: newsForm.content,
      author: company?.name || 'Администратор',
      date: new Date().toISOString().split('T')[0],
      category: newsForm.category,
      likes: 0,
      comments: []
    };

    setNewsPosts([newPost, ...newsPosts]);
    setNewsForm({ title: '', content: '', category: 'news' });
    setShowCreateNewsDialog(false);
    alert('Новость успешно опубликована!');
  };

  const handleUpdateNews = () => {
    if (!newsToEdit || !newsForm.title || !newsForm.content) {
      alert('Заполните все поля');
      return;
    }

    setNewsPosts(newsPosts.map(post => 
      post.id === newsToEdit.id 
        ? { ...post, title: newsForm.title, content: newsForm.content, category: newsForm.category }
        : post
    ));
    setNewsForm({ title: '', content: '', category: 'news' });
    setShowEditNewsDialog(false);
    setNewsToEdit(null);
    alert('Новость успешно обновлена!');
  };

  const handleDeleteNews = (id: number) => {
    setNewsPosts(newsPosts.filter(post => post.id !== id));
    alert('Новость удалена');
  };

  const handleLikeNews = (newsId: number) => {
    setNewsPosts(newsPosts.map(post => 
      post.id === newsId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleAddComment = () => {
    if (!activeNewsPost || !newComment.trim()) {
      alert('Напишите комментарий');
      return;
    }

    const comment: NewsComment = {
      id: Date.now(),
      newsId: activeNewsPost.id,
      authorName: 'Анна Смирнова',
      comment: newComment,
      date: new Date().toISOString().split('T')[0]
    };

    setNewsPosts(newsPosts.map(post => 
      post.id === activeNewsPost.id 
        ? { ...post, comments: [...post.comments, comment] }
        : post
    ));

    setNewComment('');
    setActiveNewsPost({ ...activeNewsPost, comments: [...activeNewsPost.comments, comment] });
  };

  const handleDeleteComment = (commentId: number) => {
    if (!activeNewsPost) return;

    setNewsPosts(newsPosts.map(post => 
      post.id === activeNewsPost.id 
        ? { ...post, comments: post.comments.filter(c => c.id !== commentId) }
        : post
    ));

    setActiveNewsPost({
      ...activeNewsPost,
      comments: activeNewsPost.comments.filter(c => c.id !== commentId)
    });
  };

  const handleUpdateEmployeeRoles = async () => {
    if (!employeeToEditRoles) return;
    
    try {
      await api.updateEmployeeRole(employeeToEditRoles.id, undefined, rolesForm.isAdmin);
      await loadData();
      setShowEditRolesDialog(false);
      setEmployeeToEditRoles(null);
      alert('Права сотрудника обновлены!');
    } catch (error) {
      console.error('Ошибка обновления прав сотрудника:', error);
      alert('Не удалось обновить права сотрудника');
    }
  };

  const handleToggleFired = async (employee: Employee) => {
    const action = employee.isFired ? 'восстановить' : 'уволить';
    if (!confirm(`Вы уверены, что хотите ${action} сотрудника ${employee.name}?`)) return;
    try {
      await api.updateEmployeeFired(employee.id, !employee.isFired);
      await loadData();
    } catch (error) {
      console.error('Ошибка изменения статуса сотрудника:', error);
      alert('Не удалось изменить статус сотрудника');
    }
  };

  const renderLandingPage = () => renderLandingPageComponent(
    setShowRegisterDialog,
    setShowLoginDialog,
    setShowAboutDialog,
    setShowPrivacyDialog,
    setShowTermsDialog,
    pricingPeriod,
    setPricingPeriod,
    showRegisterDialog,
    showLoginDialog,
    showAboutDialog,
    showPrivacyDialog,
    showTermsDialog,
    registerForm,
    setRegisterForm,
    loginForm,
    setLoginForm,
    handleRegister,
    handleLogin,
    isAuthLoading
  );

  const renderLandingPageComponent = (
    setShowRegisterDialog: (show: boolean) => void,
    setShowLoginDialog: (show: boolean) => void,
    setShowAboutDialog: (show: boolean) => void,
    setShowPrivacyDialog: (show: boolean) => void,
    setShowTermsDialog: (show: boolean) => void,
    pricingPeriod: 'monthly' | 'yearly',
    setPricingPeriod: (period: 'monthly' | 'yearly') => void,
    showRegisterDialog: boolean,
    showLoginDialog: boolean,
    showAboutDialog: boolean,
    showPrivacyDialog: boolean,
    showTermsDialog: boolean,
    registerForm: any,
    setRegisterForm: (form: any) => void,
    loginForm: any,
    setLoginForm: (form: any) => void,
    handleRegister: () => void,
    handleLogin: () => void,
    isAuthLoading: boolean
  ) => (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50" role="banner">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
              <Icon name="Rocket" className="text-white" size={20} aria-hidden="true" />
            </div>
            <span className="text-lg sm:text-xl md:text-2xl px-0 py-0 my-0 font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
          </div>
          <nav className="hidden md:flex items-center gap-4 lg:gap-8" role="navigation" aria-label="Основная навигация">
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Как работает</button>
            <button onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Преимущества</button>
            <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Тарифы</button>
            <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs lg:text-sm hover:text-primary transition-colors">Контакты</button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowLoginDialog(true)} aria-label="Войти в систему" size="sm" className="text-xs sm:text-sm">Вход</Button>
            <Button onClick={() => setShowRegisterDialog(true)} aria-label="Зарегистрировать компанию" size="sm" className="text-xs">
              <span className="hidden sm:inline">Зарегистрировать</span>
              <span className="sm:hidden">Регистрация</span>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-16 sm:pt-20 md:pt-24 lg:pt-32 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 lg:px-6" aria-labelledby="hero-title">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <Badge className="mb-4 sm:mb-6 animate-fade-in text-xs sm:text-sm">🚀 Реферальный рекрутинг</Badge>
                <h1 id="hero-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 md:mb-6 animate-slide-up bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
                  Нанимайте лучших кандидатов через своих сотрудников
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-4 sm:mb-6 md:mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  Платформа для реферального найма с геймификацией
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center lg:justify-start">
                  <Button size="default" className="animate-scale-in shadow-lg shadow-primary/25 text-sm sm:text-base" style={{ animationDelay: '0.2s' }} onClick={() => { setShowRegisterDialog(true); if (typeof window.ym === 'function') window.ym(106919720, 'reachGoal', 'click_cta_hero'); }} aria-label="Начать бесплатный пробный период на 14 дней">
                    <Icon name="Rocket" className="mr-2" size={18} aria-hidden="true" />
                    <span className="hidden sm:inline">Начать бесплатно — 14 дней</span>
                    <span className="sm:hidden">Начать бесплатно</span>
                  </Button>
                  <Button size="default" variant="outline" className="animate-scale-in text-sm sm:text-base" style={{ animationDelay: '0.3s' }} onClick={() => setShowLoginDialog(true)}>
                    <Icon name="LogIn" className="mr-2" size={18} />
                    Войти
                  </Button>
                </div>
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-6 justify-center lg:justify-start text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Прост в использовании</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Настройка за 5 минут</span>
                  </div>
                </div>
              </div>
              <div className="relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/e96124dc-c09c-454b-a967-49eff0e74945.jpg" 
                    alt="Команда сотрудников работает вместе"
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Icon name="TrendingUp" className="text-green-600" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">+127%</div>
                      <div className="text-xs text-muted-foreground">эффективность найма</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-primary/5 via-white to-purple-50 relative overflow-hidden" aria-labelledby="how-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-20">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">⚡ Простой процесс</Badge>
              <h2 id="how-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Как это работает
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Запустите реферальную программу за 4 простых шага и начните получать рекомендации
              </p>
            </div>
            
            <div className="relative max-w-5xl mx-auto">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 to-orange-500 transform -translate-y-1/2 opacity-20"></div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-4">
                {[
                  { emoji: '🏢', title: 'Регистрация', desc: 'Создайте аккаунт компании и разместите открытые вакансии', color: 'from-blue-500 to-blue-600' },
                  { emoji: '👥', title: 'Приглашение', desc: 'Добавьте своих сотрудников в систему одним кликом', color: 'from-green-500 to-green-600' },
                  { emoji: '🎯', title: 'Рекомендации', desc: 'Получайте качественные кандидатуры от вашей команды', color: 'from-purple-500 to-purple-600' },
                  { emoji: '💰', title: 'Вознаграждение', desc: 'Автоматически выплачивайте бонусы за найм', color: 'from-orange-500 to-orange-600' },
                ].map((step, i) => (
                  <div key={i} className="relative group">
                    <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden h-full">
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${step.color}`}></div>
                      
                      <div className="p-6 pt-8">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                            <span className="text-2xl">{step.emoji}</span>
                          </div>
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${step.color} text-white flex items-center justify-center font-bold text-lg shadow-md`}>
                            {i + 1}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                      
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${step.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                    </div>
                    
                    {i < 3 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-20 w-8 h-8 items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-primary/20">
                          <Icon name="ChevronRight" className="text-primary" size={18} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden" aria-labelledby="benefits-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-10 sm:mb-14 md:mb-20">
              <Badge className="mb-4 bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs sm:text-sm">✨ Почему iHUNT</Badge>
              <h2 id="benefits-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Преимущества платформы
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Все инструменты для эффективного реферального найма в одной системе
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-6xl mx-auto">
              {[
                { emoji: '💵', title: 'Экономия бюджета', desc: 'Снижение затрат на рекрутинг до 70%', gradient: 'from-green-500 to-emerald-500' },
                { emoji: '⚡', title: 'Быстрый найм', desc: 'Сокращение времени закрытия вакансий в 2 раза', gradient: 'from-yellow-500 to-orange-500' },
                { emoji: '🛡️', title: 'Качество кандидатов', desc: 'Рекомендации от проверенных сотрудников', gradient: 'from-blue-500 to-cyan-500' },
                { emoji: '🏆', title: 'Геймификация', desc: 'Вовлечение сотрудников через достижения', gradient: 'from-purple-500 to-pink-500' },
                { emoji: '📊', title: 'Прозрачность', desc: 'Полная статистика и аналитика процесса', gradient: 'from-indigo-500 to-purple-500' },
                { emoji: '🔗', title: 'Интеграция', desc: 'API для подключения к вашим системам', gradient: 'from-red-500 to-pink-500' },
              ].map((benefit, i) => (
                <div key={i} className="group">
                  <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden h-full">
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${benefit.gradient}`}></div>
                    
                    <div className="p-6 pt-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                          <span className="text-2xl">{benefit.emoji}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900">{benefit.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                    </div>
                    
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${benefit.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 sm:mt-12 md:mt-16">
              <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🎯 Результаты наших клиентов</h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <span className="text-2xl">📈</span>
                          </div>
                          <div>
                            <div className="font-bold text-xl">+127%</div>
                            <div className="text-sm text-muted-foreground">рост числа рекомендаций</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-2xl">⏱️</span>
                          </div>
                          <div>
                            <div className="font-bold text-xl">-40%</div>
                            <div className="text-sm text-muted-foreground">сокращение времени найма</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-2xl">💎</span>
                          </div>
                          <div>
                            <div className="font-bold text-xl">92%</div>
                            <div className="text-sm text-muted-foreground">прошли испытательный срок</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <img 
                        src="https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/files/ff1c4a57-63e0-4e5e-ab1b-8c592b9d9ac2.jpg" 
                        alt="Статистика и результаты"
                        className="rounded-xl shadow-xl"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden" aria-labelledby="pricing-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <Badge className="mb-4 bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs sm:text-sm">💎 Прозрачное ценообразование</Badge>
              <h2 id="pricing-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">Тарифы</h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">14 дней бесплатно для всех новых клиентов</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 md:mb-12">
              <Button 
                variant={pricingPeriod === 'monthly' ? 'default' : 'outline'} 
                onClick={() => setPricingPeriod('monthly')}
                className="min-w-[120px]"
              >
                Месяц
              </Button>
              <Button 
                variant={pricingPeriod === 'yearly' ? 'default' : 'outline'} 
                onClick={() => setPricingPeriod('yearly')}
                className="min-w-[120px]"
              >
                Год
                <Badge className="ml-2 bg-green-500 text-white">-15%</Badge>
              </Button>
            </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 max-w-3xl mx-auto">
            <div className="group">
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200 overflow-hidden h-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gray-400 to-gray-500"></div>
                
                <div className="p-8">
                  <div className="mb-5 sm:mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Пробный период</h3>
                    <p className="text-sm text-muted-foreground">Протестируйте платформу</p>
                  </div>
                  
                  <div className="mb-5 sm:mb-6">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">0 ₽</div>
                    <p className="text-sm text-muted-foreground">14 дней бесплатно</p>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Все функции платформы</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Поддержка 24/7</span>
                    </li>
                  </ul>
                  
                  <Button className="w-full" variant="outline" onClick={() => setShowRegisterDialog(true)}>Попробовать самостоятельно</Button>
                  <Button className="w-full mt-2" variant="secondary" onClick={() => setShowDemoDialog(true)}>Запросить демонстрацию</Button>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-200 overflow-hidden h-full">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-red-500"></div>
                
                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">Продвинутый</h3>
                    <p className="text-sm text-muted-foreground">Корпоративный тариф</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="text-3xl sm:text-4xl font-bold mb-2">
                      {pricingPeriod === 'monthly' ? '54 900 ₽' : '46 665 ₽'}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">в месяц</p>
                    {pricingPeriod === 'yearly' && (
                      <p className="text-sm text-green-600 font-medium">559 980 ₽/год (экономия 99 000 ₽)</p>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Любое кол-во сотрудников</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">API-интеграции с ATS</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Аналитика</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Геймификация</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Нет ограничений на размещение вакансий</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Выделенный менеджер</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Работа с рекомендациями и откликами</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                        <Icon name="Check" className="text-green-600" size={14} />
                      </div>
                      <span className="text-sm">Внутренний чат с сотрудниками</span>
                    </li>
                  </ul>
                  
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500" onClick={() => setShowDemoDialog(true)}>Подключить</Button>
                </div>
              </div>
            </div>

          </div>
        </div>
        </section>

        <section id="contact" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden" aria-labelledby="contact-title">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto max-w-3xl relative z-10">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20 text-xs sm:text-sm">💬 Контакты</Badge>
              <h2 id="contact-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Остались вопросы?
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground px-4">
                Свяжитесь с нами, и мы с радостью ответим на все ваши вопросы
              </p>
            </div>
            
            <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-blue-500"></div>
              
              <div className="p-5 sm:p-6 md:p-8 lg:p-10">
                <form className="space-y-4 sm:space-y-5 md:space-y-6" aria-label="Форма обратной связи" onSubmit={handleContactFormSubmit}>
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base font-medium">Имя</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Иван Иванов" 
                      autoComplete="name" 
                      required 
                      className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="ivan@company.ru" 
                      autoComplete="email" 
                      required 
                      className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-phone" className="text-sm sm:text-base font-medium">Телефон</Label>
                    <Input 
                      id="contact-phone" 
                      name="phone" 
                      type="tel" 
                      placeholder="+7 (999) 123-45-67" 
                      autoComplete="tel" 
                      className="mt-1.5 sm:mt-2 h-10 sm:h-11 md:h-12"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm sm:text-base font-medium">Сообщение</Label>
                    <Textarea 
                      id="message" 
                      name="message" 
                      placeholder="Расскажите о вашем проекте..." 
                      rows={4} 
                      required 
                      className="mt-1.5 sm:mt-2 text-sm sm:text-base"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      disabled={contactFormSubmitting}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    disabled={contactFormSubmitting}
                  >
                    {contactFormSubmitting ? (
                      <>
                        <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Icon name="Send" className="mr-2" size={18} />
                        Отправить сообщение
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-gray-50 py-8 sm:py-10 md:py-12 px-3 sm:px-4 lg:px-6" role="contentinfo">
        <div className="container mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Rocket" className="text-primary" size={24} />
                <span className="text-base sm:text-lg font-bold">iHUNT</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Платформа реферального рекрутинга с геймификацией
              </p>
            </div>
            <nav aria-label="Продукт">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Продукт</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#benefits" className="hover:text-primary">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-primary">Тарифы</a></li>
                <li><a href="#contact" className="hover:text-primary">API документация</a></li>
              </ul>
            </nav>
            <nav aria-label="Компания">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Компания</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><button onClick={() => setShowAboutDialog(true)} className="hover:text-primary">О нас</button></li>
                <li><a href="#contact" className="hover:text-primary">Блог</a></li>
                <li><a href="#contact" className="hover:text-primary">Контакты</a></li>
              </ul>
            </nav>
            <nav aria-label="Правовая информация">
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Правовая информация</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><button onClick={() => setShowPrivacyDialog(true)} className="hover:text-primary">Политика конфиденциальности</button></li>
                <li><button onClick={() => setShowTermsDialog(true)} className="hover:text-primary">Пользовательское соглашение</button></li>
                <li><button onClick={() => setShowPersonalDataDialog(true)} className="hover:text-primary">Обработка персональных данных</button></li>
              </ul>
            </nav>
          </div>
          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-muted-foreground">© 2026 iHUNT. Все права защищены.</div>
        </div>
      </footer>

      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90dvh] overflow-y-auto md:overflow-visible md:max-h-none p-4 sm:p-6">
          <DialogHeader className="pb-1">
            <DialogTitle className="text-base sm:text-lg">Регистрация компании</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Начните 14-дневный пробный период или{' '}
              <button
                className="text-primary hover:underline font-medium"
                onClick={() => { setShowRegisterDialog(false); setShowDemoDialog(true); }}
              >
                запросите демо
              </button>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="company-name" className="text-xs">Название компании <span className="text-destructive">*</span></Label>
                <Input 
                  id="company-name" 
                  className="mt-1 h-8 text-sm"
                  placeholder="Acme Corp" 
                  value={registerForm.companyName}
                  onChange={(e) => setRegisterForm({...registerForm, companyName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-first-name" className="text-xs">Имя <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-first-name" 
                  className="mt-1 h-8 text-sm"
                  placeholder="Иван" 
                  value={registerForm.firstName}
                  onChange={(e) => setRegisterForm({...registerForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-last-name" className="text-xs">Фамилия <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-last-name" 
                  className="mt-1 h-8 text-sm"
                  placeholder="Иванов" 
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm({...registerForm, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-email" className="text-xs">Email <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-email" 
                  className="mt-1 h-8 text-sm"
                  type="email" 
                  placeholder="ivan@company.ru" 
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="admin-password" className="text-xs">Пароль <span className="text-destructive">*</span></Label>
                <Input 
                  id="admin-password" 
                  className="mt-1 h-8 text-sm"
                  type="password" 
                  placeholder="Минимум 8 символов" 
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="company-inn" className="text-xs">ИНН компании <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input 
                    id="company-inn" 
                    placeholder="1234567890" 
                    maxLength={12} 
                    value={registerForm.inn}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setRegisterForm({...registerForm, inn: value});
                      if (innVerificationState.isVerified || innVerificationState.error) {
                        setInnVerificationState({
                          isChecking: false,
                          isVerified: false,
                          error: null,
                          companyData: null
                        });
                      }
                    }}
                    className={`h-8 text-sm ${innVerificationState.isVerified ? 'border-green-500' : innVerificationState.error ? 'border-red-500' : ''}`}
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    className="h-8 text-xs shrink-0 px-3"
                    onClick={() => handleVerifyInn(registerForm.inn)}
                    disabled={innVerificationState.isChecking || !registerForm.inn || registerForm.inn.length < 10}
                  >
                    {innVerificationState.isChecking ? (
                      <Icon name="Loader2" className="w-4 h-4 animate-spin" />
                    ) : innVerificationState.isVerified ? (
                      <><Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mr-1" />OK</>
                    ) : (
                      'Проверить'
                    )}
                  </Button>
                </div>
                {innVerificationState.error && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <Icon name="AlertCircle" className="w-3 h-3 shrink-0" />
                    {innVerificationState.error}
                  </p>
                )}
                {innVerificationState.isVerified && innVerificationState.companyData && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-medium text-green-900 flex items-center gap-1">
                      <Icon name="CheckCircle2" className="w-3 h-3 shrink-0" />
                      {innVerificationState.companyData.name?.short || innVerificationState.companyData.name?.full}
                      {' · '}{innVerificationState.companyData.status?.text || ''}
                    </p>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <Label htmlFor="employee-count" className="text-xs">Количество сотрудников <span className="text-destructive">*</span></Label>
                <Input 
                  id="employee-count" 
                  className="mt-1 h-8 text-sm"
                  type="number" 
                  placeholder="50" 
                  value={registerForm.employeeCount}
                  onChange={(e) => setRegisterForm({...registerForm, employeeCount: e.target.value})}
                />
              </div>
            </div>
            <Button className="w-full h-9 text-sm" onClick={handleRegister} disabled={isAuthLoading}>
              {isAuthLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Нажимая кнопку, вы соглашаетесь с{' '}
              <button onClick={() => setShowTermsDialog(true)} className="text-primary hover:underline">условиями использования</button>
              {' '}и{' '}
              <button onClick={() => setShowPrivacyDialog(true)} className="text-primary hover:underline">политикой конфиденциальности</button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Вход в систему</DialogTitle>
            <DialogDescription>Выберите тип аккаунта и войдите</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Тип аккаунта</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  type="button"
                  variant={loginType === 'employer' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setLoginType('employer')}
                >
                  <Icon name="Building2" className="mr-2" size={18} />
                  Компания
                </Button>
                <Button
                  type="button"
                  variant={loginType === 'employee' ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setLoginType('employee')}
                >
                  <Icon name="User" className="mr-2" size={18} />
                  Сотрудник
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input 
                id="login-email" 
                type="email" 
                placeholder="ivan@company.ru" 
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="login-password">Пароль</Label>
              <Input 
                id="login-password" 
                type="password" 
                placeholder="Ваш пароль" 
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Запомнить меня
              </label>
              <button 
                onClick={() => {
                  setShowLoginDialog(false);
                  setShowForgotPasswordDialog(true);
                }}
                className="text-sm text-primary hover:underline"
              >
                Забыли пароль?
              </button>
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={isAuthLoading}>
              {isAuthLoading ? 'Вход...' : 'Войти'}
            </Button>
            
            {resendVerificationEmail && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                <p className="text-sm font-medium text-yellow-900 flex items-center gap-1">
                  <Icon name="AlertCircle" className="w-4 h-4" />
                  Email не подтверждён
                </p>
                <p className="text-xs text-yellow-700">
                  Проверьте почту {resendVerificationEmail} и перейдите по ссылке в письме
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification || resendVerificationTimer > 0}
                >
                  {isResendingVerification ? (
                    <>
                      <Icon name="Loader2" className="w-3 h-3 mr-1 animate-spin" />
                      Отправка...
                    </>
                  ) : resendVerificationTimer > 0 ? (
                    <>
                      <Icon name="Clock" className="w-3 h-3 mr-1" />
                      Повторить через {resendVerificationTimer}с
                    </>
                  ) : (
                    <>
                      <Icon name="Mail" className="w-3 h-3 mr-1" />
                      Отправить письмо повторно
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {loginType === 'employer' && (
              <div className="text-center text-sm text-muted-foreground">
                Нет аккаунта?{' '}
                <button 
                  onClick={() => {
                    setShowLoginDialog(false);
                    setShowRegisterDialog(true);
                  }}
                  className="text-primary hover:underline"
                >
                  Зарегистрируйтесь
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDemoDialog} onOpenChange={setShowDemoDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Запросить доступ</DialogTitle>
            <DialogDescription>Заполните форму и мы свяжемся с вами в ближайшее время</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label htmlFor="demo-company" className="text-sm">Наименование компании <span className="text-destructive">*</span></Label>
              <Input
                id="demo-company"
                className="mt-1"
                placeholder="Acme Corp"
                value={demoForm.companyName}
                onChange={(e) => setDemoForm({ ...demoForm, companyName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-name" className="text-sm">Имя <span className="text-destructive">*</span></Label>
              <Input
                id="demo-name"
                className="mt-1"
                placeholder="Иван Иванов"
                value={demoForm.name}
                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-phone" className="text-sm">Номер телефона <span className="text-destructive">*</span></Label>
              <Input
                id="demo-phone"
                className="mt-1"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={demoForm.phone}
                onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-email" className="text-sm">Почта <span className="text-destructive">*</span></Label>
              <Input
                id="demo-email"
                className="mt-1"
                type="email"
                placeholder="ivan@company.ru"
                value={demoForm.email}
                onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="demo-count" className="text-sm">Количество сотрудников</Label>
              <Input
                id="demo-count"
                className="mt-1"
                placeholder="100"
                value={demoForm.employeeCount}
                onChange={(e) => setDemoForm({ ...demoForm, employeeCount: e.target.value })}
              />
            </div>
            <Button className="w-full mt-2" onClick={handleDemoFormSubmit} disabled={demoFormSubmitting}>
              {demoFormSubmitting ? (
                <><Icon name="Loader2" className="mr-2 animate-spin" size={16} />Отправка...</>
              ) : (
                <><Icon name="Send" className="mr-2" size={16} />Отправить заявку</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">О iHUNT</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Наша миссия</h3>
              <p className="text-muted-foreground">
                iHUNT создан для того, чтобы сделать процесс найма персонала максимально эффективным и прозрачным. 
                Мы верим, что лучшие кандидаты приходят по рекомендациям доверенных сотрудников, и наша платформа 
                помогает компаниям использовать этот потенциал на 100%.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Почему мы?</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Target" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Фокус на результат</h4>
                    <p className="text-sm text-muted-foreground">
                      Наши клиенты сокращают время найма в 2 раза и экономят до 70% бюджета на рекрутинг.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Users" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Вовлечение сотрудников</h4>
                    <p className="text-sm text-muted-foreground">
                      Геймификация и прозрачная система вознаграждений мотивируют команду активно участвовать в найме.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Zap" className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Простота внедрения</h4>
                    <p className="text-sm text-muted-foreground">
                      Настройка занимает 5 минут. Интуитивный интерфейс не требует обучения.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Наши достижения</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">500+</div>
                  <div className="text-sm text-muted-foreground">Компаний используют</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">15,000+</div>
                  <div className="text-sm text-muted-foreground">Успешных найма</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-1">4.8/5</div>
                  <div className="text-sm text-muted-foreground">Средняя оценка</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Свяжитесь с нами</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Icon name="Mail" size={16} className="text-muted-foreground" />
                  <a href="mailto:info@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
                </p>

              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Политика конфиденциальности</DialogTitle>
            <DialogDescription>Последнее обновление: 14 ноября 2025 г.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-sm">
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Общие положения</h3>
              <p className="text-muted-foreground">
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных 
                пользователей платформы iHUNT (далее — «Платформа»). Используя Платформу, вы соглашаетесь с условиями 
                настоящей Политики.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. Какие данные мы собираем</h3>
              <p className="text-muted-foreground mb-2">Мы можем собирать следующие категории персональных данных:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Контактные данные: имя, фамилия, электронная почта, номер телефона</li>
                <li>Данные компании: название, ИНН, количество сотрудников, отрасль</li>
                <li>Данные о вакансиях и рекомендациях кандидатов</li>
                <li>Техническая информация: IP-адрес, тип браузера, операционная система</li>
                <li>Данные об использовании Платформы: активность, статистика взаимодействий</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Цели обработки данных</h3>
              <p className="text-muted-foreground mb-2">Мы обрабатываем ваши персональные данные для:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Предоставления услуг Платформы и их улучшения</li>
                <li>Выполнения договорных обязательств</li>
                <li>Технической поддержки пользователей</li>
                <li>Отправки уведомлений о важных событиях</li>
                <li>Аналитики и улучшения функционала</li>
                <li>Соблюдения законодательных требований</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Защита данных</h3>
              <p className="text-muted-foreground">
                Мы применяем современные технические и организационные меры для защиты ваших данных от несанкционированного 
                доступа, изменения, раскрытия или уничтожения. Данные хранятся на защищенных серверах с использованием 
                шифрования и других методов защиты.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Передача данных третьим лицам</h3>
              <p className="text-muted-foreground">
                Мы не продаем и не передаем ваши персональные данные третьим лицам, за исключением случаев:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Когда это необходимо для предоставления услуг (например, платежные системы)</li>
                <li>По требованию законодательства или государственных органов</li>
                <li>С вашего явного согласия</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. Ваши права</h3>
              <p className="text-muted-foreground mb-2">Вы имеете право:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Запрашивать доступ к своим персональным данным</li>
                <li>Требовать исправления неточных данных</li>
                <li>Запрашивать удаление своих данных</li>
                <li>Отозвать согласие на обработку данных</li>
                <li>Ограничить обработку данных</li>
                <li>Получить копию своих данных</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">7. Cookies</h3>
              <p className="text-muted-foreground">
                Мы используем cookies для улучшения работы Платформы, анализа трафика и персонализации контента. 
                Вы можете настроить параметры cookies в своем браузере.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">8. Изменения в Политике</h3>
              <p className="text-muted-foreground">
                Мы можем периодически обновлять настоящую Политику. О существенных изменениях мы уведомим вас 
                по электронной почте или через Платформу.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">9. Контакты</h3>
              <p className="text-muted-foreground">
                По вопросам обработки персональных данных обращайтесь:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Пользовательское соглашение</DialogTitle>
            <DialogDescription>Последнее обновление: 14 ноября 2025 г.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4 text-sm">
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Общие условия</h3>
              <p className="text-muted-foreground">
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения между iHUNT 
                (далее — «Сервис») и пользователями платформы. Регистрируясь на Платформе, вы подтверждаете, что 
                прочитали, поняли и согласны соблюдать условия настоящего Соглашения.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. Предмет Соглашения</h3>
              <p className="text-muted-foreground">
                iHUNT предоставляет онлайн-платформу для организации реферального рекрутинга, включающую:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Управление вакансиями и кандидатами</li>
                <li>Систему вознаграждений за рекомендации</li>
                <li>Инструменты коммуникации и аналитики</li>
                <li>Интеграцию с внешними сервисами</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Регистрация и учетная запись</h3>
              <p className="text-muted-foreground mb-2">При регистрации вы обязуетесь:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Предоставить достоверные и актуальные данные</li>
                <li>Обеспечить конфиденциальность учетных данных</li>
                <li>Немедленно уведомлять о несанкционированном доступе к аккаунту</li>
                <li>Нести ответственность за все действия, совершенные через вашу учетную запись</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Тарифы и оплата</h3>
              <p className="text-muted-foreground">
                Сервис предоставляет 14-дневный бесплатный пробный период. После окончания пробного периода использование 
                Платформы осуществляется на платной основе согласно выбранному тарифному плану.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Оплата производится ежемесячно или ежегодно</li>
                <li>Цены указаны на сайте и могут быть изменены с уведомлением за 30 дней</li>
                <li>Возврат средств возможен в течение 14 дней с момента оплаты</li>
                <li>При просрочке оплаты доступ к Платформе может быть ограничен</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Права и обязанности пользователя</h3>
              <p className="text-muted-foreground mb-2">Пользователь обязуется:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Использовать Платформу в законных целях</li>
                <li>Не нарушать права третьих лиц</li>
                <li>Не распространять вредоносное ПО</li>
                <li>Не создавать несколько аккаунтов для одной компании без согласования</li>
                <li>Соблюдать правила работы с персональными данными кандидатов</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. Права и обязанности Сервиса</h3>
              <p className="text-muted-foreground mb-2">iHUNT имеет право:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Изменять функционал Платформы</li>
                <li>Проводить технические работы с уведомлением пользователей</li>
                <li>Ограничить доступ при нарушении условий Соглашения</li>
                <li>Удалить аккаунт при систематических нарушениях</li>
              </ul>
              <p className="text-muted-foreground mt-2 mb-2">iHUNT обязуется:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Обеспечивать доступность Платформы не менее 99% времени</li>
                <li>Защищать персональные данные пользователей</li>
                <li>Предоставлять техническую поддержку</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">7. Интеллектуальная собственность</h3>
              <p className="text-muted-foreground">
                Все права на Платформу, включая код, дизайн, логотипы и контент, принадлежат iHUNT. 
                Использование материалов Платформы без письменного разрешения запрещено.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">8. Ограничение ответственности</h3>
              <p className="text-muted-foreground">
                iHUNT не несет ответственности за:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Качество и достоверность информации о кандидатах</li>
                <li>Результаты найма персонала</li>
                <li>Действия пользователей на Платформе</li>
                <li>Технические сбои, вызванные внешними факторами</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">9. Расторжение Соглашения</h3>
              <p className="text-muted-foreground">
                Вы можете прекратить использование Платформы в любое время, удалив свою учетную запись. 
                iHUNT может расторгнуть Соглашение при нарушении его условий.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">10. Изменения Соглашения</h3>
              <p className="text-muted-foreground">
                iHUNT оставляет за собой право изменять условия настоящего Соглашения. О существенных изменениях 
                пользователи будут уведомлены за 30 дней.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">11. Применимое право</h3>
              <p className="text-muted-foreground">
                Настоящее Соглашение регулируется законодательством Российской Федерации. Все споры разрешаются 
                путем переговоров, а при невозможности достижения согласия — в судебном порядке.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">12. Контакты</h3>
              <p className="text-muted-foreground">
                По вопросам Соглашения обращайтесь:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: <a href="mailto:legal@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPersonalDataDialog} onOpenChange={setShowPersonalDataDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Положение об обработке персональных данных</DialogTitle>
            <DialogDescription>
              Информация о порядке обработки и защиты персональных данных в соответствии с законодательством РФ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Общие положения</h3>
              <p className="text-muted-foreground">
                Настоящее Положение об обработке персональных данных (далее — Положение) разработано 
                в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных» 
                (далее — Закон о персональных данных) и определяет порядок обработки персональных данных 
                и меры по обеспечению безопасности персональных данных в платформе iHUNT.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. Основные понятия</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Персональные данные</strong> — любая информация, относящаяся к прямо или косвенно определенному 
                или определяемому физическому лицу (субъекту персональных данных)</li>
                <li><strong>Оператор персональных данных</strong> — iHUNT, организующий и осуществляющий 
                обработку персональных данных</li>
                <li><strong>Обработка персональных данных</strong> — любое действие или совокупность действий, 
                совершаемых с использованием средств автоматизации или без их использования</li>
                <li><strong>Конфиденциальность персональных данных</strong> — обязательное для соблюдения 
                Оператором требование не допускать их распространения без согласия субъекта</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Правовые основания обработки</h3>
              <p className="text-muted-foreground mb-2">Обработка персональных данных осуществляется на основании:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»</li>
                <li>Федерального закона от 27.07.2006 № 149-ФЗ «Об информации, информационных технологиях и о защите информации»</li>
                <li>Трудового кодекса Российской Федерации</li>
                <li>Гражданского кодекса Российской Федерации</li>
                <li>Согласия субъекта персональных данных на обработку его персональных данных</li>
                <li>Договора, стороной которого является субъект персональных данных</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Категории субъектов персональных данных</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Сотрудники организации-работодателя</strong> — лица, использующие Платформу для 
                рекомендации кандидатов</li>
                <li><strong>Кандидаты</strong> — лица, чьи данные размещаются на Платформе в качестве 
                рекомендуемых кандидатов на вакантные должности</li>
                <li><strong>Представители работодателей</strong> — лица, представляющие интересы 
                организаций-работодателей на Платформе</li>
                <li><strong>Посетители сайта</strong> — лица, посещающие сайт Платформы</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Состав обрабатываемых персональных данных</h3>
              <p className="text-muted-foreground mb-2">В зависимости от категории субъекта обрабатываются следующие данные:</p>
              <div className="space-y-3 ml-4">
                <div>
                  <p className="font-medium text-foreground">Сотрудники:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>ФИО, должность, структурное подразделение</li>
                    <li>Адрес электронной почты, номер телефона</li>
                    <li>Логин и пароль (хешированный)</li>
                    <li>История активности на Платформе</li>
                    <li>Банковские реквизиты для выплаты вознаграждений</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">Кандидаты:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>ФИО, дата рождения</li>
                    <li>Адрес электронной почты, номер телефона</li>
                    <li>Образование, опыт работы, профессиональные навыки</li>
                    <li>Резюме и сопроводительные документы</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">Представители работодателей:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>ФИО, должность</li>
                    <li>Адрес электронной почты, номер телефона</li>
                    <li>Данные организации: наименование, ИНН, юридический адрес</li>
                    <li>Банковские реквизиты для оплаты подписки</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. Цели обработки персональных данных</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Предоставление доступа к функционалу Платформы</li>
                <li>Идентификация пользователя и авторизация на Платформе</li>
                <li>Обеспечение подбора персонала через механизм рекомендаций</li>
                <li>Выплата вознаграждений сотрудникам за успешные рекомендации</li>
                <li>Взаимодействие с пользователями (уведомления, техподдержка)</li>
                <li>Анализ использования Платформы и улучшение её функционала</li>
                <li>Выполнение обязательств по договорам</li>
                <li>Соблюдение требований законодательства РФ</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">7. Способы обработки персональных данных</h3>
              <p className="text-muted-foreground mb-2">Обработка персональных данных осуществляется с использованием:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Автоматизированных средств (информационные системы, базы данных)</li>
                <li>Смешанных способов обработки (автоматизированных и неавтоматизированных)</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Обработка включает: сбор, запись, систематизацию, накопление, хранение, уточнение, 
                извлечение, использование, передачу, обезличивание, блокирование, удаление, уничтожение.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">8. Меры защиты персональных данных</h3>
              <p className="text-muted-foreground mb-2">Для обеспечения безопасности персональных данных Оператор применяет:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Технические меры:</strong>
                  <ul className="list-circle list-inside ml-6 mt-1">
                    <li>Шифрование данных при передаче (SSL/TLS)</li>
                    <li>Хеширование паролей с использованием современных алгоритмов</li>
                    <li>Межсетевые экраны и системы обнаружения вторжений</li>
                    <li>Регулярное резервное копирование данных</li>
                    <li>Антивирусная защита и обновление программного обеспечения</li>
                  </ul>
                </li>
                <li><strong>Организационные меры:</strong>
                  <ul className="list-circle list-inside ml-6 mt-1">
                    <li>Назначение ответственного за организацию обработки персональных данных</li>
                    <li>Разграничение прав доступа к персональным данным</li>
                    <li>Обучение сотрудников правилам работы с персональными данными</li>
                    <li>Контроль за соблюдением требований законодательства</li>
                    <li>Заключение соглашений о конфиденциальности с сотрудниками</li>
                  </ul>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">9. Передача персональных данных третьим лицам</h3>
              <p className="text-muted-foreground">
                Передача персональных данных третьим лицам осуществляется только:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>С согласия субъекта персональных данных</li>
                <li>В случаях, предусмотренных законодательством РФ</li>
                <li>Для достижения целей обработки (например, передача данных кандидатов работодателям)</li>
                <li>Поставщикам IT-услуг и хостинг-провайдерам (при условии соблюдения ими требований по защите данных)</li>
                <li>Платёжным системам для обработки финансовых операций</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                При передаче данных третьим лицам Оператор обеспечивает соблюдение режима конфиденциальности 
                путём заключения соответствующих соглашений.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">10. Права субъектов персональных данных</h3>
              <p className="text-muted-foreground mb-2">Субъект персональных данных имеет право:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>На получение информации об обработке своих персональных данных</li>
                <li>На доступ к своим персональным данным</li>
                <li>На уточнение, исправление или дополнение своих персональных данных</li>
                <li>На отзыв согласия на обработку персональных данных</li>
                <li>На удаление персональных данных (право на забвение)</li>
                <li>На ограничение обработки персональных данных</li>
                <li>На обжалование действий Оператора в уполномоченном органе (Роскомнадзор) или в судебном порядке</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                Для реализации своих прав субъект может направить письменный запрос Оператору по адресу: 
                <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline ml-1">info@i-hunt.ru</a>
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">11. Сроки обработки и хранения персональных данных</h3>
              <p className="text-muted-foreground">
                Персональные данные обрабатываются в течение срока, необходимого для достижения целей обработки, 
                если иное не предусмотрено законодательством РФ:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>Данные сотрудников — в период использования Платформы и в течение 5 лет после завершения использования</li>
                <li>Данные кандидатов — до момента найма или отказа, но не более 1 года с момента размещения</li>
                <li>Финансовые документы — в течение сроков, установленных законодательством (не менее 5 лет)</li>
                <li>Технические данные (логи) — не более 6 месяцев</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                По истечении сроков хранения персональные данные подлежат уничтожению или обезличиванию.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">12. Трансграничная передача персональных данных</h3>
              <p className="text-muted-foreground">
                Оператор не осуществляет трансграничную передачу персональных данных. 
                Все данные хранятся и обрабатываются на серверах, расположенных на территории Российской Федерации, 
                в соответствии с требованиями Федерального закона № 152-ФЗ.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">13. Изменение Положения</h3>
              <p className="text-muted-foreground">
                Оператор имеет право вносить изменения в настоящее Положение. Актуальная версия Положения 
                размещается на сайте Платформы. При внесении существенных изменений пользователи уведомляются 
                не менее чем за 30 дней до вступления изменений в силу.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">14. Контактная информация</h3>
              <p className="text-muted-foreground">
                Оператор персональных данных: iHUNT
              </p>
              <p className="text-muted-foreground mt-2">
                По вопросам обработки персональных данных обращайтесь:
              </p>
              <ul className="list-none space-y-1 text-muted-foreground mt-2 ml-4">
                <li>Email: <a href="mailto:privacy@ihunt.ru" className="text-primary hover:underline">info@i-hunt.ru</a></li>
                <li>Адрес: Россия, г. Москва</li>
                <li></li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>Дата вступления в силу:</strong> 16 января 2026 г.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderEmployerDashboard = () => {
    const isSubscriptionExpired = company?.subscription_end_date 
      ? new Date(company.subscription_end_date) < new Date() 
      : false;
    
    return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {company?.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="h-8 max-w-[140px] object-contain" />
            ) : (
              <>
                <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
                  <Icon name="Rocket" className="text-white" size={20} />
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
              <Icon name="Bell" size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowSubscriptionDialog(true)} size="sm" className="hidden sm:flex">
              <Icon name="CreditCard" className="mr-2" size={18} />
              <span className="hidden lg:inline">Подписка</span>
              {subscriptionDaysLeft < 14 && (
                <Badge variant="destructive" className="ml-2 text-xs">{subscriptionDaysLeft} дн.</Badge>
              )}
            </Button>
            <Button variant="ghost" onClick={() => { setCompanyEditForm({ description: company?.description || '', website: company?.website || '', industry: company?.industry || '', telegram: company?.telegram || '', vk: company?.vk || '' }); setShowCompanySettingsDialog(true); }} size="icon" className="sm:hidden">
              <Icon name="Settings" size={18} />
            </Button>
            <Button variant="ghost" onClick={() => { setCompanyEditForm({ description: company?.description || '', website: company?.website || '', industry: company?.industry || '', telegram: company?.telegram || '', vk: company?.vk || '' }); setShowCompanySettingsDialog(true); }} size="sm" className="hidden sm:flex">
              <Icon name="Settings" className="mr-2" size={18} />
              <span className="hidden lg:inline">Настройки</span>
            </Button>
            <Button variant="ghost" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">Выход</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold mb-2 flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-4xl">📈</span>
            <span className="hidden sm:inline">Личный кабинет работодателя</span>
            <span className="sm:hidden text-base">Кабинет</span>
          </h1>
          <p className="text-xs sm:text-base text-muted-foreground">Управление вакансиями и сотрудниками</p>
        </div>

        {isSubscriptionExpired && (
          <Card className="mb-6 sm:mb-8 bg-destructive/10 border-destructive">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="AlertTriangle" className="text-destructive" size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base sm:text-lg mb-2 text-destructive">Подписка истекла</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Ваша подписка закончилась. Данные сохранены, но доступ к функционалу ограничен. 
                    Продлите подписку, чтобы продолжить управление вакансиями и рекомендациями.
                  </p>
                  <Button onClick={() => setShowSubscriptionDialog(true)}>
                    <Icon name="CreditCard" className="mr-2" size={18} />
                    Продлить подписку
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Загрузка данных...</p>
            </div>
          </div>
        ) : (
        <Tabs defaultValue="vacancies" className="space-y-6" onValueChange={(val) => { if (val === 'recommendations') setNewRecommendationsCount(0); if (val === 'employees') setNewEmployeesCount(0); if (val === 'payouts') setNewPayoutsCount(0); }}>
          <ScrollableTabs>
            <TabsList className="inline-flex w-max sm:grid sm:w-full sm:grid-cols-4 lg:grid-cols-8 gap-1">
              <TabsTrigger value="vacancies" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">💼 Вакансии</TabsTrigger>
              <TabsTrigger value="employees" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">👥 Сотрудники{newEmployeesCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-blue-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px]">+{newEmployeesCount}</span>}</TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">🎯 Рекомендации{newRecommendationsCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-green-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px]">+{newRecommendationsCount}</span>}</TabsTrigger>
              <TabsTrigger value="payouts" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">💰 Выплаты{newPayoutsCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full px-1.5 min-w-[18px] h-[18px]">+{newPayoutsCount}</span>}</TabsTrigger>
              <TabsTrigger value="news" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">📢 Новости</TabsTrigger>
              <TabsTrigger value="chats" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">💬 Чаты</TabsTrigger>
              <TabsTrigger value="stats" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">📊 Статистика</TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs whitespace-nowrap px-3 py-2 sm:hidden">💳 Подписка{subscriptionDaysLeft < 14 ? ` (${subscriptionDaysLeft})` : ''}</TabsTrigger>
              <TabsTrigger value="help" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">❓ Помощь</TabsTrigger>
            </TabsList>
          </ScrollableTabs>

          <TabsContent value="vacancies" className="space-y-4">
            {isSubscriptionExpired ? (
              <SubscriptionExpiredBlock onRenew={() => setShowSubscriptionDialog(true)} />
            ) : (
              <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <span>💼 Вакансии</span>
                <span className="hidden sm:inline"></span>
              </h2>
              <Dialog>
                  <DialogTrigger asChild>
                    <Button disabled={isSubscriptionExpired} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">Создать вакансию</Button>
                  </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">Новая вакансия</DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">Создайте новую вакансию для реферального найма</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="vacancy-title" className="text-xs sm:text-sm">Название должности</Label>
                        <Input 
                          id="vacancy-title" 
                          className="mt-1 text-sm"
                          placeholder="Senior Frontend Developer"
                          value={vacancyForm.title}
                          onChange={(e) => setVacancyForm({...vacancyForm, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="department" className="text-xs sm:text-sm">Отдел</Label>
                        <Input 
                          id="department" 
                          className="mt-1 text-sm"
                          placeholder="Разработка"
                          value={vacancyForm.department}
                          onChange={(e) => setVacancyForm({...vacancyForm, department: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="salary" className="text-xs sm:text-sm">Зарплата</Label>
                        <Input 
                          id="salary" 
                          className="mt-1 text-sm"
                          placeholder="250 000 ₽"
                          value={vacancyForm.salary}
                          onChange={(e) => setVacancyForm({...vacancyForm, salary: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-xs sm:text-sm">Город</Label>
                        <Input 
                          id="city" 
                          className="mt-1 text-sm"
                          placeholder="Москва"
                          value={vacancyForm.city}
                          onChange={(e) => setVacancyForm({...vacancyForm, city: e.target.value})}
                          disabled={vacancyForm.isRemote}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isRemote"
                        checked={vacancyForm.isRemote}
                        onCheckedChange={(checked) => setVacancyForm({...vacancyForm, isRemote: checked as boolean, city: checked ? 'Удалённо' : ''})}
                      />
                      <Label htmlFor="isRemote" className="cursor-pointer text-xs sm:text-sm">
                        Удалённая работа
                      </Label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label htmlFor="reward-amount" className="text-xs sm:text-sm">Вознаграждение</Label>
                        <Input 
                          id="reward-amount" 
                          type="number" 
                          className="mt-1 text-sm"
                          placeholder="30000" 
                          value={vacancyForm.reward}
                          onChange={(e) => setVacancyForm({...vacancyForm, reward: e.target.value})}
                        />
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Сумма за успешный найм</p>
                      </div>
                      <div>
                        <Label htmlFor="payout-delay" className="text-xs sm:text-sm">Срок выплаты</Label>
                        <Select 
                          value={vacancyForm.payoutDelay}
                          onValueChange={(value) => setVacancyForm({...vacancyForm, payoutDelay: value})}
                        >
                          <SelectTrigger id="payout-delay" className="mt-1 text-sm">
                            <SelectValue placeholder="Выберите срок" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Сразу после найма</SelectItem>
                            <SelectItem value="7">Через 7 дней</SelectItem>
                            <SelectItem value="14">Через 14 дней</SelectItem>
                            <SelectItem value="30">Через 30 дней</SelectItem>
                            <SelectItem value="45">Через 45 дней</SelectItem>
                            <SelectItem value="60">Через 60 дней</SelectItem>
                            <SelectItem value="90">Через 90 дней (исп. срок)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Когда выплата после найма</p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-xs sm:text-sm">Описание вакансии</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Расскажите о вакансии, задачах и условиях работы..." 
                        rows={3}
                        className="mt-1 text-sm"
                        value={vacancyForm.description}
                        onChange={(e) => setVacancyForm({...vacancyForm, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="requirements" className="text-xs sm:text-sm">Требования</Label>
                      <Textarea 
                        id="requirements" 
                        placeholder="Опыт работы от 5 лет, знание React..." 
                        rows={3}
                        className="mt-1 text-sm"
                        value={vacancyForm.requirements}
                        onChange={(e) => setVacancyForm({...vacancyForm, requirements: e.target.value})}
                      />
                    </div>
                    <Button className="w-full text-sm" onClick={handleCreateVacancy}>Создать вакансию</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
              <div className="flex-1">
                <Input 
                  placeholder="Поиск..."
                  value={vacancyFilter.search}
                  onChange={(e) => setVacancyFilter({...vacancyFilter, search: e.target.value})}
                  className="text-sm"
                />
              </div>
              <Select value={vacancyFilter.status} onValueChange={(value) => setVacancyFilter({...vacancyFilter, status: value})}>
                <SelectTrigger className="w-full sm:w-[160px] text-sm">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="active">Активные</SelectItem>
                  <SelectItem value="archived">Архив</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {vacancies.filter(v => {
                const searchMatch = vacancyFilter.search === '' || 
                  v.title.toLowerCase().includes(vacancyFilter.search.toLowerCase()) ||
                  v.department.toLowerCase().includes(vacancyFilter.search.toLowerCase());
                const statusMatch = vacancyFilter.status === 'all' || v.status === vacancyFilter.status;
                return searchMatch && statusMatch;
              }).sort((a, b) => {
                if (a.status === 'archived' && b.status !== 'archived') return 1;
                if (a.status !== 'archived' && b.status === 'archived') return -1;
                return 0;
              }).map((vacancy) => (
                <Card key={vacancy.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="p-2 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-1.5 sm:gap-3">
                      <div 
                        className="cursor-pointer hover:opacity-70 transition-opacity flex-1"
                        onClick={() => {
                          setSelectedVacancyDetail(vacancy);
                          setShowVacancyDetail(true);
                        }}
                      >
                        <CardTitle className="flex items-center gap-1.5 text-xs sm:text-lg">
                          {vacancy.title}
                          <Icon name="ExternalLink" size={12} className="text-muted-foreground" />
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-sm">{vacancy.department}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-[9px] sm:text-xs px-1 sm:px-2 ${
                            vacancy.status === 'archived' ? 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400' : ''
                          }`}
                        >
                          {vacancy.status === 'active' ? 'Активна' : 'Архив'}
                        </Badge>
                        {vacancy.recommendations > 0 && (
                          <Badge variant="outline" className="text-[9px] sm:text-xs px-1 sm:px-2">
                            <Icon name="Users" size={8} className="mr-0.5" />
                            {vacancy.recommendations}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
                    <div className="space-y-2 sm:space-y-4">
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
                        <div className="flex items-center gap-1">
                          <Icon name="Wallet" size={12} className="text-muted-foreground" />
                          <span className="truncate">{vacancy.salary}</span>
                        </div>
                        {vacancy.city && (
                          <div className="flex items-center gap-1">
                            <Icon name={vacancy.isRemote ? "Home" : "MapPin"} size={12} className="text-muted-foreground" />
                            <span className="truncate">{vacancy.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-primary font-medium">
                          <Icon name="Award" size={12} />
                          <span>{vacancy.reward.toLocaleString()} ₽</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Icon name="Clock" size={12} />
                          <span>{vacancy.payoutDelayDays} дн.</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setActiveVacancy(vacancy);
                            setVacancyForm({
                              title: vacancy.title,
                              department: vacancy.department,
                              salary: vacancy.salary,
                              description: vacancy.description || '',
                              requirements: vacancy.requirements || '',
                              reward: vacancy.reward.toString(),
                              payoutDelay: vacancy.payoutDelayDays.toString(),
                              city: vacancy.city || '',
                              isRemote: vacancy.isRemote || false
                            });
                          }}
                          className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                        >
                          <Icon name="Pencil" size={12} className="sm:mr-1" />
                          <span className="hidden sm:inline">Ред.</span>
                        </Button>
                        {vacancy.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleArchiveVacancy(vacancy.id)}
                            className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                          >
                            <Icon name="Archive" size={12} className="sm:mr-1" />
                            <span className="hidden sm:inline">В архив</span>
                          </Button>
                        )}
                        {vacancy.status === 'archived' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRestoreVacancy(vacancy.id)}
                              className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                            >
                              <Icon name="RotateCcw" size={12} className="sm:mr-1" />
                              <span>Активировать</span>
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                if (window.confirm('Удалить вакансию безвозвратно?')) {
                                  handleDeleteVacancy(vacancy.id);
                                }
                              }}
                              className="flex-1 sm:flex-none text-[10px] sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                            >
                              <Icon name="Trash2" size={12} className="sm:mr-1" />
                              <span className="hidden sm:inline">Удалить</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={activeVacancy !== null} onOpenChange={(open) => !open && setActiveVacancy(null)}>
              <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Редактировать вакансию</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">Обновите информацию о вакансии</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="edit-vacancy-title" className="text-xs sm:text-sm">Название должности</Label>
                      <Input 
                        id="edit-vacancy-title" 
                        className="mt-1 text-sm"
                        value={vacancyForm.title}
                        onChange={(e) => setVacancyForm({...vacancyForm, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-department" className="text-xs sm:text-sm">Отдел</Label>
                      <Input 
                        id="edit-department" 
                        className="mt-1 text-sm"
                        value={vacancyForm.department}
                        onChange={(e) => setVacancyForm({...vacancyForm, department: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="edit-salary" className="text-xs sm:text-sm">Зарплата</Label>
                      <Input 
                        id="edit-salary" 
                        className="mt-1 text-sm"
                        value={vacancyForm.salary}
                        onChange={(e) => setVacancyForm({...vacancyForm, salary: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-reward-amount" className="text-xs sm:text-sm">Вознаграждение</Label>
                      <Input 
                        id="edit-reward-amount" 
                        type="number" 
                        className="mt-1 text-sm"
                        value={vacancyForm.reward}
                        onChange={(e) => setVacancyForm({...vacancyForm, reward: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-payout-delay" className="text-xs sm:text-sm">Срок выплаты вознаграждения</Label>
                    <Select 
                      value={vacancyForm.payoutDelay}
                      onValueChange={(value) => setVacancyForm({...vacancyForm, payoutDelay: value})}
                    >
                      <SelectTrigger id="edit-payout-delay" className="mt-1 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Сразу после найма</SelectItem>
                        <SelectItem value="7">Через 7 дней</SelectItem>
                        <SelectItem value="14">Через 14 дней</SelectItem>
                        <SelectItem value="30">Через 30 дней</SelectItem>
                        <SelectItem value="45">Через 45 дней</SelectItem>
                        <SelectItem value="60">Через 60 дней</SelectItem>
                        <SelectItem value="90">Через 90 дней (испытательный срок)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-description" className="text-xs sm:text-sm">Описание вакансии</Label>
                    <Textarea 
                      id="edit-description" 
                      rows={3}
                      className="mt-1 text-sm"
                      value={vacancyForm.description}
                      onChange={(e) => setVacancyForm({...vacancyForm, description: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-requirements" className="text-xs sm:text-sm">Требования</Label>
                    <Textarea 
                      id="edit-requirements" 
                      rows={3}
                      className="mt-1 text-sm"
                      value={vacancyForm.requirements}
                      onChange={(e) => setVacancyForm({...vacancyForm, requirements: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <Button className="flex-1 text-sm" onClick={handleUpdateVacancy}>Сохранить изменения</Button>
                    {activeVacancy?.status === 'active' && (
                      <Button 
                        variant="outline"
                        className="text-sm"
                        onClick={() => {
                          if (activeVacancy) {
                            handleArchiveVacancy(activeVacancy.id);
                            setActiveVacancy(null);
                          }
                        }}
                      >
                        <Icon name="Archive" size={16} className="mr-2" />
                        В архив
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </>
            )}
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            {isSubscriptionExpired ? (
              <SubscriptionExpiredBlock onRenew={() => setShowSubscriptionDialog(true)} />
            ) : (
              <>
            <div className="flex flex-col gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                  <span>👥</span>
                  <span className="hidden sm:inline">Сотрудники компании</span>
                  <span className="sm:hidden">Сотрудники</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Всего: <span className="font-semibold">{employees.length}</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleGenerateReferralLink} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  <Icon name="Link" className="mr-1 sm:mr-2" size={16} />
                  <span>Пригласить сотрудника</span>
                </Button>

              </div>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Поиск..."
                value={employeeSearchQuery}
                onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                className="w-full text-sm"
              />
              <select
                value={employeeStatusFilter}
                onChange={(e) => setEmployeeStatusFilter(e.target.value as 'all' | 'active' | 'fired' | 'admin')}
                className="shrink-0 text-sm border border-input rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Все</option>
                <option value="active">Действующие</option>
                <option value="fired">Уволенные</option>
                <option value="admin">Администраторы</option>
              </select>
            </div>
            <div className="grid gap-4">
              {employees.filter(emp => {
                const matchesStatus =
                  employeeStatusFilter === 'all' ||
                  (employeeStatusFilter === 'active' && !emp.isFired) ||
                  (employeeStatusFilter === 'fired' && emp.isFired) ||
                  (employeeStatusFilter === 'admin' && emp.isAdmin);
                const matchesSearch =
                  employeeSearchQuery === '' ||
                  emp.name.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                  emp.position.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                  emp.department.toLowerCase().includes(employeeSearchQuery.toLowerCase()) ||
                  (emp.email && emp.email.toLowerCase().includes(employeeSearchQuery.toLowerCase()));
                return matchesStatus && matchesSearch;
              }
              ).map((employee) => (
                <Card 
                  key={employee.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedEmployee(employee);
                    setShowEmployeeDetail(true);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <CardTitle className="text-base sm:text-lg truncate">{employee.name}</CardTitle>

                          {employee.isFired
                            ? <Badge variant="destructive" className="text-xs">Уволен</Badge>
                            : employee.isAdmin
                              ? <Badge className="text-xs bg-purple-600 hover:bg-purple-600">Администратор</Badge>
                              : <Badge variant="secondary" className="text-xs">Действующий</Badge>
                          }
                          <Badge variant="outline" className="bg-primary/10 text-xs hidden sm:inline-flex">
                            <Icon name="Trophy" size={12} className="mr-1" />
                            #{calculateEmployeeRank(employee)}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs sm:text-sm truncate">{employee.position} • {employee.department}</CardDescription>
                      </div>
                      <div className="hidden sm:flex flex-row gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatEmployee(employee);
                            setShowChatDialog(true);
                          }}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Icon name="MessageCircle" className="sm:mr-1" size={16} />
                          <span className="hidden sm:inline">Написать</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeToEdit(employee);
                            const [firstName, ...lastNameParts] = employee.name.split(' ');
                            setEmployeeEditForm({
                              firstName: firstName,
                              lastName: lastNameParts.join(' '),
                              position: employee.position,
                              department: employee.department
                            });
                            setShowEditEmployeeDialog(true);
                          }}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Dialog open={showEditRolesDialog && employeeToEditRoles?.id === employee.id} onOpenChange={(open) => {
                          if (!open) {
                            setShowEditRolesDialog(false);
                            setEmployeeToEditRoles(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              setEmployeeToEditRoles(employee);
                              setRolesForm({
                                isAdmin: employee.isAdmin || false
                              });
                              setShowEditRolesDialog(true);
                            }} className="flex-1 sm:flex-none text-xs sm:text-sm">
                              <Icon name="Shield" size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Управление ролями: {employee.name}</DialogTitle>
                              <DialogDescription>Назначьте права доступа сотруднику</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              {currentUser?.role === 'admin' && (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Администратор</Label>
                                      <p className="text-xs text-muted-foreground">Полный доступ к системе</p>
                                    </div>
                                    <Checkbox
                                      checked={rolesForm.isAdmin}
                                      onCheckedChange={(checked) => setRolesForm({...rolesForm, isAdmin: checked as boolean})}
                                    />
                                  </div>
                                  <div className="border-t pt-4">
                                    <Button
                                      variant={employeeToEditRoles?.isFired ? "outline" : "destructive"}
                                      className="w-full"
                                      onClick={() => {
                                        if (employeeToEditRoles) {
                                          setShowEditRolesDialog(false);
                                          handleToggleFired(employeeToEditRoles);
                                        }
                                      }}
                                    >
                                      <Icon name={employeeToEditRoles?.isFired ? "UserCheck" : "UserX"} size={16} className="mr-2" />
                                      {employeeToEditRoles?.isFired ? 'Восстановить сотрудника' : 'Уволить сотрудника'}
                                    </Button>
                                  </div>
                                </>
                              )}
                              <Button className="w-full" onClick={handleUpdateEmployeeRoles}>Сохранить</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <div className="flex sm:hidden flex-wrap gap-1 sm:gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatEmployee(employee);
                            setShowChatDialog(true);
                          }}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Icon name="MessageCircle" className="sm:mr-1" size={16} />
                          <span className="hidden sm:inline">Написать</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEmployeeToEdit(employee);
                            const [firstName, ...lastNameParts] = employee.name.split(' ');
                            setEmployeeEditForm({
                              firstName: firstName,
                              lastName: lastNameParts.join(' '),
                              position: employee.position,
                              department: employee.department
                            });
                            setShowEditEmployeeDialog(true);
                          }}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Icon name="Edit" size={16} />
                        </Button>
                        <Dialog open={showEditRolesDialog && employeeToEditRoles?.id === employee.id} onOpenChange={(open) => {
                          if (!open) {
                            setShowEditRolesDialog(false);
                            setEmployeeToEditRoles(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              setEmployeeToEditRoles(employee);
                              setRolesForm({
                                isAdmin: employee.isAdmin || false
                              });
                              setShowEditRolesDialog(true);
                            }} className="flex-1 sm:flex-none text-xs sm:text-sm">
                              <Icon name="Shield" size={16} />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Управление ролями: {employee.name}</DialogTitle>
                              <DialogDescription>Назначьте права доступа сотруднику</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              {currentUser?.role === 'admin' && (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Администратор</Label>
                                      <p className="text-xs text-muted-foreground">Полный доступ к системе</p>
                                    </div>
                                    <Checkbox
                                      checked={rolesForm.isAdmin}
                                      onCheckedChange={(checked) => setRolesForm({...rolesForm, isAdmin: checked as boolean})}
                                    />
                                  </div>
                                  <div className="border-t pt-4">
                                    <Button
                                      variant={employeeToEditRoles?.isFired ? "outline" : "destructive"}
                                      className="w-full"
                                      onClick={() => {
                                        if (employeeToEditRoles) {
                                          setShowEditRolesDialog(false);
                                          handleToggleFired(employeeToEditRoles);
                                        }
                                      }}
                                    >
                                      <Icon name={employeeToEditRoles?.isFired ? "UserCheck" : "UserX"} size={16} className="mr-2" />
                                      {employeeToEditRoles?.isFired ? 'Восстановить сотрудника' : 'Уволить сотрудника'}
                                    </Button>
                                  </div>
                                </>
                              )}
                              <Button className="w-full" onClick={handleUpdateEmployeeRoles}>Сохранить</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                    </div>
                    <Badge variant="outline" className="mt-2">Уровень {employee.level}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                      <div>
                        <div className="text-lg sm:text-2xl font-bold text-primary">{employee.recommendations}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Реком.</div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{employee.hired}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Нанято</div>
                      </div>
                      <div>
                        <div className="text-base sm:text-xl font-bold text-secondary truncate">{employee.earnings.toLocaleString()} ₽</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">Зараб.</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {isSubscriptionExpired ? (
              <SubscriptionExpiredBlock onRenew={() => setShowSubscriptionDialog(true)} />
            ) : (
              <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <span>🎯</span>
                <span className="hidden sm:inline">Рекомендации кандидатов</span>
                <span className="sm:hidden">Рекомендации</span>
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по кандидатам..."
                  value={recommendationSearchQuery}
                  onChange={(e) => setRecommendationSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={recommendationStatusFilter} onValueChange={(value: any) => setRecommendationStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="pending">На рассмотрении</SelectItem>
                  <SelectItem value="accepted">Принятые</SelectItem>
                  <SelectItem value="rejected">Отклонённые</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              {recommendations.filter(rec => {
                const matchesSearch = recommendationSearchQuery === '' || 
                  rec.candidateName.toLowerCase().includes(recommendationSearchQuery.toLowerCase()) ||
                  rec.vacancy.toLowerCase().includes(recommendationSearchQuery.toLowerCase()) ||
                  (rec.recommendedBy && rec.recommendedBy.toLowerCase().includes(recommendationSearchQuery.toLowerCase()));
                const matchesStatus = recommendationStatusFilter === 'all' || 
                  rec.status === recommendationStatusFilter || 
                  (recommendationStatusFilter === 'accepted' && rec.status === 'hired') ||
                  (recommendationStatusFilter === 'hired' && rec.status === 'accepted');
                return matchesSearch && matchesStatus;
              }).map((rec) => (
                <Card key={rec.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  setActiveRecommendation(rec);
                  setShowRecommendationDetailsDialog(true);
                }}>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg truncate">{rec.candidateName}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm truncate">{rec.vacancy}</CardDescription>
                        {rec.recommendedBy && (
                          <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                              <AvatarFallback className="text-xs">{rec.recommendedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs sm:text-sm text-muted-foreground truncate">
                              <span className="hidden sm:inline">Рекомендовал: </span><span className="font-medium text-foreground">{rec.recommendedBy}</span>
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant={
                        rec.status === 'accepted' || rec.status === 'hired' ? 'default' : 
                        rec.status === 'rejected' ? 'destructive' : 
                        'secondary'
                      } className="text-xs whitespace-nowrap">
                        {rec.status === 'accepted' || rec.status === 'hired' ? 'Принят' : 
                         rec.status === 'rejected' ? 'Отклонён' : 
                         'На рассмотрении'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Icon name="Calendar" size={14} />
                          <span className="whitespace-nowrap">{new Date(rec.date).toLocaleDateString('ru-RU')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Award" size={14} />
                          <span className="whitespace-nowrap">{rec.reward.toLocaleString()} ₽</span>
                        </div>
                      </div>
                      {rec.status === 'pending' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateRecommendationStatus(rec.id, 'rejected');
                          }} disabled={isSubscriptionExpired} className="flex-1 sm:flex-none text-xs sm:text-sm">
                            <Icon name="X" className="sm:mr-1" size={14} />
                            <span className="hidden sm:inline">Отклонить</span>
                          </Button>
                          <Button size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateRecommendationStatus(rec.id, 'accepted');
                          }} disabled={isSubscriptionExpired} className="flex-1 sm:flex-none text-xs sm:text-sm">
                            <Icon name="Check" className="sm:mr-1" size={14} />
                            <span className="hidden sm:inline">Принять</span>
                          </Button>
                        </div>
                      )}
                      {(rec.status === 'accepted' || rec.status === 'hired') && (
                        <div className="flex gap-2 items-center">
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            <Icon name="Clock" size={14} className="inline mr-1" />
                            <span className="hidden sm:inline">Выплата через 30 дней</span>
                            <span className="sm:hidden">30 дн.</span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Отменить принятие кандидата? Статус вернётся в "На рассмотрении".')) {
                                handleUpdateRecommendationStatus(rec.id, 'pending');
                              }
                            }} 
                            disabled={isSubscriptionExpired}
                            className="text-xs"
                          >
                            <Icon name="RotateCcw" className="sm:mr-1" size={14} />
                            <span className="hidden sm:inline">Отменить</span>
                          </Button>
                        </div>
                      )}
                      {rec.status === 'rejected' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Вернуть кандидата на рассмотрение?')) {
                              handleUpdateRecommendationStatus(rec.id, 'pending');
                            }
                          }} 
                          disabled={isSubscriptionExpired}
                          className="text-xs"
                        >
                          <Icon name="RotateCcw" className="mr-1" size={14} />
                          На рассмотрение
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>
            )}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 mb-2">
                <span>💰</span>
                <span className="hidden sm:inline">Запросы на выплаты</span>
                <span className="sm:hidden">Выплаты</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Управление запросами сотрудников
              </p>
            </div>
            <PayoutRequests 
              requests={payoutRequests}
              companyId={currentCompanyId}
              onUpdateStatus={async (requestId, status, comment) => {
                try {
                  const response = await fetch('https://functions.poehali.dev/f88ab2cf-1304-40dd-82e4-a7a1f7358901', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      request_id: requestId,
                      status: status,
                      admin_comment: comment,
                      reviewed_by: currentUser?.id || 1
                    })
                  });
                  
                  if (response.ok) {
                    await loadData();
                  } else {
                    const error = await response.json();
                    alert(`Ошибка: ${error.error || 'Не удалось обновить статус'}`);
                  }
                } catch (error) {
                  console.error('Ошибка обновления статуса выплаты:', error);
                  alert('Не удалось обновить статус выплаты');
                }
              }}
              onVacancyClick={(vacancyId) => {
                const vacancy = vacancies.find(v => v.id === vacancyId);
                if (vacancy) {
                  setSelectedVacancyDetail(vacancy);
                  setShowVacancyDetail(true);
                }
              }}
            />
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                <span>📢</span>
                <span className="hidden sm:inline">Новости компании</span>
                <span className="sm:hidden">Новости</span>
              </h2>
              <Button onClick={() => setShowCreateNewsDialog(true)} size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                <Icon name="Plus" className="mr-1 sm:mr-2" size={16} />
                Создать
              </Button>
            </div>

            <div className="grid gap-4">
              {newsPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={
                            post.category === 'news' ? 'default' :
                            post.category === 'achievement' ? 'secondary' :
                            post.category === 'announcement' ? 'outline' :
                            'default'
                          } className="text-xs">
                            {post.category === 'news' ? '📰 Новость' :
                             post.category === 'achievement' ? '🏆 Достижение' :
                             post.category === 'announcement' ? '📢 Объявление' :
                             '✍️ Блог'}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(post.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <CardTitle className="text-base sm:text-xl">{post.title}</CardTitle>
                        <CardDescription className="mt-1 text-xs sm:text-sm truncate">Автор: {post.author}</CardDescription>
                      </div>
                      <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setNewsToEdit(post);
                            setNewsForm({
                              title: post.title,
                              content: post.content,
                              category: post.category
                            });
                            setShowEditNewsDialog(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteNews(post.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Icon name="Trash2" size={14} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap line-clamp-3">{post.content}</p>
                  </CardContent>
                  <CardFooter className="flex-col items-stretch gap-2 sm:gap-3 border-t pt-3 sm:pt-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleLikeNews(post.id)}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Icon name="ThumbsUp" size={14} />
                        {post.likes}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setActiveNewsPost(post);
                          setShowCommentsDialog(true);
                        }}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                      >
                        <Icon name="MessageCircle" size={14} />
                        {post.comments.length}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            {isSubscriptionExpired ? (
              <SubscriptionExpiredBlock onRenew={() => setShowSubscriptionDialog(true)} />
            ) : (
              <>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
              <span>💬</span>
              <span className="hidden sm:inline">Чаты с сотрудниками</span>
              <span className="sm:hidden">Чаты</span>
            </h2>
            <div className="grid gap-3">
              {(chats.length > 0 ? chats : employees.slice(0, 3).map(emp => ({ employee_id: emp.id, unread_count: 0 }))).map((chat) => {
                const emp = employees.find(e => e.id === chat.employee_id);
                if (!emp) return null;
                const unread = chat.unread_count || 0;
                return (
                <Card key={emp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  setActiveChatEmployee(emp);
                  setShowChatDialog(true);
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground truncate">{emp.position}</div>
                      </div>
                      {unread > 0 && <Badge className="bg-red-500 hover:bg-red-500 text-white">{unread}</Badge>}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
            </>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
              <span>📊</span>
              Статистика по компании
            </h2>
            {(() => {
              const totalRecs = recommendations.length;
              const acceptedRecs = recommendations.filter(r => r.status === 'accepted' || r.status === 'hired').length;
              const conversion = totalRecs > 0 ? Math.round((acceptedRecs / totalRecs) * 100) : 0;
              const totalBonuses = recommendations
                .filter(r => r.status === 'accepted' || r.status === 'hired')
                .reduce((sum, r) => sum + (r.reward || 0), 0);
              const bonusDisplay = totalBonuses >= 1000000
                ? `${(totalBonuses / 1000000).toFixed(1)}М ₽`
                : totalBonuses >= 1000
                ? `${Math.round(totalBonuses / 1000)}К ₽`
                : `${totalBonuses.toLocaleString()} ₽`;
              const now = new Date();
              const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
              const recsThisMonth = recommendations.filter(r => new Date(r.date) >= monthAgo).length;
              const recsPrevMonth = recommendations.filter(r => {
                const d = new Date(r.date);
                const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
                return d >= twoMonthsAgo && d < monthAgo;
              }).length;
              const monthGrowth = recsPrevMonth > 0 ? Math.round(((recsThisMonth - recsPrevMonth) / recsPrevMonth) * 100) : null;
              const activeEmployees = employees.filter(e => !e.isFired).length;

              return (
                <>
                  <div className="grid md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Всего рекомендаций</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{totalRecs}</div>
                        {monthGrowth !== null ? (
                          <p className={`text-xs mt-1 ${monthGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {monthGrowth >= 0 ? '+' : ''}{monthGrowth}% за месяц
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">{recsThisMonth} за этот месяц</p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Принято кандидатов</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{acceptedRecs}</div>
                        <p className="text-xs text-green-600 mt-1">Конверсия {conversion}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Сумма вознаграждений</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{bonusDisplay}</div>
                        <p className="text-xs text-muted-foreground mt-1">За весь период</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Активных сотрудников</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold">{activeEmployees}</div>
                        <p className="text-xs text-muted-foreground mt-1">Из {employees.length} всего</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Топ рекрутеров</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {employees.filter(e => e.hired > 0 || e.recommendations > 0).length === 0 ? (
                        <p className="text-center text-muted-foreground py-6">Пока нет данных</p>
                      ) : (
                        <div className="space-y-4">
                          {[...employees].sort((a, b) => b.hired - a.hired || b.recommendations - a.recommendations).map((emp, idx) => (
                            <div key={emp.id} className="flex items-center gap-4">
                              <div className={`text-lg font-bold w-8 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>#{idx + 1}</div>
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-medium">{emp.name}</div>
                                <div className="text-sm text-muted-foreground">{emp.hired} найма · {emp.recommendations} рекомендаций</div>
                              </div>
                              <Badge variant="secondary">
                                <Icon name="TrendingUp" className="mr-1" size={14} />
                                {emp.earnings.toLocaleString()} ₽
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4 sm:hidden">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span>💳</span> Подписка
            </h2>
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">До 300 сотрудников</CardTitle>
                  <Badge variant={subscriptionDaysLeft < 7 ? 'destructive' : 'secondary'}>
                    {subscriptionDaysLeft} дней
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">19 900 ₽ / мес</div>
                <Progress value={(subscriptionDaysLeft / 30) * 100} className="h-2" />
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Неограниченные вакансии</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>API интеграция</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" className="text-green-600" size={16} />
                    <span>Аналитика и отчёты</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => {
                setSubscriptionDaysLeft(30);
                alert('✅ Подписка продлена на 30 дней!');
              }}
            >
              <Icon name="CreditCard" className="mr-2" size={18} />
              Продлить подписку
            </Button>

            {subscriptionDaysLeft < 7 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="AlertTriangle" className="text-destructive mt-0.5" size={20} />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-destructive mb-1">Подписка заканчивается!</p>
                    <p className="text-muted-foreground">Продлите, чтобы не потерять доступ к функциям</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
                <span>❓ Помощь</span>
              </h2>
              <p className="text-muted-foreground">Узнайте, как использовать все возможности платформы для эффективного поиска талантов</p>
            </div>

            <div className="grid gap-6">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Briefcase" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Управление вакансиями</CardTitle>
                      <CardDescription className="mt-1">Создавайте и публикуйте вакансии для поиска лучших кандидатов</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="Plus" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Создание вакансии:</strong> Нажмите "Создать вакансию" во вкладке Вакансии, заполните детали позиции и укажите вознаграждение за успешную рекомендацию</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Eye" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Просмотр кандидатов:</strong> Кликните на любую вакансию, чтобы увидеть всех рекомендованных кандидатов и их статусы</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Archive" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Архивация:</strong> Закрытые вакансии можно перенести в архив для сохранения истории подбора</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Users" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Работа с сотрудниками</CardTitle>
                      <CardDescription className="mt-1">Пригласите команду для совместного поиска талантов</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="UserPlus" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Приглашение сотрудников:</strong> Во вкладке Сотрудники добавьте коллег по email — они получат приглашение на платформу</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Target" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Рекомендации от команды:</strong> Ваши сотрудники смогут рекомендовать кандидатов на открытые вакансии и зарабатывать вознаграждения</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="BarChart3" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Статистика активности:</strong> Отслеживайте количество рекомендаций и успешных наймов от каждого сотрудника</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Star" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Обработка рекомендаций</CardTitle>
                      <CardDescription className="mt-1">Управляйте входящими рекомендациями от вашей команды</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="UserCheck" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Просмотр кандидатов:</strong> Все рекомендации от сотрудников появляются во вкладке Рекомендации с полной информацией о кандидате</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="MessageSquare" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Обратная связь:</strong> Обновляйте статус рекомендации (Интервью, Принят, Отклонён), чтобы держать сотрудников в курсе</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="CheckCircle2" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Подтверждение найма:</strong> При успешном найме измените статус на "Принят" — вознаграждение автоматически начислится сотруднику</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Wallet" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Выплаты и финансы</CardTitle>
                      <CardDescription className="mt-1">Управляйте вознаграждениями за успешные рекомендации</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="DollarSign" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Автоматические начисления:</strong> При найме рекомендованного кандидата вознаграждение автоматически зачисляется на счёт сотрудника</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="FileText" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Запросы на выплату:</strong> Во вкладке Выплаты просматривайте и одобряйте заявки сотрудников на вывод средств</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="History" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>История операций:</strong> Отслеживайте все выплаты и начисления в разрезе по сотрудникам и периодам</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Newspaper" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Новости компании</CardTitle>
                      <CardDescription className="mt-1">Делитесь важной информацией с вашей командой</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="PenSquare" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Публикация новостей:</strong> Создавайте посты о достижениях компании, новых вакансиях или изменениях в процессах</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Image" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Мультимедиа:</strong> Добавляйте изображения и форматируйте текст для более привлекательных постов</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="MessageCircle" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Обратная связь:</strong> Сотрудники могут комментировать новости и задавать вопросы</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="MessageSquare" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Чаты и коммуникация</CardTitle>
                      <CardDescription className="mt-1">Общайтесь с сотрудниками напрямую</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="Send" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Личные сообщения:</strong> Открывайте чаты с сотрудниками для обсуждения деталей рекомендаций</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Paperclip" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Обмен файлами:</strong> Отправляйте резюме, портфолио и другие документы прямо в чате</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Bell" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Уведомления:</strong> Получайте оповещения о новых сообщениях и важных событиях</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="BarChart" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Аналитика и статистика</CardTitle>
                      <CardDescription className="mt-1">Отслеживайте эффективность реферальной программы</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="TrendingUp" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Общая статистика:</strong> Просматривайте количество активных вакансий, рекомендаций и успешных наймов</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="PieChart" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Рейтинг сотрудников:</strong> Узнайте, кто из команды наиболее активен в рекомендациях</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Calendar" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Динамика по периодам:</strong> Анализируйте эффективность программы помесячно и выявляйте тренды</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-muted/30">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="HelpCircle" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Нужна дополнительная помощь?</CardTitle>
                      <CardDescription className="mt-1">Мы всегда готовы помочь вам</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <Icon name="Mail" className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Email поддержка</p>
                      <p className="text-sm text-muted-foreground">info@i-hunt.ru</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Icon name="MessageCircle" className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Онлайн чат</p>
                      <p className="text-sm text-muted-foreground">Доступен с 9:00 до 18:00 по МСК</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Icon name="BookOpen" className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">База знаний</p>
                      <p className="text-sm text-muted-foreground">Подробные инструкции и ответы на частые вопросы</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


        </Tabs>
        )}
      </div>

      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
            <DialogDescription>Создайте аккаунт для нового сотрудника компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="invite-first-name">Имя</Label>
              <Input 
                id="invite-first-name"
                placeholder="Иван"
                value={inviteForm.firstName}
                onChange={(e) => setInviteForm({...inviteForm, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-last-name">Фамилия</Label>
              <Input 
                id="invite-last-name"
                placeholder="Иванов"
                value={inviteForm.lastName}
                onChange={(e) => setInviteForm({...inviteForm, lastName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-email">Email</Label>
              <Input 
                id="invite-email"
                type="email"
                placeholder="ivan@company.ru"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-password">Пароль</Label>
              <Input 
                id="invite-password"
                type="password"
                placeholder="Минимум 8 символов"
                value={inviteForm.password}
                onChange={(e) => setInviteForm({...inviteForm, password: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-position">Должность</Label>
              <Input 
                id="invite-position"
                placeholder="Frontend Developer"
                value={inviteForm.position}
                onChange={(e) => setInviteForm({...inviteForm, position: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="invite-department">Отдел</Label>
              <Input 
                id="invite-department"
                placeholder="Разработка"
                value={inviteForm.department}
                onChange={(e) => setInviteForm({...inviteForm, department: e.target.value})}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleInviteEmployee}
              disabled={isAuthLoading}
            >
              {isAuthLoading ? 'Создание...' : 'Создать аккаунт сотрудника'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompanySettingsDialog} onOpenChange={setShowCompanySettingsDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Профиль компании</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Управляйте информацией о вашей компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="company-name-edit" className="text-xs sm:text-sm">Название компании</Label>
                <Input id="company-name-edit" className="mt-1 text-sm" value={company?.name || ''} readOnly disabled />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Заполнено при регистрации</p>
              </div>
              <div>
                <Label htmlFor="company-logo" className="text-xs sm:text-sm">Логотип</Label>
                <div className="mt-1 flex items-center gap-3">
                  {(companyLogoPreview || company?.logo_url) && (
                    <div className="relative">
                      <img
                        src={companyLogoPreview || company?.logo_url}
                        alt="Логотип"
                        className="h-12 w-12 object-contain rounded border"
                      />
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none hover:bg-red-700"
                        onClick={() => {
                          setCompanyLogoPreview(null);
                          setCompanyLogoFile(null);
                          if (company?.logo_url) {
                            api.updateCompany(currentCompanyId, { logo_url: '' });
                            setCompany(prev => prev ? { ...prev, logo_url: undefined } : null);
                          }
                        }}
                        title="Удалить логотип"
                      >✕</button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      id="company-logo"
                      className="text-sm"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Файл слишком большой. Максимум 5 МБ');
                            e.target.value = '';
                            return;
                          }
                          setCompanyLogoFile(file);
                          const reader = new FileReader();
                          reader.onload = (ev) => setCompanyLogoPreview(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, WebP до 5 МБ. Рекомендуется квадратное изображение от 200×200 пикселей</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="company-desc" className="text-xs sm:text-sm">Описание</Label>
              <Textarea id="company-desc" rows={3} className="mt-1 text-sm" placeholder="Расскажите о вашей компании..." value={companyEditForm.description} onChange={(e) => setCompanyEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="company-website" className="text-xs sm:text-sm">Веб-сайт</Label>
                <Input id="company-website" className="mt-1 text-sm" placeholder="https://example.com" value={companyEditForm.website} onChange={(e) => setCompanyEditForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="company-industry" className="text-xs sm:text-sm">Отрасль</Label>
                <Select value={companyEditForm.industry} onValueChange={(val) => setCompanyEditForm(f => ({ ...f, industry: val }))}>
                  <SelectTrigger className="mt-1 text-sm">
                    <SelectValue placeholder="Выберите отрасль" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">IT и технологии</SelectItem>
                    <SelectItem value="finance">Финансы</SelectItem>
                    <SelectItem value="retail">Розничная торговля</SelectItem>
                    <SelectItem value="manufacturing">Производство</SelectItem>
                    <SelectItem value="services">Услуги</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="company-inn" className="text-xs sm:text-sm">ИНН</Label>
                <Input id="company-inn" className="mt-1 text-sm" value={company?.inn || ''} readOnly disabled />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Заполнено при регистрации</p>
              </div>
              <div>
                <Label htmlFor="company-employee-count" className="text-xs sm:text-sm">Кол-во сотрудников</Label>
                <Input id="company-employee-count" className="mt-1 text-sm" type="number" value={company?.employee_count || 0} readOnly disabled />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Заполнено при регистрации</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Социальные сети</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="company-telegram" className="text-xs sm:text-sm flex items-center gap-2">
                    <Icon name="Send" size={14} /> Telegram
                  </Label>
                  <Input id="company-telegram" className="mt-1 text-sm" placeholder="@company или t.me/company" value={companyEditForm.telegram} onChange={(e) => setCompanyEditForm(f => ({ ...f, telegram: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="company-vk" className="text-xs sm:text-sm flex items-center gap-2">
                    <Icon name="MessageCircle" size={14} /> ВКонтакте
                  </Label>
                  <Input id="company-vk" className="mt-1 text-sm" placeholder="vk.com/company" value={companyEditForm.vk} onChange={(e) => setCompanyEditForm(f => ({ ...f, vk: e.target.value }))} />
                </div>
              </div>
            </div>

            <Separator />

            <Button className="w-full text-sm" size="lg" onClick={handleSaveCompany} disabled={isSavingCompany}>
              <Icon name={isSavingCompany ? 'Loader2' : 'Save'} className={`mr-2 ${isSavingCompany ? 'animate-spin' : ''}`} size={16} />
              {isSavingCompany ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatDialog} onOpenChange={(open) => { setShowChatDialog(open); if (!open && chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; } }}>
        <DialogContent className="max-w-4xl h-[100dvh] sm:h-[600px] w-[100vw] sm:w-full rounded-none sm:rounded-lg flex flex-col p-0">
          <div className="flex h-full overflow-hidden">
            <div className="w-[72px] sm:w-72 border-r flex flex-col shrink-0">
              <div className="p-2 sm:p-4 border-b">
                <h3 className="font-semibold text-[10px] sm:text-base text-center sm:text-left">Чаты</h3>
                <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Выберите сотрудника для диалога</p>
                <div className="mt-2 hidden sm:block">
                  <Input 
                    placeholder="Поиск сотрудника..." 
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {employees.filter(emp => {
                  if (!employeeSearchQuery) return true;
                  const query = employeeSearchQuery.toLowerCase();
                  return emp.name.toLowerCase().includes(query) || 
                         emp.position.toLowerCase().includes(query) ||
                         emp.department.toLowerCase().includes(query);
                }).map((emp) => (
                  <div
                    key={emp.id}
                    className={`p-1.5 sm:p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      activeChatEmployee?.id === emp.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleSelectChatEmployee(emp)}
                  >
                    <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt={emp.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon name="User" size={16} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 sm:flex-1 w-full">
                        <p className="font-medium text-[10px] sm:text-sm truncate text-center sm:text-left leading-tight">
                          <span className="sm:hidden">{emp.name.split(' ')[0]}</span>
                          <span className="hidden sm:inline">{emp.name}</span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate hidden sm:block">{emp.position}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
              {activeChatEmployee ? (
                <>
                  <div className="p-2 sm:p-4 border-b shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {activeChatEmployee.avatar ? (
                        <img src={activeChatEmployee.avatar} alt={activeChatEmployee.name} className="w-8 h-8 sm:w-12 sm:h-12 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon name="User" size={16} className="text-primary sm:hidden" />
                          <Icon name="User" size={24} className="text-primary hidden sm:block" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs sm:text-base truncate">{activeChatEmployee.name}</h3>
                        <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{activeChatEmployee.position}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
                    {chatMessages.length === 0 && (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Начните диалог</div>
                    )}
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] sm:max-w-[70%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-2 py-1.5 sm:px-4 sm:py-2`}>
                          <div className="text-[10px] sm:text-xs opacity-70 mb-0.5">{msg.senderName}</div>
                          {msg.message && <div className="text-xs sm:text-sm break-words">{msg.message}</div>}
                          {msg.attachments && msg.attachments.map((att, idx) => (
                            <div key={idx} className="mt-1.5">
                              {att.type === 'image' ? (
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="rounded max-w-full max-h-32 sm:max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setLightboxImage(att.url)}
                                />
                              ) : (
                                <a
                                  href={att.url}
                                  download={att.name}
                                  className="flex items-center gap-1.5 p-1.5 bg-background/10 rounded hover:bg-background/20 transition-colors group"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Icon name="FileText" size={14} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] sm:text-xs font-medium truncate">{att.name}</p>
                                    <p className="text-[10px] sm:text-xs opacity-70">{(att.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                  <Icon name="Download" size={12} className="opacity-60 group-hover:opacity-100 shrink-0" />
                                </a>
                              )}
                            </div>
                          ))}
                          <div className="text-[10px] sm:text-xs opacity-70 mt-0.5">{msg.timestamp}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatMessagesEndRef} />
                  </div>
                  <div className="p-1.5 sm:p-4 border-t shrink-0">
                    {selectedFiles.length > 0 && (
                      <div className="mb-1.5 sm:mb-3 flex flex-wrap gap-1.5">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative bg-muted rounded-lg p-1.5 pr-7">
                            <div className="flex items-center gap-1.5">
                              <Icon name={file.type.startsWith('image/') ? 'Image' : 'FileText'} size={14} />
                              <span className="text-[10px] sm:text-xs max-w-[80px] sm:max-w-[120px] truncate">{file.name}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="absolute top-0.5 right-0.5 h-5 w-5 p-0"
                              onClick={() => removeFile(idx)}
                            >
                              <Icon name="X" size={12} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 sm:gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 sm:h-10 sm:w-10 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Icon name="Paperclip" size={14} className="sm:hidden" />
                        <Icon name="Paperclip" size={18} className="hidden sm:block" />
                      </Button>
                      <Input 
                        placeholder={activeChatId ? "Сообщение..." : "Загрузка чата..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={!activeChatId || isSendingMessage}
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-10 min-w-0"
                      />
                      <Button onClick={handleSendMessage} disabled={!activeChatId || isSendingMessage} className="h-8 w-8 sm:h-10 sm:w-10 p-0 shrink-0">
                        <Icon name="Send" size={14} className="sm:hidden" />
                        <Icon name="Send" size={18} className="hidden sm:block" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                  <div className="text-center">
                    <Icon name="MessageSquare" size={36} className="mx-auto mb-2 opacity-50 sm:mb-3" />
                    <p className="text-xs sm:text-base">Выберите сотрудника</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Данные сотрудника</DialogTitle>
            <DialogDescription>
              Обновите информацию о {employeeToEdit?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emp-firstName">Имя</Label>
                <Input 
                  id="emp-firstName" 
                  value={employeeEditForm.firstName}
                  onChange={(e) => setEmployeeEditForm({...employeeEditForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="emp-lastName">Фамилия</Label>
                <Input 
                  id="emp-lastName" 
                  value={employeeEditForm.lastName}
                  onChange={(e) => setEmployeeEditForm({...employeeEditForm, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="emp-position">Должность</Label>
              <Input 
                id="emp-position" 
                value={employeeEditForm.position}
                onChange={(e) => setEmployeeEditForm({...employeeEditForm, position: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="emp-department">Отдел</Label>
              <Input 
                id="emp-department" 
                value={employeeEditForm.department}
                onChange={(e) => setEmployeeEditForm({...employeeEditForm, department: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleUpdateEmployeeData}
              >
                Сохранить изменения
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowEditEmployeeDialog(false);
                  setEmployeeToEdit(null);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReferralLinkDialog} onOpenChange={setShowReferralLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ссылка для регистрации сотрудников</DialogTitle>
            <DialogDescription>
              Отправьте эту ссылку новым сотрудникам для регистрации в системе
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly />
              <Button onClick={() => handleCopyLink(referralLink)}>
                <Icon name="Copy" size={18} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              После регистрации по этой ссылке сотрудник автоматически присоединится к вашей компании
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRecommendationDetailsDialog} onOpenChange={setShowRecommendationDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали рекомендации</DialogTitle>
            <DialogDescription>
              Полная информация о кандидате {activeRecommendation?.candidateName}
            </DialogDescription>
          </DialogHeader>
          {activeRecommendation && (
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ФИО кандидата</Label>
                  <p className="font-medium">{activeRecommendation.candidateName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Вакансия</Label>
                  <p className="font-medium">{activeRecommendation.vacancy}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{activeRecommendation.candidateEmail}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Телефон</Label>
                  <p className="font-medium">{activeRecommendation.candidatePhone || 'Не указан'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Дата рекомендации</Label>
                  <p className="font-medium">{new Date(activeRecommendation.date).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Статус </Label>
                  <Badge variant={
                    activeRecommendation.status === 'accepted' ? 'default' : 
                    activeRecommendation.status === 'rejected' ? 'destructive' : 
                    'secondary'
                  }>
                    {activeRecommendation.status === 'accepted' ? 'Принят' : 
                     activeRecommendation.status === 'rejected' ? 'Отклонён' : 
                     'На рассмотрении'}
                  </Badge>
                </div>
              </div>

              {activeRecommendation.recommendedBy && (
                <div>
                  <Label className="text-xs text-muted-foreground">Рекомендовал</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {activeRecommendation.recommendedBy.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{activeRecommendation.recommendedBy}</span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Комментарий</Label>
                <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {activeRecommendation.comment || 'Комментарий отсутствует'}
                </p>
              </div>

              {activeRecommendation.resumeUrl && (
                <div>
                  <Label className="text-xs text-muted-foreground">Резюме</Label>
                  <div className="mt-1">
                    <a href={activeRecommendation.resumeUrl} target="_blank" rel="noopener noreferrer" download>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Icon name="Download" size={16} />
                        Скачать резюме
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Вознаграждение</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Icon name="Award" size={20} className="text-primary" />
                  <span className="text-xl font-bold">{activeRecommendation.reward.toLocaleString()} ₽</span>
                </div>
              </div>

              {activeRecommendation.status === 'pending' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      handleUpdateRecommendationStatus(activeRecommendation.id, 'rejected');
                      setShowRecommendationDetailsDialog(false);
                    }}
                    disabled={isSubscriptionExpired}
                  >
                    <Icon name="X" className="mr-2" size={18} />
                    Отклонить
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      handleUpdateRecommendationStatus(activeRecommendation.id, 'accepted');
                      setShowRecommendationDetailsDialog(false);
                    }}
                    disabled={isSubscriptionExpired}
                  >
                    <Icon name="Check" className="mr-2" size={18} />
                    Принять кандидата
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateNewsDialog} onOpenChange={setShowCreateNewsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Создать новость</DialogTitle>
            <DialogDescription>
              Опубликуйте новость или объявление для сотрудников компании
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="news-category">Категория</Label>
              <Select 
                value={newsForm.category}
                onValueChange={(value) => setNewsForm({...newsForm, category: value as any})}
              >
                <SelectTrigger id="news-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">📰 Новость</SelectItem>
                  <SelectItem value="achievement">🏆 Достижение</SelectItem>
                  <SelectItem value="announcement">📢 Объявление</SelectItem>
                  <SelectItem value="blog">✍️ Блог</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="news-title">Заголовок</Label>
              <Input 
                id="news-title" 
                placeholder="Введите заголовок новости"
                value={newsForm.title}
                onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="news-content">Содержание</Label>
              <Textarea 
                id="news-content" 
                placeholder="Расскажите подробнее..."
                rows={8}
                value={newsForm.content}
                onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Эта новость увидят все сотрудники компании на главной странице
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleCreateNews}
              >
                <Icon name="Send" className="mr-2" size={18} />
                Опубликовать
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowCreateNewsDialog(false);
                  setNewsForm({ title: '', content: '', category: 'news' });
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditNewsDialog} onOpenChange={setShowEditNewsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать новость</DialogTitle>
            <DialogDescription>
              Внесите изменения в новость
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-news-category">Категория</Label>
              <Select 
                value={newsForm.category}
                onValueChange={(value) => setNewsForm({...newsForm, category: value as any})}
              >
                <SelectTrigger id="edit-news-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">📰 Новость</SelectItem>
                  <SelectItem value="achievement">🏆 Достижение</SelectItem>
                  <SelectItem value="announcement">📢 Объявление</SelectItem>
                  <SelectItem value="blog">✍️ Блог</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-news-title">Заголовок</Label>
              <Input 
                id="edit-news-title" 
                placeholder="Введите заголовок новости"
                value={newsForm.title}
                onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-news-content">Содержание</Label>
              <Textarea 
                id="edit-news-content" 
                placeholder="Расскажите подробнее..."
                rows={8}
                value={newsForm.content}
                onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleUpdateNews}
              >
                <Icon name="Save" className="mr-2" size={18} />
                Сохранить изменения
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowEditNewsDialog(false);
                  setNewsToEdit(null);
                  setNewsForm({ title: '', content: '', category: 'news' });
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Управление подпиской</DialogTitle>
            <DialogDescription>Текущий статус и продление тарифного плана</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Card className={subscriptionDaysLeft <= 0 ? 'border-destructive' : subscriptionDaysLeft < 7 ? 'border-orange-400' : 'border-primary'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{company?.subscription_tier === 'trial' ? 'Пробный период' : 'Продвинутый'}</CardTitle>
                  <Badge variant={subscriptionDaysLeft <= 0 ? 'destructive' : subscriptionDaysLeft < 7 ? 'destructive' : 'secondary'}>
                    {subscriptionDaysLeft <= 0 ? 'Истекла' : `${subscriptionDaysLeft} дн. осталось`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={Math.max(0, Math.min(100, (subscriptionDaysLeft / 30) * 100))} className="h-2" />
                {company?.subscription_expires_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Действует до: {new Date(company.subscription_expires_at).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </CardContent>
            </Card>

            {subscriptionDaysLeft < 7 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <Icon name="AlertTriangle" className="text-destructive mt-0.5 shrink-0" size={16} />
                <p className="text-sm text-destructive">
                  {subscriptionDaysLeft <= 0 ? 'Подписка истекла. Доступ ограничен.' : 'Подписка заканчивается. Продлите, чтобы не потерять доступ.'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Тариф "Продвинутый" — без ограничений на сотрудников</p>
              <div className="grid grid-cols-2 gap-3">
                <Card className={`cursor-pointer border-2 transition-colors ${demoForm.employeeCount === '30' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => setDemoForm({ ...demoForm, employeeCount: '30' })}>
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">54 900 ₽</p>
                    <p className="text-xs text-muted-foreground">30 дней</p>
                  </CardContent>
                </Card>
                <Card className={`cursor-pointer border-2 transition-colors ${demoForm.employeeCount === '365' ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onClick={() => setDemoForm({ ...demoForm, employeeCount: '365' })}>
                  <CardContent className="p-4 text-center">
                    <p className="font-bold text-lg">559 980 ₽</p>
                    <p className="text-xs text-muted-foreground">1 год <span className="text-green-600 font-medium">−15%</span></p>
                  </CardContent>
                </Card>
              </div>
              <Input
                placeholder="Ваше имя *"
                value={demoForm.name}
                onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
              />
              <Input
                placeholder="Телефон *"
                type="tel"
                value={demoForm.phone}
                onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
              />
              <Input
                placeholder="Email *"
                type="email"
                value={demoForm.email}
                onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
              />
              <Button
                className="w-full"
                disabled={demoFormSubmitting}
                onClick={async () => {
                  if (!demoForm.name || !demoForm.phone || !demoForm.email) {
                    alert('Заполните имя, телефон и email');
                    return;
                  }
                  const period = demoForm.employeeCount === '365' ? '1 год (559 980 ₽)' : demoForm.employeeCount === '30' ? '30 дней (54 900 ₽)' : 'не выбран';
                  setDemoFormSubmitting(true);
                  try {
                    await fetch('https://functions.poehali.dev/7316b3af-fb17-41b7-a4f3-9195c9f48288', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: demoForm.name,
                        email: 'info@i-hunt.ru',
                        message: `ЗАЯВКА НА ПРОДЛЕНИЕ ПОДПИСКИ\n\nКомпания: ${company?.name || '—'}\nИмя: ${demoForm.name}\nТелефон: ${demoForm.phone}\nEmail: ${demoForm.email}\nВыбранный период: ${period}\nТекущий тариф: ${company?.subscription_tier || '—'}\nОсталось дней: ${subscriptionDaysLeft}`
                      })
                    });
                    setShowSubscriptionDialog(false);
                    setDemoForm({ companyName: '', name: '', phone: '', email: '', employeeCount: '' });
                    alert('✅ Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
                  } catch {
                    alert('Ошибка отправки. Попробуйте позже.');
                  } finally {
                    setDemoFormSubmitting(false);
                  }
                }}
              >
                {demoFormSubmitting ? (
                  <><Icon name="Loader2" className="mr-2 animate-spin" size={16} />Отправка...</>
                ) : (
                  <><Icon name="CreditCard" className="mr-2" size={16} />Отправить заявку</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Уведомления</DialogTitle>
            <DialogDescription>Последние обновления и события</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-4 max-h-[500px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Bell" size={48} className="mx-auto mb-2 opacity-20" />
                <p>Нет новых уведомлений</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={`cursor-pointer transition-all ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => {
                    setNotifications(notifications.map(n => 
                      n.id === notif.id ? { ...n, read: true } : n
                    ));
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        notif.type === 'recommendation' ? 'bg-blue-100' :
                        notif.type === 'subscription' ? 'bg-orange-100' :
                        'bg-green-100'
                      }`}>
                        <Icon 
                          name={
                            notif.type === 'recommendation' ? 'UserPlus' :
                            notif.type === 'subscription' ? 'CreditCard' :
                            'CheckCircle'
                          } 
                          className={
                            notif.type === 'recommendation' ? 'text-blue-600' :
                            notif.type === 'subscription' ? 'text-orange-600' :
                            'text-green-600'
                          }
                          size={20} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.date).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="pt-4 border-t">
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              Отметить все как прочитанные
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <VacancyDetail
        vacancy={selectedVacancyDetail}
        open={showVacancyDetail}
        onOpenChange={setShowVacancyDetail}
        showRecommendButton={false}
      />

      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Комментарии</DialogTitle>
            <DialogDescription>
              {activeNewsPost?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {activeNewsPost && activeNewsPost.comments.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">Пока нет комментариев</p>
                <p className="text-sm text-muted-foreground mt-1">Будьте первым!</p>
              </div>
            ) : (
              activeNewsPost?.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {comment.authorName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.comment}</p>
                      </div>
                      {userRole === 'employer' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Icon name="Trash2" size={14} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder="Написать комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    );
  };

  const renderEmployeeDashboard = () => {
    const employeeNotifications = notifications.filter(n => n.type !== 'subscription');
    
    return (
    <>
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
              <Icon name="Rocket" className="text-white" size={20} />
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">iHUNT</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotificationsDialog(true)}>
              <Icon name="Bell" size={18} />
              {employeeNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs">
                  {employeeNotifications.filter(n => !n.read).length}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => setShowCompanyProfileDialog(true)} size="icon" className="sm:hidden">
              <Icon name="Building2" size={18} />
            </Button>
            <Button variant="ghost" onClick={() => setShowCompanyProfileDialog(true)} size="sm" className="hidden sm:flex">
              <Icon name="Building2" className="mr-2" size={18} />
              <span className="hidden lg:inline">О компании</span>
            </Button>
            <Button variant="ghost" onClick={handleOpenChat} className="relative hidden sm:flex" size="sm">
              <Icon name="MessageCircle" className="mr-2" size={18} />
              <span className="hidden lg:inline">Чат с HR</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={handleOpenChat} className="relative sm:hidden" size="icon">
              <Icon name="MessageCircle" size={18} />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                  {unreadMessagesCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={handleLogout} size="sm" className="text-xs sm:text-sm">Выход</Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="md:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                  <AvatarImage src={employees.find(e => e.id === currentEmployeeId)?.avatar} />
                  <AvatarFallback>
                    {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 w-full">
                  <CardTitle className="text-lg sm:text-2xl flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span>{currentUser?.first_name} {currentUser?.last_name}</span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs">
                      🏆 #{calculateEmployeeRank(employees.find(e => e.id === currentEmployeeId) || employees[0])} в рейтинге
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <span>{employees.find(e => e.id === currentEmployeeId)?.position || currentUser?.position} • {employees.find(e => e.id === currentEmployeeId)?.department || currentUser?.department}</span>
                    {(employees.find(e => e.id === currentEmployeeId)?.hired || 0) >= 5 && (
                      <span className="text-primary font-medium">• Мастер рекрутинга</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial text-xs" onClick={() => {
                    const currentEmployee = employees.find(e => e.id === currentEmployeeId);
                    if (currentEmployee) {
                      const names = currentEmployee.name.split(' ');
                      setEditProfileForm({
                        firstName: names[0] || '',
                        lastName: names[1] || '',
                        position: currentEmployee.position || '',
                        department: currentEmployee.department || ''
                      });
                      setProfileForm({
                        phone: currentEmployee.phone || '',
                        telegram: currentEmployee.telegram || '',
                        vk: currentEmployee.vk || '',
                        avatar: currentEmployee.avatar || ''
                      });
                    }
                    setShowEditProfileDialog(true);
                  }}>
                    <Icon name="Edit" size={14} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Редактировать профиль</span>
                    <span className="sm:hidden">Редактировать</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <div className="space-y-3 sm:space-y-4">
                {(() => {
                  const emp = employees.find(e => e.id === currentEmployeeId);
                  const level = emp?.level || 1;
                  const xp = emp?.experiencePoints || 0;
                  const xpForNextLevel = level * 100;
                  const xpProgress = Math.min(100, Math.round((xp / xpForNextLevel) * 100));
                  return (
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-2">
                        <span className="font-medium">Уровень {level}</span>
                        <span className="text-muted-foreground">{xp} / {xpForNextLevel} XP</span>
                      </div>
                      <Progress value={xpProgress} className="h-2" />
                    </div>
                  );
                })()}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1">🎯</div>
                    <div className="text-xl sm:text-2xl font-bold text-primary">
                      {employees.find(e => e.id === currentEmployeeId)?.recommendations || 0}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Рекомендаций</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1">✅</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">
                      {employees.find(e => e.id === currentEmployeeId)?.hired || 0}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Нанято</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl mb-1">💸</div>
                    <div className="text-xl sm:text-2xl font-bold text-secondary">
                      {(employees.find(e => e.id === currentEmployeeId)?.earnings || 0).toLocaleString()} ₽
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Заработано</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <span className="text-xl sm:text-2xl">💰</span>
                Кошелек
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Доступно для выплаты</div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {walletData?.wallet?.wallet_balance?.toLocaleString() || 0} ₽
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-1">Ожидает разблокировки</div>
                <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
                  {walletData?.wallet?.wallet_pending?.toLocaleString() || 0} ₽
                </div>
                {walletData?.pending_payouts && walletData.pending_payouts.length > 0 && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    <Icon name="Clock" size={12} className="inline mr-1" />
                    Следующая: {new Date(walletData.pending_payouts[0].unlock_date).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
              <Button 
                className="w-full text-xs sm:text-sm" 
                variant="outline"
                size="sm"
                onClick={() => setShowWithdrawDialog(true)}
                disabled={(walletData?.wallet?.wallet_balance || 0) === 0}
              >Запросить выплату</Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="news" className="space-y-4 sm:space-y-6" onValueChange={(tab) => {
          if (tab === 'vacancies') setNewVacanciesCount(0);
          if (tab === 'news') setNewNewsCount(0);
          if (tab === 'my-recommendations') setNewRecommendationsCount(0);
          if (tab === 'notifications') setNewNotificationsCount(0);
        }}>
          <ScrollableTabs>
            <TabsList className="inline-flex w-max gap-1">
              <TabsTrigger value="news" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 relative">📢 Новости{newNewsCount > 0 && <Badge className="ml-1.5 px-1.5 py-0 text-[10px] bg-purple-500 text-white border-0 leading-4">+{newNewsCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="vacancies" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 relative">💼 Вакансии{newVacanciesCount > 0 && <Badge className="ml-1.5 px-1.5 py-0 text-[10px] bg-green-500 text-white border-0 leading-4">+{newVacanciesCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="my-recommendations" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 relative">⭐ Рекомендации{newRecommendationsCount > 0 && <Badge className="ml-1.5 px-1.5 py-0 text-[10px] bg-orange-500 text-white border-0 leading-4">+{newRecommendationsCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">🏆 Рейтинг</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2 relative">🔔 Уведомления{newNotificationsCount > 0 && <Badge className="ml-1.5 px-1.5 py-0 text-[10px] bg-red-500 text-white border-0 leading-4">+{newNotificationsCount}</Badge>}</TabsTrigger>
              <TabsTrigger value="wallet-history" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">💳 История</TabsTrigger>
              <TabsTrigger value="help" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">❓ Помощь</TabsTrigger>
              <TabsTrigger value="games" className="text-xs sm:text-sm whitespace-nowrap px-3 py-2">🎮 Игры</TabsTrigger>

            </TabsList>
          </ScrollableTabs>

          <TabsContent value="news" className="space-y-4">
            <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <span>📢 Новости компании</span>
              <span className="hidden sm:inline"></span>
            </h2>
            
            {newsPosts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Newspaper" className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground">Пока нет новостей</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {newsPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 sm:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          post.category === 'news' ? 'default' :
                          post.category === 'achievement' ? 'secondary' :
                          post.category === 'announcement' ? 'outline' :
                          'default'
                        } className="text-[10px] sm:text-xs">
                          {post.category === 'news' ? '📰 Новость' :
                           post.category === 'achievement' ? '🏆 Достижение' :
                           post.category === 'announcement' ? '📢 Объявление' :
                           '✍️ Блог'}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(post.date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <CardTitle className="text-base sm:text-xl">{post.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Автор: {post.author}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                    <CardFooter className="border-t pt-3 sm:pt-4 p-3 sm:p-6">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 sm:gap-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLikeNews(post.id)}
                          >
                            <Icon name="Heart" className="mr-1" size={16} />
                            {post.likes}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setActiveNewsPost(post);
                              setShowCommentsDialog(true);
                            }}
                          >
                            <Icon name="MessageCircle" className="mr-1" size={16} />
                            {post.comments.length}
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="vacancies" className="space-y-4">
            {isSubscriptionExpired ? (
              <SubscriptionExpiredBlock onRenew={() => setShowSubscriptionDialog(true)} />
            ) : (<>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
              <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
                <span>💼 Вакансии</span>
                <span className="hidden sm:inline"></span>
              </h2>
            </div>
            <div className="mb-4">
              <Input
                placeholder="Поиск..."
                value={vacancySearchQuery}
                onChange={(e) => setVacancySearchQuery(e.target.value)}
                className="w-full text-sm"
              />
            </div>

            <div className="grid gap-4">
              {vacancies.filter(v =>
                vacancySearchQuery === '' ||
                v.title.toLowerCase().includes(vacancySearchQuery.toLowerCase()) ||
                v.department.toLowerCase().includes(vacancySearchQuery.toLowerCase())
              ).map((vacancy) => (
                <Card 
                  key={vacancy.id} 
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-3 sm:p-6 relative">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveVacancy(vacancy);
                          }}
                        >
                          <Icon name="UserPlus" size={18} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent onClick={(e) => e.stopPropagation()}>
                          <DialogHeader>
                            <DialogTitle>Данные кандидата</DialogTitle>
                            <DialogDescription>
                              Вакансия: {activeVacancy?.title}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label htmlFor="candidate-name">ФИО кандидата <span className="text-destructive">*</span></Label>
                              <Input 
                                id="candidate-name" 
                                placeholder="Иван Иванов"
                                value={recommendationForm.name}
                                onChange={(e) => setRecommendationForm({...recommendationForm, name: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="candidate-phone">Телефон <span className="text-destructive">*</span></Label>
                              <Input 
                                id="candidate-phone" 
                                placeholder="+7 (999) 123-45-67"
                                value={recommendationForm.phone}
                                onChange={(e) => setRecommendationForm({...recommendationForm, phone: e.target.value})}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="candidate-email">Email</Label>
                              <Input 
                                id="candidate-email" 
                                type="email" 
                                placeholder="ivan@example.com"
                                value={recommendationForm.email}
                                onChange={(e) => setRecommendationForm({...recommendationForm, email: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="comment">Сопроводительное письмо <span className="text-destructive">*</span></Label>
                              <Textarea 
                                id="comment" 
                                placeholder="Почему этот кандидат подходит..." 
                                rows={3}
                                value={recommendationForm.comment}
                                onChange={(e) => setRecommendationForm({...recommendationForm, comment: e.target.value})}
                              />
                            </div>
                            <div className="bg-primary/10 p-4 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Icon name="Award" className="text-primary" size={20} />
                                <span className="font-medium">Вознаграждение за успешный найм</span>
                              </div>
                              <div className="text-2xl font-bold text-primary">{activeVacancy?.reward.toLocaleString()} ₽</div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activeVacancy?.payoutDelayDays === 0 
                                  ? 'Выплата сразу после найма'
                                  : `Выплата через ${activeVacancy?.payoutDelayDays} ${activeVacancy?.payoutDelayDays === 1 ? 'день' : (activeVacancy?.payoutDelayDays ?? 0) < 5 ? 'дня' : 'дней'} после найма`
                                }
                              </p>
                            </div>
                            <Button 
                              className="w-full" 
                              disabled={!recommendationForm.name || !recommendationForm.phone || !recommendationForm.comment}
                              onClick={() => activeVacancy && handleCreateRecommendation({
                                vacancyId: activeVacancy.id,
                                name: recommendationForm.name,
                                email: recommendationForm.email,
                                phone: recommendationForm.phone,
                                comment: recommendationForm.comment
                              })}
                            >
                              Отправить рекомендацию
                            </Button>
                          </div>
                        </DialogContent>
                    </Dialog>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0 pr-10">
                      <div 
                        className="flex-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => {
                          if (vacancy.referralLink) {
                            window.open(vacancy.referralLink, '_blank');
                          }
                        }}
                      >
                        <CardTitle className="text-sm sm:text-lg">{vacancy.title}</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">{vacancy.department}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                          <Icon name="Wallet" size={14} className="text-muted-foreground" />
                          <span className="truncate">{vacancy.salary}</span>
                        </div>
                        {vacancy.city && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <Icon name={vacancy.isRemote ? "Home" : "MapPin"} size={14} className="text-muted-foreground" />
                            <span className="truncate">{vacancy.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary">
                          <Icon name="Award" size={14} />
                          <span className="font-medium">{vacancy.reward.toLocaleString()} ₽</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Icon name="Clock" size={14} />
                          <span>Выплата через {vacancy.payoutDelayDays} {vacancy.payoutDelayDays === 1 ? 'день' : vacancy.payoutDelayDays < 5 ? 'дня' : 'дней'} после найма</span>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-[10px] sm:text-xs text-muted-foreground">Ссылка на вакансию</Label>
                        <div className="flex gap-1 sm:gap-2">
                          <Input 
                            value={vacancy.referralLink} 
                            readOnly 
                            className="text-[10px] sm:text-xs flex-1" 
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button size="sm" variant="outline" className="px-2 sm:px-3" onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(vacancy.referralLink || '');
                            alert('Ссылка скопирована');
                          }}>
                            <Icon name="Copy" size={14} />
                          </Button>
                        </div>
                        <Button size="sm" className="sm:hidden w-full text-xs bg-primary text-primary-foreground hover:bg-primary/90" onClick={(e) => {
                          e.stopPropagation();
                          const text = `Привет! Смотри, есть отличная вакансия "${vacancy.title}" в нашей компании. Зарплата ${vacancy.salary}. Вот ссылка: ${vacancy.referralLink}`;
                          if (navigator.share) {
                            navigator.share({
                              title: vacancy.title,
                              text: text,
                              url: vacancy.referralLink
                            }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(text);
                            alert('Текст скопирован');
                          }
                        }}>
                          <Icon name="Share2" size={14} className="mr-2" />
                          Поделиться вакансией
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            </>)}
          </TabsContent>

          <TabsContent value="my-recommendations" className="space-y-4">
            <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <span>⭐ Мои рекомендации</span>
              <span className="hidden sm:inline"></span>
            </h2>
            <div className="grid gap-4">
              {recommendations.filter(r => r.employeeId === currentEmployeeId).map((rec) => (
                <Card 
                  key={rec.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedCandidate(rec);
                    setShowCandidateDetail(true);
                  }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{rec.candidateName}</CardTitle>
                        <CardDescription>{rec.vacancyTitle || rec.vacancy}</CardDescription>
                      </div>
                      <Badge variant={
                        rec.status === 'hired' || rec.status === 'accepted' ? 'default' : 
                        rec.status === 'rejected' ? 'destructive' :
                        rec.status === 'interview' ? 'outline' :
                        'secondary'
                      } className={rec.status === 'accepted' ? 'bg-green-600 hover:bg-green-600' : ''}>
                        {rec.status === 'hired' || rec.status === 'accepted' ? 'Принят' : 
                         rec.status === 'rejected' ? 'Отклонён' : 
                         rec.status === 'interview' ? 'На интервью' :
                         'На рассмотрении'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={16} />
                        <span>{new Date(rec.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Award" size={16} />
                        <span>{rec.reward.toLocaleString()} ₽</span>
                      </div>
                      {(rec.status === 'accepted' || rec.status === 'hired') && rec.acceptedDate && (() => {
                        const acceptedDate = new Date(rec.acceptedDate);
                        const today = new Date();
                        const daysPassed = Math.floor((today.getTime() - acceptedDate.getTime()) / (1000 * 60 * 60 * 24));
                        const delayDays = rec.payoutDelayDays ?? 30;
                        const daysRemaining = Math.max(0, delayDays - daysPassed);
                        
                        return (
                          <div className={`flex items-center gap-1 ${daysRemaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                            <Icon name="Clock" size={16} />
                            <span>
                              {daysRemaining > 0 
                                ? `Выплата через ${daysRemaining} ${daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}`
                                : '✓ Выплата доступна'
                              }
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <span>🏆 Достижения и рейтинг</span>
              <span className="hidden sm:inline"></span>
            </h2>
            
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-xl">
                  <Icon name="Trophy" size={20} className="text-primary" />
                  <span className="hidden sm:inline">Рейтинг сотрудников</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {employees
                    .sort((a, b) => {
                      if (b.hired !== a.hired) return b.hired - a.hired;
                      if (b.recommendations !== a.recommendations) return b.recommendations - a.recommendations;
                      return b.earnings - a.earnings;
                    })
                    .slice(0, 10)
                    .map((emp, idx) => (
                      <div key={emp.id} className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${emp.id === currentEmployeeId ? 'bg-primary/20 border-2 border-primary' : 'bg-background'}`}>
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                          idx === 0 ? 'bg-yellow-500 text-white' :
                          idx === 1 ? 'bg-gray-400 text-white' :
                          idx === 2 ? 'bg-orange-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {idx + 1}
                        </div>
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex">
                          <AvatarFallback>{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate">{emp.name}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            {emp.hired} нанято <span className="hidden sm:inline">• {emp.recommendations} рекомендаций</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary text-xs sm:text-sm">
                            {emp.hired >= 10 ? '👑 Легенда' :
                             emp.hired >= 5 ? '⭐ Мастер' :
                             emp.hired >= 3 ? '🎯 Профи' :
                             emp.hired >= 1 ? '🌟 Новичок' : '🔰 Старт'}
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-6">Мои достижения</h3>
            {(() => {
              const me = employees.find(e => e.id === currentEmployeeId);
              const myRecs = recommendations.filter(r => r.employeeId === currentEmployeeId);
              const myHires = me?.hired || 0;
              const myRecsCount = me?.recommendations || 0;
              const firstRec = myRecs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
              const hasFirstRec = myRecsCount >= 1;
              const hasSharpEye = myHires >= 3;
              const recruiterProgress = Math.min(myHires, 5);
              const goldProgress = Math.min(myHires, 10);
              return (
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card className={!hasFirstRec ? 'opacity-50' : ''}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                          <Icon name="Star" className="text-yellow-600" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-lg truncate">Первая рекомендация</div>
                          {hasFirstRec && firstRec
                            ? <div className="text-xs sm:text-sm text-muted-foreground">Получено {new Date(firstRec.date).toLocaleDateString('ru-RU')}</div>
                            : <div className="text-xs sm:text-sm text-muted-foreground">{myRecsCount}/1 рекомендаций<Progress value={myRecsCount * 100} className="h-1 mt-2" /></div>
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={!hasSharpEye ? 'opacity-50' : ''}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Icon name="Target" className="text-green-600" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-lg truncate">Меткий глаз</div>
                          {hasSharpEye
                            ? <div className="text-xs sm:text-sm text-muted-foreground">3 успешных найма выполнено ✓</div>
                            : <div className="text-xs sm:text-sm text-muted-foreground">{myHires}/3 успешных найма<Progress value={Math.round((myHires / 3) * 100)} className="h-1 mt-2" /></div>
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={myHires < 5 ? 'opacity-50' : ''}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Icon name="Award" className="text-purple-600" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-lg truncate">Рекрутер месяца</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">{recruiterProgress}/5 наймов</div>
                          <Progress value={Math.round((recruiterProgress / 5) * 100)} className="h-1 mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={myHires < 10 ? 'opacity-50' : ''}>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Icon name="Crown" className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm sm:text-lg truncate">Золотой рекрутер</div>
                          <div className="text-xs sm:text-sm text-muted-foreground">{goldProgress}/10 успешных наймов</div>
                          <Progress value={Math.round((goldProgress / 10) * 100)} className="h-1 mt-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="wallet-history" className="space-y-4">
            <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
              <span>💳 История кошелька</span>
              <span className="hidden sm:inline"></span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {recommendations.filter(r => r.employeeId === currentEmployeeId && (r.status === 'accepted' || r.status === 'hired')).length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    История транзакций пуста
                  </CardContent>
                </Card>
              ) : recommendations.filter(r => r.employeeId === currentEmployeeId && (r.status === 'accepted' || r.status === 'hired')).map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          rec.status === 'accepted' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <Icon name={rec.status === 'accepted' ? 'Clock' : 'CheckCircle'}
                                className={rec.status === 'accepted' ? 'text-yellow-600' : 'text-green-600'}
                                size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate">Вознаграждение за рекомендацию {rec.candidateName}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            {new Date(rec.date).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                      <div className={`text-sm sm:text-lg font-bold flex-shrink-0 ${
                        rec.status === 'accepted' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        +{(rec.reward || 0).toLocaleString()} ₽
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <span>🔔 Уведомления</span>
              <span className="hidden sm:inline"></span>
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {notifications
                .filter(n => {
                  if (userRole === 'employee') {
                    return n.type !== 'subscription';
                  }
                  return true;
                })
                .map((notif) => (
                  <Card key={notif.id} className={notif.read ? 'opacity-60' : ''}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                          notif.type === 'recommendation' ? 'bg-blue-100' :
                          notif.type === 'hire' ? 'bg-green-100' :
                          notif.type === 'payout' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          <Icon 
                            name={
                              notif.type === 'recommendation' ? 'UserPlus' :
                              notif.type === 'hire' ? 'CheckCircle' :
                              notif.type === 'payout' ? 'DollarSign' :
                              'Bell'
                            }
                            size={16}
                            className={
                              notif.type === 'recommendation' ? 'text-blue-600' :
                              notif.type === 'hire' ? 'text-green-600' :
                              notif.type === 'payout' ? 'text-yellow-600' :
                              'text-gray-600'
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm">{notif.message}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                            {new Date(notif.date).toLocaleDateString('ru-RU', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {!notif.read && (
                          <Badge variant="default" className="text-[10px] sm:text-xs flex-shrink-0">Новое</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
              {notifications.filter(n => userRole === 'employee' ? n.type !== 'subscription' : true).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Icon name="Bell" size={48} className="mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Нет уведомлений</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
                <span>❓ Помощь</span>
              </h2>
              <p className="text-muted-foreground">Узнайте, как использовать платформу для заработка на рекомендациях</p>
            </div>

            <div className="grid gap-6">
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Target" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Рекомендация кандидатов</CardTitle>
                      <CardDescription className="mt-1">Зарабатывайте на успешных рекомендациях знакомых специалистов</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="Search" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Поиск вакансий:</strong> Просмотрите открытые позиции во вкладке Вакансии и найдите те, где вы можете помочь</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="UserPlus" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Отправка рекомендации:</strong> Нажмите "Рекомендовать кандидата", заполните контакты и опишите, почему этот человек подходит. Также можно пригласить кандидата по реферальной ссылке</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Award" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Вознаграждение:</strong> Размер бонуса указан в каждой вакансии — вы получите его после успешного найма вашего кандидата</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="ClipboardList" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Отслеживание статусов</CardTitle>
                      <CardDescription className="mt-1">Следите за прогрессом ваших рекомендаций</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="Eye" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Мои рекомендации:</strong> Во вкладке Рекомендации вы видите всех предложенных кандидатов и их текущий статус</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Clock" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Статусы:</strong> Ожидание — HR рассматривает, Интервью — кандидат на собеседовании, Принят — успех!</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Bell" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Уведомления:</strong> Вы получите оповещение при любом изменении статуса вашей рекомендации</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Wallet" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Управление кошельком</CardTitle>
                      <CardDescription className="mt-1">Следите за балансом и выводите заработанные средства</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="DollarSign" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Начисления:</strong> После найма вашего кандидата вознаграждение автоматически зачисляется на ваш баланс</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Download" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Вывод средств:</strong> Нажмите "Вывести средства" в карточке кошелька, укажите сумму и реквизиты (карта, СБП или счёт)</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="History" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>История операций:</strong> Во вкладке История отображаются все начисления и выплаты с подробной информацией</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Trophy" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Рейтинг и достижения</CardTitle>
                      <CardDescription className="mt-1">Соревнуйтесь с коллегами и получайте признание</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="BarChart3" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Таблица лидеров:</strong> Во вкладке Рейтинг смотрите топ сотрудников по количеству успешных рекомендаций</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Medal" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Бейджи:</strong> Зарабатывайте значки за достижения: первую рекомендацию, серии наймов и активность</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="Zap" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Мотивация:</strong> Чем больше успешных рекомендаций, тем выше ваша репутация в компании</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Newspaper" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Новости компании</CardTitle>
                      <CardDescription className="mt-1">Будьте в курсе важных событий и обновлений</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="Megaphone" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Анонсы:</strong> Узнавайте первыми о новых вакансиях, изменениях в бонусной программе и достижениях компании</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="MessageCircle" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Комментарии:</strong> Обсуждайте новости с коллегами и задавайте вопросы HR-отделу</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="ThumbsUp" className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p><strong>Реакции:</strong> Ставьте лайки и выражайте своё мнение о публикациях</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon name="Lightbulb" className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Советы для успеха</CardTitle>
                      <CardDescription className="mt-1">Как рекомендовать эффективно</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Качество, а не количество:</strong> Рекомендуйте только тех, кто действительно соответствует требованиям вакансии</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Детальная информация:</strong> Чем больше полезных деталей о кандидате вы укажете, тем выше шанс на успех</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Предупредите кандидата:</strong> Убедитесь, что человек готов рассмотреть предложение, прежде чем его рекомендовать</p>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="CheckCircle2" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p><strong>Будьте активны:</strong> Регулярно проверяйте новые вакансии — возможность заработать может появиться в любой момент</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">🎮 Мини-игры</h2>
            <p className="text-sm text-muted-foreground">Отдохни — здесь можно поиграть в перерыве</p>
            <GamesTab />
          </TabsContent>

          {currentUser?.is_hr_manager && (
            <TabsContent value="hr-vacancies" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
                    <span>👔</span> Управление вакансиями
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Доступ HR Manager</p>
                </div>
              </div>
              <div className="grid gap-4">
                {vacancies.sort((a, b) => {
                  if (a.status === 'archived' && b.status !== 'archived') return 1;
                  if (a.status !== 'archived' && b.status === 'archived') return -1;
                  return 0;
                }).map((vacancy) => (
                  <Card key={vacancy.id}>
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base">{vacancy.title}</CardTitle>
                          <CardDescription>{vacancy.department}</CardDescription>
                        </div>
                        <Badge variant={vacancy.status === 'active' ? 'default' : 'secondary'}>
                          {vacancy.status === 'active' ? 'Активна' : 'Архив'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                        <span>💰 {vacancy.salary}</span>
                        <span>🎁 {vacancy.reward.toLocaleString()} ₽</span>
                        <span>👥 {vacancy.candidates} кандидатов</span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {vacancies.length === 0 && (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">Вакансий нет</CardContent></Card>
                )}
              </div>
            </TabsContent>
          )}

          {currentUser?.is_hr_manager && (
            <TabsContent value="hr-recommendations" className="space-y-4">
              <div className="mb-4">
                <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2">
                  <span>👔</span> Все рекомендации
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Доступ HR Manager</p>
              </div>
              <div className="grid gap-4">
                {recommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{rec.candidateName}</CardTitle>
                          <CardDescription>{rec.vacancyTitle}</CardDescription>
                        </div>
                        <Badge variant={
                          rec.status === 'hired' ? 'default' :
                          rec.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {rec.status === 'pending' ? 'Новая' :
                           rec.status === 'accepted' ? 'Принята' :
                           rec.status === 'interview' ? 'Интервью' :
                           rec.status === 'hired' ? 'Нанят' : 'Отклонена'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {rec.candidatePhone && <span>📞 {rec.candidatePhone}</span>}
                        {rec.candidateEmail && <span className="ml-3">✉️ {rec.candidateEmail}</span>}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {recommendations.length === 0 && (
                  <Card><CardContent className="py-12 text-center text-muted-foreground">Рекомендаций нет</CardContent></Card>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Dialog open={showCompanyProfileDialog} onOpenChange={setShowCompanyProfileDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Профиль компании</DialogTitle>
            <DialogDescription>Информация о вашей компании</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={company.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <Icon name="Building2" className="text-primary" size={40} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{company?.name || '—'}</h3>
                <p className="text-muted-foreground">{company?.industry || ''}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              {company?.description && (
                <div>
                  <Label className="text-sm font-medium">О компании</Label>
                  <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {company?.website && (
                  <div>
                    <Label className="text-sm font-medium">Веб-сайт</Label>
                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" className="text-sm text-primary hover:underline mt-1 flex items-center gap-1">
                      {company.website.replace(/^https?:\/\//, '')}
                      <Icon name="ExternalLink" size={14} />
                    </a>
                  </div>
                )}
                {company?.size && (
                  <div>
                    <Label className="text-sm font-medium">Количество сотрудников</Label>
                    <p className="text-sm text-muted-foreground mt-1">{company.size}</p>
                  </div>
                )}
                {company?.telegram && (
                  <div>
                    <Label className="text-sm font-medium">Telegram</Label>
                    <a href={company.telegram.startsWith('http') ? company.telegram : `https://t.me/${company.telegram.replace(/^@/, '')}`} target="_blank" className="text-sm text-primary hover:underline mt-1 flex items-center gap-1">
                      <Icon name="Send" size={14} />
                      {company.telegram}
                    </a>
                  </div>
                )}
                {company?.vk && (
                  <div>
                    <Label className="text-sm font-medium">ВКонтакте</Label>
                    <a href={company.vk.startsWith('http') ? company.vk : `https://${company.vk}`} target="_blank" className="text-sm text-primary hover:underline mt-1 flex items-center gap-1">
                      <Icon name="MessageCircle" size={14} />
                      {company.vk}
                    </a>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Открытые вакансии</Label>
                <p className="text-sm text-muted-foreground mt-1">{vacancies.length} активных вакансий</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Загрузка базы сотрудников</DialogTitle>
            <DialogDescription>
              Выберите источник для автоматической загрузки сотрудников
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <Label htmlFor="integration-source">Источник данных</Label>
              <Select 
                value={integrationForm.source} 
                onValueChange={(value) => setIntegrationForm({...integrationForm, source: value})}
              >
                <SelectTrigger id="integration-source" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1c">
                    <div className="flex items-center gap-2">
                      <Icon name="Database" size={16} />
                      <span>1С: Предприятие</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Дополнительные интеграции будут добавлены в ближайшее время
              </p>
            </div>

            {integrationForm.source === '1c' && (
              <>
                <div>
                  <Label htmlFor="api-url">URL API 1С</Label>
                  <Input
                    id="api-url"
                    placeholder="https://your-1c-server.com/api/employees"
                    value={integrationForm.apiUrl}
                    onChange={(e) => setIntegrationForm({...integrationForm, apiUrl: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Укажите адрес API для получения списка сотрудников
                  </p>
                </div>

                <div>
                  <Label htmlFor="api-key">Ключ API</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Введите ключ доступа"
                    value={integrationForm.apiKey}
                    onChange={(e) => setIntegrationForm({...integrationForm, apiKey: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ключ для авторизации запросов к API 1С
                  </p>
                </div>

                <div>
                  <Label htmlFor="sync-interval">Периодичность синхронизации</Label>
                  <Select 
                    value={integrationForm.syncInterval} 
                    onValueChange={(value) => setIntegrationForm({...integrationForm, syncInterval: value})}
                  >
                    <SelectTrigger id="sync-interval" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Вручную</SelectItem>
                      <SelectItem value="daily">Ежедневно</SelectItem>
                      <SelectItem value="weekly">Еженедельно</SelectItem>
                      <SelectItem value="monthly">Ежемесячно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex gap-3">
                      <Icon name="Info" className="text-blue-600 mt-0.5" size={18} />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-blue-900">Что будет загружено из 1С:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800">
                          <li>ФИО сотрудников</li>
                          <li>Должности и отделы</li>
                          <li>Контактные данные (email, телефон)</li>
                          <li>Статус сотрудника (работает/уволен)</li>
                        </ul>
                        <p className="text-xs text-blue-700 mt-2">
                          Существующие сотрудники будут обновлены, новые — добавлены
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                className="flex-1"
                onClick={() => {
                  alert('Интеграция настроена! Загрузка сотрудников начнется автоматически.');
                  setShowIntegrationDialog(false);
                }}
                disabled={!integrationForm.apiUrl || !integrationForm.apiKey}
              >
                <Icon name="Download" size={16} className="mr-2" />
                Настроить интеграцию
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowIntegrationDialog(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl h-[90vh] sm:h-[600px] flex flex-col p-0">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-base sm:text-lg">Чат с HR отделом</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Задайте вопросы о рекомендациях и вакансиях</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-4 px-4">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[70%] ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg px-3 sm:px-4 py-2`}>
                  <div className="text-[10px] sm:text-xs opacity-70 mb-1">{msg.senderName}</div>
                  {msg.message && <div className="text-xs sm:text-sm mb-2">{msg.message}</div>}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {msg.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'image' ? (
                            <img 
                              src={attachment.url} 
                              alt={attachment.name}
                              className="rounded max-w-full h-auto cursor-pointer hover:opacity-90 transition"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          ) : (
                            <a 
                              href={attachment.url} 
                              download={attachment.name}
                              className={`flex items-center gap-2 p-2 rounded ${msg.isOwn ? 'bg-primary-foreground/10' : 'bg-background'} hover:opacity-80 transition`}
                            >
                              <Icon name="File" size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] sm:text-xs font-medium truncate">{attachment.name}</div>
                                {attachment.size && (
                                  <div className="text-[10px] sm:text-xs opacity-70">{(attachment.size / 1024).toFixed(1)} KB</div>
                                )}
                              </div>
                              <Icon name="Download" size={12} className="sm:w-[14px] sm:h-[14px] flex-shrink-0" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] sm:text-xs opacity-70 mt-1">{msg.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-4 border-t px-4 pb-4">
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-muted px-2 sm:px-3 py-1.5 sm:py-2 rounded text-xs sm:text-sm">
                    <Icon name={file.type.startsWith('image/') ? 'Image' : 'File'} size={14} />
                    <span className="max-w-[100px] sm:max-w-[150px] truncate">{file.name}</span>
                    <button 
                      onClick={() => removeFile(idx)}
                      className="hover:text-destructive transition"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
              >
                <Icon name="Paperclip" size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>
              <Input 
                placeholder="Введите сообщение..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                className="text-sm sm:text-base"
              />
              <Button onClick={handleSendMessage} className="h-9 w-9 sm:h-10 sm:w-10 p-0 flex-shrink-0">
                <Icon name="Send" size={16} className="sm:w-[18px] sm:h-[18px]" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Уведомления</DialogTitle>
            <DialogDescription>Последние обновления и события</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-4 max-h-[500px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Bell" size={48} className="mx-auto mb-2 opacity-20" />
                <p>Нет новых уведомлений</p>
                <p className="text-xs mt-1">Здесь появятся уведомления о новых вакансиях, изменениях статусов кандидатов, сообщениях и балансе</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <Card 
                  key={notif.id} 
                  className={`cursor-pointer transition-all ${!notif.read ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => {
                    setNotifications(notifications.map(n => 
                      n.id === notif.id ? { ...n, read: true } : n
                    ));
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.type === 'recommendation' ? 'bg-blue-100' :
                        notif.type === 'subscription' ? 'bg-orange-100' :
                        notif.type === 'vacancy' ? 'bg-purple-100' :
                        notif.type === 'wallet' ? 'bg-green-100' :
                        notif.type === 'chat' ? 'bg-indigo-100' :
                        notif.type === 'news' ? 'bg-yellow-100' :
                        notif.type === 'employee' ? 'bg-teal-100' :
                        notif.type === 'payout' ? 'bg-rose-100' :
                        'bg-gray-100'
                      }`}>
                        <Icon 
                          name={
                            notif.type === 'recommendation' ? 'UserPlus' :
                            notif.type === 'subscription' ? 'CreditCard' :
                            notif.type === 'vacancy' ? 'Briefcase' :
                            notif.type === 'wallet' ? 'Wallet' :
                            notif.type === 'chat' ? 'MessageCircle' :
                            notif.type === 'news' ? 'Newspaper' :
                            notif.type === 'employee' ? 'UserCheck' :
                            notif.type === 'payout' ? 'Banknote' :
                            'Bell'
                          } 
                          className={
                            notif.type === 'recommendation' ? 'text-blue-600' :
                            notif.type === 'subscription' ? 'text-orange-600' :
                            notif.type === 'vacancy' ? 'text-purple-600' :
                            notif.type === 'wallet' ? 'text-green-600' :
                            notif.type === 'chat' ? 'text-indigo-600' :
                            notif.type === 'news' ? 'text-yellow-600' :
                            notif.type === 'employee' ? 'text-teal-600' :
                            notif.type === 'payout' ? 'text-rose-600' :
                            'text-gray-600'
                          }
                          size={18} 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(notif.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="pt-4 border-t flex gap-2">
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              Прочитать все
            </Button>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground"
                onClick={() => setNotifications([])}
              >
                Очистить
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>

      <Dialog open={showEditProfileDialog} onOpenChange={setShowEditProfileDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Изменить профиль</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Обновите информацию о вашем профиле и контакты
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="firstName" className="text-xs sm:text-sm">Имя</Label>
                <Input 
                  id="firstName" 
                  className="mt-1 text-sm"
                  value={editProfileForm.firstName}
                  onChange={(e) => setEditProfileForm({...editProfileForm, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs sm:text-sm">Фамилия</Label>
                <Input 
                  id="lastName" 
                  className="mt-1 text-sm"
                  value={editProfileForm.lastName}
                  onChange={(e) => setEditProfileForm({...editProfileForm, lastName: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="position" className="text-xs sm:text-sm">Должность</Label>
                <Input 
                  id="position" 
                  className="mt-1 text-sm"
                  value={editProfileForm.position}
                  onChange={(e) => setEditProfileForm({...editProfileForm, position: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-xs sm:text-sm">Отдел</Label>
                <Input 
                  id="department" 
                  className="mt-1 text-sm"
                  value={editProfileForm.department}
                  onChange={(e) => setEditProfileForm({...editProfileForm, department: e.target.value})}
                />
              </div>
            </div>
            <div className="border-t pt-3 sm:pt-4">
              <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">Контактная информация</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm">Телефон</Label>
                  <Input
                    className="mt-1 text-sm"
                    placeholder="+7 (900) 123-45-67"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Telegram</Label>
                  <Input
                    className="mt-1 text-sm"
                    placeholder="@username"
                    value={profileForm.telegram}
                    onChange={(e) => setProfileForm({...profileForm, telegram: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">ВКонтакте</Label>
                  <Input
                    className="mt-1 text-sm"
                    placeholder="vk.com/username"
                    value={profileForm.vk}
                    onChange={(e) => setProfileForm({...profileForm, vk: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs sm:text-sm">Фото профиля</Label>
              <div className="flex items-center gap-3 mt-1">
                {profileForm.avatar && (
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16 shrink-0">
                    <AvatarImage src={profileForm.avatar} />
                    <AvatarFallback>{editProfileForm.firstName?.[0]}{editProfileForm.lastName?.[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileForm({...profileForm, avatar: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="cursor-pointer text-sm"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Выберите изображение</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button 
                className="flex-1 text-sm"
                onClick={async () => {
                  try {
                    await api.updateEmployee(currentEmployeeId, {
                      first_name: editProfileForm.firstName,
                      last_name: editProfileForm.lastName,
                      position: editProfileForm.position,
                      department: editProfileForm.department,
                      phone: profileForm.phone,
                      telegram: profileForm.telegram,
                      vk: profileForm.vk,
                      avatar: profileForm.avatar
                    });
                    await loadData();
                    setShowEditProfileDialog(false);
                    alert('Профиль успешно обновлён!');
                  } catch (error) {
                    console.error('Ошибка обновления профиля:', error);
                    alert('Не удалось обновить профиль');
                  }
                }}
              >
                Сохранить
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-sm"
                onClick={() => setShowEditProfileDialog(false)}
              >
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Комментарии</DialogTitle>
            <DialogDescription>
              {activeNewsPost?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {activeNewsPost && activeNewsPost.comments.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">Пока нет комментариев</p>
                <p className="text-sm text-muted-foreground mt-1">Будьте первым!</p>
              </div>
            ) : (
              activeNewsPost?.comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {comment.authorName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.authorName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.date).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Напишите комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button 
                onClick={handleAddComment}
                className="self-end"
              >
                <Icon name="Send" size={18} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <VacancyDetail
        vacancy={selectedVacancyDetail}
        open={showVacancyDetail}
        onOpenChange={setShowVacancyDetail}
        showRecommendButton={userRole === 'employee'}
        showPublicLink={userRole === 'employer'}
        onRecommend={() => {
          if (selectedVacancyDetail) {
            setShowRecommendDialog(true);
          }
        }}
        onRestore={userRole === 'employer' ? (id) => { handleRestoreVacancy(id); setShowVacancyDetail(false); } : undefined}
      />

      <Dialog open={showRecommendDialog} onOpenChange={setShowRecommendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Рекомендовать кандидата</DialogTitle>
            <DialogDescription>
              Заполните информацию о кандидате на вакансию{' '}
              <strong>{selectedVacancyDetail?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="recommend-name">ФИО кандидата *</Label>
              <Input
                id="recommend-name"
                placeholder="Иван Иванов"
                value={recommendationForm.name}
                onChange={(e) =>
                  setRecommendationForm({ ...recommendationForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="recommend-email">Email *</Label>
              <Input
                id="recommend-email"
                type="email"
                placeholder="ivan@example.com"
                value={recommendationForm.email}
                onChange={(e) =>
                  setRecommendationForm({ ...recommendationForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="recommend-phone">Телефон</Label>
              <Input
                id="recommend-phone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={recommendationForm.phone}
                onChange={(e) =>
                  setRecommendationForm({ ...recommendationForm, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="recommend-comment">Комментарий</Label>
              <Textarea
                id="recommend-comment"
                placeholder="Расскажите о кандидате и почему он подходит на эту позицию..."
                rows={4}
                value={recommendationForm.comment}
                onChange={(e) =>
                  setRecommendationForm({ ...recommendationForm, comment: e.target.value })
                }
              />
            </div>
            <Button
              className="w-full"
              onClick={async () => {
                if (!selectedVacancyDetail) return;
                await handleCreateRecommendation({
                  vacancyId: selectedVacancyDetail.id,
                  name: recommendationForm.name,
                  email: recommendationForm.email,
                  phone: recommendationForm.phone,
                  comment: recommendationForm.comment,
                });
                setShowRecommendDialog(false);
                setShowVacancyDetail(false);
              }}
            >
              <Icon name="Send" className="mr-2" size={18} />
              Отправить рекомендацию
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CandidateDetail
        recommendation={selectedCandidate}
        open={showCandidateDetail}
        onOpenChange={setShowCandidateDetail}
      />

      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запрос на выплату</DialogTitle>
            <DialogDescription>
              Доступно для вывода: {walletData?.wallet?.wallet_balance?.toLocaleString() || 0} ₽
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Сумма</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setWithdrawForm({
                    ...withdrawForm,
                    amount: String(walletData?.wallet?.wallet_balance || 0)
                  })}
                >
                  Вывести всё
                </Button>
              </div>
              <Input
                type="number"
                placeholder="Введите сумму"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                max={walletData?.wallet?.wallet_balance || 0}
                min={0}
                className={
                  withdrawForm.amount && parseFloat(withdrawForm.amount) > (walletData?.wallet?.wallet_balance || 0)
                    ? 'border-red-500'
                    : ''
                }
              />
              <p className={`text-xs mt-1 ${
                withdrawForm.amount && parseFloat(withdrawForm.amount) > (walletData?.wallet?.wallet_balance || 0)
                  ? 'text-red-500'
                  : 'text-muted-foreground'
              }`}>
                {withdrawForm.amount && parseFloat(withdrawForm.amount) > (walletData?.wallet?.wallet_balance || 0)
                  ? `Сумма превышает доступный баланс! `
                  : ''}
                Максимальная сумма: {walletData?.wallet?.wallet_balance?.toLocaleString() || 0} ₽
              </p>
            </div>
            <div>
              <Label>Способ выплаты</Label>
              <Select value={withdrawForm.paymentMethod} onValueChange={(v) => setWithdrawForm({...withdrawForm, paymentMethod: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Банковская карта</SelectItem>
                  <SelectItem value="sbp">СБП</SelectItem>
                  <SelectItem value="account">Расчётный счёт</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {withdrawForm.paymentMethod === 'account' ? (
              <>
                <div>
                  <Label>ФИО получателя <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="Иванов Иван Иванович"
                    value={withdrawForm.accountFullName}
                    onChange={(e) => setWithdrawForm({...withdrawForm, accountFullName: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Банк получателя <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="ПАО Сбербанк"
                    value={withdrawForm.accountBank}
                    onChange={(e) => setWithdrawForm({...withdrawForm, accountBank: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Расчётный счёт <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="40817810099910004312"
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({...withdrawForm, accountNumber: e.target.value})}
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label>БИК <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="044525225"
                    value={withdrawForm.accountBik}
                    onChange={(e) => setWithdrawForm({...withdrawForm, accountBik: e.target.value})}
                    maxLength={9}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Реквизиты <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder={withdrawForm.paymentMethod === 'card' ? '2202 **** **** ****' : '+7 (900) 123-45-67'}
                    value={withdrawForm.paymentDetails}
                    onChange={(e) => setWithdrawForm({...withdrawForm, paymentDetails: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Наименование банка <span className="text-destructive">*</span></Label>
                  <Input
                    placeholder="ПАО Сбербанк"
                    value={withdrawForm.bankName || ''}
                    onChange={(e) => setWithdrawForm({...withdrawForm, bankName: e.target.value})}
                  />
                </div>
              </>
            )}
            <Button 
              className="w-full"
              onClick={async () => {
                const requestedAmount = parseFloat(withdrawForm.amount);
                const availableBalance = walletData?.wallet?.wallet_balance || 0;
                
                if (!withdrawForm.amount || requestedAmount <= 0) {
                  alert('Введите сумму больше 0');
                  return;
                }
                
                if (requestedAmount > availableBalance) {
                  alert(`Недостаточно средств. Доступно для вывода: ${availableBalance.toLocaleString()} ₽`);
                  return;
                }
                
                if (withdrawForm.paymentMethod === 'account') {
                  if (!withdrawForm.accountFullName.trim() || !withdrawForm.accountBank.trim() || 
                      !withdrawForm.accountNumber.trim() || !withdrawForm.accountBik.trim()) {
                    alert('Заполните все поля для расчётного счёта');
                    return;
                  }
                  if (withdrawForm.accountBik.length !== 9) {
                    alert('БИК должен содержать 9 цифр');
                    return;
                  }
                  if (withdrawForm.accountNumber.length !== 20) {
                    alert('Расчётный счёт должен содержать 20 цифр');
                    return;
                  }
                } else {
                  if (!withdrawForm.paymentDetails.trim() || !withdrawForm.bankName.trim()) {
                    alert('Заполните реквизиты и наименование банка');
                    return;
                  }
                }
                
                try {
                  const paymentDetails = withdrawForm.paymentMethod === 'account'
                    ? `ФИО: ${withdrawForm.accountFullName}\nБанк: ${withdrawForm.accountBank}\nРасчётный счёт: ${withdrawForm.accountNumber}\nБИК: ${withdrawForm.accountBik}`
                    : `${withdrawForm.paymentDetails}\nБанк: ${withdrawForm.bankName}`;
                  
                  const response = await fetch('https://functions.poehali.dev/f88ab2cf-1304-40dd-82e4-a7a1f7358901', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      user_id: currentEmployeeId,
                      amount: requestedAmount,
                      payment_method: withdrawForm.paymentMethod === 'card' ? 'Банковская карта' : 
                                      withdrawForm.paymentMethod === 'sbp' ? 'СБП' : 'Расчётный счёт',
                      payment_details: paymentDetails
                    })
                  });
                  
                  if (response.ok) {
                    alert('Запрос на выплату успешно отправлен!');
                    setShowWithdrawDialog(false);
                    setWithdrawForm({ 
                      amount: '', 
                      paymentMethod: 'card', 
                      paymentDetails: '',
                      accountFullName: '',
                      accountBank: '',
                      accountNumber: '',
                      accountBik: ''
                    });
                    await loadData();
                  } else {
                    alert('Ошибка при отправке запроса');
                  }
                } catch (error) {
                  console.error('Ошибка:', error);
                  alert('Не удалось отправить запрос');
                }
              }}
            >
              Отправить запрос
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </>
    );
  };

  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.getElementById(hash.slice(1));
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }
    };

    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
    return () => window.removeEventListener('hashchange', handleHashNavigation);
  }, []);

  return (
    <>
      {userRole === 'guest' && renderLandingPage()}
      {userRole === 'employer' && renderEmployerDashboard()}
      {userRole === 'employee' && renderEmployeeDashboard()}

      {showOnboarding && userRole !== 'guest' && (
        <Onboarding
          role={userRole}
          onComplete={() => {
            setShowOnboarding(false);
            localStorage.removeItem('showOnboarding');
          }}
        />
      )}
      
      <EmployeeDetail
        employee={selectedEmployee}
        open={showEmployeeDetail}
        onOpenChange={setShowEmployeeDetail}
        recommendations={recommendations}
      />

      {/* Диалог реферальной ссылки с QR-кодом */}
      <Dialog open={showReferralLinkDialog} onOpenChange={setShowReferralLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Регистрация сотрудников</DialogTitle>
            <DialogDescription>
              Поделитесь ссылкой или QR-кодом с новыми сотрудниками для регистрации
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <QRCodeSVG value={referralLink} size={200} level="H" />
              </div>
            </div>
            
            <div>
              <Label>Ссылка для регистрации</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline"
                  onClick={() => handleCopyLink(referralLink)}
                >
                  <Icon name="Copy" size={16} />
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Icon name="Info" className="text-blue-600 mt-0.5" size={16} />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Как использовать:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Отправьте ссылку новому сотруднику</li>
                    <li>Покажите QR-код для быстрого сканирования</li>
                    <li>Сотрудник автоматически привяжется к вашей компании</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог запроса восстановления пароля */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={(open) => {
        setShowForgotPasswordDialog(open);
        if (!open) {
          setForgotPasswordEmail('');
          setPasswordResetMessage('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Восстановление пароля</DialogTitle>
            <DialogDescription>
              Введите email, и мы отправим вам ссылку для восстановления пароля
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="forgot-email">Email</Label>
              <Input 
                id="forgot-email" 
                type="email"
                placeholder="email@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestPasswordReset()}
              />
            </div>
            {passwordResetMessage && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                {passwordResetMessage}
              </div>
            )}
            <Button 
              className="w-full" 
              onClick={handleRequestPasswordReset}
              disabled={!forgotPasswordEmail.trim()}
            >
              Отправить ссылку
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => {
                setShowForgotPasswordDialog(false);
                setForgotPasswordEmail('');
                setPasswordResetMessage('');
                setShowLoginDialog(true);
              }}
            >
              Назад к входу
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог сброса пароля */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый пароль</DialogTitle>
            <DialogDescription>
              Введите новый пароль для вашего аккаунта
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input 
                id="new-password" 
                type="password"
                placeholder="Минимум 6 символов"
                value={resetPasswordForm.password}
                onChange={(e) => setResetPasswordForm({...resetPasswordForm, password: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Подтвердите пароль</Label>
              <Input 
                id="confirm-password" 
                type="password"
                placeholder="Введите пароль еще раз"
                value={resetPasswordForm.confirmPassword}
                onChange={(e) => setResetPasswordForm({...resetPasswordForm, confirmPassword: e.target.value})}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
            </div>
            {passwordResetMessage && (
              <div className={`text-sm p-3 rounded ${
                passwordResetMessage.includes('успешно') 
                  ? 'text-green-600 bg-green-50' 
                  : 'text-red-600 bg-red-50'
              }`}>
                {passwordResetMessage}
              </div>
            )}
            <Button 
              className="w-full" 
              onClick={handleResetPassword}
              disabled={
                !resetPasswordForm.password || 
                !resetPasswordForm.confirmPassword || 
                resetPasswordForm.password !== resetPasswordForm.confirmPassword
              }
            >
              Изменить пароль
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            onClick={() => setLightboxImage(null)}
          >
            <Icon name="X" size={28} />
          </button>
          <img
            src={lightboxImage}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxImage}
            download
            className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 flex items-center gap-2 text-sm transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon name="Download" size={16} />
            Скачать
          </a>
        </div>
      )}
    </>
  );
}

export default Index;