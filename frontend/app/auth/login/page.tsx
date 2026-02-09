"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod/v4";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Zod validation
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: { [key: string]: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field && typeof field === 'string') {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await login(formData);
      // Navigation handled by AuthContext
      router.push('/');
    } catch (error: any) {
      setErrors({ general: error.message || "Invalid email or password" });
    } finally {
      setIsLoading(false);
    }
  };

  const [userType, setUserType] = useState<'customer' | 'staff'>('customer');

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branded Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-baristas-brown-dark">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-image.webp"
            alt="BARISTAS Interior"
            fill
            className="object-cover opacity-40"
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="w-32 h-32 bg-baristas-brown rounded-full flex items-center justify-center mb-6 border-4 border-baristas-cream">
            <span className="text-baristas-cream text-5xl font-bold">B</span>
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 tracking-wider">BARISTAS</h1>
          <p className="text-baristas-cream text-center text-lg max-w-md">
            Your daily dose of comfort. Experience the finest coffee and cuisine.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-baristas-brown-dark px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <div className="inline-flex flex-col items-center">
                <div className="w-16 h-16 bg-baristas-brown rounded-full flex items-center justify-center mb-4 border-3 border-baristas-cream">
                  <span className="text-baristas-cream text-2xl font-bold">B</span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wider">BARISTAS</h1>
              </div>
            </Link>
          </div>

          {/* Header */}
          <div className="text-right mb-8">
            <Link href="/">
              <button className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors ml-auto">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Your account</span>
              </button>
            </Link>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-4 flex items-center gap-3">
              Welcome Back ☕
            </h2>
            <p className="text-gray-300">
              Log in to continue your order or manage your dashboard.
            </p>
          </div>

          {/* User Type Toggle */}
          <div className="flex mb-8 bg-baristas-brown/50 rounded-full p-1">
            <button
              onClick={() => setUserType('customer')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${
                userType === 'customer'
                  ? 'bg-baristas-cream text-baristas-brown-dark'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => setUserType('staff')}
              className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all ${
                userType === 'staff'
                  ? 'bg-baristas-cream text-baristas-brown-dark'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Staff
            </button>
          </div>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl">
              <p className="text-red-300 text-sm text-center">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="email"
                  placeholder="Username"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-baristas-brown/40 border-2 border-baristas-brown-light/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-baristas-cream transition-colors"
                />
              </div>
              {errors.email && <p className="mt-2 text-red-300 text-sm">{errors.email}</p>}
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-baristas-brown/40 border-2 border-baristas-brown-light/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-baristas-cream transition-colors"
                />
              </div>
              {errors.password && <p className="mt-2 text-red-300 text-sm">{errors.password}</p>}
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-baristas-cream hover:text-white font-medium text-sm transition-colors underline"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-baristas-cream text-baristas-brown-dark py-4 rounded-xl font-bold text-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-300">
              New to BARISTAS?{" "}
              <Link
                href="/auth/register"
                className="text-baristas-cream hover:text-white font-bold underline transition-colors"
              >
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
