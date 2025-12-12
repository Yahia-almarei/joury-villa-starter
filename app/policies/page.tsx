'use client';

import { useTranslation } from '@/lib/use-translation';

export default function PoliciesPage() {
  const { t } = useTranslation('policies');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{t('title')}</h1>
        <p className="text-lg text-gray-600">{t('comingSoon')}</p>
      </div>
    </div>
  );
}