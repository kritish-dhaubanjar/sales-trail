'use client';
import dynamic from 'next/dynamic';

import { useState } from 'react';

import { useAuthUser } from '@/hooks/use-is-authenticated';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';

import { Button } from '@/components/ui/button';

import Sidebar from '@/components/layout/sidebar';
import { ProfileDialog } from '@/components/settings';

function Unit() {
  const [open, setOpen] = useState(false);

  const { isLoading, data: auth } = useAuthUser();

  const onClear = () => {
    setOpen(false);
  };

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

      <div className="min-h-lvh w-full px-10 py-10">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="my-4">
          <h1 className="text-xl font-bold">Login and Password</h1>
          <hr className="my-2" />
          <p className="text-xs text-gray-600 mb-2">Manage your passwords and login preferences.</p>
        </div>

        <div className="w-full">
          <Button size="sm" onClick={() => setOpen(true)}>Change Login and Password</Button>

          {open && <ProfileDialog auth={auth} open={open} onClose={onClear} />}
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Unit), { ssr: false });
