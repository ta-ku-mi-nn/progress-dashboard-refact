import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function TextbookManagement() {
    const [textbooks, setTextbooks] = useState<any[]>([]);
    const [newBook, setNewBook] = useState({ book_name: '', subject: '英語', level: '基礎徹底', duration: 0 });

    const fetchBooks = async () => {
        try { 
            const res = await api.get('/common/textbooks'); 
            setTextbooks(res.data); 
        } catch (e) { 
            toast.error("データ取得失敗"); 
        }
    };
    useEffect(() => { fetchBooks(); }, []);

    // ★修正: デフォルト科目を削除し、登録済みデータのみから抽出
    const existingSubjects = textbooks.map((t: any) => t.subject).filter(Boolean);
    const uniqueSubjects = Array.from(new Set(existingSubjects));

    const handleCreate = async () => {
        if (!newBook.book_name) return toast.error("参考書名は必須です");
        if (!newBook.subject) return toast.error("科目を選択してください"); // 科目未選択チェック追加

        try {
            await api.post('/admin/textbooks', newBook);
            toast.success("登録しました");
            fetchBooks();
            setNewBook({ book_name: '', subject: '英語', level: '基礎徹底', duration: 0 });
        } catch (e) { 
            toast.error("登録失敗"); 
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await api.delete(`/admin/textbooks/${id}`);
            toast.success("削除しました");
            fetchBooks();
        } catch (e) { 
            toast.error("削除失敗"); 
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <h4 className="font-medium text-sm">新規参考書登録</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    
                    <div className="space-y-1">
                        <Label>参考書名</Label>
                        <Input 
                            value={newBook.book_name} 
                            onChange={e => setNewBook({ ...newBook, book_name: e.target.value })} 
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <Label>科目</Label>
                        <Select 
                            value={newBook.subject} 
                            onValueChange={v => setNewBook({ ...newBook, subject: v })}
                        >
                            <SelectTrigger>
                                {/* 何も選択されていない時の表示対策 */}
                                <SelectValue placeholder="科目を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueSubjects.map(subj => (
                                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                ))}
                                {uniqueSubjects.length === 0 && (
                                    <div className="p-2 text-xs text-muted-foreground text-center">
                                        登録済みの科目がありません
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-1">
                        <Label>レベル</Label>
                        <Select 
                            value={newBook.level} 
                            onValueChange={v => setNewBook({ ...newBook, level: v })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="基礎徹底">基礎徹底</SelectItem>
                                <SelectItem value="日大">日大</SelectItem>
                                <SelectItem value="MARCH">MARCH</SelectItem>
                                <SelectItem value="早慶">早慶</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <Label>所要時間 (h)</Label>
                        <Input 
                            type="number" 
                            value={newBook.duration} 
                            onChange={e => setNewBook({ ...newBook, duration: Number(e.target.value) })} 
                            min={0}
                        />
                    </div>
                </div>
                <div className="flex justify-end"><Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />追加</Button></div>
            </div>
            <div className="max-h-[500px] overflow-auto border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>参考書名</TableHead>
                            <TableHead>科目</TableHead>
                            <TableHead>レベル</TableHead>
                            <TableHead>時間</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {textbooks.map((t: any) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">{t.book_name}</TableCell>
                                <TableCell>{t.subject}</TableCell>
                                <TableCell>{t.level}</TableCell>
                                <TableCell>{t.duration}h</TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {textbooks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                    登録データがありません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}