
import { useState, useEffect } from 'react';
import { Grid3X3, Download, Printer, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SessionBadge } from '@/components/ui/session-badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getSessions, getTimeSlots, getRooms } from '@/lib/api';
import { Seat, SeatingPlan, Session, TimeSlot, Room } from '@/types/exam';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Generate = () => {

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [generatedPlans, setGeneratedPlans] = useState<SeatingPlan[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  useEffect(() => {
    Promise.all([getSessions(), getTimeSlots(), getRooms()])
      .then(([sRes, tRes, rRes]) => {
        setSessions(sRes.data);
        setTimeSlots(tRes.data);
        setRooms(rRes.data.map((r: any) => ({ ...r, capacity: r.rows * r.columns, id: r._id })));
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' }));
  }, []);

  const selectedSlot = timeSlots.find(s => s._id === selectedTimeSlot || s.id === selectedTimeSlot);
  const slotSessions = selectedSlot 
    ? sessions.filter(s => (selectedSlot.sessions || selectedSlot.sessionIds || []).includes(s._id || s.id))
    : [];


  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };


  const generateSeatingPlan = () => {
    if (!selectedTimeSlot || selectedRooms.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select a time slot and at least one room.",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const plans: SeatingPlan[] = selectedRooms.map(roomId => {
        const room = rooms.find(r => r.id === roomId)!;
        const seats: Seat[][] = [];
        let sessionIndex = 0;
        const slotSess = slotSessions;
        for (let row = 0; row < room.rows; row++) {
          const rowSeats: Seat[] = [];
          for (let col = 0; col < room.columns; col++) {
            const session = slotSess[sessionIndex % slotSess.length];
            const section = session.sections && session.sections.length > 0
              ? session.sections[Math.floor(Math.random() * session.sections.length)]
              : { id: '', name: '', strength: 0 };
            rowSeats.push({
              row,
              col,
              sessionId: session._id || session.id,
              sectionId: section.id,
              studentId: `${section.id}-${row * room.columns + col + 1}`,
              isEmpty: false
            });
            sessionIndex++;
          }
          seats.push(rowSeats);
        }
        return {
          id: `plan-${roomId}-${Date.now()}`,
          timeSlotId: selectedTimeSlot,
          roomId,
          seats,
          generatedAt: new Date().toISOString()
        };
      });
      setGeneratedPlans(plans);
      setIsGenerating(false);
      toast({
        title: "Seating Plan Generated",
        description: `Generated seating for ${selectedRooms.length} room(s).`
      });
    }, 1500);
  };

  const getSessionColor = (sessionId: string | null) => {
    if (!sessionId) return null;
    const session = sessions.find(s => (s._id || s.id) === sessionId);
    return session?.colorIndex || 1;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader 
        title="Generate Seating Plan" 
        description="Select options and generate optimized seating arrangements."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Time Slot Selection */}
          <div className="bg-card rounded-lg border border-border/50 shadow-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Select Time Slot</h3>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map(slot => (
                  <SelectItem key={slot._id || slot.id} value={slot._id || slot.id}>
                    {slot.name || slot.time} ({slot.date ? format(new Date(slot.date), 'MMM d') : ''})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {slotSessions.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2">
                <p className="text-sm text-muted-foreground">Sessions in this slot:</p>
                <div className="flex flex-wrap gap-2">
                  {slotSessions.map(session => (
                    <SessionBadge key={session.id} colorIndex={session.colorIndex}>
                      {session.name}
                    </SessionBadge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Room Selection */}
          <div className="bg-card rounded-lg border border-border/50 shadow-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Select Rooms</h3>
            <div className="space-y-2">
              {rooms.map(room => (
                <div 
                  key={room.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                    selectedRooms.includes(room.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => toggleRoom(room.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      checked={selectedRooms.includes(room.id)}
                      onCheckedChange={() => toggleRoom(room.id)}
                    />
                    <div>
                      <p className="font-medium text-foreground">{room.name}</p>
                      <p className="text-xs text-muted-foreground">{room.rows}×{room.columns} = {room.capacity} seats</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateSeatingPlan} 
            disabled={isGenerating || !selectedTimeSlot || selectedRooms.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Grid3X3 className="w-5 h-5" />
                Generate Seating Plan
              </>
            )}
          </Button>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2 space-y-4">
          {generatedPlans.length > 0 ? (
            <>
              {/* Legend */}
              <div className="bg-card rounded-lg border border-border/50 shadow-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Legend:</span>
                    {slotSessions.map(session => (
                      <div key={session.id} className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 rounded session-${session.colorIndex}`} />
                        <span className="text-sm text-foreground">{session.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Download className="w-4 h-4" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Printer className="w-4 h-4" />
                      Print
                    </Button>
                  </div>
                </div>
              </div>

              {/* Room Plans */}
              {generatedPlans.map(plan => {
                const room = rooms.find(r => r.id === plan.roomId)!;
                
                return (
                  <div key={plan.id} className="bg-card rounded-lg border border-border/50 shadow-card overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/30">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{room.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {room.rows} × {room.columns} = {room.capacity} seats
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6 overflow-x-auto">
                      <div className="inline-block">
                        {/* Board indicator */}
                        <div className="mb-4 px-4 py-2 bg-muted rounded text-center text-sm font-medium text-muted-foreground">
                          BOARD / FRONT
                        </div>
                        
                        {/* Seats grid */}
                        <div className="space-y-1.5">
                          {plan.seats.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex gap-1.5">
                              <div className="w-6 flex items-center justify-center text-xs text-muted-foreground">
                                {rowIndex + 1}
                              </div>
                              {row.map((seat, colIndex) => {
                                const colorIndex = getSessionColor(seat.sessionId);
                                const session = sessions.find(s => (s._id || s.id) === seat.sessionId);
                                const section = session?.sections.find(sec => sec.id === seat.sectionId);
                                
                                return (
                                  <Tooltip key={colIndex}>
                                    <TooltipTrigger>
                                      <div 
                                        className={cn(
                                          "w-10 h-10 rounded-md flex items-center justify-center text-[10px] font-medium cursor-pointer transition-transform hover:scale-110",
                                          colorIndex ? `session-${colorIndex} text-primary-foreground` : 'bg-muted'
                                        )}
                                      >
                                        {colIndex + 1}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1 text-xs">
                                        <p><strong>Session:</strong> {session?.name}</p>
                                        <p><strong>Section:</strong> {section?.name}</p>
                                        <p><strong>Seat:</strong> R{rowIndex + 1}-C{colIndex + 1}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        
                        {/* Column numbers */}
                        <div className="flex gap-1.5 mt-2">
                          <div className="w-6" />
                          {Array.from({ length: room.columns }).map((_, i) => (
                            <div key={i} className="w-10 text-center text-xs text-muted-foreground">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="bg-card rounded-lg border border-border/50 shadow-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Eye className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No Seating Plan Generated</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Select a time slot and rooms, then click "Generate Seating Plan" to see the preview here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate;
