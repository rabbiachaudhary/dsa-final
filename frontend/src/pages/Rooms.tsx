
import { useState, useEffect } from 'react';
import { Plus, DoorOpen, Grid3X3, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
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
import { getRooms, createRoom, updateRoom, deleteRoom } from '@/lib/api';
import { Room } from '@/types/exam';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


const Rooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    rows: 4,
    columns: 6,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRooms()
      .then(res => setRooms(res.data.map((r: any) => ({ ...r, capacity: r.rows * r.columns, id: r._id }))))
      .catch(() => toast({ title: 'Error', description: 'Failed to load rooms', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setNewRoom({ name: '', rows: 4, columns: 6 });
    setEditingRoomId(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setNewRoom({ name: room.name, rows: room.rows, columns: room.columns });
    setEditingRoomId(room.id);
    setIsDialogOpen(true);
  };

  const handleSaveRoom = async () => {
    if (!newRoom.name || newRoom.rows <= 0 || newRoom.columns <= 0) {
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
        name: newRoom.name,
        rows: newRoom.rows,
        columns: newRoom.columns,
      };

      if (editingRoomId) {
        const res = await updateRoom(editingRoomId, payload);
        setRooms(prev =>
          prev.map(room =>
            room.id === editingRoomId
              ? { ...res.data, capacity: res.data.rows * res.data.columns, id: res.data._id }
              : room
          )
        );
        toast({
          title: "Room Updated",
          description: `${res.data.name} has been updated successfully.`
        });
      } else {
        const res = await createRoom(payload);
        setRooms(prev => [...prev, { ...res.data, capacity: res.data.rows * res.data.columns, id: res.data._id }]);
        toast({
          title: "Room Added",
          description: `${res.data.name} has been added successfully.`
        });
      }

      resetForm();
      setIsDialogOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save room', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      setLoading(true);
      await deleteRoom(id);
      setRooms(prev => prev.filter(room => room.id !== id));
      toast({
        title: "Room Deleted",
        description: "The room has been removed successfully."
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete room', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Mini seat preview component
  const SeatPreview = ({ rows, columns, maxDisplay = 8 }: { rows: number; columns: number; maxDisplay?: number }) => {
    const displayRows = Math.min(rows, maxDisplay);
    const displayCols = Math.min(columns, maxDisplay);
    const showTruncated = rows > maxDisplay || columns > maxDisplay;
    
    return (
      <div className="space-y-1">
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: displayRows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-0.5">
              {Array.from({ length: displayCols }).map((_, colIndex) => (
                <div 
                  key={colIndex}
                  className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/30"
                />
              ))}
              {columns > maxDisplay && (
                <div className="w-3 h-3 flex items-center justify-center text-[8px] text-muted-foreground">…</div>
              )}
            </div>
          ))}
          {rows > maxDisplay && (
            <div className="flex gap-0.5">
              {Array.from({ length: Math.min(3, displayCols) }).map((_, i) => (
                <div key={i} className="w-3 h-3 flex items-center justify-center text-[8px] text-muted-foreground">⋮</div>
              ))}
            </div>
          )}
        </div>
        {showTruncated && (
          <p className="text-[10px] text-muted-foreground text-center">Preview truncated</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <PageHeader 
        title="Rooms Management" 
        description="Configure exam rooms and their seating layouts."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="w-4 h-4" />
              {editingRoomId ? 'Edit Room' : 'Add Room'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRoomId ? 'Edit Room' : 'Add New Room'}</DialogTitle>
              <DialogDescription>
                Define the room layout by specifying rows and columns.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  placeholder="e.g., Hall A"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows</Label>
                  <Input
                    id="rows"
                    type="number"
                    min={1}
                    max={20}
                    value={newRoom.rows}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, rows: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="columns">Columns</Label>
                  <Input
                    id="columns"
                    type="number"
                    min={1}
                    max={20}
                    value={newRoom.columns}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, columns: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Calculated Capacity</span>
                  <span className="text-2xl font-bold text-primary">{newRoom.rows * newRoom.columns}</span>
                </div>
                {newRoom.rows > 0 && newRoom.columns > 0 && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs text-muted-foreground">Seat Preview</p>
                    <SeatPreview rows={newRoom.rows} columns={newRoom.columns} />
                  </div>
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
              <Button onClick={handleSaveRoom}>
                {editingRoomId ? 'Save Changes' : 'Add Room'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div 
            key={room.id}
            className="bg-card rounded-lg border border-border/50 shadow-card p-5 hover:shadow-card-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <DoorOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                  <Grid3X3 className="w-3 h-3" />
                  {room.rows} × {room.columns}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => openEditDialog(room)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteRoom(room.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <h3 className="font-semibold text-lg text-foreground mb-1">{room.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{room.capacity} seats</p>
            
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Layout Preview</p>
              <div className="flex justify-center">
                <SeatPreview rows={room.rows} columns={room.columns} maxDisplay={6} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-card rounded-lg border border-border/50 shadow-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Total Capacity</h3>
            <p className="text-sm text-muted-foreground">{rooms.length} rooms configured</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{rooms.reduce((sum, r) => sum + r.capacity, 0)}</p>
            <p className="text-sm text-muted-foreground">seats available</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;
