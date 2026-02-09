import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProgressItem } from '../types';

export const ProgressList: React.FC<{ studentId: number }> = ({ studentId }) => {
  const [progressList, setProgressList] = useState<ProgressItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProgressItem | null>(null);
  const [newCompleted, setNewCompleted] = useState(0);

  const fetchList = async () => {
      // リスト取得用のエンドポイント（/charts/progress を流用するか、専用のものを作成）
      // ここでは仮に /api/charts/progress/{studentId} のデータを加工するか、
      // 専用の /api/progress/list/{studentId} があると想定します。
      // 実装に合わせて調整してください。
      try {
        // ※ここでは例としてチャートと同じAPIを叩いていますが、実際にはリスト用APIを推奨します
         const res = await axios.get(`/api/progress/list/${studentId}`); 
         setProgressList(res.data);
      } catch (e) {
         console.error(e);
      }
  };

  useEffect(() => {
    fetchList();
  }, [studentId]);

  const handleEditClick = (item: ProgressItem) => {
    setEditingItem(item);
    setNewCompleted(item.completed_units);
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      await axios.patch(`/api/progress/${editingItem.id}`, {
        completed_units: Number(newCompleted)
      });
      setIsModalOpen(false);
      setEditingItem(null);
      fetchList(); // リストを再取得
    } catch (error) {
      alert("更新に失敗しました");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow h-full overflow-hidden flex flex-col">
      <h3 className="font-bold text-gray-700 mb-2 text-lg">参考書リスト</h3>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 sticky top-0">
            <tr>
              <th className="p-2">科目</th>
              <th className="p-2">参考書</th>
              <th className="p-2 text-center">進捗</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {progressList.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{item.subject}</td>
                <td className="p-2 truncate max-w-[120px]" title={item.reference_book}>
                    {item.reference_book}
                </td>
                <td className="p-2 text-center">
                  {item.completed_units} / {item.total_units}
                </td>
                <td className="p-2 text-right">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="text-blue-600 hover:text-blue-800 text-xs border border-blue-600 rounded px-2 py-0.5"
                  >
                    更新
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 更新用モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h4 className="font-bold mb-4">進捗更新</h4>
            <p className="mb-2 text-sm text-gray-600">{editingItem?.reference_book}</p>
            <input 
              type="number" 
              className="w-full border p-2 rounded mb-4"
              value={newCompleted}
              onChange={(e) => setNewCompleted(Number(e.target.value))}
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                キャンセル
              </button>
              <button 
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
