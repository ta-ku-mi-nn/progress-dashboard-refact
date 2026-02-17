// frontend/src/components/admin/ChangelogManagement.tsx

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api'; // ★追加

export default function ChangelogManagement() {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [version, setVersion] = useState("");

    const handleSave = async () => {
        if (!version || !title) {
            return toast.error("バージョンとタイトルは必須です");
        }

        try {
            // ★API呼び出し
            await api.post('/system/changelog', {
                version: version,
                title: title,
                description: desc
            });
            
            toast.success("リリースノートを更新しました");
            
            // フォームのリセット
            setVersion("");
            setTitle("");
            setDesc("");
            
        } catch (e) {
            console.error(e);
            toast.error("更新に失敗しました");
        }
    };

    return (
        // ... (returnの中身は変更なし) ...
        <div className="space-y-4">
            {/* ... 既存のUI ... */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>バージョン</Label>
                    <Input placeholder="v1.0.1" value={version} onChange={(e) => setVersion(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label>タイトル</Label>
                    <Input placeholder="新機能追加" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
            </div>
            <div className="space-y-1">
                <Label>詳細内容</Label>
                <Textarea 
                    className="h-32" 
                    placeholder="更新内容を入力..." 
                    value={desc} 
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDesc(e.target.value)} 
                />
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave}><Save className="w-4 h-4 mr-2" />更新を公開</Button>
            </div>
        </div>
    );
}
