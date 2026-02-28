"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod/v4";
import { Eye, EyeOff, Mail, Lock, Coffee } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.general) {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation first
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: { [key: string]: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field && typeof field === 'string') newErrors[field] = issue.message;
      }
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // login() in AuthContext handles navigation (router.push) on success
      await login(formData);
    } catch (error: any) {
      const data = error?.response?.data;
      let message = 'Invalid email or password. Please try again.';

      if (data?.detail) message = data.detail;
      else if (data?.non_field_errors?.[0]) message = data.non_field_errors[0];
      else if (typeof data === 'string') message = data;

      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — branded panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-baristas-brown-dark overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/baristas-background.png"
            alt="Baristas interior"
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-baristas-brown-dark/80 to-baristas-brown/60" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-baristas-cream/30 mb-6">
            <Image src="/baristas-logo.png" alt="Baristas Logo" fill className="object-cover" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-widest">BARISTAS</h1>
          <p className="text-baristas-cream/70 text-lg max-w-xs leading-relaxed">
            Your daily dose of comfort. Experience the finest coffee and cuisine.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-xs">
            {['☕ Espresso', '🧁 Pastries', '🍽️ Brunch'].map((item) => (
              <div key={item} className="bg-white/8 backdrop-blur-sm rounded-xl px-3 py-2 text-baristas-cream/60 text-xs text-center border border-white/10">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-baristas-brown-dark px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-baristas-cream/30">
                  <Image src="/baristas-logo.png" alt="Baristas Logo" fill className="object-cover" />
                </div>
                <span className="text-white text-xl font-bold tracking-widest">BARISTAS</span>
              </div>
            </Link>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              Welcome back <Coffee className="w-7 h-7 text-baristas-cream" />
            </h2>
            <p className="text-white/50 text-sm">
              Log in to continue your order or manage your dashboard.
            </p>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/40 rounded-2xl">
              <p className="text-red-300 text-sm text-center">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3.5 bg-baristas-brown/40 border-2 rounded-xl text-white placeholder-white/25 focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-red-500/60 focus:border-red-400'
                      : 'border-baristas-brown-light/25 focus:border-baristas-cream/60'
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-red-300 text-xs">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-white/70">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-baristas-cream/70 hover:text-baristas-cream transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-12 py-3.5 bg-baristas-brown/40 border-2 rounded-xl text-white placeholder-white/25 focus:outline-none transition-colors ${
                    errors.password
                      ? 'border-red-500/60 focus:border-red-400'
                      : 'border-baristas-brown-light/25 focus:border-baristas-cream/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-red-300 text-xs">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-baristas-cream text-baristas-brown-dark py-3.5 rounded-xl font-bold text-base hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-baristas-brown/30 border-t-baristas-brown rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-8 text-center">
            <p className="text-white/40 text-sm">
              New to BARISTAS?{' '}
              <Link href="/auth/register" className="text-baristas-cream font-semibold hover:text-white transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {/* Back home */}
          <div className="mt-4 text-center">
            <Link href="/" className="text-white/25 hover:text-white/50 text-xs transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
