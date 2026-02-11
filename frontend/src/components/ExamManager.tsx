import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Calendar, FileText, BarChart2, Clock, CheckCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../lib/api';

interface ExamManagerProps {
  studentId: number;
}

// --- 型定義 ---
interface Acceptance {
  id: number;
  university_name: string;
  faculty_name: string;
  department_name: string;
  exam_system: string;
  result: string;
  application_deadline: string;
  exam_date: string;
  announcement_date: string;
  procedure_deadline: string;
}

interface PastExam {
  id: number;
  date: string;
  university_name: string;
  faculty_name: string;
  exam_system: string;
  year: number;
  subject: string;
  time_required: number;
  total_time_allowed: number;
  correct_answers: number;
  total_questions: number;
}

interface MockExam {
  id: number;
  mock_exam_name: string;
  exam_date: string;
  grade: string;
  result_type: string;
  mock_exam_format: string;
  round: string;
  
  // 記述式
  subject_kokugo_desc?: string | number;
  subject_math_desc?: string | number;
  subject_english_desc?: string | number;
  subject_rika1_desc?: string | number;
  subject_rika2_desc?: string | number;
  subject_shakai1_desc?: string | number;
  subject_shakai2_desc?: string | number;
  
  // マーク式
  subject_kokugo_mark?: string | number;
  subject_math1a_mark?: string | number;
  subject_math2bc_mark?: string | number;
  subject_english_r_mark?: string | number;
  subject_english_l_mark?: string | number;
  subject_rika1_mark?: string | number;
  subject_rika2_mark?: string | number;
  subject_shakai1_mark?: string | number;
  subject_shakai2_mark?: string | number;
  subject_rika_kiso1_mark?: string | number;
  subject_rika_kiso2_mark?: string | number;
  subject_info_mark?: string | number;
}

// --- カレンダー用ユーティリティ ---
const getCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0:Sun
  
  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  
  // 5行(35マス)確保する
  while (days.length < 35) {
      days.push(null);
  }
  return days;
};

