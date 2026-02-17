import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RouteManager from '../components/RouteManager';

const RootTable: React.FC = () => {
    const { user } = useAuth();
    // 生徒選択機能は削除

    return (
        <div className="h-full w-full flex flex-col p-4 md:p-8 pt-6 gap-4">
            {/* ヘッダーエリア */}
            <div className="flex-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold tracking-tight">学習ルート表</h2>
                {/* 生徒選択プルダウンを削除 */}
            </div>

            {/* メイン機能エリア */}
            <div className="flex-1 min-h-0">
                {/* studentIdは必須ならダミーか自身のIDを渡す */}
                <RouteManager studentId={(user as any)?.student_id || 0} />
            </div>
        </div>
    );
};

export default RootTable;