import { Session, TimeSlot, Room, SeatingConstraints, Student } from '@/types/exam';

export const mockSessions: Session[] = [
  {
    id: 'session-1',
    year: '2024',
    name: 'Fall 2024',
    sections: [
      { id: 'sec-1a', name: 'Section A', strength: 45 },
      { id: 'sec-1b', name: 'Section B', strength: 42 },
      { id: 'sec-1c', name: 'Section C', strength: 40 },
    ],
    totalStudents: 127,
    colorIndex: 1,
  },
  {
    id: 'session-2',
    year: '2024',
    name: 'Spring 2024',
    sections: [
      { id: 'sec-2a', name: 'Section A', strength: 50 },
      { id: 'sec-2b', name: 'Section B', strength: 48 },
    ],
    totalStudents: 98,
    colorIndex: 2,
  },
  {
    id: 'session-3',
    year: '2023',
    name: 'Fall 2023',
    sections: [
      { id: 'sec-3a', name: 'Section A', strength: 38 },
      { id: 'sec-3b', name: 'Section B', strength: 35 },
      { id: 'sec-3c', name: 'Section C', strength: 37 },
    ],
    totalStudents: 110,
    colorIndex: 3,
  },
  {
    id: 'session-4',
    year: '2023',
    name: 'Spring 2023',
    sections: [
      { id: 'sec-4a', name: 'Section A', strength: 55 },
    ],
    totalStudents: 55,
    colorIndex: 4,
  },
];

export const mockTimeSlots: TimeSlot[] = [
  {
    id: 'slot-1',
    name: 'Morning Exam - Day 1',
    date: '2024-12-15',
    startTime: '09:00',
    endTime: '12:00',
    sessionIds: ['session-1', 'session-2'],
  },
  {
    id: 'slot-2',
    name: 'Afternoon Exam - Day 1',
    date: '2024-12-15',
    startTime: '14:00',
    endTime: '17:00',
    sessionIds: ['session-3', 'session-4'],
  },
  {
    id: 'slot-3',
    name: 'Morning Exam - Day 2',
    date: '2024-12-16',
    startTime: '09:00',
    endTime: '12:00',
    sessionIds: ['session-1', 'session-3'],
  },
];

export const mockRooms: Room[] = [
  { id: 'room-1', name: 'Hall A', rows: 6, columns: 8, capacity: 48 },
  { id: 'room-2', name: 'Hall B', rows: 5, columns: 10, capacity: 50 },
  { id: 'room-3', name: 'Room 101', rows: 4, columns: 6, capacity: 24 },
  { id: 'room-4', name: 'Room 102', rows: 4, columns: 6, capacity: 24 },
  { id: 'room-5', name: 'Auditorium', rows: 10, columns: 15, capacity: 150 },
];

export const defaultConstraints: SeatingConstraints = {
  alternateSessionsEnabled: true,
  noAdjacentSameSession: true,
  fillOrder: 'row-wise',
  randomShuffle: false,
};

export const generateMockStudents = (sessions: Session[]): Student[] => {
  const students: Student[] = [];
  
  sessions.forEach(session => {
    session.sections.forEach(section => {
      for (let i = 1; i <= section.strength; i++) {
        students.push({
          id: `${section.id}-${i}`,
          sessionId: session.id,
          sectionId: section.id,
          rollNumber: `${session.year.slice(-2)}${section.name.slice(-1)}${i.toString().padStart(3, '0')}`,
        });
      }
    });
  });
  
  return students;
};

export const sessionColors: Record<number, string> = {
  1: 'session-1',
  2: 'session-2',
  3: 'session-3',
  4: 'session-4',
  5: 'session-5',
  6: 'session-6',
  7: 'session-7',
  8: 'session-8',
};

export const sessionColorNames: Record<number, string> = {
  1: 'Blue',
  2: 'Green',
  3: 'Purple',
  4: 'Orange',
  5: 'Pink',
  6: 'Teal',
  7: 'Yellow',
  8: 'Red',
};
