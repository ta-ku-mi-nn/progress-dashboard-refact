import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import api from '../api/axios';

interface ProgressChartProps {
  studentId: string;
}

interface ChartData {
  data: any[];
  layout: any;
}

const ProgressChart: React.FC<ProgressChartProps> = ({ studentId }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setChartData(null);
      return;
    }

    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/charts/progress/${studentId}`);
        setChartData(response.data);
      } catch (err) {
        console.error("グラフデータの取得に失敗:", err);
        setError("データの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [studentId]);

  if (!studentId) return <div style={{ color: '#666', padding: '20px' }}>生徒を選択してください</div>;
  if (loading) return <div style={{ padding: '20px' }}>読み込み中...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  if (!chartData) return <div style={{ padding: '20px' }}>データがありません</div>;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '400px' }}>
      <Plot
        data={chartData.data}
        layout={{
          ...chartData.layout,
          autosize: true,
          margin: { l: 50, r: 20, t: 30, b: 50 },
          legend: { orientation: 'h', y: -0.2 }
        }}
        useResizeHandler={true}
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
};

export default ProgressChart;