'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const classGrade = formData.get('class_grade') as string;
  const dateOfBirth = formData.get('date_of_birth') as string;

  // Get the site URL (Render.com provides RENDER_EXTERNAL_URL automatically)
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.RENDER_EXTERNAL_URL ?? 'http://localhost:3000';
  // Remove trailing slash if present
  siteUrl = siteUrl.replace(/\/$/, '');

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        class_grade: classGrade,
        date_of_birth: dateOfBirth,
        role: 'student',
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
