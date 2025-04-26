'use client';

import React, { useState } from 'react';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Filter, RefreshCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components

interface FilterControlsProps {
  filterEnabled: boolean;
  onToggleFilter: (enabled: boolean) => void;
  startTime: Date | null;
  endTime: Date | null;
  onStartTimeChange: (date: Date | null) => void;
  onEndTimeChange: (date: Date | null) => void;
  onClearFilters: () => void;
}

export function FilterControls({
  filterEnabled,
  onToggleFilter,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  onClearFilters,
}: FilterControlsProps) {
    const t = useTranslations('FilterControls');
    const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
    const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

    const handleClear = () => {
        onClearFilters();
        setIsStartCalendarOpen(false);
        setIsEndCalendarOpen(false);
    }

  return (
    <Card className="mb-6 shadow-sm">
        <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" /> {t('title')}
             </CardTitle>
        </CardHeader>
      <CardContent className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between p-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="threshold-filter"
            checked={filterEnabled}
            onCheckedChange={onToggleFilter}
          />
          <Label htmlFor="threshold-filter">{t('thresholdSwitchLabel')}</Label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full sm:w-[200px] justify-start text-left font-normal',
                  !startTime && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startTime ? format(startTime, 'PPP') : <span>{t('startDateButton')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startTime ?? undefined}
                onSelect={(date) => {
                    onStartTimeChange(date ?? null);
                    setIsStartCalendarOpen(false);
                 }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                 className={cn(
                  'w-full sm:w-[200px] justify-start text-left font-normal',
                  !endTime && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endTime ? format(endTime, 'PPP') : <span>{t('endDateButton')}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endTime ?? undefined}
                 onSelect={(date) => {
                     onEndTimeChange(date ?? null);
                     setIsEndCalendarOpen(false);
                 }}
                disabled={(date) =>
                  startTime ? date < startTime : false
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button variant="ghost" onClick={handleClear} className="w-full sm:w-auto">
          <RefreshCcw className="mr-2 h-4 w-4" /> {t('clearButton')}
        </Button>
      </CardContent>
    </Card>
  );
}
