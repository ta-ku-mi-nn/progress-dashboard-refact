import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function PastExam() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Past Exam & Admission Management</h2>
            <Card>
                <CardHeader><CardTitle>Past Exam Results</CardTitle></CardHeader>
                <CardContent>
                    <p>Manage past exam results, admission results, and mock exams here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
