-- Add foreign key relationship for better querying
ALTER TABLE public.attendance
DROP CONSTRAINT IF EXISTS attendance_user_id_fkey;

ALTER TABLE public.attendance
ADD CONSTRAINT attendance_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;