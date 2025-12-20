const Session = require('../models/Session');
const Room = require('../models/Room');

// Helper: Calculate total capacity for a user
async function getTotalCapacity(userId) {
  const rooms = await Room.find({ user: userId });
  return rooms.reduce((sum, room) => sum + room.rows * room.columns, 0);
}

// Helper: Get total students for sessions (only user's sessions)
async function getTotalStudents(sessionIds, userId) {
  const sessions = await Session.find({ _id: { $in: sessionIds }, user: userId });
  return sessions.reduce((sum, session) => sum + session.sections.reduce((s, sec) => s + (sec.studentCount || 0), 0), 0);
}

// Check if sessions fit in rooms (only user's data)
async function canAccommodate(sessionIds, userId) {
  const totalCapacity = await getTotalCapacity(userId);
  const totalStudents = await getTotalStudents(sessionIds, userId);
  return { canFit: totalStudents <= totalCapacity, totalCapacity, totalStudents };
}

module.exports = { getTotalCapacity, getTotalStudents, canAccommodate };
