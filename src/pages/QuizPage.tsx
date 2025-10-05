import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function QuizPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [answers, setAnswers] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizData();
  }, [courseId, user]);

  const fetchQuizData = async () => {
    try {
      const [courseData, questionsData, enrollmentData] = await Promise.all([
        supabase.from("courses").select("*").eq("id", courseId).single(),
        supabase.from("quiz_questions").select("*").eq("course_id", courseId),
        supabase.from("course_enrollments").select("*").eq("course_id", courseId).eq("user_id", user?.id || "").single()
      ]);

      if (courseData.error) throw courseData.error;
      if (questionsData.error) throw questionsData.error;

      setCourse(courseData.data);
      setQuestions(questionsData.data || []);
      setEnrollment(enrollmentData.data);
    } catch (error: any) {
      console.error('Error fetching quiz data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) {
      toast({
        title: "Please select an answer",
        variant: "destructive",
      });
      return;
    }

    const question = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct_answer;

    setAnswers([...answers, {
      question_id: question.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect
    }]);

    setSelectedAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitQuiz([...answers, {
        question_id: question.id,
        selected_answer: selectedAnswer,
        is_correct: isCorrect
      }]);
    }
  };

  const submitQuiz = async (finalAnswers: any[]) => {
    setSubmitting(true);
    try {
      // Calculate score
      const correctCount = finalAnswers.filter(a => a.is_correct).length;
      const score = Math.round((correctCount / questions.length) * 100);

      // Save quiz attempts
      const attemptsToInsert = finalAnswers.map(a => ({
        enrollment_id: enrollment.id,
        question_id: a.question_id,
        selected_answer: a.selected_answer,
        is_correct: a.is_correct
      }));

      await supabase.from("quiz_attempts").insert(attemptsToInsert);

      // Update enrollment with score and completion
      await supabase
        .from("course_enrollments")
        .update({
          quiz_score: score,
          completed_at: new Date().toISOString()
        })
        .eq("id", enrollment.id);

      setShowResults(true);
      toast({
        title: "Quiz Completed!",
        description: `Your score: ${score}%`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit quiz",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Not Enrolled</CardTitle>
            <CardDescription>Please enroll in this course first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/employee/courses')}>
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const correctCount = answers.filter(a => a.is_correct).length;
    const score = Math.round((correctCount / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-3xl">Quiz Results</CardTitle>
              <CardDescription className="text-center">{course?.title}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">{score}%</div>
                <p className="text-muted-foreground">
                  You got {correctCount} out of {questions.length} questions correct
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const answer = answers[idx];
                  return (
                    <div key={q.id} className="p-4 border rounded-lg">
                      <div className="flex items-start gap-2 mb-2">
                        {answer.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{q.question_text}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your answer: <Badge variant={answer.is_correct ? "default" : "destructive"}>
                              {answer.selected_answer}
                            </Badge>
                          </p>
                          {!answer.is_correct && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct answer: <Badge className="bg-green-500">{q.correct_answer}</Badge>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button onClick={() => navigate('/employee/courses')} className="w-full">
                Back to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/employee/courses')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{course?.title} Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => (
                  <div key={option} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                      {currentQuestion[`option_${option.toLowerCase()}`]}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Button
              onClick={handleNext}
              disabled={!selectedAnswer || submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : currentQuestionIndex < questions.length - 1 ? (
                "Next Question"
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
