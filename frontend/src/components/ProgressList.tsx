import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; 
import { Plus, Trash2, BookOpen } from 'lucide-react'; // アイコン追加
import api from '../lib/api';

// --- 型定義 ---
interface ProgressItem {
  id: number;
  subject: string;
  book_name: string;
  completed_units: number;
  total_units: number;
}

interface MasterBook {
  id: number;
  level: string;
  subject: string;
  book_name: string;
  duration: number;
}

// ★追加: 選択候補用の拡張型 (マスタIDを持つか、カスタムデータを持つか)
interface BookCandidate {
  tempId: string; // フロントエンドでの管理用ID
  masterId?: number; // マスタ由来ならセット
  subject: string;
  level: string;
  book_name: string;
  duration: number;
  isCustom: boolean; // カスタムかどうか
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
  const [selectedBooks, setSelectedBooks] = useState<BookCandidate[]>([]); // ★型変更

  // ドロップダウン用リスト
  const [masterSubjects, setMasterSubjects] = useState<string[]>([]);
  const [masterLevels, setMasterLevels] = useState<string[]>([]);

  // フィルタ用State
  const [filterLeft, setFilterLeft] = useState({ subject: "", level: "", name: "" });
  const [filterRight, setFilterRight] = useState({ subject: "", level: "", name: "" });

