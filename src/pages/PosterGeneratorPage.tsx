import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

type Tier = { ram: string; price: string; popular: boolean };

type Theme = {
  id: string; name: string; swatch: string;
  bg: [string, string, string]; glow: string; frame: string;
  headline: string; accent: string; seriesLabel: string;
  badgeBg: string; badgeInk: string;
  cardBg: string; cardBorder: string; ramInk: string; price: string; sub: string;
  chipBg: string; chipBorder: string; chipInk: string;
  feature: string; footer: string; footerSub: string;
};

const THEMES: Theme[] = [
  {
    id: 'ocean', name: 'Ocean Blue', swatch: 'linear-gradient(135deg,#0d3a73,#38bdf8)',
    bg: ['#0d3a73', '#124f9c', '#0d3a73'], glow: 'rgba(56,189,248,.30)', frame: 'rgba(255,255,255,.14)',
    headline: '#ffffff', accent: '#38bdf8', seriesLabel: '#9fd0f5',
    badgeBg: '#f59e0b', badgeInk: '#3a2400',
    cardBg: '#ffffff', cardBorder: 'transparent', ramInk: '#0d3a73', price: '#1560BD', sub: '#64748b',
    chipBg: 'rgba(56,189,248,.16)', chipBorder: 'rgba(56,189,248,.5)', chipInk: '#d7ecfb',
    feature: '#cfe0f8', footer: '#ffffff', footerSub: '#9fb4d6',
  },
  {
    id: 'midnight', name: 'Midnight', swatch: 'linear-gradient(135deg,#0b1220,#22d3ee)',
    bg: ['#0b1220', '#131c30', '#0b1220'], glow: 'rgba(34,211,238,.26)', frame: 'rgba(255,255,255,.12)',
    headline: '#ffffff', accent: '#22d3ee', seriesLabel: '#67e8f9',
    badgeBg: '#22d3ee', badgeInk: '#06222a',
    cardBg: '#ffffff', cardBorder: 'transparent', ramInk: '#0b1220', price: '#0ea5e9', sub: '#64748b',
    chipBg: 'rgba(34,211,238,.14)', chipBorder: 'rgba(34,211,238,.5)', chipInk: '#a5f3fc',
    feature: '#cbd5e1', footer: '#ffffff', footerSub: '#94a3b8',
  },
  {
    id: 'crimson', name: 'Crimson', swatch: 'linear-gradient(135deg,#7f1d1d,#f59e0b)',
    bg: ['#7f1d1d', '#b91c1c', '#7f1d1d'], glow: 'rgba(245,158,11,.22)', frame: 'rgba(255,255,255,.16)',
    headline: '#ffffff', accent: '#fbbf24', seriesLabel: '#fecaca',
    badgeBg: '#fbbf24', badgeInk: '#3a2400',
    cardBg: '#ffffff', cardBorder: 'transparent', ramInk: '#7f1d1d', price: '#b91c1c', sub: '#64748b',
    chipBg: 'rgba(251,191,36,.16)', chipBorder: 'rgba(251,191,36,.55)', chipInk: '#fde68a',
    feature: '#fee2e2', footer: '#ffffff', footerSub: '#fecaca',
  },
  {
    id: 'emerald', name: 'Emerald', swatch: 'linear-gradient(135deg,#065f46,#6ee7b7)',
    bg: ['#064e3b', '#0f766e', '#065f46'], glow: 'rgba(52,211,153,.26)', frame: 'rgba(255,255,255,.14)',
    headline: '#ffffff', accent: '#6ee7b7', seriesLabel: '#6ee7b7',
    badgeBg: '#f59e0b', badgeInk: '#3a2400',
    cardBg: '#ffffff', cardBorder: 'transparent', ramInk: '#065f46', price: '#0d9488', sub: '#64748b',
    chipBg: 'rgba(110,231,183,.16)', chipBorder: 'rgba(110,231,183,.5)', chipInk: '#a7f3d0',
    feature: '#ccfbf1', footer: '#ffffff', footerSub: '#99f6e4',
  },
  {
    id: 'clean', name: 'Clean White', swatch: 'linear-gradient(135deg,#eef2f8,#1560BD)',
    bg: ['#f8fafc', '#eef2f8', '#f1f5fb'], glow: 'rgba(21,96,189,.10)', frame: 'rgba(13,58,115,.12)',
    headline: '#0d3a73', accent: '#1560BD', seriesLabel: '#1560BD',
    badgeBg: '#f59e0b', badgeInk: '#3a2400',
    cardBg: '#ffffff', cardBorder: '#e2e8f0', ramInk: '#0d3a73', price: '#1560BD', sub: '#64748b',
    chipBg: 'rgba(21,96,189,.08)', chipBorder: 'rgba(21,96,189,.35)', chipInk: '#1560BD',
    feature: '#475569', footer: '#0d3a73', footerSub: '#64748b',
  },
];

