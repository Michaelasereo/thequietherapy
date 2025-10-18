import React from 'react';
import { Mail } from 'lucide-react';

interface WarmMagicLinkNotificationProps {
  message: string;
}

export default function WarmMagicLinkNotification({ message }: WarmMagicLinkNotificationProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start">
        {/* Circular info icon with warm theme */}
        <div className="w-5 h-5 rounded-full bg-slate-800 text-amber-50 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">
          <Mail className="h-3 w-3" />
        </div>
        
        {/* Message text */}
        <div className="text-slate-800">
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
