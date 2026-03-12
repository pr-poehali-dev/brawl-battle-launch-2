import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

function EmployeeInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: ''
  });

  useEffect(() => {
    if (token) {
      api.getCompanyByToken(token)
        .then(company => {
          setCompanyName(company.name);
          setIsLoading(false);
        })
        .catch(() => {
          setError('Недействительная ссылка приглашения');
          setIsLoading(false);
        });
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.position || !form.department) {
      setError('Заполните все обязательные поля');
      return;
    }

    try {
      await api.registerEmployee(token!, {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        position: form.position,
        department: form.department
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError('Ошибка регистрации. Попробуйте снова.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && !companyName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Icon name="AlertCircle" className="mx-auto mb-4 text-destructive" size={48} />
            <h2 className="text-xl font-semibold mb-2">Ошибка</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>На главную</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Icon name="CheckCircle" className="mx-auto mb-4 text-green-600" size={48} />
            <h2 className="text-xl font-semibold mb-2">Регистрация успешна!</h2>
            <p className="text-muted-foreground mb-4">Перенаправление в систему...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 sm:p-6 safe-area-inset-top safe-area-inset-bottom">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-3 sm:space-y-4 pb-6 sm:pb-8">
          <div className="flex items-center justify-center gap-2 mb-2 sm:mb-4">
            <Icon name="Rocket" className="text-primary" size={32} />
            <span className="text-2xl sm:text-3xl font-bold">iHUNT</span>
          </div>
          <CardTitle className="text-xl sm:text-2xl text-center">Регистрация сотрудника</CardTitle>
          <CardDescription className="text-center text-base sm:text-lg">
            Вы приглашены присоединиться к реферальной программе компании <span className="font-semibold text-primary">{companyName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center gap-2">
                <Icon name="AlertCircle" className="text-destructive flex-shrink-0" size={20} />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Имя *</Label>
                <Input 
                  id="firstName" 
                  placeholder="Иван"
                  value={form.firstName}
                  onChange={(e) => setForm({...form, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input 
                  id="lastName" 
                  placeholder="Иванов"
                  value={form.lastName}
                  onChange={(e) => setForm({...form, lastName: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="ivan@example.com"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="phone">Телефон *</Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="position">Должность *</Label>
              <Input 
                id="position" 
                placeholder="Frontend Developer"
                value={form.position}
                onChange={(e) => setForm({...form, position: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="department">Отдел *</Label>
              <Input 
                id="department" 
                placeholder="Разработка"
                value={form.department}
                onChange={(e) => setForm({...form, department: e.target.value})}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="Info" className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">После регистрации вы сможете:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Рекомендовать кандидатов на вакансии</li>
                    <li>• Зарабатывать бонусы за успешный найм</li>
                    <li>• Отслеживать статус рекомендаций</li>
                    <li>• Участвовать в системе геймификации</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                className="flex-1"
                size="lg"
                onClick={handleSubmit}
              >
                <Icon name="UserPlus" className="mr-2" size={18} />
                Присоединиться
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/')}
              >
                Отмена
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployeeInvite;