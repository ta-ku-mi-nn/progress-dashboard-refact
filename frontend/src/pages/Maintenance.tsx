import React from 'react';
import { Settings } from 'lucide-react';

const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-amber-100 text-amber-600 rounded-full animate-pulse">
            <Settings className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">システムメンテナンス中</h1>
        <p className="text-gray-600 leading-relaxed">
          現在、システムのメンテナンスを行っております。
          <br />
          ご不便をおかけしますが、終了までしばらくお待ちください。
        </p>
        <div className="pt-4 border-t border-gray-100 text-sm text-gray-400">
          ※管理者（Developer）の方は、専用URLからログイン可能です。
        </div>
      </div>
    </div>
  );
};

export default Maintenance;