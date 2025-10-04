import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  profiles: {
    full_name: string;
  };
}

export function AttendanceOverview() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('id, date, status, profiles(full_name)')
        .eq('date', today)
        .order('check_in', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No attendance records for today
            </p>
          ) : (
            attendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-[var(--transition-smooth)]"
              >
                <div>
                  <p className="font-medium">{record.profiles.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(record.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                  {record.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
