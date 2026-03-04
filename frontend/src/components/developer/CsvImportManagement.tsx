import React from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';

const CsvImportManagement = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border p-4 rounded-md">
        <p className="text-sm text-gray-600">
          新年度の生徒データや、外部模試の成績データなどをCSVファイルから一括でデータベースにインポートする機能です。
        </p>
        <div className="mt-3 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center bg-white">
          <FileSpreadsheet className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">CSVファイルをここにドラッグ＆ドロップ</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">※Phase 4 で実装予定</p>
      </div>
      <div className="flex justify-end pt-4">
        <button disabled className="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 bg-emerald-600 opacity-50 cursor-not-allowed text-white">
          <Upload className="w-4 h-4 mr-2" />
          インポート実行 (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default CsvImportManagement;