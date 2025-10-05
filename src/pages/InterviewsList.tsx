import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Mail, User, Briefcase, TrendingUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InterviewsList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch interviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Interview History
              </h1>
              <p className="text-muted-foreground">AI-evaluated candidate interviews</p>
            </div>
          </div>
          <Button onClick={() => navigate('/admin/ai-interview')}>
            <Sparkles className="mr-2 h-4 w-4" />
            New Interview
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : interviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Interviews Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start conducting AI-powered interviews to evaluate candidates
              </p>
              <Button onClick={() => navigate('/admin/ai-interview')}>
                <Sparkles className="mr-2 h-4 w-4" />
                Start First Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {interview.candidate_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {interview.candidate_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {interview.position}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(interview.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        interview.status === 'completed' ? 'default' : 
                        interview.status === 'pending' ? 'secondary' : 
                        'outline'
                      }
                      className="capitalize"
                    >
                      {interview.status}
                    </Badge>
                  </div>
                </CardHeader>
                {interview.status === 'completed' && (
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <span className="text-sm font-medium">Overall Score</span>
                        </div>
                        <div className="text-3xl font-bold text-primary">
                          {interview.overall_score}/10
                        </div>
                      </div>
                      <div className="bg-secondary/5 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-5 w-5 text-secondary" />
                          <span className="text-sm font-medium">AI Recommendation</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {interview.recommendation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
