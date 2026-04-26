'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Monitor { id: string; name: string; url: string; isActive: boolean; interval: number; createdAt: string; _count?: { checkResults: number; incidents: number }; }
interface Incident { id: string; monitorId: string; title: string; severity: string; status: string; createdAt: string; }
interface Stats { monitorId: string; uptime24h: number; uptime7d: number; uptime30d: number; avgResponseTime: number; lastStatus: string; lastChecked: string; }

function getStatusColor(status: string) {
  if (status === 'up') return 'bg-green-500';
  if (status === 'degraded') return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState<Record<string, Stats>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!u || !token) { window.location.href = '/login'; return; }
    setUser(JSON.parse(u));
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [mRes, sRes, iRes] = await Promise.all([
        fetch('/api/monitors', { headers }),
        fetch('/api/stats', { headers }),
        fetch('/api/incidents', { headers }),
      ]);
      if (mRes.ok) setMonitors(await mRes.json());
      if (sRes.ok) setStats(await sRes.json());
      if (iRes.ok) setIncidents(await iRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const addMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: newName, url: newUrl, interval: 5 }),
    });
    setNewName(''); setNewUrl(''); setShowAdd(false);
    fetchData();
  };

  const logout = () => { localStorage.clear(); window.location.href = '/login'; };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-xl">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">🌐 Website Status</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.name} ({user?.role})</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Monitors</p>
            <p className="text-2xl font-bold">{monitors.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">All Up</p>
            <p className="text-2xl font-bold text-green-600">{monitors.filter(m => stats[m.id]?.lastStatus === 'up').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Down</p>
            <p className="text-2xl font-bold text-red-600">{monitors.filter(m => stats[m.id]?.lastStatus === 'down').length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-sm text-gray-500">Open Incidents</p>
            <p className="text-2xl font-bold text-orange-600">{incidents.filter(i => i.status === 'open').length}</p>
          </div>
        </div>

        {/* Add Monitor */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {!showAdd ? (
            <button onClick={() => setShowAdd(true)} className="text-blue-600 hover:underline">+ Add Monitor</button>
          ) : (
            <form onSubmit={addMonitor} className="flex gap-3 items-end">
              <div><label className="text-sm">Name</label><input value={newName} onChange={e => setNewName(e.target.value)} required className="block border rounded px-2 py-1" /></div>
              <div><label className="text-sm">URL</label><input value={newUrl} onChange={e => setNewUrl(e.target.value)} required className="block border rounded px-2 py-1" /></div>
              <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">Add</button>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500">Cancel</button>
            </form>
          )}
        </div>

        {/* Monitors List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">URL</th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">24h Uptime</th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">7d Uptime</th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden lg:table-cell">30d Uptime</th>
                <th className="text-left px-4 py-3 text-sm font-medium hidden md:table-cell">Last Check</th>
              </tr>
            </thead>
            <tbody>
              {monitors.map(m => {
                const s = stats[m.id];
                return (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-3"><span className={`inline-block w-3 h-3 rounded-full ${getStatusColor(s?.lastStatus || 'down')}`} /></td>
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{m.url}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{s ? `${s.uptime24h.toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{s ? `${s.uptime7d.toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{s ? `${s.uptime30d.toFixed(1)}%` : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{s?.lastChecked ? new Date(s.lastChecked).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 90-day Health Timeline */}
        {monitors.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-3">90-Day Health Timeline</h2>
            {monitors.map(m => (
              <div key={m.id} className="mb-4">
                <p className="text-sm font-medium mb-1">{m.name}</p>
                <UptimeBar monitorId={m.id} token={token!} />
              </div>
            ))}
          </div>
        )}

        {/* Recent Incidents */}
        {incidents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-3">Recent Incidents</h2>
            <div className="space-y-2">
              {incidents.slice(0, 10).map(i => (
                <div key={i.id} className="flex items-center gap-3 p-2 border rounded">
                  <span className={`w-2 h-2 rounded-full ${i.severity === 'critical' ? 'bg-red-500' : i.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                  <span className="font-medium">{i.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${i.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{i.status}</span>
                  <span className="text-xs text-gray-400 ml-auto">{new Date(i.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function UptimeBar({ monitorId, token }: { monitorId: string; token: string }) {
  const [days, setDays] = useState<{ date: string; status: string }[]>([]);
  useEffect(() => {
    fetch(`/api/stats/90day?monitorId=${monitorId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setDays(d); }).catch(() => {});
  }, [monitorId, token]);
  return (
    <div className="flex gap-[2px]">
      {days.map((d, i) => (
        <div key={i} className={`flex-1 h-6 rounded-sm ${d.status === 'up' ? 'bg-green-400' : d.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`}
          title={`${d.date}: ${d.status}`} />
      ))}
    </div>
  );
}
