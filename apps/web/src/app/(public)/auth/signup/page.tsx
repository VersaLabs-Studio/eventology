'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/shared/logo';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const } },
};

type UserRole = 'attend' | 'organize';

export default function SignupPage() {
  const { register, isLoading } = useAuth();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [role, setRole] = React.useState<UserRole>('attend');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const success = await register({
      name,
      email,
      password,
      phone: phone ? `+251${phone}` : undefined,
    });

    if (success) {
      // Redirect will happen inside register()
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <motion.div variants={itemVariants} className="flex justify-center mb-4">
              <Logo size="lg" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardTitle className="text-2xl">Create your account</CardTitle>
            </motion.div>
            <motion.div variants={itemVariants}>
              <CardDescription>Join the Eventology community</CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label className="text-sm font-medium">I want to</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('attend')}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all duration-200',
                      role === 'attend'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-sm font-medium">Attend Events</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('organize')}
                    className={cn(
                      'p-3 rounded-xl border text-center transition-all duration-200',
                      role === 'organize'
                        ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <span className="text-sm font-medium">Organize Events</span>
                  </button>
                </div>
              </motion.div>

              {/* Full Name */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Abebe Kebede"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  disabled={isSubmitting}
                  className="h-11"
                />
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="h-11"
                />
              </motion.div>

              {/* Phone */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone <span className="text-muted-foreground">(optional)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                    +251
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    className="h-11 pl-12"
                    placeholder="911 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    autoComplete="tel"
                    disabled={isSubmitting}
                  />
                </div>
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters
                </p>
              </motion.div>

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  className="w-full h-11"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-6">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
