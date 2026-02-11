import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RouteManager from '../components/RouteManager';
import api from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// 生徒データの型定義
interface Student {
  id: number;
  name: string;
}

const RootTable: React.FC = () => {
    const { user } = useAuth();
    
    // 生徒リストと選択中の生徒ID
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // データ取得ロジック
    useEffect(() => {
        const init = async () => {
            if (!user) return;

            try {
                // 1. 生徒自身がログインしている場合
                if ((user as any).student_id) {
                    setSelectedStudentId((user as any).student_id);
                    setLoading(false);
                    return;
                }

                // 2. 講師/管理者の場合 -> 生徒一覧を取得
                const res = await api.get('/students'); 
                const studentList = res.data;
                setStudents(studentList);

                // 初期選択: リストの先頭を選択
                if (studentList.length > 0) {
                    setSelectedStudentId(studentList[0].id);
                }
            } catch (e) {
                console.error("Failed to fetch students", e);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [user]);

    // ローディング中
    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
    }

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-8 pt-6 gap-4">
            
            {/* ヘッダーエリア */}
            <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">学習ルート表</h2>
                
                {/* 講師の場合のみ生徒切り替えを表示 (今回はPDF機能なので必須ではないですが、統一感のため残します) */}
                {students.length > 0 && (
                    <div className="w-full md:w-64">
                        <Select
                            value={String(selectedStudentId)}
                            onValueChange={(val) => setSelectedStudentId(Number(val))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="生徒を選択" />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* メイン機能エリア */}
            <div className="flex-1 min-h-0">
                {/* RouteManagerを表示 (studentIdは将来的な拡張用として渡しておきます) */}
                <RouteManager studentId={selectedStudentId || 0} />
            </div>
        </div>
    );
};

export default RootTable;
