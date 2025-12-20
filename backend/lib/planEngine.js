const TimeSlot = require('../models/TimeSlot');
const Session = require('../models/Session');
const Room = require('../models/Room');
const Constraint = require('../models/Constraint');
const { Queue, PriorityQueue, SeatGrid } = require('./dsa');

// Helper type creator for student tokens
function createStudentToken(sessionId, sectionId, rollNo) {
  return { sessionId, sectionId, rollNo };
}

// Build queues of students per session and a max-heap over sessions by remaining students
async function buildSessionPool(sessionIds, constraints) {
  const sessions = await Session.find({ _id: { $in: sessionIds } });

  // Each entry: { sessionId, totalRemaining, queues: [{ sectionId, queue }] }
  const entries = [];
  let globalTotal = 0;

  for (const s of sessions) {
    let total = 0;
    const queues = [];

    for (const sec of s.sections || []) {
      const q = new Queue();

      let rollNumbers = Array.isArray(sec.rollNumbers) ? sec.rollNumbers.slice() : [];
      if (rollNumbers.length === 0 && sec.studentCount && sec.studentCount > 0) {
        // Generate synthetic roll numbers if not provided
        for (let i = 1; i <= sec.studentCount; i++) {
          rollNumbers.push(`${sec.name}-${i}`);
        }
      }

      // If random roll number order is enabled, shuffle them (Fisher-Yates)
      if (constraints.rollNoOrder === 'random' || constraints.randomShuffle) {
        for (let i = rollNumbers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = rollNumbers[i];
          rollNumbers[i] = rollNumbers[j];
          rollNumbers[j] = tmp;
        }
      }

      for (const rn of rollNumbers) {
        q.enqueue(createStudentToken(String(s._id), String(sec._id), rn));
      }

      const size = q.size();
      if (size > 0) {
        queues.push({ sectionId: String(sec._id), queue: q });
        total += size;
      }
    }

    if (total > 0) {
      entries.push({
        sessionId: String(s._id),
        totalRemaining: total,
        queues,
      });
      globalTotal += total;
    }
  }

  // Max-heap by totalRemaining
  const heap = new PriorityQueue((a, b) => a.totalRemaining - b.totalRemaining);
  for (const e of entries) {
    heap.push(e);
  }

  return {
    heap,
    totalStudents: globalTotal,
    isEmpty() {
      return this.heap.isEmpty();
    },
    /**
     * Take the next student, trying to avoid sessions in avoidSet (adjacent seats).
     * Returns { token, sessionId } or null if nothing left.
     */
    takeNext(avoidSet) {
      if (this.heap.isEmpty()) return null;

      const skipped = [];
      let chosen = null;

      while (!this.heap.isEmpty()) {
        const top = this.heap.pop();
        if (!avoidSet.has(top.sessionId) || this.heap.isEmpty()) {
          chosen = top;
          break;
        }
        skipped.push(top);
      }

      // Push back skipped entries
      for (const e of skipped) {
        this.heap.push(e);
      }

      if (!chosen) return null;

      // Round-robin over that session's section queues
      let token = null;
      for (let i = 0; i < chosen.queues.length; i++) {
        const pair = chosen.queues[i];
        if (!pair.queue.isEmpty()) {
          token = pair.queue.dequeue();
          break;
        }
      }

      if (!token) {
        // No more students in this session
        return this.takeNext(avoidSet);
      }

      chosen.totalRemaining -= 1;
      if (chosen.totalRemaining > 0) {
        this.heap.push(chosen);
      }

      return { token, sessionId: chosen.sessionId };
    },
  };
}

