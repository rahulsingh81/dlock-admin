import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { PaginationComponent } from '@/components/PaginationComponent';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Code2, Layers, Search, Plus, Edit, Trash2, Loader2, Save, X,
  ExternalLink, Star, ImagePlus, Rocket, Camera, Check,
  Workflow, Plug, Target, Zap, GitBranch, BarChart3, Award, TrendingUp,
} from 'lucide-react';
import { getPortfolios, createPortfolio, updatePortfolio, deletePortfolio, uploadImage } from '@/services/api';

const CATEGORIES = ['Business', 'Corporate', 'E-commerce', 'IoT', 'Fitness', 'SaaS', 'Portfolio', 'Landing Page', 'Web App'];

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

// Live screenshot via WordPress mShots — capture the site at 5 widths for a gallery.
const shot = (url: string, w: number, h: number) =>
  `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=${w}&h=${h}`;
const autoGallery = (url: string) =>
  url ? [shot(url, 1280, 800), shot(url, 1024, 700), shot(url, 800, 600), shot(url, 640, 900), shot(url, 1440, 820)] : [];

// Development pricing tiers shown on the website (starting ₹19,999).
const TIERS = [
  { name: 'Basic Website', price: 19999, popular: false, features: ['Up to 5 pages', 'Fully responsive', 'Contact form', 'Basic SEO', 'Delivery in 7 days'] },
  { name: 'Business Website', price: 34999, popular: true, features: ['Up to 12 pages', 'CMS / Blog', 'Advanced SEO', 'Analytics setup', 'Delivery in 14 days'] },
  { name: 'E-commerce / Web App', price: 64999, popular: false, features: ['Dynamic & database-driven', 'Payment gateway', 'Admin panel', 'User accounts', 'Delivery in 3–4 weeks'] },
];
const STARTING_PRICE = 19999;

// CRM services offering
const CRM_FEATURES = [
  { icon: Plug, title: 'HubSpot Integration', desc: 'Complete HubSpot setup — custom properties, pipelines, workflows and website/ads sync tailored to your sales process.' },
  { icon: Plug, title: 'Zoho CRM Integration', desc: 'Zoho CRM, Bigin & Zoho One implementation with modules, blueprints, and end-to-end automation.' },
  { icon: Target, title: 'Lead Capture Everywhere', desc: 'Website forms, landing pages, Meta & Google ads, WhatsApp and chat — every lead flows straight into your CRM.' },
  { icon: Zap, title: 'Marketing Automation', desc: 'Automated email & WhatsApp sequences, lead scoring, task assignment and smart follow-up reminders.' },
  { icon: GitBranch, title: 'Lead → Deal Pipeline', desc: 'Auto-convert qualified leads into deals, move them through stages, and never lose a follow-up again.' },
  { icon: BarChart3, title: 'Reports & Dashboards', desc: 'Real-time sales dashboards, revenue forecasting and team-performance analytics you can act on.' },
];
const CRM_PLATFORMS = ['HubSpot', 'Zoho CRM', 'Zoho Bigin', 'Google Ads', 'Meta Ads', 'WhatsApp API'];

const emptyForm = {
  title: '', category: 'Business', url: '', images: [] as string[], description: '',
  techStack: '', featured: false, status: 'active',
};

const StatCard = ({ icon: Icon, label, value, tone }: any) => (
  <Card className="card-hover">
    <CardContent className="flex items-center gap-3 p-4">
      <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold tabular-nums text-slate-900">{value}</div>
        <div className="truncate text-xs font-medium text-slate-500">{label}</div>
      </div>
    </CardContent>
  </Card>
);

