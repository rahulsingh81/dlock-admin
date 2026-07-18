import { useEffect, useState } from 'react';
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
import { Ticket, CheckCircle2, Search, Plus, Edit, Trash2, Loader2, Save, BarChart3 } from 'lucide-react';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, getUsers, getCouponAnalytics } from '@/services/api';
import { useTableBulk } from '@/hooks/use-table-bulk';
import { BulkBar, SelectCheck } from '@/components/bulk-bar';

const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No expiry';
const emptyForm = { code: '', description: '', discountType: 'percent', discountValue: '', maxDiscount: '', minOrder: '', usageLimit: '', validDays: '', expiresAt: '', assignedUser: '', active: true };

export default function CouponPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modal, setModal] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res: any = await getCoupons({ page, limit: 10, search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined });
      setItems(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
      setStats({ total: res.total || 0, active: res.active || 0 });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load coupons', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const { bulk, deleting, onDelete } = useTableBulk(items, { noun: 'coupon', deleteOne: deleteCoupon, reload: load });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, search, statusFilter]);

  // Coupon usage analytics
  const [analytics, setAnalytics] = useState<{ items: any[]; totals: { uses: number; discount: number } }>({ items: [], totals: { uses: 0, discount: 0 } });
  useEffect(() => {
    (async () => {
      try { const res: any = await getCouponAnalytics(); setAnalytics({ items: res.items || [], totals: res.totals || { uses: 0, discount: 0 } }); } catch { /* non-blocking */ }
    })();
  }, []);

  // Load users once for the "assign to user" dropdown
  useEffect(() => {
    (async () => {
      try {
        const res: any = await getUsers({ page: 1, limit: 1000 });
        setUsers(res.users || res.items || []);
      } catch { /* non-blocking */ }
    })();
  }, []);

  const openModal = (type: string, c?: any) => {
    setModal(type);
    if (type === 'add') { setForm(emptyForm); setSelected(null); }
    else if (c) {
      setSelected(c);
      if (type === 'edit') setForm({
        code: c.code, description: c.description || '', discountType: c.discountType, discountValue: c.discountValue,
        maxDiscount: c.maxDiscount || '', minOrder: c.minOrder || '', usageLimit: c.usageLimit || '',
        validDays: c.validDays || '',
        expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : '',
        assignedUser: c.assignedUser?._id || c.assignedUser || '',
        active: c.active,
      });
    }
  };
  const closeModal = () => { setModal(null); setSelected(null); setForm(emptyForm); };
  const setF = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.code || form.discountValue === '') { toast({ title: 'Missing', description: 'Code and discount required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (modal === 'add') { await createCoupon(form); toast({ title: 'Created', description: 'Coupon created' }); }
      else if (modal === 'edit' && selected) { await updateCoupon(selected._id, form); toast({ title: 'Updated', description: 'Coupon updated' }); }
      load(); closeModal();
    } catch (err: any) { toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!selected) return;
    try { await deleteCoupon(selected._id); toast({ title: 'Deleted' }); load(); closeModal(); }
    catch (err: any) { toast({ title: 'Error', description: err.message || 'Failed', variant: 'destructive' }); }
  };

  const discLabel = (c: any) => c.discountType === 'percent' ? `${c.discountValue}%${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}` : `₹${c.discountValue}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1560BD]"><Ticket className="h-5 w-5" /></div><div><div className="text-xl font-bold tabular-nums text-slate-900">{stats.total}</div><div className="text-xs font-medium text-slate-500">Total Coupons</div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div><div><div className="text-xl font-bold tabular-nums text-slate-900">{stats.active}</div><div className="text-xs font-medium text-slate-500">Active</div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><BarChart3 className="h-5 w-5" /></div><div><div className="text-xl font-bold tabular-nums text-slate-900">{analytics.totals.uses}</div><div className="text-xs font-medium text-slate-500">Total Redemptions</div></div></CardContent></Card>
        <Card className="card-hover"><CardContent className="flex items-center gap-3 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Ticket className="h-5 w-5" /></div><div><div className="text-xl font-bold tabular-nums text-slate-900">₹{analytics.totals.discount.toLocaleString('en-IN')}</div><div className="text-xs font-medium text-slate-500">Total Discount Given</div></div></CardContent></Card>
      </div>

      {/* Coupon usage analytics */}
      {analytics.items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><BarChart3 className="h-4 w-4 text-[#1560BD]" /> Coupon Usage</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase text-slate-400">
                  <th className="py-2 pr-4">Coupon</th><th className="py-2 pr-4">Redemptions</th><th className="py-2">Total Discount</th>
                </tr></thead>
                <tbody>
                  {analytics.items.map((a) => (
                    <tr key={a.code} className="border-t border-slate-100">
                      <td className="py-2 pr-4 font-mono font-semibold text-slate-800">{a.code}</td>
                      <td className="py-2 pr-4 tabular-nums text-slate-700">{a.uses}</td>
                      <td className="py-2 tabular-nums font-semibold text-emerald-600">₹{Number(a.totalDiscount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search coupon code..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
          </Select>
          <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={() => openModal('add')}><Plus className="mr-2 h-4 w-4" /> New Coupon</Button>
        </CardContent>
      </Card>

      <BulkBar count={bulk.count} onClear={bulk.clear} onDelete={onDelete} deleting={deleting} noun="coupon" />

      <Card>
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="px-4 py-3.5 w-10"><SelectCheck ariaLabel="Select all coupons" checked={bulk.allSelected} indeterminate={bulk.someSelected} onChange={bulk.toggleAll} /></th>
              {['Code', 'Discount', 'Min Order', 'Usage', 'Assigned', 'Expiry', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-300" /></td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-500">No coupons found</td></tr>
              ) : items.map((c) => (
                <tr key={c._id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-4"><SelectCheck ariaLabel="Select coupon" checked={bulk.selected.has(c._id)} onChange={() => bulk.toggle(c._id)} /></td>
                  <td className="px-6 py-4"><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-sm font-bold text-slate-800">{c.code}</span></td>
                  <td className="px-6 py-4 font-medium text-slate-900">{discLabel(c)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{c.minOrder ? `₹${c.minOrder}` : '—'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 tabular-nums">{c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ' / ∞'}</td>
                  <td className="px-6 py-4 text-xs">
                    {c.assignedUser ? (
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 font-medium text-[#1560BD]" title={c.assignedUser.email}>{c.assignedUser.name || c.assignedUser.email}</span>
                    ) : (
                      <span className="text-slate-400">Any user</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{fmtDate(c.expiresAt)}</td>
                  <td className="px-6 py-4"><span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>{c.active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openModal('edit', c)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => openModal('delete', c)} title="Delete" className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationComponent currentPage={page} totalPages={totalPages} totalItems={total} itemsPerPage={10} onPageChange={setPage} itemType="coupons" />
      </Card>

      <Sheet open={modal !== null} onOpenChange={closeModal}>
        <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{modal === 'add' ? 'New Coupon' : modal === 'edit' ? 'Edit Coupon' : 'Delete Coupon'}</SheetTitle>
            <SheetDescription>{modal === 'delete' ? 'This cannot be undone.' : 'Discount coupon settings'}</SheetDescription>
          </SheetHeader>

          {(modal === 'add' || modal === 'edit') && (
            <div className="mt-4 space-y-4">
              <div><Label>Coupon Code *</Label><Input value={form.code} onChange={(e) => setF('code', e.target.value.toUpperCase())} placeholder="WELCOME10" className="font-mono uppercase" /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setF('description', e.target.value)} placeholder="e.g. 10% off for new users" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={form.discountType} onValueChange={(v) => setF('discountType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="percent">Percent (%)</SelectItem><SelectItem value="flat">Flat (₹)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Value *</Label><Input type="number" value={form.discountValue} onChange={(e) => setF('discountValue', e.target.value)} placeholder={form.discountType === 'percent' ? '10' : '500'} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {form.discountType === 'percent' && (
                  <div><Label>Max Discount (₹)</Label><Input type="number" value={form.maxDiscount} onChange={(e) => setF('maxDiscount', e.target.value)} placeholder="0 = no cap" /></div>
                )}
                <div><Label>Min Order (₹)</Label><Input type="number" value={form.minOrder} onChange={(e) => setF('minOrder', e.target.value)} placeholder="0" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Usage Limit</Label><Input type="number" value={form.usageLimit} onChange={(e) => setF('usageLimit', e.target.value)} placeholder="0 = unlimited" /></div>
                <div>
                  <Label>Valid For (days)</Label>
                  <Input type="number" value={form.validDays} onChange={(e) => { setF('validDays', e.target.value); if (e.target.value) setF('expiresAt', ''); }} placeholder="e.g. 7" disabled={!!form.expiresAt} />
                </div>
              </div>
              <div>
                <Label>Expiry Date (exact)</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => { setF('expiresAt', e.target.value); if (e.target.value) setF('validDays', ''); }} disabled={!!form.validDays} />
                <p className="mt-1 text-xs text-slate-400">Set either "valid for days" (counts from today) or an exact expiry date.</p>
              </div>
              <div>
                <Label>Assign to User</Label>
                <Select value={form.assignedUser || 'any'} onValueChange={(v) => setF('assignedUser', v === 'any' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Any user" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="any">Any user (public)</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u._id} value={u._id}>{u.name} — {u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-slate-400">If set, only this user can redeem the coupon.</p>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.active ? 'active' : 'inactive'} onValueChange={(v) => setF('active', v === 'active')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          )}

          {modal === 'delete' && selected && (
            <div className="mt-4 py-4 text-center"><p>Delete this coupon?</p><p className="mt-2 font-mono font-semibold">{selected.code}</p></div>
          )}

          <SheetFooter className="mt-6 gap-2 border-t pt-4">
            {(modal === 'add' || modal === 'edit') && (
              <>
                <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
                <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {modal === 'add' ? 'Create' : 'Update'}
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
