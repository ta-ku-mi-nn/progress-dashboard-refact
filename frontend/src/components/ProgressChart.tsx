import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import api from '../lib/api';

interface ChartProps {
  studentId: number;
}

interface ChartItem {
  name: string;
  completed: number;
  total: number;
  type: string;
}

export default function ProgressChart({ studentId }: ChartProps) {
  const [subjects, setSubjects] = useState<string[]>(["全体"]);
  const [selectedSubject, setSelectedSubject] = useState("全体");
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 科目一覧取得
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get(`/charts/subjects/${studentId}`);
        if (res.data && res.data.length > 0) {
          setSubjects(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch subjects", error);
      }
    };
    if (studentId) fetchSubjects();
  }, [studentId]);

  // チャートデータ取得
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
    if (studentId) fetchData();
  }, [studentId, selectedSubject]);

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">読み込み中...</div>;
  if (!chartData || chartData.length === 0) return <div className="p-4 text-center text-sm text-muted-foreground">データがありません</div>;

  // Plotly用のデータ生成
  const plotData: any[] = chartData.map((item) => ({
    x: [item.completed, item.total], // [達成, 予定]
    y: ["達成", "予定"],             // Y軸
    name: item.name,                 // 積み上げ要素名（科目or参考書）
    type: 'bar',
    orientation: 'h',                // 横棒
    hoverinfo: 'name+x',             // ホバー時に名前と数値を表示
    // text: ... プロパティを削除してグラフ内の数値を消去
  }));

  return (
    <div className="space-y-4">
      {/* 科目切り替えタブ */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        {subjects.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-3 py-1 text-sm rounded-full transition-colors whitespace-nowrap ${
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
          data={plotData}
          layout={{
            barmode: 'stack',
            autosize: true,
            margin: { l: 60, r: 20, t: 10, b: 30 }, // 余白調整
            showlegend: false, // ★凡例を非表示
            xaxis: { 
                automargin: true,
                zeroline: true,
            },
            yaxis: { 
                automargin: true,
                categoryorder: 'category descending'
            },
            // 配色パレット
            colorway: [
                '#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A', 
                '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FECB52'
            ]
          }}
          useResizeHandler={true}
          style={{ width: '100%', height: '100%' }}
          config={{ displayModeBar: false }}
        />
      </div>
    </div>
  );
}
