import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Database, Download, Loader2, HardDrive, RefreshCw } from 'lucide-react';
import { getBackupStats, downloadDbBackup } from '@/services/api';

export default function DatabaseBackupPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setStats(await getBackupStats());
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to load DB stats', variant: 'destructive' });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const doBackup = async () => {
    setDownloading(true);
    try {
      const res: any = await downloadDbBackup();
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `dlock-db-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Backup downloaded', description: 'Full database backup saved to your device.' });
    } catch (err: any) {
      toast({ title: 'Backup failed', description: err.message || 'Could not generate backup', variant: 'destructive' });
    } finally { setDownloading(false); }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Database className="h-5 w-5 text-[#1560BD]" /> Database Backup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Summary + action */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1560BD]/10 text-[#1560BD]"><HardDrive className="h-6 w-6" /></div>
              <div>
                <div className="font-semibold text-slate-900">{loading ? 'Loading…' : stats?.database || 'Database'}</div>
                <div className="text-xs text-slate-500">
                  {loading ? '' : `${stats?.collections?.length || 0} collections · ${(stats?.totalDocs || 0).toLocaleString('en-IN')} documents`}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>
              <Button className="bg-[#1560BD] text-white hover:bg-[#124f9c]" onClick={doBackup} disabled={downloading || loading}>
                {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Full Backup
              </Button>
            </div>
          </div>

          {/* Collections table */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-slate-300" /></div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr><th className="p-2.5">Collection</th><th className="p-2.5 text-right">Documents</th></tr>
                </thead>
                <tbody>
                  {(stats?.collections || []).map((c: any) => (
                    <tr key={c.name} className="border-t border-slate-100">
                      <td className="p-2.5 font-mono text-xs text-slate-700">{c.name}</td>
                      <td className="p-2.5 text-right tabular-nums font-medium text-slate-900">{Number(c.count).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Downloads a complete snapshot of the entire database as a single JSON file (all collections &amp; documents). Store it safely — you can use it to restore data if needed. For scheduled/automated backups on the server, use <code className="rounded bg-slate-100 px-1">mongodump</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
