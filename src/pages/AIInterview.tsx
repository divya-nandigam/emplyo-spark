import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ArrowLeft, Sparkles, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIInterview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [step, setStep] = useState<'setup' | 'questions' | 'complete'>('setup');
  const [loading, setLoading] = useState(false);
  
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [responses, setResponses] = useState<any[]>([]);

  const handleGenerateQuestions = async () => {
    if (!candidateName || !candidateEmail || !position || !department) {
      toast({
        title: "Missing Information",
        description: "Please fill in all candidate details",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create interview session
      const { data: session, error: sessionError } = await supabase
        .from("interview_sessions")
        .insert({
          candidate_name: candidateName,
          candidate_email: candidateEmail,
          position,
          department,
          created_by: user?.id,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Generate questions using AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-interview', {
        body: { action: 'generate_questions', position, department }
      });

      if (aiError) throw aiError;

      // Store questions in database
      const questionsToInsert = aiData.questions.map((q: any) => ({
        session_id: session.id,
        question_text: q.question,
        question_category: q.category,
        expected_points: q.expected_points,
      }));

      const { data: savedQuestions, error: questionsError } = await supabase
        .from("interview_questions")
        .insert(questionsToInsert)
        .select();

      if (questionsError) throw questionsError;

      setQuestions(savedQuestions);
      setStep('questions');

      toast({
        title: "Questions Generated",
        description: `${savedQuestions.length} AI-powered questions ready`,
      });
    } catch (error: any) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast({
        title: "Empty Response",
        description: "Please provide an answer",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    setResponses([...responses, {
      question_id: currentQuestion.id,
      question: currentQuestion.question_text,
      category: currentQuestion.question_category,
      expected_points: currentQuestion.expected_points,
      response: response.trim()
    }]);

    setResponse("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      await handleCompleteInterview();
    }
  };

  const handleCompleteInterview = async () => {
    setLoading(true);
    try {
      const allResponses = [...responses, {
        question_id: questions[currentQuestionIndex].id,
        question: questions[currentQuestionIndex].question_text,
        category: questions[currentQuestionIndex].question_category,
        expected_points: questions[currentQuestionIndex].expected_points,
        response: response.trim()
      }];

      // Evaluate responses using AI
      const { data: evalData, error: evalError } = await supabase.functions.invoke('ai-interview', {
        body: { 
          action: 'evaluate_responses',
          position,
          department,
          responses: allResponses
        }
      });

      if (evalError) throw evalError;

      // Save responses with evaluations
      const responsesToInsert = evalData.evaluations.map((e: any) => ({
        question_id: e.question_id,
        response_text: allResponses.find((r: any) => r.question_id === e.question_id).response,
        score: e.score,
        feedback: e.feedback,
      }));

      await supabase.from("interview_responses").insert(responsesToInsert);

      // Update session with results
      await supabase
        .from("interview_sessions")
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          overall_score: evalData.overall_score,
          recommendation: evalData.recommendation,
        })
        .eq('id', sessionId);

      setStep('complete');

      toast({
        title: "Interview Complete",
        description: `Overall Score: ${evalData.overall_score}/10`,
      });
    } catch (error: any) {
      console.error('Error completing interview:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete interview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Interview Assistant
            </h1>
            <p className="text-muted-foreground">AI-powered candidate evaluation</p>
          </div>
        </div>

        {step === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Interview Setup
              </CardTitle>
              <CardDescription>
                Enter candidate details to generate AI-powered interview questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidateName">Candidate Name</Label>
                  <Input
                    id="candidateName"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="candidateEmail">Candidate Email</Label>
                  <Input
                    id="candidateEmail"
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Engineering"
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateQuestions}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate AI Questions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'questions' && currentQuestion && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Badge>
                <Badge className="capitalize">{currentQuestion.question_category}</Badge>
              </div>
              <CardTitle>{currentQuestion.question_text}</CardTitle>
              <CardDescription>
                Candidate: {candidateName} | Position: {position}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Candidate Response</Label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Enter the candidate's answer here..."
                  className="min-h-[200px]"
                />
              </div>
              <Button
                onClick={handleSubmitResponse}
                disabled={loading || !response.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentQuestionIndex < questions.length - 1 ? (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Next Question
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Complete & Evaluate
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Interview Completed
              </CardTitle>
              <CardDescription>
                AI evaluation completed for {candidateName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <div className="text-6xl font-bold text-primary mb-2">
                  {responses.length + 1}/10
                </div>
                <p className="text-muted-foreground">Overall Score</p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/admin/interviews')}
                  className="w-full"
                >
                  View All Interviews
                </Button>
                <Button
                  onClick={() => {
                    setStep('setup');
                    setCandidateName("");
                    setCandidateEmail("");
                    setPosition("");
                    setDepartment("");
                    setQuestions([]);
                    setCurrentQuestionIndex(0);
                    setResponse("");
                    setResponses([]);
                    setSessionId(null);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Start New Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
