import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Settings as SettingsIcon, Building2, ToggleLeft, Share2, Loader2, Save,
  Wrench, UserPlus, MailCheck, CreditCard, Copy, Check, Eye, EyeOff, Megaphone, Server, Plug,
} from 'lucide-react';
import { getSiteSettings, updateSiteSettings, getPaymentSettings, updatePaymentSettings, testVirtualizor, testPhonePe } from '@/services/api';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://dlockservices.com/api';
const WEBHOOK_URL = `${API_BASE}/payment/webhook`;
const PHONEPE_WEBHOOK_URL = `${API_BASE}/payment/phonepe/webhook`;

const emptyPhonePe = {
  apiVersion: 'v2' as 'v2' | 'v1',
  mode: 'sandbox' as 'sandbox' | 'production',
  clientId: '', clientSecret: '', clientSecretSet: false, clientVersion: '1',
  merchantId: '', saltKey: '', saltKeySet: false, saltIndex: '1',
  webhookUsername: '', webhookPassword: '', webhookPasswordSet: false,
};

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [general, setGeneral] = useState<any>({});
  const [controls, setControls] = useState<any>({});
  const [social, setSocial] = useState<any>({});
  const [banner, setBanner] = useState<any>({ enabled: false, text: '', link: '' });
  const [virt, setVirt] = useState<any>({ enabled: false, apiUrl: '', apiKey: '', apiPass: '', apiPassSet: false });
  const [testingVirt, setTestingVirt] = useState(false);
  const [showVirtPass, setShowVirtPass] = useState(false);
  // Payment — gateway choice + per-gateway credentials
  const [payEnabled, setPayEnabled] = useState(false);
  const [provider, setProvider] = useState<'cashfree' | 'phonepe'>('cashfree');
  // Cashfree
  const [appId, setAppId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [secretSet, setSecretSet] = useState(false);
  const [payMode, setPayMode] = useState<'sandbox' | 'production'>('sandbox');
  // PhonePe
  const [pp, setPp] = useState<any>({ ...emptyPhonePe });
  const [showPpSecret, setShowPpSecret] = useState(false);
  const [showPpWebhookPass, setShowPpWebhookPass] = useState(false);
  const [testingPp, setTestingPp] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [copied, setCopied] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  // what's actually live right now — so "Test Connection" can save credentials
  // without also flipping the gateway customers are being sent to
  const [savedPay, setSaved] = useState<{ paymentEnabled: boolean; paymentProvider: 'cashfree' | 'phonepe' }>({ paymentEnabled: false, paymentProvider: 'cashfree' });

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getSiteSettings();
      setGeneral(res.general || {});
      setControls(res.controls || {});
      setSocial(res.social || {});
      setBanner(res.banner || { enabled: false, text: '', link: '' });
      const v = res.virtualizor || {};
      setVirt({ enabled: !!v.enabled, apiUrl: v.apiUrl || '', apiKey: v.apiKey || '', apiPass: v.apiPassSet ? '••••••••' : '', apiPassSet: !!v.apiPassSet });
      const pay: any = await getPaymentSettings();
      setPayEnabled(!!pay.paymentEnabled);
      setProvider(pay.paymentProvider === 'phonepe' ? 'phonepe' : 'cashfree');
      setSaved({ paymentEnabled: !!pay.paymentEnabled, paymentProvider: pay.paymentProvider === 'phonepe' ? 'phonepe' : 'cashfree' });
      setAppId(pay.cashfree?.appId || '');
      setSecretSet(!!pay.cashfree?.secretSet);
      setSecretKey(pay.cashfree?.secretSet ? pay.cashfree?.secretKey || '' : '');
      setPayMode(pay.cashfree?.mode === 'production' ? 'production' : 'sandbox');
      setPp({ ...emptyPhonePe, ...(pay.phonepe || {}) });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load settings', variant: 'destructive' });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // masked placeholders come back from the API for saved secrets — never send them back
  const typed = (v: string) => (v && !v.includes('•') ? v : undefined);

  // credentialsOnly → keep the live gateway/toggle untouched (used by Test Connection)
  const paymentPayload = (credentialsOnly = false) => {
    const body: any = {
      paymentEnabled: credentialsOnly ? savedPay.paymentEnabled : payEnabled,
      paymentProvider: credentialsOnly ? savedPay.paymentProvider : provider,
      cashfree: { appId, mode: payMode },
      phonepe: {
        apiVersion: pp.apiVersion,
        mode: pp.mode,
        clientId: pp.clientId,
        clientVersion: pp.clientVersion,
        merchantId: pp.merchantId,
        saltIndex: pp.saltIndex,
        webhookUsername: pp.webhookUsername,
      },
    };
    const cfSecret = typed(secretKey);
    if (cfSecret) body.cashfree.secretKey = cfSecret;
    const ppSecret = typed(pp.clientSecret);
    if (ppSecret) body.phonepe.clientSecret = ppSecret;
    const ppSalt = typed(pp.saltKey);
    if (ppSalt) body.phonepe.saltKey = ppSalt;
    const ppWh = typed(pp.webhookPassword);
    if (ppWh) body.phonepe.webhookPassword = ppWh;
    return body;
  };

  const savePayment = async () => {
    setSavingPay(true);
    try {
      await updatePaymentSettings(paymentPayload());
      toast({ title: 'Saved', description: 'Payment settings updated' });
      await load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally { setSavingPay(false); }
  };

  // Save first so the test runs against exactly what's on screen, then ask the backend to connect.
  const runPhonePeTest = async () => {
    const hasCreds = pp.apiVersion === 'v2'
      ? pp.clientId && (pp.clientSecret || pp.clientSecretSet)
      : pp.merchantId && (pp.saltKey || pp.saltKeySet);
    if (!hasCreds) {
      toast({ title: 'Missing details', description: 'Enter the PhonePe credentials first.', variant: 'destructive' });
      return;
    }
    setTestingPp(true);
    try {
      await updatePaymentSettings(paymentPayload(true));
      const r: any = await testPhonePe();
      toast({ title: 'PhonePe connected', description: r.message || 'Credentials are valid' });
      // refresh the masked/saved flags but keep the gateway the admin is currently viewing
      await load();
      setProvider('phonepe');
    } catch (err: any) {
      toast({ title: 'Connection failed', description: err.message || 'Could not reach PhonePe', variant: 'destructive' });
    } finally { setTestingPp(false); }
  };

  const copyWebhook = (url: string) => {
    navigator.clipboard?.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(''), 2000);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Virtualizor has its own Save button — keep it out of the global save
      await updateSiteSettings({ general, controls, social, banner });
      toast({ title: 'Saved', description: 'Settings updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const runVirtTest = async () => {
    if (!virt.apiUrl || !virt.apiKey || (!virt.apiPass && !virt.apiPassSet)) {
      toast({ title: 'Missing details', description: 'Enter API URL, key and password first.', variant: 'destructive' });
      return;
    }
    setTestingVirt(true);
    try {
      // save current values first so the test reads what you just typed
      const virtPayload: any = { enabled: virt.enabled, apiUrl: virt.apiUrl, apiKey: virt.apiKey };
      if (virt.apiPass && !virt.apiPass.includes('•')) virtPayload.apiPass = virt.apiPass;
      await updateSiteSettings({ virtualizor: virtPayload });
      const r: any = await testVirtualizor();
      toast({ title: r.ok ? 'Connected ✅' : 'Failed', description: r.message, variant: r.ok ? undefined : 'destructive' });
    } catch (err: any) {
      toast({ title: 'Test failed', description: err.message || 'Could not reach Virtualizor', variant: 'destructive' });
    } finally { setTestingVirt(false); }
  };

  const [savingVirt, setSavingVirt] = useState(false);
  const saveVirtualizor = async () => {
    setSavingVirt(true);
    try {
      const payload: any = { enabled: virt.enabled, apiUrl: virt.apiUrl, apiKey: virt.apiKey };
      if (virt.apiPass && !virt.apiPass.includes('•')) payload.apiPass = virt.apiPass;
      const res: any = await updateSiteSettings({ virtualizor: payload });
      const v = res.virtualizor || {};
      setVirt({ enabled: !!v.enabled, apiUrl: v.apiUrl || '', apiKey: v.apiKey || '', apiPass: v.apiPassSet ? '••••••••' : '', apiPassSet: !!v.apiPassSet });
      toast({ title: 'Saved', description: 'Virtualizor settings updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally { setSavingVirt(false); }
  };

  const g = (k: string) => general[k] || '';
  const s = (k: string) => social[k] || '';

  const toggles = [
    { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Show a maintenance page on the website', icon: Wrench, danger: true },
    { key: 'allowRegistration', label: 'User Registration', desc: 'Allow new users to sign up', icon: UserPlus },
    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send system & order emails', icon: MailCheck },
  ];

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
          <SettingsIcon className="h-5 w-5 text-[#1560BD]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Business info, controls, banner, VPS controls, payments & social links.</p>
        </div>
      </div>

      {/* General */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-[#1560BD]" /> General / Business Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><Label>Site Name</Label><Input value={g('siteName')} onChange={(e) => setGeneral({ ...general, siteName: e.target.value })} /></div>
          <div><Label>Support Email</Label><Input value={g('supportEmail')} onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })} /></div>
          <div><Label>Support Phone</Label><Input value={g('supportPhone')} onChange={(e) => setGeneral({ ...general, supportPhone: e.target.value })} placeholder="+91 …" /></div>
          <div><Label>GSTIN</Label><Input value={g('gstin')} onChange={(e) => setGeneral({ ...general, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" /></div>
          <div className="md:col-span-2"><Label>Company Address</Label><Textarea rows={2} value={g('companyAddress')} onChange={(e) => setGeneral({ ...general, companyAddress: e.target.value })} /></div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ToggleLeft className="h-5 w-5 text-[#1560BD]" /> Controls</CardTitle></CardHeader>
        <CardContent className="divide-y divide-slate-100">
          {toggles.map((t) => {
            const Icon = t.icon;
            const on = !!controls[t.key];
            return (
              <div key={t.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', t.danger && on ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-[#1560BD]')}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{t.label}</div>
                    <div className="text-xs text-slate-500">{t.desc}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-medium', on ? (t.danger ? 'text-rose-500' : 'text-emerald-600') : 'text-slate-400')}>{on ? 'ON' : 'OFF'}</span>
                  <Switch checked={on} onCheckedChange={(v: boolean) => setControls({ ...controls, [t.key]: v })} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Announcement Banner */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-5 w-5 text-[#1560BD]" /> Website Announcement Banner</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
            <div>
              <div className="font-medium text-slate-900">Show Banner</div>
              <div className="text-xs text-slate-500">A bar at the top of the website — great for maintenance notices or offers.</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium', banner.enabled ? 'text-emerald-600' : 'text-slate-400')}>{banner.enabled ? 'ON' : 'OFF'}</span>
              <Switch checked={!!banner.enabled} onCheckedChange={(v: boolean) => setBanner({ ...banner, enabled: v })} />
            </div>
          </div>
          <div>
            <Label>Banner Text</Label>
            <Input value={banner.text || ''} onChange={(e) => setBanner({ ...banner, text: e.target.value })} placeholder="🎉 Diwali Sale — 25% off all VPS plans! Use code DIWALI25" />
          </div>
          <div>
            <Label>Link (optional)</Label>
            <Input value={banner.link || ''} onChange={(e) => setBanner({ ...banner, link: e.target.value })} placeholder="https://dlockservices.com/offers" />
          </div>
          {banner.enabled && banner.text && (
            <div className="rounded-lg bg-gradient-to-r from-[#0d3a73] to-[#1560BD] px-4 py-2.5 text-center text-sm font-medium text-white">
              {banner.text}
            </div>
          )}
          <p className="text-xs text-slate-400">Click "Save Settings" at the bottom to apply.</p>
        </CardContent>
      </Card>

      {/* Virtualizor — VPS control panel */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Server className="h-5 w-5 text-[#1560BD]" /> Virtualizor — VPS Controls</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
            <div>
              <div className="font-medium text-slate-900">Enable VPS Controls</div>
              <div className="text-xs text-slate-500">ON → customers ke dashboard me Start / Stop / Restart / Power Off / Reinstall / Console buttons live chalein Virtualizor se. OFF → buttons kaam nahi karenge.</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium', virt.enabled ? 'text-emerald-600' : 'text-slate-400')}>{virt.enabled ? 'ON' : 'OFF'}</span>
              <Switch checked={!!virt.enabled} onCheckedChange={(v: boolean) => setVirt({ ...virt, enabled: v })} />
            </div>
          </div>
          <div>
            <Label>API URL (with port)</Label>
            <Input value={virt.apiUrl} onChange={(e) => setVirt({ ...virt, apiUrl: e.target.value })} placeholder="https://your-server-ip:4085" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>API Key</Label>
              <Input value={virt.apiKey} onChange={(e) => setVirt({ ...virt, apiKey: e.target.value })} placeholder="Virtualizor admin API key" />
            </div>
            <div>
              <Label>API Password {virt.apiPassSet && <span className="text-[11px] text-emerald-600">(saved)</span>}</Label>
              <div className="relative">
                <Input type={showVirtPass ? 'text' : 'password'} value={virt.apiPass} onChange={(e) => setVirt({ ...virt, apiPass: e.target.value })} placeholder="Virtualizor admin API password" className="pr-10" />
                <button type="button" onClick={() => setShowVirtPass((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  {showVirtPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">VPS ko order ke <b>IP</b> se dhoondha jaata hai. Save karo, phir "Test Connection".</p>
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" onClick={runVirtTest} disabled={testingVirt || savingVirt}>
              {testingVirt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
              Test Connection
            </Button>
            <Button type="button" className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={saveVirtualizor} disabled={savingVirt}>
              {savingVirt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Virtualizor Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateway */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-5 w-5 text-[#1560BD]" /> Payment Gateway</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* enable toggle */}
          <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-3.5">
            <div>
              <div className="font-medium text-slate-900">Online Payments</div>
              <div className="text-xs text-slate-500">
                ON → customers pay online through the selected gateway before the order is placed. OFF → orders are placed directly (marked unpaid).
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-medium', payEnabled ? 'text-emerald-600' : 'text-slate-400')}>{payEnabled ? 'ON' : 'OFF'}</span>
              <Switch checked={payEnabled} onCheckedChange={setPayEnabled} />
            </div>
          </div>

          {/* which gateway handles checkout */}
          <div>
            <Label>Active Gateway</Label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                { id: 'cashfree', name: 'Cashfree', desc: 'UPI, cards, net banking, wallets' },
                { id: 'phonepe', name: 'PhonePe', desc: 'PhonePe Standard Checkout' },
              ] as const).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setProvider(g.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors',
                    provider === g.id ? 'border-[#1560BD] bg-blue-50/60 ring-1 ring-[#1560BD]' : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <span className={cn('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', provider === g.id ? 'border-[#1560BD]' : 'border-slate-300')}>
                    {provider === g.id && <span className="h-2 w-2 rounded-full bg-[#1560BD]" />}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-slate-900">{g.name}</span>
                    <span className="block text-xs text-slate-500">{g.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Only the selected gateway is used for new payments. Older transactions stay linked to the gateway that processed them (refunds still work).</p>
          </div>

          {/* ---------- Cashfree credentials ---------- */}
          {provider === 'cashfree' && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Cashfree App ID (Client ID)</Label>
                  <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Your Cashfree App ID" />
                </div>
                <div>
                  <Label>Secret Key {secretSet && <span className="text-[11px] text-emerald-600">(saved)</span>}</Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? 'text' : 'password'}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Your Cashfree Secret Key"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Mode</Label>
                  <select value={payMode} onChange={(e) => setPayMode(e.target.value as any)} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                    <option value="sandbox">Sandbox (Test)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Webhook URL — paste this in your Cashfree dashboard</Label>
                <div className="mt-1 flex gap-2">
                  <Input readOnly value={WEBHOOK_URL} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <Button type="button" variant="outline" onClick={() => copyWebhook(WEBHOOK_URL)} className="shrink-0">
                    {copied === WEBHOOK_URL ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  Cashfree → Developers → Webhooks → add this URL (events: Payment Success/Failed). Also set the return URL to your site's <code className="rounded bg-slate-100 px-1">/payment-status</code>.
                </p>
              </div>
            </>
          )}

          {/* ---------- PhonePe credentials ---------- */}
          {provider === 'phonepe' && (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>API Version</Label>
                  <select
                    value={pp.apiVersion}
                    onChange={(e) => setPp({ ...pp, apiVersion: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="v2">Standard Checkout — Client ID / Secret (current)</option>
                    <option value="v1">Legacy PG — Merchant ID / Salt Key</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">Pick whichever credential set PhonePe gave you in the merchant dashboard.</p>
                </div>
                <div>
                  <Label>Mode</Label>
                  <select
                    value={pp.mode}
                    onChange={(e) => setPp({ ...pp, mode: e.target.value })}
                    className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="sandbox">Sandbox (Test)</option>
                    <option value="production">Production (Live)</option>
                  </select>
                </div>
              </div>

              {pp.apiVersion === 'v2' ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Client ID</Label>
                    <Input value={pp.clientId} onChange={(e) => setPp({ ...pp, clientId: e.target.value })} placeholder="Your PhonePe Client ID" />
                  </div>
                  <div>
                    <Label>Client Secret {pp.clientSecretSet && <span className="text-[11px] text-emerald-600">(saved)</span>}</Label>
                    <div className="relative">
                      <Input
                        type={showPpSecret ? 'text' : 'password'}
                        value={pp.clientSecret}
                        onChange={(e) => setPp({ ...pp, clientSecret: e.target.value })}
                        placeholder="Your PhonePe Client Secret"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPpSecret((v) => !v)}
                        aria-label={showPpSecret ? 'Hide secret' : 'Show secret'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPpSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>Client Version</Label>
                    <Input value={pp.clientVersion} onChange={(e) => setPp({ ...pp, clientVersion: e.target.value })} placeholder="1" />
                    <p className="mt-1 text-xs text-slate-500">Sandbox is usually <code className="rounded bg-slate-100 px-1">1</code>; production uses the value PhonePe issued.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Merchant ID</Label>
                    <Input value={pp.merchantId} onChange={(e) => setPp({ ...pp, merchantId: e.target.value })} placeholder="Your PhonePe Merchant ID" />
                  </div>
                  <div>
                    <Label>Salt Key {pp.saltKeySet && <span className="text-[11px] text-emerald-600">(saved)</span>}</Label>
                    <div className="relative">
                      <Input
                        type={showPpSecret ? 'text' : 'password'}
                        value={pp.saltKey}
                        onChange={(e) => setPp({ ...pp, saltKey: e.target.value })}
                        placeholder="Your PhonePe Salt Key"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPpSecret((v) => !v)}
                        aria-label={showPpSecret ? 'Hide salt key' : 'Show salt key'}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPpSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>Salt Index</Label>
                    <Input value={pp.saltIndex} onChange={(e) => setPp({ ...pp, saltIndex: e.target.value })} placeholder="1" />
                  </div>
                </div>
              )}

              <div>
                <Label>Webhook URL — paste this in your PhonePe dashboard</Label>
                <div className="mt-1 flex gap-2">
                  <Input readOnly value={PHONEPE_WEBHOOK_URL} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                  <Button type="button" variant="outline" onClick={() => copyWebhook(PHONEPE_WEBHOOK_URL)} className="shrink-0">
                    {copied === PHONEPE_WEBHOOK_URL ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  PhonePe dashboard → Developer Settings → Webhooks. If you set a username/password there, enter the same pair below so callbacks can be verified.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>Webhook Username <span className="text-[11px] text-slate-400">(optional)</span></Label>
                  <Input value={pp.webhookUsername} onChange={(e) => setPp({ ...pp, webhookUsername: e.target.value })} placeholder="Same as in the PhonePe dashboard" />
                </div>
                <div>
                  <Label>Webhook Password {pp.webhookPasswordSet && <span className="text-[11px] text-emerald-600">(saved)</span>}</Label>
                  <div className="relative">
                    <Input
                      type={showPpWebhookPass ? 'text' : 'password'}
                      value={pp.webhookPassword}
                      onChange={(e) => setPp({ ...pp, webhookPassword: e.target.value })}
                      placeholder="Same as in the PhonePe dashboard"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPpWebhookPass((v) => !v)}
                      aria-label={showPpWebhookPass ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    >
                      {showPpWebhookPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            {provider === 'phonepe' && (
              <Button type="button" variant="outline" onClick={runPhonePeTest} disabled={testingPp || savingPay}>
                {testingPp ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}
                Test Connection
              </Button>
            )}
            <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={savePayment} disabled={savingPay || testingPp}>
              {savingPay ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Payment Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Social */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Share2 className="h-5 w-5 text-[#1560BD]" /> Social Links</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {['facebook', 'instagram', 'twitter', 'whatsapp', 'youtube', 'linkedin'].map((k) => (
            <div key={k}><Label className="capitalize">{k}</Label><Input value={s(k)} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} placeholder="https://…" /></div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col items-end gap-2 border-t border-slate-200 pt-5">
        <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
        <p className="text-xs text-slate-400">
          Saves <b>General, Controls, Banner &amp; Social</b>. Payment &amp; Virtualizor have their own Save buttons.
        </p>
      </div>
    </div>
  );
}
