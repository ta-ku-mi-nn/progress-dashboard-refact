import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Edit, Trash2, Users, Search } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

// 学年の選択肢
const GRADE_OPTIONS = ["中1", "中2", "中3", "高1", "高2", "高3", "既卒", "退塾済"];

interface Instructor {
    id: number;
    username: string;
}

interface Student {
    id: number;
    name: string;
    grade: string;
    school: string; // 校舎名
    current_school?: string; // 在籍校
    previous_school?: string; // 出身校
    deviation_value?: number;
    target_level?: string;
    main_instructor_id?: number;
    main_instructor?: { id: number; name: string };
    sub_instructor_id?: number;
    sub_instructor?: { id: number; name: string };
}

export default function StudentManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // 編集モーダル用
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sRes, iRes] = await Promise.all([
                api.get('/admin/students_list'),
                api.get('/admin/instructors')
            ]);
            setStudents(sRes.data);
            setInstructors(iRes.data);
        } catch (e) {
            console.error(e);
            toast.error("データの取得に失敗しました");
        }
    };

    // 編集開始
    const handleEditClick = (student: Student) => {
        setEditingStudent({
            ...student,
            // 講師IDがnullの場合は undefined または 0扱いにしておく
            main_instructor_id: student.main_instructor?.id,
            sub_instructor_id: student.sub_instructor?.id
        });
        setIsEditOpen(true);
    };

    // 保存処理
    const handleSave = async () => {
        if (!editingStudent.id) return;
        try {
            await api.patch(`/admin/students/${editingStudent.id}`, editingStudent);
            toast.success("生徒情報を更新しました");
            setIsEditOpen(false);
            fetchData(); // リスト更新
        } catch (e) {
            console.error(e);
            toast.error("更新に失敗しました");
        }
    };

    // 削除処理
    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？学習データも削除されます。")) return;
        try {
            await api.delete(`/admin/students/${id}`);
            toast.success("削除しました");
            fetchData();
        } catch (e) {
            console.error(e);
            toast.error("削除に失敗しました");
        }
    };

    // 検索フィルタリング
    const filteredStudents = students.filter(s => 
        s.name.includes(searchTerm) || 
        (s.school && s.school.includes(searchTerm))
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" /> 生徒管理
                    </CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="名前や校舎で検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
                <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="w-[120px]">氏名</TableHead>
                            <TableHead className="w-[80px]">学年</TableHead>
                            <TableHead>メイン講師</TableHead>
                            <TableHead>サブ講師</TableHead>
                            <TableHead>志望校レベル</TableHead>
                            <TableHead>偏差値</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.map((student) => (
                            <TableRow key={student.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-medium">{student.name}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded text-xs border ${
                                        student.grade === '既卒' || student.grade === '退塾済' 
                                        ? 'bg-gray-100 border-gray-200 text-gray-600' 
                                        : 'bg-blue-50 border-blue-100 text-blue-700'
                                    }`}>
                                        {student.grade || '-'}
                                    </span>
                                </TableCell>
                                <TableCell>{student.main_instructor?.name || <span className="text-gray-400 text-xs">未設定</span>}</TableCell>
                                <TableCell>{student.sub_instructor?.name || <span className="text-gray-400 text-xs">-</span>}</TableCell>
                                <TableCell className="text-sm">{student.target_level || '-'}</TableCell>
                                <TableCell className="text-sm">{student.deviation_value || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600" onClick={() => handleEditClick(student)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(student.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* 編集ダイアログ */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>生徒情報の編集</DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-6 py-4">
                        {/* 基本情報エリア */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm text-gray-500 border-b pb-1">基本情報</h4>
                            <div className="space-y-2">
                                <Label>氏名</Label>
                                <Input 
                                    value={editingStudent.name || ''} 
                                    onChange={e => setEditingStudent({...editingStudent, name: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>学年</Label>
                                <Select 
                                    value={editingStudent.grade} 
                                    onValueChange={v => setEditingStudent({...editingStudent, grade: v})}
                                >
                                    <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                                    <SelectContent>
                                        {GRADE_OPTIONS.map(g => (
                                            <SelectItem key={g} value={g}>{g}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>所属校舎 (システム用)</Label>
                                <Input 
                                    value={editingStudent.school || ''} 
                                    onChange={e => setEditingStudent({...editingStudent, school: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* 詳細・講師エリア */}
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm text-gray-500 border-b pb-1">詳細・担当講師</h4>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>在籍校</Label>
                                    <Input 
                                        value={editingStudent.current_school || ''} 
                                        onChange={e => setEditingStudent({...editingStudent, current_school: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>出身校</Label>
                                    <Input 
                                        value={editingStudent.previous_school || ''} 
                                        onChange={e => setEditingStudent({...editingStudent, previous_school: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <Label>偏差値</Label>
                                    <Input 
                                        type="number" step="0.1"
                                        value={editingStudent.deviation_value || ''} 
                                        onChange={e => setEditingStudent({...editingStudent, deviation_value: Number(e.target.value)})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>志望校レベル</Label>
                                    <Input 
                                        value={editingStudent.target_level || ''} 
                                        onChange={e => setEditingStudent({...editingStudent, target_level: e.target.value})} 
                                        placeholder="例: 早慶"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t mt-2">
                                <Label className="text-blue-600">メイン講師 (校舎責任者)</Label>
                                <Select 
                                    value={String(editingStudent.main_instructor_id || "0")} 
                                    onValueChange={v => setEditingStudent({...editingStudent, main_instructor_id: Number(v)})}
                                >
                                    <SelectTrigger><SelectValue placeholder="未設定" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">未設定</SelectItem>
                                        {instructors.map(i => (
                                            <SelectItem key={i.id} value={String(i.id)}>{i.username}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-gray-600">サブ講師</Label>
                                <Select 
                                    value={String(editingStudent.sub_instructor_id || "0")} 
                                    onValueChange={v => setEditingStudent({...editingStudent, sub_instructor_id: Number(v)})}
                                >
                                    <SelectTrigger><SelectValue placeholder="なし" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">なし</SelectItem>
                                        {instructors.map(i => (
                                            <SelectItem key={i.id} value={String(i.id)}>{i.username}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave}>保存する</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}