import { redirect } from 'next/navigation';

export default function OnboardingLegacyRedirect() {
  redirect('/group/create');
}
