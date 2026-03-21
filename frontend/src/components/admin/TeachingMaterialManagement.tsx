import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Tag, TeachingMaterial } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export default function TeachingMaterialManagement() {
    const [materials, setMaterials] = useState<TeachingMaterial[]>([]);
    const [subjects, setSubjects] = useState<Tag[]>([]);
    const [details, setDetails] = useState<Tag[]>([]);
    
    // フォーム用ステート
    const [title, setTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedDetail, setSelectedDetail] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);

    const [newSubjectName, setNewSubjectName] = useState('');
    const [newDetailName, setNewDetailName] = useState('');

    // データ取得
    const fetchData = async () => {
        try {
            const [matRes, subRes, detRes] = await Promise.all([
                api.get('/materials/'),
                api.get('/materials/tags/subjects'),
                api.get('/materials/tags/details')
            ]);
            setMaterials(matRes.data);
            setSubjects(subRes.data);
            setDetails(detRes.data);
        } catch (error) {
            console.error("データの取得に失敗しました", error);
            alert("データの読み込みに失敗しました。");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 教材のアップロード処理
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return alert("タイトルとファイルは必須です");

        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);
        if (memo) formData.append('internal_memo', memo);
        if (selectedSubject && selectedSubject !== "none") formData.append('subject_id', selectedSubject);
        if (selectedDetail && selectedDetail !== "none") formData.append('detail_tag_id', selectedDetail);

        try {
            await api.post('/materials/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("アップロード成功しました！");
            setTitle('');
            setMemo('');
            setFile(null);
            fetchData();
        } catch (error) {
            console.error("アップロード失敗", error);
            alert("アップロードに失敗しました。PDFファイルか確認してください。");
        }
    };

    // 教材の削除処理
    const handleDeleteMaterial = async (id: number) => {
        if (!window.confirm("本当に削除しますか？")) return;
        try {
            await api.delete(`/materials/${id}`);
            fetchData();
        } catch (error) {
            alert("削除に失敗しました");
        }
    };

    // タグの追加処理
    const handleAddTag = async (type: 'subjects' | 'details', name: string, setName: (val: string) => void) => {
        if (!name) return;
        try {
            await api.post(`/materials/tags/${type}`, { name });
            setName('');
            fetchData();
        } catch (error) {
            alert("タグの追加に失敗しました");
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">教材アップロード・一覧</TabsTrigger>
                    <TabsTrigger value="tags">タグ管理</TabsTrigger>
                </TabsList>

                {/* --- 教材管理タブ --- */}
                <TabsContent value="upload" className="space-y-6">
                    {/* アップロードフォーム */}
                    <form onSubmit={handleUpload} className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                        <h3 className="font-bold text-lg">新規教材アップロード</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>教材タイトル (必須)</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="例: 関係代名詞 基本プリント" />
                            </div>
                            <div className="space-y-2">
                                <Label>PDFファイル (必須)</Label>
                                <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>科目タグ</Label>
                                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                                    <SelectTrigger><SelectValue placeholder="科目を選択" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">指定なし</SelectItem>
                                        {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>詳細タグ</Label>
                                <Select value={selectedDetail} onValueChange={setSelectedDetail}>
                                    <SelectTrigger><SelectValue placeholder="詳細を選択" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">指定なし</SelectItem>
                                        {details.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>内部メモ・指導ポイント (講師のみ閲覧)</Label>
                            <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="教える際の注意点や、どのルートで使うかなどのメモ" />
                        </div>
                        <Button type="submit" className="w-full">アップロード</Button>
                    </form>

                    {/* 教材一覧テーブル */}
                    <div>
                        <h3 className="font-bold text-lg mb-2">登録済み教材一覧</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>タイトル</TableHead>
                                    <TableHead>科目</TableHead>
                                    <TableHead>詳細</TableHead>
                                    <TableHead>操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.map(m => (
                                    <TableRow key={m.id}>
                                        <TableCell className="font-medium">{m.title}</TableCell>
                                        <TableCell>{m.subject?.name || '-'}</TableCell>
                                        <TableCell>{m.detail_tag?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteMaterial(m.id)}>削除</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {materials.length === 0 && (
                                    <TableRow><TableCell colSpan={4} className="text-center text-gray-500">教材がありません</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* --- タグ管理タブ --- */}
                <TabsContent value="tags" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 科目タグ */}
                        <div className="space-y-4">
                            <h3 className="font-bold border-b pb-2">科目タグ (英語, 数学など)</h3>
                            <div className="flex gap-2">
                                <Input value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="新しい科目" />
                                <Button onClick={() => handleAddTag('subjects', newSubjectName, setNewSubjectName)}>追加</Button>
                            </div>
                            <ul className="list-disc pl-5 space-y-1">
                                {subjects.map(s => <li key={s.id}>{s.name}</li>)}
                            </ul>
                        </div>
                        {/* 詳細タグ */}
                        <div className="space-y-4">
                            <h3 className="font-bold border-b pb-2">詳細タグ (長文, 単語など)</h3>
                            <div className="flex gap-2">
                                <Input value={newDetailName} onChange={e => setNewDetailName(e.target.value)} placeholder="新しい詳細" />
                                <Button onClick={() => handleAddTag('details', newDetailName, setNewDetailName)}>追加</Button>
                            </div>
                            <ul className="list-disc pl-5 space-y-1">
                                {details.map(d => <li key={d.id}>{d.name}</li>)}
                            </ul>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}