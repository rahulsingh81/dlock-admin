import { useEffect, useState, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useConfirm } from '@/components/confirm-provider';
import { listApiKeys, createApiKey, revokeApiKey, deleteApiKey, updateKeyDomains } from '@/services/api';
import {
  KeyRound, Plus, Copy, Check, Trash2, Loader2, ShieldCheck, Terminal,
  FileText, BookOpen, Server as ServerIcon, Globe, Ban, ChevronDown, Network, Lock,
} from 'lucide-react';

// Public base URL of the API (shown in docs + used in examples).
const API_BASE = 'https://dlockservices.com/api/v1';
const COMPANY = {
  name: 'Dlock Services',
  site: 'https://dlockservices.com',
  email: 'info@dlockservices.com',
};

type Method = 'GET' | 'POST';
interface Endpoint {
  method: Method;
  path: string;
  title: string;
  desc: string;
  body?: string;
}

// Operating systems available for reinstall. The `osName` sent to the reinstall
// endpoint MUST be one of these Name values.
const OS_OPTIONS: { name: string; filename: string }[] = [
  { name: 'centos-7.9-x86_64', filename: 'centos-7.9-x86_64.img' },
  { name: 'centos-9.6-x86_64', filename: 'centos-9.6-x86_64.qcow2' },
  { name: 'debian-12.0-x86_64', filename: 'debian-12.0-x86_64.tar.gz' },
  { name: 'ubuntu-20.04-x86_64', filename: 'ubuntu-20.04-x86_64.img' },
  { name: 'ubuntu-22.04-x86_64', filename: 'ubuntu-22.04-x86_64.img' },
  { name: 'ubuntu-24.04-x86_64', filename: 'ubuntu-24.04-x86_64.img' },
  { name: 'windows-2019-scsi-virtio', filename: 'windows-2019-scsi-virtio.qcow2' },
  { name: 'windows-2022-x86_64', filename: 'windows-2022-x86_64.img' },
];

// Single source of truth for the API list — rendered on screen AND in the PDF.
const ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/servers', title: 'List servers', desc: 'Returns all servers you can manage (id, IP, plan, OS, status).' },
  { method: 'GET', path: '/servers/{id}', title: 'Server details', desc: 'Full details of one server plus its live power status (online/offline).' },
  { method: 'POST', path: '/servers/{id}/start', title: 'Start server', desc: 'Power ON the server.' },
  { method: 'POST', path: '/servers/{id}/stop', title: 'Stop server', desc: 'Gracefully stop the server.' },
  { method: 'POST', path: '/servers/{id}/reboot', title: 'Reboot server', desc: 'Restart the server.' },
  { method: 'POST', path: '/servers/{id}/poweroff', title: 'Power off', desc: 'Force power OFF the server.' },
  { method: 'POST', path: '/servers/{id}/reinstall', title: 'Reinstall OS', desc: 'Rebuild the server with a fresh OS. osName must be one of the Operating Systems listed below. A new root password is returned.', body: '{ "osName": "ubuntu-22.04-x86_64" }' },
];

interface SeenDomain { domain: string; count: number; firstSeen: string; lastSeen: string }
interface SeenIp { ip: string; count: number; firstSeen: string; lastSeen: string }
interface KeyItem {
  _id: string;
  name: string;
  masked: string;
  scopes: string[];
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  allowedDomains: string[];
  blockedDomains: string[];
  seenDomains: SeenDomain[];
  allowedIps: string[];
  seenIps: SeenIp[];
}

const methodClass = (m: Method) =>
  m === 'GET' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#1560BD]';

