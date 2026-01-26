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

import { useToast } from '@/hooks/use-toast';
import { getUnits } from '@/services/unit.service';
import { createItem, updateItem } from '@/services/item.service';
import { getCategories } from '@/services/category.service';

const schema = z.object({
  id: z.coerce.number(),
  price: z.coerce.number().gt(0, { message: 'Rate is required' }),
  unit_id: z.coerce.number().gt(0, { message: 'Unit is required' }),
  category_id: z.coerce.number().gt(0, { message: 'Category is required' }),
  description: z.string().nullable(),
  name: z.string().min(1, { message: 'Item name is required' }),
});

const DEFAULT_ITEM = { id: '', name: '', unit_id: '', description: '', price: '', category_id: '' };

export function ItemDialog({
  categoryType,
  open = true,
  row = null,
  refetch = () => {},
  onClose = () => {},
}) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_ITEM,
  });

  const { control, handleSubmit, reset, watch } = form;

  const unitId = watch('unit_id');
  const categoryId = watch('category_id');

  useEffect(() => {
    const defaultValue = row || DEFAULT_ITEM;
    reset(defaultValue);
  }, [row, reset, open]);

  const { data: units } = useQuery({
    queryKey: ['units'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => getUnits({ page: 1, limit: 1024, query: '' }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () =>
      getCategories({
        page: 1,
        limit: 1024,
        query: '',
        ...(categoryType && { category_type: categoryType }),
      }),
  });

  const { mutate, isLoading } = useMutation(
    (data) => {
      const mutation = Boolean(data.id) ? updateItem : createItem;
      return mutation(data);
    },
    {
      onSuccess: (response) => {
        refetch();
        onClose();
        toast({ title: `Item "${response.data.name}" successfully saved.` });
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
          <DialogTitle>{Boolean(row) ? 'Edit' : 'Add'} Item</DialogTitle>
          <DialogDescription>Click save when you're done.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(mutate)}>
            <div className="py-4">
              <div className="items-center">
                <FormField
                  name="id"
                  control={control}
                  render={({ field }) => <input type="hidden" {...field} />}
                />

                <FormField
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel className="font-medium">Name</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="CPVC FAPT - 3/4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="mb-3 w-full">
                      <FormLabel className="font-medium">Category</FormLabel>
                      <FormControl>
                        <Select
                          className="w-full"
                          value={String(categoryId)}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="h-[30px!important]">
                            <SelectValue
                              placeholder={<span className="text-gray-500">Select a category</span>}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Categories</SelectLabel>
                              {categories?.data?.data.map(({ id, name }) => (
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

                <div className="flex gap-4">
                  <FormField
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="mb-3 w-full">
                        <FormLabel className="font-medium">Rate</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="70.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="unit_id"
                    control={control}
                    render={({ field }) => (
                      <FormItem className="mb-3 w-full">
                        <FormLabel className="font-medium">Unit</FormLabel>
                        <FormControl>
                          <Select
                            className="w-full"
                            value={String(unitId)}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="h-[30px!important] w-[180px]">
                              <SelectValue
                                placeholder={<span className="text-gray-500">Select a unit</span>}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Units</SelectLabel>
                                {units?.data?.data.map(({ id, name }) => (
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
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="mb-3">
                      <FormLabel className="font-medium">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Type your description here for CPVC FAPT - 3/4."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>

              <Button type="submit" className="mb-1" disabled={isLoading}>
                {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />} Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
