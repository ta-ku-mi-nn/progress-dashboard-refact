import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExamManager from '../components/ExamManager';
import api from '../lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// 生徒の型定義 (DashboardHomeなどと共通)
interface Student {
  id: number;
  name: string;
  email: string;
  grade?: string;
  school?: string;
}

const PastExam: React.FC = () => {
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
                // ※ APIエンドポイントはプロジェクトの構成に合わせて /students や /users/students など適宜調整してください
                // ここではダッシュボードでよく使われる /students を想定しています
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

    // 生徒が選択されていない、または見つからない場合
    if (!selectedStudentId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
                <p className="text-lg font-semibold text-red-500 mb-2">表示できる生徒がいません</p>
                <p className="text-sm">
                    担当している生徒が登録されていない可能性があります。<br />
                    管理者にご確認ください。
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full space-y-4 p-4 md:p-8 pt-6">
            {/* ヘッダーエリア: タイトルと生徒切り替えプルダウン */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-bold tracking-tight">過去問・模試・入試日程管理</h2>
                
                {/* 講師の場合のみ生徒切り替えを表示 */}
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

            {/* メイン機能コンポーネント (選択された生徒IDを渡す) */}
            <div className="h-[calc(100vh-180px)]">
                <ExamManager key={selectedStudentId} studentId={selectedStudentId} />
            </div>
        </div>
    );
};

export default PastExam;
