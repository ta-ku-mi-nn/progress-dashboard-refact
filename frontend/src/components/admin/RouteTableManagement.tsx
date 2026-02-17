import React from 'react';
import { Button } from '../ui/button';
import { Map } from 'lucide-react';

export default function RouteTableManagement() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <Map className="w-12 h-12 text-gray-300" />
            <div>
                <h3 className="text-lg font-medium">ルート表の管理</h3>
                <p className="text-sm text-muted-foreground">現在、バックエンドAPIを準備中です。</p>
            </div>
            <Button disabled>ファイルを追加 (準備中)</Button>
        </div>
    );
}