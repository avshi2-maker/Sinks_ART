/**
 * src/app/dashboard/page.tsx
 *
 * "לוח היום" — today's follow-ups landing. Server Component.
 * Order: follow-ups first (offers waiting + jobs needing a step), then the pipeline
 * money summary, then today's activity, quick actions, tasks, projects, comms.
 */
import { fetchDashboardData } from './fetchDashboardData';
import FlowLauncher from '@/components/dashboard/FlowLauncher';
import TodayFollowups from '@/components/dashboard/TodayFollowups';
import TodayActivityStrip from '@/components/dashboard/TodayActivityStrip';
import QuickActions from '@/components/dashboard/QuickActions';
import DashboardPipelineStrip from '@/components/dashboard/DashboardPipelineStrip';
import TasksStrip from '@/components/dashboard/TasksStrip';
import ActiveProjectsList from '@/components/dashboard/ActiveProjectsList';
import RecentCommsFeed from '@/components/dashboard/RecentCommsFeed';
export const dynamic = 'force-dynamic';  // Always fetch fresh; no caching at build time
export default async function DashboardPage() {
  let data;
  try {
    data = await fetchDashboardData();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-6" dir="rtl">
        <div className="text-sm font-medium text-red-800 mb-1">⚠️ שגיאה בטעינת נתוני לוח הבקרה</div>
        <div className="text-xs text-red-700 font-mono">{msg}</div>
        <div className="text-xs text-red-600 mt-3">רענן את הדף או בדוק את ההגדרות של Supabase.</div>
      </div>
    );
  }
  return (
    <>
      {/* Pinned guided launcher — what now? */}
      <FlowLauncher />
      {/* Follow-ups first — what needs action today */}
      <TodayFollowups />
      {/* Money + pipeline snapshot */}
      <DashboardPipelineStrip />
      {/* Today's activity counters */}
      <TodayActivityStrip
        callCount={data.today.callCount}
        photoCount={data.today.photoCount}
        videoCount={data.today.videoCount}
        totalCostUsd={data.today.totalCostUsd}
      />
      <QuickActions />
      <TasksStrip />
      <ActiveProjectsList projects={data.activeProjects} />
      <RecentCommsFeed comms={data.recentComms} />
      <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-500 text-center">
        Phase 17 · Path Y · נתונים חיים מ-Supabase · רצועת המשימות עוד מציגה נתונים מודגמים (Phase 17.5 יחבר אותה)
      </div>
    </>
  );
}
