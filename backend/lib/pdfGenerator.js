const PDFDocument = require('pdfkit');
const Session = require('../models/Session');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');

/**
 * Extract session year and department from session name
 */
function parseSessionInfo(sessionName) {
  if (!sessionName) {
    return {
      year: new Date().getFullYear().toString(),
      dept: 'GEN'
    };
  }
  
  const yearMatch = sessionName.match(/\b(20\d{2})\b/);
  const deptMatch = sessionName.match(/\b([A-Z]{2,3})\b/i);
  
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  const dept = deptMatch ? deptMatch[1].toUpperCase() : 'GEN';
  
  return { year, dept };
}

/**
 * Generate PDF for seating plan with registration numbers
 */
async function generateSeatingPlanPDF(plan, userId) {
  return new Promise(async (resolve, reject) => {
    try {
      // Defensive: check plan object
      if (!plan || !plan.timeSlot || !plan.arrangement) {
        return reject(new Error('Invalid or incomplete plan data.'));
      }
      // Fetch related data
      const timeSlot = await TimeSlot.findOne({ _id: plan.timeSlot, user: userId }).populate('sessions');
      if (!timeSlot) {
        return reject(new Error('TimeSlot not found for this plan.'));
      }

      const sessions = await Session.find({ _id: { $in: timeSlot.sessions }, user: userId });
      if (!sessions || sessions.length === 0) {
        return reject(new Error('No sessions found for this time slot.'));
      }
      console.log('PDF Generator - Sessions found:', sessions.map(s => ({ id: s._id, name: s.name })));

      // Create session map
      const sessionMap = new Map();
      sessions.forEach(session => {
        const sessionInfo = parseSessionInfo(session.name || '');
        const year = session.year ? String(session.year) : sessionInfo.year;
        sessionMap.set(String(session._id), {
          name: session.name,
          year: year
        });
      });
      console.log('PDF Generator - Session map:', Array.from(sessionMap.entries()).map(([id, data]) => ({ id, name: data.name, year: data.year })));

      // Create PDF document
      const doc = new PDFDocument({ 
        margin: 30, 
        size: 'A4',
        layout: 'landscape'
      });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Extract seating plans
      const seatingPlans = plan.arrangement?.rooms || [];
      console.log('PDF Generator - Seating plans count:', seatingPlans.length);

      if (!Array.isArray(seatingPlans) || seatingPlans.length === 0) {
        // Instead of throwing, generate a minimal PDF with a message
        doc.fontSize(18).text('No seating plans found in arrangement.', 100, 100);
        doc.end();
        return;
      }

      // Fetch room details
      const roomIds = seatingPlans.map(p => p.roomId);
      const rooms = await Room.find({ _id: { $in: roomIds }, user: userId });
      const roomMap = new Map(rooms.map(r => [String(r._id), r]));
      
      console.log('PDF Generator - Rooms found:', rooms.length);

      // Constants
      const ROWS_PER_PAGE = 5;
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      
      // ═══════════════════════════════════════════
      // HEADER DRAWING FUNCTION - PROPER SPACING & CENTERING
      // ═══════════════════════════════════════════
      const drawFullHeader = () => {
        const startY = 30;
        let currentY = startY;
        // 1. Title - EXAM SEATING PLAN (CENTERED)
        doc.fontSize(22).font('Helvetica-Bold').fillColor('black');
        doc.text('EXAM SEATING PLAN', 0, currentY, { 
          align: 'center',
          width: pageWidth
        });
        currentY += 80; // Even more spacing after heading

        // 2. Time slot (CENTERED)
        doc.fontSize(12).font('Helvetica');
        doc.text(`Time Slot: ${timeSlot.time}`, 0, currentY, {
          align: 'center',
          width: pageWidth
        });
        currentY += 22;

        // 3. Sessions (CENTERED)
        doc.fontSize(12);
        doc.text(`Sessions: ${sessions.map(s => s.name).join(', ')}`, 0, currentY, {
          align: 'center',
          width: pageWidth
        });
        currentY += 22;

        // 4. Registration format (CENTERED)
        const firstSessionName = sessions[0]?.name.toUpperCase().replace(/\s+/g, '') || 'SESSION';
        const exampleFormat = `${firstSessionName}-001`;
        doc.fontSize(10).fillColor('gray');
        doc.text(`Registration Format: [SESSION]-[ROLLNO] (e.g., ${exampleFormat})`, 0, currentY, {
          align: 'center',
          width: pageWidth
        });
        doc.fillColor('black');
        currentY += 40; // Extra spacing before separator and room name

        // 5. Separator line (CENTERED)
        doc.strokeColor('#c8c8c8').lineWidth(0.5);
        doc.moveTo(40, currentY).lineTo(pageWidth - 40, currentY).stroke();
        doc.strokeColor('black');
        currentY += 30; // Spacing after separator

        // Return the Y position after header (where room name should be drawn)
        return currentY;
      };
      
      // ═══════════════════════════════════════════
      // ROOM NAME FUNCTION (CENTERED)
      // ═══════════════════════════════════════════
      const drawRoomName = (roomName, isContinuation = false) => {
        // Room name should appear just after the header (not above)
        // startY will be passed as the Y position after header
        return (startY, isContinuation = false) => {
          if (isContinuation) {
            doc.fontSize(14).fillColor('blue').font('Helvetica-Bold');
            doc.text(`Room: ${roomName} (continued)`, 0, startY, {
              align: 'center',
              width: pageWidth
            });
            doc.fillColor('black');
            return startY + 45;
          } else {
            doc.fontSize(18).fillColor('blue').font('Helvetica-Bold');
            doc.text(`Room: ${roomName}`, 0, startY, {
              align: 'center',
              width: pageWidth
            });
            doc.fillColor('black');
            return startY + 45;
          }
        };
      };

      // Process each room
      let isFirstPageOfPDF = true;
      
      for (let roomIdx = 0; roomIdx < seatingPlans.length; roomIdx++) {
        if (!isFirstPageOfPDF) {
          doc.addPage();
        }
        isFirstPageOfPDF = false;
        const seatingPlan = seatingPlans[roomIdx];
        const room = roomMap.get(seatingPlan.roomId);
        if (!room) {
          console.warn(`Room not found for ID: ${seatingPlan.roomId}`);
          continue;
        }
        // Draw header and room name
        const headerEndY = drawFullHeader();
        // Draw room name just below header
        const roomNameEndY = ((startY, isContinuation = false) => {
          doc.fontSize(isContinuation ? 14 : 18).fillColor('blue').font('Helvetica-Bold');
          doc.text(`Room: ${room.name}${isContinuation ? ' (continued)' : ''}`, 0, headerEndY, {
            align: 'center',
            width: pageWidth
          });
          doc.fillColor('black');
          return headerEndY + 45;
        })(headerEndY, false);
        const gridStartY = roomNameEndY + 20;

        // Table/grid layout
        const margin = 30;
        const availableWidth = pageWidth - (margin * 2);
        const availableHeight = pageHeight - gridStartY - 60;
        const rowLabelWidth = 35;
        const colLabelHeight = 25;
        const gapSize = 4;
        // Calculate cell size so all data fits
        const cellWidth = Math.floor((availableWidth - rowLabelWidth - (room.columns - 1) * gapSize) / room.columns);
        const cellHeight = Math.floor((availableHeight - colLabelHeight - (room.rows - 1) * gapSize) / room.rows);
        const gridWidth = room.columns * cellWidth + (room.columns - 1) * gapSize;
        const gridHeight = room.rows * cellHeight + (room.rows - 1) * gapSize;
        const startX = (pageWidth - gridWidth - rowLabelWidth) / 2 + rowLabelWidth;
        const startY = gridStartY;

        // Create seat map
        const seats = seatingPlan.seats || [];
        // Ensure seatMap[row][col] structure
        const seatMap = Array.from({ length: room.rows }, (_, r) => Array.from({ length: room.columns }, (_, c) => null));
        for (let rowIdx = 0; rowIdx < seats.length; rowIdx++) {
          const row = seats[rowIdx];
          for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const seat = row[colIdx];
            if (seat && seat.row < room.rows && seat.col < room.columns) {
              seatMap[seat.row][seat.col] = seat;
            }
          }
        }

        // Draw table grid: rows horizontally, columns vertically
        for (let rowIdx = 0; rowIdx < room.rows; rowIdx++) {
          for (let colIdx = 0; colIdx < room.columns; colIdx++) {
            const seat = seatMap[rowIdx][colIdx];
            const x = startX + colIdx * (cellWidth + gapSize);
            const y = startY + rowIdx * (cellHeight + gapSize);
            // Always show only the roll number (studentId) in the PDF cell, matching the preview
            const boxText = seat && !seat.isEmpty
              ? (seat.studentId || '')
              : '';
            // Draw cell border
            doc.lineWidth(1).strokeColor('#cccccc').rect(x, y, cellWidth, cellHeight).stroke();
            if (boxText) {
              doc.fontSize(11).font('Helvetica-Bold').fillColor('#428bca');
              doc.text(boxText, x, y + cellHeight / 2 - 7, {
                align: 'center',
                width: cellWidth
              });
              doc.fillColor('black');
            }
          }
        }
        // Row labels (left)
        doc.fontSize(10).fillColor('black').font('Helvetica-Bold');
        for (let rowIdx = 0; rowIdx < room.rows; rowIdx++) {
          const y = startY + rowIdx * (cellHeight + gapSize) + cellHeight / 2 - 5;
          doc.text(String(rowIdx + 1), startX - rowLabelWidth + 5, y, {
            align: 'right',
            width: rowLabelWidth - 10
          });
        }
        // Column labels (top)
        doc.fontSize(10).font('Helvetica-Bold');
        for (let colIdx = 0; colIdx < room.columns; colIdx++) {
          const x = startX + colIdx * (cellWidth + gapSize) + cellWidth / 2;
          const y = startY - colLabelHeight;
          doc.text(String(colIdx + 1), x - cellWidth / 2, y, {
            align: 'center',
            width: cellWidth
          });
        }
        doc.font('Helvetica');
      }
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateSeatingPlanPDF,
  parseSessionInfo,
};