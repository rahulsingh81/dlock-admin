import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

const logoUrl = `${import.meta.env.BASE_URL}logo-dark.png`;

// Data-center / server-room background (high quality, with graceful gradient fallback)
const bgImage =
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1920&q=80';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp' | 'totp'>('credentials');
  const [otp, setOtp] = useState('');
  const genCaptcha = () => Math.random().toString(36).slice(2, 8).toUpperCase();
  const [captcha, setCaptcha] = useState(genCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const { login, verifyOtp, verifyTotp, resendOtp, isAuthenticated, isLoading } = useAuthStore();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captcha) {
      toast({ title: 'Captcha incorrect', description: 'Please enter the code exactly as shown', variant: 'destructive' });
      setCaptcha(genCaptcha());
      setCaptchaInput('');
      return;
    }

    try {
      const res = await login({ email, password });
      if (res?.totpRequired) {
        setStep('totp');
        setOtp('');
        toast({ title: 'Authenticator required', description: 'Enter the 6-digit code from your app' });
      } else if (res?.otpRequired) {
        setStep('otp');
        setOtp('');
        toast({ title: 'OTP sent', description: `A 6-digit code was sent to ${email}` });
      }
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please check your email and password.',
        variant: 'destructive',
      });
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'totp') {
      if (!otp.trim()) {
        toast({ title: 'Enter code', description: 'Enter your authenticator code or a backup code', variant: 'destructive' });
        return;
      }
      try {
        await verifyTotp({ email, otp: otp.trim() });
        toast({ title: 'Welcome back!', description: 'Successfully logged in' });
      } catch (error) {
        toast({ title: 'Invalid code', description: 'The authenticator/backup code is wrong.', variant: 'destructive' });
      }
      return;
    }
    if (otp.length !== 6) {
      toast({ title: 'Enter OTP', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }
    try {
      await verifyOtp({ email, otp });
      toast({ title: 'Welcome back!', description: 'Successfully logged in' });
    } catch (error) {
      toast({ title: 'Invalid OTP', description: 'The code is wrong or expired.', variant: 'destructive' });
    }
  };

  const handleResend = async () => {
    try {
      await resendOtp(email);
      toast({ title: 'OTP resent', description: `A new code was sent to ${email}` });
    } catch {
      toast({ title: 'Error', description: 'Could not resend OTP', variant: 'destructive' });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      {/* Background image (slow ken-burns zoom) */}
      <div
        className="bg-kenburns absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${bgImage}")` }}
      />
      {/* Dark brand overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/85 via-[#0d3a73]/75 to-slate-950/90" />
      {/* Glowing accent blobs */}
      <div className="auth-blob left-[-6%] top-[-8%] h-96 w-96 bg-[#1560BD]" />
      <div className="auth-blob right-[-8%] bottom-[-10%] h-[26rem] w-[26rem] bg-cyan-500" style={{ animationDelay: '5s' }} />

      {/* Login card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="anim-in delay-2 w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl sm:p-10">
          {/* Logo on white chip */}
          <div className="mb-8 flex justify-center">
            <div className="float-slow rounded-2xl bg-white px-5 py-3 shadow-lg">
              <img src={logoUrl} alt="DLock Services" className="h-9 w-auto" />
            </div>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white">
              {step === 'totp' ? 'Two-Factor Auth' : step === 'otp' ? 'Verify OTP' : 'Welcome Back'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-300">
              {step === 'totp'
                ? 'Enter the code from your authenticator app'
                : step === 'otp'
                ? `Enter the 6-digit code sent to ${email}`
                : 'Sign in to your admin dashboard'}
            </p>
          </div>

          {step !== 'credentials' ? (
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="anim-in delay-3 space-y-2">
                <Label htmlFor="otp" className="text-slate-200">{step === 'totp' ? 'Authenticator / backup code' : 'One-Time Password'}</Label>
                <div className="relative group">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-300 transition-colors" />
                  <Input
                    id="otp"
                    inputMode={step === 'totp' ? 'text' : 'numeric'}
                    maxLength={step === 'totp' ? 14 : 6}
                    placeholder={step === 'totp' ? 'Enter code' : '______'}
                    value={otp}
                    onChange={(e) =>
                      setOtp(
                        step === 'totp'
                          ? e.target.value.replace(/\s/g, '').toUpperCase().slice(0, 14)
                          : e.target.value.replace(/\D/g, '').slice(0, 6)
                      )
                    }
                    className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-center text-lg font-bold tracking-[0.4em] text-white placeholder:text-slate-500 placeholder:tracking-[0.3em] backdrop-blur focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="anim-in delay-4 h-12 w-full rounded-xl bg-gradient-to-r from-[#1560BD] to-cyan-500 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify & Sign In'}
              </Button>

              <div className="anim-in delay-5 flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep('credentials')} className="flex items-center gap-1 text-slate-300 hover:text-white">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                {step === 'totp' ? (
                  <span className="text-slate-400">Lost your device? Use a backup code.</span>
                ) : (
                  <button type="button" onClick={handleResend} className="text-cyan-300 hover:text-cyan-200">
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="anim-in delay-3 space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-300 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="info@dlockservices.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder:text-slate-400 backdrop-blur focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="anim-in delay-4 space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-300 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 pr-11 text-white placeholder:text-slate-400 backdrop-blur focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="anim-in delay-4 space-y-2">
              <Label className="text-slate-200">Captcha</Label>
              <div className="flex items-center gap-3">
                <div
                  className="select-none rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 font-mono text-lg font-bold tracking-[0.35em] text-cyan-200 line-through decoration-white/20"
                  style={{ fontStyle: 'italic', letterSpacing: '0.35em' }}
                >
                  {captcha}
                </div>
                <button type="button" onClick={() => { setCaptcha(genCaptcha()); setCaptchaInput(''); }} className="text-slate-300 hover:text-white" title="Refresh captcha">
                  <Loader2 className="h-4 w-4" />
                </button>
                <Input
                  placeholder="Enter code"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="h-11 flex-1 rounded-xl border-white/20 bg-white/10 uppercase text-white placeholder:text-slate-400 backdrop-blur focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="anim-in delay-5 relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#1560BD] to-cyan-500 text-base font-semibold text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-900/40 hover:-translate-y-0.5 active:translate-y-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="anim-in delay-5 pt-1 text-center text-xs text-slate-400">
              Only authorized admins can sign in.
            </div>
          </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="anim-in delay-5 absolute bottom-5 left-0 right-0 z-10 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} DLock Services · Power up with our servers
      </p>
    </div>
  );
}
