import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Library, Plus, Trash2, Edit, ChevronDown, ChevronUp, X, Check } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function PresetManagement() {
    const [presets, setPresets] = useState<any[]>([]);
    const [textbooks, setTextbooks] = useState<any[]>([]);
    
    // モーダル制御用
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // フォーム用ステート
    const [formName, setFormName] = useState("");
    const [formSubject, setFormSubject] = useState("英語");
    const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
    
    // 詳細表示トグル用 (IDの配列)
    const [expandedPresets, setExpandedPresets] = useState<number[]>([]);

    // --- データ取得 ---
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

    // --- モーダル開閉・初期化 ---
    const openCreateModal = () => {
        setEditingId(null);
        setFormName("");
        setFormSubject("英語");
        setSelectedBooks([]);
        setIsModalOpen(true);
    };

    const openEditModal = (preset: any) => {
        setEditingId(preset.id);
        setFormName(preset.preset_name);
        setFormSubject(preset.subject);
        setSelectedBooks(preset.books); // 既存のリストをセット
        setIsModalOpen(true);
    };

    // --- 登録・更新処理 ---
    const handleSave = async () => {
        if (!formName) return toast.error("プリセット名は必須です");
        if (selectedBooks.length === 0) return toast.error("参考書を選択してください");

        const payload = {
            subject: formSubject,
            preset_name: formName,
            book_names: selectedBooks
        };

        try {
            if (editingId) {
                // 更新
                await api.put(`/admin/presets/${editingId}`, payload);
                toast.success("更新しました");
            } else {
                // 新規作成
                await api.post('/admin/presets', payload);
                toast.success("作成しました");
            }
            setIsModalOpen(false);
            fetchData();
        } catch (e) {
            toast.error("保存に失敗しました");
        }
    };

    // --- 削除処理 ---
    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await api.delete(`/admin/presets/${id}`);
            toast.success("削除しました");
            fetchData();
        } catch (e) { toast.error("削除失敗"); }
    };

    // --- 詳細表示トグル ---
    const toggleDetails = (id: number) => {
        setExpandedPresets(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    // --- 参考書選択ロジック ---
    // 選択中の科目で参考書リストをフィルタリング
    const availableBooks = textbooks.filter((t: any) => t.subject === formSubject);

    // チェックボックス操作 (左列)
    const toggleBookSelection = (bookName: string) => {
        setSelectedBooks(prev => 
            prev.includes(bookName) 
                ? prev.filter(b => b !== bookName)
                : [...prev, bookName]
        );
    };

    // 削除ボタン操作 (右列)
    const removeBook = (bookName: string) => {
        setSelectedBooks(prev => prev.filter(b => b !== bookName));
    };

    return (
        <div className="space-y-6 h-full">
            {/* ヘッダーエリア */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Library className="w-5 h-5" /> 登録済みプリセット
                </h3>
                <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2" /> 新規プリセット追加
                </Button>
            </div>

            {/* プリセット一覧エリア */}
            <div className="space-y-4">
                {presets.map((preset: any) => (
                    <Card key={preset.id} className="overflow-hidden">
                        <div className="p-4 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white min-w-[60px] text-center ${
                                    preset.subject === '英語' ? 'bg-blue-500' :
                                    preset.subject === '数学' ? 'bg-green-500' :
                                    preset.subject === '国語' ? 'bg-red-500' :
                                    'bg-gray-500'
                                }`}>
                                    {preset.subject}
                                </span>
                                <div>
                                    <h4 className="font-bold text-base">{preset.preset_name}</h4>
                                    <p className="text-xs text-muted-foreground">登録参考書数: {preset.books.length}冊</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => toggleDetails(preset.id)}>
                                    {expandedPresets.includes(preset.id) ? (
                                        <>閉じる <ChevronUp className="w-4 h-4 ml-1" /></>
                                    ) : (
                                        <>詳細 <ChevronDown className="w-4 h-4 ml-1" /></>
                                    )}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => openEditModal(preset)}>
                                    <Edit className="w-4 h-4 text-gray-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(preset.id)}>
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                            </div>
                        </div>
                        
                        {/* 詳細エリア (参考書リスト) */}
                        {expandedPresets.includes(preset.id) && (
                            <div className="bg-gray-50 p-4 border-t animate-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {preset.books.map((book: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded border text-sm shadow-sm">
                                            <Check className="w-3 h-3 text-green-500" />
                                            {book}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
                
                {presets.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg bg-gray-50">
                        プリセットが登録されていません
                    </div>
                )}
            </div>

            {/* 追加・編集モーダル */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "プリセット編集" : "新規プリセット作成"}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto py-4 px-1 space-y-6">
                        {/* 基本情報フォーム */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>プリセット名 <span className="text-red-500">*</span></Label>
                                <Input 
                                    value={formName} 
                                    onChange={e => setFormName(e.target.value)} 
                                    placeholder="例: 日大ルート" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>科目</Label>
                                <Select 
                                    value={formSubject} 
                                    onValueChange={(v) => {
                                        if (v !== formSubject) {
                                            if (confirm("科目を変更すると選択中のリストがクリアされますがよろしいですか？")) {
                                                setFormSubject(v);
                                                setSelectedBooks([]);
                                            }
                                        }
                                    }}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="英語">英語</SelectItem>
                                        <SelectItem value="数学">数学</SelectItem>
                                        <SelectItem value="国語">国語</SelectItem>
                                        <SelectItem value="理科">理科</SelectItem>
                                        <SelectItem value="社会">社会</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 参考書選択エリア (2カラム) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
                            
                            {/* 左列: 参考書リスト (選択元) */}
                            <div className="border rounded-md flex flex-col bg-gray-50">
                                <div className="p-3 border-b bg-white font-medium text-sm flex justify-between items-center">
                                    <span>参考書リスト ({formSubject})</span>
                                    <span className="text-xs text-muted-foreground">{availableBooks.length}冊</span>
                                </div>
                                <ScrollArea className="flex-1 p-3">
                                    <div className="space-y-1">
                                        {availableBooks.length > 0 ? availableBooks.map((book: any) => (
                                            <div 
                                                key={book.id} 
                                                className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
                                                    selectedBooks.includes(book.book_name) 
                                                        ? 'bg-blue-50 border-blue-200' 
                                                        : 'hover:bg-white bg-transparent'
                                                }`}
                                                onClick={() => toggleBookSelection(book.book_name)}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                                    selectedBooks.includes(book.book_name) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
                                                }`}>
                                                    {selectedBooks.includes(book.book_name) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="flex-1 text-sm">
                                                    <div className="font-medium">{book.book_name}</div>
                                                    <div className="text-xs text-muted-foreground">{book.level} / {book.duration}h</div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                この科目の参考書がありません
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* 右列: 選択済みリスト (追加先) */}
                            <div className="border rounded-md flex flex-col bg-white border-blue-200">
                                <div className="p-3 border-b bg-blue-50 font-medium text-sm flex justify-between items-center text-blue-900">
                                    <span>選択済み参考書</span>
                                    <span className="text-xs font-bold">{selectedBooks.length}冊</span>
                                </div>
                                <ScrollArea className="flex-1 p-3">
                                    <div className="space-y-2">
                                        {selectedBooks.length > 0 ? selectedBooks.map((bookName, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded border bg-gray-50 text-sm group">
                                                <span>{bookName}</span>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                                                    onClick={() => removeBook(bookName)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="text-center py-20 text-sm text-muted-foreground">
                                                左のリストから選択してください
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 border-t mt-auto">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave}>保存する</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}