import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; 
import { Plus, Trash2 } from 'lucide-react'; 
import api from '../lib/api';

// --- 型定義 ---
interface ProgressItem {
  id: number;
  subject: string;
  book_name: string;
  completed_units: number;
  total_units: number;
}

// MasterTextbookテーブルに合わせた型定義
interface MasterBook {
  id: number;
  level: string;     // DBカラム: level
  subject: string;   // DBカラム: subject
  book_name: string; // DBカラム: book_name
  duration: number;
}

export default function ProgressList({ studentId }: { studentId: number }) {
  // --- State ---
  const [fullList, setFullList] = useState<ProgressItem[]>([]);
  const [filteredList, setFilteredList] = useState<ProgressItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>(["全体"]);
  const [selectedSubject, setSelectedSubject] = useState("全体");

  // 更新モーダル用
  const [editingItem, setEditingItem] = useState<ProgressItem | null>(null);
  const [editCompleted, setEditCompleted] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);

  // 追加モーダル用
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [masterBooks, setMasterBooks] = useState<MasterBook[]>([]); 
  const [selectedBooks, setSelectedBooks] = useState<MasterBook[]>([]); // 右列に追加する候補

  // フィルタ用State
  const [filterLeft, setFilterLeft] = useState({ subject: "", level: "", name: "" });
  const [filterRight, setFilterRight] = useState({ subject: "", level: "", name: "" });

  // --- データ取得 ---
  const fetchData = async () => {
    try {
      const subjRes = await api.get(`/charts/subjects/${studentId}`);
      if (subjRes.data) setSubjects(subjRes.data);

      const listRes = await api.get(`/dashboard/list/${studentId}`);
      setFullList(listRes.data);
      setFilteredList(listRes.data);
    } catch (e) { console.error(e); }
  };

  const fetchMasterBooks = async () => {
    try {
      const res = await api.get('/books/master');
      setMasterBooks(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (studentId) fetchData();
  }, [studentId]);

  useEffect(() => {
    if (isAddModalOpen) fetchMasterBooks();
  }, [isAddModalOpen]);

  // --- フィルタリング ---
  useEffect(() => {
    if (selectedSubject === "全体") {
      setFilteredList(fullList);
    } else {
      setFilteredList(fullList.filter(item => item.subject === selectedSubject));
    }
  }, [selectedSubject, fullList]);

  // --- ハンドラ ---
  const handleUpdate = async () => {
    if (!editingItem) return;
    try {
      await api.patch(`/dashboard/progress/${editingItem.id}`, {
        completed_units: editCompleted,
        total_units: editTotal
      });
      setEditingItem(null);
      fetchData();
    } catch (e) { alert("更新失敗"); }
  };

  const handleAddBatch = async () => {
    if (selectedBooks.length === 0) return;
    try {
      await api.post('/dashboard/progress/batch', {
        student_id: studentId,
        book_ids: selectedBooks.map(b => b.id)
      });
      setIsAddModalOpen(false);
      setSelectedBooks([]);
      fetchData();
    } catch (e) { alert("登録失敗"); }
  };

  const moveToRight = (book: MasterBook) => {
    if (!selectedBooks.find(b => b.id === book.id)) {
      setSelectedBooks([...selectedBooks, book]);
    }
  };

  const removeFromRight = (id: number) => {
    setSelectedBooks(selectedBooks.filter(b => b.id !== id));
  };

  const filterBooks = (books: MasterBook[], filter: typeof filterLeft) => {
    return books.filter(b => {
      const matchSubj = filter.subject === "" || b.subject.includes(filter.subject);
      const matchLevel = filter.level === "" || b.level.includes(filter.level);
      const matchName = filter.name === "" || b.book_name.includes(filter.name);
      return matchSubj && matchLevel && matchName;
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* 上部ヘッダー：科目ボタン + 追加ボタン */}
      <div className="flex items-center justify-between px-1">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
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
        
        <Button size="sm" className="h-7 text-xs ml-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-3 h-3 mr-1" /> 追加
        </Button>
      </div>

      {/* メインリスト表示 */}
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
            {filteredList.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                    <div className="text-xs text-muted-foreground mb-0.5">{item.subject}</div>
                    {item.book_name}
                </TableCell>
                <TableCell className="text-center text-sm">
                  {item.completed_units} / {item.total_units}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                      setEditingItem(item);
                      setEditCompleted(item.completed_units);
                      setEditTotal(item.total_units); // 分母セット
                  }}>
                    更新
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* --- 更新用モーダル (分母編集可) --- */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>進捗を更新</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm font-medium">{editingItem?.book_name}</p>
            <div className="flex items-center gap-4">
              <div className="grid gap-2 flex-1">
                <label className="text-xs">完了数 (分子)</label>
                <Input type="number" value={editCompleted} onChange={(e) => setEditCompleted(Number(e.target.value))} />
              </div>
              <span className="mt-6 text-xl">/</span>
              <div className="grid gap-2 flex-1">
                <label className="text-xs">総数 (分母)</label>
                <Input type="number" value={editTotal} onChange={(e) => setEditTotal(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- 追加用モーダル (3タブ構造・左右リスト) --- */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>参考書を追加</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="individual" className="flex-1 flex flex-col h-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preset">プリセットから登録</TabsTrigger>
              <TabsTrigger value="individual">個別に登録</TabsTrigger>
              <TabsTrigger value="custom">カスタム登録</TabsTrigger>
            </TabsList>

            {/* 空のタブ */}
            <TabsContent value="preset" className="flex-1 p-4 border rounded-md mt-2">
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Coming Soon...
              </div>
            </TabsContent>
            
            {/* ★個別に登録タブ */}
            <TabsContent value="individual" className="flex-1 flex flex-col mt-2 h-full overflow-hidden">
              <div className="grid grid-cols-2 gap-4 h-full">
                
                {/* 左列: マスタ一覧 */}
                <div className="border rounded-md flex flex-col h-full overflow-hidden">
                  <div className="p-2 bg-muted/50 font-bold text-sm border-b">参考書一覧 (DB)</div>
                  {/* フィルタ */}
                  <div className="p-2 grid grid-cols-3 gap-2 border-b">
                    <Input placeholder="科目" className="h-8 text-xs" 
                      value={filterLeft.subject} onChange={e => setFilterLeft({...filterLeft, subject: e.target.value})} />
                    <Input placeholder="レベル" className="h-8 text-xs" 
                      value={filterLeft.level} onChange={e => setFilterLeft({...filterLeft, level: e.target.value})} />
                    <Input placeholder="名称" className="h-8 text-xs" 
                      value={filterLeft.name} onChange={e => setFilterLeft({...filterLeft, name: e.target.value})} />
                  </div>
                  {/* リスト */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filterBooks(masterBooks, filterLeft).map(book => (
                      <div key={book.id} className="flex items-center justify-between p-2 border rounded bg-white hover:bg-gray-50">
                        <div>
                          <div className="text-xs text-muted-foreground">{book.subject} / {book.level}</div>
                          <div className="text-sm font-medium">{book.book_name}</div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => moveToRight(book)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右列: 追加候補 */}
                <div className="border rounded-md flex flex-col h-full overflow-hidden">
                  <div className="p-2 bg-blue-50 font-bold text-sm border-b text-blue-700">追加する参考書</div>
                   {/* フィルタ (右列用) */}
                   <div className="p-2 grid grid-cols-3 gap-2 border-b">
                    <Input placeholder="科目" className="h-8 text-xs" 
                      value={filterRight.subject} onChange={e => setFilterRight({...filterRight, subject: e.target.value})} />
                    <Input placeholder="レベル" className="h-8 text-xs" 
                      value={filterRight.level} onChange={e => setFilterRight({...filterRight, level: e.target.value})} />
                    <Input placeholder="名称" className="h-8 text-xs" 
                      value={filterRight.name} onChange={e => setFilterRight({...filterRight, name: e.target.value})} />
                  </div>
                  {/* リスト */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filterBooks(selectedBooks, filterRight).length === 0 && (
                      <div className="text-center text-xs text-muted-foreground mt-4">左から選択してください</div>
                    )}
                    {filterBooks(selectedBooks, filterRight).map(book => (
                      <div key={book.id} className="flex items-center justify-between p-2 border rounded bg-white">
                        <div>
                          <div className="text-xs text-muted-foreground">{book.subject} / {book.level}</div>
                          <div className="text-sm font-medium">{book.book_name}</div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeFromRight(book.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {/* 登録ボタン */}
                  <div className="p-2 border-t bg-gray-50 text-right">
                    <Button size="sm" onClick={handleAddBatch} disabled={selectedBooks.length === 0}>
                      {selectedBooks.length}件を登録
                    </Button>
                  </div>
                </div>

              </div>
            </TabsContent>

            {/* 空のタブ */}
            <TabsContent value="custom" className="flex-1 p-4 border rounded-md mt-2">
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Coming Soon...
              </div>
            </TabsContent>

          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
