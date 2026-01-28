'use client';
import { z } from 'zod';
import Image from 'next/image';
import DevTool from '@/components/DevTool';
import { debounce, find } from 'lodash';
import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { TableDialog } from '@/components/tables/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthUser } from '@/hooks/use-is-authenticated';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import { Trash2Icon } from 'lucide-react';
import {
  CheckboxIcon,
  BoxIcon,
  ArchiveIcon,
  Cross1Icon,
  PlusIcon,
  MinusIcon,
} from '@radix-ui/react-icons';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Table, TableRow, TableBody, TableCell } from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { cn } from '@/lib/utils';
import { NepaliDate } from '@/lib/date';
import { getItems } from '@/services/item.service';
import { getAccounts } from '@/services/account.service';
import {
  getTables,
  getTable,
  updateTableItems,
  deleteTableItems,
  checkoutTable,
} from '@/services/table.service';
import { getCategories } from '@/services/category.service';

const formatter = Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const DEFAULT_TRANSACTION = {
  account_id: 1,
  amount: 0,
};

const schema = z.object({
  table_id: z.coerce.number(),
  date: z.string({ required_error: 'A date of sale is required.' }),
  discount: z.coerce.number(),
  title: z.string().min(0).nullable(),
  transactions: z.array(
    z.object({
      account_id: z.coerce.number().gt(0),
      amount: z.coerce.number().gt(0),
    }),
  ),
  items: z.array(
    z.object({
      item_id: z.coerce.number().gt(0),
      price: z.coerce.number().gt(0),
      quantity: z.coerce.number().gt(0),
    }),
  ),
});

