import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Токен подтверждения не найден в ссылке');
        return;
      }

      try {
        const response = await fetch('https://functions.poehali.dev/acbe95f3-fa47-4ba2-bd00-aba68c67fafa', {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_email',
            token: token
          })
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Ваш email успешно подтверждён!');
          setUserData(data.user);
          
          // Сохраняем токен и определяем роль для интерфейса
          localStorage.setItem('authToken', data.token);
          const uiRole = data.user.role === 'admin' || data.user.is_admin ? 'employer' : 'employee';
          localStorage.setItem('userRole', uiRole);
          localStorage.setItem('showOnboarding', 'true');
          
          // Автоматически перенаправляем через 2 секунды с полной перезагрузкой
          setTimeout(() => {
            window.location.href = '/'; // Редирект с перезагрузкой страницы
          }, 2000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Не удалось подтвердить email');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Ошибка соединения с сервером');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          {status === 'verifying' && (
            <div className="flex justify-center mb-4">
              <Icon name="Loader2" className="w-16 h-16 animate-spin text-primary" />
            </div>
          )}
          {status === 'success' && (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Icon name="CheckCircle2" className="w-10 h-10 text-green-600" />
              </div>
            </div>
          )}
          {status === 'error' && (
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="XCircle" className="w-10 h-10 text-red-600" />
              </div>
            </div>
          )}
          
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Проверка email...'}
            {status === 'success' && 'Email подтверждён!'}
            {status === 'error' && 'Ошибка подтверждения'}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'success' && userData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm text-green-900">
                <strong>Имя:</strong> {userData.first_name} {userData.last_name}
              </p>
              <p className="text-sm text-green-900">
                <strong>Email:</strong> {userData.email}
              </p>
              <p className="text-sm text-green-700 mt-3">
                <Icon name="Info" className="w-4 h-4 inline mr-1" />
                Вы будете автоматически перенаправлены в личный кабинет через 2 секунды...
              </p>
            </div>
          )}

          {status === 'success' && (
            <Button onClick={() => window.location.href = '/'} className="w-full">
              <Icon name="ArrowRight" className="w-4 h-4 mr-2" />
              Перейти в личный кабинет
            </Button>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Возможные причины:</strong>
                </p>
                <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Ссылка устарела (действует 24 часа)</li>
                  <li>Email уже был подтверждён ранее</li>
                  <li>Некорректная ссылка</li>
                </ul>
              </div>
              
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                <Icon name="Home" className="w-4 h-4 mr-2" />
                Вернуться на главную
              </Button>
            </div>
          )}

          {status === 'verifying' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Пожалуйста, подождите...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}