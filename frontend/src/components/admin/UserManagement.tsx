import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user', school: '' });

    const fetchUsers = async () => {
        try { const res = await api.get('/admin/users'); setUsers(res.data); } 
        catch (e) { toast.error("講師データの取得に失敗"); }
    };
    useEffect(() => { fetchUsers(); }, []);

    const handleCreate = async () => {
        if (!newUser.username || !newUser.password) return toast.error("ユーザー名とパスワードは必須です");
        try {
            await api.post('/admin/users', newUser);
            toast.success("登録しました");
            fetchUsers();
            setNewUser({ username: '', password: '', role: 'user', school: '' });
        } catch (e) { toast.error("登録失敗: ユーザー名が重複している可能性があります"); }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg space-y-4 border">
                <h4 className="font-medium text-sm">新規講師登録</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1"><Label>ユーザー名</Label><Input value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} /></div>
                    <div className="space-y-1"><Label>パスワード</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                    <div className="space-y-1"><Label>権限</Label>
                        <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="user">一般 (User)</SelectItem><SelectItem value="admin">管理者 (Admin)</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1"><Label>校舎</Label><Input value={newUser.school} onChange={e => setNewUser({ ...newUser, school: e.target.value })} /></div>
                </div>
                <div className="flex justify-end"><Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />追加</Button></div>
            </div>
            <Table>
                <TableHeader><TableRow><TableHead>ユーザー名</TableHead><TableHead>権限</TableHead><TableHead>校舎</TableHead></TableRow></TableHeader>
                <TableBody>
                    {users.map((u: any) => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell><span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span></TableCell>
                            <TableCell>{u.school}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}