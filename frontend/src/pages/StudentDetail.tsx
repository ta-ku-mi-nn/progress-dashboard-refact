import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import api from '../lib/api';

interface Student {
    id: number;
    name: string;
    school: string;
}

interface Progress {
    id: number;
    subject: string;
    book_name: string;
    level: string;
    is_done: boolean;
    completed_units: number;
    total_units: number;
}

interface Homework {
    id: number;
    task: string;
    status: string;
    task_date: string;
    textbook_name?: string;
}

export default function StudentDetail() {
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<Student | null>(null);
    const [progress, setProgress] = useState<Progress[]>([]);
    const [homework, setHomework] = useState<Homework[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentRes, progressRes, homeworkRes] = await Promise.all([
                    api.get(`/students/${id}`),
                    api.get(`/students/${id}/progress`),
                    api.get(`/students/${id}/homework`)
                ]);
                setStudent(studentRes.data);
                setProgress(progressRes.data);
                setHomework(homeworkRes.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        if (id) fetchData();
    }, [id]);

    if (!student) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">{student.name} - {student.school}</h2>

            <Tabs defaultValue="progress" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="progress">Progress</TabsTrigger>
                    <TabsTrigger value="homework">Homework</TabsTrigger>
                </TabsList>
                <TabsContent value="progress" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Learning Progress</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Textbook</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {progress.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.subject}</TableCell>
                                            <TableCell>{p.level}</TableCell>
                                            <TableCell>{p.book_name}</TableCell>
                                            <TableCell>{p.is_done ? "Completed" : "In Progress"}</TableCell>
                                            <TableCell>{p.completed_units} / {p.total_units}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="homework" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Homework Tasks</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Task</TableHead>
                                        <TableHead>Textbook</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {homework.map((h) => (
                                        <TableRow key={h.id}>
                                            <TableCell>{h.task_date}</TableCell>
                                            <TableCell>{h.task}</TableCell>
                                            <TableCell>{h.textbook_name || '-'}</TableCell>
                                            <TableCell>{h.status}</TableCell>
                                        </TableRow>
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