  // ★追加: カスタム登録フォーム用State
  const [customForm, setCustomForm] = useState({
    subject: "",
    level: "",
    book_name: "",
    duration: 0
  });

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
      const res = await api.get('/dashboard/books/master');
      setMasterBooks(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (studentId) fetchData();
  }, [studentId]);

  useEffect(() => {
    if (isAddModalOpen) fetchMasterBooks();
  }, [isAddModalOpen]);

  useEffect(() => {
    if (masterBooks.length > 0) {
      const uniqueSubjects = Array.from(new Set(masterBooks.map(b => b.subject).filter(Boolean)));
      const uniqueLevels = Array.from(new Set(masterBooks.map(b => b.level).filter(Boolean)));
      setMasterSubjects(uniqueSubjects);
      setMasterLevels(uniqueLevels);
    }
  }, [masterBooks]);

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
    
    // データをマスタ由来とカスタム由来に分ける
    const bookIds = selectedBooks.filter(b => !b.isCustom && b.masterId).map(b => b.masterId!);
    const customBooks = selectedBooks.filter(b => b.isCustom).map(b => ({
        subject: b.subject,
        level: b.level,
        book_name: b.book_name,
        duration: b.duration
    }));

    try {
      await api.post('/dashboard/progress/batch', {
        student_id: studentId,
        book_ids: bookIds,
        custom_books: customBooks
      });
      setIsAddModalOpen(false);
      setSelectedBooks([]);
      fetchData();
    } catch (e) { alert("登録失敗"); }
  };

  // 左→右へ移動 (マスタ由来)
  const moveToRight = (book: MasterBook) => {
    // 既に同じマスタIDのものが選択されていないか確認
    if (!selectedBooks.find(b => b.masterId === book.id)) {
      const candidate: BookCandidate = {
          tempId: `m_${book.id}`,
          masterId: book.id,
          subject: book.subject,
          level: book.level,
          book_name: book.book_name,
          duration: book.duration,
          isCustom: false
      };
      setSelectedBooks([...selectedBooks, candidate]);
    }
  };

  // 右から削除
  const removeFromRight = (tempId: string) => {
    setSelectedBooks(selectedBooks.filter(b => b.tempId !== tempId));
  };

  // カスタム参考書を追加
  const addCustomBook = () => {
      if (!customForm.subject || !customForm.book_name) {
          alert("科目と参考書名は必須です");
          return;
      }
      const candidate: BookCandidate = {
          tempId: `c_${Date.now()}`,
          subject: customForm.subject,
          level: customForm.level || "カスタム",
          book_name: customForm.book_name,
          duration: customForm.duration,
          isCustom: true
      };
      setSelectedBooks([...selectedBooks, candidate]);
      // フォームをリセット
      setCustomForm({ subject: "", level: "", book_name: "", duration: 0 });
  };

  const filterMasterBooks = (books: MasterBook[], filter: typeof filterLeft) => {
    return books.filter(b => {
      const matchSubj = filter.subject === "" || b.subject === filter.subject;
      const matchLevel = filter.level === "" || b.level === filter.level;
      const matchName = filter.name === "" || b.book_name.includes(filter.name);
      return matchSubj && matchLevel && matchName;
    });
  };
  
  const filterCandidates = (books: BookCandidate[], filter: typeof filterRight) => {
    return books.filter(b => {
      const matchSubj = filter.subject === "" || b.subject === filter.subject;
      const matchLevel = filter.level === "" || b.level === filter.level;
      const matchName = filter.name === "" || b.book_name.includes(filter.name);
      return matchSubj && matchLevel && matchName;
    });
  };

  // 左列（マスタ一覧）のコンポーネント (共有用)
  const LeftColumnMasterList = () => (
    <div className="border rounded-md flex flex-col h-full overflow-hidden">
        <div className="p-2 bg-muted/50 font-bold text-sm border-b">参考書一覧 (DB)</div>
        <div className="p-2 grid grid-cols-3 gap-2 border-b">
            <select
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                value={filterLeft.subject}
                onChange={e => setFilterLeft({...filterLeft, subject: e.target.value})}
            >
                <option value="">科目: 全て</option>
                {masterSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                value={filterLeft.level}
                onChange={e => setFilterLeft({...filterLeft, level: e.target.value})}
            >
                <option value="">レベル: 全て</option>
                {masterLevels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <Input placeholder="名称" className="h-8 text-xs" 
                value={filterLeft.name} onChange={e => setFilterLeft({...filterLeft, name: e.target.value})} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filterMasterBooks(masterBooks, filterLeft).map(book => (
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
  );

  // 右列の候補リストコンポーネント
  const RightColumnSelectedList = () => (
      <>
        <div className="p-2 bg-blue-50 font-bold text-sm border-b text-blue-700">追加する参考書</div>
        <div className="p-2 grid grid-cols-3 gap-2 border-b">
            <select
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                value={filterRight.subject}
                onChange={e => setFilterRight({...filterRight, subject: e.target.value})}
            >
                <option value="">科目: 全て</option>
                {masterSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                value={filterRight.level}
                onChange={e => setFilterRight({...filterRight, level: e.target.value})}
            >
                <option value="">レベル: 全て</option>
                {masterLevels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <Input placeholder="名称" className="h-8 text-xs" 
                value={filterRight.name} onChange={e => setFilterRight({...filterRight, name: e.target.value})} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filterCandidates(selectedBooks, filterRight).length === 0 && (
                <div className="text-center text-xs text-muted-foreground mt-4">追加候補はありません</div>
            )}
            {filterCandidates(selectedBooks, filterRight).map(book => (
                <div key={book.tempId} className="flex items-center justify-between p-2 border rounded bg-white">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{book.subject} / {book.level}</span>
                        {book.isCustom && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">カスタム</span>}
                    </div>
                    <div className="text-sm font-medium">{book.book_name}</div>
                </div>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeFromRight(book.tempId)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
                </div>
            ))}
        </div>
        <div className="p-2 border-t bg-gray-50 text-right">
            <Button size="sm" onClick={handleAddBatch} disabled={selectedBooks.length === 0}>
                {selectedBooks.length}件を登録
            </Button>
        </div>
      </>
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* 上部ヘッダー */}
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
                      setEditTotal(item.total_units);
                  }}>
                    更新
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 更新用モーダル */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>進捗を更新</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm font-medium">{editingItem?.book_name}</p>
            <div className="flex items-center gap-4">
              <div className="grid gap-2 flex-1">
                <label className="text-xs">完了数</label>
                <Input type="number" value={editCompleted} onChange={(e) => setEditCompleted(Number(e.target.value))} />
              </div>
              <span className="mt-6 text-xl">/</span>
              <div className="grid gap-2 flex-1">
                <label className="text-xs">総数</label>
                <Input type="number" value={editTotal} onChange={(e) => setEditTotal(Number(e.target.value))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 追加用モーダル (3タブ構造) */}
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

            <TabsContent value="preset" className="flex-1 p-4 border rounded-md mt-2">
              <div className="flex h-full items-center justify-center text-muted-foreground">Coming Soon...</div>
            </TabsContent>
            
            {/* 個別に登録タブ */}
            <TabsContent value="individual" className="flex-1 flex flex-col mt-2 h-full overflow-hidden">
              <div className="grid grid-cols-2 gap-4 h-full">
                {/* 左列: マスタ一覧 */}
                <LeftColumnMasterList />
                {/* 右列: 追加候補 */}
                <div className="border rounded-md flex flex-col h-full overflow-hidden">
                    <RightColumnSelectedList />
                </div>
              </div>
            </TabsContent>

            {/* カスタム登録タブ */}
            <TabsContent value="custom" className="flex-1 flex flex-col mt-2 h-full overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full">
                    
                    {/* 左列: マスタ一覧 (共有) */}
                    <LeftColumnMasterList />

                    {/* 右列: フォーム + 追加候補 */}
                    <div className="border rounded-md flex flex-col h-full overflow-hidden">
                        
                        {/* カスタム登録フォーム */}
                        <div className="p-4 bg-yellow-50 border-b space-y-3">
                            <div className="font-bold text-sm text-yellow-800 flex items-center">
                                <BookOpen className="w-4 h-4 mr-2" />
                                新しい参考書を作成
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="科目 (例: 英語)" className="bg-white h-8 text-xs"
                                    value={customForm.subject} onChange={e => setCustomForm({...customForm, subject: e.target.value})} />
                                <Input placeholder="レベル (例: 基礎)" className="bg-white h-8 text-xs"
                                    value={customForm.level} onChange={e => setCustomForm({...customForm, level: e.target.value})} />
                            </div>
                            <Input placeholder="参考書名" className="bg-white h-8 text-xs"
                                value={customForm.book_name} onChange={e => setCustomForm({...customForm, book_name: e.target.value})} />
                            <div className="flex items-center gap-2">
                                <Input type="number" placeholder="目安時間(h)" className="bg-white h-8 text-xs w-24"
                                    value={customForm.duration || ""} onChange={e => setCustomForm({...customForm, duration: Number(e.target.value)})} />
                                <span className="text-xs text-muted-foreground">時間</span>
                                <div className="flex-1 text-right">
                                    <Button size="sm" onClick={addCustomBook} className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700">
                                        リストに追加
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* 追加候補リスト (共有) */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <RightColumnSelectedList />
                        </div>
                    </div>
                </div>
            </TabsContent>

          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
