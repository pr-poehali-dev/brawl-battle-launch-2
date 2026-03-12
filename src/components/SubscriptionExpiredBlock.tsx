import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface SubscriptionExpiredBlockProps {
  onRenew: () => void;
}

export function SubscriptionExpiredBlock({ onRenew }: SubscriptionExpiredBlockProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-2xl w-full border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Icon name="Lock" size={40} className="text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold text-gray-900">
              Подписка истекла
            </h2>
            <p className="text-lg text-gray-700">
              Доступ к этому разделу временно ограничен
            </p>
          </div>

          <div className="bg-white/80 rounded-lg p-6 space-y-3">
            <p className="text-gray-600">
              Для восстановления доступа к сотрудникам, вакансиям, рекомендациям и чатам продлите тарифный план
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Icon name="Users" size={16} className="text-primary" />
                <span>Сотрудники</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="Briefcase" size={16} className="text-primary" />
                <span>Вакансии</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="ThumbsUp" size={16} className="text-primary" />
                <span>Рекомендации</span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="MessageSquare" size={16} className="text-primary" />
                <span>Чаты</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onRenew}
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Icon name="Zap" size={20} className="mr-2" />
              Продлить подписку
            </Button>
            
            <p className="text-sm text-gray-500">
              или свяжитесь с поддержкой:{' '}
              <a href="mailto:support@ihunt.ru" className="text-primary hover:underline">
                support@ihunt.ru
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
