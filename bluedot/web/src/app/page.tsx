import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Bot-free • No meeting disruptions
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          Your meetings,<br />automatically documented.
        </h1>

        <p className="text-slate-400 text-lg mb-10 leading-relaxed">
          Bluedot records, transcribes and summarises your Google Meet, Zoom and
          Teams calls — silently, without a bot joining the call.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/register"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors text-white"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors text-slate-200"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
        {[
          { icon: '🎙️', title: 'Bot-free recording', desc: 'Records via Chrome extension — no robot joins your call.' },
          { icon: '✍️', title: 'AI summaries', desc: 'GPT-4o generates concise summaries and action items instantly.' },
          { icon: '🔗', title: 'Webhooks', desc: 'Push meeting data to any tool via webhooks or Zapier.' },
        ].map(f => (
          <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="text-2xl mb-3">{f.icon}</div>
            <div className="font-semibold mb-1">{f.title}</div>
            <div className="text-slate-400 text-sm">{f.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
