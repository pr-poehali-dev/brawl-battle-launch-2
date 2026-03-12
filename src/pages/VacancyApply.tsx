import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Turnstile } from '@marsidev/react-turnstile';
import { api, type Vacancy, type Company } from '@/lib/api';

function VacancyApply() {
  const { vacancyId } = useParams();
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
  }, [vacancyId]);

  useEffect(() => {
    if (vacancy) {
      const ogImageUrl = `https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/527161af-5ca6-4a19-a62f-86e2a76c97b8.jpg`;
      const proxyUrl = `https://functions.poehali.dev/44878f98-7873-41f8-a3b0-f47731016858?type=vacancy&id=${vacancy.id}`;
      const vacancyUrl = `${window.location.origin}/vacancy/${vacancy.id}`;
      
      document.title = `${vacancy.title} — ${vacancy.department} | iHUNT`;
      
      updateMetaTag('og:title', `${vacancy.title} — ${vacancy.department}`);
      updateMetaTag('og:description', vacancy.requirements?.substring(0, 160) || `Вакансия ${vacancy.title} в компании. Заработная плата: ${vacancy.salary_display}`);
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
  }, [vacancy]);

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
      
      const foundVacancy = await api.getVacancyById(parseInt(vacancyId || '0'));
      
      if (foundVacancy) {
        setVacancy(foundVacancy);
        const v = foundVacancy as Vacancy & { company_name?: string; company_description?: string; company_website?: string; company_industry?: string; company_logo_url?: string };
        if (v.company_name) {
          setCompany({
            id: v.company_id || 0,
            name: v.company_name,
            description: v.company_description || '',
            website: v.company_website || '',
            industry: v.company_industry || '',
            logo_url: v.company_logo_url || '',
            employee_count: 0,
            invite_token: '',
            created_at: ''
          });
        } else if (foundVacancy.company_id) {
          const companyData = await api.getCompany(foundVacancy.company_id);
          setCompany(companyData);
        }
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
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
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
            <Icon name="AlertCircle" size={64} className="mx-auto mb-4 text-destructive" />
            <CardTitle>Вакансия не найдена</CardTitle>
            <CardDescription>Возможно, вакансия была удалена или закрыта</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
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
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="CheckCircle" size={32} className="text-green-600" />
            </div>
            <CardTitle>Отклик отправлен!</CardTitle>
            <CardDescription>
              Спасибо за интерес к вакансии. Мы свяжемся с вами в ближайшее время.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
          
          <Button
            variant="outline"
            className="md:hidden"
            onClick={() => {
              const vacancyUrl = `${window.location.origin}/vacancy/${vacancy.id}`;
              const text = `${vacancy.title} — ${vacancy.department}\n${vacancy.salary_display}`;
              
              if (navigator.share) {
                navigator.share({
                  title: vacancy.title,
                  text: text,
                  url: vacancyUrl
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`${text}\n${vacancyUrl}`);
                alert('Ссылка скопирована!');
              }
            }}
          >
            <Icon name="Share2" size={16} className="mr-2" />
            Поделиться
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                {company?.logo_url && (
                  <img 
                    src={company.logo_url} 
                    alt={company.name} 
                    className="h-12 mb-4 object-contain"
                  />
                )}
                <CardTitle className="text-2xl">{vacancy.title}</CardTitle>
                <CardDescription className="text-base">{vacancy.department}</CardDescription>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary">
                    {vacancy.status === 'active' ? 'Активна' : 'Закрыта'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon name="Wallet" size={18} />
                  Заработная плата
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{vacancy.salary_display}</p>
              </CardContent>
            </Card>

            {vacancy.requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name="CheckCircle" size={18} />
                    Требования
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{vacancy.requirements}</p>
                </CardContent>
              </Card>
            )}

            {vacancy.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name="FileText" size={18} />
                    Описание вакансии
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{vacancy.description}</p>
                </CardContent>
              </Card>
            )}

            {company && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon name="Building2" size={18} />
                    О компании
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    {company.description && (
                      <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                    )}
                  </div>
                  {company.industry && (
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Briefcase" size={14} className="text-muted-foreground" />
                      <span>{company.industry}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Icon name="Globe" size={14} className="text-muted-foreground" />
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Откликнуться на вакансию</CardTitle>
                <CardDescription>
                  Заполните форму, и мы свяжемся с вами в ближайшее время
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Ваше имя *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Иван Иванов"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="example@mail.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+7 (999) 123-45-67"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="comment">Сопроводительное письмо *</Label>
                    <Textarea
                      id="comment"
                      value={form.comment}
                      onChange={(e) => setForm({ ...form, comment: e.target.value })}
                      placeholder="Расскажите о себе и почему вы подходите на эту позицию..."
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="resume">Резюме (PDF, DOC, DOCX)</Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                    {resumeFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Выбран файл: {resumeFile.name}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Turnstile
                      siteKey="0x4AAAAAACnexPnHsy0yGN6Z"
                      onSuccess={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={!form.name || !form.phone || !form.comment || !captchaToken}>
                    <Icon name="Send" size={18} className="mr-2" />
                    Отправить отклик
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    * Обязательные поля
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VacancyApply;