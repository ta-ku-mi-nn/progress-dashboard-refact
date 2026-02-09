import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ChartData {
  labels: string[];
  datasets: { label: string; data: number[]; color: string }[];
}

const SUBJECTS = ["全体", "英語", "数学", "国語", "理科", "社会"];

export const ProgressChart: React.FC<{ studentId: number }> = ({ studentId }) => {
  const [selectedSubject, setSelectedSubject] = useState("全体");
  const [chartData, setChartData] = useState<ChartData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/charts/progress/${studentId}`, {
          params: { subject: selectedSubject }
        });
        setChartData(res.data);
      } catch (error) {
        console.error("チャートデータの取得に失敗しました", error);
      }
    };
    fetchData();
  }, [studentId, selectedSubject]);

  if (!chartData) return <div>読み込み中...</div>;

  return (
    <div className="bg-white p-4 rounded shadow">
      {/* 科目切り替えタブ */}
      <div className="flex space-x-2 mb-4 overflow-x-auto">
        {SUBJECTS.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              selectedSubject === subj 
                ? "bg-blue-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* グラフ描画エリア */}
      <div className="h-64 relative">
        <p className="text-center text-gray-500 mb-2">
          {selectedSubject}の進捗 (積み上げ棒グラフ)
        </p>
        
        {/* 簡易的な可視化（ライブラリがある場合は置き換えてください） */}
        <div className="flex flex-col space-y-2 h-full overflow-y-auto">
            {chartData.labels.map((label, idx) => {
                const done = chartData.datasets[0].data[idx];
                const remain = chartData.datasets[1].data[idx];
                const total = done + remain;
                const donePct = total > 0 ? (done / total) * 100 : 0;
                
                return (
                    <div key={idx} className="flex items-center text-xs">
                        <span className="w-24 truncate mr-2 text-right">{label}</span>
                        <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden flex">
                            <div style={{ width: `${donePct}%` }} className="bg-green-500 h-full"></div>
                        </div>
                        <span className="ml-2 w-16 text-gray-600">{done}/{total}</span>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};
