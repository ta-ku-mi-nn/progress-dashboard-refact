import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'; 
import { Plus, Trash2, BookOpen, Clock, Layers } from 'lucide-react'; 
import api from '../lib/api';

// --- 型定義 ---

// メインリスト用
interface ProgressItem {
  id: number;
  subject: string;
  book_name: string;
  completed_units: number;
  total_units: number;
}

// マスタデータ用
interface MasterBook {
  id: number;
  level: string;
  subject: string;
  book_name: string;
  duration: number;
}

// プリセット用 (バックエンドからのレスポンス構造に合わせる)
interface PresetBook {
  id: number | null; // マスタに存在すればID、なければnull
  subject: string;
  level: string;
  book_name: string;
  duration: number;
  is_master: boolean;
}

interface Preset {
  id: number;
  name: string;   // プリセット名
  subject: string;
  books: PresetBook[];
}

// 追加候補リスト用 (共通型)
interface BookCandidate {
  tempId: string;    // フロント管理用ユニークID
  masterId?: number; // マスタ由来の場合のID
  subject: string;
  level: string;
  book_name: string;
  duration: number;
  isCustom: boolean; // マスタにない or カスタム登録ならtrue
}

export default function ProgressList({ studentId }: { studentId: number }) {
  // --- State: メインリスト ---
  const [fullList, setFullList] = useState<ProgressItem[]>([]);
  const [filteredList, setFilteredList] = useState<ProgressItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>(["全体"]);
  const [selectedSubject, setSelectedSubject] = useState("全体");

  // --- State: 更新モーダル ---
  const [editingItem, setEditingItem] = useState<ProgressItem | null>(null);
  const [editCompleted, setEditCompleted] = useState<number>(0);
  const [editTotal, setEditTotal] = useState<number>(0);

  // --- State: 追加モーダル ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [masterBooks, setMasterBooks] = useState<MasterBook[]>([]); 
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedBooks, setSelectedBooks] = useState<BookCandidate[]>([]); // 右列(共有)

  // ドロップダウン用リスト
  const [masterSubjects, setMasterSubjects] = useState<string[]>([]);
  const [masterLevels, setMasterLevels] = useState<string[]>([]);

  // フィルタ用
  const [filterLeft, setFilterLeft] = useState({ subject: "", level: "", name: "" }); // 個別登録用
  const [filterRight, setFilterRight] = useState({ subject: "", level: "", name: "" }); // 候補リスト用
  const [filterPresetSubject, setFilterPresetSubject] = useState(""); // プリセット用

  // カスタム登録フォーム用
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

  const fetchMasterData = async () => {
    try {
      // マスタ参考書取得
      const booksRes = await api.get('/dashboard/books/master');
      setMasterBooks(booksRes.data);
      
      // プリセット取得
      const presetsRes = await api.get('/dashboard/presets');
      setPresets(presetsRes.data);

    } catch (e) { console.error(e); }
  };

  // 初期ロード
  useEffect(() => {
    if (studentId) fetchData();
  }, [studentId]);

  // モーダルオープン時にマスタデータ取得
  useEffect(() => {
    if (isAddModalOpen) fetchMasterData();
  }, [isAddModalOpen]);

  // マスタデータから科目・レベルのリスト生成
  useEffect(() => {
    if (masterBooks.length > 0) {
      const uniqueSubjects = Array.from(new Set(masterBooks.map(b => b.subject).filter(Boolean)));
      const uniqueLevels = Array.from(new Set(masterBooks.map(b => b.level).filter(Boolean)));
      setMasterSubjects(uniqueSubjects);
      setMasterLevels(uniqueLevels);
    }
  }, [masterBooks]);

  // メインリストフィルタリング
  useEffect(() => {
    if (selectedSubject === "全体") {
      setFilteredList(fullList);
    } else {
      setFilteredList(fullList.filter(item => item.subject === selectedSubject));
    }
  }, [selectedSubject, fullList]);

  // --- アクションハンドラ ---

  // 進捗更新
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

  // 一括登録実行
  const handleAddBatch = async () => {
    if (selectedBooks.length === 0) return;
    
    // マスタ由来とカスタム由来に分別
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

  // 左→右へ移動 (マスタから単体追加)
  const moveToRight = (book: MasterBook) => {
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

  // プリセットから一括追加
  const addPresetToRight = (preset: Preset) => {
      let addedCount = 0;
      const newCandidates = [...selectedBooks];
      
      preset.books.forEach(book => {
          // ID生成 (マスタIDがあればそれ、なければ名前ベース)
          const uniqueKey = book.id ? `m_${book.id}` : `p_${preset.id}_${book.book_name}`;
          
          // 重複チェック
          const exists = newCandidates.find(b => 
              b.tempId === uniqueKey || (book.id && b.masterId === book.id)
          );

          if (!exists) {
              newCandidates.push({
                  tempId: uniqueKey,
                  masterId: book.id || undefined,
                  subject: book.subject,
                  level: book.level,
                  book_name: book.book_name,
                  duration: book.duration,
                  isCustom: !book.is_master // マスタに紐付かないものはカスタム扱い
              });
              addedCount++;
          }
      });
      
      if (addedCount > 0) {
          setSelectedBooks(newCandidates);
      } else {
          alert("このプリセットの参考書は既に追加候補に含まれています");
      }
  };

  // カスタムフォームから追加
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
      setCustomForm({ subject: "", level: "", book_name: "", duration: 0 });
  };

  // 右から削除
  const removeFromRight = (tempId: string) => {
    setSelectedBooks(selectedBooks.filter(b => b.tempId !== tempId));
  };

  // フィルタ関数
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

  // --- サブコンポーネント (左列) ---

  // 1. プリセット一覧
  const LeftColumnPresetList = () => {
      const filteredPresets = presets.filter(p => 
          filterPresetSubject === "" || p.subject === filterPresetSubject
      );

      return (
        <div className="border rounded-md flex flex-col h-full overflow-hidden bg-white">
            <div className="p-3 bg-purple-50/50 font-bold text-sm border-b text-purple-900 flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                プリセット一覧
            </div>
            <div className="p-2 border-b bg-gray-50/50">
                <select
                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                    value={filterPresetSubject}
                    onChange={e => setFilterPresetSubject(e.target.value)}
                >
                    <option value="">科目: 全て</option>
                    {masterSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredPresets.map(preset => (
                    <div key={preset.id} className="border rounded bg-white hover:bg-gray-50 transition-colors">
                        <div className="p-2 flex items-center justify-between border-b border-dashed">
                            <div>
                                <div className="text-[10px] bg-purple-100 text-purple-800 px-1.5 rounded w-fit mb-1">
                                    {preset.subject}
                                </div>
                                <div className="text-sm font-bold text-gray-800">{preset.name}</div>
                            </div>
                            <Button size="sm" className="h-7 bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={() => addPresetToRight(preset)}>
                                <Plus className="w-3 h-3 mr-1" />
                                一括追加
                            </Button>
                        </div>
                        <div className="p-2 bg-gray-50/50 text-xs text-muted-foreground space-y-1">
                            {preset.books.map((b, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                    <span className="truncate">{b.book_name}</span>
                                </div>
                            ))}
                            {preset.books.length === 0 && <span>(参考書なし)</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  // 2. マスタ一覧 (個別登録)
  const LeftColumnMasterList = () => (
    <div className="border rounded-md flex flex-col h-full overflow-hidden bg-white">
        <div className="p-3 bg-muted/30 font-bold text-sm border-b">参考書一覧 (DB)</div>
        <div className="p-2 grid grid-cols-3 gap-2 border-b bg-gray-50/50">
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
                <div key={book.id} className="flex items-center justify-between p-2 border rounded bg-white hover:bg-gray-50 transition-colors">
                <div>
                    <div className="text-xs text-muted-foreground">{book.subject} / {book.level}</div>
                    <div className="text-sm font-medium">{book.book_name}</div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => moveToRight(book)}>
                    <Plus className="w-4 h-4" />
                </Button>
                </div>
            ))}
        </div>
    </div>
  );

  // 3. カスタムフォーム
  const LeftColumnCustomForm = () => (
    <div className="border rounded-md flex flex-col h-full overflow-hidden bg-yellow-50/50">
        <div className="p-3 font-bold text-sm text-yellow-800 flex items-center border-b border-yellow-200 bg-yellow-100/30">
            <BookOpen className="w-4 h-4 mr-2" />
            新しい参考書を入力
        </div>
        
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-yellow-900">科目 <span className="text-red-500">*</span></label>
                    <Input placeholder="例: 英語" className="bg-white h-9 text-xs"
                        value={customForm.subject} onChange={e => setCustomForm({...customForm, subject: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-yellow-900">レベル</label>
                    <Input placeholder="例: 基礎" className="bg-white h-9 text-xs"
                        value={customForm.level} onChange={e => setCustomForm({...customForm, level: e.target.value})} />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-yellow-900">参考書名 <span className="text-red-500">*</span></label>
                <Input placeholder="参考書名を入力" className="bg-white h-9 text-xs"
                    value={customForm.book_name} onChange={e => setCustomForm({...customForm, book_name: e.target.value})} />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-yellow-900">目安時間 (h)</label>
                <div className="flex items-center gap-2">
                    <div className="relative w-24">
                        <Clock className="w-3 h-3 absolute left-2 top-3 text-gray-400" />
                        <Input type="number" placeholder="0" className="bg-white h-9 text-xs pl-7"
                            value={customForm.duration || ""} onChange={e => setCustomForm({...customForm, duration: Number(e.target.value)})} />
                    </div>
                    <span className="text-xs text-muted-foreground">時間</span>
                </div>
            </div>

            <div className="pt-4">
                 <Button size="sm" onClick={addCustomBook} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white h-9">
                    <Plus className="w-4 h-4 mr-2" />
                    リストに追加
                </Button>
                <p className="text-[10px] text-yellow-800/60 text-center mt-2">
                    ※ 追加した参考書は右側のリストに一時保存されます
                </p>
            </div>
        </div>
    </div>
  );

  // --- サブコンポーネント (右列・共通) ---
  const RightColumnSelectedList = () => (
      <div className="border rounded-md flex flex-col h-full overflow-hidden bg-white">
        <div className="p-3 bg-blue-50/50 font-bold text-sm border-b text-blue-700 flex justify-between items-center">
            <span>追加候補リスト</span>
            <span className="text-xs font-normal text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                {selectedBooks.length}件
            </span>
        </div>
        
        <div className="p-2 grid grid-cols-3 gap-2 border-b bg-gray-50/50">
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
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50">
                    <BookOpen className="w-8 h-8" />
                    <span className="text-xs">左列から追加してください</span>
                </div>
            )}
            {filterCandidates(selectedBooks, filterRight).map(book => (
                <div key={book.tempId} className="flex items-center justify-between p-2 border rounded bg-white hover:bg-gray-50 transition-colors">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-medium text-gray-500 border px-1 rounded">{book.subject}</span>
                        {book.isCustom && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200">カスタム</span>}
                    </div>
                    <div className="text-sm font-medium">{book.book_name}</div>
                </div>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeFromRight(book.tempId)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
                </div>
            ))}
        </div>
        <div className="p-3 border-t bg-gray-50 flex justify-end">
            <Button size="sm" onClick={handleAddBatch} disabled={selectedBooks.length === 0} className="w-32">
                登録する ({selectedBooks.length})
            </Button>
        </div>
      </div>
  );

  // --- メインレンダリング ---
  return (
    <div className="h-full flex flex-col space-y-4">
      {/* 画面上部ヘッダー */}
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

      {/* メインリスト */}
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
            {filteredList.length === 0 && (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24 text-muted-foreground text-xs">
                        データがありません。「追加」ボタンから登録してください。
                    </TableCell>
                </TableRow>
            )}
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

      {/* 進捗更新モーダル */}
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

      {/* 追加用モーダル (3タブ) */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="p-6 pb-2">
             <DialogHeader>
                <DialogTitle>参考書を追加</DialogTitle>
            </DialogHeader>
          </div>
          
          <Tabs defaultValue="individual" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6">
                <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preset">プリセットから登録</TabsTrigger>
                <TabsTrigger value="individual">個別に登録</TabsTrigger>
                <TabsTrigger value="custom">カスタム登録</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-hidden p-6 pt-4 bg-gray-50/50">
                {/* 1. プリセットタブ */}
                <TabsContent value="preset" className="h-full m-0 data-[state=active]:flex flex-col">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <LeftColumnPresetList />
                        <RightColumnSelectedList />
                    </div>
                </TabsContent>
                
                {/* 2. 個別登録タブ */}
                <TabsContent value="individual" className="h-full m-0 data-[state=active]:flex flex-col">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <LeftColumnMasterList />
                        <RightColumnSelectedList />
                    </div>
                </TabsContent>

                {/* 3. カスタム登録タブ */}
                <TabsContent value="custom" className="h-full m-0 data-[state=active]:flex flex-col">
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <LeftColumnCustomForm />
                        <RightColumnSelectedList />
                    </div>
                </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
