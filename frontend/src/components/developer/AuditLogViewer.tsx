import React from 'react';
import { FileSearch } from 'lucide-react';

const AuditLogViewer = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border p-4 rounded-md">
        <p className="text-sm text-gray-600">
          「いつ・誰が・どのデータを変更したか」を追跡するための監査ログビューアーです。誤操作時の原因調査や、不正アクセスの検知に使用します。
        </p>
        <p className="text-xs text-gray-400 mt-2">※Phase 3 で実装予定</p>
      </div>
      <div className="flex justify-end pt-4">
        <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 bg-slate-700 opacity-50 cursor-not-allowed text-white">
          <FileSearch className="w-4 h-4 mr-2" />
          ログを閲覧 (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default AuditLogViewer;