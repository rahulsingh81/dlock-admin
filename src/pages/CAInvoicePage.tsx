import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, FileSpreadsheet, Loader2, Search } from 'lucide-react';
import { getCaReport } from '@/services/api';

const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthLabel = (m: string) => {
  const [y, mm] = m.split('-').map(Number);
  return new Date(y, mm - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const COMPANY = {
  name: 'Dlock Services',
  line: 'Hosting · Cloud · Development',
  email: 'info@dlockservices.com',
  phone: '+91 8503023131',
  gstin: '08XXXXX0000X1ZX',
};

export default function CAInvoicePage() {
  const { toast } = useToast();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [mode, setMode] = useState<'month' | 'range'>('month'); // month picker OR custom date range
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const load = async () => {
    if (mode === 'range' && (!from || !to)) {
      toast({ title: 'Pick a date range', description: 'Please select both From and To dates.', variant: 'destructive' });
      return;
    }
    if (mode === 'range' && from > to) {
      toast({ title: 'Invalid range', description: '“From” date must be before “To” date.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res: any = mode === 'range'
        ? await getCaReport(month, status, from, to)
        : await getCaReport(month, status);
      setReport(res);
      if (!res.orders?.length) toast({ title: 'No orders', description: `No ${status !== 'all' ? status + ' ' : ''}orders in ${res.range || monthLabel(month)}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load report', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  // Export the loaded invoices as a CSV file
  const exportCsv = () => {
    if (!report?.orders?.length) return;
    const headers = ['Invoice', 'Date', 'Customer', 'Email', 'Phone', 'GSTIN', 'Plan', 'Base', 'GST', 'Total', 'Status'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = report.orders.map((o: any) => [
      o.invoiceId,
      new Date(o.createdAt).toLocaleDateString('en-GB'),
      o.customerName, o.customerEmail, o.customerPhone, o.customerGstin,
      o.planName, o.base, o.gst, o.total,
      o.paymentStatus === 'paid' ? 'PAID' : o.paymentStatus === 'refund' ? 'REFUND' : 'DUE',
    ].map(esc).join(','));
    const totalRow = ['', '', '', '', '', '', 'TOTAL', report.totals.base, report.totals.gst, report.totals.total, ''].map(esc).join(',');
    const csv = [headers.map(esc).join(','), ...rows, totalRow].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${report.range || report.month}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // Print via a hidden iframe (no extra blank tab/window opens in the background)
  const openPrint = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open();
    doc.write(html);
    doc.close();
    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch { /* ignore */ }
      setTimeout(() => { try { document.body.removeChild(iframe); } catch { /* ignore */ } }, 1500);
    };
    // give the logo/images a moment to load before printing
    iframe.onload = () => setTimeout(doPrint, 350);
    setTimeout(doPrint, 1500); // fallback if onload doesn't fire
  };

  const styleBlock = `
    *{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    body{margin:0;padding:40px 46px;color:#111827;font-size:12.5px;line-height:1.5}
    .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0d3a73;padding-bottom:16px}
    .company{font-size:22px;font-weight:800;color:#0d3a73}
    .muted{color:#6b7280}
    .title{font-size:24px;font-weight:800;color:#0d3a73;text-align:right}
    table{width:100%;border-collapse:collapse;margin-top:18px}
    thead th{background:#0d3a73;color:#fff;text-align:left;padding:9px 10px;font-size:11px;font-weight:600}
    thead th.r,tbody td.r{text-align:right}
    tbody td{padding:9px 10px;border-bottom:1px solid #eef2f7;font-size:12px}
    tfoot td{padding:10px;font-weight:800;border-top:2px solid #0d3a73}
    .paid{color:#15803d;font-weight:700}.due{color:#b45309;font-weight:700}
    .foot{margin-top:30px;text-align:center;color:#9ca3af;font-size:11px}
    @media print{.pageb{page-break-after:always}}
  `;

  // Consolidated monthly statement — one document, all orders + GST summary
  const printStatement = () => {
    if (!report?.orders?.length) return;
    const rows = report.orders.map((o: any, i: number) => `
      <tr>
        <td>${i + 1}</td>
        <td>${o.invoiceId}</td>
        <td>${new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
        <td>${o.customerName}<br/><span class="muted">${o.customerEmail}</span>${o.customerGstin ? `<br/><span class="muted">GSTIN: ${o.customerGstin}</span>` : ''}</td>
        <td>${o.planName}</td>
        <td class="r">${inr(o.base)}</td>
        <td class="r">${inr(o.gst)}</td>
        <td class="r">${inr(o.total)}</td>
        <td class="${o.paymentStatus === 'paid' ? 'paid' : 'due'}">${o.paymentStatus === 'paid' ? 'PAID' : o.paymentStatus === 'refund' ? 'REFUND' : 'DUE'}</td>
      </tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>CA Statement ${report.month}</title><style>${styleBlock}</style></head><body>
      <div class="top">
        <div><div class="company">${COMPANY.name}</div><div class="muted">${COMPANY.line}<br/>${COMPANY.email} · ${COMPANY.phone}<br/>GSTIN: ${COMPANY.gstin}</div></div>
        <div><div class="title">TAX STATEMENT</div><div class="muted" style="text-align:right;margin-top:8px">${monthLabel(report.month)}<br/>Filter: ${report.status.toUpperCase()}<br/>Generated: ${new Date().toLocaleDateString('en-GB')}</div></div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Invoice</th><th>Date</th><th>Customer</th><th>Plan</th><th class="r">Base</th><th class="r">GST</th><th class="r">Total</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="5">Totals · ${report.totals.count} invoice(s)</td><td class="r">${inr(report.totals.base)}</td><td class="r">${inr(report.totals.gst)}</td><td class="r">${inr(report.totals.total)}</td><td></td></tr></tfoot>
      </table>
      <div class="foot">Computer-generated GST tax statement · ${COMPANY.name}</div>
      </body></html>`;
    openPrint(html);
  };

  // Individual tax invoices — FULL format (same as the customer invoice, minus the Pay link), one per page
  const invStyle = `
    *{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    body{margin:0;color:#111827;font-size:12.5px;line-height:1.5}
    .inv{padding:40px 46px}
    .top{display:flex;justify-content:space-between;align-items:flex-start}
    .logo{height:48px;object-fit:contain}
    .company{font-size:21px;font-weight:800;margin-top:14px;color:#0d3a73}
    .muted{color:#6b7280}
    .title{font-size:26px;font-weight:800;letter-spacing:0.5px;text-align:right;color:#0d3a73}
    .lbl{font-weight:800;letter-spacing:0.5px;margin-bottom:4px;color:#1560BD;font-size:12px}
    .row2{display:flex;justify-content:space-between;margin-top:24px;gap:24px}
    .terms{text-align:center;font-style:italic;margin:22px 0 12px;color:#374151}
    table{width:100%;border-collapse:collapse}
    thead th{background:#0d3a73;color:#fff;text-align:left;padding:11px 14px;font-size:12px;font-weight:600}
    thead th.r,tbody td.r{text-align:right}
    tbody td{padding:13px 14px;border-bottom:1px solid #eef2f7;vertical-align:top}
    .totals{width:300px;margin-left:auto;margin-top:14px}
    .totals .line{display:flex;justify-content:space-between;padding:6px 12px;font-weight:600}
    .totals .line span:first-child{color:#6b7280}
    .balance{display:flex;justify-content:space-between;padding:13px 14px;background:#0d3a73;color:#fff;font-weight:800;font-size:15px;margin-top:8px;border-radius:6px}
    .bottom{display:flex;justify-content:space-between;margin-top:36px;gap:30px}
    .tc-title{font-size:15px;font-weight:800;color:#0d3a73}
    .pay-title{font-size:15px;font-weight:800;text-align:right;color:#0d3a73}
    .badge{display:inline-block;margin-top:6px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700}
    .paid{background:#dcfce7;color:#15803d}.due{background:#fef3c7;color:#b45309}
    .foot{margin-top:30px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #eef2f7;padding-top:12px}
    @media print{.pageb{page-break-after:always}}
  `;
  const printInvoices = () => {
    if (!report?.orders?.length) return;
    const logo = new URL(import.meta.env.BASE_URL + 'logo-dark.png', window.location.origin).href;
    const blocks = report.orders.map((o: any, i: number) => {
      const isPaid = o.paymentStatus === 'paid';
      const paid = isPaid ? o.total : 0;
      const balance = Math.max(0, o.total - paid);
      const fmtInv = (d: Date | null) => d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      // Subscription dates: expiry = start + duration months - 1 day ; renew = expiry - 1 day
      const svcStart: Date | null = o.startDate ? new Date(o.startDate) : (o.createdAt ? new Date(o.createdAt) : null);
      let svcExpiry: Date | null = null;
      if (o.endDate) svcExpiry = new Date(o.endDate);
      else if (svcStart) { svcExpiry = new Date(svcStart); svcExpiry.setMonth(svcExpiry.getMonth() + (o.duration || 1)); svcExpiry.setDate(svcExpiry.getDate() - 1); }
      const svcRenew: Date | null = svcExpiry ? new Date(svcExpiry.getTime() - 86400000) : null;
      const invoiceDate = o.renewedAt ? new Date(o.renewedAt) : new Date(o.createdAt);
      const dateStr = fmtInv(invoiceDate);
      // Due date = 3 days before the renewal date (fallback: invoice date + 7 days)
      let dd: Date;
      if (svcRenew) { dd = new Date(svcRenew.getTime() - 3 * 86400000); }
      else { dd = new Date(invoiceDate); dd.setDate(dd.getDate() + 7); }
      const dueStr = fmtInv(dd);
      const renewStr = fmtInv(svcRenew);
      const expiryStr = fmtInv(svcExpiry);
      const periodStr = svcStart && svcExpiry ? `${fmtInv(svcStart)} — ${fmtInv(svcExpiry)}` : '';
      return `
      <div class="inv ${i < report.orders.length - 1 ? 'pageb' : ''}">
        <div class="top">
          <div>
            <img class="logo" src="${logo}" alt="Dlock Services" onerror="this.style.display='none'"/>
            <div class="company">${COMPANY.name}</div>
            <div class="muted" style="margin-top:6px">${COMPANY.line}<br/>${COMPANY.email}<br/>${COMPANY.phone}<br/>GSTIN: ${COMPANY.gstin}</div>
          </div>
          <div>
            <div class="title">TAX INVOICE</div>
            <div class="muted" style="text-align:right;margin-top:10px"><div><b>No.</b> ${o.invoiceId}</div><div><b>Date:</b> ${dateStr}</div><div><b>Due Date:</b> ${dueStr}</div></div>
            <div style="text-align:right"><span class="badge ${isPaid ? 'paid' : 'due'}">${isPaid ? 'PAID' : 'DUE'}</span></div>
          </div>
        </div>
        <div class="row2">
          <div>
            <div class="lbl">INVOICE TO:</div>
            <div style="font-weight:700">${o.customerName}</div>
            <div class="muted">${o.customerEmail}</div>
            ${o.customerPhone ? `<div class="muted">${o.customerPhone}</div>` : ''}
            ${o.customerAddress ? `<div class="muted">${o.customerAddress}</div>` : ''}
            ${o.customerGstin ? `<div class="muted">GSTIN: ${o.customerGstin}</div>` : ''}
          </div>
          <div style="text-align:right">
            <div class="lbl">SERVICE:</div>
            <div style="font-weight:700">${o.planName}</div>
            <div class="muted">${(o.planType || '').toUpperCase()} · ${(o.location || '').toUpperCase()}</div>
            ${periodStr ? `<div class="muted" style="margin-top:6px"><b>Service Period:</b> ${periodStr}</div>` : ''}
            ${renewStr !== '—' ? `<div class="muted"><b>Renews on:</b> ${renewStr}</div>` : ''}
            ${expiryStr !== '—' ? `<div class="muted"><b>Expires on:</b> ${expiryStr}</div>` : ''}
          </div>
        </div>
        <div class="terms"><b>Payment Terms:</b> ${isPaid ? 'Paid in full — thank you.' : `Please pay by ${dueStr}.`}</div>
        <table>
          <thead><tr><th>Description</th><th class="r">Quantity</th><th class="r">Price</th><th class="r">Total</th></tr></thead>
          <tbody><tr>
            <td><b>${o.planName}</b><br/><span class="muted">${o.ram || ''} RAM · ${o.cpu || ''} · ${o.storage || ''} · ${o.os || ''}</span></td>
            <td class="r">${o.quantity} × ${o.duration} mo</td>
            <td class="r">${inr(o.basePrice)}</td>
            <td class="r">${inr(o.base)}</td>
          </tr></tbody>
        </table>
        <div class="totals">
          <div class="line"><span>Sub Total:</span><span>${inr(o.base)}</span></div>
          <div class="line"><span>GST (18%):</span><span>${inr(o.gst)}</span></div>
          ${o.discountAmount > 0 ? `<div class="line"><span>Discount:</span><span>- ${inr(o.discountAmount)}</span></div>` : ''}
          <div class="line"><span>Total Amount:</span><span>${inr(o.total)}</span></div>
          <div class="line"><span>Amount Paid:</span><span>${inr(paid)}</span></div>
          <div class="balance"><span>Balance Due</span><span>${inr(balance)}</span></div>
        </div>
        <div class="bottom">
          <div style="max-width:340px">
            <div class="tc-title">Terms &amp; Conditions:</div>
            <div class="muted" style="margin-top:8px">Services are billed on a prepaid basis. Fees are generally non-refundable as per our Refund Policy.</div>
          </div>
          <div>
            <div class="pay-title">Payment Information</div>
            <div class="muted" style="text-align:right;margin-top:8px">Pay online via your dashboard<br/>(Cards · UPI · Net Banking)<br/>${COMPANY.email}</div>
          </div>
        </div>
        <div class="foot">Computer-generated tax invoice · ${COMPANY.name}</div>
      </div>`;
    }).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoices ${report.month}</title><style>${invStyle}</style></head><body>
      ${blocks}
      </body></html>`;
    openPrint(html);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileSpreadsheet className="h-5 w-5 text-[#1560BD]" /> CA / Accountant Invoices</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Filter mode: single month OR custom date range */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => { setMode('month'); setReport(null); }}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${mode === 'month' ? 'bg-[#1560BD] text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              By Month
            </button>
            <button
              type="button"
              onClick={() => { setMode('range'); setReport(null); }}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${mode === 'range' ? 'bg-[#1560BD] text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Custom Date Range
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {mode === 'month' ? (
              <div>
                <Label>Month</Label>
                <input type="month" value={month} onChange={(e) => { setMonth(e.target.value); setReport(null); }} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
              </div>
            ) : (
              <>
                <div>
                  <Label>From</Label>
                  <input type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setReport(null); }} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
                </div>
                <div>
                  <Label>To</Label>
                  <input type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setReport(null); }} className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
                </div>
              </>
            )}
            <div>
              <Label>Status</Label>
              <select value={status} onChange={(e) => { setStatus(e.target.value as any); setReport(null); }} className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                <option value="all">All (paid + unpaid)</option>
                <option value="paid">Paid only</option>
                <option value="unpaid">Unpaid / Due only</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={load} disabled={loading} className="w-full bg-[#1560BD] text-white hover:bg-[#124f9c]">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Load
              </Button>
            </div>
          </div>

          {report && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                <div className="text-sm text-slate-600">
                  <b>{report.range && report.range.includes('to') ? report.range : monthLabel(report.month)}</b> · {report.totals.count} invoice(s) · Base {inr(report.totals.base)} · GST {inr(report.totals.gst)} · <b>Total {inr(report.totals.total)}</b>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={exportCsv} disabled={!report.orders.length}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> CSV</Button>
                  <Button variant="outline" size="sm" onClick={printStatement} disabled={!report.orders.length}><FileSpreadsheet className="mr-1.5 h-4 w-4" /> Consolidated Statement</Button>
                  <Button size="sm" className="bg-[#0d3a73] text-white hover:bg-[#0b2f5e]" onClick={printInvoices} disabled={!report.orders.length}><FileText className="mr-1.5 h-4 w-4" /> Individual Invoices</Button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr><th className="p-2.5">Invoice</th><th className="p-2.5">Date</th><th className="p-2.5">Customer</th><th className="p-2.5">Plan</th><th className="p-2.5 text-right">Base</th><th className="p-2.5 text-right">GST</th><th className="p-2.5 text-right">Total</th><th className="p-2.5">Status</th></tr>
                  </thead>
                  <tbody>
                    {report.orders.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-slate-400">No orders for this selection</td></tr>
                    ) : report.orders.map((o: any) => (
                      <tr key={o._id} className="border-t border-slate-100">
                        <td className="p-2.5 font-mono text-xs">{o.invoiceId}</td>
                        <td className="p-2.5 text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="p-2.5">{o.customerName}</td>
                        <td className="p-2.5">{o.planName}</td>
                        <td className="p-2.5 text-right tabular-nums">{inr(o.base)}</td>
                        <td className="p-2.5 text-right tabular-nums">{inr(o.gst)}</td>
                        <td className="p-2.5 text-right font-semibold tabular-nums">{inr(o.total)}</td>
                        <td className="p-2.5"><span className={o.paymentStatus === 'paid' ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{o.paymentStatus === 'paid' ? 'PAID' : o.paymentStatus === 'refund' ? 'REFUND' : 'DUE'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="text-xs text-slate-400">
            Pick <b>By Month</b> or a <b>Custom Date Range</b> (from–to) &amp; status, click Load, then export as <b>CSV</b>, a single <b>Consolidated Statement</b>, or <b>Individual Invoices</b> — print or Save as PDF to send to your CA. Amounts are in INR for GST filing.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
