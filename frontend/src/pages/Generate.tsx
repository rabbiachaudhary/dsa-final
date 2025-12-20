
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
import { getSessions, getTimeSlots, getRooms, generatePlans } from '@/lib/api';
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
        // Map backend timeslots into frontend shape
        const mappedSlots: TimeSlot[] = tRes.data.map((slot: any) => {
          const time: string = slot.time || '';
          const [datePart, timeRange] = time.split(' ');
          const [startTime, endTime] = (timeRange || '').split('-');
          const sessionIds: string[] = (slot.sessions || []).map((s: any) =>
            typeof s === 'string' ? s : s._id
          );
          return {
            id: slot._id,
            name: slot.name || time,
            date: datePart || '',
            startTime: startTime || '',
            endTime: endTime || '',
            sessionIds,
          };
        });
        setTimeSlots(mappedSlots);
        setRooms(rRes.data.map((r: any) => ({ ...r, capacity: r.rows * r.columns, id: r._id })));
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' }));
  }, []);

  const selectedSlot = timeSlots.find(s => s.id === selectedTimeSlot);
  const slotSessions = selectedSlot 
    ? sessions.filter(s => selectedSlot.sessionIds.includes((s as any)._id || s.id))
    : [];


  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };


  const generateSeatingPlan = async () => {
    if (!selectedTimeSlot || selectedRooms.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select a time slot and at least one room.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsGenerating(true);
      const res = await generatePlans({
        timeSlotId: selectedTimeSlot,
        roomIds: selectedRooms,
      });
      const plans: SeatingPlan[] = res.data.plans;
      setGeneratedPlans(plans);
      toast({
        title: "Seating Plan Generated",
        description: `Generated seating for ${plans.length} room(s).`
      });
    } catch (err: any) {
      const message = err?.response?.data?.msg || "Failed to generate seating plan";
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getSessionColor = (sessionId: string | null) => {
    if (!sessionId) return null;
    const session = sessions.find(s => ((s as any)._id || s.id) === sessionId);
    return (session as any)?.colorIndex || 1;
  };

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

  const handleExportCsv = () => {
    if (generatedPlans.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'Generate a seating plan before exporting.',
        variant: 'destructive',
      });
      return;
    }

    const header = ['Room', 'Row', 'Column', 'Session', 'Section', 'RollNo'];
    const rows: string[] = [header.join(',')];

    generatedPlans.forEach(plan => {
      const room = rooms.find(r => r.id === plan.roomId);
      const roomName = room?.name || plan.roomId;
      plan.seats.forEach(row => {
        row.forEach(seat => {
          const session = sessions.find(s => ((s as any)._id || s.id) === seat.sessionId);
          const section = session?.sections.find(sec => sec.id === seat.sectionId);
          rows.push([
            `"${roomName}"`,
            seat.row + 1,
            seat.col + 1,
            `"${session?.name || ''}"`,
            `"${section?.name || ''}"`,
            `"${seat.studentId || ''}"`,
          ].join(','));
        });
      });
    });

    downloadFile(rows.join('\n'), 'seating-plan.csv', 'text/csv;charset=utf-8;');
    toast({
      title: 'Exported',
      description: 'Seating plan exported as CSV (Excel compatible).',
    });
  };

  const handlePrintOrPdf = () => {
    if (generatedPlans.length === 0) {
      toast({
        title: 'Nothing to print',
        description: 'Generate a seating plan before printing or exporting to PDF.',
        variant: 'destructive',
      });
      return;
    }
    // Browser print dialog allows "Save as PDF" in most environments
    window.print();
  };

  const handleDownloadPdf = async () => {

    // Debug logs to diagnose blank PDF issue
    console.log('generatedPlans:', generatedPlans);
    console.log('rooms:', rooms);
    console.log('sessions:', sessions);

    if (generatedPlans.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'Generate a seating plan before exporting to PDF.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create a printable container
      const printContainer = document.createElement('div');
      printContainer.style.padding = '0';
      printContainer.style.backgroundColor = 'white';
      printContainer.style.color = 'black';
      printContainer.style.width = '210mm'; // A4 width
      printContainer.style.minHeight = '297mm'; // A4 height

      generatedPlans.forEach((plan, planIndex) => {
        const room = rooms.find(r => r.id === plan.roomId);
        
        // Create a page wrapper for each room
        const pageWrapper = document.createElement('div');
        pageWrapper.style.width = '794px'; // A4 width in pixels (210mm at 96 DPI)
        pageWrapper.style.minHeight = '1123px'; // A4 height - minimum one page
        pageWrapper.style.padding = '40px';
        pageWrapper.style.marginBottom = '0';
        // Force page breaks
        if (planIndex > 0) {
          pageWrapper.style.pageBreakBefore = 'always';
          pageWrapper.style.breakBefore = 'page';
        }
        if (planIndex < generatedPlans.length - 1) {
          pageWrapper.style.pageBreakAfter = 'always';
          pageWrapper.style.breakAfter = 'page';
        }
        pageWrapper.style.pageBreakInside = 'avoid';
        pageWrapper.style.breakInside = 'avoid';
        pageWrapper.style.display = 'block';
        pageWrapper.style.boxSizing = 'border-box';
        
        const roomDiv = document.createElement('div');
        roomDiv.style.width = '100%';
        roomDiv.style.height = 'auto';
        roomDiv.style.maxHeight = '100%';
        roomDiv.style.overflow = 'auto';

        // Room header
        const header = document.createElement('div');
        header.style.marginBottom = '20px';
        header.style.borderBottom = '2px solid #000';
        header.style.paddingBottom = '10px';
        const roomName = document.createElement('h2');
        roomName.textContent = `Room: ${room?.name || plan.roomId}`;
        roomName.style.fontSize = '24px';
        roomName.style.fontWeight = 'bold';
        roomName.style.margin = '0 0 5px 0';
        const roomInfo = document.createElement('p');
        roomInfo.textContent = `${room?.rows || 0} × ${room?.columns || 0} = ${room?.capacity || 0} seats`;
        roomInfo.style.margin = '0';
        roomInfo.style.color = '#666';
        header.appendChild(roomName);
        header.appendChild(roomInfo);

        // Board indicator
        const boardDiv = document.createElement('div');
        boardDiv.textContent = 'BOARD / FRONT';
        boardDiv.style.textAlign = 'center';
        boardDiv.style.padding = '10px';
        boardDiv.style.backgroundColor = '#f0f0f0';
        boardDiv.style.marginBottom = '20px';
        boardDiv.style.fontWeight = 'bold';

        // Create table for seats
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '0';
        table.style.fontSize = '10px'; // Smaller font to fit more

        // Column headers
        const headerRow = document.createElement('tr');
        const emptyHeader = document.createElement('th');
        emptyHeader.style.border = '1px solid #ddd';
        emptyHeader.style.padding = '8px';
        emptyHeader.style.width = '40px';
        headerRow.appendChild(emptyHeader);
        for (let c = 0; c < (room?.columns || 0); c++) {
          const th = document.createElement('th');
          th.textContent = String(c + 1);
          th.style.border = '1px solid #ddd';
          th.style.padding = '8px';
          th.style.textAlign = 'center';
          th.style.backgroundColor = '#f5f5f5';
          headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Seat rows
        plan.seats.forEach((row, rowIndex) => {
          const tr = document.createElement('tr');
          const rowLabel = document.createElement('td');
          rowLabel.textContent = String(rowIndex + 1);
          rowLabel.style.border = '1px solid #ddd';
          rowLabel.style.padding = '8px';
          rowLabel.style.textAlign = 'center';
          rowLabel.style.fontWeight = 'bold';
          rowLabel.style.backgroundColor = '#f5f5f5';
          tr.appendChild(rowLabel);

          row.forEach((seat) => {
            const td = document.createElement('td');
            td.textContent = seat.studentId || '';
            td.style.border = '1px solid #ddd';
            td.style.padding = '8px';
            td.style.textAlign = 'center';
            td.style.minWidth = '60px';
            td.style.height = '40px';
            if (seat.sessionId) {
              const session = sessions.find(s => ((s as any)._id || s.id) === seat.sessionId);
              const colorIndex = (session as any)?.colorIndex || 1;
              // Light background color for session
              const colors: { [key: number]: string } = {
                1: '#e3f2fd',
                2: '#e8f5e9',
                3: '#f3e5f5',
                4: '#fff3e0',
                5: '#fce4ec',
                6: '#e0f2f1',
                7: '#fff9c4',
                8: '#ffebee',
              };
              td.style.backgroundColor = colors[colorIndex] || '#fff';
            }
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });

        roomDiv.appendChild(header);
        roomDiv.appendChild(boardDiv);
        roomDiv.appendChild(table);
        
        pageWrapper.appendChild(roomDiv);
        printContainer.appendChild(pageWrapper);
        
        // Add explicit page break element after each room (except last)
        if (planIndex < generatedPlans.length - 1) {
          const pageBreak = document.createElement('div');
          pageBreak.style.pageBreakAfter = 'always';
          pageBreak.style.breakAfter = 'page';
          pageBreak.style.height = '0';
          pageBreak.style.width = '100%';
          pageBreak.style.clear = 'both';
          printContainer.appendChild(pageBreak);
        }
      });

      // Generate PDF with proper page break handling
      // Append to body temporarily for proper rendering
      printContainer.style.position = 'absolute';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      document.body.appendChild(printContainer);
      
      const opt = {
        margin: 0,
        filename: `seating-plan-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 1,
          useCORS: true,
          logging: false,
          windowWidth: 794, // A4 width in pixels at 96 DPI
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
        },
      };
      
      await html2pdf().set(opt).from(printContainer).save();
      
      // Clean up
      document.body.removeChild(printContainer);

      toast({
        title: 'PDF Downloaded',
        description: 'Seating plan PDF has been downloaded successfully.',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try printing instead.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader 
        title="Generate Seating Plan" 
        description="Select options and generate optimized seating arrangements."
        className="no-print"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4 no-print">
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
              <div className="bg-card rounded-lg border border-border/50 shadow-card p-4 no-print">
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
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPdf}>
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCsv}>
                      <Download className="w-4 h-4" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrintOrPdf}>
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
                  <div
                    key={plan.id}
                    className="bg-card rounded-lg border border-border/50 shadow-card overflow-hidden print-page-break"
                  >
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
                                const session = sessions.find(s => ((s as any)._id || s.id) === seat.sessionId);
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
                                        {seat.studentId || ''}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1 text-xs">
                                        <p><strong>Session:</strong> {session?.name}</p>
                                        <p><strong>Section:</strong> {section?.name}</p>
                                        <p><strong>Roll No:</strong> {seat.studentId}</p>
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
