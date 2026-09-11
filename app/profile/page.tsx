import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileSettings from '@/app/components/dashboard/ProfileSettings';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/profile');

  return <ProfileSettings user={user} />;
}
