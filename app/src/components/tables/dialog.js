import { z } from 'zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { zodResolver } from '@hookform/resolvers/zod';

import DevTool from '@/components/DevTool';

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
import { ReloadIcon } from '@radix-ui/react-icons';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';
import { createTable, updateTable } from '@/services/table.service';

const schema = z.object({
  id: z.coerce.number(),

  is_delivery: z.preprocess((val) => {
    if (val === "1" || val === 1) return true
    if (val === "0" || val === 0) return false
    return val
  }, z.boolean()),

  name: z.string().min(1, { message: 'Table name is required' }),
  account_id: z.coerce.string().nullable().optional().default(null)
});

export function TableDialog({
  isDelivery = false,
  open = true,
  row = null,
  accounts = [],
  refetch = () => { },
  onClose = () => { },
}) {
  const DEFAULT_TABLE = { id: '', is_delivery: isDelivery, name: '', account_id: null };

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_TABLE,
  });

  const { control, handleSubmit, reset } = form;

  useEffect(() => {
    const defaultValue = row || DEFAULT_TABLE;
    reset(defaultValue);
  }, [row, reset, open]);

  const { mutate, isLoading } = useMutation(
    (data) => {
      const mutation = Boolean(data.id) ? updateTable : createTable;
      return mutation(data);
    },
    {
      onSuccess: (response) => {
        refetch();
        onClose();
        toast({ title: `Table "${response.data.name}" successfully saved.` });
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
          <DialogTitle>{Boolean(row) ? 'Edit' : 'Add'} Table</DialogTitle>
          <DialogDescription>Click save when you're done.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(mutate)}>
          <Form {...form}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Table Name
                </Label>

                <FormField
                  name="id"
                  control={control}
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <Controller
                  control={control}
                  name="is_delivery"
                  defaultValue={isDelivery}
                  render={(field) => <input type="hidden" {...field} />}
                />

                <FormField
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input type="text" placeholder="Table #1" {...field} className="col-span-3" />
                  )}
                />

              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  A/C
                </Label>

                <FormField
                  className="col-span-3"
                  name="account_id"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="mb-3 w-full col-span-3">
                      <FormControl>
                        <Select
                          className="w-full"
                          value={String(field.value)}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-[30px!important] w-full">
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

      <DevTool control={control} />
    </Dialog>
  );
}
