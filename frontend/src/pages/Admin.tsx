import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import api from '../lib/api';
import { toast } from 'sonner';

export default function Admin() {
    const [users, setUsers] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [textbooks, setTextbooks] = useState<any[]>([]);

    // Form states
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user', school: '' });
    const [newStudent, setNewStudent] = useState({ name: '', school: '', grade: '' });
    const [newTextbook, setNewTextbook] = useState({ book_name: '', subject: '', level: 'standard' });

    const fetchData = async () => {
        try {
            const [usersRes, studentsRes, textbooksRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/students/'), // Admin sees all
                api.get('/common/textbooks')
            ]);
            setUsers(usersRes.data);
            setStudents(studentsRes.data);
            setTextbooks(textbooksRes.data);
        } catch (error) {
            console.error("Failed to fetch admin data", error);
            toast.error("Failed to load data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async () => {
        try {
            await api.post('/admin/users', newUser);
            toast.success("User created");
            fetchData();
            setNewUser({ username: '', password: '', role: 'user', school: '' });
        } catch (e) {
            toast.error("Failed to create user");
        }
    };

    const handleCreateStudent = async () => {
        try {
            await api.post('/admin/students', newStudent);
            toast.success("Student created");
            fetchData();
            setNewStudent({ name: '', school: '', grade: '' });
        } catch (e) {
            toast.error("Failed to create student");
        }
    };

    const handleCreateTextbook = async () => {
        try {
            await api.post('/admin/textbooks', newTextbook);
            toast.success("Textbook created");
            fetchData();
            setNewTextbook({ book_name: '', subject: '', level: 'standard' });
        } catch (e) {
            toast.error("Failed to create textbook");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Admin Console</h2>
            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="textbooks">Textbooks</TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Manage Users</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 items-end">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label>Role</Label>
                                    <Select onValueChange={v => setNewUser({ ...newUser, role: v })} defaultValue={newUser.role}>
                                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="school">School</Label>
                                    <Input id="school" value={newUser.school} onChange={e => setNewUser({ ...newUser, school: e.target.value })} />
                                </div>
                                <Button onClick={handleCreateUser}>Add User</Button>
                            </div>
                            <Table>
                                <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>School</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {users.map(u => (
                                        <TableRow key={u.id}><TableCell>{u.username}</TableCell><TableCell>{u.role}</TableCell><TableCell>{u.school}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="students" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Manage Students</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 items-end">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="s-name">Name</Label>
                                    <Input id="s-name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="s-school">School</Label>
                                    <Input id="s-school" value={newStudent.school} onChange={e => setNewStudent({ ...newStudent, school: e.target.value })} />
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="s-grade">Grade</Label>
                                    <Input id="s-grade" value={newStudent.grade} onChange={e => setNewStudent({ ...newStudent, grade: e.target.value })} />
                                </div>
                                <Button onClick={handleCreateStudent}>Add Student</Button>
                            </div>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>School</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {students.map(s => (
                                        <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.school}</TableCell><TableCell>{s.grade}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="textbooks" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Manage Textbooks</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 items-end">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="t-name">Book Name</Label>
                                    <Input id="t-name" value={newTextbook.book_name} onChange={e => setNewTextbook({ ...newTextbook, book_name: e.target.value })} />
                                </div>
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="t-subject">Subject</Label>
                                    <Input id="t-subject" value={newTextbook.subject} onChange={e => setNewTextbook({ ...newTextbook, subject: e.target.value })} />
                                </div>
                                <Button onClick={handleCreateTextbook}>Add Textbook</Button>
                            </div>
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Subject</TableHead><TableHead>Level</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {textbooks.map(t => (
                                        <TableRow key={t.id}><TableCell>{t.name}</TableCell><TableCell>{t.subject}</TableCell><TableCell>{t.level}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
