import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Edit, Trash2, UserPlus, Save, X, UserCog } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>({});
    
    // 新規作成用ステート
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ username: "", email: "", password: "", role: "admin" });

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/instructors');
            setUsers(res.data);
        } catch (e) { toast.error("取得エラー"); }
    };

    // 新規作成
    const handleCreate = async () => {
        if (!createForm.username || !createForm.password) {
            toast.error("ユーザー名とパスワードは必須です");
            return;
        }
        try {
            await api.post('/admin/users', createForm);
            toast.success("講師を作成しました");
            setIsCreateOpen(false);
            setCreateForm({ username: "", email: "", password: "", role: "admin" });
            fetchUsers();
        } catch (e) { toast.error("作成失敗: ユーザー名が重複している可能性があります"); }
    };

    // 更新・削除 (既存ロジック)
    const handleSave = async () => {
        try {
            await api.patch(`/admin/users/${editingId}`, editForm);
            toast.success("更新しました");
            setEditingId(null);
            fetchUsers();
        } catch (e) { toast.error("更新失敗"); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("削除しますか？")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchUsers();
            toast.success("削除しました");
        } catch (e) { toast.error("削除失敗"); }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5" /> 講師アカウント管理
                </CardTitle>
                <Button onClick={() => setIsCreateOpen(true)} size="sm">
                    <UserPlus className="w-4 h-4 mr-2" /> 新規登録
                </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>ユーザー名</TableHead>
                            <TableHead>メール</TableHead>
                            <TableHead>権限</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell>{u.id}</TableCell>
                                {editingId === u.id ? (
                                    <>
                                        <TableCell><Input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} /></TableCell>
                                        <TableCell><Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></TableCell>
                                        <TableCell>{u.role}</TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" className="text-green-600" onClick={handleSave}><Save className="w-4 h-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell className="font-medium">{u.username}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell><span className="px-2 py-1 rounded bg-blue-100 text-xs">{u.role}</span></TableCell>
                                        <TableCell className="text-right">
                                            <Button size="icon" variant="ghost" onClick={() => { setEditingId(u.id); setEditForm({...u}); }}><Edit className="w-4 h-4" /></Button>
                                            <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDelete(u.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            {/* 新規作成モーダル */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>新規講師登録</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>ユーザー名 (必須)</Label>
                            <Input value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>パスワード (必須)</Label>
                            <Input type="password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>メールアドレス</Label>
                            <Input value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>キャンセル</Button>
                        <Button onClick={handleCreate}>登録</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}