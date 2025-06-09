import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import { zodResolver } from '@hookform/resolvers/zod';

import DevTool from '@/components/DevTool';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormField } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';

import { useToast } from '@/hooks/use-toast';
import { changePassword, logout } from '@/services/auth.service';

const schema = z.object({
  email: z.string().min(1, { message: 'Email is required' }),
  current_password: z.string().min(1, { message: 'Current Password is required' }),
  new_password: z.string().min(8, { message: 'New Password must be at least 8 characters' }),
  new_password_confirmation: z.string().min(8, { message: 'Confirm Password must be at least 8 characters' }),
}).refine(
  ({ new_password, new_password_confirmation }) => new_password_confirmation === new_password,
  {
    message: "Confirm password must be the same as the new password.",
    path: ["new_password_confirmation"],
  }
).refine(
  ({ current_password, new_password }) => current_password !== new_password,
  {
    message: "New password cannot be the same as the current password.",
    path: ["new_password"],
  }
);

const DEFAULT_SETTINGS = { email: '', current_password: '', new_password: '', new_password_confirmation: '' };

export function ProfileDialog({ open = true, auth = {}, onClose = () => { } }) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...DEFAULT_SETTINGS,
      email: auth.data.email,
    }
  });

  const { control, handleSubmit, formState: { errors } } = form;

  const logoutMutation = useMutation(logout, {
    onSettled: () => {
      localStorage.clear();
      window.location.href = '/login';
    },
  });

  const { mutate, isLoading } = useMutation(
    (data) => {
      return changePassword(data);
    },
    {
      onSuccess: () => {
        onClose();
        logoutMutation.mutate();
        toast({ title: `Settings successfully saved.` });
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error?.response?.data?.message,
        });
      },
    },
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>Make changes to your account here. Click save when you're done. After saving, you'll be logged out.</DialogDescription>
        </DialogHeader>

        <form className="mb-4" onSubmit={handleSubmit(mutate)}>
          <Form {...form}>
            <div className="flex flex-col gap-6 mb-5">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>

                <FormField
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input id="email" type="email" placeholder="johndoe@example.com" {...field} required />
                  )}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="current_password">Current Password</Label>
                </div>

                <FormField
                  name="current_password"
                  control={control}
                  render={({ field }) => (
                    <Input id="current_password" type="password" placeholder="••••••••" {...field} required />
                  )}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="new_password">New Password</Label>
                </div>

                <FormField
                  name="new_password"
                  control={control}
                  render={({ field }) => (
                    <Input id="new_password" type="password" placeholder="••••••••" {...field} required />
                  )}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
                </div>

                <FormField
                  name="new_password_confirmation"
                  control={control}
                  render={({ field }) => (
                    <Input id="new_password_confirmation" type="password" placeholder="••••••••" {...field} required />
                  )}
                />
              </div>

              {(Object.values(errors).length > 0) && (
                <Alert variant="destructive">
                  {Object.values(errors).map((error) => <AlertDescription>• {error.message}</AlertDescription>)}
                </Alert>
              )}
            </div>
          </Form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" className="mb-1" disabled={isLoading}>
              {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <DevTool control={control} />
    </Dialog>
  );
}
