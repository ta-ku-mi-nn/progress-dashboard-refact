import React from 'react';
import { Button } from '../ui/button';
import { BarChart2 } from 'lucide-react';

export default function MockExamList() {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
            <BarChart2 className="w-12 h-12 text-gray-300" />
            <div>
                <h3 className="text-lg font-medium">全生徒の模試結果</h3>
                <p className="text-sm text-muted-foreground">全生徒の成績データを一覧表示・CSV出力する機能です。</p>
            </div>
            <Button variant="outline" disabled>CSVダウンロード (準備中)</Button>
        </div>
    );
}