function POS() {
  const { isLoading, data: auth } = useAuthUser();

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tender, setTender] = useState(0);
  const [category, setCategory] = useState(null);
  const [tableOpen, setTableOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      table_id: '',
      date: NepaliDate.getNepaliDate(),
      discount: 0,
      title: '',
      items: [],
      transactions: [DEFAULT_TRANSACTION],
    },
  });

  const { control, setValue, watch, reset, getValues } = form;

  useEffect(() => {
    setValue('title', '');
    setValue('discount', 0);
    setValue('transactions', [DEFAULT_TRANSACTION]);
  }, [open]);

  const items = useFieldArray({ control, name: 'items', rules: { minLength: 1 } });
  const transactions = useFieldArray({ control, name: 'transactions', rules: { minLength: 1 } });

  const tableId = watch('table_id');
  const discount = watch('discount', 0);

  const watchedItems = useWatch({ control, name: 'items', defaultValue: [] });
  const watchedTransactions = useWatch({ control, name: 'transactions', defaultValue: [] });

  const total = watchedItems.reduce((acc, { quantity = 0, price = 0 }) => {
    const amt = Number(quantity) * Number(price);
    return (acc += amt);
  }, 0);

  const paymentTotal = watchedTransactions.reduce((acc, { amount = 0 }) => {
    return (acc += Number(amount));
  }, 0);

  const { data: accounts, isFetching: isFetchingAccounts } = useQuery({
    queryKey: ['accounts'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => getAccounts({ page: 1, limit: 10240, query: '' }),
  });

  const { data: categories, isFetching: isFetchingCategories } = useQuery({
    queryKey: ['categories'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => getCategories({ page: 1, limit: 1024, query: '' }),
    onSuccess: (data) => {
      const category = data?.data?.data?.find(({ type }) => type === 'income');
      setCategory(category?.name || null);
    },
  });

  const { data: products, isFetching: isFetchingProducts } = useQuery({
    queryKey: ['items'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => getItems({ page: 1, limit: 10240, query: '', category_type: 'income' }),
  });

  const { data: tables, refetch: refetchTables } = useQuery({
    queryKey: ['tables'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => getTables({ page: 1, limit: 10240, query: '' }),
  });

  const { isFetching: isFetchingTable } = useQuery({
    queryKey: ['tables', tableId],
    enabled: Boolean(tableId),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => getTable({ id: tableId }),
    onSuccess: (data) => {
      const table = data.data;

      reset({
        table_id: String(table.id) || '',
        items: table.items || [],
      });
    },
  });


  const { mutate: deleteTableItemsMutation } = useMutation(deleteTableItems, {
    onSuccess: (data) => {
      queryClient.invalidateQueries(['tables'], (oldData) => {
        return {
          ...oldData,
          data: oldData.data.map((table) => table.id === data.data.id ? { ...data.data, items: [] } : table),
        };
      });
    }
  });

  const debouncerRef = useRef(new Map());

  const { mutate: updateTableItemsMutation } = useMutation(updateTableItems, {
    onSuccess: (newTable) => {
      queryClient.setQueryData(['tables'], (oldData) => {
        const tables = oldData.data.data.map((table) => {
          if (table.id !== newTable.data.id) {
            return table
          }

          return newTable.data
        })

        oldData.data.data = tables

        return oldData
      })
    }
  });

  const getDebouncedUpdater = useCallback((id) => {
    if (!id) {
      return null;
    }

    const debouncedFn = debouncerRef.current.get(id) || debounce((data) => updateTableItemsMutation(data), 100, { leading: false, trailing: true });

    debouncerRef.current.set(id, debouncedFn);

    return debouncerRef.current.get(id);
  }, [updateTableItemsMutation]);

  const { mutate: checkoutTableMutation } = useMutation(checkoutTable, {
    onSuccess: (response) => {
      refetchTables();
      toast({ title: `Sales "${response.data.name}" successfully saved.` });
      reset({
        table_id: '',
        items: [],
      });
      setOpen(false);
    },
  });

  const onSelect = (item) => {
    const index = watchedItems.findIndex((i) => String(i.item_id) === String(item.id));

    if (index > -1) {
      const item = items.fields[index];
      item.quantity++;
      items.update(index, item);
    } else {
      items.append({ item_id: item.id, quantity: 1, price: item.price });
    }

    const data = getValues();

    getDebouncedUpdater(tableId)?.({ id: tableId, items: data.items });
  };

  const onQuantityClear = (index) => {
    items.remove(index);

    const data = getValues();

    if (data.items.length) {
      getDebouncedUpdater(tableId)?.({ id: tableId, items: data.items });
    } else {
      deleteTableItemsMutation({ id: tableId });
    }
  };

  const onQuantityUpdate = (index, value) => {
    const item = watchedItems[index];
    item.quantity = value;
    items.update(index, item);

    const data = getValues();

    getDebouncedUpdater(tableId)?.({ id: tableId, items: data.items });

    setTimeout(() => document.getElementById(`items.${index}.quantity`)?.focus(), 0);
  };

  const onQuantityChange = (index, value) => {
    const item = watchedItems[index];

    if (value === 1) {
      item.quantity++;
      items.update(index, item);
    } else if (value === -1) {
      item.quantity--;

      if (item.quantity <= 0) {
        items.remove(index);
      } else {
        items.update(index, item);
      }
    }

    const data = getValues();

    if (data.items.length) {
      getDebouncedUpdater(tableId)?.({ id: tableId, items: data.items });
    } else {
      deleteTableItemsMutation({ id: tableId });
    }
  };

  const onCheckout = () => {
    const data = getValues();

    checkoutTableMutation({ id: tableId, ...data });
  };

  if (isLoading || isFetchingProducts || isFetchingCategories || isFetchingAccounts || !auth) {
    return (
      <div className="flex h-lvh items-center justify-center space-x-4">
        <div className="space-y-2">
          <Skeleton className="h-4 min-w-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* <Sidebar /> */}

      <TableDialog
        isDelivery={true}
        open={tableOpen}
        refetch={refetchTables}
        onClose={() => setTableOpen(false)}
      />

      <div className="min-h-lvh px-4">
        <ScrollArea className="h-[100vh]">
          <div className="relative min-h-lvh max-w-[min-content] border-r pe-3">
            <Image src="/images/loop.png" width="100" height="100" className="mx-auto mt-5" />

            <div className="py-6">
              {categories?.data?.data
                ?.filter(({ type }) => type === 'income')
                .map(({ name }) => {
                  const className = name === category ? 'bg-accent' : '';

                  return (
                    <Button
                      onClick={() => setCategory(name)}
                      key={name}
                      variant="ghost"
                      className={cn(
                        'text-l mb-1.5 min-w-full justify-start px-4 py-2 font-semibold',
                        className,
                      )}
                    >
                      <ArchiveIcon className="me-2 h-4 w-4" /> {name}
                    </Button>
                  );
                })}
            </div>
          </div>
        </ScrollArea>
      </div>

      <ScrollArea className="me-4 h-[100vh] min-h-[100vh] w-full border-r">
        <div className="me-4 w-full py-6 pe-4">
          <Input
            onChange={(e) => setQuery(e.target.value)}
            className="mb-4 mt-0"
            placeholder="Search menu"
          />

          <div className="flex w-full flex-wrap gap-4">
            {products?.data?.data
              ?.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))
              .map((product) => {
                if (product.category.name !== category && !query) {
                  return null;
                }

                return (
                  <Button
                    disabled={!tableId || isFetchingTable}
                    onClick={() => onSelect(product)}
                    variant="outline"
                    key={product.id}
                    className="h-auto w-1/5 min-w-[max-content] p-2"
                  >
                    <div>
                      <small>{product.category.name}</small>
                      <h2 className="font-semibold">{product.name}</h2>
                      <small>
                        {formatter.format(product.price)} / {product.unit.name}
                      </small>
                    </div>
                  </Button>
                );
              })}
          </div>
        </div>
      </ScrollArea>

      <div className="w-[512px] py-6">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Controller
              name="date"
              defaultValue={NepaliDate.getNepaliDate()}
              render={(field) => <input type="hidden" {...field} />}
            />

            <div className="flex">
              <div className="mr-2 w-full">
                <FormField
                  name="table_id"
                  control={control}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Select
                          className="w-full"
                          value={String(field.value)}
                          onValueChange={(value) => value && field.onChange(value)}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={<span className="text-gray-500">Select Table</span>}
                            />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectGroup>
                              {tables?.data?.data
                                ?.sort((table) => (table.items.length ? -1 : 1))
                                .map((table) => (
                                  <SelectItem key={table.id} value={String(table.id)}>
                                    <div className="flex items-center justify-between">
                                      {(table.items.length) > 0 ? (
                                        <CheckboxIcon className="h-5 w-5 text-green-800" />
                                      ) : (
                                        <BoxIcon className="h-4 w-4" />
                                      )}{' '}
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

              <Button className="mr-4" onClick={() => setTableOpen(true)}>
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="mt-4 h-[calc(100vh-200px)]">
              {(!items.fields.length || !tableId) && (
                <div className="m-auto mr-4 text-sm">
                  To proceed, please choose a table and then continue to add items to the customer's
                  order.
                </div>
              )}
              {items.fields.map((item, index) => {
                const product = products?.data?.data?.find(
                  (p) => String(p.id) === String(item.item_id),
                );

                return (
                  <div key={item.id} className="me-4">
                    <Card className="gap-3 border-0 p-0 pt-2 shadow-none">
                      <CardHeader className="px-0">
                        <CardTitle>
                          <small className="font-semibold">{product?.name}</small>{' '}
                          <small>
                            ({product?.price}/{product?.unit?.name})
                          </small>
                        </CardTitle>

                        <CardAction>
                          <Button
                            type="button"
                            onClick={() => onQuantityClear(index)}
                            variant="ghost"
                            size="icon"
                          >
                            <Cross1Icon />
                          </Button>
                        </CardAction>

                        <CardDescription>
                          <div className="mt-2 flex items-center">
                            <Button
                              type="button"
                              onClick={() => onQuantityChange(index, -1)}
                              variant="outline"
                              size="icon"
                              className="h-7 rounded-none rounded-bl rounded-tl border-r"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </Button>

                            <FormField
                              name={`items.${index}.quantity`}
                              control={control}
                              render={({ field }) => (
                                <FormItem className="h-7 w-16">
                                  <FormControl>
                                    <Input
                                      id={`items.${index}.quantity`}
                                      type="number"
                                      placeholder="1"
                                      className="h-7 rounded-none"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(Number(e.target.value) || 0);
                                        onQuantityUpdate(index, Number(e.target.value) || 0);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="button"
                              onClick={() => onQuantityChange(index, 1)}
                              variant="outline"
                              size="icon"
                              className="h-7 rounded-none rounded-br rounded-tr"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </Button>

                            <p className="ml-5 font-semibold text-black">
                              {' '}
                              {formatter.format(
                                product?.price * watchedItems[index]?.quantity || 0,
                              )}
                            </p>
                          </div>
                        </CardDescription>
                      </CardHeader>

                      <hr />
                    </Card>
                  </div>
                );
              })}
            </ScrollArea>

            <Sheet open={open} onOpenChange={setOpen}>
              <Table>
                <TableBody>
                  <TableRow className="bg-gray-50">
                    <TableCell className="h-11 text-right" colSpan={6}>
                      Total
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="mr-2">{formatter.format(total)}</span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <SheetTrigger className="mt-2 w-full pr-4">
                {auth.data.role === 'admin' && <Button className="mt-2 w-full">Checkout</Button>}
              </SheetTrigger>

              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Are you absolutely sure?</SheetTitle>
                  <SheetDescription>
                    This action cannot be undone.
                    <div className="mt-5 font-semibold text-black">
                      <Table>
                        <TableBody>
                          <TableRow className="bg-gray-50">
                            <TableCell className="h-11 text-right" colSpan={6}>
                              Subtotal
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="mr-2">{formatter.format(total)}</span>
                            </TableCell>
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
                                  <FormItem className="ml-auto w-[100px]">
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

                          <TableRow className="bg-gray-50">
                            <TableCell className="h-11 text-right" colSpan={6}>
                              Grand Total
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="mr-2">{formatter.format(total - discount)}</span>
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>

                          {transactions.fields.map((transaction, index) => {
                            return (
                              <TableRow key={transaction.id}>
                                <TableCell className="h-11 text-right" colSpan={5}></TableCell>

                                <TableCell className="text-right">
                                  <FormField
                                    name={`transactions[${index}].account_id`}
                                    control={control}
                                    render={({ field }) => (
                                      <FormItem className="w-full">
                                        <FormControl>
                                          <Select
                                            className="w-full"
                                            value={String(field.value)}
                                            onValueChange={(value) =>
                                              value && field.onChange(value)
                                            }
                                          >
                                            <SelectTrigger className="w-[100px]">
                                              <SelectValue
                                                placeholder={
                                                  <span className="text-gray-500">
                                                    Select an account
                                                  </span>
                                                }
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
                                </TableCell>

                                <TableCell>
                                  <FormField
                                    name={`transactions[${index}].amount`}
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

                                <TableCell className="text-center">
                                  <Button
                                    type="button"
                                    onClick={() => transactions.remove(index)}
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2Icon className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}

                          <TableRow>
                            <TableCell colSpan={6} />

                            <TableCell colSpan={2}>
                              <Button
                                type="button"
                                onClick={() => transactions.append(DEFAULT_TRANSACTION)}
                                className="rounded-full"
                              >
                                <PlusIcon className="h-4 w-4" /> Add Payment
                              </Button>
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-gray-50">
                            <TableCell className="h-11 text-right" colSpan={6}>
                              Payment Total
                            </TableCell>
                            <TableCell className="text-right">
                              {formatter.format(paymentTotal)}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-xs text-gray-500">
                              <FormField
                                control={control}
                                name="title"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        rows={5}
                                        placeholder="Notes"
                                        className="resize-none"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell>Tender</TableCell>
                            <TableCell colSpan={5}>
                              <FormControl>
                                <Input
                                  className="shadow-none"
                                  type="text"
                                  placeholder="Tendered Amt."
                                  onChange={(e) => setTender(e.target.value)}
                                />
                              </FormControl>
                            </TableCell>

                            <TableCell colSpan={2}>
                              {formatter.format(Number(tender) - (total - discount))}
                            </TableCell>
                          </TableRow>

                          <TableRow className="bg-gray-50">
                            <TableCell className="h-11 text-right" colSpan={8}>
                              <Button
                                type="submit"
                                disabled={!tableId || !paymentTotal}
                                className="w-full"
                                onClick={onCheckout}
                              >
                                Confirm Payment
                              </Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </form>
        </Form>
      </div>
      <DevTool control={control} />
    </div>
  );
}

export default dynamic(() => Promise.resolve(POS), { ssr: false });
