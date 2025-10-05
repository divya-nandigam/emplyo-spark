import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Clock, Calendar as CalendarIcon, User, BookOpen } from 'lucide-react';
import { AttendanceCard } from '@/components/employee/AttendanceCard';
import { ProfileCard } from '@/components/employee/ProfileCard';
import { AttendanceHistory } from '@/components/employee/AttendanceHistory';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [attendanceCount, setAttendanceCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchAttendanceCount();
    }
  }, [user]);

  const fetchAttendanceCount = async () => {
    if (!user) return;
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { count } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', `${currentMonth}-01`);

      setAttendanceCount(count || 0);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Employee Dashboard</h1>
              <p className="text-sm text-muted-foreground">Your workspace</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/employee/courses')} variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Courses
            </Button>
            <Button onClick={signOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">This Month's Attendance</CardTitle>
              <CalendarIcon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{attendanceCount} days</div>
            </CardContent>
          </Card>

          <AttendanceCard onUpdate={fetchAttendanceCount} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileCard />
          <AttendanceHistory />
        </div>
      </main>
    </div>
  );
}
