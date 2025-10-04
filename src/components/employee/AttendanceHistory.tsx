import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  date: string;
  check_in: string;
  check_out: string | null;
  status: string;
}

export function AttendanceHistory() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (user) {
      fetchAttendance();
    }
  }, [user]);

  const fetchAttendance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
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
          Attendance History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No attendance records yet
            </p>
          ) : (
            attendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-[var(--transition-smooth)]"
              >
                <div>
                  <p className="font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span>In: {format(new Date(record.check_in), 'h:mm a')}</span>
                    {record.check_out && (
                      <span>Out: {format(new Date(record.check_out), 'h:mm a')}</span>
                    )}
                  </div>
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
