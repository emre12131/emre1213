'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from '@/components/meetings/StatusBadge';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Meeting {
  id: string;
  title: string;
  status: string;
  platform: string | null;
  duration: number | null;
  startedAt: string;
  summary?: { text: string } | null;
}

function stat(label: string, value: string | number, icon: React.ReactNode) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
        {icon} {label}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/api/meetings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setMeetings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completed  = meetings.filter(m => m.status === 'COMPLETED').length;
  const processing = meetings.filter(m => ['RECORDING', 'PROCESSING'].includes(m.status)).length;
  const totalMins  = meetings.reduce((acc, m) => acc + (m.duration || 0), 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stat('Total meetings',    meetings.length,          <Video size={15} />)}
        {stat('Completed',         completed,                <CheckCircle size={15} />)}
        {stat('Total hours',       (totalMins / 3600).toFixed(1), <Clock size={15} />)}
      </div>

      {/* Recent meetings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-semibold">Recent meetings</h2>
          <Link href="/dashboard/meetings" className="text-sm text-blue-400 hover:underline">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 size={20} className="animate-spin mr-2" /> Loading…
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Video size={32} className="mx-auto mb-3 opacity-40" />
            <p>No meetings yet. Install the Chrome extension and start recording.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-800">
            {meetings.slice(0, 8).map(m => (
              <li key={m.id}>
                <Link
                  href={`/dashboard/meetings/${m.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{m.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {m.platform ? `${m.platform.replace('_', ' ')} · ` : ''}
                      {formatDistanceToNow(new Date(m.startedAt), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3 shrink-0">
                    {m.duration && (
                      <span className="text-xs text-slate-500">{Math.round(m.duration / 60)} min</span>
                    )}
                    <StatusBadge status={m.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
