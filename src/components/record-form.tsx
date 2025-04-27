
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
const parseBloodPressureInput = (val: string | number | undefined | null, ctx: z.RefinementCtx): number | typeof z.NEVER => {
    if (val === null || val === undefined || val === '') {
        // This case should be handled by Zod's required checks, but added for safety
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Required", // Use a generic required message or get from translations
        });
        return z.NEVER;
    }
    // Ensure val is a string before replacing
    const stringVal = typeof val === 'number' ? val.toString() : val;
    const cleanedVal = stringVal.replace(/[.,]/g, '');
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
    systolic: z.preprocess(
        (val) => (val === '' ? undefined : val), // Convert empty string to undefined for transform
        z.string({ required_error: t('systolicRequired') })
          .transform((val, ctx) => parseBloodPressureInput(val, ctx))
          .pipe(z.number().min(50, { message: `${t('systolicRequired')} (Min 50)` }).max(250, { message: 'Max 250' }))
      ),
    diastolic: z.preprocess(
        (val) => (val === '' ? undefined : val), // Convert empty string to undefined for transform
        z.string({ required_error: t('diastolicRequired') })
            .transform((val, ctx) => parseBloodPressureInput(val, ctx))
            .pipe(z.number().min(30, { message: `${t('diastolicRequired')} (Min 30)` }).max(200, { message: 'Max 200' }))
       ),
    // Make heartRate optional and nullable
    heartRate: z.preprocess(
        (val) => (val === '' ? null : val), // Convert empty string to null
        z.coerce.number().min(30, { message: `Min 30` }).max(250, { message: 'Max 250' })
            .optional()
            .nullable() // Allow null value
    ),
    timestamp: z.date({ required_error: t('timestampRequired') }),
  }), [t]);


  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systolic: '', // Keep as empty string for input
      diastolic: '', // Keep as empty string for input
      heartRate: null, // Default to null for optional field
      timestamp: new Date(),
    },
  });

    // Effect to set initial timestamp, preventing hydration mismatch
    // and ensuring the date logic runs client-side
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => {
      setIsClient(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount


   // Popover state for date picker
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

    const handleDateSelect = React.useCallback((date: Date | undefined) => {
        if (date) {
            const currentTimestamp = form.getValues('timestamp') || new Date();
            // Keep existing time if user only selects a date
            const currentHours = currentTimestamp instanceof Date ? currentTimestamp.getHours() : new Date().getHours();
            const currentMinutes = currentTimestamp instanceof Date ? currentTimestamp.getMinutes() : new Date().getMinutes();
            const currentSeconds = currentTimestamp instanceof Date ? currentTimestamp.getSeconds() : new Date().getSeconds();

            date.setHours(currentHours);
            date.setMinutes(currentMinutes);
            date.setSeconds(currentSeconds);

            form.setValue('timestamp', date, { shouldValidate: true }); // Validate on change
            setIsCalendarOpen(false); // Close popover after selecting
        } else {
            // Allow clearing the date, Zod will handle validation
            form.setValue('timestamp', undefined as any, { shouldValidate: true }); // Handle clearing the date and validate
        }
    }, [form]);

     const handleTimeChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        const currentTimestamp = form.getValues('timestamp'); // Use field value or new Date if undefined

         // Ensure currentTimestamp is a valid Date object before proceeding
         if (!(currentTimestamp instanceof Date && !isNaN(currentTimestamp.getTime()))) {
             // If timestamp is not valid, perhaps set a default or handle error
             console.warn("Cannot set time without a valid date selected.");
             // Optionally, reset the time input or show a message
             e.target.value = ''; // Reset time input if date is invalid
             return; // Prevent further execution if date is invalid
         }

        const newDate = new Date(currentTimestamp); // Clone to avoid mutation
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        form.setValue('timestamp', newDate, { shouldValidate: true }); // Validate on change
    }, [form]);

  function onSubmit(values: FormValues) {
    // Values are already transformed and validated numbers/null here
    const newRecord: RecordData = {
      id: Date.now().toString(),
      systolic: values.systolic, // Now correctly typed as number
      diastolic: values.diastolic, // Now correctly typed as number
      heartRate: values.heartRate, // Can be number or null
      timestamp: values.timestamp.toISOString(),
    };
    onSave(newRecord);

    form.reset({
        systolic: '', // Reset to empty strings
        diastolic: '',
        heartRate: null, // Reset optional field to null
        timestamp: new Date(), // Reset to current time for next entry
    });
    toast({
        title: t('saveSuccessTitle'),
        description: `BP: ${values.systolic}/${values.diastolic}${values.heartRate ? `, HR: ${values.heartRate}` : ''}`, // Conditionally show HR
    });
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
              {/* Systolic Field */}
              <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground" /> {t('systolicLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="text" // Keep as text to allow flexible input like "12,0"
                        inputMode="decimal" // Better hint for numeric keyboard with decimals
                        placeholder={t('systolicPlaceholder')}
                        {...field}
                        // value is controlled by react-hook-form
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Diastolic Field */}
               <FormField
                control={form.control}
                name="diastolic"
                 render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground"/> {t('diastolicLabel')}</FormLabel>
                    <FormControl>
                     <Input
                       type="text" // Keep as text
                       inputMode="decimal" // Better hint
                       placeholder={t('diastolicPlaceholder')}
                       {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             {/* Heart Rate Field */}
              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    {/* Remove required indicator if applicable from label style */}
                    <FormLabel className="flex items-center">
                      <HeartPulse className="mr-1 h-4 w-4 text-muted-foreground" /> {t('heartRateLabel')}
                      <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number" // Can remain number, but handled by preprocess
                        placeholder={t('heartRatePlaceholder')}
                        {...field}
                        // Adjust onChange to handle potential null/undefined correctly
                        onChange={e => field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)}
                        // Value should handle null correctly for controlled input
                        value={field.value === null || field.value === undefined ? '' : field.value}
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
                        selected={field.value instanceof Date && !isNaN(field.value.getTime()) ? field.value : undefined} // Ensure selected is a valid Date
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                       <div className="p-3 border-t border-border">
                         <Label htmlFor="time-input">{t('timeLabel')}</Label>
                        <Input
                            id="time-input"
                            type="time"
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
