import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function StudentManagement() {
    const [students, setStudents] = useState<any[]>([]);
    const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: '' });

    const fetchStudents = async () => {
        try { const res = await api.get('/students/'); setStudents(res.data); } 
        catch (e) { toast.error("生徒データの取得に失敗"); }
    };
    useEffect(() => { fetchStudents(); }, []);

    const handleCreate = async () => {
        if (!newStudent.name || !newStudent.school) return toast.error("名前と校舎は必須です");
        try {
            await api.post('/admin/students', newStudent);
            toast.success("登録しました");
            fetchStudents();
            setNewStudent({ name: '', school: '', grade: '' });
        } catch (e) { toast.error("登録失敗"); }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <h4 className="font-medium text-sm">新規生徒登録</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label>生徒氏名</Label><Input value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} /></div>
                    <div className="space-y-1"><Label>校舎</Label><Input value={newStudent.school} onChange={e => setNewStudent({ ...newStudent, school: e.target.value })} /></div>
                    <div className="space-y-1"><Label>学年</Label><Input value={newStudent.grade} onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })} placeholder="例: 高3" /></div>
                </div>
                <div className="flex justify-end"><Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />追加</Button></div>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>氏名</TableHead><TableHead>校舎</TableHead><TableHead>学年</TableHead></TableRow></TableHeader>
                <TableBody>
                    {students.map((s: any) => (
                        <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell>{s.school}</TableCell>
                            <TableCell>{s.grade}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}