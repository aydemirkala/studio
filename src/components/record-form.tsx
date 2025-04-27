'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, HeartPulse, Droplet, Activity } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { RecordData } from '@/lib/types';
import { usePathname, useRouter } from '@/navigation'; // Import useRouter and usePathname

interface RecordFormProps {
  onSave: (record: RecordData) => void;
}

// Helper function to parse BP input, handling comma/decimal
const parseBloodPressureInput = (val: string, ctx: z.RefinementCtx): number | typeof z.NEVER => {
    if (val === null || val === undefined || val === '') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Required", // Use a generic required message or get from translations
        });
        return z.NEVER;
    }
    const cleanedVal = val.toString().replace(/[.,]/g, '');
    const num = parseInt(cleanedVal, 10);
    if (isNaN(num)) {
        ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: 'number',
            received: 'nan',
            message: 'Invalid number format', // Or use translation
        });
        return z.NEVER;
    }
    return num;
};

export function RecordForm({ onSave }: RecordFormProps) {
  const t = useTranslations('RecordForm');
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Define Zod schema dynamically based on translations
  const formSchema = React.useMemo(() => z.object({
    systolic: z.string()
      .transform((val, ctx) => parseBloodPressureInput(val, ctx))
      .pipe(z.number().min(50, { message: t('systolicRequired') + ' (Min 50)' }).max(250, { message: 'Max 250' })), // Added min/max
    diastolic: z.string()
      .transform((val, ctx) => parseBloodPressureInput(val, ctx))
      .pipe(z.number().min(30, { message: t('diastolicRequired') + ' (Min 30)' }).max(200, { message: 'Max 200' })), // Added min/max
    heartRate: z.coerce.number().min(30, { message: t('heartRateRequired') + ' (Min 30)' }).max(250, { message: 'Max 250' }), // Updated min/max
    timestamp: z.date({ required_error: t('timestampRequired') }),
  }), [t]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Use strings for initial values to match the schema base type
      systolic: '',
      diastolic: '',
      heartRate: undefined, // Keep as undefined for coerce.number
      timestamp: new Date(), // Keep initial date for better UX
    },
  });

    // Effect to set initial timestamp, preventing hydration mismatch
    // and ensuring the date logic runs client-side
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => {
      setIsClient(true);
      // No need to set timestamp here as defaultValues handles it
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount


   // Popover state for date picker
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

    const handleDateSelect = React.useCallback((date: Date | undefined) => {
        if (date) {
            const currentTimestamp = form.getValues('timestamp') || new Date();
            // Keep existing time if user only selects a date
            date.setHours(currentTimestamp.getHours());
            date.setMinutes(currentTimestamp.getMinutes());
            date.setSeconds(currentTimestamp.getSeconds());
            form.setValue('timestamp', date, { shouldValidate: true }); // Validate on change
            setIsCalendarOpen(false); // Close popover after selecting
        } else {
            // Allow clearing the date, Zod will handle validation
            form.setValue('timestamp', undefined as any, { shouldValidate: true }); // Handle clearing the date and validate
        }
    }, [form]);

     const handleTimeChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const currentTimestamp = form.getValues('timestamp') || new Date(); // Use field value or new Date if undefined
        const newDate = new Date(currentTimestamp); // Clone to avoid mutation
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        form.setValue('timestamp', newDate, { shouldValidate: true }); // Validate on change
    }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Values are already transformed and validated numbers here
    const newRecord: RecordData = {
      id: Date.now().toString(),
      systolic: values.systolic,
      diastolic: values.diastolic,
      heartRate: values.heartRate,
      timestamp: values.timestamp.toISOString(),
    };
    onSave(newRecord);

    form.reset({
        systolic: '', // Reset to empty strings
        diastolic: '',
        heartRate: undefined,
        timestamp: new Date(), // Reset to current time for next entry
    });
    toast({
        title: t('saveSuccessTitle'),
        description: `BP: ${values.systolic}/${values.diastolic}, HR: ${values.heartRate}`,
    });
    // Refresh the page to ensure locale consistency after form reset if needed
    // router.refresh(); // Consider if this is necessary for your locale setup
  }

  // Render only on the client to avoid hydration errors with the initial date
  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <Card className="w-full max-w-lg mx-auto mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground" /> {t('systolicLabel')}</FormLabel>
                    <FormControl>
                      {/* Use type="text" and inputMode="numeric" for better BP input */}
                      <Input
                        type="text"
                        inputMode="numeric" // Suggest numeric keyboard on mobile
                        placeholder={t('systolicPlaceholder')}
                        {...field} // Pass the field props directly
                        // value is already handled by field
                       />
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
                     {/* Use type="text" and inputMode="numeric" for better BP input */}
                     <Input
                       type="text"
                       inputMode="numeric" // Suggest numeric keyboard on mobile
                       placeholder={t('diastolicPlaceholder')}
                       {...field} // Pass the field props directly
                       // value is already handled by field
                       />
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
                      {/* Keep type="number" for heart rate */}
                      <Input
                        type="number"
                        placeholder={t('heartRatePlaceholder')}
                        {...field}
                        onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t('timestampLabel')}</FormLabel>
                   <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                           {/* Conditional rendering based on field.value */}
                           {field.value instanceof Date && !isNaN(field.value.getTime()) ? (
                             format(field.value, 'PPP p') // Format includes date and time
                           ) : (
                             <span>{t('pickDateTime')}</span> // Display placeholder
                           )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                       <div className="p-3 border-t border-border">
                         <Label htmlFor="time-input">{t('timeLabel')}</Label>
                        <Input
                            id="time-input"
                            type="time"
                            // Set defaultValue using the formatted time or current time
                            defaultValue={field.value instanceof Date && !isNaN(field.value.getTime()) ? format(field.value, 'HH:mm') : format(new Date(), 'HH:mm')}
                            onChange={handleTimeChange}
                            className="mt-1"
                            disabled={!(field.value instanceof Date && !isNaN(field.value.getTime()))} // Disable if no valid date
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              <Activity className="mr-2 h-4 w-4" /> {t('saveButton')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
