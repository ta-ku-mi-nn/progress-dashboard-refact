import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import api from '../lib/api';

interface ProgressItem {
  id: number;
  subject: string;
  book_name: string; // ★修正: reference_book -> book_name
  completed_units: number;
  total_units: number;
}

export default function ProgressList({ studentId }: { studentId: number }) {
  const [list, setList] = useState<ProgressItem[]>([]);
  const [editingItem, setEditingItem] = useState<ProgressItem | null>(null);
  const [newCompleted, setNewCompleted] = useState<number>(0);

  const fetchList = async () => {
    try {
      // ★修正: リスト専用のAPIエンドポイントを使用
      const res = await api.get(`/dashboard/list/${studentId}`);
      setList(res.data);
    } catch (e) {
      console.error("Failed to fetch progress list", e);
    }
  };

  useEffect(() => {
    if (studentId) fetchList();
  }, [studentId]);

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
                        データがありません
                    </TableCell>
                </TableRow>
            ) : list.map((item) => (
              <TableRow key={item.id}>
                {/* ★修正: item.book_name を表示 */}
                <TableCell className="font-medium">{item.book_name}</TableCell>
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

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>進捗を更新</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                {/* ★修正: editingItem.book_name */}
                <p className="mb-2 text-sm text-muted-foreground">{editingItem?.book_name}</p>
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
                    // APIパスは dashboard.py の update_progress に合わせる
                    await api.patch(`/dashboard/progress/${editingItem.id}`, { completed_units: newCompleted });
                    setEditingItem(null);
                    fetchList();
                }}>保存</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
