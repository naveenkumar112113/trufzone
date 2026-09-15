'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { forgotPassword, resetPassword } from '@/services/api';
import { MapPin, Phone, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'IDENTIFIER' | 'RESET' | 'SUCCESS'>('IDENTIFIER');
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      return setError('Please enter your registered mobile number or email address.');
    }

    setLoading(true);
    setError('');
    setInfoMsg('');
    try {
      const res = await forgotPassword(identifier.trim());
      const tokenHint = (res.data as any)?.data?.resetToken ? ` (Verification Code: ${(res.data as any).data.resetToken})` : '';
      setInfoMsg((res.data?.message || 'Verification code sent to your registered contact.') + tokenHint);
      setStep('RESET');
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err?.response?.data?.message || 'Unable to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      return setError('Please enter the 6-digit verification code.');
    }
    if (newPassword.length < 6) {
      return setError('New password must be at least 6 characters long.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match. Please re-enter.');
    }

    setLoading(true);
    setError('');
    try {
      const res = await resetPassword({
        identifier: identifier.trim(),
        token: token.trim(),
        newPassword
      });

      if (res.data?.success) {
        setStep('SUCCESS');
      } else {
        setError(res.data?.message || 'Failed to update password.');
      }
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.response?.data?.message || 'Invalid or expired verification code. Please try again.');
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
            <KeyRound className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {step === 'SUCCESS' ? 'Password Reset Complete' : 'Reset Account Password'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 'IDENTIFIER' && 'Enter your registered mobile or email to receive a reset code'}
              {step === 'RESET' && `Enter the verification code sent to ${identifier}`}
              {step === 'SUCCESS' && 'Your credentials have been securely updated'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold text-center leading-relaxed">
            {error}
          </div>
        )}

        {infoMsg && step === 'RESET' && (
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold text-center leading-relaxed">
            {infoMsg}
          </div>
        )}

        {/* STEP 1: Enter Identifier */}
        {step === 'IDENTIFIER' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Registered Mobile or Email
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                <input 
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="9443182940 or user@domain.com" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter Token & New Password */}
        {step === 'RESET' && (
          <form onSubmit={handleResetSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                6-Digit Verification Code
              </label>
              <input 
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-base outline-none focus:border-primary text-center tracking-[0.5em] font-mono font-black text-foreground"
                placeholder="------" 
                value={token} 
                onChange={(e) => setToken(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                New Password (Min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                <input 
                  type="password"
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-primary transition-colors"
                  placeholder="••••••••" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Confirm New Password
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

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('IDENTIFIER')}
              className="w-full py-1 text-xs text-muted-foreground hover:text-foreground transition-colors text-center cursor-pointer"
            >
              Use a different mobile number or email
            </button>
          </form>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'SUCCESS' && (
          <div className="text-center space-y-4 py-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your password has been changed successfully. You can now sign in with your updated credentials.
            </p>
            <Link
              href="/login"
              className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Footer link back to login */}
        <div className="pt-2 border-t border-border/80 text-center">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
