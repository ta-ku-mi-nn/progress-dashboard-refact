import React from 'react';
import { Settings, Megaphone } from 'lucide-react';

const SystemSettingsManagement = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border p-4 rounded-md space-y-3">
        <p className="text-sm text-gray-600">
          全ユーザーの画面上部に表示する「お知らせバナー」の設定や、システムを「メンテナンスモード（ログイン制限）」に切り替える機能です。
        </p>
        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          <Megaphone className="w-4 h-4" />
          プレビュー: 【重要】〇月〇日 2:00〜 メンテナンスを実施します。
        </div>
        <p className="text-xs text-gray-400 mt-2">※Phase 2 で実装予定</p>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 border border-gray-200 bg-white text-gray-900 opacity-50 cursor-not-allowed">
          メンテナンス切替
        </button>
        <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 bg-amber-600 opacity-50 cursor-not-allowed text-white">
          お知らせを更新 (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default SystemSettingsManagement;