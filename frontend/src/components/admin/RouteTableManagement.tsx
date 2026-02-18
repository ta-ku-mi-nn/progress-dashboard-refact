import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Upload, Trash2, Download, FileText, Filter, Edit, Save, X } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface RouteTableItem {
    id: number;
    filename: string;
    subject: string;
    level: string;
    academic_year: number;
    uploaded_at: string;
}

export default function RouteTableManagement() {
    const [files, setFiles] = useState<RouteTableItem[]>([]);
    
    // アップロード/編集用ステート
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const [formData, setFormData] = useState({
        subject: "英語",
        level: "",
        year: new Date().getFullYear().toString()
    });

    // フィルター用ステート
    const [filterSubject, setFilterSubject] = useState("ALL");
    const [filterYear, setFilterYear] = useState("ALL");

    const fetchFiles = async () => {
        try {
            const res = await api.get('/routes/list');
            setFiles(res.data);
        } catch (e) {
            toast.error("一覧の取得に失敗しました");
        }
    };

    useEffect(() => { fetchFiles(); }, []);

    // 編集モード開始
    const startEdit = (file: RouteTableItem) => {
        setIsEditing(true);
        setEditId(file.id);
        setFormData({
            subject: file.subject,
            level: file.level,
            year: file.academic_year.toString()
        });
        setSelectedFile(null); // 編集時はファイル変更は任意（今回はメタデータ編集のみとする）
    };

    // 編集キャンセル
    const cancelEdit = () => {
        setIsEditing(false);
        setEditId(null);
        setFormData({ subject: "英語", level: "", year: new Date().getFullYear().toString() });
        setSelectedFile(null);
        const fileInput = document.getElementById('route-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

    // 送信処理 (登録 or 更新)
    const handleSubmit = async () => {
        if (!isEditing && !selectedFile) return toast.error("ファイルを選択してください");
        if (!formData.level) return toast.error("レベルを入力してください");

        try {
            if (isEditing && editId) {
                // 更新処理 (APIがまだないので仮実装: メタデータのみ更新の想定)
                // ※本来は PATCH /routes/{id} を実装して呼び出す
                // 今回は簡易的に「更新機能は未実装」のトーストを出すか、
                // もしくは既存のアップロードAPIを使い回すかですが、
                // ユーザー体験のため一旦「更新しました(仮)」とします。
                // ★後でバックエンドに update_route_table を実装してください。
                toast.info("編集機能はバックエンド実装待ちです");
                cancelEdit();
            } else {
                // 新規登録
                const data = new FormData();
                if (selectedFile) data.append("file", selectedFile);
                data.append("subject", formData.subject);
                data.append("level", formData.level);
                data.append("academic_year", formData.year);

                await api.post('/routes/upload', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success("アップロードしました");
                cancelEdit();
                fetchFiles();
            }
        } catch (e) {
            toast.error("処理に失敗しました");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await api.delete(`/routes/${id}`);
            toast.success("削除しました");
            fetchFiles();
        } catch (e) { toast.error("削除失敗"); }
    };

    const handleDownload = (id: number) => {
        const url = `${api.getUri()}/routes/download/${id}`;
        window.open(url, '_blank');
    };

    // フィルタリング
    const filteredFiles = files.filter(f => {
        const matchSubject = filterSubject === "ALL" || f.subject === filterSubject;
        const matchYear = filterYear === "ALL" || f.academic_year.toString() === filterYear;
        return matchSubject && matchYear;
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
            
            {/* 左列: フォーム (4/12) */}
            <Card className="lg:col-span-4 bg-gray-50/50">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        {isEditing ? <Edit className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {isEditing ? "ルート表情報を編集" : "新規ルート表登録"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>科目</Label>
                        <Select value={formData.subject} onValueChange={v => setFormData({...formData, subject: v})}>
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

                    <div className="space-y-1">
                        <Label>レベル名</Label>
                        <Input 
                            value={formData.level} 
                            onChange={e => setFormData({...formData, level: e.target.value})} 
                            placeholder="例: 東大レベル" 
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>対象年度</Label>
                        <Input 
                            type="number" 
                            value={formData.year} 
                            onChange={e => setFormData({...formData, year: e.target.value})} 
                        />
                    </div>

                    {!isEditing && (
                        <div className="space-y-1">
                            <Label>ファイル (PDF推奨)</Label>
                            <Input 
                                id="route-file-upload"
                                type="file" 
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                                className="cursor-pointer bg-white file:text-xs text-sm"
                            />
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        {isEditing && (
                            <Button variant="outline" className="flex-1" onClick={cancelEdit}>
                                <X className="w-4 h-4 mr-2" /> キャンセル
                            </Button>
                        )}
                        <Button className="flex-1" onClick={handleSubmit} disabled={!isEditing && !selectedFile}>
                            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            {isEditing ? "更新する" : "アップロード"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 右列: 一覧 (8/12) - 幅広対応 */}
            <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                        <Filter className="w-4 h-4" /> 絞り込み:
                    </div>
                    <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="全科目" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">全科目</SelectItem>
                            <SelectItem value="英語">英語</SelectItem>
                            <SelectItem value="数学">数学</SelectItem>
                            <SelectItem value="国語">国語</SelectItem>
                            <SelectItem value="理科">理科</SelectItem>
                            <SelectItem value="社会">社会</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="全年度" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">全年度</SelectItem>
                            {Array.from(new Set(files.map(f => f.academic_year))).sort((a,b)=>b-a).map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}年度</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="border rounded-md bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="overflow-auto flex-1">
                        <Table className="w-full min-w-[600px]">
                            <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[80px] whitespace-nowrap">科目</TableHead>
                                    <TableHead className="w-[120px]">レベル</TableHead>
                                    <TableHead className="w-[80px]">年度</TableHead>
                                    <TableHead>ファイル名</TableHead>
                                    <TableHead className="w-[100px] text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFiles.map((file) => (
                                    <TableRow key={file.id} className="hover:bg-gray-50/50">
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap ${
                                                file.subject === '英語' ? 'bg-blue-500' :
                                                file.subject === '数学' ? 'bg-green-500' :
                                                file.subject === '国語' ? 'bg-red-500' : 'bg-gray-500'
                                            }`}>
                                                {file.subject}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{file.level}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{file.academic_year}</TableCell>
                                        <TableCell className="text-sm truncate max-w-[200px]" title={file.filename}>
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3 h-3 text-gray-400" />
                                                {file.filename}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500" onClick={() => handleDownload(file.id)}>
                                                    <Download className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => startEdit(file)}>
                                                    <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(file.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}