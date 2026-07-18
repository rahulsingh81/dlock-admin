import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, Send, Users2, UserCheck, UserSearch, Sparkles, Search, Loader2, Eye,
} from 'lucide-react';
import { getUsers, sendCampaign } from '@/services/api';
import { useConfirm } from '@/components/confirm-provider';

type Recipients = 'all' | 'customers' | 'selected';

// Same branding used by the real emails (see backend utils/emailTemplate.js)
const LOGO_URL = `${import.meta.env.BASE_URL}logo-dark.png`;
const SITE_URL = 'dlockservices.com';
const COMPANY_EMAIL = 'info@dlockservices.com';
const COMPANY_NAME = 'Dlock Services';

interface UserLite { _id: string; name?: string; email?: string }

const TEMPLATES: { id: string; label: string; emoji: string; subject: string; body: string }[] = [
  {
    id: 'diwali',
    label: 'Diwali Offer',
    emoji: '🪔',
    subject: 'Happy Diwali! 🎇 Special Offer Inside',
    body: `<p>Dear Customer,</p>
<p>Wishing you and your family a very <b>Happy Diwali</b> from all of us at DLock Services! ✨</p>
<p>To celebrate the festival of lights, we're offering <b style="color:#1560BD">25% OFF</b> on all VPS &amp; hosting renewals this week.</p>
<p style="text-align:center;margin:24px 0"><a href="https://dlockservices.com" style="background:#1560BD;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Claim Your Offer</a></p>
<p>Use code <b>DIWALI25</b> at checkout. Offer valid till stocks last.</p>`,
  },
  {
    id: 'republic',
    label: 'Republic Day',
    emoji: '🇮🇳',
    subject: 'Republic Day Special · 26 January 🇮🇳',
    body: `<p>Dear Customer,</p>
<p>Happy <b>Republic Day!</b> 🇮🇳 On this proud occasion, DLock Services brings you a patriotic deal.</p>
<p>Get <b style="color:#1560BD">₹500 OFF</b> on annual plans + free setup.</p>
<p style="text-align:center;margin:24px 0"><a href="https://dlockservices.com" style="background:#1560BD;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">View Plans</a></p>
<p>Offer valid 24–26 January only.</p>`,
  },
  {
    id: 'newyear',
    label: 'New Year',
    emoji: '🎉',
    subject: 'New Year, New Servers! 🎉 Upgrade & Save',
    body: `<p>Dear Customer,</p>
<p>Wishing you a prosperous <b>New Year</b> from DLock Services! 🎊</p>
<p>Start the year strong — upgrade your server and get <b style="color:#1560BD">2 months free</b> on any yearly plan.</p>
<p style="text-align:center;margin:24px 0"><a href="https://dlockservices.com" style="background:#1560BD;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Upgrade Now</a></p>`,
  },
  {
    id: 'offer',
    label: 'Generic Offer',
    emoji: '🏷️',
    subject: 'Limited-Time Offer from DLock Services',
    body: `<p>Dear Customer,</p>
<p>We have a special offer just for you!</p>
<p>Get <b style="color:#1560BD">[YOUR OFFER HERE]</b> — for a limited time only.</p>
<p style="text-align:center;margin:24px 0"><a href="https://dlockservices.com" style="background:#1560BD;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Grab the Deal</a></p>`,
  },
  {
    id: 'blank',
    label: 'Blank',
    emoji: '📝',
    subject: '',
    body: '<p>Dear Customer,</p>\n<p>Write your message here…</p>',
  },
];

const RECIPIENT_OPTS: { key: Recipients; label: string; desc: string; icon: any }[] = [
  { key: 'all', label: 'All Users', desc: 'Everyone registered', icon: Users2 },
  { key: 'customers', label: 'Paying Customers', desc: 'Users with at least one order', icon: UserCheck },
  { key: 'selected', label: 'Selected Customers', desc: 'Pick individuals below', icon: UserSearch },
];

