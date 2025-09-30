'use client';

import Echo from '@/lib/echo'
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuthUser } from '@/hooks/use-is-authenticated';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SpeakerLoudIcon, SpeakerOffIcon } from '@radix-ui/react-icons'
import { useQuery } from 'react-query';
import { getTables } from '@/services/table.service';
import { getItems } from '@/services/item.service';
import { useTTS } from '@/lib/tts';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

function Kitchen() {
  const { speak, ready, isUnlocked } = useTTS();
  const { isLoading, data: auth } = useAuthUser();

  const { data: tables, refetch, isFetching: isFetchingTables } = useQuery({
    queryKey: ['tables'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => {
      const limit = 10240
      const page = 1

      return getTables({ page, limit, });
    },
  });

  const [logs, setLogs] = useState([])

  const { data: items, isFetching: isFetchingItems } = useQuery({
    queryKey: ['items'],
    enabled: true,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    queryFn: () => {
      const limit = 10240
      const page = 1

      return getItems({ page, limit, category_type: 'income' });
    },
  });

  useEffect(() => {
    if (!auth?.data?.id || !items?.data?.data) {
      return;
    }

    Echo.private('pos').listen('.pos.created', (data) => {
      refetch();
      data.added.map(({ item_id, quantity_added }) => {
        const item = items?.data?.data.find(i => i.id === item_id);
        setLogs(prev => [{ id: prev.length + 1, qty: quantity_added, item: item, table: data.table, isAdd: true, isChecked: false, log: `${quantity_added} ${item.name} added for ${data.table.name}` }, ...prev])

        speak(`${quantity_added} ${item.name} added for ${data.table.name}`)
      })

      data.removed.map(({ item_id, quantity_removed }) => {
        const item = items?.data?.data.find(i => i.id === item_id);

        setLogs(prev => [{ id: prev.length + 1, qty: quantity_removed, item: item, table: data.table, isRemoved: true, isChecked: false, log: `${quantity_removed} ${item.name} removed for ${data.table.name}` }, ...prev])

        speak(`${quantity_removed} ${item.name} removed for ${data.table.name}`)
      })
    });

    return () => {
      if (auth?.data?.id) {
        Echo.leave(`pos.${auth.data.id}`);
      }
    }
  }, [items?.data?.data, auth?.data?.id])

  if (isLoading || !auth || isFetchingTables || isFetchingItems || !ready) {
    return (
      <div className="flex h-lvh items-center justify-center space-x-4">
        <div className="space-y-2">
          <Skeleton className="h-4 min-w-96" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="m-4">
        <Button
          variant="outline"
          disabled={isUnlocked}
          size="icon"
        >
          {!isUnlocked ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
        </Button>
      </div>

      <div className="mx-auto p-6 flex">
        <div className="w-[512px] m-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.N.</TableHead>
                <TableHead>KOT</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {logs.map(({ isChecked, qty, item, table, id, isRemoved }) => (
                <TableRow key={id}>
                  <TableCell>{id}</TableCell>
                  <TableCell className={isChecked ? 'line-through' : ''}>
                    <span className={isRemoved ? 'text-red-600' : ''}>
                      {qty} {item.name}
                    </span>
                  </TableCell>
                  <TableCell>{table.name}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(value) => setLogs((logs) => {
                        const newLogs = [...logs];

                        const log = newLogs.find(l => l.id === id);
                        log.isChecked = value;
                        return newLogs;
                      })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {
            tables?.data?.data?.filter(table => table.items.length).map(table => {
              return (
                <div
                  key={table.id}
                  className="rounded-2xl border shadow-sm p-4 bg-white"
                >
                  <h2 className="mb-4 text-xl font-bold">{table.name}</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.N.</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.items.map(({ item, quantity }, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}

export default dynamic(() => Promise.resolve(Kitchen), { ssr: false });