// One project: big main screenshot + 4 small thumbnails below (click to swap)
const ProjectCard = ({ p, onEdit, onDelete }: any) => {
  const gallery: string[] = (p.images && p.images.length ? p.images : [p.image || shot(p.url, 1280, 800)]).filter(Boolean);
  const [active, setActive] = useState(0);
  const main = gallery[active] || gallery[0];

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {/* Main big screenshot */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {main ? (
          <img src={main} alt={p.title} loading="lazy" className="h-full w-full object-cover object-top" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300"><Code2 className="h-10 w-10" /></div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#1560BD] backdrop-blur">{p.category}</span>
          {p.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-semibold text-amber-950 backdrop-blur"><Star className="h-3 w-3 fill-amber-950" /> Featured</span>}
        </div>
        {p.status === 'inactive' && <span className="absolute right-3 top-3 rounded-full bg-red-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">Hidden</span>}
      </div>

      {/* 4 small thumbnails */}
      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-1.5 p-1.5">
          {gallery.slice(1, 5).map((g, i) => {
            const idx = i + 1;
            return (
              <button
                key={idx}
                onMouseEnter={() => setActive(idx)}
                onClick={() => setActive(idx)}
                className={cn('relative aspect-[4/3] overflow-hidden rounded-md border-2 bg-slate-100 transition', active === idx ? 'border-[#1560BD]' : 'border-transparent hover:border-slate-300')}
              >
                <img src={g} alt={`${p.title} ${idx}`} loading="lazy" className="h-full w-full object-cover object-top" />
              </button>
            );
          })}
        </div>
      )}

      <CardContent className="space-y-3 p-4 pt-2">
        <h3 className="truncate font-semibold text-slate-900">{p.title}</h3>
        {p.description && <p className="line-clamp-2 text-xs text-slate-500">{p.description}</p>}
        {p.techStack?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.techStack.slice(0, 4).map((t: string) => (
              <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          {p.url && (
            <a href={p.url} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <ExternalLink className="h-3.5 w-3.5" /> Visit
            </a>
          )}
          <button onClick={() => onEdit(p)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
          <button onClick={() => onDelete(p)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function PortfolioPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, featured: 0, categories: [] as string[] });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getPortfolios({
        page, limit: 12,
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
      });
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
      setStats({ total: res.total || 0, active: res.active || 0, featured: res.featured || 0, categories: res.categories || [] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load projects', variant: 'destructive' });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, search, statusFilter, categoryFilter]);

  const openModal = (type: string, p?: any) => {
    setModal(type);
    if (type === 'add') { setForm(emptyForm); setSelected(null); }
    else if (p) {
      setSelected(p);
      if (type === 'edit') setForm({
        title: p.title, category: p.category || 'Business', url: p.url || '',
        images: p.images && p.images.length ? p.images : (p.image ? [p.image] : []),
        description: p.description || '', techStack: (p.techStack || []).join(', '),
        featured: !!p.featured, status: p.status || 'active',
      });
    }
  };
  const closeModal = () => { setModal(null); setSelected(null); setForm(emptyForm); };
  const setF = (k: string, v: any) => setForm((prev: any) => ({ ...prev, [k]: v }));

  const handleUpload = async (files?: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const room = 5 - form.images.length;
      const chosen = Array.from(files).slice(0, Math.max(0, room));
      const urls: string[] = [];
      for (const file of chosen) {
        const dataUrl: string = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        const res: any = await uploadImage(dataUrl, file.name);
        urls.push(res.url);
      }
      setF('images', [...form.images, ...urls].slice(0, 5));
      toast({ title: 'Uploaded', description: `${urls.length} screenshot(s) added` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message || 'Try again', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const autoCapture = () => {
    if (!form.url) { toast({ title: 'Add a URL first', description: 'Enter the website URL to auto-capture', variant: 'destructive' }); return; }
    setF('images', autoGallery(form.url));
    toast({ title: 'Captured', description: '5 screenshots generated from the URL' });
  };

  const removeImage = (i: number) => setF('images', form.images.filter((_: string, idx: number) => idx !== i));

  const handleSave = async () => {
    if (!form.title) { toast({ title: 'Missing', description: 'Project title required', variant: 'destructive' }); return; }
    // if no images uploaded but a URL exists, auto-capture on save
    const payload = { ...form, images: form.images.length ? form.images : autoGallery(form.url) };
    setSaving(true);
    try {
      if (modal === 'add') { await createPortfolio(payload); toast({ title: 'Added', description: 'Project added' }); }
      else if (modal === 'edit' && selected) { await updatePortfolio(selected._id, payload); toast({ title: 'Updated', description: 'Project updated' }); }
      load(); closeModal();
    } catch (err: any) { toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!selected) return;
    try { await deletePortfolio(selected._id); toast({ title: 'Deleted' }); load(); closeModal(); }
    catch (err: any) { toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d3a73] via-[#124f9c] to-[#1560BD] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Rocket className="h-3.5 w-3.5" /> Web Development
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">Websites we build 🚀</h1>
            <p className="mt-1 max-w-xl text-sm text-blue-100">
              OneStepIoT, FitScope, MatrixStreamline, DC Keepers &amp; more. Custom websites starting at <span className="font-semibold text-white">{inr(STARTING_PRICE)}</span>.
            </p>
          </div>
          <Button onClick={() => openModal('add')} className="w-fit bg-white text-[#0d3a73] hover:bg-blue-50">
            <Plus className="mr-2 h-4 w-4" /> Add Project
          </Button>
        </div>
      </div>

      {/* Pricing tiers */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-slate-900">Development Pricing</h2>
          <span className="text-sm text-slate-500">Starting from <span className="font-semibold text-[#1560BD]">{inr(STARTING_PRICE)}</span></span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TIERS.map((t) => (
            <Card key={t.name} className={cn('relative overflow-hidden', t.popular && 'ring-2 ring-[#1560BD]')}>
              {t.popular && <span className="absolute right-0 top-0 rounded-bl-lg bg-[#1560BD] px-3 py-1 text-[11px] font-semibold text-white">Popular</span>}
              <CardContent className="p-5">
                <p className="text-sm font-semibold text-slate-500">{t.name}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{inr(t.price)}<span className="text-sm font-normal text-slate-400"> onwards</span></p>
                <ul className="mt-4 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CRM Solutions */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#1560BD]/5 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                <Award className="h-3.5 w-3.5" /> 5+ Years CRM Experience
              </div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">CRM Solutions &amp; Automation</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Grow your business with a CRM that actually works for you. From <span className="font-semibold text-slate-800">lead capture to closed deals</span>,
                we design, integrate and automate CRMs that turn scattered contacts into a predictable sales pipeline.
                With <span className="font-semibold text-slate-800">5+ years of hands-on experience</span> across <span className="font-semibold text-[#ff7a59]">HubSpot</span> and
                <span className="font-semibold text-[#e42527]"> Zoho</span>, we connect your website, ads, email and WhatsApp into one system — so
                <span className="font-semibold text-slate-800"> no lead ever slips through</span>.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-[#1560BD]"><TrendingUp className="h-4 w-4" />5+</div>
                <div className="text-[11px] font-medium text-slate-500">Years Exp.</div>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-600"><Target className="h-4 w-4" />100%</div>
                <div className="text-[11px] font-medium text-slate-500">Lead Capture</div>
              </div>
            </div>
          </div>

          {/* Feature grid */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CRM_FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:border-[#1560BD]/30 hover:bg-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1560BD]/10 text-[#1560BD]">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Platforms */}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Workflow className="h-3.5 w-3.5" /> Platforms we work with
            </span>
            {CRM_PLATFORMS.map((p) => (
              <span key={p} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Code2} label="Total Projects" value={stats.total} tone="bg-blue-50 text-[#1560BD]" />
        <StatCard icon={Star} label="Featured" value={stats.featured} tone="bg-amber-50 text-amber-600" />
        <StatCard icon={Layers} label="Categories" value={stats.categories.length} tone="bg-violet-50 text-violet-600" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search projects..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setPage(1); setCategoryFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#1560BD]"><Code2 className="h-7 w-7" /></div>
          <div>
            <p className="font-semibold text-slate-900">No projects yet</p>
            <p className="text-sm text-slate-500">Add your first development project to showcase.</p>
          </div>
          <Button onClick={() => openModal('add')} className="bg-[#1560BD] text-white hover:bg-[#124f9c]"><Plus className="mr-2 h-4 w-4" /> Add Project</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {items.map((p) => <ProjectCard key={p._id} p={p} onEdit={(x: any) => openModal('edit', x)} onDelete={(x: any) => openModal('delete', x)} />)}
        </div>
      )}

      {items.length > 0 && (
        <PaginationComponent currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={12} onPageChange={setPage} itemType="projects" />
      )}

      {/* Add / Edit / Delete drawer */}
      <Sheet open={modal !== null} onOpenChange={closeModal}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{modal === 'add' ? 'Add Project' : modal === 'edit' ? 'Edit Project' : 'Delete Project'}</SheetTitle>
            <SheetDescription>{modal === 'delete' ? 'This cannot be undone.' : 'Development project / portfolio item'}</SheetDescription>
          </SheetHeader>

          {(modal === 'add' || modal === 'edit') && (
            <div className="mt-4 space-y-4">
              {/* Screenshots gallery (up to 5) */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label>Screenshots ({form.images.length}/5)</Label>
                  <button type="button" onClick={autoCapture} className="inline-flex items-center gap-1 text-xs font-medium text-[#1560BD] hover:underline">
                    <Camera className="h-3.5 w-3.5" /> Auto-capture from URL
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {form.images.map((img: string, i: number) => (
                    <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      <img src={img} alt={`shot ${i + 1}`} className="h-full w-full object-cover object-top" />
                      {i === 0 && <span className="absolute left-1 top-1 rounded bg-[#1560BD] px-1.5 py-0.5 text-[10px] font-semibold text-white">Main</span>}
                      <button type="button" onClick={() => removeImage(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                      className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#1560BD] hover:text-[#1560BD]">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                      <span className="text-[11px]">Upload</span>
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                <p className="mt-1 text-[11px] text-slate-400">First image = big main shot; rest show as small thumbnails. Or auto-capture from the live URL.</p>
              </div>

              <div><Label>Project Title *</Label><Input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="e.g. OneStepIoT" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setF('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setF('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Website URL</Label><Input value={form.url} onChange={(e) => setF('url', e.target.value)} placeholder="https://onestepiot.com" /></div>
              <div><Label>Tech Stack (comma separated)</Label><Input value={form.techStack} onChange={(e) => setF('techStack', e.target.value)} placeholder="React, Next.js, Node, MongoDB" /></div>
              <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setF('description', e.target.value)} placeholder="Short description of the project" /></div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Star className="h-4 w-4 text-amber-500" /> Featured project</div>
                <Switch checked={form.featured} onCheckedChange={(v: boolean) => setF('featured', v)} />
              </div>
            </div>
          )}

          {modal === 'delete' && selected && (
            <div className="mt-4 py-4 text-center"><p>Delete this project?</p><p className="mt-2 font-semibold">{selected.title}</p></div>
          )}

          <SheetFooter className="mt-6 gap-2 border-t pt-4">
            {(modal === 'add' || modal === 'edit') && (
              <>
                <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {modal === 'add' ? 'Add Project' : 'Update'}
                </Button>
              </>
            )}
            {modal === 'delete' && (
              <>
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
