// src/app/page.tsx
// Internal CRM root — no public landing here (the public marketing site is the
// separate marble-art.co.il repo). Send the root straight to the dashboard.
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}