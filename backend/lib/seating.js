const Session = require('../models/Session');
const Room = require('../models/Room');

// Helper: Calculate total capacity
async function getTotalCapacity() {
  const rooms = await Room.find();
  return rooms.reduce((sum, room) => sum + room.rows * room.columns, 0);
}

// Helper: Get total students for sessions
async function getTotalStudents(sessionIds) {
  const sessions = await Session.find({ _id: { $in: sessionIds } });
  return sessions.reduce((sum, session) => sum + session.sections.reduce((s, sec) => s + (sec.studentCount || 0), 0), 0);
}

// Check if sessions fit in rooms
async function canAccommodate(sessionIds) {
  const totalCapacity = await getTotalCapacity();
  const totalStudents = await getTotalStudents(sessionIds);
  return { canFit: totalStudents <= totalCapacity, totalCapacity, totalStudents };
}

module.exports = { getTotalCapacity, getTotalStudents, canAccommodate };
