import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import ProgressChart from './ProgressChart';
import ProgressList from './ProgressList';
import api from '../lib/api';

// データ型の定義 (types.ts に移動してもOKです)
interface DashboardSummary {
  total_progress: number;
  latest_eiken: {
    grade: string;
    score: number;
    result: string;
  } | null;
}

export default function Dashboard({ studentId }: { studentId: number }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get(`/dashboard/summary/${studentId}`);
        setSummary(res.data);
      } catch (e) {
        console.error("Failed to fetch summary", e);
      }
    };
    fetchSummary();
  }, [studentId]);

  return (
    <div className="space-y-6">
      {/* 上段: チャートとリスト */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3">
        {/* 左側: 進捗チャート (幅広) */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>学習進捗チャート</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart studentId={studentId} />
          </CardContent>
        </Card>

        {/* 右側: 参考書リスト */}
        <Card className="md:col-span-1 h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>参考書リスト</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0 pb-4 px-4">
            <ProgressList studentId={studentId} />
          </CardContent>
        </Card>
      </div>

      {/* 下段: KPIカード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 達成率カード */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              参考書達成率 (平均)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_progress ?? 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">全科目の平均進捗</p>
          </CardContent>
        </Card>

        {/* 英検カード */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              最新 英検結果
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.latest_eiken ? (
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{summary.latest_eiken.grade}</span>
                    <span className={`text-xs px-2 py-0.5 rounded text-white ${
                        summary.latest_eiken.result === "合格" ? "bg-green-500" : "bg-red-500"
                    }`}>
                        {summary.latest_eiken.result}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">CSEスコア: {summary.latest_eiken.score}</p>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">データなし</div>
            )}
          </CardContent>
        </Card>
        
        {/* 学習時間カード (プレースホルダー) */}
        <Card className="opacity-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              学習時間 (週間)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
