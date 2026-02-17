import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangelogManagement() {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [version, setVersion] = useState("");

    const handleSave = async () => {
        toast.info("バックエンドAPIの実装が必要です");
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>バージョン</Label><Input placeholder="v1.0.1" value={version} onChange={e => setVersion(e.target.value)} /></div>
                <div className="space-y-1"><Label>タイトル</Label><Input placeholder="新機能追加" value={title} onChange={e => setTitle(e.target.value)} /></div>
            </div>
            <div className="space-y-1">
                <Label>詳細内容</Label>
                <Textarea className="h-32" placeholder="更新内容を入力..." value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />更新を公開</Button>
            </div>
        </div>
    );
}