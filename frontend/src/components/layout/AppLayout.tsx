import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, GraduationCap } from 'lucide-react';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between bg-card border-b border-border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">SeatSync</p>
              <p className="text-xs text-muted-foreground">Exam seating platform</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <AppSidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
