import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { PaginationComponent } from '@/components/PaginationComponent';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Newspaper, FileText, CheckCircle2, Search, Plus, Eye, Edit, Trash2, Loader2, Save,
  Heading1, Heading2, Heading3, Bold, Italic, List, Link2, Pilcrow, Upload, ImageIcon, X,
} from 'lucide-react';
import { getBlogs, createBlog, updateBlog, deleteBlog, uploadImage } from '@/services/api';
import { useTableBulk } from '@/hooks/use-table-bulk';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';

const TONES: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-[#1560BD]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
};

const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const StatsCard = ({ title, value, icon: Icon, tone }: { title: string; value: number; icon: any; tone: keyof typeof TONES }) => {
  const t = TONES[tone];
  return (
    <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.bg}`}><Icon className={`h-5 w-5 ${t.text}`} /></div>
      <div className="min-w-0"><div className="text-xl font-bold tabular-nums text-slate-900">{value}</div><div className="truncate text-xs font-medium text-slate-500">{title}</div></div>
    </CardContent></Card>
  );
};

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', coverImage: '', author: 'DLock Services',
  tags: '', metaTitle: '', metaDescription: '', metaKeywords: '', status: 'draft',
};

export default function BlogsPage() {
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage, setPerPage] = useState(10);

  const [modal, setModal] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleUpload = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Invalid file', description: 'Please choose an image', variant: 'destructive' }); return; }
    if (file.size > 10 * 1024 * 1024) { toast({ title: 'Too large', description: 'Max 10MB', variant: 'destructive' }); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const res: any = await uploadImage(reader.result as string, file.name);
        setForm((p: any) => ({ ...p, coverImage: res.url }));
        toast({ title: 'Uploaded', description: 'Cover image uploaded' });
      } catch (err: any) {
        toast({ title: 'Upload failed', description: err.message || 'Try again', variant: 'destructive' });
      } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getBlogs({ page, limit: perPage, status: statusFilter !== 'all' ? statusFilter : undefined, search: search || undefined });
      setBlogs(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
      setStats({ total: res.total || 0, published: res.published || 0, drafts: res.drafts || 0 });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load blogs', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const { bulk, deleting, onDelete } = useTableBulk(blogs, { noun: 'blog', deleteOne: deleteBlog, reload: load });

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, statusFilter, search, perPage]);

  const openModal = (type: string, blog?: any) => {
    setModal(type);
    if (type === 'add') { setForm(emptyForm); setSelected(null); }
    else if (blog) {
      setSelected(blog);
      if (type === 'edit') setForm({
        title: blog.title || '', slug: blog.slug || '', excerpt: blog.excerpt || '', content: blog.content || '',
        coverImage: blog.coverImage || '', author: blog.author || 'DLock Services',
        tags: (blog.tags || []).join(', '), metaTitle: blog.metaTitle || '', metaDescription: blog.metaDescription || '',
        metaKeywords: blog.metaKeywords || '', status: blog.status || 'draft',
      });
    }
  };
  const closeModal = () => { setModal(null); setSelected(null); setForm(emptyForm); };
  const setF = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const applyTag = (before: string, after = '', ph = 'text') => {
    const el = taRef.current; const val = form.content || '';
    const s = el ? el.selectionStart : val.length; const e = el ? el.selectionEnd : val.length;
    const sel = val.slice(s, e) || ph;
    setF('content', val.slice(0, s) + before + sel + after + val.slice(e));
    setTimeout(() => { if (el) { el.focus(); const pos = s + before.length + sel.length + after.length; el.setSelectionRange(pos, pos); } }, 0);
  };
  const tools = [
    { icon: Heading1, t: 'H1', fn: () => applyTag('<h1>', '</h1>\n', 'Heading') },
    { icon: Heading2, t: 'H2', fn: () => applyTag('<h2>', '</h2>\n', 'Heading') },
    { icon: Heading3, t: 'H3', fn: () => applyTag('<h3>', '</h3>\n', 'Heading') },
    { icon: Pilcrow, t: 'P', fn: () => applyTag('<p>', '</p>\n', 'Paragraph') },
    { icon: Bold, t: 'Bold', fn: () => applyTag('<strong>', '</strong>', 'bold') },
    { icon: Italic, t: 'Italic', fn: () => applyTag('<em>', '</em>', 'italic') },
    { icon: List, t: 'List', fn: () => applyTag('<ul>\n  <li>', '</li>\n</ul>\n', 'item') },
    { icon: Link2, t: 'Link', fn: () => applyTag('<a href="https://">', '</a>', 'link') },
  ];

  const handleSave = async () => {
    if (!form.title) { toast({ title: 'Missing title', description: 'Blog title is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (modal === 'add') { await createBlog(form); toast({ title: 'Created', description: 'Blog created' }); }
      else if (modal === 'edit' && selected) { await updateBlog(selected._id, form); toast({ title: 'Updated', description: 'Blog updated' }); }
      load(); closeModal();
    } catch (err: any) { toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!selected) return;
    try { await deleteBlog(selected._id); toast({ title: 'Deleted' }); load(); closeModal(); }
    catch (err: any) { toast({ title: 'Error', description: err.message || 'Failed to delete', variant: 'destructive' }); }
  };

  const keywordCount = (form.metaKeywords || '').split(',').map((k: string) => k.trim()).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Total Blogs" value={stats.total} icon={Newspaper} tone="blue" />
        <StatsCard title="Published" value={stats.published} icon={CheckCircle2} tone="emerald" />
        <StatsCard title="Drafts" value={stats.drafts} icon={FileText} tone="amber" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search blogs / keywords..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="pl-10" />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Rows</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPage(1); setPerPage(Number(v)); }}>
              <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="10">10</SelectItem><SelectItem value="25">25</SelectItem><SelectItem value="50">50</SelectItem></SelectContent>
            </Select>
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent>
          </Select>
          <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={() => openModal('add')}><Plus className="mr-2 h-4 w-4" /> New Blog</Button>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      <BulkBar count={bulk.count} onClear={bulk.clear} onDelete={onDelete} deleting={deleting} noun="blog" />

      {/* Table */}
      <Card>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3.5 w-10"><SelectCheck ariaLabel="Select all blogs" checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} /></th>
              {['Blog', 'Keywords', 'Status', 'Updated', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-300" /></td></tr>
              ) : blogs.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">No blogs found</td></tr>
              ) : blogs.map((b) => (
                <tr key={b._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-4"><SelectCheck ariaLabel="Select blog" checked={bulk.selected.has(b._id)} onChange={() => bulk.toggle(b._id)} /></td>
                  <td className="px-6 py-4">
                    <div className="max-w-sm truncate font-medium text-slate-900">{b.title}</div>
                    <div className="font-mono text-[11px] text-slate-400">/{b.slug}</div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="truncate text-xs text-slate-500">{b.metaKeywords || '—'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize', b.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>{b.status}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{fmtDate(b.updatedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openModal('view', b)} title="Preview" className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-white text-[#1560BD] hover:bg-blue-50"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openModal('edit', b)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => openModal('delete', b)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationComponent currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={perPage} onPageChange={setPage} itemType="blogs" />
      </Card>

      {/* Drawer */}
      <Sheet open={modal !== null} onOpenChange={closeModal}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{modal === 'add' ? 'New Blog' : modal === 'edit' ? 'Edit Blog' : modal === 'view' ? 'Preview' : 'Delete Blog'}</SheetTitle>
            <SheetDescription>
              {modal === 'view' ? 'How this blog looks' : modal === 'delete' ? 'This cannot be undone.' : 'Write your blog + SEO settings'}
            </SheetDescription>
          </SheetHeader>

          {(modal === 'add' || modal === 'edit') && (
            <div className="mt-4 space-y-4">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="Blog title" /></div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setF('slug', e.target.value)} placeholder="auto from title" /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setF('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Cover Image</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input value={form.coverImage} onChange={(e) => setF('coverImage', e.target.value)} placeholder="Paste image URL…" className="flex-1" />
                  <span className="text-xs text-slate-400">or</span>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} disabled={uploading} />
                  </label>
                </div>
                {form.coverImage ? (
                  <div className="relative mt-2 inline-block">
                    <img src={form.coverImage} alt="cover" className="h-28 w-48 rounded-lg border border-slate-200 object-cover" />
                    <button type="button" onClick={() => setF('coverImage', '')} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow" title="Remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex h-28 w-48 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div><Label>Excerpt (short summary)</Label><Textarea value={form.excerpt} onChange={(e) => setF('excerpt', e.target.value)} rows={2} placeholder="1-2 line summary shown in listings" /></div>

              {/* Content editor */}
              <div>
                <Label>Content</Label>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
                    {tools.map((t, i) => { const Icon = t.icon; return (
                      <button key={i} type="button" onClick={t.fn} title={t.t} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-[#1560BD]"><Icon className="h-4 w-4" /></button>
                    ); })}
                  </div>
                  <Textarea ref={taRef} value={form.content} onChange={(e) => setF('content', e.target.value)} rows={12} placeholder="Write blog content (use toolbar for headings, bold, lists)..." className="rounded-none border-0 font-mono text-sm leading-relaxed focus-visible:ring-0" />
                </div>
              </div>

              <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setF('tags', e.target.value)} placeholder="vps, hosting, cloud" /></div>

              {/* SEO */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="text-sm font-semibold text-slate-800">SEO Settings</div>
                <div><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setF('metaTitle', e.target.value)} placeholder="Defaults to blog title" maxLength={70} /><p className="mt-1 text-[11px] text-slate-400">{(form.metaTitle || '').length}/70</p></div>
                <div><Label>Meta Description</Label><Textarea value={form.metaDescription} onChange={(e) => setF('metaDescription', e.target.value)} rows={2} maxLength={160} placeholder="150-160 chars for search results" /><p className="mt-1 text-[11px] text-slate-400">{(form.metaDescription || '').length}/160</p></div>
                <div><Label>Meta Keywords (comma-separated)</Label><Input value={form.metaKeywords} onChange={(e) => setF('metaKeywords', e.target.value)} placeholder="cheap vps, india vps, cloud hosting" /><p className="mt-1 text-[11px] text-slate-400">{keywordCount} keyword(s)</p></div>
              </div>
            </div>
          )}

          {modal === 'view' && selected && (
            <div className="mt-4 space-y-4">
              {selected.coverImage && <img src={selected.coverImage} alt={selected.title} className="w-full rounded-xl object-cover" style={{ maxHeight: 220 }} />}
              <div className="content-preview">
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f1f38' }}>{selected.title}</h1>
                {selected.excerpt && <p style={{ color: '#64748b' }}>{selected.excerpt}</p>}
                <div dangerouslySetInnerHTML={{ __html: selected.content || '' }} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                <div><b>Slug:</b> /{selected.slug}</div>
                <div><b>Keywords:</b> {selected.metaKeywords || '—'}</div>
                <div><b>Meta desc:</b> {selected.metaDescription || '—'}</div>
              </div>
            </div>
          )}

          {modal === 'delete' && selected && (
            <div className="mt-4 py-4 text-center"><p>Delete this blog?</p><p className="mt-2 font-semibold">{selected.title}</p></div>
          )}

          <SheetFooter className="mt-6 gap-2 border-t pt-4">
            {modal === 'view' && <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={closeModal}>Close</Button>}
            {(modal === 'add' || modal === 'edit') && (
              <>
                <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {modal === 'add' ? 'Create Blog' : 'Update Blog'}
                </Button>
              </>
            )}
            {modal === 'delete' && (
              <>
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete Blog</Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <style>{`
        .content-preview h1{font-size:1.6rem;font-weight:800;margin:0 0 .6rem;color:#0f1f38;}
        .content-preview h2{font-size:1.3rem;font-weight:700;margin:1rem 0 .5rem;color:#16233c;}
        .content-preview h3{font-size:1.08rem;font-weight:700;margin:.8rem 0 .4rem;color:#16233c;}
        .content-preview p{margin:0 0 .8rem;color:#334155;line-height:1.7;}
        .content-preview ul{margin:0 0 .8rem 1.2rem;list-style:disc;color:#334155;}
        .content-preview a{color:#1560BD;text-decoration:underline;}
      `}</style>
    </div>
  );
}
