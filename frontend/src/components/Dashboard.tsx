import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import ProgressChart from './ProgressChart';
import ProgressList from './ProgressList';
import api from '../lib/api';

interface DashboardSummary {
  total_progress: number;
  total_planned_time: number;
  total_completed_time: number;
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
      {/* メインのGridレイアウト 
        lg:grid-cols-12 を使用して細かい比率調整を行います。
        左(グラフ側): 5/12
        右(リスト側): 7/12 (リストを広く)
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* 左カラム: グラフ + KPI (2x2) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 上段: 学習進捗チャート */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>学習進捗チャート</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart studentId={studentId} />
            </CardContent>
          </Card>

          {/* 下段: KPI 2x2 グリッド */}
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* 1. 達成済時間 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  達成済時間
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.total_completed_time ?? 0} <span className="text-sm font-normal text-muted-foreground">h</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. 予定総時間 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  予定総時間
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.total_planned_time ?? 0} <span className="text-sm font-normal text-muted-foreground">h</span>
                </div>
              </CardContent>
            </Card>

            {/* 3. 達成率 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  達成率 (平均)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary?.total_progress ?? 0} <span className="text-sm font-normal text-muted-foreground">%</span>
                </div>
              </CardContent>
            </Card>

            {/* 4. 英検スコア */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  英検スコア
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.latest_eiken ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl font-bold">{summary.latest_eiken.grade}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                            summary.latest_eiken.result === "合格" ? "bg-green-500" : "bg-red-500"
                        }`}>
                            {summary.latest_eiken.result}
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground">CSE: {summary.latest_eiken.score}</p>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-sm">データなし</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 右カラム: 参考書リスト (高さを合わせる) */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>参考書リスト</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 pb-4 px-4 h-[500px] lg:h-auto">
              {/* 高さを親に合わせるため h-full などを渡す工夫が必要ですが、
                  ProgressList側で flex-1 overflow-auto しているので
                  親の高さが決まっていれば自動でスクロールします */}
              <ProgressList studentId={studentId} />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
