'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname, locales } from '@/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const onSelectChange = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Select defaultValue={locale} onValueChange={onSelectChange}>
      <SelectTrigger className="w-[180px]">
        <Globe className="mr-2 h-4 w-4" />
        <SelectValue placeholder={t('placeholder')} />
      </SelectTrigger>
      <SelectContent>
        {locales.map((cur) => (
          <SelectItem key={cur} value={cur}>
            {t('locale', { locale: cur })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Add translations for LocaleSwitcher to message files
// messages/en.json
/*
{
  "LocaleSwitcher": {
    "placeholder": "Select language",
    "locale": "{locale, select, en {English} tr {Türkçe} other {Unknown}}"
  },
  ...
}
*/

// messages/tr.json
/*
{
  "LocaleSwitcher": {
    "placeholder": "Dil seçin",
    "locale": "{locale, select, en {English} tr {Türkçe} other {Bilinmeyen}}"
  },
  ...
}
*/
