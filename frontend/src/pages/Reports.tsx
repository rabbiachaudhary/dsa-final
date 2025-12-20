
import { useState, useEffect } from 'react';
import { Users, DoorOpen, Clock, FileText, Calendar, Download } from 'lucide-react';
import { getSessions, getTimeSlots, getRooms } from '@/lib/api';
import { format } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SessionBadge } from '@/components/ui/session-badge';
import { toast } from '@/hooks/use-toast';

const Reports = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([getSessions(), getTimeSlots(), getRooms()])
      .then(([sRes, tRes, rRes]) => {
        setSessions(sRes.data);
        setTimeSlots(tRes.data);
        setRooms(rRes.data.map((r: any) => ({ ...r, capacity: r.rows * r.columns, id: r._id })));
      });
  }, []);
  const totalStudents = sessions.reduce((sum, s) => sum + (s.totalStudents || 0), 0);
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const reportTypes = [
    {
      title: "Session-wise Student List",
      description: "Complete list of students organized by session and section",
      icon: Users,
      formats: ['PDF', 'Excel']
    },
    {
      title: "Room Allocation Report",
      description: "Detailed room allocation with seating capacity utilization",
      icon: DoorOpen,
      formats: ['PDF', 'Excel']
    },
    {
      title: "Time Slot Schedule",
      description: "Complete examination schedule with time slots and sessions",
      icon: Clock,
      formats: ['PDF']
    },
    {
      title: "Seating Arrangement Report",
      description: "Full seating arrangement with student placement details",
      icon: FileText,
      formats: ['PDF', 'Excel']
    },
  ];

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSessionsCsv = () => {
    if (sessions.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'No sessions available to export.',
        variant: 'destructive',
      });
      return;
    }
    const header = ['Session', 'Year', 'Sections', 'TotalStudents'];
    const rows = [header.join(',')];
    sessions.forEach((s: any) => {
      const sections = s.sections || [];
      const total = s.totalStudents || sections.reduce((sum: number, sec: any) => sum + (sec.studentCount || 0), 0);
      rows.push([
        `"${s.name}"`,
        `"${s.year || ''}"`,
        sections.length,
        total,
      ].join(','));
    });
    downloadFile(rows.join('\n'), 'sessions-report.csv', 'text/csv;charset=utf-8;');
    toast({ title: 'Exported', description: 'Sessions report exported as CSV.' });
  };

  const exportRoomsCsv = () => {
    if (rooms.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'No rooms available to export.',
        variant: 'destructive',
      });
      return;
    }
    const header = ['Room', 'Rows', 'Columns', 'Capacity'];
    const rows = [header.join(',')];
    rooms.forEach((r: any) => {
      rows.push([
        `"${r.name}"`,
        r.rows,
        r.columns,
        r.capacity || (r.rows && r.columns ? r.rows * r.columns : ''),
      ].join(','));
    });
    downloadFile(rows.join('\n'), 'rooms-report.csv', 'text/csv;charset=utf-8;');
    toast({ title: 'Exported', description: 'Rooms report exported as CSV.' });
  };

  const exportScheduleCsv = () => {
    if (timeSlots.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'No time slots available to export.',
        variant: 'destructive',
      });
      return;
    }
    const header = ['TimeSlot', 'DateTime', 'Sessions'];
    const rows = [header.join(',')];
    timeSlots.forEach((slot: any) => {
      const slotSessions = sessions.filter(s => (slot.sessions || slot.sessionIds || []).includes(s._id || s.id));
      const names = slotSessions.map(s => s.name).join(' | ');
      const dateString = slot.date ? format(new Date(slot.date), 'yyyy-MM-dd') : '';
      rows.push([
        `"${slot.name || slot.time}"`,
        `"${dateString}"`,
        `"${names}"`,
      ].join(','));
    });
    downloadFile(rows.join('\n'), 'schedule-report.csv', 'text/csv;charset=utf-8;');
    toast({ title: 'Exported', description: 'Schedule report exported as CSV.' });
  };

  const handleReportClick = (title: string, fmt: string) => {
    const lower = fmt.toLowerCase();
    if (lower === 'pdf') {
      // Use browser print dialog; user can choose "Save as PDF"
      window.print();
      return;
    }
    // Excel -> CSV exports
    if (title.includes('Session-wise')) {
      exportSessionsCsv();
    } else if (title.includes('Room Allocation')) {
      exportRoomsCsv();
    } else if (title.includes('Time Slot Schedule')) {
      exportScheduleCsv();
    } else if (title.includes('Seating Arrangement')) {
      // Reuse schedule CSV as a basic seating arrangement summary
      exportScheduleCsv();
    }
  };
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader 
        title="Reports" 
        description="Generate and download examination reports."
      />
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border/50 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-session-1/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-session-1" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border/50 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-session-2/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-session-2" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border/50 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-session-3/10 flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-session-3" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{rooms.length}</p>
              <p className="text-sm text-muted-foreground">Rooms</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border/50 shadow-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-session-4/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-session-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{timeSlots.length}</p>
              <p className="text-sm text-muted-foreground">Time Slots</p>
            </div>
          </div>
        </div>
      </div>
      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report, index) => (
          <div 
            key={index}
            className="bg-card rounded-lg border border-border/50 shadow-card p-5 hover:shadow-card-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <report.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                <div className="flex gap-2">
                  {report.formats.map(fmt => (
                    <Button
                      key={fmt}
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleReportClick(report.title, fmt)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      {fmt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Recent Time Slots */}
      <div className="bg-card rounded-lg border border-border/50 shadow-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Examination Schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time Slot</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sessions</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeSlots.map(slot => {
                const slotSessions = sessions.filter(s => (slot.sessions || slot.sessionIds || []).includes(s._id || s.id));
                return (
                  <tr key={slot._id || slot.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{slot.name || slot.time}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {slotSessions.map(session => (
                          <SessionBadge key={session._id || session.id} colorIndex={session.colorIndex || 1}>
                            {session.name}
                          </SessionBadge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={exportScheduleCsv}
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
