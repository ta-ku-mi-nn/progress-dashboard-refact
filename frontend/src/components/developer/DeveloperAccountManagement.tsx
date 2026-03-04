// frontend/src/components/developer/DeveloperAccountManagement.tsx
import React, { useState } from 'react';
import { UserPlus, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';

const DeveloperAccountManagement: React.FC = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm('最高権限を持つDeveloperアカウントを発行します。よろしいですか？')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/developer/accounts', formData);
      setSuccess(response.data.message);
      setFormData({ username: '', password: '' }); // 成功したらクリア
    } catch (err: any) {
      setError(err.response?.data?.detail || 'アカウントの作成に失敗しました。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-100 p-4 rounded-md">
        <h3 className="text-red-800 font-bold flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5" />
          取扱注意：Developerアカウントの発行
        </h3>
        <p className="text-sm text-red-700 leading-relaxed">
          このフォームから作成されたアカウントは、初期状態から「developer（最高管理者）」権限を持ちます。
          他のユーザーの権限変更やシステム設定の変更が可能なため、アカウント情報の取り扱いには十分注意してください。
        </p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-md flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-md font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-slate-900 focus:border-slate-900"
            placeholder="例: admin_taro"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">初期パスワード</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-slate-900 focus:border-slate-900"
            placeholder="8文字以上で設定"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> 作成中...</>
            ) : (
              <><UserPlus className="w-4 h-4" /> 開発者アカウントを作成</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DeveloperAccountManagement;