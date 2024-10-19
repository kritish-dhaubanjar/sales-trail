'use client';
import { z } from 'zod';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import dynamic from 'next/dynamic';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Calendar } from '@/components/ui/calendar';
import Sidebar from '@/components/layout/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableFooter,
} from '@/components/ui/table';

import Combobox from '@/components/Combobox';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { PlusIcon, Trash2Icon } from 'lucide-react';
import { CalendarIcon, ReloadIcon } from '@radix-ui/react-icons';

import { cn } from '@/lib/utils';
import { useAuthUser } from '@/hooks/use-is-authenticated';

import { getItems } from '@/services/item.service';
import { useToast } from '@/hooks/use-toast';
import { getReturn, updateReturn } from '@/services/return.service';

const DEFAULT_ITEM = {
  item_id: 0,
  price: 0,
  quantity: 0,
  discount: 0,
};

const schema = z.object({
  id: z.coerce.number(),
  discount: z.coerce.number(),
  description: z.string().min(0).nullable(),
  date: z.date({ required_error: 'A date of return is required.' }),
  items: z.array(
    z.object({
      item_id: z.coerce.number().gt(0),
      price: z.coerce.number().gt(0),
      quantity: z.coerce.number().gt(0),
      discount: z.coerce.number(),
    }),
  ),
});

function Return() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnId = searchParams.get('id');

  const { toast } = useToast();
  const formatter = Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const { isLoadingAuth, data: auth } = useAuthUser();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id: 0,
      date: new Date(),
      discount: 0,
      description: '',
      items: [DEFAULT_ITEM],
    },
  });

  const { handleSubmit, control, setValue, watch, reset } = form;

  const items = useFieldArray({ control, name: 'items', rules: { minLength: 1 } });

  const discount = watch('discount', 0);
  const watchedItems = useWatch({ control, name: 'items', defaultValue: [] });

  const { data: products, isFetching: isFetchingItems } = useQuery({
    queryKey: ['items'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => {
      return getItems({ page: 1, limit: 10240, query: '' });
    },
  });

  const { data, isFetching, isSuccess } = useQuery({
    enabled: true,
    queryKey: ['returns', returnId],
    keepPreviousData: false,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () => getReturn({ id: returnId }),
    onError: () => {
      router.replace('/404');
    },
  });

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const refund = data.data;

    refund.date = new Date(refund.date);
    refund.items = refund.refund_items;
    refund.description = refund.description || '';

    reset(refund);
  }, [isSuccess, isFetching]);

  const { mutate, isLoading } = useMutation(updateReturn, {
    onSuccess: () => {
      toast({ title: 'Return successfully updated.' });
      router.push('/returns');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error?.response?.data?.message,
      });
    },
  });

  const total = watchedItems.reduce((acc, { quantity = 0, price = 0, discount = 0 }) => {
    return (acc += Number(quantity) * Number(price) - Number(discount));
  }, 0);

  if (isLoadingAuth || !auth || isFetching || isFetchingItems) {
    return (
      <div className="flex h-lvh items-center justify-center space-x-4">
        <div className="space-y-2">
          <Skeleton className="h-4 min-w-96" />
        </div>
      </div>
    );
  }

  const onSelect = (index, product) => {
    setValue(`items[${index}].item_id`, product.id);
    setValue(`items[${index}].price`, product.price);
  };

  const onError = () => {
    toast({
      variant: 'destructive',
      title: 'Uh oh! Something went wrong.',
      description: 'Some fields in the form are invalid. Please check your entries and try again.',
    });
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="min-h-lvh w-full px-10 py-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/returns">Returns</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Returns</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="my-4">
          <h1 className="text-2xl font-bold">Edit Returns</h1>
        </div>

        <hr className="mb-5" />

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="max-w-[1024px] space-y-8">
            <FormField
              control={control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-[240px] pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="id"
              control={control}
              render={({ field }) => <input type="hidden" {...field} />}
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-black">S.N.</TableHead>
                  <TableHead className="text-black">Particulars</TableHead>
                  <TableHead className="w-[100px] text-black">Qty</TableHead>
                  <TableHead className="w-[100px] text-black">Unit</TableHead>
                  <TableHead className="w-[100px] text-black">Rate</TableHead>
                  <TableHead className="w-[100px] text-black">Discount</TableHead>
                  <TableHead className="w-[100px] text-right text-black">Amount</TableHead>
                  <TableHead className="w-[100px] text-right text-black"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.fields.map((item, index) => {
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="h-10">{index + 1}</TableCell>

                      <TableCell>
                        <FormField
                          control={control}
                          name={`items[${index}].item_id`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <Combobox
                                index={index}
                                field={field}
                                onSelect={onSelect}
                                products={products}
                              />
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <FormField
                          name={`items[${index}].quantity`}
                          control={control}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  className="shadow-none"
                                  type="text"
                                  placeholder=""
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          control={control}
                          name={`items[${index}].item_id`}
                          render={({ field }) => {
                            const unit = products.data.data.find(
                              ({ id }) => id === field.value,
                            )?.unit;

                            return <span>{unit?.name || ''}</span>;
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <FormField
                          name={`items[${index}].price`}
                          control={control}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  type="text"
                                  className="shadow-none"
                                  placeholder=""
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <FormField
                          name={`items[${index}].discount`}
                          control={control}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input
                                  className="shadow-none"
                                  type="text"
                                  placeholder=""
                                  {...field}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const isDiscountPercentage = String(value).endsWith('%');

                                    if (!isDiscountPercentage) {
                                      field.onChange(e);
                                      return;
                                    }

                                    const adj = (
                                      Number(Number(value.slice(0, -1)) / 100) *
                                      (watchedItems[index].price * watchedItems[index].quantity)
                                    ).toFixed(2);

                                    setTimeout(() => setValue(`items[${index}].discount`, adj), 0);
                                  }}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {isNaN(
                          Number(watchedItems[index]?.price) *
                            Number(watchedItems[index]?.quantity) -
                            Number(watchedItems[index]?.discount),
                        )
                          ? '0.00'
                          : formatter.format(
                              Number(watchedItems[index].price) *
                                Number(watchedItems[index].quantity) -
                                Number(watchedItems[index].discount) || 0,
                            )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          type="button"
                          onClick={() => items.remove(index)}
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

              <TableFooter>
                <TableRow>
                  <TableCell className="h-11 text-right" colSpan={6}>
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right">{formatter.format(total)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="h-11 text-right" colSpan={6}>
                    Adj
                  </TableCell>
                  <TableCell className="text-right">
                    <FormField
                      name="discount"
                      control={control}
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormControl>
                            <Input
                              className="text-right shadow-none"
                              type="text"
                              placeholder=""
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value;
                                const isDiscountPercentage = String(value).endsWith('%');

                                if (!isDiscountPercentage) {
                                  field.onChange(e);
                                  return;
                                }

                                const adj = (
                                  Number(Number(value.slice(0, -1)) / 100) * total
                                ).toFixed(2);
                                setTimeout(() => setValue('discount', adj), 0);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="h-11 text-right" colSpan={6}>
                    Grand Total
                  </TableCell>
                  <TableCell className="text-right">{formatter.format(total - discount)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            <Button
              type="submit"
              onClick={() => items.append(DEFAULT_ITEM)}
              className="rounded-full"
            >
              <PlusIcon className="h-4 w-4" /> Add
            </Button>

            <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>

                  <FormControl>
                    <Textarea rows={5} placeholder="Notes" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" onClick={handleSubmit(mutate, onError)} disabled={isLoading}>
              {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />} Submit
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Return), { ssr: false });
