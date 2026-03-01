'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Video, Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/meetings/StatusBadge';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Meeting {
  id: string;
  title: string;
  status: string;
  platform: string | null;
  duration: number | null;
  language: string | null;
  startedAt: string;
  summary?: { text: string } | null;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/api/meetings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setMeetings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = meetings.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Meetings</h1>
        <input
          type="search"
          placeholder="Search meetings…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 w-56"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Video size={40} className="mx-auto mb-4 opacity-30" />
          <p>{search ? 'No meetings match your search.' : 'No meetings yet.'}</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800">
          {filtered.map(m => (
            <Link
              key={m.id}
              href={`/dashboard/meetings/${m.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{m.title}</div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  {m.platform && <span className="capitalize">{m.platform.replace('_', ' ')}</span>}
                  {m.platform && <span>·</span>}
                  <span>{formatDistanceToNow(new Date(m.startedAt), { addSuffix: true })}</span>
                  {m.language && <><span>·</span><span className="uppercase">{m.language}</span></>}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-4 shrink-0">
                {m.duration && (
                  <span className="text-sm text-slate-400">{Math.round(m.duration / 60)} min</span>
                )}
                <StatusBadge status={m.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
