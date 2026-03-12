import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Turnstile } from '@marsidev/react-turnstile';
import { api, type Vacancy, type Company } from '@/lib/api';

function VacancyReferral() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const referrerId = searchParams.get('ref');
  const navigate = useNavigate();

  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    loadVacancyData();
  }, [token]);

  useEffect(() => {
    if (vacancy) {
      const ogImageUrl = `https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/032a8a8d-15a3-4c23-85e1-3c02c8f864c7.jpg`;
      const refParam = referrerId ? `&ref=${referrerId}` : '';
      const proxyUrl = `https://functions.poehali.dev/44878f98-7873-41f8-a3b0-f47731016858?type=referral&id=${token}${refParam}`;
      const vacancyUrl = `${window.location.origin}/r/${token}${referrerId ? `?ref=${referrerId}` : ''}`;
      
      document.title = `${vacancy.title} — ${vacancy.department} | iHUNT`;
      
      updateMetaTag('og:title', `${vacancy.title} — ${vacancy.department}`);
      updateMetaTag('og:description', vacancy.requirements?.substring(0, 160) || `Вакансия ${vacancy.title} в компании. Заработная плата: ${vacancy.salary_display}. Вознаграждение за рекомендацию: ${vacancy.reward_amount.toLocaleString()} ₽`);
      updateMetaTag('og:image', ogImageUrl);
      updateMetaTag('og:url', vacancyUrl);
      updateMetaTag('og:type', 'website');
      
      updateMetaTag('twitter:card', 'summary_large_image');
      updateMetaTag('twitter:title', `${vacancy.title} — ${vacancy.department}`);
      updateMetaTag('twitter:description', vacancy.requirements?.substring(0, 160) || `Вакансия ${vacancy.title}`);
      updateMetaTag('twitter:image', ogImageUrl);

      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', vacancyUrl);

      let shareLink = document.querySelector('link[data-og-proxy]') as HTMLLinkElement;
      if (!shareLink) {
        shareLink = document.createElement('link');
        shareLink.setAttribute('rel', 'alternate');
        shareLink.setAttribute('data-og-proxy', 'true');
        document.head.appendChild(shareLink);
      }
      shareLink.setAttribute('href', proxyUrl);
    }
  }, [vacancy, token, referrerId]);

  const updateMetaTag = (property: string, content: string) => {
    let selector = `meta[property="${property}"]`;
    if (!property.startsWith('og:') && !property.startsWith('twitter:')) {
      selector = `meta[name="${property}"]`;
    }
    
    let meta = document.querySelector(selector) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        meta.setAttribute('property', property);
      } else {
        meta.setAttribute('name', property);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  const loadVacancyData = async () => {
    try {
      setIsLoading(true);
      
      const foundVacancy = await api.getVacancyByToken(token || '');
      
      if (foundVacancy) {
        setVacancy(foundVacancy);
        
        const companyData = await api.getCompany(foundVacancy.company_id || 1);
        setCompany(companyData);
      }
    } catch (error) {
      console.error('Ошибка загрузки вакансии:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vacancy || !form.name || !form.phone || !form.comment) {
      alert('Заполните обязательные поля: ФИО, Телефон и Сопроводительное письмо');
      return;
    }

    if (!captchaToken) {
      alert('Пожалуйста, подтвердите, что вы не робот');
      return;
    }

    try {
      let resumeUrl: string | undefined;
      if (resumeFile) {
        resumeUrl = await api.uploadResume(resumeFile);
      }

      await api.createRecommendation({
        vacancy_id: vacancy.id,
        recommended_by: referrerId ? parseInt(referrerId) : undefined,
        candidate_name: form.name,
        candidate_email: form.email,
        candidate_phone: form.phone,
        comment: form.comment,
        resume_url: resumeUrl
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Не удалось отправить отклик');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка вакансии...</p>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <Icon name="AlertCircle" className="text-red-600" size={32} />
            </div>
            <CardTitle>Вакансия не найдена</CardTitle>
            <CardDescription>Возможно, ссылка устарела или вакансия закрыта</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="CheckCircle" className="text-green-600" size={32} />
            </div>
            <CardTitle>Отклик успешно отправлен!</CardTitle>
            <CardDescription>Мы рассмотрим вашу кандидатуру и свяжемся с вами</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Вы откликнулись на вакансию</p>
              <p className="font-semibold text-lg">{vacancy.title}</p>
              <p className="text-sm text-muted-foreground">{company?.name}</p>
            </div>
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              Посмотреть другие вакансии
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 safe-area-inset-top">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={16} className="mr-1" />
              Назад
            </Button>
            <div className="flex items-center gap-2">
              <Icon name="Rocket" className="text-primary" size={24} />
              <span className="text-lg sm:text-xl font-bold">iHUNT</span>
            </div>
          </div>
          {company?.website && (
            <Button variant="ghost" size="sm" onClick={() => window.open(company.website, '_blank')}>
              <Icon name="ExternalLink" className="mr-2" size={16} />
              Сайт компании
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-6">
            <div>
              <Badge className="mb-4">
                <Icon name="Briefcase" className="mr-1" size={14} />
                Вакансия
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">{vacancy.title}</h1>
              <div className="flex flex-wrap gap-3 sm:gap-4 text-sm sm:text-base text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icon name="Building2" size={18} />
                  <span>{company?.name}</span>
                </div>
                {vacancy.department && (
                  <div className="flex items-center gap-2">
                    <Icon name="Users" size={18} />
                    <span>{vacancy.department}</span>
                  </div>
                )}
                {vacancy.salary_display && (
                  <div className="flex items-center gap-2">
                    <Icon name="Wallet" size={18} />
                    <span>{vacancy.salary_display}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {vacancy.description && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="FileText" size={20} />
                  Описание вакансии
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{vacancy.description}</p>
              </div>
            )}

            {vacancy.requirements && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Icon name="CheckSquare" size={20} />
                  Требования
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{vacancy.requirements}</p>
              </div>
            )}

            {company && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Icon name="Building2" size={20} />
                    О компании
                  </h3>
                  {company.description && (
                    <p className="text-muted-foreground mb-3">{company.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm">
                    {company.industry && (
                      <Badge variant="outline">
                        <Icon name="Briefcase" className="mr-1" size={12} />
                        {company.industry}
                      </Badge>
                    )}
                    {company.employee_count && (
                      <Badge variant="outline">
                        <Icon name="Users" className="mr-1" size={12} />
                        {company.employee_count}+ сотрудников
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}


          </div>

          <div className="pb-6 safe-area-inset-bottom">
            <Card className="md:sticky md:top-24">
              <CardHeader>
                <CardTitle>Откликнуться на вакансию</CardTitle>
                <CardDescription>Заполните форму, и мы свяжемся с вами</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">ФИО *</Label>
                    <Input
                      id="name"
                      placeholder="Иван Иванов"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ivan@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+7 (999) 123-45-67"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="comment">Сопроводительное письмо *</Label>
                    <Textarea
                      id="comment"
                      placeholder="Расскажите, почему вы подходите на эту позицию..."
                      rows={4}
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="resume">Резюме (необязательно)</Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
                          if (!allowedTypes.includes(file.type)) {
                            alert('Поддерживаются только файлы PDF, DOC, DOCX');
                            e.target.value = '';
                            return;
                          }
                          if (file.size > 10 * 1024 * 1024) {
                            alert('Размер файла не должен превышать 10 МБ');
                            e.target.value = '';
                            return;
                          }
                          setResumeFile(file);
                        }
                      }}
                    />
                    {resumeFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Выбран файл: {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} МБ)
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Форматы: PDF, DOC, DOCX. Максимальный размер: 10 МБ
                    </p>
                  </div>

                  {referrerId && (
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      <Icon name="Info" size={16} className="inline mr-2 text-blue-600" />
                      <span className="text-blue-900">Вы откликаетесь по рекомендации</span>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <Turnstile
                      siteKey="0x4AAAAAACnexPnHsy0yGN6Z"
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={!captchaToken}>
                    <Icon name="Send" className="mr-2" size={18} />
                    Отправить отклик
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="border-t bg-white py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 iHUNT. Платформа реферального рекрутинга</p>
        </div>
      </footer>
    </div>
  );
}

export default VacancyReferral;