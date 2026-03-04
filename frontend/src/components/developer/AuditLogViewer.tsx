// frontend/src/components/common/AuditLogViewer.tsx
// ※DeveloperとAdminの両方で使うので、commonフォルダあたりに置くのがおすすめです！

import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/api';

// バックエンドのスキーマに合わせた型定義
interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  branch_id: number | null;
  details: string | null;
  timestamp: string;
}

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/audit/logs');
      setLogs(response.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('監査ログの取得に失敗しました。権限を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 日時を日本時間にフォーマットする関数
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  // アクションの種類によってバッジの色を変えるカッコいい演出
  const getActionBadge = (action: string) => {
    const upperAction = action.toUpperCase();
    if (upperAction.includes('DELETE') || upperAction.includes('DROP') || upperAction.includes('FAIL')) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">{action}</span>;
    }
    if (upperAction.includes('UPDATE') || upperAction.includes('EDIT')) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">{action}</span>;
    }
    if (upperAction.includes('LOGIN')) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">{action}</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">{action}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-gray-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>ログを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold">システム監査ログ</h2>
        </div>
        <button 
          onClick={fetchLogs}
          className="text-sm flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> 更新
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 shadow-sm">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap"><Clock className="w-4 h-4 inline mr-1"/>日時</th>
                <th className="px-4 py-3 whitespace-nowrap"><Activity className="w-4 h-4 inline mr-1"/>アクション</th>
                <th className="px-4 py-3 whitespace-nowrap"><User className="w-4 h-4 inline mr-1"/>ユーザーID</th>
                <th className="px-4 py-3 whitespace-nowrap"><MapPin className="w-4 h-4 inline mr-1"/>校舎ID</th>
                <th className="px-4 py-3">詳細情報</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    記録されたログはありません。
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{formatDate(log.timestamp)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">{log.user_id || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{log.branch_id || 'ALL'}</td>
                    <td className="px-4 py-3 text-gray-500 truncate max-w-xs" title={log.details || ''}>
                      {log.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;