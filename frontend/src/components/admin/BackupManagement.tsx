import React from 'react';
import { Button } from '../ui/button';
import { Database, Download } from 'lucide-react';
import { toast } from 'sonner';
// import api from '../../lib/api'; // 必要に応じて有効化

export default function BackupManagement() {
    const handleDownload = () => {
        toast.info("バックエンドAPIの実装が必要です");
    };

    return (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <Database className="w-12 h-12 text-gray-300" />
            <div>
                <h3 className="text-lg font-medium">システムバックアップ</h3>
                <p className="text-sm text-muted-foreground">現在のデータベースをSQL/SQLite形式でダウンロードします。</p>
            </div>
            <Button onClick={handleDownload}><Download className="w-4 h-4 mr-2" />ダウンロード開始</Button>
        </div>
    );
}