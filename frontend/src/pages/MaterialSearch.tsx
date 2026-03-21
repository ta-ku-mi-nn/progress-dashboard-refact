import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Tag, TeachingMaterial } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Search, Printer, FileText, Info } from 'lucide-react';

export default function MaterialSearch() {
    const [allMaterials, setAllMaterials] = useState<TeachingMaterial[]>([]);
    const [filteredMaterials, setFilteredMaterials] = useState<TeachingMaterial[]>([]);
    const [subjects, setSubjects] = useState<Tag[]>([]);
    const [details, setDetails] = useState<Tag[]>([]);

    // 検索・フィルター用ステート
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // 初期データの取得
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [matRes, subRes, detRes] = await Promise.all([
                    api.get('/materials/'),
                    api.get('/materials/tags/subjects'),
                    api.get('/materials/tags/details')
                ]);
                setAllMaterials(matRes.data);
                setFilteredMaterials(matRes.data); // 初期表示は全件
                setSubjects(subRes.data);
                setDetails(detRes.data);
            } catch (error) {
                console.error("データ取得エラー", error);
            }
        };
        fetchData();
    }, []);

    // 爆速検索のためのフロントエンド・フィルタリング処理
    useEffect(() => {
        let result = allMaterials;

        // キーワード検索
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(m => 
                m.title.toLowerCase().includes(lowerQuery) || 
                (m.internal_memo && m.internal_memo.toLowerCase().includes(lowerQuery))
            );
        }

        // 科目タグでの絞り込み
        if (selectedSubjectId) {
            result = result.filter(m => m.subjects?.some(s => s.id === selectedSubjectId));
        }

        // 詳細タグでの絞り込み
        if (selectedDetailId) {
            result = result.filter(m => m.detail_tags?.some(d => d.id === selectedDetailId));
        }

        setFilteredMaterials(result);
    }, [searchQuery, selectedSubjectId, selectedDetailId, allMaterials]);

    // ★PDFを別タブで開く（認証ヘッダーを付与しつつBlobとして取得する安全な方法）
    const handlePreviewAndPrint = async (materialId: number) => {
        setIsLoading(true);
        try {
            const response = await api.get(`/materials/${materialId}/pdf`, {
                responseType: 'blob' // PDFバイナリとして受け取る
            });
            // Blob URLを生成して別タブで開く
            const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error("PDFの取得に失敗しました", error);
            alert("ファイルの読み込みに失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">教材・プリント検索</h1>
                </div>
            </div>

            {/* --- 検索フィルター部 --- */}
            <div className="bg-white p-5 rounded-lg shadow-sm border space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <Input 
                        className="pl-10 text-lg py-6" 
                        placeholder="教材名やメモの内容で検索..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-col md:flex-row gap-6 pt-2">
                    {/* 科目タグフィルター */}
                    <div className="flex-1">
                        <span className="text-sm font-bold text-gray-700 block mb-2">科目で絞り込む</span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedSubjectId(null)}
                                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${!selectedSubjectId ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >すべて</button>
                            {subjects.map(s => (
                                <button
                                    key={s.id} onClick={() => setSelectedSubjectId(s.id)}
                                    className={`px-4 py-1.5 text-sm rounded-full transition-colors ${selectedSubjectId === s.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                >{s.name}</button>
                            ))}
                        </div>
                    </div>

                    {/* 詳細タグフィルター */}
                    <div className="flex-1">
                        <span className="text-sm font-bold text-gray-700 block mb-2">詳細で絞り込む</span>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedDetailId(null)}
                                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${!selectedDetailId ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >すべて</button>
                            {details.map(d => (
                                <button
                                    key={d.id} onClick={() => setSelectedDetailId(d.id)}
                                    className={`px-4 py-1.5 text-sm rounded-full transition-colors ${selectedDetailId === d.id ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                                >{d.name}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 検索結果一覧部 --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMaterials.map(m => (
                    <Card key={m.id} className="hover:border-blue-300 transition-colors flex flex-col h-full">
                        <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex-1 space-y-3">
                                <h3 className="font-bold text-lg text-gray-900 leading-tight">{m.title}</h3>
                                
                                <div className="flex flex-wrap gap-1">
                                    {m.subjects?.map(s => <span key={s.id} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">{s.name}</span>)}
                                    {m.detail_tags?.map(d => <span key={d.id} className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">{d.name}</span>)}
                                </div>

                                {m.internal_memo && (
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-900 mt-2">
                                        <div className="flex items-center gap-1 font-bold mb-1">
                                            <Info className="w-4 h-4" /> 指導メモ
                                        </div>
                                        <p className="whitespace-pre-wrap">{m.internal_memo}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="pt-4 mt-auto">
                                <Button 
                                    className="w-full gap-2" 
                                    onClick={() => handlePreviewAndPrint(m.id)}
                                    disabled={isLoading}
                                >
                                    <Printer className="w-4 h-4" />
                                    プレビュー / 印刷
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredMaterials.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-lg border border-dashed">
                        該当する教材が見つかりませんでした。
                    </div>
                )}
            </div>
        </div>
    );
}