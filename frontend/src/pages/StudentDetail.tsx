import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import api from '../lib/api';

interface Student {
    id: number;
    name: string;
    school: string;
    grade?: string;
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentRes, progressRes] = await Promise.all([
                    api.get(`/students/${id}`),
                    api.get(`/students/${id}/progress`)
                ]);
                setStudent(studentRes.data);
                setProgress(progressRes.data);
            } catch (error) {
                console.error("Failed to fetch data", error);
            }
        };
        if (id) fetchData();
    }, [id]);

    // Extract unique subjects
    const subjects = Array.from(new Set(progress.map(p => p.subject)));

    if (!student) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{student.name}</h2>
                    <p className="text-muted-foreground">{student.school} | {student.grade || 'Grade Not Set'}</p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline">Print Report</Button>
                    <Button>Update Progress</Button>
                </div>
            </div>

            <Tabs defaultValue="overall" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overall">Overall</TabsTrigger>
                    {subjects.map(subject => (
                        <TabsTrigger key={subject} value={subject}>{subject}</TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value="overall" className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Learning Overview</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Current Textbook</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Progress</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {progress.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.subject}</TableCell>
                                            <TableCell>{p.book_name} ({p.level})</TableCell>
                                            <TableCell>{p.is_done ? "Completed" : "In Progress"}</TableCell>
                                            <TableCell>{p.completed_units} / {p.total_units}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {subjects.map(subject => (
                    <TabsContent key={subject} value={subject} className="space-y-4">
                        <Card>
                            <CardHeader><CardTitle>{subject} Progress</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Level</TableHead>
                                            <TableHead>Textbook</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Progress</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {progress.filter(p => p.subject === subject).map((p) => (
                                            <TableRow key={p.id}>
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
                ))}
            </Tabs>
        </div>
    );
}
