import React from 'react';
import { ServiceAlert } from '@/data/realtime';

interface Props {
  alerts: ServiceAlert[];
  dismissed: Set<string>;
  onDismiss: (id: string) => void;
}

export function AlertBanners({ alerts, dismissed, onDismiss }: Props) {
  const visible = alerts.filter(a => !dismissed.has(a.entityId)).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-8" role="status" aria-live="polite">
      {visible.map(alert => (
        <div key={alert.entityId} className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 text-amber-900 px-5 py-4 rounded-2xl">
          <span className="text-xl flex-shrink-0" aria-hidden>⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm leading-tight">{alert.header}</p>
            {alert.description && (
              <p className="text-xs font-medium mt-1 opacity-80 line-clamp-2">{alert.description}</p>
            )}
          </div>
          <button
            aria-label="Dismiss alert"
            className="text-amber-500 font-black text-xs flex-shrink-0 hover:text-amber-800 transition-colors"
            onClick={() => onDismiss(alert.entityId)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
