-- ============================================================
-- Classroom App — Supabase Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 0. Helper function to check admin role (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  class_grade TEXT NOT NULL DEFAULT '',
  date_of_birth DATE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create assignments table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  answer_key TEXT NOT NULL DEFAULT '',
  answer_key_image_url TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'grading', 'graded', 'error')),
  ai_raw_response JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  graded_at TIMESTAMPTZ
);

-- 4. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for profiles (using is_admin() to avoid recursion)
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 6. RLS Policies for assignments
CREATE POLICY "assignments_select_authenticated"
  ON public.assignments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "assignments_insert_admin"
  ON public.assignments FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "assignments_update_own"
  ON public.assignments FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "assignments_delete_own"
  ON public.assignments FOR DELETE
  USING (created_by = auth.uid());

-- 7. RLS Policies for submissions
CREATE POLICY "submissions_select_own"
  ON public.submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "submissions_select_admin"
  ON public.submissions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "submissions_insert_student"
  ON public.submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "submissions_update"
  ON public.submissions FOR UPDATE
  USING (
    student_id = auth.uid() OR public.is_admin()
  );

-- 8. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, class_grade, date_of_birth, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'class_grade', ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE 
      ELSE NULL 
    END,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('answer-keys', 'answer-keys', true)
ON CONFLICT (id) DO NOTHING;

-- 10. Storage policies
CREATE POLICY "Authenticated users can upload submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'submissions' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view submissions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'submissions');

CREATE POLICY "Admins can upload answer keys"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'answer-keys' AND public.is_admin()
  );

CREATE POLICY "Anyone authenticated can view answer keys"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'answer-keys' AND auth.uid() IS NOT NULL);

-- ============================================================
-- ADMIN SETUP: Run this AFTER creating your admin account
-- Replace 'your-admin-user-id' with the UUID from auth.users
-- ============================================================
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'your-admin-user-id';
