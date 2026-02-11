import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { GitCommit, Tag, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

interface ChangelogItem {
  id: number;
  version: string;
  release_date: string;
  title: string;
  description: string;
}

const Changelog: React.FC = () => {
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangelogs = async () => {
      try {
        const res = await api.get('/system/changelog');
        setChangelogs(res.data);
      } catch (e) {
        console.error("Failed to fetch changelogs", e);
      } finally {
        setLoading(false);
      }
    };
    fetchChangelogs();
  }, []);

  return (
    <div className="h-full w-full p-4 md:p-8 pt-6 flex flex-col gap-4">
      <div className="flex-none">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GitCommit className="w-6 h-6" /> 更新履歴
        </h2>
        <p className="text-muted-foreground">システムのアップデート情報です。</p>
      </div>

      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-8 pb-8">
            {loading ? (
                <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
            ) : changelogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">更新履歴はありません</div>
            ) : (
                changelogs.map((change) => (
                <Card key={change.id} className="relative overflow-visible border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 font-bold px-2 py-1 text-sm border-blue-200">
                            {change.version}
                        </Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {change.release_date}
                        </span>
                        </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{change.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <ul className="space-y-2">
                        {/* descriptionを改行で分割してリスト表示 */}
                        {change.description.split('\n').map((line, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                            <span>{line}</span>
                        </li>
                        ))}
                    </ul>
                    </CardContent>
                </Card>
                ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Changelog;
