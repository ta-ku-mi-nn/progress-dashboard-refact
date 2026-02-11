import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

const BugReport: React.FC = () => {
  const { user } = useAuth(); // ログインユーザー情報を取得
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [reportType, setReportType] = useState("bug"); // bug | feature
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("ログインが必要です");
        return;
    }
    setLoading(true);
    
    try {
      // ユーザー名はログイン情報から取得 (user.name または user.email)
      const payload = {
          reporter_username: (user as any).username || "Unknown User",
          title: formData.title,
          description: formData.description
      };

      // 種類に応じてエンドポイントを切り替え
      if (reportType === "bug") {
          await api.post('/system/bug_reports', payload);
      } else {
          await api.post('/system/feature_requests', payload);
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      alert("送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-8">
          <CardContent className="flex flex-col items-center gap-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold">送信完了</h2>
            <p className="text-muted-foreground">
              貴重なご意見ありがとうございます。<br />
              確認次第、対応させていただきます。
            </p>
            <Button onClick={() => { setIsSubmitted(false); setFormData({title:"", description:""}); }} className="mt-4">
              続けて報告する
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 md:p-8 pt-6 flex flex-col items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            バグ報告・機能リクエスト
          </CardTitle>
          <CardDescription>
            システムの不具合や、「こんな機能が欲しい」というご要望をお聞かせください。
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
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
                className="min-h-[150px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "送信中..." : (
                <>
                  <Send className="w-4 h-4 mr-2" /> 送信
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default BugReport;
