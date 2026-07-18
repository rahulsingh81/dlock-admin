import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  FileText, Shield, RotateCcw, Loader2, Save,
  Heading1, Heading2, Heading3, Bold, Italic, List, Link2, Pilcrow, Eye, Pencil,
} from 'lucide-react';
import { getContentPages, updateContentPage } from '@/services/api';

const TABS = [
  { slug: 'terms', label: 'Terms & Conditions', icon: FileText },
  { slug: 'privacy', label: 'Privacy Policy', icon: Shield },
  { slug: 'refund', label: 'Refund Policy', icon: RotateCcw },
];

export default function ContentPages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState('terms');
  const [preview, setPreview] = useState(false);
  const [pages, setPages] = useState<Record<string, { title: string; content: string; updatedAt?: string }>>({});
  const taRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getContentPages();
      const map: any = {};
      (res.pages || []).forEach((p: any) => { map[p.slug] = { title: p.title || '', content: p.content || '', updatedAt: p.updatedAt }; });
      setPages(map);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load pages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const current = pages[active] || { title: '', content: '' };
  const setField = (field: 'title' | 'content', value: string) =>
    setPages((prev) => ({ ...prev, [active]: { ...prev[active], [field]: value } }));

  // Insert / wrap HTML around the current textarea selection
  const applyTag = (before: string, after = '', placeholder = 'text') => {
    const el = taRef.current;
    const val = current.content || '';
    const s = el ? el.selectionStart : val.length;
    const e = el ? el.selectionEnd : val.length;
    const selected = val.slice(s, e) || placeholder;
    const next = val.slice(0, s) + before + selected + after + val.slice(e);
    setField('content', next);
    setTimeout(() => {
      if (!el) return;
      el.focus();
      const pos = s + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const tools = [
    { icon: Heading1, title: 'Heading 1', fn: () => applyTag('<h1>', '</h1>\n', 'Heading') },
    { icon: Heading2, title: 'Heading 2', fn: () => applyTag('<h2>', '</h2>\n', 'Heading') },
    { icon: Heading3, title: 'Heading 3', fn: () => applyTag('<h3>', '</h3>\n', 'Heading') },
    { icon: Pilcrow, title: 'Paragraph', fn: () => applyTag('<p>', '</p>\n', 'Paragraph text') },
    { icon: Bold, title: 'Bold', fn: () => applyTag('<strong>', '</strong>', 'bold') },
    { icon: Italic, title: 'Italic', fn: () => applyTag('<em>', '</em>', 'italic') },
    { icon: List, title: 'Bullet list', fn: () => applyTag('<ul>\n  <li>', '</li>\n</ul>\n', 'item') },
    { icon: Link2, title: 'Link', fn: () => applyTag('<a href="https://">', '</a>', 'link text') },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res: any = await updateContentPage(active, { title: current.title, content: current.content });
      setPages((prev) => ({ ...prev, [active]: { ...prev[active], updatedAt: res.page?.updatedAt } }));
      toast({ title: 'Saved', description: `${TABS.find((t) => t.slug === active)?.label} updated` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = active === t.slug;
          return (
            <button
              key={t.slug}
              onClick={() => { setActive(t.slug); setPreview(false); }}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                on ? 'bg-[#1560BD] text-white shadow' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              )}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label>Page Title</Label>
            <Input value={current.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Terms & Conditions" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                <button onClick={() => setPreview(false)} className={cn('flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium', !preview ? 'bg-[#1560BD] text-white' : 'text-slate-600')}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => setPreview(true)} className={cn('flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium', preview ? 'bg-[#1560BD] text-white' : 'text-slate-600')}>
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
              </div>
            </div>

            {!preview ? (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
                  {tools.map((t, i) => {
                    const Icon = t.icon;
                    return (
                      <button key={i} type="button" onClick={t.fn} title={t.title}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-[#1560BD]">
                        <Icon className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
                <Textarea
                  ref={taRef}
                  value={current.content}
                  onChange={(e) => setField('content', e.target.value)}
                  rows={18}
                  placeholder="Write content here. Use the toolbar for headings, bold, lists…"
                  className="rounded-none border-0 font-mono text-sm leading-relaxed focus-visible:ring-0"
                />
              </div>
            ) : (
              <div
                className="content-preview min-h-[420px] rounded-xl border border-slate-200 bg-white p-6"
                dangerouslySetInnerHTML={{ __html: current.content || '<p style="color:#94a3b8">Nothing to preview yet.</p>' }}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {current.updatedAt ? `Last updated: ${new Date(current.updatedAt).toLocaleString()}` : 'Not saved yet'}
            </span>
            <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* preview typography */}
      <style>{`
        .content-preview h1{font-size:1.75rem;font-weight:800;margin:0 0 .6rem;color:#0f1f38;}
        .content-preview h2{font-size:1.35rem;font-weight:700;margin:1rem 0 .5rem;color:#16233c;}
        .content-preview h3{font-size:1.1rem;font-weight:700;margin:.8rem 0 .4rem;color:#16233c;}
        .content-preview p{margin:0 0 .8rem;color:#334155;line-height:1.7;}
        .content-preview ul{margin:0 0 .8rem 1.2rem;list-style:disc;color:#334155;}
        .content-preview li{margin:.2rem 0;}
        .content-preview a{color:#1560BD;text-decoration:underline;}
        .content-preview strong{font-weight:700;}
      `}</style>

      <p className="text-xs text-slate-400">
        Served to the website at <code className="rounded bg-slate-100 px-1">/api/content/terms</code>, <code className="rounded bg-slate-100 px-1">/privacy</code>, <code className="rounded bg-slate-100 px-1">/refund</code>.
      </p>
    </div>
  );
}