export default function ExamManager({ studentId }: ExamManagerProps) {
  // ★修正: タブ初期値を「過去問」に変更
  const [activeTab, setActiveTab] = useState("past_exam");

  // --- State ---
  const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
  const [pastExams, setPastExams] = useState<PastExam[]>([]);
  const [mockExams, setMockExams] = useState<MockExam[]>([]);

  // Modals
  const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
  const [newAcceptance, setNewAcceptance] = useState<Partial<Acceptance>>({});

  const [isPastModalOpen, setIsPastModalOpen] = useState(false);
  const [newPastExam, setNewPastExam] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    year: new Date().getFullYear(),
    correct_answers: 0, total_questions: 0, time_required: 0, total_time_allowed: 0
  });

  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [selectedMockExam, setSelectedMockExam] = useState<MockExam | null>(null);
  const [isMockDetailOpen, setIsMockDetailOpen] = useState(false);
  const [newMockExam, setNewMockExam] = useState<Partial<MockExam>>({
      result_type: "マーク", mock_exam_name: "", grade: ""
  });

  const [currentDate, setCurrentDate] = useState(new Date());

  // --- データ取得 ---
  const fetchData = async () => {
    try {
        const [accRes, pastRes, mockRes] = await Promise.all([
            api.get(`/exams/acceptance/${studentId}`),
            api.get(`/exams/pastexam/${studentId}`),
            api.get(`/exams/mock/${studentId}`)
        ]);
        setAcceptances(accRes.data);
        setPastExams(pastRes.data);
        setMockExams(mockRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (studentId) fetchData();
  }, [studentId]);

  // --- ハンドラ ---
  const handleAddAcceptance = async () => {
    try {
      await api.post('/exams/acceptance', { student_id: studentId, ...newAcceptance });
      setIsAcceptanceModalOpen(false); setNewAcceptance({}); fetchData();
    } catch (e) { alert("登録失敗"); }
  };
  const handleDeleteAcceptance = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try { await api.delete(`/exams/acceptance/${id}`); fetchData(); } catch (e) { alert("削除失敗"); }
  };
  const handleUpdateResult = async (id: number, newResult: string) => {
    try { await api.patch(`/exams/acceptance/${id}`, { result: newResult }); fetchData(); } catch (e) { console.error(e); }
  };

  const handleAddPastExam = async () => {
    try {
      await api.post('/exams/pastexam', { student_id: studentId, ...newPastExam });
      setIsPastModalOpen(false); setNewPastExam({date: new Date().toISOString().split('T')[0], year: new Date().getFullYear(), correct_answers:0, total_questions:0, time_required:0, total_time_allowed:0}); fetchData();
    } catch (e) { alert("登録失敗"); }
  };
  const handleDeletePastExam = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try { await api.delete(`/exams/pastexam/${id}`); fetchData(); } catch (e) { alert("削除失敗"); }
  };

  const handleAddMockExam = async () => {
    try {
      const toNum = (val: string | number | undefined) => {
          if (val === "" || val === undefined || val === null) return null;
          return Number(val);
      };

      const payload = {
          student_id: studentId,
          ...newMockExam,
          mock_exam_format: newMockExam.result_type,
          round: newMockExam.round || "1",
          grade: "-", 
          
          subject_kokugo_desc: toNum(newMockExam.subject_kokugo_desc),
          subject_math_desc: toNum(newMockExam.subject_math_desc),
          subject_english_desc: toNum(newMockExam.subject_english_desc),
          subject_rika1_desc: toNum(newMockExam.subject_rika1_desc),
          subject_rika2_desc: toNum(newMockExam.subject_rika2_desc),
          subject_shakai1_desc: toNum(newMockExam.subject_shakai1_desc),
          subject_shakai2_desc: toNum(newMockExam.subject_shakai2_desc),
          
          subject_kokugo_mark: toNum(newMockExam.subject_kokugo_mark),
          subject_math1a_mark: toNum(newMockExam.subject_math1a_mark),
          subject_math2bc_mark: toNum(newMockExam.subject_math2bc_mark),
          subject_english_r_mark: toNum(newMockExam.subject_english_r_mark),
          subject_english_l_mark: toNum(newMockExam.subject_english_l_mark),
          subject_rika1_mark: toNum(newMockExam.subject_rika1_mark),
          subject_rika2_mark: toNum(newMockExam.subject_rika2_mark),
          subject_shakai1_mark: toNum(newMockExam.subject_shakai1_mark),
          subject_shakai2_mark: toNum(newMockExam.subject_shakai2_mark),
          subject_rika_kiso1_mark: toNum(newMockExam.subject_rika_kiso1_mark),
          subject_rika_kiso2_mark: toNum(newMockExam.subject_rika_kiso2_mark),
          subject_info_mark: toNum(newMockExam.subject_info_mark),
      };

      await api.post('/exams/mock', payload);
      setIsMockModalOpen(false); 
      setNewMockExam({result_type: "マーク", mock_exam_name: "", grade: ""}); 
      fetchData();
    } catch (e) { alert("登録失敗"); }
  };
  const handleDeleteMockExam = async (id: number) => {
    if (!confirm("削除しますか？")) return;
    try { await api.delete(`/exams/mock/${id}`); fetchData(); } catch (e) { alert("削除失敗"); }
  };

  // --- カレンダー描画用 ---
  const calendarDays = getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

  const getDayEvents = (day: number | null) => {
      if (!day) return [];
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const events: {type: string, title: string, color: string}[] = [];
      
      acceptances.forEach(acc => {
          if (acc.application_deadline === dateStr) events.push({type: '願書', title: `${acc.university_name}`, color: 'bg-purple-100 text-purple-800 border-purple-200'});
          if (acc.exam_date === dateStr) events.push({type: '試験', title: `${acc.university_name}`, color: 'bg-red-100 text-red-800 border-red-200'});
          if (acc.announcement_date === dateStr) events.push({type: '発表', title: `${acc.university_name}`, color: 'bg-green-100 text-green-800 border-green-200'});
          if (acc.procedure_deadline === dateStr) events.push({type: '手続', title: `${acc.university_name}`, color: 'bg-yellow-100 text-yellow-800 border-yellow-200'});
      });
      return events;
  };

  const DetailRow = ({ label, value }: { label: string, value?: string | number }) => {
      if (value === undefined || value === null || value === "") return null;
      return <div className="flex justify-between border-b border-gray-100 py-1"><span>{label}</span><span className="font-medium">{value}</span></div>;
  };

  return (
    <Card className="h-full flex flex-col border shadow-sm min-h-[90vh]">
      
      <CardContent className="flex-1 overflow-hidden p-0 bg-gray-50/30 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 py-2 bg-white border-b shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              {/* ★修正: タブ順序を 過去問 -> 模試 -> 入試日程 -> カレンダー に変更 */}
              <TabsTrigger value="past_exam"><Clock className="w-4 h-4 mr-2" />過去問</TabsTrigger>
              <TabsTrigger value="mock_exam"><BarChart2 className="w-4 h-4 mr-2" />模試</TabsTrigger>
              <TabsTrigger value="acceptance"><FileText className="w-4 h-4 mr-2" />入試日程</TabsTrigger>
              <TabsTrigger value="calendar"><Calendar className="w-4 h-4 mr-2" />カレンダー</TabsTrigger>
            </TabsList>
          </div>

          {/* === 過去問タブ (1番目) === */}
          <TabsContent value="past_exam" className="flex-1 flex flex-col p-4 overflow-hidden m-0 data-[state=inactive]:hidden">
                <div className="flex justify-end mb-2 shrink-0">
                    <Button size="sm" onClick={() => setIsPastModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> 結果を記録
                    </Button>
                </div>
                <div className="flex-1 overflow-auto border rounded-md bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>実施日</TableHead>
                                <TableHead>大学・年度</TableHead>
                                <TableHead>科目</TableHead>
                                <TableHead>得点</TableHead>
                                <TableHead>時間</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pastExams.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-xs whitespace-nowrap">{item.date}</TableCell>
                                    <TableCell>
                                        <div className="text-sm font-bold">{item.university_name}</div>
                                        <div className="text-xs text-muted-foreground">{item.year}年 / {item.exam_system}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">{item.subject}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                            <span className="font-bold">{item.correct_answers}</span>
                                            <span className="text-muted-foreground text-xs">/{item.total_questions}</span>
                                        </div>
                                        {item.total_questions > 0 && (
                                            <div className="text-[10px] text-muted-foreground">
                                                {Math.round((item.correct_answers / item.total_questions) * 100)}%
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-blue-500" />
                                            <span>{item.time_required}分</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">規定: {item.total_time_allowed}分</span>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeletePastExam(item.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pastExams.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">記録がありません</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
          </TabsContent>

          {/* === 模試タブ (2番目) === */}
          <TabsContent value="mock_exam" className="flex-1 flex flex-col p-4 overflow-hidden m-0 data-[state=inactive]:hidden">
                <div className="flex justify-end mb-2 shrink-0">
                    <Button size="sm" onClick={() => setIsMockModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> 模試を追加
                    </Button>
                </div>
                <div className="flex-1 overflow-auto border rounded-md bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>実施日</TableHead>
                                <TableHead>模試名</TableHead>
                                <TableHead>形式</TableHead>
                                <TableHead className="w-20">詳細</TableHead>
                                <TableHead className="w-10">削除</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockExams.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="text-xs whitespace-nowrap">{item.exam_date}</TableCell>
                                    <TableCell className="font-medium text-sm">{item.mock_exam_name}</TableCell>
                                    <TableCell className="text-xs">{item.result_type}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-blue-500" onClick={() => { setSelectedMockExam(item); setIsMockDetailOpen(true); }}>
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteMockExam(item.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {mockExams.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">記録がありません</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
          </TabsContent>

          {/* === 入試日程タブ (3番目) === */}
          <TabsContent value="acceptance" className="flex-1 flex flex-col p-4 overflow-hidden m-0 data-[state=inactive]:hidden">
                <div className="flex justify-end mb-2 shrink-0">
                    <Button size="sm" onClick={() => setIsAcceptanceModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" /> 日程を追加
                    </Button>
                </div>
                <div className="flex-1 overflow-auto border rounded-md bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* ★修正: カラム順序を 大学名->願書->試験日->発表日->手続->結果 に変更 */}
                                <TableHead>大学・学部</TableHead>
                                <TableHead>願書〆切</TableHead>
                                <TableHead>試験日</TableHead>
                                <TableHead>発表日</TableHead>
                                <TableHead>手続締切</TableHead>
                                <TableHead>結果</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {acceptances.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="text-sm font-bold">{item.university_name}</div>
                                        <div className="text-xs text-muted-foreground">{item.faculty_name} {item.department_name} ({item.exam_system})</div>
                                    </TableCell>
                                    <TableCell className="text-xs whitespace-nowrap text-purple-600 font-medium">{item.application_deadline}</TableCell>
                                    <TableCell className="text-xs whitespace-nowrap">{item.exam_date}</TableCell>
                                    <TableCell className="text-xs">{item.announcement_date}</TableCell>
                                    <TableCell className="text-xs text-red-600">{item.procedure_deadline}</TableCell>
                                    <TableCell>
                                        <select 
                                            className={`text-xs p-1 rounded border ${
                                                item.result === "合格" ? "bg-green-100 text-green-800" :
                                                item.result === "不合格" ? "bg-red-50 text-red-800" : "bg-gray-50"
                                            }`}
                                            value={item.result || "未受験"}
                                            onChange={(e) => handleUpdateResult(item.id, e.target.value)}
                                        >
                                            {/* ★修正: 選択肢を3つに限定 */}
                                            <option value="未受験">未受験</option>
                                            <option value="合格">合格</option>
                                            <option value="不合格">不合格</option>
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteAcceptance(item.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {acceptances.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">登録がありません</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
          </TabsContent>

          {/* === カレンダータブ (4番目) === */}
          <TabsContent value="calendar" className="flex-1 flex flex-col p-4 overflow-hidden m-0 data-[state=inactive]:hidden">
                <div className="flex items-center justify-between mb-2 bg-white p-2 rounded border shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="font-bold text-lg">
                        {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex-1 bg-white border rounded-md overflow-hidden flex flex-col">
                    <div className="grid grid-cols-7 border-b bg-gray-50 text-center py-1 text-sm font-medium shrink-0">
                        <div className="text-red-500">日</div><div>月</div><div>火</div><div>水</div><div>木</div><div>金</div><div className="text-blue-500">土</div>
                    </div>
                    {/* ★修正: 5行固定 (grid-rows-5) */}
                    <div className="flex-1 grid grid-cols-7 grid-rows-5">
                        {calendarDays.map((day, i) => (
                            <div key={i} className={`border-b border-r p-1 flex flex-col overflow-hidden ${!day ? 'bg-gray-50' : ''} ${(i+1)%7===0 ? 'border-r-0' : ''}`}>
                                {day && (
                                    <>
                                        <div className="text-xs font-bold text-gray-500 mb-0.5">{day}</div>
                                        <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto scrollbar-hide">
                                            {getDayEvents(day).map((ev, j) => (
                                                <div key={j} className={`text-[9px] px-1 py-0.5 rounded border truncate ${ev.color} leading-tight`}>
                                                    <span className="font-bold mr-0.5">[{ev.type}]</span>{ev.title}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
          </TabsContent>

        </Tabs>
      </CardContent>

      {/* --- モーダル群 (変更なし) --- */}
      <Dialog open={isAcceptanceModalOpen} onOpenChange={setIsAcceptanceModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-gray-50/50 p-4 border-b -m-6 mb-2 rounded-t-lg"><DialogTitle>入試日程を追加</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
             <div className="grid grid-cols-2 gap-4">
                <Input className="h-8 text-xs" placeholder="大学名" value={newAcceptance.university_name || ''} onChange={e => setNewAcceptance({...newAcceptance, university_name: e.target.value})} />
                <Input className="h-8 text-xs" placeholder="学部" value={newAcceptance.faculty_name || ''} onChange={e => setNewAcceptance({...newAcceptance, faculty_name: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input className="h-8 text-xs" placeholder="学科" value={newAcceptance.department_name || ''} onChange={e => setNewAcceptance({...newAcceptance, department_name: e.target.value})} />
                <Input className="h-8 text-xs" placeholder="入試方式" value={newAcceptance.exam_system || ''} onChange={e => setNewAcceptance({...newAcceptance, exam_system: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><label className="text-[10px]">願書〆切</label>
                <Input className="h-8 text-xs" type="date" value={newAcceptance.application_deadline || ''} onChange={e => setNewAcceptance({...newAcceptance, application_deadline: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px]">試験日</label>
                <Input className="h-8 text-xs" type="date" value={newAcceptance.exam_date || ''} onChange={e => setNewAcceptance({...newAcceptance, exam_date: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px]">発表日</label>
                <Input className="h-8 text-xs" type="date" value={newAcceptance.announcement_date || ''} onChange={e => setNewAcceptance({...newAcceptance, announcement_date: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px]">手続締切</label>
                <Input className="h-8 text-xs" type="date" value={newAcceptance.procedure_deadline || ''} onChange={e => setNewAcceptance({...newAcceptance, procedure_deadline: e.target.value})} /></div>
             </div>
          </div>
          <DialogFooter className="mt-2"><Button size="sm" onClick={handleAddAcceptance}>登録</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPastModalOpen} onOpenChange={setIsPastModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-gray-50/50 p-4 border-b -m-6 mb-2 rounded-t-lg"><DialogTitle>過去問結果</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
             <div className="grid grid-cols-2 gap-4">
                <Input className="h-8 text-xs" type="date" value={newPastExam.date} onChange={e => setNewPastExam({...newPastExam, date: e.target.value})} />
                <Input className="h-8 text-xs" placeholder="科目" value={newPastExam.subject} onChange={e => setNewPastExam({...newPastExam, subject: e.target.value})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Input className="h-8 text-xs" placeholder="大学名" value={newPastExam.university_name} onChange={e => setNewPastExam({...newPastExam, university_name: e.target.value})} />
                <Input className="h-8 text-xs" type="number" placeholder="年度" value={newPastExam.year} onChange={e => setNewPastExam({...newPastExam, year: Number(e.target.value)})} />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px]">正解/総問</label>
                    <div className="flex gap-2">
                        <Input className="h-8 text-xs" type="number" placeholder="正解" value={newPastExam.correct_answers} onChange={e => setNewPastExam({...newPastExam, correct_answers: Number(e.target.value)})} />
                        <Input className="h-8 text-xs" type="number" placeholder="総問" value={newPastExam.total_questions} onChange={e => setNewPastExam({...newPastExam, total_questions: Number(e.target.value)})} />
                    </div>
                </div>
                <div className="space-y-1"><label className="text-[10px]">時間(所要/制限)</label>
                    <div className="flex gap-2">
                        <Input className="h-8 text-xs" type="number" placeholder="所要" value={newPastExam.time_required} onChange={e => setNewPastExam({...newPastExam, time_required: Number(e.target.value)})} />
                        <Input className="h-8 text-xs" type="number" placeholder="制限" value={newPastExam.total_time_allowed} onChange={e => setNewPastExam({...newPastExam, total_time_allowed: Number(e.target.value)})} />
                    </div>
                </div>
             </div>
          </div>
          <DialogFooter className="mt-2"><Button size="sm" onClick={handleAddPastExam}>記録</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMockModalOpen} onOpenChange={setIsMockModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gray-50/50 p-4 border-b -m-6 mb-2 rounded-t-lg"><DialogTitle>模試結果を追加</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-medium">実施日</label>
                <Input className="h-8 text-xs" type="date" value={newMockExam.exam_date || ''} onChange={e => setNewMockExam({...newMockExam, exam_date: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-medium">模試名</label>
                <Input className="h-8 text-xs" placeholder="模試名" value={newMockExam.mock_exam_name || ''} onChange={e => setNewMockExam({...newMockExam, mock_exam_name: e.target.value})} /></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5"><label className="text-xs font-medium">形式 (主)</label>
                 <Select value={newMockExam.result_type} onValueChange={v => setNewMockExam({...newMockExam, result_type: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="マーク">マーク</SelectItem><SelectItem value="記述">記述</SelectItem></SelectContent>
                 </Select></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 border-t pt-2">
                 {/* マーク式 */}
                 <div className="space-y-2">
                     <label className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded block">マーク式 得点</label>
                     <div className="grid grid-cols-2 gap-2">
                         <div><label className="text-[10px]">英語R</label><Input className="h-7 text-xs" value={newMockExam.subject_english_r_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_english_r_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">英語L</label><Input className="h-7 text-xs" value={newMockExam.subject_english_l_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_english_l_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">数IA</label><Input className="h-7 text-xs" value={newMockExam.subject_math1a_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_math1a_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">数IIBC</label><Input className="h-7 text-xs" value={newMockExam.subject_math2bc_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_math2bc_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">国語</label><Input className="h-7 text-xs" value={newMockExam.subject_kokugo_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_kokugo_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">情報</label><Input className="h-7 text-xs" value={newMockExam.subject_info_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_info_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">理科①</label><Input className="h-7 text-xs" value={newMockExam.subject_rika1_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_rika1_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">理科②</label><Input className="h-7 text-xs" value={newMockExam.subject_rika2_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_rika2_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">理科基礎①</label><Input className="h-7 text-xs" value={newMockExam.subject_rika_kiso1_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_rika_kiso1_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">理科基礎②</label><Input className="h-7 text-xs" value={newMockExam.subject_rika_kiso2_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_rika_kiso2_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">社会①</label><Input className="h-7 text-xs" value={newMockExam.subject_shakai1_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_shakai1_mark: e.target.value})} /></div>
                         <div><label className="text-[10px]">社会②</label><Input className="h-7 text-xs" value={newMockExam.subject_shakai2_mark || ''} onChange={e => setNewMockExam({...newMockExam, subject_shakai2_mark: e.target.value})} /></div>
                     </div>
                 </div>

                 {/* 記述式 */}
                 <div className="space-y-2">
                     <label className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded block">記述式 得点</label>
                     <div className="grid grid-cols-2 gap-2">
                         <div><label className="text-[10px]">英語</label><Input className="h-7 text-xs" value={newMockExam.subject_english_desc || ''} onChange={e => setNewMockExam({...newMockExam, subject_english_desc: e.target.value})} /></div>
                         <div><label className="text-[10px]">数学</label><Input className="h-7 text-xs" value={newMockExam.subject_math_desc || ''} onChange={e => setNewMockExam({...newMockExam, subject_math_desc: e.target.value})} /></div>
                         <div><label className="text-[10px]">国語</label><Input className="h-7 text-xs" value={newMockExam.subject_kokugo_desc || ''} onChange={e => setNewMockExam({...newMockExam, subject_kokugo_desc: e.target.value})} /></div>
                         <div><label className="text-[10px]">理科①</label><Input className="h-7 text-xs" value={newMockExam.subject_rika1_desc || ''} onChange={e => setNewMockExam({...newMockExam, subject_rika1_desc: e.target.value})} /></div>
                         <div><label className="text-[10px]">理科②</label><Input className="h-7 text-xs" value={newMockExam.subject_rika2_desc || ''} onChange={e => setNewMockExam({...newMockExam, subject_rika2_desc: e.target.value})} /></div>
                         <div><label className="text-[10px]">社会①</label><Input className="h-7 text-xs" value={newMockExam.subject_shakai1_desc || ''} onChange={e => setNewMockExam({...newMockExam, subject_shakai1_desc: e.target.value})} /></div>
                         <div><label className="text-[10px]">社会②</label><Input className="h-7 text-xs" value={newMockExam.subject_shakai2_desc || ''} onChange={e => setNewMockExam({...newMockExam, subject_shakai2_desc: e.target.value})} /></div>
                     </div>
                 </div>
             </div>
          </div>
          <DialogFooter className="mt-2"><Button size="sm" onClick={handleAddMockExam}>追加</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- モーダル: 模試詳細表示 --- */}
      <Dialog open={isMockDetailOpen} onOpenChange={setIsMockDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="bg-gray-50/50 p-4 border-b -m-6 mb-2 rounded-t-lg"><DialogTitle>{selectedMockExam?.mock_exam_name} 結果</DialogTitle></DialogHeader>
            <div className="py-2 overflow-y-auto max-h-[60vh]">
                <div className="flex justify-between mb-4 border-b pb-2">
                    <span className="font-bold">主: {selectedMockExam?.result_type}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* マーク式結果 */}
                    <div>
                        <div className="font-bold mb-2 text-blue-700">マーク式</div>
                        <div className="space-y-1">
                            <DetailRow label="英R" value={selectedMockExam?.subject_english_r_mark} />
                            <DetailRow label="英L" value={selectedMockExam?.subject_english_l_mark} />
                            <DetailRow label="数IA" value={selectedMockExam?.subject_math1a_mark} />
                            <DetailRow label="数IIBC" value={selectedMockExam?.subject_math2bc_mark} />
                            <DetailRow label="国語" value={selectedMockExam?.subject_kokugo_mark} />
                            <DetailRow label="情報" value={selectedMockExam?.subject_info_mark} />
                            <DetailRow label="理科①" value={selectedMockExam?.subject_rika1_mark} />
                            <DetailRow label="理科②" value={selectedMockExam?.subject_rika2_mark} />
                            <DetailRow label="理基①" value={selectedMockExam?.subject_rika_kiso1_mark} />
                            <DetailRow label="理基②" value={selectedMockExam?.subject_rika_kiso2_mark} />
                            <DetailRow label="社会①" value={selectedMockExam?.subject_shakai1_mark} />
                            <DetailRow label="社会②" value={selectedMockExam?.subject_shakai2_mark} />
                        </div>
                    </div>

                    {/* 記述式結果 */}
                    <div>
                        <div className="font-bold mb-2 text-purple-700">記述式</div>
                        <div className="space-y-1">
                            <DetailRow label="英語" value={selectedMockExam?.subject_english_desc} />
                            <DetailRow label="数学" value={selectedMockExam?.subject_math_desc} />
                            <DetailRow label="国語" value={selectedMockExam?.subject_kokugo_desc} />
                            <DetailRow label="理科①" value={selectedMockExam?.subject_rika1_desc} />
                            <DetailRow label="理科②" value={selectedMockExam?.subject_rika2_desc} />
                            <DetailRow label="社会①" value={selectedMockExam?.subject_shakai1_desc} />
                            <DetailRow label="社会②" value={selectedMockExam?.subject_shakai2_desc} />
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
