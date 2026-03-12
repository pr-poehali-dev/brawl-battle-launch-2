import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

const ADMIN_URL = 'https://functions.poehali.dev/e7549642-317b-4f05-b0f9-2c056de3cef0';

async function adminFetch(secret: string, path: string, method = 'GET', body?: object) {
  const base = ADMIN_URL;
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return res.json();
}

interface Analytics {
  companies_total: number;
  users_total: number;
  vacancies_total: number;
  recommendations_total: number;
  hired_total: number;
  active_subscriptions: number;
  expired_subscriptions: number;
  registrations_by_day: { date: string; count: number }[];
}

interface Company {
  id: number;
  name: string;
  inn?: string;
  subscription_tier?: string;
  subscription_expires_at?: string;
  created_at: string;
  users_count: number;
  vacancies_count: number;
  recommendations_count: number;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  position?: string;
  is_admin: boolean;
  is_fired: boolean;
  total_recommendations: number;
  successful_hires: number;
  total_earnings: number;
  wallet_balance: number;
  wallet_pending: number;
  created_at: string;
  company_name?: string;
}

function daysLeft(dateStr?: string) {
  if (!dateStr) return -999;
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return d;
}

function SubBadge({ expiresAt, tier }: { expiresAt?: string; tier?: string }) {
  const days = daysLeft(expiresAt);
  if (days <= 0) return <Badge variant="destructive">Истекла</Badge>;
  if (days <= 7) return <Badge className="bg-orange-500 text-white">{days} дн.</Badge>;
  return <Badge variant="secondary">{tier === 'trial' ? 'Пробный' : 'Продвинутый'} · {days} дн.</Badge>;
}

