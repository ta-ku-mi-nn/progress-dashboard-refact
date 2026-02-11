import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ExamManager from '../components/ExamManager';

const PastExam: React.FC = () => {
    const { user } = useAuth();

    // ユーザー情報がまだロードされていない、またはログインしていない場合
    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">読み込み中...</div>;
    }

    // userオブジェクトに student_id が含まれていることを想定
    // ※型定義でエラーが出る場合は (user as any).student_id としてください
    const studentId = (user as any).student_id;

    if (!studentId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
                <p className="text-lg font-semibold text-red-500 mb-2">生徒データが見つかりません</p>
                <p className="text-sm">
                    このアカウントには生徒情報が紐付けられていません。<br />
                    管理者アカウントの場合は、生徒一覧から選択する機能などが必要になります。
                </p>
            </div>
        );
    }

    return (
        <div className="h-full w-full space-y-4">
            {/* タイトルエリア */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold tracking-tight">過去問・模試・入試日程管理</h2>
            </div>

            {/* メイン機能コンポーネント */}
            <div className="h-[calc(100vh-140px)]">
                <ExamManager studentId={studentId} />
            </div>
        </div>
    );
};

export default PastExam;
