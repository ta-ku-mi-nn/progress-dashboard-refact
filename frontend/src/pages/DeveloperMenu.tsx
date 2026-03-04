import React from 'react';
import PasswordResetForm from '../components/PasswordResetForm';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Wrench } from 'lucide-react';

export default function DeveloperMenu() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Wrench className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">開発者メニュー</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="border-b bg-gray-50/50">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">ユーザーパスワードの強制リセット</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ログインできなくなったユーザーのパスワードを管理者が直接上書きします。
              変更後のパスワードをユーザーに伝えてください。
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <PasswordResetForm />
          </CardContent>
        </Card>

        {/* 今後、システム設定やDB管理などの機能が必要になったらここに追加可能 */}
      </div>
    </div>
  );
}