import { z } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ReloadIcon } from '@radix-ui/react-icons';

import 'nepali-datepicker-reactjs/dist/index.css';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';

import { NepaliDate } from '@/lib/date';
import { useToast } from '@/hooks/use-toast';
import { getAccounts } from '@/services/account.service';
import { createTransfer, updateTransfer } from '@/services/transfer.service';

const schema = z.object({
  id: z.coerce.number(),
  date: z.string({ required_error: 'A date of sale is required.' }),
  title: z.string().min(1, { message: 'Transfer remark is required' }),
  description: z.string().nullable(),
  from_account_id: z.coerce.number().gt(0, { message: 'From A/C is required' }),
  to_account_id: z.coerce.number().gt(0, { message: 'To A/C is required' }),
  amount: z.coerce.number().gt(0, { message: 'Transfer Amount is required' }),
});

const DEFAULT_TRANSFER = { id: '', date: NepaliDate.getNepaliDate(), title: '', description: '', from_account_id: 1, to_account_id: 1, amount: '' };

export function TransferDialog({ open = true, row = null, refetch = () => { }, onClose = () => { } }) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_TRANSFER,
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    const defaultValue = row || DEFAULT_TRANSFER;
    reset(defaultValue);
  }, [row, reset, open]);

  const { data: accounts, isFetching: isFetchingAccounts } = useQuery({
    queryKey: ['accounts'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => {
      return getAccounts({ page: 1, limit: 10240, query: '' });
    },
  });

  const { mutate, isLoading } = useMutation(
    (data) => {
      const mutation = Boolean(data.id) ? updateTransfer : createTransfer;
      return mutation(data);
    },
    {
      onSuccess: (response) => {
        refetch();
        onClose();
        toast({ title: `Transfer "${response.data.title}" successfully saved.` });
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error?.response?.data?.message,
        });
      },
    },
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{Boolean(row) ? 'Edit' : 'Add'} Transfer</DialogTitle>
          <DialogDescription>Click save when you're done.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(mutate)}>
          <Form {...form}>
            <div className="py-4">
              <div className="items-center">
                <FormField
                  name="id"
                  control={control}
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  control={control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col mb-3">
                      <FormLabel>Date</FormLabel>

                      <NepaliDatePicker
                        className="w-full"
                        inputClassName="text-sm px-2 py-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full pl-3 text-left font-normal"
                        value={field.value || ''}
                        onChange={field.onChange}
                        options={{ calenderLocale: 'en', valueLocale: 'en' }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    name="from_account_id"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="mb-3 w-full">
                        <FormLabel className="font-medium">From A/C</FormLabel>
                        <FormControl>
                          <Select
                            className="w-full"
                            value={String(field.value)}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue
                                placeholder={<span className="text-gray-500">Select A/C</span>}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Accounts</SelectLabel>
                                {accounts?.data?.data.map(({ id, name }) => (
                                  <SelectItem key={id} value={String(id)}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="to_account_id"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="mb-3 w-full">
                        <FormLabel className="font-medium">To A/C</FormLabel>
                        <FormControl>
                          <Select
                            className="w-full"
                            value={String(field.value)}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue
                                placeholder={<span className="text-gray-500">Select A/C</span>}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Accounts</SelectLabel>
                                {accounts?.data?.data.map(({ id, name }) => (
                                  <SelectItem key={id} value={String(id)}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="mb-3 w-full">
                      <FormLabel className="font-medium">Amount</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="70.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel className="font-medium">Remark</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="Cash → eSewa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel className="font-medium">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your description here for Cash → eSewa transfer..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </Form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" className="mb-1" disabled={isLoading}>
              {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
