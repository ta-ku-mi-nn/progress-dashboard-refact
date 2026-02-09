import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import api from '../lib/api';

interface ProgressItem {
  id: number;
  subject: string;
  book_name: string;
  completed_units: number;
  total_units: number;
}

export default function ProgressList({ studentId }: { studentId: number }) {
  const [fullList, setFullList] = useState<ProgressItem[]>([]); // 全データ保持用
  const [filteredList, setFilteredList] = useState<ProgressItem[]>([]); // 表示用
  
  const [subjects, setSubjects] = useState<string[]>(["全体"]);
  const [selectedSubject, setSelectedSubject] = useState("全体");
  
  const [editingItem, setEditingItem] = useState<ProgressItem | null>(null);
  const [newCompleted, setNewCompleted] = useState<number>(0);

  // データ取得
  const fetchData = async () => {
    try {
      // 科目リスト取得 (チャートと同じAPIを利用)
      const subjRes = await api.get(`/charts/subjects/${studentId}`);
      if (subjRes.data) setSubjects(subjRes.data);

      // 参考書リスト取得
      const listRes = await api.get(`/dashboard/list/${studentId}`);
      setFullList(listRes.data);
      setFilteredList(listRes.data); // 初期表示は全件
    } catch (e) {
      console.error("Failed to fetch data", e);
    }
  };

  useEffect(() => {
    if (studentId) fetchData();
  }, [studentId]);

  // フィルタリング処理
  useEffect(() => {
    if (selectedSubject === "全体") {
      setFilteredList(fullList);
    } else {
      setFilteredList(fullList.filter(item => item.subject === selectedSubject));
    }
  }, [selectedSubject, fullList]);

  const handleUpdate = async () => {
    if(!editingItem) return;
    try {
      await api.patch(`/dashboard/progress/${editingItem.id}`, { completed_units: newCompleted });
      setEditingItem(null);
      fetchData(); // リストを再取得
    } catch (e) {
      alert("更新に失敗しました");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* ★追加: リスト用の科目絞り込みボタン */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide px-1">
        {subjects.map((subj) => (
          <button
            key={subj}
            onClick={() => setSelectedSubject(subj)}
            className={`px-3 py-1 text-xs rounded-full transition-colors whitespace-nowrap border ${
              selectedSubject === subj
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-muted-foreground border-gray-200 hover:bg-gray-100"
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>参考書</TableHead>
              <TableHead className="text-center w-24">進捗</TableHead>
              <TableHead className="text-right w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredList.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                        データがありません
                    </TableCell>
                </TableRow>
            ) : filteredList.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                    <div className="text-xs text-muted-foreground mb-0.5">{item.subject}</div>
                    {item.book_name}
                </TableCell>
                <TableCell className="text-center">
                  {item.completed_units} / {item.total_units}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
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
                <Button onClick={handleUpdate}>保存</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
