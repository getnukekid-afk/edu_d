-- ============================================================
-- FIX: Infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Step 1: Create a SECURITY DEFINER function to check admin role
-- This bypasses RLS when checking, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop ALL existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Anyone authenticated can view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can update their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can delete their own assignments" ON public.assignments;

DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "System can update submissions (for grading)" ON public.submissions;

-- Step 3: Recreate profiles policies (using is_admin() to avoid recursion)
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

-- Step 4: Recreate assignments policies
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

-- Step 5: Recreate submissions policies
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

-- ============================================================
-- DONE! The infinite recursion should now be fixed.
-- ============================================================
