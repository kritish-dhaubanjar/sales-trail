'use client';
import { z } from 'zod';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';

import dynamic from 'next/dynamic';
import 'nepali-datepicker-reactjs/dist/index.css';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
import { ReloadIcon } from '@radix-ui/react-icons';

import { useAuthUser } from '@/hooks/use-is-authenticated';

import { getItems } from '@/services/item.service';
import { useToast } from '@/hooks/use-toast';
import { getSale, updateSale } from '@/services/sale.service';
import { getAccounts } from '@/services/account.service';
import { NepaliDate } from '@/lib/date';

const DEFAULT_ITEM = {
  item_id: 0,
  price: 0,
  quantity: 0,
  discount: 0,
};

const schema = z.object({
  id: z.coerce.number(),
  discount: z.coerce.number(),
  title: z.string().min(0).nullable(),
  description: z.string().min(0).nullable(),
  date: z.string({ required_error: 'A date of sale is required.' }),
  account_id: z.coerce.number(),
  items: z.array(
    z.object({
      item_id: z.coerce.number().gt(0),
      price: z.coerce.number().gt(0),
      quantity: z.coerce.number().gt(0),
      discount: z.coerce.number(),
    }),
  ),
});

function Sale() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const saleId = searchParams.get('id');

  const { toast } = useToast();
  const formatter = Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const { isLoadingAuth, data: auth } = useAuthUser();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      id: 0,
      date: NepaliDate.getNepaliDate(),
      discount: 0,
      title: '',
      description: '',
      items: [DEFAULT_ITEM],
      account_id: 1,
    },
  });

  const { handleSubmit, control, setValue, watch, reset } = form;

  const items = useFieldArray({ control, name: 'items', rules: { minLength: 1 } });

  const account_id = watch('account_id');
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

  const { data: accounts, isFetching: isFetchingAccounts } = useQuery({
    queryKey: ['accounts'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => {
      return getAccounts({ page: 1, limit: 10240, query: '' });
    },
  });

  const { data, isFetching, isSuccess } = useQuery({
    enabled: true,
    queryKey: ['sales', saleId],
    keepPreviousData: false,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () => getSale({ id: saleId }),
    onError: () => {
      router.replace('/404');
    },
  });

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const sale = data.data;

    sale.account_id = sale.account_id || 1;
    sale.items = sale.sale_items;
    sale.title = sale.title || '';
    sale.description = sale.description || '';

    reset(data.data);
  }, [isSuccess, isFetching]);

  const { mutate, isLoading } = useMutation(updateSale, {
    onSuccess: () => {
      toast({ title: 'Sale successfully updated.' });
      router.push('/sales');
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
    const amt = Number(quantity) * Number(price);
    const adj = (Number(discount) / 100) * amt;
    return (acc += amt - adj);
  }, 0);

  if (isLoadingAuth || !auth || isFetching || isFetchingItems || isFetchingAccounts) {
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
              <BreadcrumbLink href="/sales">Sales</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Sales</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="my-4">
          <h1 className="text-2xl font-bold">Edit Sales</h1>
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

                  <NepaliDatePicker
                    className="w-[300px]"
                    inputClassName="text-sm px-2 py-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-[300px] pl-3 text-left font-normal"
                    value={field.value || ''}
                    onChange={field.onChange}
                    options={{ calenderLocale: 'en', valueLocale: 'en' }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>

                  <FormControl>
                    <Textarea className="shadow-none" type="text" placeholder="#Cash" {...field} />
                  </FormControl>
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
                  <TableHead className="w-[100px] text-black">Discount %</TableHead>
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
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {[
                          watchedItems[index]?.price,
                          watchedItems[index]?.quantity,
                          watchedItems[index]?.discount,
                        ].some(isNaN)
                          ? '0.00'
                          : formatter.format(
                            Number(watchedItems[index].price) *
                            Number(watchedItems[index].quantity) -
                            ((Number(watchedItems[index].discount) || 0) / 100) *
                            Number(
                              watchedItems[index].price *
                              Number(watchedItems[index].quantity),
                            ),
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
                <TableRow>
                  <TableCell className="h-11 text-right" colSpan={6}>
                    Account
                  </TableCell>
                  <TableCell className="text-right">
                    <FormField
                      name="account_id"
                      control={control}
                      render={({ field }) => (
                        <FormItem className="mb-3 w-full">
                          <FormControl>
                            <Select
                              className="w-full"
                              value={String(account_id)}
                              onValueChange={(value) => value && field.onChange(value)}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={<span className="text-gray-500">Select an account</span>} />
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
                  </TableCell>
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

export default dynamic(() => Promise.resolve(Sale), { ssr: false });
