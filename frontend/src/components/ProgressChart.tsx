import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import api from '../lib/api'; // axiosの代わりに既存のapiを使用

interface ChartProps {
  studentId: number;
}

const SUBJECTS = ["全体", "英語", "数学", "国語", "理科", "社会"];

export default function ProgressChart({ studentId }: ChartProps) {
  const [selectedSubject, setSelectedSubject] = useState("全体");
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/charts/progress/${studentId}`, {
          params: { subject: selectedSubject }
        });
        setChartData(res.data);
      } catch (error) {
        console.error("Failed to fetch chart data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, selectedSubject]);

  if (loading) return <div className="p-4 text-center">Loading Chart...</div>;
  if (!chartData) return <div className="p-4 text-center">No Data</div>;

  return (
    <div className="space-y-4">
      {/* 科目切り替えタブ */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {SUBJECTS.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              selectedSubject === subj
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* グラフエリア */}
      <div className="w-full h-[300px]">
        <Plot
          data={[
            {
              x: chartData.datasets[0].data,
              y: chartData.labels,
              name: '完了',
              orientation: 'h',
              type: 'bar',
              marker: { color: '#22c55e' }, // green-500
            },
            {
              x: chartData.datasets[1].data,
              y: chartData.labels,
              name: '未完了',
              orientation: 'h',
              type: 'bar',
              marker: { color: '#e5e7eb' }, // gray-200
            },
          ]}
          layout={{
            barmode: 'stack',
            autosize: true,
            margin: { l: 150, r: 20, t: 20, b: 40 }, // ラベル領域を確保
            showlegend: true,
            legend: { orientation: 'h', y: -0.2 },
            xaxis: { title: '単位数' },
            yaxis: { automargin: true }
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ displayModeBar: false }}
        />
      </div>
    </div>
  );
}
