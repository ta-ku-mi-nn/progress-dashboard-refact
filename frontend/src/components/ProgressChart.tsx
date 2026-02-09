import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import api from '../lib/api';

interface ChartProps {
  studentId: number;
}

interface BookData {
  book_name: string;
  completed: number;
  total: number;
  unit: string;
}

export default function ProgressChart({ studentId }: ChartProps) {
  const [subjects, setSubjects] = useState<string[]>(["全体"]);
  const [selectedSubject, setSelectedSubject] = useState("全体");
  const [chartData, setChartData] = useState<BookData[]>([]);
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

  // データの単位を取得（リストの最初の要素から判定、混在時はご容赦）
  const unitLabel = chartData[0]?.unit || "量";

  // Plotly用のデータ生成
  // 参考書ごとに1つの「Trace」を作成します
  const plotData: any[] = chartData.map((item) => ({
    x: [item.completed, item.total], // [達成の値, 予定(全体)の値]
    y: ["達成", "予定"],             // Y軸のラベル
    name: item.book_name,            // 凡例に表示される名前
    type: 'bar',
    orientation: 'h',                // 横棒グラフ
    text: [item.completed.toFixed(1), item.total.toFixed(1)], // バーの上に数値を表示(任意)
    textposition: 'auto',
    hoverinfo: 'name+x',             // ホバー時の表示
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
      <div className="w-full h-[350px]">
        <Plot
          data={plotData}
          layout={{
            barmode: 'stack', // 積み上げ設定
            autosize: true,
            margin: { l: 60, r: 20, t: 30, b: 40 },
            showlegend: true,
            // 凡例をグラフの下に配置する等の調整はお好みで
            legend: { orientation: 'h', y: -0.2 }, 
            xaxis: { 
                title: unitLabel,
                automargin: true,
                zeroline: true,
            },
            yaxis: { 
                automargin: true,
                categoryorder: 'category descending' // "予定"を下、"達成"を上にするなら順序調整が必要かも
            },
            // 参考書ごとに自動で色が変わりますが、
            // 特定のパステルカラーパレットを使いたい場合は colorway を設定します
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
