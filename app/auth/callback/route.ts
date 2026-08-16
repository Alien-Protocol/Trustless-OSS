import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function safeNextPath(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }
  return '/dashboard';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const cookieStore = await cookies();
  const next = safeNextPath(
    searchParams.get('next') ?? cookieStore.get('auth_next')?.value ?? null
  );

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      response.cookies.set('auth_next', '', { path: '/', maxAge: 0 });
      // provider_token (GitHub OAuth token) is only available immediately after
      // the code exchange — persist it in a short-lived cookie so client pages
      // can use it for GitHub API calls without re-authenticating.
      if (data.session?.provider_token) {
        response.cookies.set('gh_token', data.session.provider_token, {
          httpOnly: false, // must be readable by JS on the client
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 8, // 8 hours
          path: '/',
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
