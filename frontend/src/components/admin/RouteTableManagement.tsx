import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Map, Upload, Trash2, Download, FileText, Filter } from 'lucide-react';
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    // アップロード用ステート
    const [uploadSubject, setUploadSubject] = useState("英語");
    const [uploadLevel, setUploadLevel] = useState("");
    const [uploadYear, setUploadYear] = useState(new Date().getFullYear().toString());

    // フィルター用ステート
    const [filterSubject, setFilterSubject] = useState("ALL");
    const [filterYear, setFilterYear] = useState("ALL");

    // 一覧取得
    const fetchFiles = async () => {
        try {
            const res = await api.get('/routes/list');
            setFiles(res.data);
        } catch (e) {
            console.error(e);
            toast.error("一覧の取得に失敗しました");
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    // フィルター用リスト生成
    const uniqueYears = Array.from(new Set(files.map(f => f.academic_year))).sort((a, b) => b - a);
    
    // フィルタリング処理
    const filteredFiles = files.filter(f => {
        const matchSubject = filterSubject === "ALL" || f.subject === filterSubject;
        const matchYear = filterYear === "ALL" || f.academic_year.toString() === filterYear;
        return matchSubject && matchYear;
    });

    // アップロード処理
    const handleUpload = async () => {
        if (!selectedFile) return toast.error("ファイルを選択してください");
        if (!uploadLevel) return toast.error("レベルを入力してください");

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("subject", uploadSubject);
        formData.append("level", uploadLevel);
        formData.append("academic_year", uploadYear);

        try {
            await api.post('/routes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("アップロードしました");
            
            // リセット
            setSelectedFile(null);
            setUploadLevel("");
            const fileInput = document.getElementById('route-file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = "";
            
            fetchFiles();
        } catch (e) {
            console.error(e);
            toast.error("アップロードに失敗しました");
        }
    };

    // 削除処理
    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await api.delete(`/routes/${id}`);
            toast.success("削除しました");
            fetchFiles();
        } catch (e) {
            toast.error("削除失敗");
        }
    };

    // ダウンロード処理
    const handleDownload = (id: number) => {
        const url = `${api.getUri()}/routes/download/${id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
            
            {/* --- 左列: 新規登録フォーム (4/12カラム) --- */}
            <Card className="lg:col-span-4 bg-gray-50/50">
                <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                        <Upload className="w-4 h-4" /> 新規ルート表登録
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>科目</Label>
                        <Select value={uploadSubject} onValueChange={setUploadSubject}>
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
                            value={uploadLevel} 
                            onChange={(e) => setUploadLevel(e.target.value)} 
                            placeholder="例: 東大レベル, 日大レベル" 
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>対象年度</Label>
                        <Input 
                            type="number" 
                            value={uploadYear} 
                            onChange={(e) => setUploadYear(e.target.value)} 
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>ファイル (PDF推奨)</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                id="route-file-upload"
                                type="file" 
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                                className="cursor-pointer bg-white file:text-xs text-sm"
                            />
                        </div>
                    </div>

                    <Button className="w-full mt-4" onClick={handleUpload} disabled={!selectedFile}>
                        <Upload className="w-4 h-4 mr-2" /> アップロード
                    </Button>
                </CardContent>
            </Card>

            {/* --- 右列: ルート表一覧 (8/12カラム) --- */}
            <div className="lg:col-span-8 space-y-4">
                
                {/* フィルターエリア */}
                <div className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-white p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
                        <Filter className="w-4 h-4" /> 絞り込み:
                    </div>
                    
                    <div className="w-full md:w-32">
                        <Select value={filterSubject} onValueChange={setFilterSubject}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="全科目" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全科目</SelectItem>
                                <SelectItem value="英語">英語</SelectItem>
                                <SelectItem value="数学">数学</SelectItem>
                                <SelectItem value="国語">国語</SelectItem>
                                <SelectItem value="理科">理科</SelectItem>
                                <SelectItem value="社会">社会</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:w-32">
                        <Select value={filterYear} onValueChange={setFilterYear}>
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="全年度" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全年度</SelectItem>
                                {uniqueYears.map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}年度</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 一覧テーブル */}
                <div className="border rounded-md bg-white shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="overflow-auto flex-1">
                        <Table>
                            <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-20">科目</TableHead>
                                    <TableHead className="w-32">レベル</TableHead>
                                    <TableHead className="w-20">年度</TableHead>
                                    <TableHead>ファイル名</TableHead>
                                    <TableHead className="w-24 text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFiles.map((file) => (
                                    <TableRow key={file.id} className="hover:bg-gray-50/50">
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${
                                                file.subject === '英語' ? 'bg-blue-500' :
                                                file.subject === '数学' ? 'bg-green-500' :
                                                file.subject === '国語' ? 'bg-red-500' :
                                                'bg-gray-500'
                                            }`}>
                                                {file.subject}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">{file.level}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{file.academic_year}</TableCell>
                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span className="truncate max-w-[200px]" title={file.filename}>{file.filename}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700" onClick={() => handleDownload(file.id)}>
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleDelete(file.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredFiles.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                            {files.length === 0 ? "ルート表が登録されていません" : "条件に一致するファイルが見つかりません"}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="bg-gray-50 border-t p-2 text-xs text-muted-foreground text-right">
                        合計: {filteredFiles.length} 件 (全 {files.length} 件中)
                    </div>
                </div>
            </div>
        </div>
    );
}