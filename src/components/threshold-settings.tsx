'use client';

import React from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Settings, Save, HeartPulse, Droplet } from 'lucide-react';

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

const formSchema = z.object({
  systolic: z.coerce.number().min(1, { message: 'Systolic threshold required.' }).max(300),
  diastolic: z.coerce.number().min(1, { message: 'Diastolic threshold required.' }).max(200),
  heartRate: z.coerce.number().min(1, { message: 'Heart rate threshold required.' }).max(250),
});

export function ThresholdSettings({ thresholds, onUpdateThresholds }: ThresholdSettingsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = React.useState(false);

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
      title: 'Thresholds Updated',
      description: `Systolic: ${values.systolic}, Diastolic: ${values.diastolic}, Heart Rate: ${values.heartRate}`,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" /> Thresholds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Thresholds</DialogTitle>
          <DialogDescription>
            Set the values above which readings will be highlighted.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground" /> Systolic (mmHg)</FormLabel>
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
                    <FormLabel className="flex items-center"><Droplet className="mr-1 h-4 w-4 text-muted-foreground"/> Diastolic (mmHg)</FormLabel>
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
                    <FormLabel className="flex items-center"><HeartPulse className="mr-1 h-4 w-4 text-muted-foreground" /> Heart Rate (BPM)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <Button type="submit">
                 <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
