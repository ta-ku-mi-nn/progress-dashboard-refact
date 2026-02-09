import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ProgressChart } from './ProgressChart';
import { ProgressList } from './ProgressList';
import { DashboardSummary } from '../types';

export const Dashboard: React.FC<{ studentId: number }> = ({ studentId }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`/api/dashboard/summary/${studentId}`);
        setSummary(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSummary();
  }, [studentId]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">学習ダッシュボード</h2>

      {/* 上段: チャート & リスト */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 左側: 進捗チャート (PCでは2/3の幅) */}
        <div className="lg:col-span-2">
          <ProgressChart studentId={studentId} />
        </div>
        
        {/* 右側: 進捗リスト (PCでは1/3の幅) */}
        <div className="lg:col-span-1 h-96 lg:h-auto">
          <ProgressList studentId={studentId} />
        </div>
      </div>

      {/* 下段: KPIカードエリア */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 参考書達成率カード */}
        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-bold uppercase">参考書達成率</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {summary?.total_progress ?? 0}%
          </p>
        </div>

        {/* 英検スコアカード */}
        <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500 font-bold uppercase">最新英検結果</p>
          <div className="mt-2">
            {summary?.latest_eiken ? (
              <>
                <span className="text-2xl font-bold text-gray-800 mr-2">
                  {summary.latest_eiken.grade}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs text-white ${
                    summary.latest_eiken.result === "合格" ? "bg-green-500" : "bg-red-500"
                }`}>
                    {summary.latest_eiken.result}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                    CSE: {summary.latest_eiken.score}
                </p>
              </>
            ) : (
              <p className="text-gray-400 text-sm">データなし</p>
            )}
          </div>
        </div>

        {/* 将来の拡張用カード（例：学習時間） */}
        <div className="bg-white p-4 rounded shadow border-l-4 border-purple-500 opacity-50">
            <p className="text-sm text-gray-500 font-bold uppercase">学習時間 (週間)</p>
            <p className="text-xl font-bold text-gray-800 mt-2">Coming Soon</p>
        </div>
      </div>
    </div>
  );
};
