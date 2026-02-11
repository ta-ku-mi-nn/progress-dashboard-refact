import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { AlertCircle, Send, CheckCircle2, MessageSquare, Lightbulb } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import api from '../lib/api';

// --- 型定義 ---
interface BugReportItem {
  id: number;
  reporter_username: string;
  report_date: string;
  title: string;
  description: string;
  status: string;
  resolution_message?: string;
}

interface FeatureRequestItem {
  id: number;
  reporter_username: string;
  report_date: string;
  title: string;
  description: string;
  status: string;
  resolution_message?: string;
}

const BugReport: React.FC = () => {
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // フォーム用State
  const [reportType, setReportType] = useState("bug"); // bug | feature
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  // 一覧用State
  const [bugReports, setBugReports] = useState<BugReportItem[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequestItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // データ取得
  const fetchReports = async () => {
    setListLoading(true);
    try {
      const [bugsRes, featuresRes] = await Promise.all([
        api.get('/system/bug_reports'),
        api.get('/system/feature_requests')
      ]);
      setBugReports(bugsRes.data);
      setFeatureRequests(featuresRes.data);
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("ログインが必要です");
        return;
    }
    setLoading(true);
    
    try {
      const payload = {
          reporter_username: (user as any).username || "Unknown", // モデルに合わせてusernameを使用
          title: formData.title,
          description: formData.description
      };

      if (reportType === "bug") {
          await api.post('/system/bug_reports', payload);
      } else {
          await api.post('/system/feature_requests', payload);
      }
      
      setIsSubmitted(true);
      fetchReports(); // 送信後に一覧を更新
    } catch (error) {
      console.error(error);
      alert("送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // ステータスバッジのコンポーネント
  const StatusBadge = ({ status }: { status: string }) => {
    let color = "bg-gray-100 text-gray-800";
    if (status === "対応中") color = "bg-blue-100 text-blue-800";
    if (status === "完了" || status === "解決済み") color = "bg-green-100 text-green-800";
    return <Badge variant="outline" className={`${color} border-none`}>{status}</Badge>;
  };

  return (
    <div className="h-full w-full p-4 md:p-8 pt-6 flex flex-col gap-4 overflow-hidden">
      <div className="flex-none">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> フィードバック
        </h2>
        <p className="text-muted-foreground">バグ報告や機能追加のご要望をお送りください。</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        
        {/* 左カラム: 報告フォーム */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
            <Card className="h-full flex flex-col">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    新規報告
                </CardTitle>
                <CardDescription>
                    不具合やご要望を入力してください。
                </CardDescription>
                </CardHeader>
                
                {isSubmitted ? (
                    <CardContent className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <CheckCircle2 className="w-16 h-16 text-green-500" />
                        <h3 className="text-xl font-bold">送信しました</h3>
                        <p className="text-muted-foreground text-sm">
                        ご協力ありがとうございます。<br />
                        右側の一覧に反映されました。
                        </p>
                        <Button onClick={() => { setIsSubmitted(false); setFormData({title:"", description:""}); }} className="mt-4">
                        続けて報告する
                        </Button>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                        <CardContent className="space-y-4 flex-1">
                            <div className="space-y-2">
                            <Label htmlFor="type">報告の種類</Label>
                            <Select 
                                value={reportType} 
                                onValueChange={(val) => setReportType(val)}
                            >
                                <SelectTrigger id="type">
                                <SelectValue placeholder="種類を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="bug">不具合 (バグ)</SelectItem>
                                <SelectItem value="feature">機能リクエスト</SelectItem>
                                </SelectContent>
                            </Select>
                            </div>
                            
                            <div className="space-y-2">
                            <Label htmlFor="title">タイトル</Label>
                            <Input 
                                id="title" 
                                placeholder={reportType === "bug" ? "例: ログイン画面でエラーが出る" : "例: 参考書の並び替え機能が欲しい"}
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                required
                            />
                            </div>
                            
                            <div className="space-y-2">
                            <Label htmlFor="description">詳細内容</Label>
                            <Textarea 
                                id="description" 
                                placeholder="詳細をご記入ください。" 
                                className="min-h-[150px] resize-none"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                required
                            />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t pt-4">
                            <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "送信中..." : (
                                <>
                                <Send className="w-4 h-4 mr-2" /> 送信
                                </>
                            )}
                            </Button>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>

        {/* 右カラム: 一覧テーブル (タブ切り替え) */}
        <div className="w-full md:w-2/3 flex flex-col">
            <Card className="h-full flex flex-col border shadow-sm">
                <Tabs defaultValue="bug" className="h-full flex flex-col">
                    <CardHeader className="px-4 py-3 border-b shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">報告一覧</CardTitle>
                            <TabsList>
                                <TabsTrigger value="bug" className="flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" /> バグ報告
                                </TabsTrigger>
                                <TabsTrigger value="feature" className="flex items-center gap-1">
                                    <Lightbulb className="w-4 h-4" /> 要望
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-0 overflow-hidden bg-gray-50/30">
                        <TabsContent value="bug" className="h-full m-0 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24">日付</TableHead>
                                        <TableHead>タイトル</TableHead>
                                        <TableHead className="w-24">報告者</TableHead>
                                        <TableHead className="w-20">状態</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8">読み込み中...</TableCell></TableRow>
                                    ) : bugReports.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">報告はありません</TableCell></TableRow>
                                    ) : (
                                        bugReports.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-xs whitespace-nowrap">{item.report_date}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div>{item.title}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">{item.description}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{item.reporter_username}</TableCell>
                                                <TableCell><StatusBadge status={item.status} /></TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="feature" className="h-full m-0 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-24">日付</TableHead>
                                        <TableHead>タイトル</TableHead>
                                        <TableHead className="w-24">報告者</TableHead>
                                        <TableHead className="w-20">状態</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {listLoading ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8">読み込み中...</TableCell></TableRow>
                                    ) : featureRequests.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">要望はありません</TableCell></TableRow>
                                    ) : (
                                        featureRequests.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="text-xs whitespace-nowrap">{item.report_date}</TableCell>
                                                <TableCell className="font-medium">
                                                    <div>{item.title}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">{item.description}</div>
                                                </TableCell>
                                                <TableCell className="text-xs">{item.reporter_username}</TableCell>
                                                <TableCell><StatusBadge status={item.status} /></TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default BugReport;
