import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
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

    // State for modal
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [editingProgress, setEditingProgress] = useState<Progress[]>([]);

    const handleUpdateClick = () => {
        setEditingProgress(JSON.parse(JSON.stringify(progress))); // Deep copy
        setIsUpdateModalOpen(true);
    };

    const handleProgressChange = (id: number, field: keyof Progress, value: any) => {
        setEditingProgress(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const handleSaveProgress = async () => {
        try {
            // Prepare payload: Map editingProgress to ProgressUpdate schema
            // Schema: { subject, level, book_name, duration, is_planned, is_done, completed_units, total_units }
            // modifying endpoint: /students/{id}/progress expects List[ProgressUpdate]

            const payload = editingProgress.map(p => ({
                subject: p.subject,
                level: p.level,
                book_name: p.book_name,
                is_done: p.is_done,
                completed_units: p.completed_units,
                total_units: p.total_units
                // duration, is_planned are optional/not in interface yet, keeping existing if possible or ignoring
            }));

            await api.post(`/students/${id}/progress`, payload);

            // Refresh data
            const res = await api.get(`/students/${id}/progress`);
            setProgress(res.data);

            setIsUpdateModalOpen(false);
            alert("Progress updated successfully!"); // Replace with toast if available
        } catch (error) {
            console.error("Failed to update progress", error);
            alert("Failed to update progress.");
        }
    };

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
                    <Button onClick={handleUpdateClick}>Update Progress</Button>
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

            <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Update Learning Progress</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Textbook</TableHead>
                                    <TableHead>Completed Units</TableHead>
                                    <TableHead>Total Units</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {editingProgress.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.subject}</TableCell>
                                        <TableCell>{p.book_name}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={p.completed_units}
                                                onChange={(e) => handleProgressChange(p.id, 'completed_units', parseInt(e.target.value) || 0)}
                                                className="w-20"
                                            />
                                        </TableCell>
                                        <TableCell>{p.total_units}</TableCell>
                                        <TableCell>
                                            <select
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                value={p.is_done ? "true" : "false"}
                                                onChange={(e) => handleProgressChange(p.id, 'is_done', e.target.value === "true")}
                                            >
                                                <option value="false">In Progress</option>
                                                <option value="true">Completed</option>
                                            </select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProgress}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
