import React from 'react';
import { UserPlus } from 'lucide-react';

const DeveloperAccountManagement = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border p-4 rounded-md">
        <p className="text-sm text-gray-600">
          新しい開発者用アカウントを発行したり、不要になった開発者アカウントを停止・削除するための管理画面です。
        </p>
        <p className="text-xs text-gray-400 mt-2">※Phase 3 で実装予定</p>
      </div>
      <div className="flex justify-end pt-4">
        <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 bg-indigo-600 opacity-50 cursor-not-allowed text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          開発者を追加 (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default DeveloperAccountManagement;