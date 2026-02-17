import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Search, Filter } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function TextbookManagement() {
    const [textbooks, setTextbooks] = useState<any[]>([]);
    const [newBook, setNewBook] = useState({ book_name: '', subject: '英語', level: '基礎徹底', duration: 0 });

    // フィルター用ステート
    const [filterSubject, setFilterSubject] = useState("ALL");
    const [filterLevel, setFilterLevel] = useState("ALL");
    const [filterName, setFilterName] = useState("");

    // データ取得
    const fetchBooks = async () => {
        try { 
            const res = await api.get('/common/textbooks'); 
            setTextbooks(res.data); 
        } catch (e) { 
            toast.error("データ取得失敗"); 
        }
    };
    useEffect(() => { fetchBooks(); }, []);

    // 科目リスト抽出
    const existingSubjects = textbooks.map((t: any) => t.subject).filter(Boolean);
    const uniqueSubjects = Array.from(new Set(existingSubjects));

    // フィルタリングロジック
    const filteredTextbooks = textbooks.filter(t => {
        const matchSubject = filterSubject === "ALL" || t.subject === filterSubject;
        const matchLevel = filterLevel === "ALL" || t.level === filterLevel;
        const matchName = t.book_name.toLowerCase().includes(filterName.toLowerCase());
        return matchSubject && matchLevel && matchName;
    });

    const handleCreate = async () => {
        if (!newBook.book_name) return toast.error("参考書名は必須です");
        if (!newBook.subject) return toast.error("科目を選択してください");

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
            
            {/* --- 左列: 新規登録フォーム (4/12カラム) --- */}
            <Card className="lg:col-span-4 bg-gray-50/50">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Plus className="w-4 h-4" /> 新規参考書登録
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>参考書名 <span className="text-red-500">*</span></Label>
                        <Input 
                            value={newBook.book_name} 
                            onChange={e => setNewBook({ ...newBook, book_name: e.target.value })} 
                            placeholder="例: システム英単語"
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <Label>科目 <span className="text-red-500">*</span></Label>
                        <Select 
                            value={newBook.subject} 
                            onValueChange={v => setNewBook({ ...newBook, subject: v })}
                        >
                            <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                            <SelectContent>
                                {uniqueSubjects.map(subj => (
                                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                ))}
                                {/* 新規科目を入力可能にするには別途Inputが必要ですが、今回は選択のみ */}
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

                    <Button className="w-full mt-4" onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" /> 追加する
                    </Button>
                </CardContent>
            </Card>

            {/* --- 右列: 参考書リスト & フィルター (8/12カラム) --- */}
            <div className="lg:col-span-8 space-y-4">
                
                {/* フィルターエリア */}
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                        <Filter className="w-4 h-4" /> 絞り込み:
                    </div>
                    
                    {/* 科目フィルター */}
                    <div className="w-full md:w-32">
                        <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="全科目" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全科目</SelectItem>
                                {uniqueSubjects.map(subj => (
                                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* レベルフィルター */}
                    <div className="w-full md:w-32">
                        <Select value={filterLevel} onValueChange={setFilterLevel}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="全レベル" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全レベル</SelectItem>
                                <SelectItem value="基礎徹底">基礎徹底</SelectItem>
                                <SelectItem value="日大">日大</SelectItem>
                                <SelectItem value="MARCH">MARCH</SelectItem>
                                <SelectItem value="早慶">早慶</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 名前検索 */}
                    <div className="flex-1 w-full relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                        <Input 
                            placeholder="参考書名で検索..." 
                            value={filterName}
                            onChange={e => setFilterName(e.target.value)}
                            className="h-9 pl-8 text-xs"
                        />
                    </div>
                </div>

                {/* リスト表示エリア */}
                <div className="border rounded-md bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="overflow-auto flex-1">
                        <Table>
                            <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>参考書名</TableHead>
                                    <TableHead className="w-24">科目</TableHead>
                                    <TableHead className="w-24">レベル</TableHead>
                                    <TableHead className="w-20 text-right">時間</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTextbooks.map((t: any) => (
                                    <TableRow key={t.id} className="hover:bg-gray-50/50">
                                        <TableCell className="font-medium py-2">{t.book_name}</TableCell>
                                        <TableCell className="py-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                                {t.subject}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-2 text-xs text-muted-foreground">{t.level}</TableCell>
                                        <TableCell className="text-right py-2 text-xs">{t.duration}h</TableCell>
                                        <TableCell className="py-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(t.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredTextbooks.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            {textbooks.length === 0 ? "データがありません" : "条件に一致する参考書が見つかりません"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="bg-gray-50 border-t p-2 text-xs text-muted-foreground text-right">
                        合計: {filteredTextbooks.length} 冊 (全 {textbooks.length} 冊中)
                    </div>
                </div>
            </div>
        </div>
    );
}