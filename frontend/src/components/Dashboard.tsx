import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Printer, Edit2, Clock, Award } from 'lucide-react';

// 型定義
interface Student {
  id: number;
  name: string;
}

interface DashboardData {
  total_study_time: number;
  eiken_score?: string;
  // 必要に応じて他のプロパティを追加
}

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // 英検編集用State
  const [isEikenModalOpen, setIsEikenModalOpen] = useState(false);
  const [editEikenScore, setEditEikenScore] = useState("");

  // 1. 生徒一覧取得 & 初期選択
  useEffect(() => {
    const init = async () => {
      if (!user) return;
      try {
        if ((user as any).student_id) {
          setSelectedStudentId((user as any).student_id);
          setLoading(false);
          return;
        }
        const res = await api.get('/students');
        setStudents(res.data);
        if (res.data.length > 0) setSelectedStudentId(res.data[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  // 2. ダッシュボードデータ取得
  const fetchDashboardData = async () => {
    if (!selectedStudentId) return;
    try {
      const res = await api.get(`/dashboard/${selectedStudentId}`);
      setData(res.data);
      setEditEikenScore(res.data.eiken_score || "");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedStudentId]);

  // 3. 英検スコア更新
  const handleUpdateEiken = async () => {
    try {
      await api.patch(`/students/${selectedStudentId}/eiken`, { score: editEikenScore });
      setIsEikenModalOpen(false);
      fetchDashboardData();
    } catch (e) {
      alert("更新失敗");
    }
  };

  // 4. 印刷
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* ヘッダーエリア: 生徒選択と印刷ボタン */}
      <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <h2 className="text-2xl font-bold tracking-tight">学習ダッシュボード</h2>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {students.length > 0 && (
            <div className="w-full md:w-64">
              <Select value={String(selectedStudentId)} onValueChange={(val) => setSelectedStudentId(Number(val))}>
                <SelectTrigger><SelectValue placeholder="生徒を選択" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> 印刷
          </Button>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-y-auto space-y-4 print:overflow-visible">
        {/* KPIカード */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総学習時間</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.total_study_time || 0}時間</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">英検スコア</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{data?.eiken_score || "未登録"}</div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 print:hidden" onClick={() => setIsEikenModalOpen(true)}>
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* グラフエリア等 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader><CardTitle>学習推移</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gray-50 text-muted-foreground">
                    グラフコンポーネント
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader><CardTitle>最近の活動</CardTitle></CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center bg-gray-50 text-muted-foreground">
                    アクティビティリスト
                </CardContent>
            </Card>
        </div>
      </div>

      {/* 英検編集モーダル */}
      <Dialog open={isEikenModalOpen} onOpenChange={setIsEikenModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>英検スコア編集</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Input 
                value={editEikenScore} 
                onChange={(e) => setEditEikenScore(e.target.value)} 
                placeholder="例: 準2級 合格 / CSE 2000" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateEiken}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