export default function Admin() {
  const [secret, setSecret] = useState(() => localStorage.getItem('admin_secret') || '');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [subForm, setSubForm] = useState({ company_id: 0, tier: 'advanced', days: '30' });
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ first_name: '', last_name: '', position: '', is_admin: false, is_fired: false });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');

  const handleLogin = async () => {
    if (!secret.trim()) { setAuthError('Введите секретный ключ'); return; }
    setLoading(true);
    try {
      const data = await adminFetch(secret, '?resource=analytics');
      if (data.error) { setAuthError('Неверный ключ'); return; }
      localStorage.setItem('admin_secret', secret);
      setAuthed(true);
      setAnalytics(data);
    } catch { setAuthError('Ошибка соединения'); }
    finally { setLoading(false); }
  };

  const loadCompanies = async () => {
    const data = await adminFetch(secret, '?resource=companies');
    if (Array.isArray(data)) setCompanies(data);
  };

  const loadUsers = async (q = '') => {
    const data = await adminFetch(secret, `?resource=users${q ? `&search=${q}` : ''}`);
    if (Array.isArray(data)) setUsers(data);
  };

  const loadCompanyDetail = async (id: number) => {
    const data = await adminFetch(secret, `?resource=company&company_id=${id}`);
    setSelectedCompany(data);
    setShowCompanyDialog(true);
  };

  const handleExtendSub = async () => {
    await adminFetch(secret, '?resource=company_subscription', 'PUT', subForm);
    setShowSubDialog(false);
    loadCompanies();
    if (selectedCompany) loadCompanyDetail(subForm.company_id);
    alert('✅ Подписка обновлена');
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    await adminFetch(secret, '?resource=user', 'PUT', { user_id: selectedUser.id, ...userForm });
    setShowUserDialog(false);
    if (selectedCompany?.company?.id) loadCompanyDetail(selectedCompany.company.id);
    else loadUsers(search);
    alert('✅ Данные сотрудника обновлены');
  };

  useEffect(() => {
    if (authed && activeTab === 'companies') loadCompanies();
    if (authed && activeTab === 'users') loadUsers(search);
  }, [authed, activeTab]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-2">
              <Icon name="ShieldCheck" size={24} className="text-white" />
            </div>
            <CardTitle className="text-white">Admin Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              placeholder="Секретный ключ"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="bg-gray-800 border-gray-700 text-white"
            />
            {authError && <p className="text-destructive text-sm">{authError}</p>}
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? <Icon name="Loader2" className="animate-spin mr-2" size={16} /> : null}
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name="ShieldCheck" size={20} className="text-primary" />
          <span className="font-bold">iHUNT Admin</span>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white"
          onClick={() => { localStorage.removeItem('admin_secret'); setAuthed(false); setSecret(''); }}>
          <Icon name="LogOut" size={16} className="mr-1" />
          Выйти
        </Button>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800 border border-gray-700 mb-6">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary">📊 Аналитика</TabsTrigger>
            <TabsTrigger value="companies" className="data-[state=active]:bg-primary">🏢 Компании</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary">👥 Сотрудники</TabsTrigger>
          </TabsList>

          {/* ANALYTICS */}
          <TabsContent value="analytics">
            {analytics && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Компаний', value: analytics.companies_total, icon: 'Building2', color: 'text-blue-400' },
                    { label: 'Пользователей', value: analytics.users_total, icon: 'Users', color: 'text-green-400' },
                    { label: 'Вакансий', value: analytics.vacancies_total, icon: 'Briefcase', color: 'text-yellow-400' },
                    { label: 'Рекомендаций', value: analytics.recommendations_total, icon: 'ThumbsUp', color: 'text-purple-400' },
                  ].map(s => (
                    <Card key={s.label} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-400 text-sm">{s.label}</span>
                          <Icon name={s.icon as any} size={18} className={s.color} />
                        </div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-4">
                      <p className="text-gray-400 text-sm mb-1">Активных подписок</p>
                      <p className="text-2xl font-bold text-green-400">{analytics.active_subscriptions}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-900 border-gray-800">
                    <CardContent className="p-4">
                      <p className="text-gray-400 text-sm mb-1">Истекших подписок</p>
                      <p className="text-2xl font-bold text-red-400">{analytics.expired_subscriptions}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader><CardTitle className="text-white text-base">Регистрации за 30 дней</CardTitle></CardHeader>
                  <CardContent>
                    {analytics.registrations_by_day.length === 0
                      ? <p className="text-gray-400 text-sm">Нет данных</p>
                      : <div className="space-y-2">
                          {analytics.registrations_by_day.map(r => (
                            <div key={r.date} className="flex items-center gap-3">
                              <span className="text-gray-400 text-sm w-24">{new Date(r.date).toLocaleDateString('ru-RU')}</span>
                              <div className="flex-1 bg-gray-800 rounded-full h-2">
                                <div className="bg-primary h-2 rounded-full" style={{ width: `${Math.min(100, r.count * 20)}%` }} />
                              </div>
                              <span className="text-white text-sm w-6 text-right">{r.count}</span>
                            </div>
                          ))}
                        </div>
                    }
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* COMPANIES */}
          <TabsContent value="companies">
            <div className="space-y-4">
              <Input placeholder="Поиск компании..." className="bg-gray-800 border-gray-700 text-white max-w-sm"
                onChange={e => {
                  const q = e.target.value.toLowerCase();
                  loadCompanies().then(() => {
                    if (q) setCompanies(prev => prev.filter(c => c.name.toLowerCase().includes(q) || (c.inn || '').includes(q)));
                  });
                }} />
              <div className="space-y-3">
                {companies.map(c => (
                  <Card key={c.id} className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => loadCompanyDetail(c.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white">{c.name}</p>
                          {c.inn && <p className="text-gray-400 text-xs mt-0.5">ИНН: {c.inn}</p>}
                          <div className="flex gap-3 mt-2 text-xs text-gray-400">
                            <span>👥 {c.users_count} польз.</span>
                            <span>💼 {c.vacancies_count} вакансий</span>
                            <span>🎯 {c.recommendations_count} рек.</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <SubBadge expiresAt={c.subscription_expires_at} tier={c.subscription_tier} />
                          <p className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex gap-2 max-w-sm">
                <Input placeholder="Email, имя или фамилия..." className="bg-gray-800 border-gray-700 text-white"
                  value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadUsers(search)} />
                <Button onClick={() => loadUsers(search)} size="sm">Найти</Button>
              </div>
              <div className="space-y-3">
                {users.map(u => (
                  <Card key={u.id} className="bg-gray-900 border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => { setSelectedUser(u); setUserForm({ first_name: u.first_name, last_name: u.last_name, position: u.position || '', is_admin: u.is_admin, is_fired: u.is_fired }); setShowUserDialog(true); }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-white">{u.first_name} {u.last_name}</p>
                          <p className="text-gray-400 text-xs">{u.email}</p>
                          {u.company_name && <p className="text-gray-500 text-xs mt-0.5">🏢 {u.company_name}</p>}
                          <div className="flex gap-3 mt-2 text-xs text-gray-400">
                            <span>🎯 {u.total_recommendations} рек.</span>
                            <span>✅ {u.successful_hires} найм.</span>
                            <span>💰 {Number(u.wallet_balance).toLocaleString()} ₽</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {u.is_admin && <Badge className="bg-blue-600 text-white text-xs">Админ</Badge>}
                          {u.is_fired && <Badge variant="destructive" className="text-xs">Уволен</Badge>}
                          <span className="text-gray-500 text-xs">{u.role}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {users.length === 0 && <p className="text-gray-400 text-sm">Введите запрос для поиска сотрудников</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* COMPANY DETAIL DIALOG */}
      <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
          {selectedCompany && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white">{selectedCompany.company?.name}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  ИНН: {selectedCompany.company?.inn || '—'} · Зарегистрирована: {selectedCompany.company?.created_at ? new Date(selectedCompany.company.created_at).toLocaleDateString('ru-RU') : '—'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Пользователей', value: selectedCompany.users?.length },
                    { label: 'Вакансий', value: selectedCompany.vacancies?.length },
                    { label: 'Нанято', value: selectedCompany.company?.hired_count || 0 },
                    { label: 'Выплачено', value: `${Number(selectedCompany.company?.total_payouts || 0).toLocaleString()} ₽` },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">{s.label}</p>
                      <p className="text-white font-bold text-lg">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                  <div>
                    <p className="text-gray-400 text-xs">Подписка</p>
                    <p className="text-white font-medium">{selectedCompany.company?.subscription_tier === 'trial' ? 'Пробный период' : 'Продвинутый'}</p>
                    {selectedCompany.company?.subscription_expires_at && (
                      <p className="text-gray-400 text-xs">До: {new Date(selectedCompany.company.subscription_expires_at).toLocaleDateString('ru-RU')}</p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => { setSubForm({ company_id: selectedCompany.company.id, tier: 'advanced', days: '30' }); setShowSubDialog(true); }}>
                    Продлить
                  </Button>
                </div>

                {selectedCompany.users?.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Сотрудники</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedCompany.users.map((u: User) => (
                        <div key={u.id} className="bg-gray-800 rounded-lg p-2 flex items-center justify-between cursor-pointer hover:bg-gray-700"
                          onClick={() => { setSelectedUser(u); setUserForm({ first_name: u.first_name, last_name: u.last_name, position: u.position || '', is_admin: u.is_admin, is_fired: u.is_fired }); setShowUserDialog(true); }}>
                          <div>
                            <p className="text-white text-sm">{u.first_name} {u.last_name}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                          <div className="flex gap-1">
                            {u.is_admin && <Badge className="bg-blue-600 text-white text-xs">Админ</Badge>}
                            {u.is_fired && <Badge variant="destructive" className="text-xs">Уволен</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCompany.vacancies?.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Вакансии</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedCompany.vacancies.map((v: any) => (
                        <div key={v.id} className="bg-gray-800 rounded-lg p-2 flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm">{v.title}</p>
                            <p className="text-gray-400 text-xs">{v.department}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">🎯 {v.recs_count}</span>
                            <Badge variant={v.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                              {v.status === 'active' ? 'Активна' : 'Архив'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* SUBSCRIPTION DIALOG */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Продление подписки</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-gray-400 text-sm">Тариф</Label>
              <Select value={subForm.tier} onValueChange={v => setSubForm({ ...subForm, tier: v })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="trial">Пробный период</SelectItem>
                  <SelectItem value="advanced">Продвинутый</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-sm">Период (дней)</Label>
              <Select value={subForm.days} onValueChange={v => setSubForm({ ...subForm, days: v })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="14">14 дней (пробный)</SelectItem>
                  <SelectItem value="30">30 дней</SelectItem>
                  <SelectItem value="90">90 дней</SelectItem>
                  <SelectItem value="180">180 дней</SelectItem>
                  <SelectItem value="365">365 дней (1 год)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleExtendSub}>Применить</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* USER EDIT DIALOG */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-sm bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Редактировать сотрудника</DialogTitle>
            <DialogDescription className="text-gray-400">{selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-gray-400 text-xs">Имя</Label>
                <Input className="bg-gray-800 border-gray-700 text-white mt-1" value={userForm.first_name}
                  onChange={e => setUserForm({ ...userForm, first_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Фамилия</Label>
                <Input className="bg-gray-800 border-gray-700 text-white mt-1" value={userForm.last_name}
                  onChange={e => setUserForm({ ...userForm, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label className="text-gray-400 text-xs">Должность</Label>
              <Input className="bg-gray-800 border-gray-700 text-white mt-1" value={userForm.position}
                onChange={e => setUserForm({ ...userForm, position: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={userForm.is_admin} onChange={e => setUserForm({ ...userForm, is_admin: e.target.checked })} />
                <span className="text-sm text-gray-300">Администратор</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={userForm.is_fired} onChange={e => setUserForm({ ...userForm, is_fired: e.target.checked })} />
                <span className="text-sm text-gray-300">Уволен</span>
              </label>
            </div>
            {selectedUser && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-1">
                <p>Рекомендаций: {selectedUser.total_recommendations} · Найм: {selectedUser.successful_hires}</p>
                <p>Баланс: {Number(selectedUser.wallet_balance).toLocaleString()} ₽ · В ожидании: {Number(selectedUser.wallet_pending).toLocaleString()} ₽</p>
                <p>Зарегистрирован: {new Date(selectedUser.created_at).toLocaleDateString('ru-RU')}</p>
              </div>
            )}
            <Button className="w-full" onClick={handleUpdateUser}>Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}