import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Edit, Trash2, Save, X, UserCog } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<User>>({});

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // admin.pyで作成した /instructors エンドポイントを使用
            const res = await api.get('/admin/instructors');
            setUsers(res.data);
        } catch (e) {
            console.error(e);
            toast.error("講師データの取得に失敗しました");
        }
    };

    const handleEditStart = (user: User) => {
        setEditingId(user.id);
        setEditForm({ ...user });
    };

    const handleSave = async () => {
        if (!editingId) return;
        try {
            await api.patch(`/admin/users/${editingId}`, editForm);
            toast.success("講師情報を更新しました");
            setEditingId(null);
            fetchUsers();
        } catch (e) {
            console.error(e);
            toast.error("更新に失敗しました");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("本当に削除しますか？この操作は取り消せません。")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            toast.success("削除しました");
            fetchUsers();
        } catch (e) {
            console.error(e);
            toast.error("削除に失敗しました");
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="w-5 h-5" /> 講師アカウント管理
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-[60px]">ID</TableHead>
                            <TableHead>氏名 (ユーザー名)</TableHead>
                            <TableHead>メールアドレス</TableHead>
                            <TableHead>権限</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-mono text-gray-500">{user.id}</TableCell>
                                
                                {editingId === user.id ? (
                                    <>
                                        <TableCell>
                                            <Input 
                                                value={editForm.username} 
                                                onChange={e => setEditForm({...editForm, username: e.target.value})}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                value={editForm.email} 
                                                onChange={e => setEditForm({...editForm, email: e.target.value})}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell><span className="text-sm font-bold text-blue-600">Admin</span></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={handleSave}>
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400" onClick={() => setEditingId(null)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                                {user.role}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditStart(user)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => handleDelete(user.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}