export default function CampaignsPage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState(TEMPLATES[4].body);
  const [recipients, setRecipients] = useState<Recipients>('all');
  const [sending, setSending] = useState(false);

  // user picker
  const [users, setUsers] = useState<UserLite[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (recipients !== 'selected' || users.length) return;
    (async () => {
      try {
        setLoadingUsers(true);
        const res: any = await getUsers({ limit: 500, page: 1 });
        const list = Array.isArray(res) ? res : (res?.items || res?.users || res?.data || []);
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        toast({ title: 'Could not load users', variant: 'destructive' });
      } finally {
        setLoadingUsers(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
  }, [users, search]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setSubject(t.subject);
    setBody(t.body);
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: 'Subject and message required', variant: 'destructive' });
      return;
    }
    if (recipients === 'selected' && selectedIds.length === 0) {
      toast({ title: 'Select at least one customer', variant: 'destructive' });
      return;
    }
    const count = recipients === 'selected' ? `${selectedIds.length}` : recipients === 'all' ? 'ALL' : 'all paying';
    const ok = await confirm({
      title: 'Send campaign?',
      description: `"${subject}" will be emailed to ${count} recipient(s). This cannot be undone.`,
      confirmText: 'Send now',
    });
    if (!ok) return;
    try {
      setSending(true);
      const res = await sendCampaign({ subject, message: body, recipients, userIds: selectedIds });
      toast({ title: 'Campaign sent 🎉', description: `Delivered to ${res?.sent ?? 0} recipient(s).` });
    } catch (err: any) {
      toast({ title: 'Send failed', description: err?.message || 'Try again', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
          <Mail className="h-5 w-5 text-[#1560BD]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Email Campaigns</h1>
          <p className="text-sm text-slate-500">Build an offer email and send it to everyone, your customers, or a chosen few.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Composer */}
        <div className="space-y-6 lg:col-span-2">
          {/* Templates */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base font-semibold text-slate-900">Start from a template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#1560BD] hover:bg-blue-50/50"
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subject + body */}
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold text-slate-900">Message</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Happy Diwali! 25% off this week"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1560BD] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Body (HTML supported)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs leading-relaxed focus:border-[#1560BD] focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-400">Tip: you can use HTML tags like &lt;b&gt;, &lt;a href&gt;, &lt;p&gt;. It's wrapped in a branded template automatically.</p>
              </div>
            </CardContent>
          </Card>

          {/* Live preview */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Eye className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-base font-semibold text-slate-900">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto max-w-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white">
                {/* Logo header (matches real email) */}
                <div className="flex items-center justify-center border-b border-slate-100 bg-white p-6">
                  <img src={LOGO_URL} alt={COMPANY_NAME} className="h-11 w-auto max-w-[220px] object-contain" />
                </div>
                {/* Accent bar */}
                <div className="h-1 bg-gradient-to-r from-[#0d3a73] to-[#1560BD]" />
                {/* Body */}
                <div className="p-6 text-slate-900">
                  <h2 className="mb-3 text-[#0d3a73]">{subject || <span className="text-slate-300">Subject preview…</span>}</h2>
                  <div className="text-sm leading-relaxed text-slate-700 [&_a]:text-[#1560BD]" dangerouslySetInnerHTML={{ __html: body }} />
                </div>
                {/* Footer with company info */}
                <div className="bg-[#0d3a73] p-5 text-center text-xs leading-relaxed text-slate-300">
                  <div className="mb-1 text-sm font-bold text-white">{COMPANY_NAME}</div>
                  <div><a href={`https://${SITE_URL}`} className="text-[#38bdf8] no-underline">{SITE_URL}</a></div>
                  <div><a href={`mailto:${COMPANY_EMAIL}`} className="text-[#38bdf8] no-underline">{COMPANY_EMAIL}</a></div>
                  <div className="mt-2 text-slate-400">© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipients + send */}
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-4">
            <CardHeader><CardTitle className="text-base font-semibold text-slate-900">Recipients</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {RECIPIENT_OPTS.map((r) => {
                  const active = recipients === r.key;
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.key}
                      onClick={() => setRecipients(r.key)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${active ? 'border-[#1560BD] bg-blue-50/50 ring-1 ring-[#1560BD]/20' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-[#1560BD] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">{r.label}</div>
                        <div className="text-xs text-slate-500">{r.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {recipients === 'selected' && (
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search customers…"
                      className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-[#1560BD] focus:outline-none"
                    />
                  </div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{selectedIds.length} selected</span>
                    {selectedIds.length > 0 && <button onClick={() => setSelected({})} className="text-[#1560BD] hover:underline">Clear</button>}
                  </div>
                  <div className="max-h-64 space-y-1 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                    ) : filteredUsers.length === 0 ? (
                      <p className="py-6 text-center text-sm text-slate-400">No customers found.</p>
                    ) : filteredUsers.map((u) => (
                      <label key={u._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={!!selected[u._id]}
                          onChange={(e) => setSelected((s) => ({ ...s, [u._id]: e.target.checked }))}
                          className="h-4 w-4 rounded border-slate-300 text-[#1560BD] focus:ring-[#1560BD]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-800">{u.name || 'Unknown'}</div>
                          <div className="truncate text-xs text-slate-500">{u.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={send}
                disabled={sending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1560BD] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#124f9c] disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'Sending…' : 'Send Campaign'}
              </button>
              <p className="text-center text-xs text-slate-400">Emails send in the background. Large lists may take a moment.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
