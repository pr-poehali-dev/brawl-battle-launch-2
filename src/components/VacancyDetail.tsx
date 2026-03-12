import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Vacancy } from '@/types';

interface VacancyDetailProps {
  vacancy: Vacancy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecommend?: () => void;
  onRestore?: (id: number) => void;
  showRecommendButton?: boolean;
  showPublicLink?: boolean;
}

export function VacancyDetail({ vacancy, open, onOpenChange, onRecommend, onRestore, showRecommendButton = true, showPublicLink = true }: VacancyDetailProps) {
  if (!vacancy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                <DialogTitle className="text-lg sm:text-2xl">{vacancy.title}</DialogTitle>
                <Badge variant={vacancy.status === 'active' ? 'default' : 'secondary'} className="w-fit">
                  {vacancy.status === 'active' ? 'Активна' : 'Архив'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Icon name="Building2" size={14} />
                <span>{vacancy.department}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <Icon name="DollarSign" size={16} />
                <span className="font-medium">Зарплата</span>
              </div>
              <p className="text-lg sm:text-xl font-bold">{vacancy.salary}</p>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <Icon name="Award" size={16} />
                <span className="font-medium">Вознаграждение за рекомендацию</span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-green-600">{vacancy.reward.toLocaleString()} ₽</p>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <Icon name="Clock" size={16} />
                <span className="font-medium">Срок выплаты</span>
              </div>
              <p className="text-sm sm:text-base">
                Через {vacancy.payoutDelayDays} {vacancy.payoutDelayDays === 1 ? 'день' : vacancy.payoutDelayDays < 5 ? 'дня' : 'дней'} после найма
              </p>
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <Icon name="Users" size={16} />
                <span className="font-medium">Статус вакансии</span>
              </div>
              <p className="text-sm sm:text-base">
                {vacancy.status === 'active' ? 'Открыт набор кандидатов' : 'Вакансия в архиве'}
              </p>
            </div>
          </div>

          <Separator />

          {vacancy.description ? (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <Icon name="FileText" size={18} />
                Описание вакансии
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base whitespace-pre-wrap">{vacancy.description}</p>
            </div>
          ) : null}

          {vacancy.requirements ? (
            <>
              {vacancy.description && <Separator />}
              <div className="space-y-2 sm:space-y-3">
                <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <Icon name="ClipboardList" size={18} />
                  Требования
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base whitespace-pre-wrap">{vacancy.requirements}</p>
              </div>
            </>
          ) : null}

          {!vacancy.description && !vacancy.requirements ? (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                <Icon name="FileText" size={18} />
                Описание вакансии
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base italic">Описание и требования не заполнены</p>
            </div>
          ) : null}

          {showPublicLink && (
            <>
              <Separator />
              
              <div className="space-y-2 sm:space-y-3 bg-muted/50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <Icon name="ExternalLink" size={16} />
                  Ссылка на вакансию
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Поделитесь этой ссылкой для просмотра вакансии в свободном доступе
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/vacancy/${vacancy.id}`}
                    readOnly
                    className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded-md bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/vacancy/${vacancy.id}`);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Icon name="Copy" size={14} className="mr-2" />
                    Копировать
                  </Button>
                </div>
              </div>
            </>
          )}

          {vacancy.referralLink && (
            <>
              <Separator />
              <div className="space-y-2 sm:space-y-3 bg-muted/50 p-3 sm:p-4 rounded-lg">
                <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                  <Icon name="Link" size={16} />
                  Реферальная ссылка
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Поделитесь этой ссылкой с потенциальным кандидатом для получения вознаграждения
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={vacancy.referralLink}
                    readOnly
                    className="flex-1 px-2 sm:px-3 py-2 text-xs sm:text-sm border rounded-md bg-background"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(vacancy.referralLink || '');
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Icon name="Copy" size={14} className="mr-2" />
                    Копировать
                  </Button>
                </div>
              </div>
            </>
          )}

          {vacancy.status === 'archived' && onRestore && (
            <Button className="w-full" size="lg" variant="outline" onClick={() => onRestore(vacancy.id)}>
              <Icon name="RotateCcw" size={18} className="mr-2" />
              Активировать вакансию
            </Button>
          )}

          {showRecommendButton && vacancy.status === 'active' && onRecommend && (
            <Button className="w-full" size="lg" onClick={onRecommend}>
              <Icon name="UserPlus" size={18} className="mr-2" />
              Рекомендовать кандидата
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}