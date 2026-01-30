import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';

export default function BugReport() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Bug Report & Requests</h2>
            <Card>
                <CardHeader><CardTitle>Report Issues</CardTitle></CardHeader>
                <CardContent>
                    <p>Submit bug reports or feature requests here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
