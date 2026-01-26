import React from 'react';
import { z } from 'zod';
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
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { BoxIcon, ReloadIcon } from '@radix-ui/react-icons';

import { useToast } from '@/hooks/use-toast';
import { transferTable } from '@/services/table.service';

const schema = z.object({
  table_id: z.coerce.number(),
});

export function TableTransferDialog({
  open = true,
  tableId = null,
  tables = [],
  setTableId = () => {},
  refetch = () => {},
  onClose = () => {},
}) {
  const DEFAULT_TABLE = { table_id: '' };

  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_TABLE,
  });

  const { control, handleSubmit } = form;

  const { mutate, isLoading } = useMutation(
    async (data) => {
      return transferTable({ id: tableId, table_id: data.table_id });
    },
    {
      onSuccess: (data) => {
        setTableId(data?.data?.id);
        refetch();
        onClose();
        toast({ title: `Table successfully transfered.` });
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
          <DialogTitle>Transfer Table</DialogTitle>
          <DialogDescription>Click save when you're done.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(mutate)}>
          <Form {...form}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Table Name
                </Label>

                <div className="col-span-2">
                  <FormField
                    name="table_id"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormControl>
                          <Select
                            value={String(field.value)}
                            onValueChange={(value) => value && field.onChange(value)}
                          >
                            <SelectTrigger className="h-[30px!important] w-[180px]">
                              <SelectValue
                                placeholder={<span className="text-gray-500">Select Table</span>}
                              />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectGroup>
                                {tables
                                  ?.filter(({ items }) => !items.length)
                                  ?.sort((table) => (table.items.length ? -1 : 1))
                                  .map((table) => (
                                    <SelectItem key={table.id} value={String(table.id)}>
                                      <div className="flex items-center justify-between">
                                        <BoxIcon className="h-4 w-4" />
                                        <span className="ml-2">{table.name}</span>
                                      </div>
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
            </div>
          </Form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" className="mb-1" disabled={isLoading}>
              {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />} Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
