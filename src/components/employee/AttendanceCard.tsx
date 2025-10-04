import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function AttendanceCard({ onUpdate }: { onUpdate: () => void }) {
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkTodayAttendance();
    }
  }, [user]);

  const checkTodayAttendance = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setTodayAttendance(data);
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('attendance').insert({
        user_id: user.id,
        date: today,
        status: 'present',
      });

      if (error) throw error;

      toast({ title: 'Checked in successfully!' });
      checkTodayAttendance();
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error checking in',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !todayAttendance) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('attendance')
        .update({ check_out: new Date().toISOString() })
        .eq('id', todayAttendance.id);

      if (error) throw error;

      toast({ title: 'Checked out successfully!' });
      checkTodayAttendance();
    } catch (error: any) {
      toast({
        title: 'Error checking out',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-[var(--shadow-card)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
        <Clock className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {!todayAttendance ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Not checked in yet</p>
            <Button onClick={handleCheckIn} disabled={loading} className="w-full">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Check In
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm">
              <p className="font-medium text-primary">Checked In</p>
              <p className="text-muted-foreground">
                {format(new Date(todayAttendance.check_in), 'h:mm a')}
              </p>
            </div>
            {todayAttendance.check_out ? (
              <div className="text-sm">
                <p className="font-medium">Checked Out</p>
                <p className="text-muted-foreground">
                  {format(new Date(todayAttendance.check_out), 'h:mm a')}
                </p>
              </div>
            ) : (
              <Button onClick={handleCheckOut} disabled={loading} variant="secondary" className="w-full">
                Check Out
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