// Fetch global constraints (if any) for a specific user
async function getConstraints(userId) {
  const last = await Constraint.findOne({ user: userId }).sort({ createdAt: -1 });
  if (!last) {
    return {
      noAdjacentSameSession: true,
      fillOrder: 'row',
      rollNoOrder: 'sequential',
      alternateSessionsEnabled: false,
      randomShuffle: false,
    };
  }
  // Derive normalized constraint object
  const noAdjacentSameSession =
    typeof last.noAdjacentSameSession === 'boolean'
      ? last.noAdjacentSameSession
      : !last.allowAdjacentSameSession;

  return {
    noAdjacentSameSession,
    fillOrder: last.fillOrder === 'column' ? 'column' : 'row',
    rollNoOrder: last.rollNoOrder || 'sequential',
    alternateSessionsEnabled: !!last.alternateSessionsEnabled,
    randomShuffle: !!last.randomShuffle,
  };
}

/**
 * Generate seating plans for a given timeslot and set of rooms.
 * Returns an array shaped for the frontend SeatingPlan type:
 * [{ id, timeSlotId, roomId, seats: Seat[][], generatedAt }]
 */
async function generatePlansForTimeSlot(timeSlotId, roomIds, userId) {
    console.log('generatePlansForTimeSlot called with:', { timeSlotId, roomIds, userId });
  const timeSlot = await TimeSlot.findOne({ _id: timeSlotId, user: userId }).populate('sessions');
  if (!timeSlot) {
    throw new Error('TimeSlot not found');
  }

  const constraints = await getConstraints(userId);

  const sessionIds = (timeSlot.sessions || []).map((s) => String(s._id || s));
  if (sessionIds.length === 0) {
    throw new Error('TimeSlot has no sessions assigned');
  }

  const rooms = await Room.find({ _id: { $in: roomIds }, user: userId });
  if (!rooms || rooms.length === 0) {
    throw new Error('No rooms found for given IDs');
  }
  
  // Verify all sessions belong to the user
  const userSessions = await Session.find({ _id: { $in: sessionIds }, user: userId });
  if (userSessions.length !== sessionIds.length) {
    throw new Error('Some sessions do not belong to the user');
  }

  const pool = await buildSessionPool(sessionIds, constraints);
  const totalStudents = pool.totalStudents;
  const totalSeats = rooms.reduce((sum, room) => sum + room.rows * room.columns, 0);

  if (totalSeats < totalStudents) {
    throw new Error(`Not enough seats. Students: ${totalStudents}, Seats: ${totalSeats}`);
  }
  const plans = [];
  const generatedAt = new Date().toISOString();

  for (const room of rooms) {
    const grid = new SeatGrid(String(room._id), room.rows, room.columns);

    const iterate = constraints.fillOrder === 'column'
      ? function* byColumn(rows, cols) {
          for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
              yield [r, c];
            }
          }
        }
      : function* byRow(rows, cols) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              yield [r, c];
            }
          }
        };

    for (const [r, c] of iterate(grid.rows, grid.cols)) {
      const seat = grid.getSeat(r, c);
      const neighbors = grid.getNeighbors(seat);
      const neighborSessions = new Set(
        neighbors
          .map((n) => n.sessionId)
          .filter((id) => !!id)
      );

      const avoid = constraints.noAdjacentSameSession ? neighborSessions : new Set();
      const result = pool.takeNext(avoid) || pool.takeNext(new Set());
      if (!result) {
        // No more students – leave seat empty
        seat.isEmpty = true;
        continue;
      }

      const { token } = result;
      seat.sessionId = token.sessionId;
      seat.sectionId = token.sectionId;
      seat.studentId = token.rollNo;
      seat.isEmpty = false;
    }

    const seatsView = grid.seats.map((row) =>
      row.map((seat) => ({
        row: seat.row,
        col: seat.col,
        sessionId: seat.sessionId,
        sectionId: seat.sectionId,
        studentId: seat.studentId,
        isEmpty: seat.isEmpty,
      }))
    );

    plans.push({
      id: `plan-${room._id}-${Date.now()}`,
      timeSlotId: String(timeSlot._id),
      roomId: String(room._id),
      seats: seatsView,
      generatedAt,
    });
  }

  console.log('generatePlansForTimeSlot completed successfully');
  return plans;
}

module.exports = {
  generatePlansForTimeSlot,
};