const LAYOUTS = [
  { id: 'cards', name: 'Cards' },
  { id: 'list', name: 'List' },
  { id: 'spotlight', name: 'Spotlight' },
];

export default function PosterGeneratorPage() {
  const [design, setDesign] = useState(0);
  const [layout, setLayout] = useState('cards');
  const [title, setTitle] = useState('IP SERIES');
  const [subtitle, setSubtitle] = useState('SPECIAL OFFER');
  const [badge, setBadge] = useState('VALID TILL 26th ONLY');
  const [location, setLocation] = useState('NOIDA');
  const [series, setSeries] = useState('74.0.x, 163.61.x, 103.178.x, 103.98.x, 103.163.x, 162.4.x, 138.252.x');
  const [features, setFeatures] = useState('NVMe SSD · DDoS Protected · 99.99% Uptime · 24/7 Support');
  const [website, setWebsite] = useState('dlockservices.com');
  const [phone, setPhone] = useState('+91-8503023131');
  const [tiers, setTiers] = useState<Tier[]>([
    { ram: '4 GB', price: '549', popular: false },
    { ram: '8 GB', price: '999', popular: true },
    { ram: '16 GB', price: '1999', popular: false },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { logoRef.current = img; setLogoReady(true); };
    img.onerror = () => { logoRef.current = null; setLogoReady(true); };
    img.src = '/admin/logo-dark.png';
  }, []);

  const setTier = (i: number, patch: Partial<Tier>) =>
    setTiers((t) => t.map((x, idx) => (idx === i ? { ...x, ...patch } : (patch.popular ? { ...x, popular: false } : x))));
  const addTier = () => setTiers((t) => (t.length >= 4 ? t : [...t, { ram: '32 GB', price: '2999', popular: false }]));
  const delTier = (i: number) => setTiers((t) => (t.length <= 1 ? t : t.filter((_, idx) => idx !== i)));

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 1080, H = 1350;
    const th = THEMES[design] || THEMES[0];
    const logo = logoRef.current;
    const seriesArr = series.split(',').map((s) => s.trim()).filter(Boolean);

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      if ((ctx as any).roundRect) (ctx as any).roundRect(x, y, w, h, r);
      else { ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    };

    // background
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, th.bg[0]); g.addColorStop(0.55, th.bg[1]); g.addColorStop(1, th.bg[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const glow = (x: number, y: number, r: number, col: string) => {
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    };
    glow(120, 180, 420, th.glow);
    glow(980, 1180, 520, th.glow);
    ctx.strokeStyle = th.frame; ctx.lineWidth = 3; rr(28, 28, W - 56, H - 56, 34); ctx.stroke();

    ctx.textAlign = 'center';

    // logo pill (always white so the dark logo is visible on any theme)
    const pw = 560, ph = 150, px = (W - pw) / 2, py = 70;
    rr(px, py, pw, ph, 30); ctx.fillStyle = '#ffffff'; ctx.fill();
    if (th.cardBorder !== 'transparent') { ctx.strokeStyle = th.cardBorder; ctx.lineWidth = 2; rr(px, py, pw, ph, 30); ctx.stroke(); }
    if (logo) { let lw = 470, lh = lw * logo.height / logo.width; if (lh > ph - 40) { lh = ph - 40; lw = lh * logo.width / logo.height; } ctx.drawImage(logo, (W - lw) / 2, py + (ph - lh) / 2, lw, lh); }

    // headline
    ctx.fillStyle = th.headline; ctx.font = '800 104px Arial, sans-serif'; ctx.fillText(title || '', W / 2, 350);
    ctx.fillStyle = th.accent; ctx.font = '800 62px Arial, sans-serif'; ctx.fillText(subtitle || '', W / 2, 428);

    // badge
    if (badge.trim()) {
      ctx.font = '800 30px Arial, sans-serif';
      const bw = Math.min(760, ctx.measureText('⚡  ' + badge).width + 60), bh = 62, bx = (W - bw) / 2, by = 470;
      rr(bx, by, bw, bh, 31); ctx.fillStyle = th.badgeBg; ctx.fill();
      ctx.fillStyle = th.badgeInk; ctx.fillText('⚡  ' + badge, W / 2, by + 42);
    }

    // ---- price section (switches by layout) ----
    const n = tiers.length, m = 70;
    if (layout === 'list') {
      const cy = 578, band = 296, rowGap = 14;
      const rowH = (band - (n - 1) * rowGap) / n;
      tiers.forEach((t, i) => {
        const ry = cy + i * (rowH + rowGap), pop = t.popular;
        rr(m, ry, W - 2 * m, rowH, 20); ctx.fillStyle = th.cardBg; ctx.fill();
        if (pop) { ctx.strokeStyle = th.accent; ctx.lineWidth = 4; rr(m, ry, W - 2 * m, rowH, 20); ctx.stroke(); }
        else if (th.cardBorder !== 'transparent') { ctx.strokeStyle = th.cardBorder; ctx.lineWidth = 2; rr(m, ry, W - 2 * m, rowH, 20); ctx.stroke(); }
        const midY = ry + rowH / 2;
        ctx.textAlign = 'left'; ctx.fillStyle = th.ramInk; ctx.font = '800 46px Arial, sans-serif';
        ctx.fillText(t.ram, m + 44, midY + 4);
        ctx.fillStyle = th.sub; ctx.font = '600 26px Arial, sans-serif'; ctx.fillText('RAM', m + 44, midY + 40);
        ctx.textAlign = 'right'; ctx.fillStyle = th.sub; ctx.font = '600 26px Arial, sans-serif';
        ctx.fillText('/mo', W - m - 44, midY + 4);
        const moW = ctx.measureText('/mo').width;
        ctx.fillStyle = th.price; ctx.font = '800 62px Arial, sans-serif';
        ctx.fillText('₹' + t.price, W - m - 44 - moW - 16, midY + 8);
        if (pop) { ctx.textAlign = 'center'; rr(m + 30, ry - 16, 130, 34, 17); ctx.fillStyle = th.accent; ctx.fill(); ctx.fillStyle = '#0a2233'; ctx.font = '800 18px Arial, sans-serif'; ctx.fillText('POPULAR', m + 95, ry + 7); }
      });
      ctx.textAlign = 'center';
    } else if (layout === 'spotlight') {
      const hi = Math.max(0, tiers.findIndex((t) => t.popular));
      const hero = tiers[hi] || tiers[0];
      const bw2 = 620, bh2 = 260, bx2 = (W - bw2) / 2, by2 = 560;
      rr(bx2, by2, bw2, bh2, 28); ctx.fillStyle = th.cardBg; ctx.fill();
      ctx.strokeStyle = th.accent; ctx.lineWidth = 6; rr(bx2, by2, bw2, bh2, 28); ctx.stroke();
      rr(W / 2 - 110, by2 - 24, 220, 48, 24); ctx.fillStyle = th.accent; ctx.fill();
      ctx.fillStyle = '#0a2233'; ctx.font = '800 24px Arial, sans-serif'; ctx.fillText('BEST VALUE', W / 2, by2 + 8);
      ctx.fillStyle = th.ramInk; ctx.font = '800 46px Arial, sans-serif'; ctx.fillText((hero?.ram || '') + ' RAM', W / 2, by2 + 90);
      ctx.fillStyle = th.price; ctx.font = '800 128px Arial, sans-serif'; ctx.fillText('₹' + (hero?.price || ''), W / 2, by2 + 210);
      ctx.fillStyle = th.sub; ctx.font = '600 28px Arial, sans-serif'; ctx.fillText('/ month', W / 2, by2 + 244);
      // other tiers as pills
      const others = tiers.filter((_, i) => i !== hi);
      if (others.length) {
        ctx.font = '700 30px Arial, sans-serif';
        const labels = others.map((t) => `${t.ram} — ₹${t.price}`);
        const widths = labels.map((l) => ctx.measureText(l).width + 52);
        const totalW = widths.reduce((a, b) => a + b, 0) + (others.length - 1) * 20;
        let sx = (W - totalW) / 2; const py2 = 862, ph2 = 56;
        labels.forEach((l, i) => {
          rr(sx, py2, widths[i], ph2, 28); ctx.fillStyle = th.chipBg; ctx.fill();
          ctx.strokeStyle = th.chipBorder; ctx.lineWidth = 2; rr(sx, py2, widths[i], ph2, 28); ctx.stroke();
          ctx.fillStyle = th.headline; ctx.textAlign = 'center'; ctx.fillText(l, sx + widths[i] / 2, py2 + 38);
          sx += widths[i] + 20;
        });
      }
    } else {
      // cards (default)
      const gap = 26, cy = 580, ch = 300, cw = (W - 2 * m - (n - 1) * gap) / n;
      tiers.forEach((t, i) => {
        const cx = m + i * (cw + gap), pop = t.popular;
        rr(cx, cy, cw, ch, 24); ctx.fillStyle = th.cardBg; ctx.fill();
        if (pop) {
          ctx.strokeStyle = th.accent; ctx.lineWidth = 5; rr(cx, cy, cw, ch, 24); ctx.stroke();
          rr(cx + cw / 2 - 70, cy - 20, 140, 40, 20); ctx.fillStyle = th.accent; ctx.fill();
          ctx.fillStyle = '#0a2233'; ctx.font = '800 22px Arial, sans-serif'; ctx.fillText('POPULAR', cx + cw / 2, cy + 7);
        } else if (th.cardBorder !== 'transparent') {
          ctx.strokeStyle = th.cardBorder; ctx.lineWidth = 2; rr(cx, cy, cw, ch, 24); ctx.stroke();
        }
        ctx.fillStyle = th.ramInk; ctx.font = `800 ${n > 3 ? 34 : 40}px Arial, sans-serif`; ctx.fillText(t.ram, cx + cw / 2, cy + 78);
        ctx.fillStyle = th.sub; ctx.font = '600 22px Arial, sans-serif'; ctx.fillText('RAM', cx + cw / 2, cy + 112);
        ctx.fillStyle = th.price; ctx.font = `800 ${n > 3 ? 60 : 76}px Arial, sans-serif`; ctx.fillText('₹' + t.price, cx + cw / 2, cy + 210);
        ctx.fillStyle = th.sub; ctx.font = '600 24px Arial, sans-serif'; ctx.fillText('/ month', cx + cw / 2, cy + 250);
      });
    }

    // series
    if (seriesArr.length) {
      ctx.fillStyle = th.seriesLabel; ctx.font = '700 26px Arial, sans-serif';
      ctx.fillText(`AVAILABLE IP SERIES${location ? '  ·  ' + location : ''}`, W / 2, 985);
      ctx.font = '700 30px "Courier New", monospace';
      const chipH = 52, padX = 26, gapX = 18, rowGapY = 16, maxW = W - 2 * 70, chipY = 1015;
      const rows: [string, number][][] = [[]]; const rowW: number[] = [0];
      seriesArr.forEach((s) => {
        const tw = ctx.measureText(s).width + padX * 2;
        if (rowW[rows.length - 1] + tw + gapX > maxW) { rows.push([]); rowW.push(0); }
        rows[rows.length - 1].push([s, tw]); rowW[rows.length - 1] += tw + gapX;
      });
      rows.forEach((row, r0) => {
        const total = rowW[r0] - gapX; let sx = (W - total) / 2; const yy = chipY + r0 * (chipH + rowGapY);
        row.forEach(([label, twc]) => {
          rr(sx, yy, twc, chipH, 26); ctx.fillStyle = th.chipBg; ctx.fill();
          ctx.strokeStyle = th.chipBorder; ctx.lineWidth = 2; rr(sx, yy, twc, chipH, 26); ctx.stroke();
          ctx.fillStyle = th.chipInk; ctx.textAlign = 'center'; ctx.font = '700 30px "Courier New", monospace';
          ctx.fillText(label, sx + twc / 2, yy + 35); sx += twc + gapX;
        });
      });
    }

    // features
    if (features.trim()) { ctx.textAlign = 'center'; ctx.fillStyle = th.feature; ctx.font = '700 26px Arial, sans-serif'; ctx.fillText(features, W / 2, 1190); }
    // footer
    ctx.fillStyle = th.footer; ctx.font = '800 40px Arial, sans-serif'; ctx.fillText(website || '', W / 2, 1258);
    ctx.fillStyle = th.footerSub; ctx.font = '600 26px Arial, sans-serif'; ctx.fillText(`📞  ${phone}   ·   Order online today`, W / 2, 1300);
  }

  // redraw on any change
  useEffect(() => { draw(); /* eslint-disable-next-line */ }, [design, layout, title, subtitle, badge, location, series, features, website, phone, tiers, logoReady]);

  const download = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    try {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `dlock-poster-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e: any) { alert('Download failed: ' + e.message); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Poster Maker</h1>
        <p className="text-sm text-slate-500">Fill in the details, preview live, and download a ready-to-share PNG (1080×1350).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
        {/* Form */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="h-5 w-5 text-[#1560BD]" /> Content</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Layout style</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayout(l.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${layout === l.id ? 'border-[#1560BD] bg-blue-50 text-[#1560BD]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Colour theme</Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {THEMES.map((t, i) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDesign(i)}
                    title={t.name}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${design === i ? 'border-[#1560BD] bg-blue-50 text-[#1560BD]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: t.swatch }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><Label>Heading</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div><Label>Sub-heading</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></div>
              <div><Label>Offer badge</Label><Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. VALID TILL 26th ONLY" /></div>
              <div><Label>Location label</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Price tiers</Label>
                <Button type="button" size="sm" variant="outline" onClick={addTier} disabled={tiers.length >= 4}><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button>
              </div>
              <div className="space-y-2">
                {tiers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input className="w-28" value={t.ram} onChange={(e) => setTier(i, { ram: e.target.value })} placeholder="RAM" />
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                      <Input className="pl-6" value={t.price} onChange={(e) => setTier(i, { price: e.target.value })} placeholder="Price" />
                    </div>
                    <label className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
                      <input type="radio" name="popular" checked={t.popular} onChange={() => setTier(i, { popular: true })} /> Popular
                    </label>
                    <button type="button" onClick={() => delTier(i)} disabled={tiers.length <= 1} className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div><Label>IP series (comma separated)</Label><Input value={series} onChange={(e) => setSeries(e.target.value)} /></div>
            <div><Label>Features line</Label><Input value={features} onChange={(e) => setFeatures(e.target.value)} /></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
              <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <canvas ref={canvasRef} width={1080} height={1350} className="block w-full" />
          </div>
          <Button className="w-full bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={download}>
            <Download className="mr-2 h-4 w-4" /> Download PNG
          </Button>
          <p className="text-center text-xs text-slate-400">High-resolution 1080×1350 · ready for WhatsApp / social</p>
        </div>
      </div>
    </div>
  );
}
