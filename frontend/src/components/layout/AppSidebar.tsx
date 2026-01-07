import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  DoorOpen,
  Settings,
  Grid3X3,
  FileText,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sessions', icon: Users, label: 'Sessions' },
  { to: '/time-slots', icon: Clock, label: 'Time Slots' },
  { to: '/rooms', icon: DoorOpen, label: 'Rooms' },
  { to: '/constraints', icon: Settings, label: 'Constraints' },
  { to: '/generate', icon: Grid3X3, label: 'Generate Plan' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

type AppSidebarProps = {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function AppSidebar({ isMobileOpen = false, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const showLabels = useMemo(() => !collapsed || isMobileOpen, [collapsed, isMobileOpen]);

  const sidebarContent = (
    <div className="flex flex-col bg-card border-r border-border h-full">
      {/* Header */}
      <div className={cn(
        "h-16 flex items-center px-4 border-b border-border",
        collapsed && !isMobileOpen ? "justify-center" : ""
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          {showLabels && (
            <div className="animate-fade-in">
              <h1 className="font-semibold text-foreground text-sm leading-tight">SeatSync</h1>
              <p className="text-xs text-muted-foreground">Exam seating platform</p>
            </div>
          )}
        </div>
        {isMobileOpen && (
          <Button variant="ghost" size="icon" className="ml-auto" aria-label="Close navigation" onClick={onMobileClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-card" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "animate-scale-in")} />
              {showLabels && <span className="animate-slide-in">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            localStorage.removeItem("auth");
            navigate("/");
            onMobileClose?.();
          }}
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {showLabels && <span>Logout</span>}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border hidden lg:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden",
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
        aria-hidden={!isMobileOpen}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ease-in-out", 
          "w-[85%] max-w-xs shadow-card",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex h-screen sticky top-0 transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
