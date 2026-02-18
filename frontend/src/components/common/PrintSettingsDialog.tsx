import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface PrintSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentId: number | null; // ★変更: 対象の生徒IDを親から受け取る
}

export default function PrintSettingsDialog({ open, onOpenChange, studentId }: PrintSettingsDialogProps) {
    const [selected, setSelected] = useState<string[]>(["dashboard", "calendar", "mock_exams", "past_exams"]);
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        // 生徒IDがない場合はエラー（通常ここには到達しないはずですが念のため）
        if (!studentId) {
            toast.error("対象の生徒が特定できません。");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                sections: selected,
                chart_images: {} 
            };

            // 受け取った studentId を使ってAPIリクエスト
            const response = await api.post(
                `/reports/integrated/${studentId}`, 
                payload, 
                { responseType: 'blob' }
            );

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            
            onOpenChange(false);
            toast.success("PDFレポートを生成しました");

        } catch (e) {
            console.error(e);
            toast.error("PDF生成に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    const toggle = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="w-5 h-5 text-blue-600" /> 
                        学習レポート出力
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">
                        PDFレポートに含める項目を選択してください。
                    </p>
                    
                    <div className="grid grid-cols-1 gap-3">
                        <label className={`flex items-center space-x-3 border p-3 rounded-md cursor-pointer transition-colors ${selected.includes("dashboard") ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}>
                            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" checked={selected.includes("dashboard")} onChange={() => toggle("dashboard")} />
                            <span className="font-medium text-sm">学習ダッシュボード</span>
                        </label>
                        <label className={`flex items-center space-x-3 border p-3 rounded-md cursor-pointer transition-colors ${selected.includes("calendar") ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}>
                            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" checked={selected.includes("calendar")} onChange={() => toggle("calendar")} />
                            <span className="font-medium text-sm">入試日程カレンダー</span>
                        </label>
                        <label className={`flex items-center space-x-3 border p-3 rounded-md cursor-pointer transition-colors ${selected.includes("mock_exams") ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}>
                            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" checked={selected.includes("mock_exams")} onChange={() => toggle("mock_exams")} />
                            <span className="font-medium text-sm">模試成績一覧</span>
                        </label>
                        <label className={`flex items-center space-x-3 border p-3 rounded-md cursor-pointer transition-colors ${selected.includes("past_exams") ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"}`}>
                            <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" checked={selected.includes("past_exams")} onChange={() => toggle("past_exams")} />
                            <span className="font-medium text-sm">過去問演習記録</span>
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        キャンセル
                    </Button>
                    {/* 生徒IDがない場合はボタンを押せないようにする */}
                    <Button onClick={handlePrint} disabled={loading || selected.length === 0 || !studentId}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <Printer className="mr-2 h-4 w-4" />
                                PDFを表示
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}