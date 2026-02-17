import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function TextbookManagement() {
    const [textbooks, setTextbooks] = useState<any[]>([]);
    const [newBook, setNewBook] = useState({ book_name: '', subject: '英語', level: '標準' });

    const fetchBooks = async () => {
        try { const res = await api.get('/common/textbooks'); setTextbooks(res.data); } 
        catch (e) { toast.error("データ取得失敗"); }
    };
    useEffect(() => { fetchBooks(); }, []);

    const handleCreate = async () => {
        if (!newBook.book_name) return toast.error("参考書名は必須です");
        try {
            await api.post('/admin/textbooks', newBook);
            toast.success("登録しました");
            fetchBooks();
            setNewBook({ book_name: '', subject: '英語', level: '標準' });
        } catch (e) { toast.error("登録失敗"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await api.delete(`/admin/textbooks/${id}`);
            toast.success("削除しました");
            fetchBooks();
        } catch (e) { toast.error("削除失敗"); }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <h4 className="font-medium text-sm">新規参考書登録</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1"><Label>参考書名</Label><Input value={newBook.book_name} onChange={e => setNewBook({ ...newBook, book_name: e.target.value })} /></div>
                    <div className="space-y-1"><Label>科目</Label><Input value={newBook.subject} onChange={e => setNewBook({ ...newBook, subject: e.target.value })} /></div>
                    <div className="space-y-1"><Label>レベル</Label><Input value={newBook.level} onChange={e => setNewBook({ ...newBook, level: e.target.value })} /></div>
                </div>
                <div className="flex justify-end"><Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />追加</Button></div>
            </div>
            <div className="max-h-[500px] overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>参考書名</TableHead>
                            <TableHead>科目</TableHead>
                            <TableHead>レベル</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {textbooks.map((t: any) => (
                            <TableRow key={t.id}>
                                <TableCell>{t.book_name}</TableCell>
                                <TableCell>{t.subject}</TableCell>
                                <TableCell>{t.level}</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}