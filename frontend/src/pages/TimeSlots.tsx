

import { useState, useEffect } from 'react';

import { Plus, Calendar, Clock, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { PageHeader } from '@/components/ui/page-header';

import { SessionBadge } from '@/components/ui/session-badge';

import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Checkbox } from '@/components/ui/checkbox';

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogHeader,

  DialogTitle,

  DialogTrigger,

  DialogFooter,

} from '@/components/ui/dialog';

import { getSessions, getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from '@/lib/api';

import { TimeSlot, Session } from '@/types/exam';

import { format } from 'date-fns';

import { toast } from '@/hooks/use-toast';



const TimeSlots = () => {



  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const [sessions, setSessions] = useState<Session[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  const [newSlot, setNewSlot] = useState({

    name: '',

    date: '',

    startTime: '',

    endTime: '',

    sessionIds: [] as string[],

  });

  const [loading, setLoading] = useState(false);



  useEffect(() => {
    setLoading(true);
    Promise.all([getTimeSlots(), getSessions()])
      .then(([tsRes, sRes]) => {
        const mappedSlots: TimeSlot[] = tsRes.data.map((slot: any) => {
          const time: string = slot.time || '';
          const [datePart, timeRange] = time.split(' ');
          const [startTime, endTime] = (timeRange || '').split('-');

          const sessionIds: string[] = (slot.sessions || []).map((s: any) =>
            typeof s === 'string' ? s : s._id
          );

          return {
            id: slot._id,
            name: slot.name || `${datePart || ''} ${startTime || ''}-${endTime || ''}`.trim(),
            date: datePart || '',
            startTime: startTime || '',
            endTime: endTime || '',
            sessionIds,
          };
        });

        const mappedSessions: Session[] = sRes.data.map((s: any, index: number) => {
          const sections = (s.sections || []).map((sec: any) => ({
            id: sec._id,
            name: sec.name,
            strength: sec.studentCount ?? sec.strength ?? 0,
          }));
          const totalStudents = sections.reduce((sum, sec) => sum + (sec.strength || 0), 0);
          return {
            id: s._id,
            year: s.year || '',
            name: s.name,
            sections,
            totalStudents,
            colorIndex: s.colorIndex ?? ((index % 6) + 1),
          };
        });

        setTimeSlots(mappedSlots);
        setSessions(mappedSessions);
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);



  const toggleSession = (sessionId: string) => {

    setNewSlot(prev => ({

      ...prev,

      sessionIds: prev.sessionIds.includes(sessionId)

        ? prev.sessionIds.filter(id => id !== sessionId)

        : [...prev.sessionIds, sessionId]

    }));

  };



  const resetForm = () => {

    setNewSlot({ name: '', date: '', startTime: '', endTime: '', sessionIds: [] });

    setEditingSlotId(null);

  };



  const openCreateDialog = () => {

    resetForm();

    setIsDialogOpen(true);

  };



  const openEditDialog = (slot: TimeSlot) => {

    setNewSlot({

      name: slot.name,

      date: slot.date,

      startTime: slot.startTime,

      endTime: slot.endTime,

      sessionIds: [...slot.sessionIds],

    });

    setEditingSlotId(slot.id);

    setIsDialogOpen(true);

  };



  const handleSaveTimeSlot = async () => {

    if (!newSlot.name || !newSlot.date || !newSlot.startTime || !newSlot.endTime || newSlot.sessionIds.length < 2) {

      toast({

        title: "Validation Error",

        description: "Please fill in all fields and select at least 2 sessions.",

        variant: "destructive"

      });

      return;

    }

    try {

      setLoading(true);

      const payload = {

        time: `${newSlot.date} ${newSlot.startTime}-${newSlot.endTime}`,

        sessions: newSlot.sessionIds,

      };



      if (editingSlotId) {

        const res = await updateTimeSlot(editingSlotId, payload);

        const updated = res.data;

        const time: string = updated.time || '';

        const [datePart, timeRange] = time.split(' ');

        const [startTime, endTime] = (timeRange || '').split('-');

        const sessionIds: string[] = (updated.sessions || []).map((s: any) =>

          typeof s === 'string' ? s : s._id

        );



        setTimeSlots(prev =>

          prev.map(slot =>

            slot.id === editingSlotId

              ? {

                  id: updated._id,

                  name: newSlot.name,

                  date: datePart || '',

                  startTime: startTime || '',

                  endTime: endTime || '',

                  sessionIds,

                }

              : slot

          )

        );

        toast({

          title: "Time Slot Updated",

          description: `${newSlot.name} has been updated successfully.`

        });

      } else {

        const res = await createTimeSlot(payload);

        const created = res.data;

        const time: string = created.time || '';

        const [datePart, timeRange] = time.split(' ');

        const [startTime, endTime] = (timeRange || '').split('-');

        const sessionIds: string[] = (created.sessions || []).map((s: any) =>

          typeof s === 'string' ? s : s._id

        );



        const viewModel: TimeSlot = {

          id: created._id,

          name: newSlot.name,

          date: datePart || '',

          startTime: startTime || '',

          endTime: endTime || '',

          sessionIds,

        };



        setTimeSlots(prev => [...prev, viewModel]);

        toast({

          title: "Time Slot Added",

          description: `${newSlot.name} has been added successfully.`

        });

      }



      resetForm();

      setIsDialogOpen(false);

    } catch {

      toast({ title: 'Error', description: 'Failed to save time slot', variant: 'destructive' });

    } finally {

      setLoading(false);

    }

  };



  const handleDeleteTimeSlot = async (id: string) => {

    try {

      setLoading(true);

      await deleteTimeSlot(id);

      setTimeSlots(prev => prev.filter(slot => slot.id !== id));

      toast({

        title: "Time Slot Deleted",

        description: "The time slot has been removed successfully."

      });

    } catch {

      toast({ title: 'Error', description: 'Failed to delete time slot', variant: 'destructive' });

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">

      <PageHeader 

        title="Time Slot Management" 

        description="Schedule exam time slots and assign sessions."

      >

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>

          <DialogTrigger asChild>

            <Button className="gap-2" onClick={openCreateDialog}>

              <Plus className="w-4 h-4" />

              {editingSlotId ? 'Edit Time Slot' : 'Add Time Slot'}

            </Button>

          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">

            <DialogHeader>

              <DialogTitle>{editingSlotId ? 'Edit Time Slot' : 'Add New Time Slot'}</DialogTitle>

              <DialogDescription>

                Create a new exam time slot and assign sessions (minimum 2 required).

              </DialogDescription>

            </DialogHeader>

            <div className="space-y-4 py-4">

              <div className="space-y-2">

                <Label htmlFor="slotName">Slot Name</Label>

                <Input

                  id="slotName"

                  placeholder="e.g., Morning Exam - Day 1"

                  value={newSlot.name}

                  onChange={(e) => setNewSlot(prev => ({ ...prev, name: e.target.value }))}

                />

              </div>

              

              <div className="space-y-2">

                <Label htmlFor="date">Date</Label>

                <Input

                  id="date"

                  type="date"

                  value={newSlot.date}

                  onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}

                />

              </div>

              

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">

                  <Label htmlFor="startTime">Start Time</Label>

                  <Input

                    id="startTime"

                    type="time"

                    value={newSlot.startTime}

                    onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}

                  />

                </div>

                <div className="space-y-2">

                  <Label htmlFor="endTime">End Time</Label>

                  <Input

                    id="endTime"

                    type="time"

                    value={newSlot.endTime}

                    onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}

                  />

                </div>

              </div>

              

              <div className="space-y-3">

                <Label>Select Sessions (min. 2)</Label>

                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-lg border border-border bg-muted/30">

                  {sessions.map((session) => (

                    <div key={session.id} className="flex items-center space-x-3">

                      <Checkbox

                        id={session.id}

                        checked={newSlot.sessionIds.includes(session.id)}

                        onCheckedChange={() => toggleSession(session.id)}

                      />

                      <label 

                        htmlFor={session.id}

                        className="flex items-center gap-2 text-sm font-medium cursor-pointer"

                      >

                        <div className={`w-3 h-3 rounded-full session-${session.colorIndex}`} />

                        {session.name}

                        <span className="text-muted-foreground">({session.totalStudents} students)</span>

                      </label>

                    </div>

                  ))}

                </div>

                {newSlot.sessionIds.length > 0 && newSlot.sessionIds.length < 2 && (

                  <p className="text-sm text-destructive">Please select at least 2 sessions</p>

                )}

              </div>

            </div>

            <DialogFooter>

              <Button

                variant="outline"

                onClick={() => {

                  resetForm();

                  setIsDialogOpen(false);

                }}

              >

                Cancel

              </Button>

              <Button onClick={handleSaveTimeSlot}>

                {editingSlotId ? 'Save Changes' : 'Add Time Slot'}

              </Button>

            </DialogFooter>

          </DialogContent>

        </Dialog>

      </PageHeader>



      {/* Time Slots List */}

      <div className="space-y-4">

        {timeSlots.map((slot) => {

          const slotSessions = sessions.filter(s =>
            slot.sessionIds.includes(s.id)
          );

          const totalStudents = slotSessions.reduce((sum, s) => sum + (s.totalStudents || 0), 0);

          

          return (

            <div 

              key={slot.id}

              className="bg-card rounded-lg border border-border/50 shadow-card p-5 hover:shadow-card-md transition-shadow"

            >

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div className="space-y-3">

                  <h3 className="font-semibold text-lg text-foreground">{slot.name}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">

                    <div className="flex items-center gap-1.5">

                      <Calendar className="w-4 h-4" />

                      <span>{slot.date ? format(new Date(slot.date), 'EEEE, MMMM d, yyyy') : '—'}</span>

                    </div>

                    <div className="flex items-center gap-1.5">

                      <Clock className="w-4 h-4" />

                      <span>{slot.startTime} - {slot.endTime}</span>

                    </div>

                  </div>

                </div>

                

                <div className="flex flex-col items-start md:items-end gap-3">

                  <div className="flex flex-wrap gap-2">

                    {slotSessions.map(session => (

                      <SessionBadge key={session.id} colorIndex={session.colorIndex || 1}>

                        {session.name}

                      </SessionBadge>

                    ))}

                  </div>

                  <div className="flex items-center gap-3">

                    <p className="text-sm text-muted-foreground">

                      {slotSessions.length} sessions • {totalStudents} total students

                    </p>

                    <div className="flex items-center gap-1">

                      <Button

                        variant="ghost"

                        size="icon"

                        className="h-8 w-8 text-muted-foreground hover:text-foreground"

                        onClick={() => openEditDialog(slot)}

                      >

                        <Pencil className="w-4 h-4" />

                      </Button>

                      <Button

                        variant="ghost"

                        size="icon"

                        className="h-8 w-8 text-muted-foreground hover:text-destructive"

                        onClick={() => handleDeleteTimeSlot(slot.id)}

                      >

                        <Trash2 className="w-4 h-4" />

                      </Button>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          );

        })}

      </div>

    </div>

  );

};



export default TimeSlots;

