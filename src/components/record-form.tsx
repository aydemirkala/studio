'use client';

import React, { useState, useEffect } from 'react'; // Import useEffect
import { format } from 'date-fns';
import { Calendar as CalendarIcon, HeartPulse, Droplet, Activity } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

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

interface RecordFormProps {
  onSave: (record: RecordData) => void;
}

const formSchema = z.object({
  systolic: z.coerce.number().min(1, { message: 'Systolic pressure is required.' }).max(300),
  diastolic: z.coerce.number().min(1, { message: 'Diastolic pressure is required.' }).max(200),
  heartRate: z.coerce.number().min(1, { message: 'Heart rate is required.' }).max(250),
  // Make timestamp optional initially to avoid hydration mismatch
  timestamp: z.date({ required_error: 'A date and time is required.' }),
});

export function RecordForm({ onSave }: RecordFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systolic: undefined,
      diastolic: undefined,
      heartRate: undefined,
      timestamp: undefined, // Initialize as undefined to prevent hydration error
    },
  });

  // Set default date only on the client after mount to prevent hydration mismatch
  useEffect(() => {
    if (!form.getValues('timestamp')) {
      form.setValue('timestamp', new Date(), { shouldValidate: false, shouldDirty: false });
    }
    // Only run this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures it runs only once after mount


   // Popover state for date picker
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Ensure timestamp has a value before submitting (should be set by useEffect or user)
    if (!values.timestamp) {
        toast({
            title: "Error",
            description: "Please select a valid date and time.",
            variant: "destructive",
        });
        return;
    }

    const newRecord: RecordData = {
      id: Date.now().toString(),
      systolic: values.systolic,
      diastolic: values.diastolic,
      heartRate: values.heartRate,
      timestamp: values.timestamp.toISOString(),
    };
    onSave(newRecord);
    // Reset form, keeping timestamp potentially as undefined until next mount effect
    form.reset({
        systolic: undefined,
        diastolic: undefined,
        heartRate: undefined,
        timestamp: new Date(), // Reset to current time for next entry
    });
    toast({
        title: "Record Saved",
        description: `BP: ${values.systolic}/${values.diastolic}, HR: ${values.heartRate}`,
    });
  }

  return (
    <Card className="w-full max-w-lg mx-auto mb-8 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">Add New Record</CardTitle>
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
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground" /> Systolic (mmHg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 120" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''}/>
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
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground"/> Diastolic (mmHg)</FormLabel>
                    <FormControl>
                     <Input type="number" placeholder="e.g. 80" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
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
                    <FormLabel className="flex items-center"><HeartPulse className="mr-1 h-4 w-4 text-muted-foreground" /> Heart Rate (BPM)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 70" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} value={field.value ?? ''} />
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
                  <FormLabel>Date and Time</FormLabel>
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
                          {field.value ? (
                            format(field.value, 'PPP p') // Format includes date and time
                          ) : (
                            <span>Pick a date and time</span> // Display placeholder initially
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            // Keep existing time if user only selects a date
                            const current = field.value || new Date(); // Use current state or new Date if undefined
                            date.setHours(current.getHours());
                            date.setMinutes(current.getMinutes());
                            date.setSeconds(current.getSeconds());
                            field.onChange(date);
                             setIsCalendarOpen(false); // Close popover after selecting
                          } else {
                            field.onChange(undefined); // Handle clearing the date
                          }
                        }}
                         initialFocus
                      />
                       <div className="p-3 border-t border-border">
                         <Label htmlFor="time-input">Time</Label>
                        <Input
                            id="time-input"
                            type="time"
                            // Use field value for default, fallback to current time if field.value is null/undefined
                            defaultValue={field.value ? format(field.value, 'HH:mm') : format(new Date(), 'HH:mm')}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = field.value ? new Date(field.value) : new Date(); // Use field value or new Date if undefined
                                newDate.setHours(hours);
                                newDate.setMinutes(minutes);
                                field.onChange(newDate); // Trigger update with new Date object
                            }}
                            className="mt-1"
                            // Disable time input if no date is selected yet
                            disabled={!field.value}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              <Activity className="mr-2 h-4 w-4" /> Save Record
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
