import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Turnstile } from '@marsidev/react-turnstile';

function EmployeeRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('token');

  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');

  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!inviteToken) {
        alert('Неверная ссылка для регистрации');
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`https://functions.poehali.dev/f1f66940-161e-4221-a729-4e0e555af034?invite_token=${inviteToken}`);
        if (response.ok) {
          const data = await response.json();
          setCompanyName(data.company.name);
        } else {
          alert('Компания не найдена или ссылка недействительна');
          navigate('/');
        }
      } catch (error) {
        console.error('Ошибка загрузки данных компании:', error);
        alert('Не удалось загрузить данные компании');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanyInfo();
  }, [inviteToken, navigate]);

  useEffect(() => {
    const title = 'Получай вознаграждение за рекомендацию наших вакансий | iHUNT';
    const description = 'Зарегистрируйся и рекомендуй вакансии своим знакомым — получай денежное вознаграждение за каждого успешного кандидата.';
    const image = 'https://cdn.poehali.dev/projects/8d04a195-3369-41af-824b-a8333098d2fe/bucket/1a4f08a4-f047-444f-aab6-82e0357b0c94.jpg';
    const url = window.location.href;

    document.title = title;

    const setMeta = (attr: string, key: string, value: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    const proxyUrl = `https://functions.poehali.dev/44878f98-7873-41f8-a3b0-f47731016858?type=employee${inviteToken ? `&id=${inviteToken}` : ''}`;
    let shareLink = document.querySelector('link[data-og-proxy]') as HTMLLinkElement;
    if (!shareLink) {
      shareLink = document.createElement('link');
      shareLink.setAttribute('rel', 'alternate');
      shareLink.setAttribute('data-og-proxy', 'true');
      document.head.appendChild(shareLink);
    }
    shareLink.setAttribute('href', proxyUrl);
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (!turnstileToken) {
      setError('Пожалуйста, подтвердите, что вы не робот');
      return;
    }

    if (formData.password.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_employee_by_token',
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          invite_token: inviteToken,
          turnstile_token: turnstileToken
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Регистрация успешна!\n\nМы отправили письмо с подтверждением на ${formData.email}.\nПожалуйста, проверьте вашу почту и перейдите по ссылке в письме для активации аккаунта.`);
        navigate('/');
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setError('Не удалось зарегистрироваться');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon name="Rocket" className="text-primary" size={32} />
            <span className="text-2xl font-bold">iHUNT</span>
          </div>
          <CardTitle className="text-2xl">Регистрация сотрудника</CardTitle>
          <CardDescription>
            Вы регистрируетесь как сотрудник компании <strong>{companyName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Иван"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Иванов"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ivan@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Минимум 8 символов"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Повторите пароль"
                required
              />
            </div>

            <div className="flex justify-center">
              <Turnstile
                siteKey="0x4AAAAAACnexPnHsy0yGN6Z"
                onSuccess={(token) => setTurnstileToken(token)}
                onExpire={() => setTurnstileToken('')}
                onError={() => setTurnstileToken('')}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !turnstileToken}>
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" className="mr-2 animate-spin" size={18} />
                  Регистрация...
                </>
              ) : (
                <>
                  <Icon name="UserPlus" className="mr-2" size={18} />
                  Зарегистрироваться
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Уже есть аккаунт?{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-primary hover:underline"
              >
                Войти
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeeRegister;