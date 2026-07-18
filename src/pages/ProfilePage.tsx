import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import { changePassword, get2FAStatus, setup2FA, enable2FA, disable2FA } from '@/services/api';
import { useConfirm } from '@/components/confirm-provider';
import { Mail, Shield, Key, Loader2, ShieldCheck, Eye, EyeOff, LogOut, Smartphone, Copy, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const { toast } = useToast();
  const confirm = useConfirm();

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      description: 'You will be logged out of the admin panel.',
      confirmText: 'Sign Out',
      variant: 'danger',
    });
    if (ok) logout();
  };

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);

  const handlePasswordChange = async () => {
    if (!pw.current || !pw.next) {
      toast({ title: 'Missing fields', description: 'Enter current and new password', variant: 'destructive' });
      return;
    }
    if (pw.next.length < 6) {
      toast({ title: 'Too short', description: 'New password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (pw.next !== pw.confirm) {
      toast({ title: 'Mismatch', description: 'New password and confirmation do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await changePassword(user?.email || '', pw.current, pw.next);
      toast({ title: 'Password updated', description: 'Your password has been changed successfully.' });
      setPw({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message || 'Could not update password', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Two-factor auth (authenticator app) ----
  const [tf, setTf] = useState<{ enabled: boolean; backupCodesLeft: number }>({ enabled: false, backupCodesLeft: 0 });
  const [tfLoading, setTfLoading] = useState(true);
  const [setupData, setSetupData] = useState<{ qr: string; secret: string } | null>(null);
  const [tfCode, setTfCode] = useState('');
  const [tfBusy, setTfBusy] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [disablePw, setDisablePw] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const loadTf = async () => {
    try {
      const res = await get2FAStatus();
      setTf({ enabled: !!res.enabled, backupCodesLeft: res.backupCodesLeft || 0 });
    } catch { /* ignore */ } finally { setTfLoading(false); }
  };
  useEffect(() => { loadTf(); }, []);

  const startSetup = async () => {
    setTfBusy(true);
    try {
      const res = await setup2FA();
      setSetupData({ qr: res.qr, secret: res.secret });
      setBackupCodes(null);
      setTfCode('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Could not start setup', variant: 'destructive' });
    } finally { setTfBusy(false); }
  };

  const confirmEnable = async () => {
    setTfBusy(true);
    try {
      const res = await enable2FA(tfCode.trim());
      setBackupCodes(res.backupCodes || []);
      setSetupData(null);
      setTfCode('');
      toast({ title: '2FA enabled', description: 'Authenticator app is now required at login.' });
      loadTf();
    } catch (e: any) {
      toast({ title: 'Invalid code', description: e.message || 'Try again', variant: 'destructive' });
    } finally { setTfBusy(false); }
  };

  const confirmDisable = async () => {
    setTfBusy(true);
    try {
      await disable2FA(disablePw);
      toast({ title: '2FA disabled', description: 'Login will use email OTP again.' });
      setShowDisable(false);
      setDisablePw('');
      setBackupCodes(null);
      loadTf();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Could not disable', variant: 'destructive' });
    } finally { setTfBusy(false); }
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1 overflow-hidden">
          <div className="relative bg-gradient-to-br from-[#1560BD] to-[#0d3a73] px-6 pb-16 pt-8 text-center text-white">
            <div className="absolute right-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold capitalize">
              {user?.role || 'admin'}
            </div>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/15 text-3xl font-bold ring-4 ring-white/25 backdrop-blur">
              {user?.avatar ? <img src={user.avatar} alt={user.name} className="h-24 w-24 rounded-full object-cover" /> : initial}
            </div>
          </div>
          <CardContent className="-mt-10 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">{user?.name || 'Admin User'}</h3>
              <p className="flex items-center justify-center gap-1.5 text-sm text-slate-500">
                <Mail className="h-3.5 w-3.5" /> {user?.email || '—'}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified Admin
              </div>
            </div>
            <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Account info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-[#1560BD]" /> Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={user?.name || ''} readOnly className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input value={user?.email || ''} readOnly className="bg-slate-50" />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={user?.role || 'admin'} readOnly className="bg-slate-50 capitalize" />
              </div>
              <div className="space-y-1.5">
                <Label>Account Status</Label>
                <Input value="Active" readOnly className="bg-slate-50" />
              </div>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-5 w-5 text-[#1560BD]" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={show ? 'text' : 'password'}
                    value={pw.current}
                    onChange={(e) => setPw({ ...pw, current: e.target.value })}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input type={show ? 'text' : 'password'} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Min 6 characters" />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input type={show ? 'text' : 'password'} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} placeholder="Re-enter new password" />
                </div>
              </div>
              <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handlePasswordChange} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Smartphone className="h-5 w-5 text-[#1560BD]" /> Two-Factor Authentication
                {tf.enabled && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Enabled</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">
                Add an extra layer using an authenticator app (Google Authenticator, Authy). When enabled, login asks for
                a code from your phone instead of an email OTP.
              </p>

              {tfLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : backupCodes ? (
                /* Show backup codes once, right after enabling */
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <ShieldCheck className="h-4 w-4" /> Save these backup codes
                  </div>
                  <p className="mt-1 text-xs text-amber-700">Each works once if you lose your phone. Store them safely — they won't be shown again.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {backupCodes.map((c) => (
                      <code key={c} className="rounded bg-white px-2 py-1 text-center font-mono text-sm text-slate-800">{c}</code>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(backupCodes.join('\n')); setCopiedCodes(true); setTimeout(() => setCopiedCodes(false), 1500); }}>
                      {copiedCodes ? <Check className="mr-1 h-4 w-4 text-emerald-600" /> : <Copy className="mr-1 h-4 w-4" />} Copy
                    </Button>
                    <Button size="sm" onClick={() => setBackupCodes(null)} className="bg-[#1560BD] text-white hover:bg-[#124f9c]">Done</Button>
                  </div>
                </div>
              ) : setupData ? (
                /* Setup flow: scan QR + confirm code */
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                    <img src={setupData.qr} alt="2FA QR" className="h-40 w-40 rounded-lg border border-slate-200" />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-slate-600">1. Scan this QR in your authenticator app.</p>
                      <p className="text-xs text-slate-400">Can't scan? Enter this key manually:</p>
                      <code className="block break-all rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700">{setupData.secret}</code>
                      <p className="text-sm text-slate-600">2. Enter the 6-digit code it shows:</p>
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        value={tfCode}
                        onChange={(e) => setTfCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="max-w-40 text-center tracking-[0.3em]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSetupData(null)} disabled={tfBusy}>Cancel</Button>
                    <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={confirmEnable} disabled={tfBusy || tfCode.length !== 6}>
                      {tfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Verify & Enable
                    </Button>
                  </div>
                </div>
              ) : tf.enabled ? (
                /* Enabled state: show status + disable */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-700">
                    <ShieldCheck className="h-4 w-4" /> Authenticator app is active. {tf.backupCodesLeft} backup code(s) left.
                  </div>
                  {showDisable ? (
                    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3">
                      <Label className="text-sm">Confirm your password to disable 2FA</Label>
                      <Input type="password" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} placeholder="Current password" className="max-w-xs" />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setShowDisable(false); setDisablePw(''); }} disabled={tfBusy}>Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={confirmDisable} disabled={tfBusy || !disablePw}>
                          {tfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Disable 2FA
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setShowDisable(true)}>Disable 2FA</Button>
                  )}
                </div>
              ) : (
                /* Disabled state: enable button */
                <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={startSetup} disabled={tfBusy}>
                  {tfBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />} Enable Authenticator App
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
