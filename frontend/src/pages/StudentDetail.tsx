import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import StudentDashboard from '../components/Dashboard'; // 作成したコンポーネント

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <div>Invalid ID</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Back
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Student Details</h2>
      </div>
      
      {/* ここでダッシュボードを表示 */}
      <StudentDashboard studentId={Number(id)} />
    </div>
  );
}
