import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Library, Plus, Trash2, Check } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function PresetManagement() {
    const [presets, setPresets] = useState<any[]>([]);
    const [textbooks, setTextbooks] = useState<any[]>([]);
    
    // 作成用フォーム
    const [presetName, setPresetName] = useState("");
    const [targetSubject, setTargetSubject] = useState("英語");
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);

    // 初期データ取得
    const fetchData = async () => {
        try {
            const [resPresets, resBooks] = await Promise.all([
                api.get('/admin/presets'),
                api.get('/common/textbooks')
            ]);
            setPresets(resPresets.data);
            setTextbooks(resBooks.data);
        } catch (e) {
            toast.error("データ取得に失敗しました");
        }
    };

    useEffect(() => { fetchData(); }, []);

    // 選択された科目で参考書リストをフィルタリング
    const availableBooks = textbooks.filter((t: any) => t.subject === targetSubject);

    // チェックボックス操作
    const toggleBook = (bookName: string) => {
        setSelectedBooks(prev => 
            prev.includes(bookName) 
                ? prev.filter(b => b !== bookName)
                : [...prev, bookName]
        );
    };

    const handleCreate = async () => {
        if (!presetName) return toast.error("プリセット名は必須です");
        if (selectedBooks.length === 0) return toast.error("参考書を少なくとも1つ選択してください");

        try {
            await api.post('/admin/presets', {
                subject: targetSubject,
                preset_name: presetName,
                book_names: selectedBooks
            });
            toast.success("プリセットを作成しました");
            fetchData();
            // リセット
            setPresetName("");
            setSelectedBooks([]);
        } catch (e) {
            toast.error("作成失敗: 同名のプリセットが存在する可能性があります");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await api.delete(`/admin/presets/${id}`);
            toast.success("削除しました");
            fetchData();
        } catch (e) {
            toast.error("削除失敗");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
            
            {/* --- 左列: 新規作成 (5/12) --- */}
            <Card className="lg:col-span-5 bg-gray-50/50">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Plus className="w-4 h-4" /> 新規プリセット作成
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>プリセット名</Label>
                        <Input 
                            placeholder="例: 日大ルート（英語）" 
                            value={presetName}
                            onChange={e => setPresetName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>対象科目</Label>
                        <Select value={targetSubject} onValueChange={(v) => { setTargetSubject(v); setSelectedBooks([]); }}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="英語">英語</SelectItem>
                                <SelectItem value="数学">数学</SelectItem>
                                <SelectItem value="国語">国語</SelectItem>
                                <SelectItem value="理科">理科</SelectItem>
                                <SelectItem value="社会">社会</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            ※科目を選択すると、その科目の参考書一覧が表示されます
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>含める参考書 ({selectedBooks.length}冊 選択中)</Label>
                        <ScrollArea className="h-60 border rounded-md bg-white p-2">
                            {availableBooks.length > 0 ? (
                                availableBooks.map((book: any) => (
                                    <div key={book.id} className="flex items-center space-x-2 py-1.5 px-1 hover:bg-gray-50 rounded">
                                        <input
                                            type="checkbox"
                                            id={`book-${book.id}`}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            checked={selectedBooks.includes(book.book_name)}
                                            onChange={() => toggleBook(book.book_name)}
                                        />
                                        <label 
                                            htmlFor={`book-${book.id}`} 
                                            className="text-sm cursor-pointer flex-1"
                                        >
                                            <span className="font-medium">{book.book_name}</span>
                                            <span className="ml-2 text-xs text-muted-foreground">({book.level})</span>
                                        </label>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-sm text-muted-foreground">
                                    この科目の参考書は登録されていません
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <Button className="w-full" onClick={handleCreate} disabled={selectedBooks.length === 0}>
                        <Library className="w-4 h-4 mr-2" /> プリセットを作成
                    </Button>
                </CardContent>
            </Card>

            {/* --- 右列: 一覧 (7/12) --- */}
            <div className="lg:col-span-7 space-y-4">
                <div className="border rounded-md bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <div className="p-3 border-b bg-gray-50 font-medium text-sm">
                        登録済みプリセット一覧
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {presets.map((preset: any) => (
                                <div key={preset.id} className="border rounded-lg p-4 relative group hover:shadow-md transition-shadow">
                                    <div className="absolute top-4 right-4">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(preset.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs text-white ${
                                            preset.subject === '英語' ? 'bg-blue-500' :
                                            preset.subject === '数学' ? 'bg-green-500' :
                                            preset.subject === '国語' ? 'bg-red-500' :
                                            'bg-gray-500'
                                        }`}>
                                            {preset.subject}
                                        </span>
                                        {preset.preset_name}
                                    </h3>
                                    
                                    <div className="mt-3">
                                        <p className="text-xs text-muted-foreground mb-1">含まれる参考書:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {preset.books.map((bookName: string, idx: number) => (
                                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-700">
                                                    <Check className="w-3 h-3 mr-1 text-green-600" />
                                                    {bookName}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {presets.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    プリセットがまだありません
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}