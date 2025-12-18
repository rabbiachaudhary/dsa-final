
import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { SessionBadge } from '@/components/ui/session-badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getSessions, createSession } from '@/lib/api';
import { Session, Section } from '@/types/exam';
import { toast } from '@/hooks/use-toast';


const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    year: '',
    name: '',
    sections: [{ name: '', strength: 0 }] as { name: string; strength: number }[],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSessions()
      .then(res => setSessions(res.data))
      .catch(() => toast({ title: 'Error', description: 'Failed to load sessions', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpanded = (sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const addSectionField = () => {
    setNewSession(prev => ({
      ...prev,
      sections: [...prev.sections, { name: '', strength: 0 }]
    }));
  };

  const removeSectionField = (index: number) => {
    if (newSession.sections.length > 1) {
      setNewSession(prev => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== index)
      }));
    }
  };

  const updateSectionField = (index: number, field: 'name' | 'strength', value: string | number) => {
    setNewSession(prev => ({
      ...prev,
      sections: prev.sections.map((sec, i) => 
        i === index ? { ...sec, [field]: value } : sec
      )
    }));
  };

  const handleAddSession = async () => {
    if (!newSession.year || !newSession.name || newSession.sections.some(s => !s.name || s.strength <= 0)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields correctly.",
        variant: "destructive"
      });
      return;
    }
    try {
      setLoading(true);
      const res = await createSession({
        year: newSession.year,
        name: newSession.name,
        sections: newSession.sections.map(s => ({ name: s.name, studentCount: s.strength, rollNumbers: [] })),
      });
      setSessions(prev => [...prev, res.data]);
      setNewSession({ year: '', name: '', sections: [{ name: '', strength: 0 }] });
      setIsDialogOpen(false);
      toast({
        title: "Session Added",
        description: `${res.data.name} has been added successfully.`
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to add session', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader 
        title="Sessions & Sections" 
        description="Manage exam sessions and their sections."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Session</DialogTitle>
              <DialogDescription>
                Create a new exam session with multiple sections.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Session Year</Label>
                  <Input
                    id="year"
                    placeholder="e.g., 2024"
                    value={newSession.year}
                    onChange={(e) => setNewSession(prev => ({ ...prev, year: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Session Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Fall 2024"
                    value={newSession.name}
                    onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sections</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSectionField}>
                    <Plus className="w-4 h-4 mr-1" /> Add Section
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newSession.sections.map((section, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                      <Input
                        placeholder="Section name"
                        value={section.name}
                        onChange={(e) => updateSectionField(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Strength"
                        value={section.strength || ''}
                        onChange={(e) => updateSectionField(index, 'strength', parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      {newSession.sections.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeSectionField(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSession}>Add Session</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const isExpanded = expandedSessions.includes(session.id);
          
          return (
            <Collapsible 
              key={session.id} 
              open={isExpanded}
              onOpenChange={() => toggleExpanded(session.id)}
              className="bg-card rounded-lg border border-border/50 shadow-card overflow-hidden"
            >
              <CollapsibleTrigger className="w-full">
                <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`w-4 h-4 rounded-full session-${session.colorIndex}`} />
                    <div className="text-left">
                      <p className="font-semibold text-foreground">{session.name}</p>
                      <p className="text-sm text-muted-foreground">{session.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{session.sections.length} sections</p>
                      <p className="text-sm text-muted-foreground">{session.totalStudents} students</p>
                    </div>
                    <SessionBadge colorIndex={session.colorIndex} variant="solid">
                      Active
                    </SessionBadge>
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t border-border bg-muted/20">
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Sections</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {session.sections.map((section) => (
                        <div 
                          key={section.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{section.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{section.strength} students</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default Sessions;
