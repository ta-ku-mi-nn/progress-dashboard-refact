import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, Calendar, FileText, BarChart2, Clock, CheckCircle } from 'lucide-react';
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
    result_type: string; // 記述 or マーク
    grade_judgment: string; // 判定 (A-Eなど) ※DBカラム要確認、今回は grade フィールドに統合されている想定
    // 主要科目のみ表示用
    subject_english_desc?: number;
    subject_math_desc?: number;
    subject_kokugo_desc?: number;
    subject_english_r_mark?: number;
    subject_math1a_mark?: number;
    subject_kokugo_mark?: number;
}

export default function ExamManager({ studentId }: ExamManagerProps) {
    const [activeTab, setActiveTab] = useState("acceptance");

    // --- 入試日程 State ---
    const [acceptances, setAcceptances] = useState<Acceptance[]>([]);
    const [isAcceptanceModalOpen, setIsAcceptanceModalOpen] = useState(false);
    const [newAcceptance, setNewAcceptance] = useState({
        university_name: "", faculty_name: "", department_name: "", exam_system: "",
        exam_date: "", application_deadline: "", announcement_date: "", procedure_deadline: ""
    });

    // --- 過去問 State ---
    const [pastExams, setPastExams] = useState<PastExam[]>([]);
    const [isPastModalOpen, setIsPastModalOpen] = useState(false);
    const [newPastExam, setNewPastExam] = useState({
        date: new Date().toISOString().split('T')[0],
        university_name: "", faculty_name: "", exam_system: "",
        year: new Date().getFullYear(), subject: "",
        time_required: 0, total_time_allowed: 0,
        correct_answers: 0, total_questions: 0
    });

    // --- 模試 State ---
    const [mockExams, setMockExams] = useState<MockExam[]>([]);
    const [isMockModalOpen, setIsMockModalOpen] = useState(false);
    const [newMockExam, setNewMockExam] = useState({
        mock_exam_name: "", exam_date: "", grade: "", result_type: "マーク", mock_exam_format: "", round: "",
        // 点数フィールド(一部)
        subject_english_r_mark: 0, subject_math1a_mark: 0, subject_kokugo_mark: 0
    });

    // --- データ取得 ---
    const fetchData = async () => {
        try {
            if (activeTab === "acceptance") {
                const res = await api.get(`/exams/acceptance/${studentId}`);
                setAcceptances(res.data);
            } else if (activeTab === "past_exam") {
                const res = await api.get(`/exams/pastexam/${studentId}`);
                setPastExams(res.data);
            } else if (activeTab === "mock_exam") {
                const res = await api.get(`/exams/mock/${studentId}`);
                setMockExams(res.data);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (studentId) fetchData();
    }, [studentId, activeTab]);

    // --- ハンドラ: 入試日程 ---
    const handleAddAcceptance = async () => {
        try {
            await api.post('/exams/acceptance', { student_id: studentId, ...newAcceptance });
            setIsAcceptanceModalOpen(false);
            setNewAcceptance({
                university_name: "", faculty_name: "", department_name: "", exam_system: "",
                exam_date: "", application_deadline: "", announcement_date: "", procedure_deadline: ""
            });
            fetchData();
        } catch (e) { alert("登録失敗"); }
    };
    const handleDeleteAcceptance = async (id: number) => {
        if (!confirm("削除しますか？")) return;
        try { await api.delete(`/exams/acceptance/${id}`); fetchData(); } catch (e) { alert("削除失敗"); }
    };
    const handleUpdateResult = async (id: number, newResult: string) => {
        try { await api.patch(`/exams/acceptance/${id}`, { result: newResult }); fetchData(); } catch (e) { console.error(e); }
    };

    // --- ハンドラ: 過去問 ---
    const handleAddPastExam = async () => {
        try {
            await api.post('/exams/pastexam', { student_id: studentId, ...newPastExam });
            setIsPastModalOpen(false);
            // Reset form
            setNewPastExam({
                date: new Date().toISOString().split('T')[0],
                university_name: "", faculty_name: "", exam_system: "",
                year: new Date().getFullYear(), subject: "",
                time_required: 0, total_time_allowed: 0,
                correct_answers: 0, total_questions: 0
            });
            fetchData();
        } catch (e) { alert("登録失敗"); }
    };
    const handleDeletePastExam = async (id: number) => {
        if (!confirm("削除しますか？")) return;
        try { await api.delete(`/exams/pastexam/${id}`); fetchData(); } catch (e) { alert("削除失敗"); }
    };

    // --- ハンドラ: 模試 ---
    const handleAddMockExam = async () => {
        try {
            // 数値型変換などはInputのonChangeで行うか、ここで変換する
            await api.post('/exams/mock', {
                student_id: studentId,
                ...newMockExam,
                // 必須フィールドのダミー値（DB制約回避用）
                mock_exam_format: newMockExam.result_type,
                round: "1"
            });
            setIsMockModalOpen(false);
            setNewMockExam({
                mock_exam_name: "", exam_date: "", grade: "", result_type: "マーク", mock_exam_format: "", round: "",
                subject_english_r_mark: 0, subject_math1a_mark: 0, subject_kokugo_mark: 0
            });
            fetchData();
        } catch (e) { alert("登録失敗"); }
    };
    const handleDeleteMockExam = async (id: number) => {
        if (!confirm("削除しますか？")) return;
        try { await api.delete(`/exams/mock/${id}`); fetchData(); } catch (e) { alert("削除失敗"); }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle>入試・模試管理</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="px-4">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="acceptance">
                                <Calendar className="w-4 h-4 mr-2" />
                                入試日程
                            </TabsTrigger>
                            <TabsTrigger value="past_exam">
                                <FileText className="w-4 h-4 mr-2" />
                                過去問
                            </TabsTrigger>
                            <TabsTrigger value="mock_exam">
                                <BarChart2 className="w-4 h-4 mr-2" />
                                模試
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* === 1. 入試日程タブ === */}
                    <TabsContent value="acceptance" className="flex-1 flex flex-col p-4 overflow-hidden data-[state=active]:flex">
                        <div className="flex justify-end mb-2">
                            <Button size="sm" onClick={() => setIsAcceptanceModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" /> 日程を追加
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>試験日</TableHead>
                                        <TableHead>大学・学部</TableHead>
                                        <TableHead>発表日</TableHead>
                                        <TableHead>結果</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {acceptances.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs whitespace-nowrap">{item.exam_date}</TableCell>
                                            <TableCell>
                                                <div className="text-sm font-bold">{item.university_name}</div>
                                                <div className="text-xs text-muted-foreground">{item.faculty_name} {item.department_name}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">{item.announcement_date}</TableCell>
                                            <TableCell>
                                                <select
                                                    className={`text-xs p-1 rounded border ${item.result === "合格" ? "bg-green-100 text-green-800" :
                                                        item.result === "不合格" ? "bg-red-50 text-red-800" : "bg-gray-50"
                                                        }`}
                                                    value={item.result || "未受験"}
                                                    onChange={(e) => handleUpdateResult(item.id, e.target.value)}
                                                >
                                                    <option value="未受験">未受験</option>
                                                    <option value="受験済">受験済</option>
                                                    <option value="合格">合格</option>
                                                    <option value="不合格">不合格</option>
                                                    <option value="補欠">補欠</option>
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteAcceptance(item.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* === 2. 過去問タブ === */}
                    <TabsContent value="past_exam" className="flex-1 flex flex-col p-4 overflow-hidden data-[state=active]:flex">
                        <div className="flex justify-end mb-2">
                            <Button size="sm" onClick={() => setIsPastModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" /> 結果を記録
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto border rounded-md">
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
                                    {pastExams.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">記録がありません</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* === 3. 模試タブ === */}
                    <TabsContent value="mock_exam" className="flex-1 flex flex-col p-4 overflow-hidden data-[state=active]:flex">
                        <div className="flex justify-end mb-2">
                            <Button size="sm" onClick={() => setIsMockModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-1" /> 模試を追加
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>実施日</TableHead>
                                        <TableHead>模試名</TableHead>
                                        <TableHead>形式</TableHead>
                                        <TableHead>判定</TableHead>
                                        <TableHead>主要3教科</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockExams.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-xs whitespace-nowrap">{item.exam_date}</TableCell>
                                            <TableCell className="font-medium text-sm">{item.mock_exam_name}</TableCell>
                                            <TableCell className="text-xs">{item.result_type}</TableCell>
                                            <TableCell>
                                                <span className={`font-bold px-2 py-0.5 rounded ${item.grade === "A" ? "bg-green-100 text-green-700" :
                                                    item.grade === "E" ? "bg-red-100 text-red-700" : "bg-gray-100"
                                                    }`}>
                                                    {item.grade}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div>英: {item.subject_english_r_mark || '-'}</div>
                                                <div>数: {item.subject_math1a_mark || '-'}</div>
                                                <div>国: {item.subject_kokugo_mark || '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-500" onClick={() => handleDeleteMockExam(item.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {mockExams.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">記録がありません</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                </Tabs>
            </CardContent>

            {/* --- モーダル: 入試日程 --- */}
            <Dialog open={isAcceptanceModalOpen} onOpenChange={setIsAcceptanceModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>入試日程を追加</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="大学名" value={newAcceptance.university_name} onChange={e => setNewAcceptance({ ...newAcceptance, university_name: e.target.value })} />
                            <Input placeholder="学部" value={newAcceptance.faculty_name} onChange={e => setNewAcceptance({ ...newAcceptance, faculty_name: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="学科・専攻" value={newAcceptance.department_name} onChange={e => setNewAcceptance({ ...newAcceptance, department_name: e.target.value })} />
                            <Input placeholder="入試方式 (例: 共テ利用)" value={newAcceptance.exam_system} onChange={e => setNewAcceptance({ ...newAcceptance, exam_system: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-xs">試験日</label>
                                <Input type="date" value={newAcceptance.exam_date} onChange={e => setNewAcceptance({ ...newAcceptance, exam_date: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-xs">発表日</label>
                                <Input type="date" value={newAcceptance.announcement_date} onChange={e => setNewAcceptance({ ...newAcceptance, announcement_date: e.target.value })} /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddAcceptance}>登録</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- モーダル: 過去問 --- */}
            <Dialog open={isPastModalOpen} onOpenChange={setIsPastModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>過去問結果を記録</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-xs">実施日</label>
                                <Input type="date" value={newPastExam.date} onChange={e => setNewPastExam({ ...newPastExam, date: e.target.value })} /></div>
                            <Input placeholder="科目 (例: 英語)" className="mt-5" value={newPastExam.subject} onChange={e => setNewPastExam({ ...newPastExam, subject: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="大学名" value={newPastExam.university_name} onChange={e => setNewPastExam({ ...newPastExam, university_name: e.target.value })} />
                            <Input placeholder="年度 (例: 2023)" type="number" value={newPastExam.year} onChange={e => setNewPastExam({ ...newPastExam, year: Number(e.target.value) })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-xs">正解数</label>
                                <Input type="number" value={newPastExam.correct_answers} onChange={e => setNewPastExam({ ...newPastExam, correct_answers: Number(e.target.value) })} /></div>
                            <div className="space-y-1"><label className="text-xs">総問数</label>
                                <Input type="number" value={newPastExam.total_questions} onChange={e => setNewPastExam({ ...newPastExam, total_questions: Number(e.target.value) })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-xs">所要時間(分)</label>
                                <Input type="number" value={newPastExam.time_required} onChange={e => setNewPastExam({ ...newPastExam, time_required: Number(e.target.value) })} /></div>
                            <div className="space-y-1"><label className="text-xs">制限時間(分)</label>
                                <Input type="number" value={newPastExam.total_time_allowed} onChange={e => setNewPastExam({ ...newPastExam, total_time_allowed: Number(e.target.value) })} /></div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddPastExam}>記録</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- モーダル: 模試 --- */}
            <Dialog open={isMockModalOpen} onOpenChange={setIsMockModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader><DialogTitle>模試結果を追加</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-xs">実施日</label>
                                <Input type="date" value={newMockExam.exam_date} onChange={e => setNewMockExam({ ...newMockExam, exam_date: e.target.value })} /></div>
                            <div className="space-y-1"><label className="text-xs">模試名</label>
                                <Input placeholder="例: 全統共通テスト" value={newMockExam.mock_exam_name} onChange={e => setNewMockExam({ ...newMockExam, mock_exam_name: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-xs">形式</label>
                                <select className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    value={newMockExam.result_type} onChange={e => setNewMockExam({ ...newMockExam, result_type: e.target.value })}>
                                    <option value="マーク">マーク</option>
                                    <option value="記述">記述</option>
                                </select></div>
                            <div className="space-y-1"><label className="text-xs">総合判定</label>
                                <Input placeholder="A, B, C..." value={newMockExam.grade} onChange={e => setNewMockExam({ ...newMockExam, grade: e.target.value })} /></div>
                        </div>
                        <div className="border-t pt-2 mt-2">
                            <label className="text-xs font-bold text-muted-foreground block mb-2">主要科目得点 (マーク)</label>
                            <div className="grid grid-cols-3 gap-2">
                                <div><label className="text-[10px]">英語R</label><Input type="number" value={newMockExam.subject_english_r_mark} onChange={e => setNewMockExam({ ...newMockExam, subject_english_r_mark: Number(e.target.value) })} /></div>
                                <div><label className="text-[10px]">数IA</label><Input type="number" value={newMockExam.subject_math1a_mark} onChange={e => setNewMockExam({ ...newMockExam, subject_math1a_mark: Number(e.target.value) })} /></div>
                                <div><label className="text-[10px]">国語</label><Input type="number" value={newMockExam.subject_kokugo_mark} onChange={e => setNewMockExam({ ...newMockExam, subject_kokugo_mark: Number(e.target.value) })} /></div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter><Button onClick={handleAddMockExam}>追加</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
