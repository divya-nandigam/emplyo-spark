-- Create departments enum
CREATE TYPE public.department_type AS ENUM (
  'Engineering',
  'Human Resources',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Customer Support',
  'Product Management'
);

-- Update profiles table to use department enum
ALTER TABLE public.profiles 
  ALTER COLUMN department TYPE public.department_type 
  USING department::public.department_type;

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department public.department_type NOT NULL,
  duration_hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create employee course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score INTEGER,
  UNIQUE(user_id, course_id)
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Everyone can view courses"
ON public.courses FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL USING (is_admin());

-- RLS Policies for quiz_questions
CREATE POLICY "Everyone can view quiz questions"
ON public.quiz_questions FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz questions"
ON public.quiz_questions FOR ALL USING (is_admin());

-- RLS Policies for course_enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses"
ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments"
ON public.course_enrollments FOR SELECT USING (is_admin());

-- RLS Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE course_enrollments.id = quiz_attempts.enrollment_id
    AND course_enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own quiz attempts"
ON public.quiz_attempts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE course_enrollments.id = enrollment_id
    AND course_enrollments.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts FOR SELECT USING (is_admin());

-- Insert sample courses
INSERT INTO public.courses (title, description, department, duration_hours) VALUES
('React Fundamentals', 'Learn the basics of React development', 'Engineering', 20),
('HR Best Practices', 'Modern HR management techniques', 'Human Resources', 15),
('Digital Marketing Strategy', 'Master digital marketing channels', 'Marketing', 25),
('Sales Excellence', 'Advanced sales techniques and strategies', 'Sales', 18),
('Financial Analysis', 'Corporate finance and analysis', 'Finance', 30),
('Operations Management', 'Optimize business operations', 'Operations', 22),
('Customer Service Mastery', 'Deliver exceptional customer experiences', 'Customer Support', 16),
('Product Strategy', 'Product management and roadmap planning', 'Product Management', 24);

-- Insert sample quiz questions for React Fundamentals course
INSERT INTO public.quiz_questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT 
  id,
  'What is React?',
  'A JavaScript library for building user interfaces',
  'A database management system',
  'A CSS framework',
  'A testing framework',
  'A'
FROM public.courses WHERE title = 'React Fundamentals'
UNION ALL
SELECT 
  id,
  'Which hook is used to manage state in functional components?',
  'useEffect',
  'useState',
  'useContext',
  'useReducer',
  'B'
FROM public.courses WHERE title = 'React Fundamentals'
UNION ALL
SELECT 
  id,
  'What is JSX?',
  'JavaScript Extension',
  'Java Syntax Extension',
  'JavaScript XML',
  'JSON Extension',
  'C'
FROM public.courses WHERE title = 'React Fundamentals';

-- Insert sample quiz questions for HR Best Practices
INSERT INTO public.quiz_questions (course_id, question_text, option_a, option_b, option_c, option_d, correct_answer)
SELECT 
  id,
  'What does HR stand for?',
  'Human Resources',
  'Hiring Records',
  'Human Relations',
  'High Ranking',
  'A'
FROM public.courses WHERE title = 'HR Best Practices'
UNION ALL
SELECT 
  id,
  'What is the primary purpose of performance reviews?',
  'To fire employees',
  'To provide feedback and development opportunities',
  'To reduce salaries',
  'To increase workload',
  'B'
FROM public.courses WHERE title = 'HR Best Practices';

-- Add trigger for courses updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();