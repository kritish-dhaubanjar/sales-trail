'use client';
import { z } from 'zod';
import DevTool from '@/components/DevTool';
import dynamic from 'next/dynamic';
import { useQuery } from 'react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuthUser } from '@/hooks/use-is-authenticated';

import { Skeleton } from '@/components/ui/skeleton';

import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

import { ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import Sidebar from '@/components/layout/sidebar';

import { get } from '@/services/dashboard.service';
import 'nepali-datepicker-reactjs/dist/index.css';

import { NepaliDate } from '@/lib/date';
import { NepaliDatePicker } from 'nepali-datepicker-reactjs';

import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';

const formatter = Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const schema = z.object({
  start_date: z.string({ required_error: 'A date of sale is required.' }),
  end_date: z.string({ required_error: 'A date of sale is required.' }),
});

function Dashboard() {
  const { isLoading, data: auth } = useAuthUser();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      start_date: NepaliDate.getNepaliDate(),
      end_date: NepaliDate.getNepaliDate(),
    },
  });

  const { control, watch } = form;

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const { data: dashboard, isFetching: isFetchingDashboard } = useQuery({
    queryKey: ['dashboard', startDate, endDate],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => get({ start_date: startDate, end_date: endDate }),
  });

  const columns = [
    {
      header: 'S.N.',
      accessorFn: (_, index) => index + 1,
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: ({ row }) => formatter.format(row.original.quantity),
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
      cell: ({ row }) => row.original.unit,
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => formatter.format(row.original.total),
    },
  ];

  const saleItemsTable = useReactTable({
    data: dashboard?.data?.sales?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const purchaseItemsTable = useReactTable({
    data: dashboard?.data?.purchases?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading || !auth || isFetchingDashboard) {
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
      <Sidebar />

      <div className="min-h-lvh w-full px-10 py-10 print:p-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="my-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        <form>
          <Form {...form}>
            <div className="py-4">
              <div className="flex items-center">
                <FormField
                  control={control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="mb-3 flex flex-col">
                      <FormLabel>Start Date</FormLabel>

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

                <FormField
                  control={control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="mb-3 ml-3 flex flex-col">
                      <FormLabel>End Date</FormLabel>

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
              </div>
            </div>
          </Form>
        </form>

        <div className="mb-8 flex gap-5">
          <div className="mb-8 w-full">
            <h2 className="text-l mb-2 font-semibold">Sales</h2>

            <Table className="border">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboard?.data?.sales?.data?.map((sale) => (
                  <TableRow key={sale.date}>
                    <TableCell className="whitespace-nowrap font-medium">{sale.date}</TableCell>
                    <TableCell className="font-medium">
                      {formatter.format(sale.grand_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter className="font-semibold">
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell>
                    {formatter.format(
                      dashboard?.data?.sales?.data?.reduce(
                        (total, { grand_total }) => Number(total) + Number(grand_total),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="mb-8 w-full">
            <h2 className="text-l mb-2 font-semibold">Purchases</h2>

            <Table className="border">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboard?.data?.purchases?.data?.map((purchase) => (
                  <TableRow key={purchase.date}>
                    <TableCell className="whitespace-nowrap font-medium">{purchase.date}</TableCell>
                    <TableCell className="font-medium">
                      {formatter.format(purchase.grand_total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>

              <TableFooter className="font-semibold">
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell>
                    {formatter.format(
                      dashboard?.data?.purchases?.data?.reduce(
                        (total, { grand_total }) => Number(total) + Number(grand_total),
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        <div className="mb-8 flex gap-5">
          <div className="mb-8 w-full">
            <h2 className="text-l mb-2 font-semibold">Sale Items</h2>

            <Table className="border">
              <TableHeader>
                {saleItemsTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      >
                        <div className="flex">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: <ArrowUpIcon />, desc: <ArrowDownIcon /> }[
                            header.column.getIsSorted()
                          ] ?? null}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {saleItemsTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mb-8 w-full">
            <h2 className="text-l mb-2 font-semibold">Purchase Items</h2>

            <Table className="border">
              <TableHeader>
                {purchaseItemsTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      >
                        <div className="flex">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: <ArrowUpIcon />, desc: <ArrowDownIcon /> }[
                            header.column.getIsSorted()
                          ] ?? null}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {purchaseItemsTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-l mb-2 font-semibold">Accounts | {NepaliDate.getNepaliDate()}</h2>

          <Table className="border">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Name</TableHead>
                <TableHead>Net Balance</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dashboard?.data?.accounts?.map((account) => (
                <TableRow key={account.name}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell className="font-medium">{formatter.format(account.balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter className="font-semibold">
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell>
                  {formatter.format(
                    dashboard?.data?.accounts?.reduce(
                      (total, { balance }) => Number(total) + Number(balance),
                      0,
                    ),
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <div className="flex gap-5 print:hidden">
          <div className="mb-8 w-full">
            <h2 className="text-l mb-2 font-semibold">Sale Accounts</h2>

            <Table className="border">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Date</TableHead>
                  <TableHead className="w-[400px]">Name</TableHead>
                  <TableHead>Net Balance</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboard?.data?.transactions
                  ?.filter((transaction) => transaction.transaction_type === 'App\\Models\\Sale')
                  .map((transaction) => (
                    <TableRow key={transaction.date}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.name}</TableCell>
                      <TableCell className="font-medium">
                        {formatter.format(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>

              <TableFooter className="font-semibold">
                <TableRow>
                  <TableCell colspan="2">Total</TableCell>
                  <TableCell>
                    {formatter.format(
                      dashboard?.data?.transactions
                        ?.filter(
                          (transaction) => transaction.transaction_type === 'App\\Models\\Sale',
                        )
                        .reduce((total, { amount }) => Number(total) + Number(amount), 0),
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="mb-8 w-full">
            <h2 className="text-l mb-2 font-semibold">Purchase Accounts</h2>

            <Table className="border">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Date</TableHead>
                  <TableHead className="w-[400px]">Name</TableHead>
                  <TableHead>Net Balance</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboard?.data?.transactions
                  ?.filter(
                    (transaction) => transaction.transaction_type === 'App\\Models\\Purchase',
                  )
                  .map((transaction) => (
                    <TableRow key={transaction.date}>
                      <TableCell className="whitespace-nowrap font-medium">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="font-medium">{transaction.name}</TableCell>
                      <TableCell className="font-medium">
                        {formatter.format(transaction.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>

              <TableFooter className="font-semibold">
                <TableRow>
                  <TableCell colspan="2">Total</TableCell>
                  <TableCell>
                    {formatter.format(
                      dashboard?.data?.transactions
                        ?.filter(
                          (transaction) => transaction.transaction_type === 'App\\Models\\Purchase',
                        )
                        .reduce((total, { amount }) => Number(total) + Number(amount), 0),
                    )}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        <div className="mb-8 flex gap-5 print:hidden">
          <div className="mb-8 w-full">
            <h2 className="text-l mb-2 font-semibold">Transfer Accounts</h2>

            <Table className="border">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Date</TableHead>
                  <TableHead>From A/C</TableHead>
                  <TableHead>To A/C</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {dashboard?.data?.transfers?.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="whitespace-nowrap font-medium">{transfer.date}</TableCell>
                    <TableCell className="font-medium">{transfer.from_account.name}</TableCell>
                    <TableCell className="font-medium">{transfer.to_account.name}</TableCell>
                    <TableCell className="font-medium">
                      {formatter.format(transfer.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <DevTool control={control} />
    </div>
  );
}

export default dynamic(() => Promise.resolve(Dashboard), { ssr: false });
