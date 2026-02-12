import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Printer, Edit2, Clock, Target, TrendingUp, Award, Calendar, FileText } from 'lucide-react';

// コンポーネント読み込み
import ProgressChart from './ProgressChart';
import ProgressList from './ProgressList';

// 型定義
interface Student {
  id: number;
  name: string;
}

interface DashboardData {
  total_study_time: number;
  total_planned_time?: number;
  progress_rate?: number;
  eiken_grade?: string; 
  eiken_score?: string;
  eiken_date?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // 英検編集用State
  const [isEikenModalOpen, setIsEikenModalOpen] = useState(false);
  const [editEikenGrade, setEditEikenGrade] = useState("");
  const [editEikenScore, setEditEikenScore] = useState("");
  const [editEikenDate, setEditEikenDate] = useState("");

  // 表示用に整形したデータを保持するState
  const [displayEiken, setDisplayEiken] = useState({
    grade: "未登録",
    score: "-",
    date: "-"
  });

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

  // 2. ダッシュボード基本データ取得
  const fetchDashboardData = async () => {
    if (!selectedStudentId) return;
    try {
      const res = await api.get(`/dashboard/${selectedStudentId}`);
      setData(res.data);
      
      // === データ解析ロジック ===
      let g = res.data.eiken_grade || "";
      let s = res.data.eiken_score || "";
      let d = res.data.eiken_date || "";

      // 連結文字列の場合の分解処理
      if (s.includes(" / ")) {
          const parts = s.split(" / ");
          g = parts[0] || ""; 
          s = parts[1] || ""; 
          d = parts[2] || ""; 
      }

      // クレンジング
      g = g.replace(" None", "").replace(" 合格", "").replace(" 不合格", "").trim();
      s = s.replace("CSE ", "").trim();

      setDisplayEiken({
          grade: g || "未登録",
          score: s || "-",
          date: d || "-"
      });

      setEditEikenGrade(g);
      setEditEikenScore(s);
      setEditEikenDate(d);

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
      const combinedScore = `${editEikenGrade} / CSE ${editEikenScore} / ${editEikenDate}`;
      await api.patch(`/students/${selectedStudentId}/eiken`, { 
          score: combinedScore
      });
      setIsEikenModalOpen(false);
      fetchDashboardData();
    } catch (e) {
      alert("更新失敗");
    }
  };

  // ★修正: 印刷ボタン (PDF発行)
  const handlePrint = () => {
    if (!selectedStudentId) return;

    // APIのベースURLを取得 (環境変数またはデフォルト)
    // api.defaults.baseURL は axios の設定から取得できますが、
    // 確実にURLを構築するために import.meta.env を優先します
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    
    // 末尾のスラッシュを削除して整形
    const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

    // PDF生成エンドポイント
    const pdfUrl = `${cleanBaseURL}/dashboard/report/${selectedStudentId}`;
    
    // 新しいタブで開く
    window.open(pdfUrl, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
  if (!selectedStudentId) return <div className="p-8 text-center">生徒が選択されていません</div>;

  return (
    <div className="flex flex-col gap-6 h-full p-1">
      {/* ヘッダーエリア */}
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
          {/* ★修正: ボタンのアイコンとラベルを変更 */}
          <Button variant="outline" onClick={handlePrint}>
            <FileText className="w-4 h-4 mr-2" /> PDF出力
          </Button>
        </div>
      </div>

      {/* メインコンテンツエリア: 左右2分割 (1:1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start print:block h-full">
        
        {/* === 左列: グラフ(上) + KPI(下) === */}
        <div className="flex flex-col gap-4 w-full h-full">
            
            {/* 1. グラフコンポーネント (上) */}
            <div className="w-full flex-1 min-h-[300px]">
                <ProgressChart studentId={selectedStudentId} />
            </div>

            {/* 2. KPIカード群 (下: 2x2グリッド) */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
                {/* 総学習時間 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-sm font-medium">総学習時間</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold">{data?.total_study_time || 0}<span className="text-sm font-normal ml-1">時間</span></div>
                        <p className="text-xs text-muted-foreground mt-1">累計学習時間</p>
                    </CardContent>
                </Card>

                {/* 学習予定時間 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-sm font-medium">学習予定</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold">{data?.total_planned_time || 0}<span className="text-sm font-normal ml-1">時間</span></div>
                        <p className="text-xs text-muted-foreground mt-1">登録された総目安時間</p>
                    </CardContent>
                </Card>

                {/* 達成率 */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-sm font-medium">達成率</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="text-2xl font-bold">{data?.progress_rate || 0}<span className="text-sm font-normal ml-1">%</span></div>
                        <p className="text-xs text-muted-foreground mt-1">完了数 / 全登録数</p>
                    </CardContent>
                </Card>
                
                {/* 英検スコア (3項目表示) */}
                <Card className="relative">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 h-6 w-6 p-0 print:hidden" 
                        onClick={() => setIsEikenModalOpen(true)}
                    >
                        <Edit2 className="w-3 h-3 text-gray-500" />
                    </Button>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                        <CardTitle className="text-sm font-medium">英検スコア</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="flex flex-col gap-0.5">
                            <div className="text-lg font-bold truncate leading-tight">
                                {displayEiken.grade}
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                                CSE: {displayEiken.score}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {displayEiken.date}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* === 右列: 参考書リスト === */}
        <div className="w-full h-full overflow-hidden rounded-lg border bg-white shadow-sm print:h-auto print:overflow-visible">
            <div className="h-full overflow-y-auto p-1">
                <ProgressList studentId={selectedStudentId} />
            </div>
        </div>

      </div>

      {/* 英検編集モーダル */}
      <Dialog open={isEikenModalOpen} onOpenChange={setIsEikenModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>英検情報編集</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="grade">級</Label>
                    <Input 
                        id="grade"
                        value={editEikenGrade} 
                        onChange={(e) => setEditEikenGrade(e.target.value)} 
                        placeholder="例: 準2級" 
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="score">CSEスコア</Label>
                    <Input 
                        id="score"
                        value={editEikenScore} 
                        onChange={(e) => setEditEikenScore(e.target.value)} 
                        placeholder="例: 1950" 
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="date">試験日</Label>
                <Input 
                    id="date"
                    value={editEikenDate} 
                    onChange={(e) => setEditEikenDate(e.target.value)} 
                    placeholder="例: 2025-06-01" 
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