export default function DeveloperPage() {
  const { toast } = useToast();
  const confirm = useConfirm();
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [createDomains, setCreateDomains] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null); // shown ONCE
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await listApiKeys();
      setKeys(res.keys || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load API keys', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const domains = createDomains
        .split(/[\s,]+/)
        .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0])
        .filter(Boolean);
      const res = await createApiKey(name.trim() || 'Developer Key', domains);
      setNewKey(res.key);
      setName('');
      setCreateDomains('');
      toast({ title: 'API key created', description: 'Copy it now — it won’t be shown again.' });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to create key', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (k: KeyItem) => {
    const ok = await confirm({
      title: 'Revoke API key?',
      description: `"${k.name}" will stop working immediately. This cannot be undone.`,
      confirmText: 'Revoke',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await revokeApiKey(k._id);
      toast({ title: 'Revoked', description: `"${k.name}" is now disabled.` });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to revoke', variant: 'destructive' });
    }
  };

  const setDomains = async (k: KeyItem, next: { blockedDomains?: string[]; allowedDomains?: string[]; allowedIps?: string[] }) => {
    try {
      await updateKeyDomains(k._id, next);
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update domains', variant: 'destructive' });
    }
  };

  const blockDomain = (k: KeyItem, domain: string) =>
    setDomains(k, { blockedDomains: [...new Set([...(k.blockedDomains || []), domain])] });

  const unblockDomain = (k: KeyItem, domain: string) =>
    setDomains(k, { blockedDomains: (k.blockedDomains || []).filter((d) => d !== domain) });

  const cleanDomain = (raw: string) =>
    raw.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

  const addAllowed = (k: KeyItem, raw: string) => {
    const d = cleanDomain(raw);
    if (!d) return;
    setDomains(k, { allowedDomains: [...new Set([...(k.allowedDomains || []), d])] });
  };

  const removeAllowed = (k: KeyItem, domain: string) =>
    setDomains(k, { allowedDomains: (k.allowedDomains || []).filter((d) => d !== domain) });

  const addAllowedIp = (k: KeyItem, raw: string) => {
    const ip = raw.trim();
    if (!ip) return;
    setDomains(k, { allowedIps: [...new Set([...(k.allowedIps || []), ip])] });
  };

  const removeAllowedIp = (k: KeyItem, ip: string) =>
    setDomains(k, { allowedIps: (k.allowedIps || []).filter((i) => i !== ip) });

  const handleDelete = async (k: KeyItem) => {
    const ok = await confirm({
      title: 'Delete API key?',
      description: `"${k.name}" will be permanently deleted and removed from the list. This cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteApiKey(k._id);
      toast({ title: 'Deleted', description: `"${k.name}" removed.` });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const copyKey = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  };

  // Build the guide as printable HTML and open the browser print dialog
  // (Save as PDF). Same pattern used by CA Invoices — no extra dependency.
  const downloadPdf = () => {
    const logo = new URL(import.meta.env.BASE_URL + 'logo-dark.png', window.location.origin).href;
    const rows = ENDPOINTS.map(
      (e) => `<tr>
        <td style="white-space:nowrap"><span class="m ${e.method}">${e.method}</span></td>
        <td><code>${e.path}</code></td>
        <td><b>${e.title}</b><br><span style="color:#475569">${e.desc}</span>${e.body ? `<br><code style="color:#0d3a73">body: ${e.body}</code>` : ''}</td>
      </tr>`
    ).join('');

    const osRows = OS_OPTIONS.map(
      (o) => `<tr><td><code>${o.name}</code></td><td style="color:#475569">${o.filename}</td></tr>`
    ).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dlock API Guide</title>
    <style>
      *{box-sizing:border-box} body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;margin:0;padding:32px}
      .head{display:flex;align-items:center;gap:14px;border-bottom:3px solid #1560BD;padding-bottom:16px;margin-bottom:22px}
      .head img{height:42px} h1{font-size:22px;margin:0;color:#0d3a73} .sub{color:#64748b;font-size:12px;margin-top:2px}
      h2{color:#0d3a73;font-size:15px;margin:22px 0 8px;border-left:4px solid #1560BD;padding-left:8px}
      p,li,td{font-size:12.5px;line-height:1.6}
      code{background:#f1f5f9;padding:1px 6px;border-radius:4px;font-family:monospace;font-size:11.5px}
      table{width:100%;border-collapse:collapse;margin-top:8px} td,th{border:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top}
      th{background:#f8fafc;color:#334155;font-size:11px;text-transform:uppercase}
      .m{font-weight:700;font-size:10px;padding:2px 7px;border-radius:5px} .GET{background:#dcfce7;color:#15803d} .POST{background:#dbeafe;color:#1560BD}
      .box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:8px}
      pre{background:#0d3a73;color:#e2e8f0;padding:12px;border-radius:8px;font-size:11px;overflow:auto;white-space:pre-wrap}
      .foot{margin-top:26px;border-top:1px solid #e2e8f0;padding-top:12px;color:#64748b;font-size:11px;text-align:center}
    </style></head><body>
      <div class="head"><img src="${logo}"/><div><h1>Dlock Services — Developer API Guide</h1>
        <div class="sub">v1 · ${COMPANY.site} · ${COMPANY.email}</div></div></div>

      <h2>About</h2>
      <p><b>${COMPANY.name}</b> exposes a simple REST API so you (and your own customers) can manage servers —
      <b>start, stop, reboot, power&nbsp;off and reinstall</b> — directly from your own website or scripts.
      You authenticate with a <b>Dlock API key</b>; our servers talk to the virtualization layer for you, so the
      underlying provider credentials are never exposed.</p>

      <h2>Base URL</h2>
      <div class="box"><code>${API_BASE}</code></div>

      <h2>Authentication</h2>
      <p>Send your API key on every request in the <code>Authorization</code> header:</p>
      <pre>Authorization: Bearer YOUR_API_KEY</pre>
      <p>${newKey ? `Your new key: <code>${newKey}</code>` : 'Generate a key from the Developer page in the Dlock admin panel. The full key is shown only once — store it securely.'}</p>

      <h2>Endpoints</h2>
      <table><thead><tr><th>Method</th><th>Path</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>

      <h2>Operating Systems (for reinstall)</h2>
      <p>When calling <code>/servers/{id}/reinstall</code>, the <code>osName</code> value must be exactly one of the
      <b>Name</b> values below:</p>
      <table><thead><tr><th>Name (use this)</th><th>Filename</th></tr></thead><tbody>${osRows}</tbody></table>

      <h2>Example</h2>
      <pre>curl -X POST ${API_BASE}/servers/SERVER_ID/reboot \\
  -H "Authorization: Bearer YOUR_API_KEY"</pre>

      <h2>Notes</h2>
      <ul>
        <li>Ownership is enforced — a key can only manage servers it owns (admin keys can manage all).</li>
        <li>Each key is issued to one customer and locked to their domain(s) — it will not work from any other website.</li>
        <li>Terminated/expired servers reject actions until renewed.</li>
        <li>Reinstall returns a fresh root password in the response — capture it.</li>
        <li>Keep keys secret. If a key leaks, revoke it from the admin panel and generate a new one.</li>
      </ul>

      <div class="foot">${COMPANY.name} · <a href="${COMPANY.site}">${COMPANY.site.replace(/^https?:\/\//, '')}</a> · ${COMPANY.email}</div>
    </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
    let printed = false;
    const go = () => {
      if (printed) return; printed = true;
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
    iframe.onload = () => setTimeout(go, 400);
    setTimeout(go, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1560BD]/10">
          <KeyRound className="h-5 w-5 text-[#1560BD]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Developer</h1>
          <p className="text-sm text-slate-500">Create API keys and manage servers programmatically with the Dlock API.</p>
        </div>
      </div>

      {/* Freshly created key banner (shown once) */}
      {newKey && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <ShieldCheck className="h-4 w-4" /> Your new API key — copy it now, it won't be shown again
            </div>
            <div className="mt-3 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-sm text-slate-800">{newKey}</code>
              <Button size="sm" variant="outline" onClick={() => copyKey(newKey)}>
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNewKey(null)}>Done</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys */}
      <Card>
        <CardHeader><CardTitle className="text-base font-semibold text-slate-900">API Keys</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="keyname" className="text-sm">Customer name / label</Label>
              <Input id="keyname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Hosting (Rahul)" className="mt-1" />
            </div>
            <div className="flex-1">
              <Label htmlFor="keydomains" className="text-sm">Allowed domain(s)</Label>
              <Input id="keydomains" value={createDomains} onChange={(e) => setCreateDomains(e.target.value)} placeholder="e.g. acme.com, panel.acme.com" className="mt-1" />
            </div>
            <Button onClick={handleCreate} disabled={creating} className="bg-[#1560BD] text-white hover:bg-[#124f9c]">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Generate Key
            </Button>
          </div>
          <p className="-mt-1 text-xs text-slate-400">
            Name the key after the customer you're giving it to. Add their domain(s) to <b>lock</b> the key — only those
            domains can use it, so it's useless if shared. Leave domains empty to allow any (not recommended).
          </p>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : keys.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No API keys yet. Generate one above.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Key</th>
                    <th className="px-4 py-3 text-left">Domains</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Last used</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => {
                    const open = expandedId === k._id;
                    const usedCount = k.seenDomains?.length || 0;
                    const blockedCount = k.blockedDomains?.length || 0;
                    return (
                    <Fragment key={k._id}>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">{k.name}</td>
                      <td className="px-4 py-3"><code className="font-mono text-xs text-slate-600">{k.masked}</code></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedId(open ? null : k._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          {usedCount} domain{usedCount === 1 ? '' : 's'}
                          {blockedCount > 0 && <span className="text-red-500">· {blockedCount} blocked</span>}
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${k.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                          {k.active ? 'Active' : 'Revoked'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString('en-GB') : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {k.active && (
                            <Button size="sm" variant="ghost" className="text-amber-600 hover:bg-amber-50 hover:text-amber-700" title="Revoke (disable)" onClick={() => handleRevoke(k)}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Delete permanently" onClick={() => handleDelete(k)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {open && (
                      <tr className="border-t border-slate-100 bg-slate-50/60">
                        <td colSpan={6} className="px-4 py-4">
                          {/* Allowed domains — the lock */}
                          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
                              <ShieldCheck className="h-3.5 w-3.5" /> Locked to domains
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {(k.allowedDomains || []).length
                                ? 'Only these domains can use this key. Shared elsewhere → rejected.'
                                : 'Not locked — any domain can use this key. Add a domain to lock it.'}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {(k.allowedDomains || []).map((d) => (
                                <span key={d} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#1560BD]">
                                  {d}
                                  <button onClick={() => removeAllowed(k, d)} className="font-bold hover:text-[#0d3a73]">×</button>
                                </span>
                              ))}
                              <input
                                type="text"
                                placeholder="add domain + Enter"
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-[#1560BD]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addAllowed(k, (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                            </div>
                          </div>

                          {/* Locked to IPs — strongest anti-share */}
                          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
                              <Lock className="h-3.5 w-3.5" /> Locked to IP addresses
                            </div>
                            <p className="mt-1 text-xs text-slate-400">
                              {(k.allowedIps || []).length
                                ? 'Only requests from these IPs are accepted — the key is useless from any other machine (can’t be faked).'
                                : 'Not IP-locked. Lock to the customer’s server IP below so the key can’t be shared or used elsewhere.'}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {(k.allowedIps || []).map((ip) => (
                                <span key={ip} className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                                  {ip}
                                  <button onClick={() => removeAllowedIp(k, ip)} className="font-bold hover:text-violet-900">×</button>
                                </span>
                              ))}
                              <input
                                type="text"
                                placeholder="add IP + Enter"
                                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs outline-none focus:border-[#1560BD]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addAllowedIp(k, (e.target as HTMLInputElement).value);
                                    (e.target as HTMLInputElement).value = '';
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Domains using this key</div>
                          {usedCount === 0 ? (
                            <p className="text-sm text-slate-400">No domain has used this key yet. (Browser/website calls are tracked via their address.)</p>
                          ) : (
                            <div className="space-y-1.5">
                              {k.seenDomains.map((d) => {
                                const isBlocked = (k.blockedDomains || []).includes(d.domain);
                                return (
                                  <div key={d.domain} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                    <Globe className="h-4 w-4 text-slate-400" />
                                    <span className={`font-mono text-sm ${isBlocked ? 'text-red-500 line-through' : 'text-slate-800'}`}>{d.domain}</span>
                                    <span className="text-xs text-slate-400">{d.count} call{d.count === 1 ? '' : 's'} · last {new Date(d.lastSeen).toLocaleDateString('en-GB')}</span>
                                    {isBlocked && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Blocked</span>}
                                    <div className="ml-auto">
                                      {isBlocked ? (
                                        <Button size="sm" variant="outline" onClick={() => unblockDomain(k, d.domain)}>Unblock</Button>
                                      ) : (
                                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => blockDomain(k, d.domain)}>
                                          <Ban className="mr-1 h-3.5 w-3.5" /> Block
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Blocked domains that were never "seen" (manually added) */}
                          {(k.blockedDomains || []).filter((b) => !k.seenDomains.some((s) => s.domain === b)).length > 0 && (
                            <div className="mt-3">
                              <div className="mb-1 text-xs font-semibold uppercase text-slate-500">Other blocked domains</div>
                              <div className="flex flex-wrap gap-2">
                                {(k.blockedDomains || []).filter((b) => !k.seenDomains.some((s) => s.domain === b)).map((b) => (
                                  <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                    {b}
                                    <button onClick={() => unblockDomain(k, b)} className="font-bold hover:text-red-800">×</button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* IPs using this key — one-click lock */}
                          <div className="mb-2 mt-4 text-xs font-semibold uppercase text-slate-500">IP addresses using this key</div>
                          {(k.seenIps?.length || 0) === 0 ? (
                            <p className="text-sm text-slate-400">No calls recorded yet. Once the customer calls the API, their server IP appears here to lock.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {k.seenIps.map((s) => {
                                const isLocked = (k.allowedIps || []).includes(s.ip);
                                const lockedAny = (k.allowedIps || []).length > 0;
                                return (
                                  <div key={s.ip} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                    <Network className="h-4 w-4 text-slate-400" />
                                    <span className="font-mono text-sm text-slate-800">{s.ip}</span>
                                    <span className="text-xs text-slate-400">{s.count} call{s.count === 1 ? '' : 's'} · last {new Date(s.lastSeen).toLocaleDateString('en-GB')}</span>
                                    {isLocked && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">Locked</span>}
                                    {lockedAny && !isLocked && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">Blocked (not in lock list)</span>}
                                    <div className="ml-auto">
                                      {isLocked ? (
                                        <Button size="sm" variant="outline" onClick={() => removeAllowedIp(k, s.ip)}>Unlock</Button>
                                      ) : (
                                        <Button size="sm" variant="ghost" className="text-violet-700 hover:bg-violet-50" onClick={() => addAllowedIp(k, s.ip)}>
                                          <Lock className="mr-1 h-3.5 w-3.5" /> Lock to this IP
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                    </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Reference */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <BookOpen className="h-4 w-4 text-slate-500" /> API Reference
          </CardTitle>
          <Button size="sm" variant="outline" onClick={downloadPdf}>
            <FileText className="mr-1.5 h-4 w-4" /> Download PDF Guide
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Base URL + auth */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500"><ServerIcon className="h-3.5 w-3.5" /> Base URL</div>
              <code className="text-sm text-[#0d3a73]">{API_BASE}</code>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500"><ShieldCheck className="h-3.5 w-3.5" /> Auth header</div>
              <code className="text-sm text-[#0d3a73]">Authorization: Bearer YOUR_API_KEY</code>
            </div>
          </div>

          {/* Endpoint list */}
          <div className="overflow-hidden rounded-lg border border-slate-100">
            {ENDPOINTS.map((e, i) => (
              <div key={i} className="flex items-start gap-3 border-b border-slate-100 p-3 last:border-b-0">
                <span className={`mt-0.5 w-14 shrink-0 rounded px-2 py-1 text-center text-[11px] font-bold ${methodClass(e.method)}`}>{e.method}</span>
                <div className="min-w-0 flex-1">
                  <code className="text-sm font-medium text-slate-800">{e.path}</code>
                  <div className="text-xs text-slate-500">{e.title} — {e.desc}</div>
                  {e.body && <code className="mt-1 block text-[11px] text-[#1560BD]">body: {e.body}</code>}
                </div>
              </div>
            ))}
          </div>

          {/* OS options for reinstall */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
              <ServerIcon className="h-3.5 w-3.5" /> Operating systems for reinstall
            </div>
            <p className="mb-2 text-xs text-slate-500">
              Pass one of these <b>Name</b> values as <code className="rounded bg-slate-100 px-1 text-[#1560BD]">osName</code> when reinstalling.
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr><th className="px-4 py-2.5 text-left">Name (use this)</th><th className="px-4 py-2.5 text-left">Filename</th></tr>
                </thead>
                <tbody>
                  {OS_OPTIONS.map((o) => (
                    <tr key={o.name} className="border-t border-slate-100">
                      <td className="px-4 py-2.5"><code className="font-mono text-xs text-[#0d3a73]">{o.name}</code></td>
                      <td className="px-4 py-2.5 text-slate-500">{o.filename}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Example */}
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500"><Terminal className="h-3.5 w-3.5" /> Example</div>
            <pre className="overflow-x-auto rounded-lg bg-[#0d3a73] p-3 text-xs leading-relaxed text-slate-100">{`curl -X POST ${API_BASE}/servers/SERVER_ID/reboot \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
