import React from 'react';
import { UserCog } from 'lucide-react';

const RoleManagement = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border p-4 rounded-md">
        <p className="text-sm text-gray-600">
          登録されている講師アカウントに対して、「Admin（管理者）」や「Developer（開発者）」の権限を付与・剥奪する画面です。
        </p>
        <p className="text-xs text-gray-400 mt-2">※Phase 3 で実装予定</p>
      </div>
      <div className="flex justify-end pt-4">
        <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 bg-blue-600 opacity-50 cursor-not-allowed text-white">
          <UserCog className="w-4 h-4 mr-2" />
          権限管理を開く (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default RoleManagement;