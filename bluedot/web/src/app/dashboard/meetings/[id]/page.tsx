'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, Globe, Copy, Check, ChevronDown, ChevronUp,
  Trash2, Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/meetings/StatusBadge';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ActionItem { text: string; owner?: string; due?: string; }
interface Meeting {
  id: string; title: string; status: string; platform: string | null;
  duration: number | null; language: string | null; startedAt: string;
  meetingUrl: string | null;
  summary?: {
    text: string; actionItems: ActionItem[]; keyDecisions: string[];
    followUpEmail: string | null;
  } | null;
  transcript?: { text: string; segments: { start: number; end: number; text: string }[] } | null;
  participants?: { id: string; name?: string; email?: string }[];
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function MeetingDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showEmail, setShowEmail]           = useState(false);
  const [copied, setCopied]                 = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API}/api/meetings/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setMeeting)
      .catch(() => router.push('/dashboard/meetings'))
      .finally(() => setLoading(false));
  }, [id]);

  async function deleteMeeting() {
    if (!confirm('Delete this meeting? This cannot be undone.')) return;
    const token = localStorage.getItem('token');
    await fetch(`${API}/api/meetings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    router.push('/dashboard/meetings');
  }

  function copyEmail() {
    if (meeting?.summary?.followUpEmail) {
      navigator.clipboard.writeText(meeting.summary.followUpEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading…</div>;
  if (!meeting) return null;

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-3 transition-colors">
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="text-2xl font-bold leading-tight">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
            <span>{format(new Date(meeting.startedAt), 'MMM d, yyyy · HH:mm')}</span>
            {meeting.duration && <><span>·</span><span className="flex items-center gap-1"><Clock size={13} />{Math.round(meeting.duration / 60)} min</span></>}
            {meeting.platform && <><span>·</span><span className="capitalize">{meeting.platform.replace('_', ' ')}</span></>}
            {meeting.language && <><span>·</span><span className="flex items-center gap-1"><Globe size={13} />{meeting.language.toUpperCase()}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={meeting.status} />
          <button onClick={deleteMeeting} className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Summary */}
      {meeting.summary?.text && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
          <h2 className="font-semibold mb-3">Summary</h2>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{meeting.summary.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Action items */}
        {meeting.summary?.actionItems && meeting.summary.actionItems.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3">Action Items</h2>
            <ul className="space-y-2">
              {meeting.summary.actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 w-4 h-4 rounded border border-slate-600 shrink-0" />
                  <div>
                    <span className="text-slate-200">{item.text}</span>
                    {item.owner && <span className="text-slate-500 ml-1">— {item.owner}</span>}
                    {item.due   && <span className="text-slate-500 ml-1">({item.due})</span>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key decisions */}
        {meeting.summary?.keyDecisions && meeting.summary.keyDecisions.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="font-semibold mb-3">Key Decisions</h2>
            <ul className="space-y-2">
              {meeting.summary.keyDecisions.map((d, i) => (
                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-blue-400 shrink-0">→</span> {d}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Follow-up email */}
      {meeting.summary?.followUpEmail && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl mb-4">
          <button
            onClick={() => setShowEmail(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold"
          >
            <div className="flex items-center gap-2"><Mail size={15} /> Follow-up Email Draft</div>
            {showEmail ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showEmail && (
            <div className="px-5 pb-5">
              <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-slate-950 rounded-lg p-4 font-mono leading-relaxed">
                {meeting.summary.followUpEmail}
              </pre>
              <button
                onClick={copyEmail}
                className="mt-3 flex items-center gap-2 text-sm px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {copied ? <><Check size={13} className="text-green-400" /> Copied!</> : <><Copy size={13} /> Copy email</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      {meeting.transcript?.text && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setShowTranscript(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold"
          >
            Full Transcript
            {showTranscript ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showTranscript && (
            <div className="px-5 pb-5 max-h-[500px] overflow-y-auto">
              {meeting.transcript.segments?.length > 0 ? (
                <div className="space-y-3">
                  {meeting.transcript.segments.map((seg, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-slate-500 shrink-0 font-mono text-xs pt-0.5">
                        {formatSeconds(Math.round(seg.start))}
                      </span>
                      <p className="text-slate-300">{seg.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-300 text-sm whitespace-pre-wrap">{meeting.transcript.text}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
