'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SettingsPage() {
  const [user, setUser]     = useState<any>(null);
  const [saved, setSaved]   = useState(false);
  const [name, setName]     = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(u => { setUser(u); setName(u.name || ''); });
  }, []);

  // Placeholder — profile update endpoint would be added to the API
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const EXTENSION_URL = 'chrome://extensions/';

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {/* Profile */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Display name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Email</label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm opacity-50 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold transition-colors"
          >
            {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Plan */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-1">Plan</h2>
        <p className="text-slate-400 text-sm mb-4">Current plan: <strong>{user?.plan}</strong></p>

        {user?.plan === 'FREE' && (
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-blue-300 mb-3">
              Upgrade to <strong>Pro</strong> for unlimited meetings, advanced AI features, and webhook support.
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition-colors">
              Upgrade to Pro →
            </button>
          </div>
        )}
      </section>

      {/* Chrome Extension */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="font-semibold mb-2">Chrome Extension</h2>
        <p className="text-slate-400 text-sm mb-4">
          The Bluedot Chrome extension records your meetings directly in the browser — no bot joins your call.
        </p>
        <div className="bg-slate-950 rounded-xl p-4 text-sm">
          <p className="text-slate-400 mb-2">To install:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-300">
            <li>Open <code className="text-blue-400">{EXTENSION_URL}</code></li>
            <li>Enable Developer Mode</li>
            <li>Click "Load unpacked" and select the <code className="text-blue-400">extension/</code> folder</li>
          </ol>
        </div>
      </section>
    </div>
  );
}
