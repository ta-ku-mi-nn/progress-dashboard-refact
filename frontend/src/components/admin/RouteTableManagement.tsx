// frontend/src/components/admin/RouteTableManagement.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Map, Upload, Trash2, Download, FileText } from 'lucide-react';
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
    const [subject, setSubject] = useState("英語");
    const [level, setLevel] = useState("標準");
    const [year, setYear] = useState(new Date().getFullYear().toString());

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

    // アップロード処理
    const handleUpload = async () => {
        if (!selectedFile) return toast.error("ファイルを選択してください");

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("subject", subject);
        formData.append("level", level);
        formData.append("academic_year", year);

        try {
            await api.post('/routes/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("アップロードしました");
            setSelectedFile(null);
            // ファイル入力をリセットするための工夫（IDを変えるなど）が必要ですが、今回は簡易的に
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
        // 別タブで開く、もしくは直接ダウンロードURLを叩く
        const url = `${api.getUri()}/routes/download/${id}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* アップロードフォーム */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <h4 className="font-medium text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> 新規ルート表登録
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                        <Label>科目</Label>
                        <Select value={subject} onValueChange={setSubject}>
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
                        <Label>レベル</Label>
                        <Input value={level} onChange={(e) => setLevel(e.target.value)} placeholder="例: 東大レベル" />
                    </div>
                    <div className="space-y-1">
                        <Label>年度</Label>
                        <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <Label>ファイル (PDF推奨)</Label>
                        <Input 
                            id="route-file-upload"
                            type="file" 
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
                            className="cursor-pointer bg-white"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleUpload} disabled={!selectedFile}>
                        <Upload className="w-4 h-4 mr-2" /> アップロード
                    </Button>
                </div>
            </div>

            {/* ファイル一覧 */}
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>科目</TableHead>
                            <TableHead>レベル</TableHead>
                            <TableHead>年度</TableHead>
                            <TableHead>ファイル名</TableHead>
                            <TableHead className="w-24">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => (
                            <TableRow key={file.id}>
                                <TableCell className="font-medium">{file.subject}</TableCell>
                                <TableCell>{file.level}</TableCell>
                                <TableCell>{file.academic_year}</TableCell>
                                <TableCell className="flex items-center gap-2 text-sm text-gray-600">
                                    <FileText className="w-4 h-4" /> {file.filename}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleDownload(file.id)}>
                                            <Download className="w-4 h-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {files.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    ルート表が登録されていません
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
