'use client';
import dynamic from 'next/dynamic';

import { useMutation, useQuery } from 'react-query';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@uidotdev/usehooks';
import { useAuthUser } from '@/hooks/use-is-authenticated';

import { deleteReturn, getReturns } from '@/services/return.service';

import Link from 'next/link';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Pencil2Icon,
  TrashIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
  Cross2Icon,
} from '@radix-ui/react-icons';
import { EyeIcon, PlusIcon, PrinterIcon } from 'lucide-react';

import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import Alert from '@/components/layout/alert';
import Sidebar from '@/components/layout/sidebar';

function Return() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') ?? '';
  const page = searchParams.get('page') ?? 1;
  const limit = searchParams.get('limit') ?? 10;

  const [query, setQuery] = useState(q);
  const debouncedQuery = useDebounce(query, 250);

  const [sorting, setSorting] = useState([]);
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: page - 1, pageSize: limit });

  const { isLoading, data: auth } = useAuthUser();

  const [deleteRow, setDeleteRow] = useState(null);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ['returns', pagination, debouncedQuery],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => {
      const limit = pagination.pageSize;
      const page = pagination.pageIndex + 1;

      return getReturns({ page, limit, query: debouncedQuery });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams();

    params.set('q', debouncedQuery);
    params.set('limit', pagination.pageSize);
    params.set('page', pagination.pageIndex + 1);

    router.push(pathname + '?' + params.toString());
  }, [pagination, columnFilters, debouncedQuery]);

  const formatter = Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div>{row.getValue('id')}</div>,
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => <div>{row.getValue('date')}</div>,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => <div>{row.getValue('title')}</div>,
      },
      {
        id: 'view',
        header: 'View',
        cell: ({ row }) => {
          return (
            <Popover>
              <PopoverTrigger>
                <EyeIcon className="h-4 w-4" />
              </PopoverTrigger>
              <PopoverContent className="min-w-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">S.N.</TableHead>
                      <TableHead>Particulars</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {row.original?.refund_items?.map((refund, index) => (
                      <TableRow key={refund.id}>
                        <TableCell>{index + 1}</TableCell>

                        <TableCell>{refund.item.name}</TableCell>

                        <TableCell>{refund.quantity}</TableCell>

                        <TableCell>{refund.item.unit.name}</TableCell>

                        <TableCell>{formatter.format(refund.price)}</TableCell>

                        <TableCell>{formatter.format(refund.discount)}%</TableCell>

                        <TableCell className="text-right">
                          {formatter.format(refund.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="text-right" colSpan={6}>
                        Adj.
                      </TableCell>
                      <TableCell className="text-right">
                        {formatter.format(row?.original?.discount)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell className="text-right" colSpan={6}>
                        Total
                      </TableCell>
                      <TableCell className="text-right">
                        {formatter.format(row?.original?.total)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </PopoverContent>
            </Popover>
          );
        },
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => <div>{formatter.format(row.getValue('total'))} </div>,
      },
      {
        accessorKey: 'discount',
        header: 'Discount',
        cell: ({ row }) => <div>{formatter.format(row.getValue('discount'))} </div>,
      },
      {
        accessorKey: 'grand_total',
        header: 'Grand Total',
        cell: ({ row }) => <div>{formatter.format(row.getValue('grand_total'))} </div>,
      },
      {
        accessorKey: 'account.name',
        header: 'Account',
        cell: ({ row }) => <div>{row.original.account?.name}</div>,
      },
      {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <DotsHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href={{ pathname: '/returns/print', query: { id: row.original.id } }}
                    target="_blank"
                  >
                    <PrinterIcon className="mr-2 h-4 w-4" /> Print
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={{ pathname: '/returns/edit', query: { id: row.original.id } }}>
                    <Pencil2Icon className="mr-2 h-4 w-4" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteRow(row.original)}>
                  <TrashIcon className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.data?.data || [],
    pageCount: data?.data?.last_page,
    columns,
    manualPagination: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    onPaginationChange: setPagination,
  });

  const { mutate: onDelete } = useMutation(deleteReturn, {
    onSuccess: () => {
      refetch();
      toast({ title: `Return successfully deleted.` });

      setDeleteRow(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error?.response?.data?.message,
      });
    },
    onSettled: () => {
      setDeleteRow(null);
    },
  });

  if (isLoading || !auth) {
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

      <Alert
        open={Boolean(deleteRow)}
        onCancel={() => setDeleteRow(null)}
        onContinue={() => onDelete(deleteRow)}
        description={`This action cannot be undone. This will permanently delete return from our servers.`}
      />

      <div className="min-h-lvh w-full px-10 py-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Returns</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="my-4">
          <h1 className="text-2xl font-bold">Returns ({data?.data?.total ?? 0})</h1>
          <p className="text-xs text-gray-600">
            Use the filter input to quickly search and display specific items by name, status, or
            other relevant criteria.
          </p>
        </div>

        <div className="w-full">
          <div className="flex items-center justify-between py-4">
            <div className="relative">
              <Input
                className="max-w-sm"
                placeholder="Filter items..."
                value={query ?? ''}
                onChange={(event) => {
                  setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
                  setQuery(event.target.value);
                }}
              />
              <div className="absolute bottom-0 right-0">
                <Button
                  variant="outline"
                  className="rounded-bl-none rounded-tl-none border-l-0 shadow-none"
                  onClick={() => setQuery('')}
                >
                  <Cross2Icon />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button asChild className="ml-2">
                <Link href="/returns/create">
                  <PlusIcon className="h-4 w-4" /> Add Return
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {isFetching ? (
                            <Skeleton className="h-8 w-full" />
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    {isFetching ? (
                      columns.map((_, index) => (
                        <TableCell key={index}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        No results.
                      </TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <DoubleArrowLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <DoubleArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Return), { ssr: false });
