
import { useState, useEffect } from 'react';
import { Plus, ChevronDown, ChevronRight, Users, X, Pencil, Trash2 } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getSessions, createSession, updateSession, deleteSession, deleteSection, addRollNumbers, uploadPDF } from '@/lib/api';
import { Session, Section } from '@/types/exam';
import { toast } from '@/hooks/use-toast';


const Sessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({
    year: '',
    name: '',
    sections: [{ name: '', strength: 0 }] as { name: string; strength: number }[],
  });
  const [loading, setLoading] = useState(false);

  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [studentDialogSessionId, setStudentDialogSessionId] = useState<string | null>(null);
  const [studentDialogSectionId, setStudentDialogSectionId] = useState<string | null>(null);
  const [studentDialogTab, setStudentDialogTab] = useState<'manual' | 'pdf'>('manual');
  const [rollNumbersText, setRollNumbersText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  useEffect(() => {
    setLoading(true);
    getSessions()
      .then(res => {
        const mapped: Session[] = res.data.map((s: any, index: number) => {
          const sections: Section[] = (s.sections || []).map((sec: any) => ({
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

        setSessions(mapped);
      })
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

  const resetForm = () => {
    setNewSession({ year: '', name: '', sections: [{ name: '', strength: 0 }] });
    setEditingSessionId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (session: Session) => {
    setNewSession({
      year: session.year,
      name: session.name,
      sections: session.sections.map(sec => ({ name: sec.name, strength: sec.strength })),
    });
    setEditingSessionId(session.id);
    setIsDialogOpen(true);
  };

  const mapSessionDoc = (doc: any, colorIndex: number): Session => {
    const sections: Section[] = (doc.sections || []).map((sec: any) => ({
      id: sec._id,
      name: sec.name,
      strength: sec.studentCount ?? sec.strength ?? 0,
    }));
    const totalStudents = sections.reduce((sum, sec) => sum + (sec.strength || 0), 0);

    return {
      id: doc._id,
      year: doc.year || '',
      name: doc.name,
      sections,
      totalStudents,
      colorIndex,
    };
  };

  const handleSaveSession = async () => {
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
      const payload = {
        year: newSession.year,
        name: newSession.name,
        sections: newSession.sections.map(s => ({ name: s.name, studentCount: s.strength, rollNumbers: [] })),
      };

      if (editingSessionId) {
        const existing = sessions.find(s => s.id === editingSessionId);
        const res = await updateSession(editingSessionId, payload);
        const updated = mapSessionDoc(res.data, existing?.colorIndex ?? 1);
        setSessions(prev => prev.map(s => (s.id === editingSessionId ? updated : s)));
        toast({
          title: "Session Updated",
          description: `${updated.name} has been updated successfully.`
        });
      } else {
        const res = await createSession(payload);
        const colorIndex = ((sessions.length % 6) + 1);
        const created = mapSessionDoc(res.data, colorIndex);
        setSessions(prev => [...prev, created]);
        toast({
          title: "Session Added",
          description: `${created.name} has been added successfully.`
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save session', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      setLoading(true);
      await deleteSession(id);
      setSessions(prev => prev.filter(session => session.id !== id));
      toast({
        title: "Session Deleted",
        description: "The session has been removed successfully."
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete session', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sessionId: string, sectionId: string) => {
    try {
      setLoading(true);
      const existing = sessions.find(s => s.id === sessionId);
      const res = await deleteSection(sessionId, sectionId);
      const updated = mapSessionDoc(res.data, existing?.colorIndex ?? 1);
      setSessions(prev => prev.map(s => (s.id === sessionId ? updated : s)));
      toast({
        title: "Section Deleted",
        description: "The section has been removed successfully."
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete section', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openStudentDialog = (sessionId: string, sectionId: string) => {
    setStudentDialogSessionId(sessionId);
    setStudentDialogSectionId(sectionId);
    setStudentDialogTab('manual');
    setRollNumbersText('');
    setPdfFile(null);
    setIsStudentDialogOpen(true);
  };

  const remapSessionsFromResponse = (data: any[]): Session[] => {
    return data.map((s: any, index: number) => {
      const sections: Section[] = (s.sections || []).map((sec: any) => ({
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
  };

  const refreshSessions = async () => {
    const res = await getSessions();
    const mapped = remapSessionsFromResponse(res.data);
    setSessions(mapped);
  };

  const handleSaveManualRollNumbers = async () => {
    if (!studentDialogSessionId || !studentDialogSectionId) return;
    const raw = rollNumbersText.split(/[\s,;\n\r]+/).map(r => r.trim()).filter(Boolean);
    if (raw.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one roll number.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setLoading(true);
      await addRollNumbers(studentDialogSessionId, studentDialogSectionId, raw);
      await refreshSessions();
      toast({
        title: 'Roll Numbers Added',
        description: `${raw.length} roll numbers were added to the section.`,
      });
      setIsStudentDialogOpen(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add roll numbers.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPdf = async () => {
    if (!studentDialogSessionId || !studentDialogSectionId || !pdfFile) {
      toast({
        title: 'Validation Error',
        description: 'Please select a PDF file to upload.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setLoading(true);
      await uploadPDF(studentDialogSessionId, studentDialogSectionId, pdfFile);
      await refreshSessions();
      toast({
        title: 'PDF Processed',
        description: 'Roll numbers were extracted from the PDF and added.',
      });
      setIsStudentDialogOpen(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to upload or parse PDF.',
        variant: 'destructive',
      });
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
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="w-4 h-4" />
              {editingSessionId ? 'Edit Session' : 'Add Session'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSessionId ? 'Edit Session' : 'Add New Session'}</DialogTitle>
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
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveSession}>
                {editingSessionId ? 'Save Changes' : 'Add Session'}
              </Button>
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
                  <div className="flex items-center gap-4">
                    <div className="text-right mr-2">
                      <p className="text-sm font-medium text-foreground">{session.sections.length} sections</p>
                      <p className="text-sm text-muted-foreground">{session.totalStudents} students</p>
                    </div>
                    <SessionBadge colorIndex={session.colorIndex} variant="solid">
                      Active
                    </SessionBadge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(session);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{section.strength} students</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => openStudentDialog(session.id, section.id)}
                            >
                              Add Students
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteSection(session.id, section.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Student (Roll Numbers) Dialog */}
      <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Students to Section</DialogTitle>
            <DialogDescription>
              Choose how you want to add roll numbers for this section.
            </DialogDescription>
          </DialogHeader>
          <Tabs value={studentDialogTab} onValueChange={(v) => setStudentDialogTab(v as 'manual' | 'pdf')}>
            <TabsList className="mb-4">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="space-y-3">
              <Label htmlFor="rollnos">Roll Numbers</Label>
              <Textarea
                id="rollnos"
                placeholder="Enter roll numbers separated by commas, spaces, or new lines"
                value={rollNumbersText}
                onChange={(e) => setRollNumbersText(e.target.value)}
                className="min-h-[120px]"
              />
            </TabsContent>
            <TabsContent value="pdf" className="space-y-3">
              <Label htmlFor="pdf">Upload PDF</Label>
              <Input
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPdfFile(file);
                }}
              />
              <p className="text-xs text-muted-foreground">
                The system will extract roll numbers automatically from the PDF using pattern matching.
              </p>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStudentDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            {studentDialogTab === 'manual' ? (
              <Button onClick={handleSaveManualRollNumbers}>Save Roll Numbers</Button>
            ) : (
              <Button onClick={handleUploadPdf}>Upload PDF</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sessions;
