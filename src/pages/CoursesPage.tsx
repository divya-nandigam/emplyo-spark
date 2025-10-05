import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Clock, Briefcase, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoursesAndEnrollments();
  }, [user]);

  const fetchCoursesAndEnrollments = async () => {
    try {
      const [coursesData, enrollmentsData] = await Promise.all([
        supabase.from("courses").select("*").order("title"),
        supabase.from("course_enrollments").select("*").eq("user_id", user?.id || "")
      ]);

      if (coursesData.error) throw coursesData.error;
      if (enrollmentsData.error) throw enrollmentsData.error;

      setCourses(coursesData.data || []);
      setEnrollments(enrollmentsData.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("course_enrollments")
        .insert({ user_id: user?.id, course_id: courseId });

      if (error) throw error;

      toast({
        title: "Enrolled Successfully",
        description: "You can now start the course and take the quiz",
      });

      fetchCoursesAndEnrollments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll in course",
        variant: "destructive",
      });
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  const getEnrollment = (courseId: string) => {
    return enrollments.find(e => e.course_id === courseId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/employee')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Training Courses
            </h1>
            <p className="text-muted-foreground">Enhance your skills with department-specific training</p>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const enrollment = getEnrollment(course.id);
              const enrolled = isEnrolled(course.id);

              return (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <BookOpen className="h-8 w-8 text-primary" />
                      {enrolled && !enrollment?.completed_at && (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                      {enrollment?.completed_at && (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {course.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration_hours}h
                      </span>
                    </div>
                    
                    {enrollment?.quiz_score !== null && enrollment?.quiz_score !== undefined && (
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <p className="text-sm font-medium">Quiz Score: {enrollment.quiz_score}%</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!enrolled ? (
                        <Button onClick={() => handleEnroll(course.id)} className="w-full">
                          Enroll Now
                        </Button>
                      ) : enrollment?.completed_at ? (
                        <Button variant="outline" className="w-full" disabled>
                          Course Completed
                        </Button>
                      ) : (
                        <Button
                          onClick={() => navigate(`/employee/quiz/${course.id}`)}
                          className="w-full"
                        >
                          Take Quiz
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
