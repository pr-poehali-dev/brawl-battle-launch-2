import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import type { UserRole } from '@/types';

interface OnboardingProps {
  role: UserRole;
  onComplete: () => void;
}

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
  tips: string[];
}

const employerSteps: OnboardingStep[] = [
  {
    icon: 'Building2',
    title: 'Добро пожаловать в iHUNT!',
    description: 'Платформа реферального найма поможет вам быстрее находить лучших кандидатов через рекомендации ваших сотрудников.',
    tips: [
      'Сотрудники рекомендуют знакомых на ваши вакансии',
      'Вы экономите на рекрутинге до 60%',
      'Средний срок закрытия вакансии — 14 дней',
    ],
  },
  {
    icon: 'Briefcase',
    title: 'Создайте вакансии',
    description: 'Опубликуйте вакансии с указанием вознаграждения за рекомендацию — это мотивирует сотрудников искать кандидатов.',
    tips: [
      'Укажите конкурентное вознаграждение за рекомендацию',
      'Чем подробнее описание — тем точнее рекомендации',
      'Рекомендуемое вознаграждение: 10-15% от оклада',
    ],
  },
  {
    icon: 'Users',
    title: 'Пригласите сотрудников',
    description: 'Добавьте сотрудников в систему — они получат доступ к вакансиям и смогут рекомендовать кандидатов.',
    tips: [
      'Отправьте приглашения через раздел «Сотрудники»',
      'Назначьте HR-менеджеров для обработки рекомендаций',
      'Сотрудники увидят вакансии сразу после регистрации',
    ],
  },
  {
    icon: 'BarChart3',
    title: 'Отслеживайте результаты',
    description: 'Управляйте рекомендациями, выплатами и анализируйте эффективность реферальной программы.',
    tips: [
      'Раздел «Рекомендации» — все кандидаты в одном месте',
      'Раздел «Выплаты» — контроль вознаграждений',
      'Раздел «Статистика» — рейтинг активных сотрудников',
    ],
  },
];

const employeeSteps: OnboardingStep[] = [
  {
    icon: 'Rocket',
    title: 'Добро пожаловать в iHUNT!',
    description: 'Рекомендуйте знакомых на вакансии вашей компании и получайте вознаграждение за успешный найм.',
    tips: [
      'За каждого нанятого кандидата — денежное вознаграждение',
      'Рекомендации повышают ваш рейтинг в компании',
      'Система уровней и достижений за активность',
    ],
  },
  {
    icon: 'Briefcase',
    title: 'Изучите вакансии',
    description: 'В разделе «Вакансии» вы найдёте актуальные позиции с указанием суммы вознаграждения за рекомендацию.',
    tips: [
      'Обращайте внимание на размер вознаграждения',
      'Используйте реферальную ссылку для отправки кандидатам',
      'Чем точнее кандидат подходит — тем выше шансы на найм',
    ],
  },
  {
    icon: 'UserPlus',
    title: 'Рекомендуйте кандидатов',
    description: 'Нажмите «Рекомендовать» на вакансии, заполните данные кандидата — и отслеживайте статус в разделе «Мои рекомендации».',
    tips: [
      'Указывайте контактные данные кандидата',
      'Добавляйте комментарий — почему кандидат подходит',
      'Статусы: на рассмотрении → собеседование → нанят',
    ],
  },
  {
    icon: 'Wallet',
    title: 'Получайте вознаграждения',
    description: 'После найма кандидата вознаграждение зачисляется на ваш баланс. Выводите средства в разделе «Кошелёк».',
    tips: [
      'Вознаграждение начисляется после испытательного срока',
      'Следите за балансом в карточке «Кошелёк»',
      'Запросите вывод средств в любое время',
    ],
  },
];

export default function Onboarding({ role, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const steps = role === 'employer' ? employerSteps : employeeSteps;
  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;
  const isLast = step === steps.length - 1;

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-1.5 sm:p-2">
          <Progress value={progress} className="h-1.5 sm:h-2" />
        </div>

        <div className="px-5 pt-4 pb-6 sm:px-8 sm:pt-6 sm:pb-8">
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Icon name={current.icon} size={28} className="text-primary sm:hidden" />
              <Icon name={current.icon} size={32} className="text-primary hidden sm:block" />
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              Шаг {step + 1} из {steps.length}
            </p>
            <h2 className="text-lg sm:text-xl font-bold mb-2">{current.title}</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {current.description}
            </p>
          </div>

          <div className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
            {current.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 sm:gap-3 bg-muted/50 rounded-lg p-2.5 sm:p-3">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon name="Lightbulb" size={12} className="text-primary sm:hidden" />
                  <Icon name="Lightbulb" size={14} className="text-primary hidden sm:block" />
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground text-xs sm:text-sm"
            >
              Пропустить
            </Button>
            <div className="flex-1" />
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="text-xs sm:text-sm"
              >
                <Icon name="ChevronLeft" size={16} className="mr-1" />
                Назад
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLast ? handleComplete : () => setStep(step + 1)}
              className="text-xs sm:text-sm"
            >
              {isLast ? 'Начать работу' : 'Далее'}
              {!isLast && <Icon name="ChevronRight" size={16} className="ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
