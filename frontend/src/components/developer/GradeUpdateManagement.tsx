import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import api from '../../lib/api';

const GradeUpdateManagement = ({ onUpdate }: { onUpdate: () => void }) => {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleForceUpdateGrades = async () => {
    setUpdateStatus('loading');
    try {
      const response = await api.post('/developer/force-update-grades');
      alert(`成功: ${response.data.updated_count}名の学年を更新しました。`);
      setUpdateStatus('success');
      onUpdate(); // 完了後にダッシュボードの数値を再取得
    } catch (error) {
      console.error("Grade update failed", error);
      alert("エラー: 学年の更新に失敗しました。");
      setUpdateStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-800">
        <strong>注意:</strong> 全生徒の学年を1つ繰り上げます（中1→中2など）。※既卒・退塾済は除く。<br/><br/>
        この処理は毎年3/1に自動実行されます。手動実行する場合は、二重更新にならないよう十分に注意してください。
      </div>
      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleForceUpdateGrades} 
          disabled={updateStatus === 'loading'}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          {updateStatus === 'loading' ? (
            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> 実行中...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" /> 強制更新を実行</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default GradeUpdateManagement;