"use client";

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldAlert, KeyRound, ArrowRight, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

const authSchema = z.object({
  username: z.string().trim().min(1, 'Please enter administrator username'),
  password: z.string().trim().min(1, 'Please enter administrator password'),
});

export function CimdevAuthModal({ isOpen, onSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      username: 'cimdev',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    const u = values.username.trim();
    const p = values.password.trim();

    setLoading(true);
    try {
      await onSuccess(u, p);
      form.reset();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-md border dark:border-cyan-500/30 border-slate-300 dark:bg-[#0d1322] bg-white dark:text-white text-slate-900 p-6 shadow-2xl rounded-2xl"
      >
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 text-white">
            <Lock className="h-6 w-6" />
          </div>
          <DialogTitle className="mt-3 text-lg font-bold dark:text-white text-slate-900 tracking-wide">
            ADMINISTRATOR AUTHENTICATION
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs dark:text-slate-400 text-slate-500">
            System logs are restricted to authorized administrators.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-500 dark:text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>{serverError}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                    Admin Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter administrator username..."
                      className="dark:border-slate-700 border-slate-300 dark:bg-slate-900/90 bg-slate-50 dark:text-white text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400 text-xs h-9"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password..."
                        className="dark:border-slate-700 border-slate-300 dark:bg-slate-900/90 bg-slate-50 pr-16 dark:text-white text-slate-900 placeholder:text-slate-400 focus-visible:border-cyan-400 focus-visible:ring-cyan-400 text-xs h-9"
                      />
                      <div className="absolute right-2 top-1.5 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <KeyRound className="h-4 w-4 text-slate-400 select-none" />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs h-9 shadow-md shadow-cyan-600/20"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  Sign in to System Logs <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

CimdevAuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
