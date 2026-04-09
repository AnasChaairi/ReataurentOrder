"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useDevice } from '@/contexts/DeviceContext';
import { Tablet, Hash, Lock } from 'lucide-react';

export default function DeviceLoginPage() {
  const { login } = useDevice();
  const router = useRouter();

  const [deviceId, setDeviceId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!deviceId.trim()) {
      setError('Please enter a device ID.');
      return;
    }
    if (!passcode.trim()) {
      setError('Please enter a passcode.');
      return;
    }

    setIsLoading(true);
    try {
      await login(deviceId.trim(), passcode.trim());
      // DeviceContext.login() sets config; redirect to tablet landing
      router.push('/tablet/device');
    } catch (err: any) {
      const msg = err?.response?.data?.error;
      setError(msg || 'Invalid device ID or passcode. Please try again.');
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
          <h2 className="text-4xl font-bold text-white mb-4">BARISTAS</h2>
          <p className="text-baristas-cream/80 text-lg max-w-xs">
            Tablet ordering system. Enter your device credentials to begin.
          </p>

          {/* Visual hint */}
          <div className="mt-10 bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-xs w-full">
            <div className="flex items-center gap-3 text-baristas-cream/80 text-sm mb-3">
              <Tablet className="w-5 h-5 shrink-0" />
              <span>Device ID is printed on your tablet or provided by your manager</span>
            </div>
            <div className="flex items-center gap-3 text-baristas-cream/80 text-sm">
              <Lock className="w-5 h-5 shrink-0" />
              <span>Passcode is a 4–6 digit PIN set by the administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-baristas-brown/30">
              <Image src="/baristas-logo.png" alt="Baristas Logo" fill className="object-cover" />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-baristas-brown-dark mb-2">Device Login</h1>
            <p className="text-gray-500">Enter your device credentials to start ordering</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Device ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => {
                    setDeviceId(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="e.g. BRST-A4X2"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-baristas-brown-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-baristas-brown focus:border-transparent font-mono text-lg tracking-widest uppercase"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Passcode — numeric keypad on mobile/tablet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={passcode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPasscode(val);
                    setError(null);
                  }}
                  placeholder="4–6 digit PIN"
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-baristas-brown-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-baristas-brown focus:border-transparent font-mono text-2xl tracking-[0.5em]"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-baristas-brown-dark text-white font-semibold rounded-xl hover:bg-baristas-brown transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-lg mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : (
                'Activate Device'
              )}
            </button>
          </form>

          {/* Admin link */}
          <div className="mt-8 text-center">
            <a
              href="/auth/login"
              className="text-sm text-gray-400 hover:text-baristas-brown transition-colors"
            >
              Admin login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
