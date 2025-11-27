'use client';

export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';

// Dynamically import TaskFlowHome with SSR disabled to prevent next/document errors
const TaskFlowHome = nextDynamic(
  () => import('@/components/framer-home/TaskFlowHome'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }
);

export default function Home() {
  return <TaskFlowHome />;
}
