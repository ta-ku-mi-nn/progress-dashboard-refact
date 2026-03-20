import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExamManager from '../components/ExamManager';
import api from '../lib/api';
// ★ 追加: 新しく作った共通コンポーネントをインポート
import StudentSelect from '../components/common/StudentSelect';

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

    // ★ 追加: 学年のソート順を定義（ダッシュボードと同じ）
    const GRADE_ORDER = ["中1", "中2", "中3", "高1", "高2", "高3", "既卒", "退塾済"];

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
                
                // ★ 修正: 「退塾済」を除外し、学年順（GRADE_ORDER）にソートする処理を追加
                let fetchedStudents = res.data.filter((s: Student) => s.grade !== "退塾済");
                fetchedStudents.sort((a: Student, b: Student) => {
                    const indexA = GRADE_ORDER.indexOf(a.grade || "");
                    const indexB = GRADE_ORDER.indexOf(b.grade || "");
                    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
                });

                setStudents(fetchedStudents);

                // ★ 修正: ローカルストレージから前回選択した生徒のIDを取得
                const cachedId = localStorage.getItem('lastSelectedStudentId');
                
                if (cachedId && fetchedStudents.some((s:Student) => s.id === Number(cachedId))) {
                    // 記憶があった ＆ その生徒が今のリストに存在する場合
                    setSelectedStudentId(Number(cachedId));
                } else if (fetchedStudents.length > 0) {
                    // 記憶がない場合は一番上の生徒を選択
                    setSelectedStudentId(fetchedStudents[0].id);
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

    // 生徒が選択されていない場合
    if (!selectedStudentId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
                <p className="text-lg font-semibold text-red-500 mb-2">表示できる生徒がいません</p>
                <p className="text-sm text-center">
                    担当している生徒が登録されていない可能性があります。<br />
                    管理者にご確認ください。
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-8 pt-6 gap-4">
            
            {/* ヘッダーエリア */}
            <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">過去問・模試・入試日程管理</h2>
                
                {/* ★ 修正: 共通コンポーネント（StudentSelect）に置き換え */}
                {students.length > 0 && (
                    <div className="w-full md:w-64">
                        <StudentSelect 
                            students={students}
                            selectedStudentId={selectedStudentId}
                            onSelect={(id) => {
                                setSelectedStudentId(id);
                                // ★ 追加: 選んだ瞬間にブラウザに記憶させる
                                localStorage.setItem('lastSelectedStudentId', String(id));
                            }}
                        />
                    </div>
                )}
            </div>

            {/* メイン機能エリア */}
            <div className="flex-1 min-h-0">
                <ExamManager key={selectedStudentId} studentId={selectedStudentId} />
            </div>
        </div>
    );
};

export default PastExam;
