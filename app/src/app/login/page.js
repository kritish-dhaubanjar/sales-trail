'use client';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import { zodResolver } from '@hookform/resolvers/zod';

import dynamic from 'next/dynamic';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

import DevTool from '@/components/DevTool';

import { EnvelopeOpenIcon, ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons';

import { login, getAuthenticatedUser } from '@/services/auth.service';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, { message: 'Password is required' }),
});

function Login() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { control, handleSubmit } = form;

  const { isLoading, mutate, error } = useMutation(login, {
    onSuccess: (response) => {
      const token = response.data.token;
      localStorage.setItem('token', token);
      window.location.href = '/';
    },
  });

  const { isFetching, data } = useQuery({
    queryKey: ['users'],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: getAuthenticatedUser,
    onSuccess: () => (window.location.href = '/'),
    enabled: Boolean(localStorage.getItem('token')),
  });

  if (isFetching || data) {
    return (
      <div className="flex h-lvh items-center justify-center space-x-4">
        <div className="space-y-2">
          <Skeleton className="h-4 min-w-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-lvh items-center justify-center pb-20">
      <Form {...form}>
        <form onSubmit={handleSubmit(mutate)} className="min-w-96 space-y-4">
          <img src="/images/logo.jpg" width="150px" className="mx-auto"/>

          <h1 className="mb-1 text-2xl font-bold">Sign In</h1>
          <span className="text-sm text-slate-500">
            Enter your email below to sign into your account
          </span>

          <FormField
            name="email"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="johndoe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="password"
            control={control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            <EnvelopeOpenIcon className="mr-2 h-4 w-4" /> Sign In
          </Button>

          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Uh oh! Something went wrong.</AlertTitle>
              <AlertDescription>{error.response?.data?.message}</AlertDescription>
            </Alert>
          )}
        </form>
      </Form>

      <DevTool control={control} />
    </div>
  );
}

export default dynamic(() => Promise.resolve(Login), { ssr: false });
