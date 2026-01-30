import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function RootTable() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Root Table</h2>
            <Card>
                <CardHeader><CardTitle>Curriculum & Root Tables</CardTitle></CardHeader>
                <CardContent>
                    <p>View curriculum root tables and learning paths here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
