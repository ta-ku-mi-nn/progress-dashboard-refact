import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import api from '../lib/api';

interface ProgressItem {
  id: number;
  subject: string;
  reference_book: string;
  completed_units: number;
  total_units: number;
}

export default function ProgressList({ studentId }: { studentId: number }) {
  const [list, setList] = useState<ProgressItem[]>([]);
  const [editingItem, setEditingItem] = useState<ProgressItem | null>(null);
  const [newCompleted, setNewCompleted] = useState<number>(0);

  const fetchList = async () => {
    try {
      // 便宜上チャートと同じAPIからデータ加工、または専用APIを使用
      // ここではチャートAPIを再利用してリスト化する例です（必要に応じて専用APIを作成推奨）
      const res = await api.get(`/charts/progress/${studentId}`); 
      // APIの形式に合わせて変換が必要です。
      // もしリスト取得API (/progress/list) があればそちらを使ってください。
      // 今回は簡易的に「空配列」で初期化し、別途実装済みのリスト取得APIがあればURLを修正してください。
       setList([]); 
    } catch (e) { console.error(e); }
  };
  
  // もしリスト取得用のAPIがない場合は、charts APIの結果を使うか、
  // backend/routers/charts.py にリスト取得用エンドポイントを追加してください。
  // ここでは仮実装としておきます。

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>参考書</TableHead>
              <TableHead className="text-center">進捗</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        データがありません (API実装を確認してください)
                    </TableCell>
                </TableRow>
            ) : list.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.reference_book}</TableCell>
                <TableCell className="text-center">
                  {item.completed_units} / {item.total_units}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => {
                      setEditingItem(item);
                      setNewCompleted(item.completed_units);
                  }}>
                    更新
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 更新ダイアログ */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>進捗を更新</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <p className="mb-2 text-sm text-muted-foreground">{editingItem?.reference_book}</p>
                <div className="flex items-center gap-2">
                    <Input 
                        type="number" 
                        value={newCompleted} 
                        onChange={(e) => setNewCompleted(Number(e.target.value))}
                    />
                    <span className="text-sm">/ {editingItem?.total_units}</span>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setEditingItem(null)}>キャンセル</Button>
                <Button onClick={async () => {
                    if(!editingItem) return;
                    await api.patch(`/progress/${editingItem.id}`, { completed_units: newCompleted });
                    setEditingItem(null);
                    fetchList();
                }}>保存</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
