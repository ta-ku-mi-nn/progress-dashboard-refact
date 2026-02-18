import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Edit, Trash2, Users, Search, UserPlus } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const GRADE_OPTIONS = ["中1", "中2", "中3", "高1", "高2", "高3", "既卒", "退塾済"];

export default function StudentManagement() {
    const [students, setStudents] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // 編集・新規兼用モーダルステート
    const [isOpen, setIsOpen] = useState(false);
    const [isNewMode, setIsNewMode] = useState(false);
    // sub_instructor_ids は配列として管理
    const [formData, setFormData] = useState<any>({ sub_instructor_ids: [] });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [sRes, iRes] = await Promise.all([
                api.get('/admin/students_list'),
                api.get('/admin/instructors')
            ]);
            setStudents(sRes.data);
            setInstructors(iRes.data);
        } catch (e) { toast.error("データ取得エラー"); }
    };

    // 新規ボタンクリック
    const handleNewClick = () => {
        setIsNewMode(true);
        setFormData({ name: "", grade: "高1", school: "東京校", main_instructor_id: 0, sub_instructor_ids: [] });
        setIsOpen(true);
    };

    // 編集ボタンクリック
    const handleEditClick = (student: any) => {
        setIsNewMode(false);
        setFormData({ 
            ...student,
            // IDリストがない場合は空配列にする
            sub_instructor_ids: student.sub_instructor_ids || []
        });
        setIsOpen(true);
    };

    // 保存処理
    const handleSave = async () => {
        if (!formData.name) { toast.error("氏名は必須です"); return; }
        
        try {
            if (isNewMode) {
                await api.post('/admin/students', formData);
                toast.success("生徒を登録しました");
            } else {
                await api.patch(`/admin/students/${formData.id}`, formData);
                toast.success("情報を更新しました");
            }
            setIsOpen(false);
            fetchData();
        } catch (e) { toast.error("保存に失敗しました"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("削除しますか？")) return;
        try {
            await api.delete(`/admin/students/${id}`);
            fetchData();
            toast.success("削除しました");
        } catch (e) { toast.error("削除失敗"); }
    };

    // サブ講師のチェックボックス切り替え処理
    const toggleSubInstructor = (instructorId: number) => {
        const currentIds = formData.sub_instructor_ids || [];
        if (currentIds.includes(instructorId)) {
            // 削除
            setFormData({
                ...formData,
                sub_instructor_ids: currentIds.filter((id: number) => id !== instructorId)
            });
        } else {
            // 追加
            setFormData({
                ...formData,
                sub_instructor_ids: [...currentIds, instructorId]
            });
        }
    };

    const filteredStudents = students.filter(s => 
        (s.name && s.name.includes(searchTerm)) || 
        (s.school && s.school.includes(searchTerm))
    );

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" /> 生徒管理
                    </CardTitle>
                    <div className="flex gap-2">
                        <div className="relative w-48">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input placeholder="検索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
                        </div>
                        <Button onClick={handleNewClick} size="sm"><UserPlus className="w-4 h-4 mr-2" /> 新規</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-0">
                <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                        <TableRow>
                            <TableHead>氏名</TableHead>
                            <TableHead>学年</TableHead>
                            <TableHead>校舎</TableHead>
                            <TableHead>担当講師</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell>{s.grade}</TableCell>
                                <TableCell>{s.school}</TableCell>
                                <TableCell>
                                    <div className="text-xs">
                                        <div><span className="font-bold text-gray-500">主:</span> {s.main_instructor?.name || "-"}</div>
                                        <div className="text-gray-400">
                                            <span className="font-bold">副:</span> {s.sub_instructors && s.sub_instructors.length > 0 
                                                ? s.sub_instructors.map((sub: any) => sub.name).join(", ") 
                                                : "-"}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => handleEditClick(s)}><Edit className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* 編集・新規ダイアログ */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-lg overflow-y-auto max-h-[90vh]">
                    <DialogHeader><DialogTitle>{isNewMode ? "新規生徒登録" : "生徒情報編集"}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>氏名 *</Label>
                                <Input value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>校舎 *</Label>
                                <Input value={formData.school || ""} onChange={e => setFormData({...formData, school: e.target.value})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>学年</Label>
                                <Select value={formData.grade} onValueChange={v => setFormData({...formData, grade: v})}>
                                    <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                    <SelectContent>{GRADE_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>偏差値</Label>
                                <Input type="number" value={formData.deviation_value || ""} onChange={e => setFormData({...formData, deviation_value: Number(e.target.value)})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>在籍校 / 出身校</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="在籍校" value={formData.current_school || ""} onChange={e => setFormData({...formData, current_school: e.target.value})} />
                                <Input placeholder="出身校" value={formData.previous_school || ""} onChange={e => setFormData({...formData, previous_school: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>志望校レベル</Label>
                            <Input value={formData.target_level || ""} onChange={e => setFormData({...formData, target_level: e.target.value})} />
                        </div>
                        
                        <div className="grid gap-4 border-t pt-4">
                            {/* メイン講師 (単一選択) */}
                            <div className="space-y-2">
                                <Label className="text-blue-600 font-bold">メイン講師 (校舎責任者)</Label>
                                <Select value={String(formData.main_instructor_id || "0")} onValueChange={v => setFormData({...formData, main_instructor_id: Number(v)})}>
                                    <SelectTrigger><SelectValue placeholder="未設定" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">未設定</SelectItem>
                                        {instructors.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.username}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ★サブ講師 (複数選択・チェックボックス) */}
                            <div className="space-y-2">
                                <Label className="text-gray-600 font-bold">サブ講師 (複数選択可)</Label>
                                <div className="border rounded-md p-3 h-32 overflow-y-auto bg-gray-50 grid grid-cols-2 gap-2">
                                    {instructors.map(i => (
                                        <div key={i.id} className="flex items-center space-x-2">
                                            <input 
                                                type="checkbox" 
                                                id={`sub-${i.id}`}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={formData.sub_instructor_ids?.includes(i.id)}
                                                onChange={() => toggleSubInstructor(i.id)}
                                                // メイン講師と同じ人は選択不可にするなどの制御も可能
                                                disabled={formData.main_instructor_id === i.id}
                                            />
                                            <label htmlFor={`sub-${i.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {i.username}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave}>{isNewMode ? "登録" : "更新"}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}