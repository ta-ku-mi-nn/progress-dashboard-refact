// frontend/src/components/admin/StudyTimeVerification.tsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertCircle } from 'lucide-react';

interface StudyTimeSummary {
  student_id: number;
  name: string;
  grade: string;
  planned_time: number;
  actual_time: number;
  diff: number;
}

export default function StudyTimeVerification() {
    const [summaryData, setSummaryData] = useState<StudyTimeSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // バックエンドのAPIを叩く
                const res = await api.get('dashboard/admin/study-time-summary');
                setSummaryData(res.data);
            } catch (error) {
                console.error("集計データの取得に失敗しました", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) return <div className="p-4 text-muted-foreground text-center">データを集計中...</div>;

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 flex items-start gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-bold mb-1">チェックのポイント</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>予定時間と実績時間の差（乖離）が <strong>±10時間以上</strong> ある生徒</li>
                        <li>予定時間が0なのに実績時間が入っている生徒（入力設定漏れの可能性）</li>
                    </ul>
                    <p className="mt-2 text-xs opacity-80">※該当する生徒は赤くハイライト表示されます。</p>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-16 text-center">学年</TableHead>
                            <TableHead>生徒名</TableHead>
                            <TableHead className="text-right">学習予定時間</TableHead>
                            <TableHead className="text-right">総学習時間 (実績)</TableHead>
                            <TableHead className="text-right">差分 (実績 - 予定)</TableHead>
                            <TableHead className="text-center w-24">アラート</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {summaryData.map((row) => {
                            // ★ 違和感検知ロジック
                            const isWarning = Math.abs(row.diff) >= 10 || (row.planned_time === 0 && row.actual_time > 0);
                            
                            return (
                                <TableRow 
                                    key={row.student_id} 
                                    className={isWarning ? "bg-red-50 hover:bg-red-100/80 transition-colors" : ""}
                                >
                                    <TableCell className="text-xs text-muted-foreground text-center">{row.grade}</TableCell>
                                    <TableCell className="font-bold">{row.name}</TableCell>
                                    <TableCell className="text-right font-medium">{row.planned_time} h</TableCell>
                                    <TableCell className="text-right font-medium text-blue-600">{row.actual_time} h</TableCell>
                                    <TableCell className={`text-right font-bold ${row.diff > 0 ? 'text-green-600' : row.diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                        {row.diff > 0 ? '+' : ''}{row.diff} h
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {isWarning && (
                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded font-bold border border-red-200 shadow-sm">
                                                要確認
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {summaryData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">データがありません</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}