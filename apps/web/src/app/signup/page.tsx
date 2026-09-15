'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/services/api';
import { MapPin, User, Phone, Mail, Lock, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useUserRole } from '@/context/UserRoleContext';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useUserRole();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      return setError('Please provide your full name (minimum 2 characters).');
    }
    if (!/^\d{10}$/.test(phone.trim())) {
      return setError('Please provide a valid 10-digit mobile number.');
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError('Please enter a valid email address.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter.');
    }
    if (!agreeTerms) {
      return setError('You must agree to the Terms of Service and Privacy Policy.');
    }

    setLoading(true);
    try {
      const res = await register({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        password
      });

      if (res.data?.success && res.data?.data) {
        login(res.data.data.token, res.data.data.user);
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      } else {
        setError(res.data?.message || 'Registration failed. Please check details.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.response?.data?.message || 'Registration failed. Please try again or sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Stadium glow effect */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none -top-20 -right-20"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-15 pointer-events-none -bottom-20 -left-20"
        style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md p-6 sm:p-8 bg-card rounded-3xl shadow-2xl border border-border relative z-10 space-y-5">
        
        {/* Brand header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
            <MapPin className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Create Your Account
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Join TurfHub to book sports courts and tournament slots
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input 
                type="text"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                placeholder="Vigneshwaran P" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Mobile Number (10 Digits)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input 
                type="tel"
                required
                maxLength={10}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                placeholder="9876543210" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Email Address (Optional)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input 
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                placeholder="athlete@domain.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Create Password (Min. 6 chars)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input 
                type="password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
              <input 
                type="password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                placeholder="••••••••" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Terms & Consent */}
          <div className="flex items-start gap-2.5 pt-1">
            <input 
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
            />
            <label htmlFor="agreeTerms" className="text-xs text-muted-foreground cursor-pointer leading-snug">
              I agree to the <span className="text-foreground font-semibold">Terms of Service</span>, arena safety guidelines, and consent to match SMS notifications.
            </label>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-2 border-t border-border/80 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            Already have a TurfHub account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
          <p className="text-[11px] text-muted-foreground">
            🔒 Secured with encrypted tokens & role isolation
          </p>
        </div>

      </div>
    </div>
  );
}
