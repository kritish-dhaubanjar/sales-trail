'use client';

import React from 'react';
import Image from 'next/image'
import { Button } from '@/components/ui/button';

import {
  ExitIcon,
  ArchiveIcon,
  FilePlusIcon,
  FileMinusIcon,
  RulerSquareIcon,
  IdCardIcon,
  ReloadIcon,
  GearIcon,
  MixIcon,
  FileTextIcon,
  WidthIcon,
  AlignTopIcon,
  LaptopIcon,
  BarChartIcon,
} from '@radix-ui/react-icons';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMutation } from 'react-query';
import { logout } from '@/services/auth.service';
import { redirect, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthUser } from '@/hooks/use-is-authenticated';

const items = [
  {
    name: 'Dashboard',
    Icon: BarChartIcon,
    href: '/dashboard',
    roles: new Set(['admin'])
  },
  {
    name: 'Units',
    Icon: RulerSquareIcon,
    href: '/units',
    roles: new Set(['admin'])
  },
  {
    name: 'Accounts',
    Icon: IdCardIcon,
    href: '/accounts',
    roles: new Set(['admin'])
  },
  {
    name: 'Transfers',
    Icon: WidthIcon,
    href: '/transfers',
    roles: new Set(['admin'])
  },
  {
    name: 'Categories',
    Icon: MixIcon,
    href: '/categories',
    roles: new Set(['admin'])
  },
  {
    name: 'Items',
    Icon: ArchiveIcon,
    href: '/items',
    roles: new Set(['admin'])
  },
  {
    name: 'Sales',
    Icon: FilePlusIcon,
    href: '/sales',
    roles: new Set(['admin'])
  },
  {
    name: 'Purchases',
    Icon: FileTextIcon,
    href: '/purchases',
    roles: new Set(['admin'])
  },
  {
    name: 'Returns',
    Icon: FileMinusIcon,
    href: '/returns',
    roles: new Set(['admin'])
  },
  {
    name: 'Tables',
    Icon: AlignTopIcon,
    href: '/tables',
    roles: new Set(['admin'])
  },
  {
    name: 'Point of Sale',
    Icon: LaptopIcon,
    href: '/pos',
    target: '_blank',
    roles: new Set(['admin', 'user'])
  },
  {
    name: 'Settings',
    Icon: GearIcon,
    href: '/settings',
    roles: new Set(['admin', 'user'])
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const { isLoading, mutate, data } = useMutation(logout, {
    onSettled: () => {
      localStorage.clear();
      window.location.href = '/login';
    },
  });

  const { data: auth } = useAuthUser();

  const item = items.find((item) => pathname.includes(item.href));

  if (!item.roles.has(auth.data.role)) {
    return redirect('/pos');
  }

  return (
    <div className="relative min-h-lvh max-w-48 border-r px-3 print:hidden">
      <Image src="/images/loop.png" width="100" height="100" className="mx-auto mt-5" />

      <div className="py-10">
        {items.filter((item) => item.roles.has(auth.data.role)).map(({ name, Icon, href, target = '_self' }) => {
          const className = pathname.includes(href) ? 'bg-accent' : '';

          return (
            <Button
              key={name}
              asChild
              variant="ghost"
              className={cn('mb-1.5 min-w-full justify-start py-2', className)}
            >
              <Link href={href} target={target}>
                <Icon className="mr-2 h-4 w-4" /> {name}
              </Link>
            </Button>
          );
        })}
      </div>
      <Button
        variant="ghost"
        className="mb-1.5 min-w-full justify-start py-2"
        onClick={mutate}
        disabled={isLoading || data}
      >
        {(isLoading || data) && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
        <ExitIcon className="mr-2 h-4 w-4" /> Sign Out
      </Button>
      <div className="absolute bottom-6 left-0 flex w-full flex-col items-center">
        <ThemeToggle />
      </div>
    </div>
  );
}
