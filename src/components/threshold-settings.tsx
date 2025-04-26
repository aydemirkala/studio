'use client';

import * as React from 'react'; // Import React using * as React
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Settings, Save, HeartPulse, Droplet } from 'lucide-react';
import { useTranslations } from 'next-intl'; // Import useTranslations

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Thresholds } from '@/lib/types';

interface ThresholdSettingsProps {
  thresholds: Thresholds;
  onUpdateThresholds: (newThresholds: Thresholds) => void;
}

export function ThresholdSettings({ thresholds, onUpdateThresholds }: ThresholdSettingsProps) {
  const t = useTranslations('ThresholdSettings'); // Initialize translations
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);

   // Define Zod schema dynamically based on translations
   const formSchema = React.useMemo(() => z.object({
    systolic: z.coerce.number().min(1, { message: t('systolicRequired') }).max(300),
    diastolic: z.coerce.number().min(1, { message: t('diastolicRequired') }).max(200),
    heartRate: z.coerce.number().min(1, { message: t('heartRateRequired') }).max(250),
   }), [t]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: thresholds,
  });

  // Update form default values when thresholds prop changes
  React.useEffect(() => {
    form.reset(thresholds);
  }, [thresholds, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const newThresholds: Thresholds = {
      systolic: values.systolic,
      diastolic: values.diastolic,
      heartRate: values.heartRate,
    };
    onUpdateThresholds(newThresholds);
    setIsOpen(false); // Close dialog on save
    toast({
      title: t('updateSuccessTitle'),
      description: `${t('systolicLabel')}: ${values.systolic}, ${t('diastolicLabel')}: ${values.diastolic}, ${t('heartRateLabel')}: ${values.heartRate}`,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" /> {t('buttonText')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('dialogTitle')}</DialogTitle>
          <DialogDescription>
            {t('dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground" /> {t('systolicLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="diastolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground"/> {t('diastolicLabel')}</FormLabel>
                    <FormControl>
                     <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><HeartPulse className="mr-1 h-4 w-4 text-muted-foreground" /> {t('heartRateLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <Button type="submit">
                 <Save className="mr-2 h-4 w-4" /> {t('saveButton')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
