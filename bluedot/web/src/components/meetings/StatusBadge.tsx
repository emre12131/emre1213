import clsx from 'clsx';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  RECORDING:  { label: 'Recording',  classes: 'bg-red-500/10    text-red-400    border-red-500/20'    },
  PROCESSING: { label: 'Processing', classes: 'bg-amber-500/10  text-amber-400  border-amber-500/20'  },
  COMPLETED:  { label: 'Completed',  classes: 'bg-green-500/10  text-green-400  border-green-500/20'  },
  FAILED:     { label: 'Failed',     classes: 'bg-slate-500/10  text-slate-400  border-slate-500/20'  },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.FAILED;
  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', cfg.classes)}>
      {cfg.label}
    </span>
  );
}
