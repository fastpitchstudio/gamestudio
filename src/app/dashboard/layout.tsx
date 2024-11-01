import { SideNav } from '@/components/shared/side-nav'
import { TopNav } from '@/components/shared/top-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex dark:bg-slate-950">
      <div className="w-72 flex-shrink-0">
        <SideNav />
      </div>
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}