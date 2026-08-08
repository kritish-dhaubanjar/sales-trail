'use client';
import dynamic from 'next/dynamic';

import { amountToWordsWithCurrency } from '@/lib/string';
import { useMutation, useQuery } from 'react-query';
import { useSearchParams, useRouter } from 'next/navigation';

import { useAuthUser } from '@/hooks/use-is-authenticated';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReloadIcon } from '@radix-ui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { getSale, printSale } from '@/services/sale.service';
import { PrinterIcon } from 'lucide-react';
import { startCase } from 'lodash';

function Print() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { isLoading, data: auth } = useAuthUser();

  const saleId = searchParams.get('id');

  const { data, isFetching, isSuccess } = useQuery({
    enabled: true,
    queryKey: ['sales', saleId],
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: () => getSale({ id: saleId }),
    onError: () => {
      router.replace('/404');
    },
  });

  const useSalesPrintMutation = useMutation({ mutationFn: () => printSale({ id: saleId }) });

  if (isLoading || isFetching || !auth || !isSuccess) {
    return (
      <div className="flex h-lvh items-center justify-center space-x-4">
        <div className="space-y-2">
          <Skeleton className="h-4 min-w-96" />
        </div>
      </div>
    );
  }

  const formatter = Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      <div className="m-5 mx-auto flex w-[720px] justify-between print:hidden">
        <Button disabled={useSalesPrintMutation.isLoading} onClick={useSalesPrintMutation.mutate}>
          {useSalesPrintMutation.isLoading ? (
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PrinterIcon className="mr-2 h-4 w-4" />
          )}{' '}
          Print
        </Button>
      </div>

      <div className="container mx-auto mb-1 w-[400px] p-3 screen:border screen:border-black">
        <div>
          <div className="text-center">
            <h5 className="text-md mb-0 font-bold text-black">Sushi Time - Bhaktapur</h5>
            <h6 className="mb-0 text-sm text-black">
              By: Global Institute Of Hotel Management &amp; Tourism Technical Center Pvt. Ltd
            </h6>
            <h5 className="mb-0 font-bold text-black">VAT: 302891803</h5>
            <h5 className="text-md mb-0 font-bold">INVOICE</h5>
          </div>

          <div className="text-md my-1">
            <p className="whitespace-nowrap">Bill No: {data.data.id}</p>
            <p className="whitespace-nowrap">Bill Date: {data.data.date}</p>
            <p className="whitespace-nowrap">Table No: {data.data.title}</p>
            <p className="whitespace-nowrap">Customer Name: {data.data.customer?.name || '-'}</p>
            <p className="whitespace-nowrap">Customer Phone Number: {data.data.customer?.phone || '-'}</p>
          </div>

          <Table className="text-md mt-2 border-none">
            <TableHeader className="border-none">
              <TableRow>
                <TableHead className="h-0 w-[50px] py-0 text-black">SN</TableHead>
                <TableHead className="h-0 w-full py-0 text-left text-black">ITEMS</TableHead>
                <TableHead className="h-0 min-w-[60px] py-0 text-right text-black">Qty</TableHead>
                <TableHead className="h-0 min-w-[60px] py-0 text-right text-black">RATE</TableHead>
                <TableHead className="h-0 min-w-[60px] py-0 text-right text-black">AMT</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data?.data?.sale_items?.map((sale, index) => (
                <TableRow key={index} className="border-0">
                  <TableCell className="whitespace-nowrap pb-[3px] pt-1 text-right">
                    {index + 1}
                  </TableCell>
                  <TableCell className="max-w-32 overflow-hidden pb-[3px] pt-1 text-left font-medium">
                    {sale.item.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap pb-[3px] pt-1 text-right">
                    {sale.quantity}
                  </TableCell>
                  <TableCell className="whitespace-nowrap pb-[3px] pt-1 text-right">
                    {formatter.format(sale.price)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap pb-[3px] pt-1 text-right">
                    {formatter.format(sale.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter className="text-md bg-white">
              <TableRow>
                <TableCell className="h-0 py-0 text-right" colSpan={4}>
                  Sub Total (Incl. VAT)
                </TableCell>
                <TableCell className="h-0 py-0 text-right">
                  {formatter.format(data.data.total)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="h-0 py-0 text-right" colSpan={4}>
                  Adj
                </TableCell>
                <TableCell className="h-0 py-0 text-right">
                  {formatter.format(data.data.discount)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="h-0 py-0 text-right" colSpan={4}>
                  Taxable Amount
                </TableCell>
                <TableCell className="h-0 py-0 text-right">
                  {formatter.format(data.data.taxable_amount)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="h-0 py-0 text-right" colSpan={4}>
                  13% VAT
                </TableCell>
                <TableCell className="h-0 py-0 text-right">
                  {formatter.format(data.data.vat_amount)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="h-0 py-0 text-right font-bold" colSpan={4}>
                  Grand Total
                </TableCell>
                <TableCell className="h-0 py-0 text-right font-bold">
                  {formatter.format(data.data.grand_total)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          <hr />

          <div className="my-2">
            In Words:{' '}
            {startCase(amountToWordsWithCurrency(data.data.grand_total, { locale: 'en-IN' }))}
          </div>

          <hr />

          <div className="mt-2">Printed On: {new Date().toString().substring(0, 25)}</div>

          <div className="mt-10 flex justify-between">
            <div>
              <hr />
              Cashier
            </div>
            <div>
              <hr />
              Guest Signature
            </div>
          </div>

          <div className="text-center">THANK YOU</div>

          <p className="mt-2 italic">* This is an estimated bill only and is not a tax invoice.</p>
        </div>
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(Print), { ssr: false });
