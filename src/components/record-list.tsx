
'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { Trash2, HeartPulse, Droplet } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RecordData, Thresholds } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RecordListProps {
  records: RecordData[];
  thresholds: Thresholds;
  onDelete: (id: string) => void;
}

export function RecordList({ records, thresholds, onDelete }: RecordListProps) {
  const t = useTranslations('RecordList');
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
      setIsClient(true);
    }, []);


  const isOverThreshold = (record: RecordData) => {
    const systolicHigh = record.systolic > thresholds.systolic;
    const diastolicHigh = record.diastolic > thresholds.diastolic;
    // Only check heart rate threshold if heart rate exists and is a number
    const heartRateHigh = record.heartRate !== null && typeof record.heartRate === 'number' && record.heartRate > thresholds.heartRate;

    return systolicHigh || diastolicHigh || heartRateHigh;
  };

  if (!isClient) {
      // Render a loading state or nothing on the server to avoid hydration issues
      return null;
  }


  if (!records || records.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-8">
        {t('noRecords')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const overThreshold = isOverThreshold(record);
        return (
          <Card key={record.id} className={cn("shadow-md hover:shadow-lg transition-shadow duration-200", overThreshold ? "border-destructive border-2" : "")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                 <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Droplet className="h-5 w-5 text-muted-foreground" />
                    {record.systolic} / {record.diastolic}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{t('unitMmhg')}</span>
                 </CardTitle>
                 {/* Conditionally render Heart Rate */}
                 {record.heartRate !== null && typeof record.heartRate === 'number' && (
                     <CardDescription className="flex items-center gap-1 text-sm">
                       <HeartPulse className="h-4 w-4 text-muted-foreground" />
                       {record.heartRate} {t('unitBpm')}
                     </CardDescription>
                 )}
              </div>
               <div className="flex items-center gap-2">
                 {overThreshold && (
                   <Badge variant="destructive">{t('highBadge')}</Badge>
                 )}
                 <Button
                   variant="ghost"
                   size="icon"
                   className="text-muted-foreground hover:text-destructive"
                   onClick={() => onDelete(record.id)}
                   aria-label={t('deleteButtonLabel')}
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
               </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(record.timestamp), 'PPP p')} {/* Format includes Date and Time */}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
