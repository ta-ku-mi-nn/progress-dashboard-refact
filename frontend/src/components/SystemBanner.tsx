import React from 'react';
import { Megaphone } from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';

const SystemBanner: React.FC = () => {
  const { settings, loading } = useSystem();

  if (loading || !settings || !settings.announcement_enabled || !settings.announcement_message) {
    return null; // 設定がない、または無効な場合は何も表示しない
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 shadow-sm z-50 relative w-full">
      <Megaphone className="w-5 h-5 shrink-0" />
      <p className="text-sm font-medium whitespace-pre-wrap text-center">
        {settings.announcement_message}
      </p>
    </div>
  );
};

export default SystemBanner;