'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Webhook {
  id: string; url: string; secret: string | null; events: string[];
  active: boolean; createdAt: string;
  deliveries: { id: string; success: boolean; statusCode: number | null; createdAt: string }[];
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [url, setUrl]           = useState('');
  const [adding, setAdding]     = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  function token() { return localStorage.getItem('token') || ''; }

  async function load() {
    const res = await fetch(`${API}/api/webhooks`, { headers: { Authorization: `Bearer ${token()}` } });
    setWebhooks(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function addWebhook(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    await fetch(`${API}/api/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ url, events: ['meeting.completed', 'meeting.failed'] }),
    });
    setUrl('');
    await load();
    setAdding(false);
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return;
    await fetch(`${API}/api/webhooks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    load();
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Webhooks</h1>
      <p className="text-slate-400 text-sm mb-8">
        Receive real-time notifications when meetings are processed.
        Each webhook fires with an HMAC-SHA256 signed payload.
      </p>

      {/* Add form */}
      <form onSubmit={addWebhook} className="flex gap-2 mb-8">
        <input
          type="url"
          required
          placeholder="https://your-app.com/webhook"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={15} /> Add
        </button>
      </form>

      {webhooks.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
          No webhooks yet. Add one above.
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(wh => (
            <div key={wh.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-slate-200 truncate">{wh.url}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Created {format(new Date(wh.createdAt), 'MMM d, yyyy')} ·{' '}
                    Events: {wh.events.join(', ')}
                  </div>
                </div>
                <button onClick={() => deleteWebhook(wh.id)} className="text-slate-500 hover:text-red-400 p-1">
                  <Trash2 size={15} />
                </button>
              </div>

              {wh.secret && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Secret:</span>
                  <code className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                    {showSecrets[wh.id] ? wh.secret : '••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowSecrets(s => ({ ...s, [wh.id]: !s[wh.id] }))}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    {showSecrets[wh.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              )}

              {/* Recent deliveries */}
              {wh.deliveries.length > 0 && (
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <div className="text-xs text-slate-500 mb-2">Recent deliveries</div>
                  <div className="space-y-1">
                    {wh.deliveries.slice(0, 3).map(d => (
                      <div key={d.id} className="flex items-center gap-2 text-xs">
                        {d.success
                          ? <Check size={11} className="text-green-400" />
                          : <X size={11} className="text-red-400" />
                        }
                        <span className="text-slate-400">{d.statusCode ?? '—'}</span>
                        <span className="text-slate-600">{format(new Date(d.createdAt), 'MMM d HH:mm')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
