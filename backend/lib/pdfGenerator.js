const PDFDocument = require('pdfkit');
const Session = require('../models/Session');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');

/**
 * Extract session year and department from session name
 * Expected formats:
 *   - "FALL" → year: current year (or session.year if provided)
 *   - "SPRING2024" → year: 2024 (or session.year if provided, which might be 2025)
 *   - "2024 CS" → year: 2024
 * Falls back to current year and "GEN" if not parseable
 * 
 * Note: If session.year is provided, it takes precedence over parsed year
 */
function parseSessionInfo(sessionName) {
  if (!sessionName) {
    return {
      year: new Date().getFullYear().toString(),
      dept: 'GEN'
    };
  }
  
  // Try to extract year (4 digits) - looks for years like 2024, 2025, etc.
  // This handles formats like "SPRING2024", "2024 FALL", "FALL 2024", etc.
  const yearMatch = sessionName.match(/\b(20\d{2})\b/);
  const deptMatch = sessionName.match(/\b([A-Z]{2,3})\b/i);
  
  // Extract year from name, or use current year as fallback
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  const dept = deptMatch ? deptMatch[1].toUpperCase() : 'GEN';
  
  return { year, dept };
}

/**
 * Generate PDF for seating plan with registration numbers
 * @param {Object} plan - Plan document with arrangement data
 * @param {string} userId - User ID for authorization
 * @returns {Promise<Buffer>} PDF buffer
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

      // Create session map for reference (sessionId -> { name, year })
      // Each session can have its own year extracted from name or from session.year property
      const sessionMap = new Map();
      sessions.forEach(session => {
        // Extract year from session name or use session.year if it exists, otherwise fallback to current year
        const sessionInfo = parseSessionInfo(session.name || '');
        // Use session.year if available (as number or string), otherwise parse from name
        // Convert to string for consistent formatting
        const year = session.year ? String(session.year) : sessionInfo.year;
        sessionMap.set(String(session._id), {
          name: session.name,
          year: year
        });
      });
      
      console.log('PDF Generator - Session map:', Array.from(sessionMap.entries()).map(([id, data]) => ({ id, name: data.name, year: data.year })));

      // Create PDF document in landscape orientation for better layout
      const doc = new PDFDocument({ 
        margin: 30, 
        size: 'A4',
        layout: 'landscape' // Landscape orientation: 297×210mm (width × height)
      });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Extract seating plans from arrangement
      const seatingPlans = plan.arrangement?.rooms || [];
      console.log('PDF Generator - Seating plans count:', seatingPlans.length);
      console.log('PDF Generator - First plan sample:', seatingPlans[0] ? {
        roomId: seatingPlans[0].roomId,
        seatsCount: seatingPlans[0].seats?.length || 0,
        firstSeatSample: seatingPlans[0].seats?.[0]?.[0] || null
      } : null);
      
      if (seatingPlans.length === 0) {
        throw new Error('No seating plans found in arrangement');
      }

      // Fetch room details
      const roomIds = seatingPlans.map(p => p.roomId);
      const rooms = await Room.find({ _id: { $in: roomIds }, user: userId });
      const roomMap = new Map(rooms.map(r => [String(r._id), r]));
      
      console.log('PDF Generator - Rooms found:', rooms.length);

      // Constants for pagination
      const ROWS_PER_PAGE = 5; // Maximum rows per page for readability
      
      // Helper function to draw full header (only on first page of each room)
      const drawFullHeader = () => {
        // Reset to top of page
        doc.y = 30;
        
        // Title - centered
        doc.fontSize(22).font('Helvetica-Bold').fillColor('black')
          .text('EXAM SEATING PLAN', { align: 'center' });
        doc.moveDown(0.5);
        
        // Time slot information - centered
        doc.fontSize(14).font('Helvetica')
          .text(`Time Slot: ${timeSlot.time}`, { align: 'center' });
        doc.moveDown(0.4);
        
        // Session information - centered
        doc.fontSize(12)
          .text(`Sessions: ${sessions.map(s => s.name).join(', ')}`, { align: 'center' });
        doc.moveDown(0.4);
        
        // Registration number format info - centered
        const firstSessionName = sessions[0]?.name.toUpperCase().replace(/\s+/g, '') || 'SESSION';
        const exampleFormat = `${firstSessionName}-001`;
        doc.fontSize(10).fillColor('gray')
          .text(`Registration Format: [SESSION]-[ROLLNO] (e.g., ${exampleFormat})`, { align: 'center' });
        doc.fillColor('black');
        doc.moveDown(0.6);
        
        // Separator line
        const pageWidth = doc.page.width;
        doc.strokeColor('#c8c8c8');
        doc.lineWidth(0.5);
        doc.moveTo(40, doc.y)
          .lineTo(pageWidth - 40, doc.y)
          .stroke();
        doc.strokeColor('black');
        doc.moveDown(0.5);
      };
      
      // Helper function to draw room name (for continuation pages)
      const drawRoomName = (roomName, isContinuation = false) => {
        doc.y = 30;
        if (isContinuation) {
          doc.fontSize(14).fillColor('blue').font('Helvetica-Bold')
            .text(`Room: ${roomName} (continued)`, { align: 'center' });
        } else {
          doc.fontSize(18).fillColor('blue').font('Helvetica-Bold')
            .text(`Room: ${roomName}`, { align: 'center' });
        }
        doc.fillColor('black');
        doc.moveDown(0.8);
      };

      // Process each room with pagination
      let isFirstPageOfPDF = true;
      
      for (let roomIdx = 0; roomIdx < seatingPlans.length; roomIdx++) {
        const seatingPlan = seatingPlans[roomIdx];
        const room = roomMap.get(seatingPlan.roomId);
        
        if (!room) {
          console.warn(`Room not found for ID: ${seatingPlan.roomId}`);
          continue;
        }

        // Calculate how many pages needed for this room
        const totalPagesForRoom = Math.ceil(room.rows / ROWS_PER_PAGE);
        
        // Process each page of this room
        for (let pageNum = 0; pageNum < totalPagesForRoom; pageNum++) {
          // Add new page (except very first page of PDF)
          if (!isFirstPageOfPDF) {
            doc.addPage();
          }
          isFirstPageOfPDF = false;
          
          // Draw header based on page number
          if (pageNum === 0) {
            // First page of room - show full header
            drawFullHeader();
            drawRoomName(room.name, false);
          } else {
            // Continuation page - show only room name
            drawRoomName(room.name, true);
          }

          // Get seating data
          const seats = seatingPlan.seats || [];
          if (seats.length === 0) {
            if (pageNum === 0) {
              doc.text('No seats assigned', { align: 'center' });
            }
            break; // Skip remaining pages for this room, move to next room
          }

          // Create a 2D map of seats for easy lookup: [row][col] -> seat
          const seatMap = new Map();
          for (let rowIdx = 0; rowIdx < seats.length; rowIdx++) {
            const row = seats[rowIdx];
            for (let colIdx = 0; colIdx < row.length; colIdx++) {
              const seat = row[colIdx];
              const key = `${seat.row}-${seat.col}`;
              seatMap.set(key, seat);
            }
          }
          
          // Calculate which rows to show on this page
          const rowStart = pageNum * ROWS_PER_PAGE;
          const rowEnd = Math.min((pageNum + 1) * ROWS_PER_PAGE - 1, room.rows - 1);
          const rowsOnThisPage = rowEnd - rowStart + 1;

          // Grid layout settings - use full page width with landscape orientation
          const pageWidth = doc.page.width; // Landscape: ~756 points (297mm)
          const pageHeight = doc.page.height; // Landscape: ~540 points (210mm)
          const margin = 30;
          const availableWidth = pageWidth - (margin * 2);
          const availableHeight = pageHeight - doc.y - 50; // Leave space for footer
          
          // Row and column label space
          const rowLabelWidth = 35;
          const colLabelHeight = 25;
          
          // Calculate optimal cell size - larger boxes for readability
          const targetCellWidthMM = 50;
          const targetCellHeightMM = 50; // Increased to 50mm for better readability
          const gapSizeMM = 8;
          
          // Convert mm to points (1mm = 2.83465 points)
          const mmToPoints = 2.83465;
          const targetCellWidth = targetCellWidthMM * mmToPoints; // ~142 points
          const targetCellHeight = targetCellHeightMM * mmToPoints; // ~142 points
          const gapSize = gapSizeMM * mmToPoints; // ~23 points
          
          // Calculate maximum cell size that fits (based on rows on THIS page)
          const maxCellWidth = Math.floor((availableWidth - rowLabelWidth) / room.columns);
          const maxCellHeight = Math.floor((availableHeight - colLabelHeight - 20) / rowsOnThisPage);
          
          // Use target size or maximum that fits, whichever is smaller
          const cellWidth = Math.min(targetCellWidth, maxCellWidth - gapSize);
          const cellHeight = Math.min(targetCellHeight, maxCellHeight - gapSize);
          
          // Calculate grid dimensions (only for rows on this page)
          const gridWidth = room.columns * (cellWidth + gapSize) - gapSize;
          const gridHeight = rowsOnThisPage * (cellHeight + gapSize) - gapSize;
          
          // Center the grid horizontally
          const startX = (pageWidth - gridWidth - rowLabelWidth) / 2 + rowLabelWidth;
          const startY = doc.y + 10; // Space after header/room name

          // Draw seating grid - only show rows for this page
          for (let rowIdx = rowStart; rowIdx <= rowEnd; rowIdx++) {
            const rowIndexOnPage = rowIdx - rowStart; // Index within this page (0-4)
            
            for (let colIdx = 0; colIdx < room.columns; colIdx++) {
              const key = `${rowIdx}-${colIdx}`;
              const seat = seatMap.get(key);
            
              // Calculate position (using rowIndexOnPage for vertical positioning)
              const x = startX + colIdx * (cellWidth + gapSize);
              const y = startY + rowIndexOnPage * (cellHeight + gapSize);
            
            // Get registration number
            const registrationNumber = seat && !seat.isEmpty 
              ? (seat.registrationNumber || seat.studentId || '') 
              : '';
            
            // Draw blue box (or gray if empty)
            if (registrationNumber) {
              // Blue fill for assigned seats (RGB: 66, 139, 202)
              doc.fillColor('#428bca');
              doc.rect(x, y, cellWidth, cellHeight).fill();
              
              // White text for registration number - clean two-line format with larger fonts
              doc.fillColor('white');
              
              // Split registration numbers into 2 lines with proper formatting
              // Format: "FALL2024" (bold, font 10) on first line, "063" (normal, font 13) on second line
              const textY = y + cellHeight / 2; // Vertical center of cell
              
              // Always split at hyphen for consistent 2-line display
              const parts = registrationNumber.split('-');
              if (parts.length >= 2) {
                // Split into prefix (session name) and number
                const prefix = parts.slice(0, -1).join('-');
                const number = parts[parts.length - 1];
                
                // First line: session name (e.g., "FALL2024") - bold, font 10
                doc.fontSize(10).font('Helvetica-Bold');
                doc.text(prefix, x, textY - 6, {
                  align: 'center',
                  width: cellWidth
                });
                
                // Second line: number only (e.g., "063") - normal, font 13 (LARGER for readability)
                doc.fontSize(13).font('Helvetica');
                doc.text(number, x, textY + 6, {
                  align: 'center',
                  width: cellWidth
                });
              } else {
                // Fallback: single line if no hyphen found
                doc.fontSize(11).font('Helvetica');
                doc.text(registrationNumber, x, textY, {
                  align: 'center',
                  width: cellWidth
                });
              }
              
              doc.fillColor('black');
            } else {
              // Gray fill and outline for empty seats
              doc.fillColor('#f5f5f5');
              doc.rect(x, y, cellWidth, cellHeight).fill();
              doc.strokeColor('#cccccc');
              doc.rect(x, y, cellWidth, cellHeight).stroke();
              doc.strokeColor('black');
              doc.fillColor('black');
            }
          }
        }

          // Draw row labels (1, 2, 3...) on left side - show actual row numbers for this page
          doc.fontSize(11).fillColor('black').font('Helvetica-Bold');
          for (let rowIdx = rowStart; rowIdx <= rowEnd; rowIdx++) {
            const rowIndexOnPage = rowIdx - rowStart;
            const y = startY + rowIndexOnPage * (cellHeight + gapSize) + cellHeight / 2;
            doc.text(String(rowIdx + 1), startX - rowLabelWidth + 5, y - 4, {
              align: 'right',
              width: rowLabelWidth - 10
            });
          }
          doc.font('Helvetica'); // Reset to regular font

          // Draw column labels (1, 2, 3...) at bottom
          doc.fontSize(11).font('Helvetica-Bold');
          for (let colIdx = 0; colIdx < room.columns; colIdx++) {
            const x = startX + colIdx * (cellWidth + gapSize) + cellWidth / 2;
            const y = startY + rowsOnThisPage * (cellHeight + gapSize) + 8;
            doc.text(String(colIdx + 1), x, y, {
              align: 'center',
              width: cellWidth
            });
          }
          doc.font('Helvetica'); // Reset to regular font

          // Move down after grid
          doc.y = startY + rowsOnThisPage * (cellHeight + gapSize) + colLabelHeight + 10;
          
          // Add footer for this page - centered
          const footerY = doc.page.height - 30;
          doc.fontSize(8).fillColor('gray');
          doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.page.width / 2, footerY, { align: 'center' });
          doc.fillColor('black');
        } // End of page loop for this room
      } // End of room loop

      // No need to add extra pages - PDFKit handles page creation automatically
      // The last room's page is already created in the loop above
      
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

