import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import type { Vacancy } from '@/types';
import { useState } from 'react';

interface VacancyPublicViewProps {
  vacancy: Vacancy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VacancyPublicView({ vacancy, open, onOpenChange }: VacancyPublicViewProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resume: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!vacancy) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    
    setTimeout(() => {
      setSubmitSuccess(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        coverLetter: '',
        resume: null
      });
      onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="grid md:grid-cols-[1fr_400px] gap-6">
          <div>
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Badge variant="default" className="mb-3 bg-sky-500 hover:bg-sky-600">
                    <Icon name="Briefcase" size={14} className="mr-1" />
                    Вакансия
                  </Badge>
                  <DialogTitle className="text-3xl mb-3">{vacancy.title}</DialogTitle>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1.5">
                      <Icon name="Building2" size={16} />
                      <span>{vacancy.department}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon name={vacancy.isRemote ? "Home" : "MapPin"} size={16} />
                      <span>{vacancy.city || 'Не указано'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon name="Wallet" size={16} />
                      <span className="font-medium">{vacancy.salary}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-6">
              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Icon name="ClipboardList" size={20} />
                  Требования
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">
                    Опыт управления продуктом от 3 лет
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Icon name="Building2" size={20} />
                  О компании
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground">
                    Технологическая компания по разработке ПО
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Icon name="Users" size={16} />
                    <span className="text-sm">150+ сотрудников</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold text-xl mb-2">Откликнуться на вакансию</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Заполните форму, и мы свяжемся с вами
            </p>

            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <Icon name="Check" size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-center font-medium text-green-600 dark:text-green-400">
                  Вы откликаетесь по рекомендации
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">ФИО *</Label>
                  <Input
                    id="fullName"
                    placeholder="Иван Иванов"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ivan@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Сопроводительное письмо</Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Расскажите, почему вы подходите на эту позицию..."
                    value={formData.coverLetter}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume">Резюме (необязательно)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormData(prev => ({ ...prev, resume: file }));
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Форматы: PDF, DOC, DOCX. Максимальный размер: 10 МБ
                  </p>
                </div>

                <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-lg p-3 flex gap-2">
                  <Icon name="Info" size={18} className="text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-sky-900 dark:text-sky-200">
                    Вы откликаетесь по рекомендации
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={18} className="mr-2" />
                      Отправить отклик
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
