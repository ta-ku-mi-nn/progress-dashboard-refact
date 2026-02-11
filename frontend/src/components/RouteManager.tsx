import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Download, FileText, Search, Filter } from 'lucide-react';
import api from '../lib/api';

// --- 型定義 ---
interface RouteFile {
  id: number;
  filename: string;
  subject: string;
  level: string;
  academic_year: number;
  uploaded_at: string;
}

// Props: 生徒IDは今回は使いませんが、共通I/Fとして残しておきます
interface RouteManagerProps {
  studentId: number; 
}

export default function RouteManager({ studentId }: RouteManagerProps) {
  const [files, setFiles] = useState<RouteFile[]>([]);
  const [loading, setLoading] = useState(false);
  
  // フィルタ用State
  const [filterSubject, setFilterSubject] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  // データ取得
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/routes/list');
      setFiles(res.data);
    } catch (e) {
      console.error("Failed to fetch routes", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ダウンロード処理
  const handleDownload = async (file: RouteFile) => {
    try {
      const response = await api.get(`/routes/download/${file.id}`, {
        responseType: 'blob', // バイナリデータとして受け取る
      });
      
      // ブラウザでダウンロードリンクを作成してクリックさせる
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.filename); // ファイル名を指定
      document.body.appendChild(link);
      link.click();
      
      // クリーンアップ
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("ダウンロードに失敗しました");
      console.error(e);
    }
  };

  // フィルタリング処理
  const filteredFiles = files.filter(f => {
      const matchSubj = filterSubject === "" || (f.subject && f.subject.includes(filterSubject));
      const matchLevel = filterLevel === "" || (f.level && f.level.includes(filterLevel));
      return matchSubj && matchLevel;
  });

  // ユニークな科目・レベルのリストを作成（セレクトボックス用）
  const subjects = Array.from(new Set(files.map(f => f.subject).filter(Boolean)));
  const levels = Array.from(new Set(files.map(f => f.level).filter(Boolean)));

  return (
    <Card className="h-full flex flex-col border shadow-sm min-h-[90vh]">
      <CardHeader className="px-4 py-3 border-b shrink-0 bg-white rounded-t-lg flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            学習ルート表 (PDFダウンロード)
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchData} className="h-8 text-xs">
            更新
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-4 bg-gray-50/30 flex flex-col min-h-0">
        {/* フィルタエリア */}
        <div className="flex gap-2 mb-4 bg-white p-2 rounded border shrink-0">
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                    className="h-8 text-xs border rounded px-2 min-w-[120px]"
                    value={filterSubject}
                    onChange={e => setFilterSubject(e.target.value)}
                >
                    <option value="">全科目</option>
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <select 
                    className="h-8 text-xs border rounded px-2 min-w-[120px]"
                    value={filterLevel}
                    onChange={e => setFilterLevel(e.target.value)}
                >
                    <option value="">全レベル</option>
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
            </div>
        </div>

        {/* ファイルリスト */}
        <div className="flex-1 overflow-auto border rounded-md bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ファイル名</TableHead>
                        <TableHead className="w-24">科目</TableHead>
                        <TableHead className="w-24">レベル</TableHead>
                        <TableHead className="w-20">年度</TableHead>
                        <TableHead className="w-32">アップロード日</TableHead>
                        <TableHead className="w-24 text-center">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredFiles.map((file) => (
                        <TableRow key={file.id}>
                            <TableCell className="font-medium text-sm">
                                <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                                    {file.filename}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs">
                                {file.subject && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{file.subject}</span>}
                            </TableCell>
                            <TableCell className="text-xs">{file.level}</TableCell>
                            <TableCell className="text-xs">{file.academic_year}年度</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {new Date(file.uploaded_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-center">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleDownload(file)}>
                                    <Download className="w-3 h-3 mr-1" />
                                    DL
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {filteredFiles.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                {loading ? "読み込み中..." : "該当するファイルがありません"}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
