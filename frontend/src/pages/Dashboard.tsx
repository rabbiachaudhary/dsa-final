import { Users, Clock, DoorOpen, Calendar, Grid3X3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { SessionBadge } from '@/components/ui/session-badge';
import { getCurrentUser, getSessions, getRooms, getTimeSlots } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(res => {
        setUser(res.data);
        setLoadingUser(false);
      })
      .catch(() => {
        setUser(null);
        setLoadingUser(false);
      });

    Promise.all([
      getSessions(),
      getRooms(),
      getTimeSlots()
    ]).then(([sessionsRes, roomsRes, slotsRes]) => {
      setSessions(sessionsRes.data || []);
      setRooms(roomsRes.data || []);
      setTimeSlots(slotsRes.data || []);
      setLoadingData(false);
    }).catch(() => {
      setSessions([]);
      setRooms([]);
      setTimeSlots([]);
      setLoadingData(false);
    });
  }, []);

  const totalStudents = sessions.reduce((sum, s) => sum + (s.totalStudents || 0), 0);
  const upcomingSlots = timeSlots.filter((slot: any) => new Date(slot.date) >= new Date());

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      <PageHeader 
        title="Dashboard" 
        description="Automated, fair, and efficient exam hall planning."
      >
        <Button onClick={() => navigate('/generate')} size="lg" className="gap-2">
          <Grid3X3 className="w-5 h-5" />
          Generate Seating Plan
        </Button>
      </PageHeader>

      {/* User Info */}
      <div className="mb-4">
        {loadingUser ? (
          <div className="text-muted-foreground">Loading user info...</div>
        ) : user ? (
          <div className="bg-card border border-border/50 rounded-lg p-4 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold text-lg text-foreground">Welcome, {user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        ) : (
          <div className="text-destructive">Could not load user info.</div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={loadingData ? '...' : sessions.length}
          icon={Calendar}
          description="Active exam sessions"
          iconClassName="bg-session-1"
        />
        <StatCard
          title="Total Students"
          value={loadingData ? '...' : totalStudents}
          icon={Users}
          description="Across all sessions"
          iconClassName="bg-session-2"
        />
        <StatCard
          title="Total Rooms"
          value={loadingData ? '...' : rooms.length}
          icon={DoorOpen}
          description={loadingData ? '...' : `${rooms.reduce((sum, r) => sum + ((r.rows && r.columns) ? r.rows * r.columns : 0), 0)} total capacity`}
          iconClassName="bg-session-3"
        />
        <StatCard
          title="Upcoming Slots"
          value={loadingData ? '...' : upcomingSlots.length}
          icon={Clock}
          description="Scheduled exams"
          iconClassName="bg-session-4"
        />
      </div>


      {/* Quick Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Time Slots */}
        <div className="bg-card rounded-lg border border-border/50 shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Upcoming Time Slots</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/time-slots')} className="text-primary">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {loadingData ? (
              <div className="p-4 text-muted-foreground">Loading...</div>
            ) : timeSlots.slice(0, 3).map((slot: any) => {
              const slotSessions = sessions.filter(s => slot.sessionIds && slot.sessionIds.includes(s.id));
              return (
                <div key={slot.id} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{slot.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(slot.date), 'MMM d, yyyy')} • {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {slotSessions.map((session: any) => (
                        <SessionBadge key={session.id} colorIndex={session.colorIndex}>
                          {session.name}
                        </SessionBadge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sessions Overview */}
        <div className="bg-card rounded-lg border border-border/50 shadow-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Sessions Overview</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sessions')} className="text-primary">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {loadingData ? (
              <div className="p-4 text-muted-foreground">Loading...</div>
            ) : sessions.map((session: any) => (
              <div key={session.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full session-${session.colorIndex || 1}`} />
                    <div>
                      <p className="font-medium text-foreground">{session.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.sections ? session.sections.length : 0} sections • {session.totalStudents || 0} students
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{session.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rooms Overview */}
      <div className="bg-card rounded-lg border border-border/50 shadow-card">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Rooms Overview</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/rooms')} className="text-primary">
            Manage Rooms <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {loadingData ? (
              <div className="col-span-full text-muted-foreground">Loading...</div>
            ) : rooms.map((room: any) => (
              <div 
                key={room.id} 
                className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors text-center"
              >
                <DoorOpen className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="font-medium text-foreground">{room.name}</p>
                <p className="text-sm text-muted-foreground">{room.rows} × {room.columns}</p>
                <p className="text-xs text-muted-foreground mt-1">{room.capacity} seats</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
