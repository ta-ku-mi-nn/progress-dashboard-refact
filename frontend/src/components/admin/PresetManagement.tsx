import React from 'react';
import { Button } from '../ui/button';
import { Library } from 'lucide-react';

export default function PresetManagement() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <Library className="w-12 h-12 text-gray-300" />
            <div>
                <h3 className="text-lg font-medium">参考書プリセット管理</h3>
                <p className="text-sm text-muted-foreground">複数の参考書をまとめて登録するセットを作成できます。</p>
            </div>
            <Button disabled>プリセット作成 (準備中)</Button>
        </div>
    );
}