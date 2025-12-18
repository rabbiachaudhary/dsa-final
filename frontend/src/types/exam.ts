export interface Section {
  id: string;
  name: string;
  strength: number;
}

export interface Session {
  id: string;
  year: string;
  name: string;
  sections: Section[];
  totalStudents: number;
  colorIndex: number;
}

export interface TimeSlot {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionIds: string[];
}

export interface Room {
  id: string;
  name: string;
  rows: number;
  columns: number;
  capacity: number;
}

export interface SeatingConstraints {
  alternateSessionsEnabled: boolean;
  noAdjacentSameSession: boolean;
  fillOrder: 'row-wise' | 'column-wise';
  randomShuffle: boolean;
}

export interface Seat {
  row: number;
  col: number;
  sessionId: string | null;
  sectionId: string | null;
  studentId: string | null;
  isEmpty: boolean;
}

export interface SeatingPlan {
  id: string;
  timeSlotId: string;
  roomId: string;
  seats: Seat[][];
  generatedAt: string;
}

export interface Student {
  id: string;
  sessionId: string;
  sectionId: string;
  rollNumber: string;
}
