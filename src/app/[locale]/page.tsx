'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { parseISO, startOfDay, endOfDay } from 'date-fns';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { RecordForm } from '@/components/record-form';
import { RecordList } from '@/components/record-list';
import { ThresholdSettings } from '@/components/threshold-settings';
import { FilterControls } from '@/components/filter-controls';
import useLocalStorage from '@/hooks/use-local-storage';
import type { RecordData, Thresholds } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_THRESHOLDS: Thresholds = {
  systolic: 130,
  diastolic: 80,
  heartRate: 100,
};

export default function Home() {
  const t = useTranslations('HomePage');
  const tToast = useTranslations('RecordList'); // Use translation for toast messages

  const [records, setRecords] = useLocalStorage<RecordData[]>('bp_records', []);
  const [thresholds, setThresholds] = useLocalStorage<Thresholds>(
    'bp_thresholds',
    DEFAULT_THRESHOLDS
  );
  const [filterEnabled, setFilterEnabled] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSaveRecord = useCallback((newRecord: RecordData) => {
    setRecords((prevRecords) => [newRecord, ...prevRecords]);
    // Note: RecordForm handles its own success toast
  }, [setRecords]);

  const handleDeleteRecord = useCallback((id: string) => {
    setRecords((prevRecords) => prevRecords.filter((record) => record.id !== id));
    toast({
        title: tToast('deleteSuccessTitle'),
        description: tToast('deleteSuccessDescription'),
        variant: "destructive"
    });
  }, [setRecords, toast, tToast]);

  const handleUpdateThresholds = useCallback((newThresholds: Thresholds) => {
    setThresholds(newThresholds);
    // Note: ThresholdSettings handles its own success toast
  }, [setThresholds]);

   const handleClearFilters = useCallback(() => {
    setFilterEnabled(false);
    setStartTime(null);
    setEndTime(null);
  }, []);

  const filteredRecords = useMemo(() => {
    let tempRecords = [...records];

    // Sort records by timestamp descending (most recent first)
    tempRecords.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());

    // Apply date filters
    if (startTime) {
       const start = startOfDay(startTime); // Ensure comparison starts from the beginning of the day
      tempRecords = tempRecords.filter(record => parseISO(record.timestamp) >= start);
    }
    if (endTime) {
        const end = endOfDay(endTime); // Ensure comparison includes the entire end day
      tempRecords = tempRecords.filter(record => parseISO(record.timestamp) <= end);
    }

    // Apply threshold filter if enabled
    if (filterEnabled) {
      tempRecords = tempRecords.filter(
        (record) =>
          record.systolic > thresholds.systolic ||
          record.diastolic > thresholds.diastolic ||
          record.heartRate > thresholds.heartRate
      );
    }

    return tempRecords;
  }, [records, thresholds, filterEnabled, startTime, endTime]);


  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-2 flex items-center justify-center gap-2">
            <Heart className="h-8 w-8 text-primary" /> {t('title')}
        </h1>
        <p className="text-lg text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>

      <RecordForm onSave={handleSaveRecord} />

      <div className="mt-8 flex justify-end mb-4">
         <ThresholdSettings
             thresholds={thresholds}
             onUpdateThresholds={handleUpdateThresholds}
           />
      </div>


      <FilterControls
          filterEnabled={filterEnabled}
          onToggleFilter={setFilterEnabled}
          startTime={startTime}
          endTime={endTime}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onClearFilters={handleClearFilters}
       />


      <RecordList
        records={filteredRecords}
        thresholds={thresholds}
        onDelete={handleDeleteRecord}
      />
    </main>
  );
}
