'use client';
import dynamic from 'next/dynamic';

import { useState } from 'react';
import { useQuery } from 'react-query';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

import { getSale } from '@/services/sale.service';
import { cn } from '@/lib/utils';
import { PrinterIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

function Print() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isQuotation, setQuotation] = useState(false);
  const [isDiscount, setIsDiscount] = useState(false);

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
  const placeholder = data.data.sale_items.length >= 25 ? 0 : 25 - data.data.sale_items.length;

  return (
    <>
      <div className="m-5 mx-auto flex w-[720px] justify-between print:hidden">
        <div className="flex">
          <div className="flex items-center space-x-2">
            <Switch
              id="quotation"
              checked={isQuotation}
              onCheckedChange={(value) => setQuotation(value)}
            />
            <Label htmlFor="quotation">Quotation</Label>
          </div>

          <div className="ml-5 flex items-center space-x-2">
            <Switch
              disabled={isQuotation}
              id="discount"
              checked={isDiscount}
              onCheckedChange={(value) => setIsDiscount(value)}
            />
            <Label htmlFor="quotation">Discount</Label>
          </div>
        </div>

        <Button onClick={window.print}>
          <PrinterIcon className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <div className="container mx-auto mb-1 w-[720px] p-1 screen:border screen:border-black">
        <div className="text-center">
          <h5 className="text-md mb-0 text-black">Sushi Time - Bhaktapur</h5>

          <div className="text-md my-1 flex justify-between">
            <div className="w-full">
              <Textarea
                rows="1"
                className="text-md resize-none overflow-y-hidden rounded-none border-0 py-0 font-bold underline shadow-none focus-visible:ring-0"
              >
                {data.data.title || '#Cash'}
              </Textarea>
            </div>

            <p className="whitespace-nowrap">Date: {data.data.date}</p>
          </div>

          <h5 className="text-md mb-1 font-bold text-black">
            {isQuotation ? 'Challan' : 'Estimate'}
          </h5>

          <Table className="text-md border">
            <TableHeader>
              <TableRow>
                <TableHead className="h-0 w-[50px] border border-black py-0 text-black">
                  S.N.
                </TableHead>
                <TableHead className="h-0 w-full border border-black py-0 text-left text-black">
                  Particulars
                </TableHead>
                <TableHead className="h-0 min-w-[60px] border border-black py-0 text-right text-black">
                  Qty
                </TableHead>
                <TableHead className="h-0 min-w-[60px] border border-black py-0 text-right text-black">
                  Unit
                </TableHead>
                <TableHead
                  className={cn(
                    'h-0 min-w-[70px] border border-black py-0 text-right text-black',
                    isQuotation ? 'hidden' : '',
                  )}
                >
                  Rate
                </TableHead>
                <TableHead
                  className={cn(
                    'h-0 min-w-[70px] border border-black py-0 text-right text-black',
                    isQuotation || !isDiscount ? 'hidden' : '',
                  )}
                >
                  Discount
                </TableHead>
                <TableHead
                  className={cn(
                    'h-0 min-w-[70px] border border-black py-0 text-right text-black',
                    isQuotation ? 'hidden' : '',
                  )}
                >
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="border border-black">
              {data?.data?.sale_items?.map((sale, index) => (
                <TableRow className="border-b-gray-400" key={index}>
                  <TableCell className="whitespace-nowrap border-x border-y-0 border-x-black pb-[3px] pt-1 text-right">
                    {index + 1}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border-x border-y-0 border-x-black pb-[3px] pt-1 text-left font-medium max-w-32 overflow-hidden text-ellipsis">
                    {sale.item.name}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border-x border-y-0 border-x-black pb-[3px] pt-1 text-right font-bold">
                    {sale.quantity}
                  </TableCell>
                  <TableCell className="whitespace-nowrap border-x border-y-0 border-x-black pb-[3px] pt-1 text-right">
                    {sale.item.unit.name}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'whitespace-nowrap border-x border-y-0 border-x-black pb-[3px] pt-1 text-right',
                      isQuotation ? 'hidden' : '',
                    )}
                  >
                    {formatter.format(sale.price)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'whitespace-nowrap border-x border-y-0 border-x-black pb-[3px] pt-1 text-right',
                      isQuotation || !isDiscount ? 'hidden' : '',
                    )}
                  >
                    {formatter.format(sale.discount)}%
                  </TableCell>
                  <TableCell
                    className={cn(
                      'whitespace-nowrap border-x border-y-0 border-x-black pb-[3px] pt-1 text-right',
                      isQuotation ? 'hidden' : '',
                    )}
                  >
                    {formatter.format(sale.total)}
                  </TableCell>
                </TableRow>
              ))}

              {new Array(placeholder).fill(null).map((_, index) => (
                <TableRow key={index} className="border-0">
                  <TableCell className="h-8 border-x border-y-0 border-x-black py-1 text-right"></TableCell>
                  <TableCell className="border-x border-y-0 border-x-black py-1 text-left font-medium"></TableCell>
                  <TableCell className="border-x border-y-0 border-x-black py-1 text-right"></TableCell>
                  <TableCell className="border-x border-y-0 border-x-black py-1 text-right"></TableCell>
                  <TableCell
                    className={cn(
                      'border-x border-y-0 border-x-black py-1 text-right',
                      isQuotation ? 'hidden' : '',
                    )}
                  ></TableCell>
                  <TableCell
                    className={cn(
                      'border-x border-y-0 border-x-black py-1 text-right',
                      isQuotation || !isDiscount ? 'hidden' : '',
                    )}
                  ></TableCell>
                  <TableCell
                    className={cn(
                      'border-x border-y-0 border-x-black py-1 text-right',
                      isQuotation ? 'hidden' : '',
                    )}
                  ></TableCell>
                </TableRow>
              ))}
            </TableBody>

            {isQuotation ? (
              <TableFooter>
                <TableRow>
                  <TableCell className="border border-black text-left" colSpan={1}>
                    <div className="w-[50px] text-right">{data.data.id}</div>
                  </TableCell>

                  <TableCell className="border border-black text-right" colSpan={3}>
                    <div className="w-full">
                      <Textarea
                        rows="1"
                        className="text-md resize-none overflow-y-hidden rounded-none border-0 p-0 font-normal shadow-none focus-visible:ring-0"
                      >
                        {data.data.description || ''}
                      </Textarea>
                    </div>
                  </TableCell>
                </TableRow>
              </TableFooter>
            ) : (
              <TableFooter className="text-md">
                <TableRow>
                  <TableCell className="border border-black text-left" rowSpan={3} colSpan={1}>
                    <div className="w-[50px] rotate-[270deg] text-right">{data.data.id}</div>
                  </TableCell>

                  <TableCell
                    className="h-0 border border-black py-0 text-right"
                    colSpan={1}
                    rowSpan={3}
                  >
                    <div className="w-full">
                      <Textarea
                        rows="1"
                        className="text-md resize-none overflow-y-hidden rounded-none border-0 p-0 font-normal shadow-none focus-visible:ring-0"
                      >
                        {data.data.description || ''}
                      </Textarea>
                    </div>
                  </TableCell>
                  <TableCell
                    className="h-0 border border-black py-0 text-right"
                    colSpan={isDiscount ? 4 : 3}
                  >
                    Total
                  </TableCell>
                  <TableCell className="h-0 border border-black py-0 text-right">
                    {formatter.format(data.data.total)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    className="h-0 border border-black py-0 text-right"
                    colSpan={isDiscount ? 4 : 3}
                  >
                    Adj
                  </TableCell>
                  <TableCell className="h-0 border border-black py-0 text-right">
                    {formatter.format(data.data.discount)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    className="h-0 border border-black py-0 text-right font-medium"
                    colSpan={isDiscount ? 4 : 3}
                  >
                    Grand Total
                  </TableCell>
                  <TableCell className="h-0 border border-black py-0 text-right font-medium">
                    {formatter.format(data.data.grand_total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(Print), { ssr: false });
