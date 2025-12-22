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
      // Fetch related data
      const timeSlot = await TimeSlot.findOne({ _id: plan.timeSlot, user: userId }).populate('sessions');
      if (!timeSlot) {
        throw new Error('TimeSlot not found');
      }

      const sessions = await Session.find({ _id: { $in: timeSlot.sessions }, user: userId });
      if (sessions.length === 0) {
        throw new Error('No sessions found');
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
      
      if (seatingPlans.length === 0) {
        throw new Error('No seating plans found in arrangement');
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
        currentY += 35; // Increased spacing
        
        // 2. Time slot (CENTERED)
        doc.fontSize(12).font('Helvetica');
        doc.text(`Time Slot: ${timeSlot.time}`, 0, currentY, {
          align: 'center',
          width: pageWidth
        });
        currentY += 20; // Increased spacing
        
        // 3. Sessions (CENTERED)
        doc.fontSize(12);
        doc.text(`Sessions: ${sessions.map(s => s.name).join(', ')}`, 0, currentY, {
          align: 'center',
          width: pageWidth
        });
        currentY += 20; // Increased spacing
        
        // 4. Registration format (CENTERED)
        const firstSessionName = sessions[0]?.name.toUpperCase().replace(/\s+/g, '') || 'SESSION';
        const exampleFormat = `${firstSessionName}-001`;
        doc.fontSize(10).fillColor('gray');
        doc.text(`Registration Format: [SESSION]-[ROLLNO] (e.g., ${exampleFormat})`, 0, currentY, {
          align: 'center',
          width: pageWidth
        });
        doc.fillColor('black');
        currentY += 30; // Extra spacing before separator
         const drawRoomName = (roomName, isContinuation = false) => {
        const startY = 30;
        
        if (isContinuation) {
          doc.fontSize(14).fillColor('blue').font('Helvetica-Bold');
          doc.text(`Room: ${roomName} (continued)`, 0, startY, {
            align: 'center',
            width: pageWidth
          });
          doc.fillColor('black');
          return startY + 40; // Return Y position after room name
        } else {
          doc.fontSize(18).fillColor('blue').font('Helvetica-Bold');
          doc.text(`Room: ${roomName}`, 0, startY, {
            align: 'center',
            width: pageWidth
          });
          doc.fillColor('black');
          return startY + 35; // Return Y position after room name
        }
      };
        // 5. Separator line (CENTERED)
        doc.strokeColor('#c8c8c8').lineWidth(0.5);
        doc.moveTo(40, currentY).lineTo(pageWidth - 40, currentY).stroke();
        doc.strokeColor('black');
        currentY += 25; // Spacing after separator
        
        // Return the Y position after header (where grid should start)
        return currentY;
      };
      
      // ═══════════════════════════════════════════
      // ROOM NAME FUNCTION (CENTERED)
      // ═══════════════════════════════════════════
      const drawRoomName = (roomName, isContinuation = false) => {
        const startY = 30;
        
        if (isContinuation) {
          doc.fontSize(14).fillColor('blue').font('Helvetica-Bold');
          doc.text(`Room: ${roomName} (continued)`, 0, startY, {
            align: 'center',
            width: pageWidth
          });
          doc.fillColor('black');
          return startY + 40; // Return Y position after room name
        } else {
          doc.fontSize(18).fillColor('blue').font('Helvetica-Bold');
          doc.text(`Room: ${roomName}`, 0, startY, {
            align: 'center',
            width: pageWidth
          });
          doc.fillColor('black');
          return startY + 35; // Return Y position after room name
        }
      };

      // Process each room
      let isFirstPageOfPDF = true;
      
      for (let roomIdx = 0; roomIdx < seatingPlans.length; roomIdx++) {
        const seatingPlan = seatingPlans[roomIdx];
        const room = roomMap.get(seatingPlan.roomId);
        
        if (!room) {
          console.warn(`Room not found for ID: ${seatingPlan.roomId}`);
          continue;
        }

        const totalPagesForRoom = Math.ceil(room.rows / ROWS_PER_PAGE);
        
        for (let pageNum = 0; pageNum < totalPagesForRoom; pageNum++) {
          if (!isFirstPageOfPDF) {
            doc.addPage();
          }
          isFirstPageOfPDF = false;
          
          // ═══════════════════════════════════════════
          // DRAW HEADER AND GET START POSITION
          // ═══════════════════════════════════════════
          let gridStartY;
          
          if (pageNum === 0) {
            // First page of room - full header + room name
            const headerEndY = drawFullHeader();
            const roomNameEndY = drawRoomName(room.name, false);
            gridStartY = Math.max(headerEndY, roomNameEndY) + 20; // 20pt buffer
          } else {
            // Continuation page - only room name
            gridStartY = drawRoomName(room.name, true) + 15; // 15pt buffer
          }

          // Get seating data
          const seats = seatingPlan.seats || [];
          if (seats.length === 0) {
            if (pageNum === 0) {
              doc.text('No seats assigned', pageWidth / 2, gridStartY, { align: 'center' });
            }
            break;
          }

          // Create seat map
          const seatMap = new Map();
          for (let rowIdx = 0; rowIdx < seats.length; rowIdx++) {
            const row = seats[rowIdx];
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              const seat = row[colIdx];
              const key = `${seat.row}-${seat.col}`;
              seatMap.set(key, seat);
            }
          }
          
          // Calculate rows for this page
          const rowStart = pageNum * ROWS_PER_PAGE;
          const rowEnd = Math.min((pageNum + 1) * ROWS_PER_PAGE - 1, room.rows - 1);
          const rowsOnThisPage = rowEnd - rowStart + 1;

          // ═══════════════════════════════════════════
          // GRID LAYOUT - USING AVAILABLE SPACE
          // ═══════════════════════════════════════════
          const margin = 30;
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - gridStartY - 60; // Space from gridStartY to bottom
          
          const rowLabelWidth = 35;
          const colLabelHeight = 25;
          
          // Cell sizing
          const mmToPoints = 2.83465;
          const targetCellWidth = 50 * mmToPoints;
          const targetCellHeight = 50 * mmToPoints;
          const gapSize = 8 * mmToPoints;
          
          const maxCellWidth = Math.floor((availableWidth - rowLabelWidth) / room.columns);
          const maxCellHeight = Math.floor((availableHeight - colLabelHeight - 20) / rowsOnThisPage);
          
          const cellWidth = Math.min(targetCellWidth, maxCellWidth - gapSize);
          const cellHeight = Math.min(targetCellHeight, maxCellHeight - gapSize);
          
          const gridWidth = room.columns * (cellWidth + gapSize) - gapSize;
          
          // Center grid horizontally
          const startX = (pageWidth - gridWidth - rowLabelWidth) / 2 + rowLabelWidth;
          const startY = gridStartY; // Start at calculated position

          // ═══════════════════════════════════════════
          // DRAW SEATING GRID
          // ═══════════════════════════════════════════
          for (let rowIdx = rowStart; rowIdx <= rowEnd; rowIdx++) {
            const rowIndexOnPage = rowIdx - rowStart;
            
            for (let colIdx = 0; colIdx < room.columns; colIdx++) {
              const key = `${rowIdx}-${colIdx}`;
              const seat = seatMap.get(key);
            
              const x = startX + colIdx * (cellWidth + gapSize);
              const y = startY + rowIndexOnPage * (cellHeight + gapSize);
            
              const registrationNumber = seat && !seat.isEmpty 
                ? (seat.registrationNumber || seat.studentId || '') 
                : '';
            
              if (registrationNumber) {
                // Blue box
                doc.fillColor('#428bca');
                doc.rect(x, y, cellWidth, cellHeight).fill();
                
                // White text - 2 lines
                doc.fillColor('white');
                const textY = y + cellHeight / 2;
                
                const parts = registrationNumber.split('-');
                if (parts.length >= 2) {
                  const prefix = parts.slice(0, -1).join('-');
                  const number = parts[parts.length - 1];
                  
                  // Line 1: Session name (bold, 10pt)
                  doc.fontSize(10).font('Helvetica-Bold');
                  doc.text(prefix, x, textY - 6, {
                    align: 'center',
                    width: cellWidth
                  });
                  
                  // Line 2: Number (normal, 13pt)
                  doc.fontSize(13).font('Helvetica');
                  doc.text(number, x, textY + 6, {
                    align: 'center',
                    width: cellWidth
                  });
                } else {
                  doc.fontSize(11).font('Helvetica');
                  doc.text(registrationNumber, x, textY, {
                    align: 'center',
                    width: cellWidth
                  });
                }
                
                doc.fillColor('black');
              } else {
                // Empty seat (gray)
                doc.fillColor('#f5f5f5');
                doc.rect(x, y, cellWidth, cellHeight).fill();
                doc.strokeColor('#cccccc');
                doc.rect(x, y, cellWidth, cellHeight).stroke();
                doc.strokeColor('black');
                doc.fillColor('black');
              }
            }
          }

          // Row labels (left)
          doc.fontSize(11).fillColor('black').font('Helvetica-Bold');
          for (let rowIdx = rowStart; rowIdx <= rowEnd; rowIdx++) {
            const rowIndexOnPage = rowIdx - rowStart;
            const y = startY + rowIndexOnPage * (cellHeight + gapSize) + cellHeight / 2;
            doc.text(String(rowIdx + 1), startX - rowLabelWidth + 5, y - 5, {
              align: 'right',
              width: rowLabelWidth - 10
            });
          }
          doc.font('Helvetica');

          // Column labels (bottom)
          doc.fontSize(11).font('Helvetica-Bold');
          for (let colIdx = 0; colIdx < room.columns; colIdx++) {
            const x = startX + colIdx * (cellWidth + gapSize) + cellWidth / 2;
            const y = startY + rowsOnThisPage * (cellHeight + gapSize) + 8;
            doc.text(String(colIdx + 1), x - cellWidth / 2, y, {
              align: 'center',
              width: cellWidth
            });
          }
          doc.font('Helvetica');

          // ═══════════════════════════════════════════
          // NO TIMESTAMP FOOTER - REMOVED COMPLETELY
          // ═══════════════════════════════════════════
          // The "Generated on: ..." line has been removed
          // to prevent extra blank pages
          
        } // End page loop
      } // End room loop
      
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