import { requireUser } from '@/lib/auth/session';
import { PageHeader } from '@/components/dashboard/AppShell';
import { ProfileForm } from './ProfileForm';

export const metadata = { title: 'Profile', robots: { index: false } };

export default async function ProfilePage() {
  const profile = await requireUser('/dashboard/profile');

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 lg:px-10 lg:py-12">
      <PageHeader
        title="Your profile"
        description="Your contact details and birth information. Only you and Komal can see this."
      />
      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
