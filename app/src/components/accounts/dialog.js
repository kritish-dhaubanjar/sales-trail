import { z } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField } from '@/components/ui/form';
import { ReloadIcon } from '@radix-ui/react-icons';

import { useToast } from '@/hooks/use-toast';
import { createAccount, updateAccount } from '@/services/account.service';

const schema = z.object({
  id: z.coerce.number(),
  name: z.string().min(1, { message: 'Account name is required' }),
});

const DEFAULT_ACCOUNT = { id: '', name: '' };

export function AccountDialog({ open = true, row = null, refetch = () => { }, onClose = () => { } }) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_ACCOUNT,
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    const defaultValue = row || DEFAULT_ACCOUNT;
    reset(defaultValue);
  }, [row, reset, open]);

  const { mutate, isLoading } = useMutation(
    (data) => {
      const mutation = Boolean(data.id) ? updateAccount : createAccount;
      return mutation(data);
    },
    {
      onSuccess: (response) => {
        refetch();
        onClose();
        toast({ title: `Account "${response.data.name}" successfully saved.` });
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
          <DialogTitle>{Boolean(row) ? 'Edit' : 'Add'} Account</DialogTitle>
          <DialogDescription>Click save when you're done.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(mutate)}>
          <Form {...form}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-6 items-center gap-4">
                <Label htmlFor="name" className="text-right col-span-2">
                  Account Name
                </Label>

                <FormField
                  name="id"
                  control={control}
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input type="text" placeholder="Cash" {...field} className="col-span-4" />
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
