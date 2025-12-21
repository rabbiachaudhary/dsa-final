const PDFDocument = require('pdfkit');
const Session = require('../models/Session');
const Room = require('../models/Room');
const TimeSlot = require('../models/TimeSlot');

/**
 * Extract session year and department from session name
 * Expected format: "2024 CS" or "2024-CS" or similar
 * Falls back to current year and "GEN" if not parseable
 */
function parseSessionInfo(sessionName) {
  // Try to extract year (4 digits) and department (2-3 letter code)
  const yearMatch = sessionName.match(/\b(20\d{2})\b/);
  const deptMatch = sessionName.match(/\b([A-Z]{2,3})\b/i);
  
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

      // Get session info for registration number format
      // Use first session's name to determine year and department
      const sessionInfo = parseSessionInfo(sessions[0].name || '');
      const { year, dept } = sessionInfo;

      // Create PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Extract seating plans from arrangement
      const seatingPlans = plan.arrangement?.rooms || [];
      if (seatingPlans.length === 0) {
        throw new Error('No seating plans found in arrangement');
      }

      // Fetch room details
      const roomIds = seatingPlans.map(p => p.roomId);
      const rooms = await Room.find({ _id: { $in: roomIds }, user: userId });
      const roomMap = new Map(rooms.map(r => [String(r._id), r]));

      // Generate PDF content
      doc.fontSize(20).text('Exam Seating Plan', { align: 'center' });
      doc.moveDown();
      
      // Time slot information
      doc.fontSize(14).text(`Time Slot: ${timeSlot.time}`, { align: 'center' });
      doc.moveDown(0.5);
      
      // Session information
      doc.fontSize(12).text(`Sessions: ${sessions.map(s => s.name).join(', ')}`);
      doc.moveDown(0.5);
      
      // Registration number format info
      doc.fontSize(10).fillColor('gray').text(`Registration Format: ${year}-${dept}-ROLLNO`, { align: 'center' });
      doc.fillColor('black');
      doc.moveDown();

      // Process each room
      for (let roomIdx = 0; roomIdx < seatingPlans.length; roomIdx++) {
        const seatingPlan = seatingPlans[roomIdx];
        const room = roomMap.get(seatingPlan.roomId);
        
        if (!room) {
          console.warn(`Room not found for ID: ${seatingPlan.roomId}`);
          continue;
        }

        // Add page break if not first room
        if (roomIdx > 0) {
          doc.addPage();
        }

        // Room header
        doc.fontSize(16).fillColor('blue').text(`Room: ${room.name}`, { align: 'center' });
        doc.fillColor('black');
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Dimensions: ${room.rows} rows × ${room.columns} columns`);
        doc.moveDown();

        // Create seating table
        const seats = seatingPlan.seats || [];
        if (seats.length === 0) {
          doc.text('No seats assigned', { align: 'center' });
          continue;
        }

        // Table settings
        const cellWidth = 80;
        const cellHeight = 30;
        const startX = 50;
        let currentY = doc.y;
        const pageHeight = 750; // Approximate page height minus margins

        // Table header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.rect(startX, currentY, cellWidth, cellHeight).stroke();
        doc.text('Row', startX + 5, currentY + 10);
        
        doc.rect(startX + cellWidth, currentY, cellWidth, cellHeight).stroke();
        doc.text('Seat', startX + cellWidth + 5, currentY + 10);
        
        doc.rect(startX + cellWidth * 2, currentY, cellWidth * 2, cellHeight).stroke();
        doc.text('Registration Number', startX + cellWidth * 2 + 5, currentY + 10);
        
        currentY += cellHeight;
        doc.font('Helvetica');

        // Table rows
        for (let rowIdx = 0; rowIdx < seats.length; rowIdx++) {
          const row = seats[rowIdx];
          
          for (let colIdx = 0; colIdx < row.length; colIdx++) {
            const seat = row[colIdx];
            
            // Check if we need a new page
            if (currentY + cellHeight > pageHeight) {
              doc.addPage();
              currentY = 50;
              
              // Redraw header on new page
              doc.font('Helvetica-Bold');
              doc.rect(startX, currentY, cellWidth, cellHeight).stroke();
              doc.text('Row', startX + 5, currentY + 10);
              doc.rect(startX + cellWidth, currentY, cellWidth, cellHeight).stroke();
              doc.text('Seat', startX + cellWidth + 5, currentY + 10);
              doc.rect(startX + cellWidth * 2, currentY, cellWidth * 2, cellHeight).stroke();
              doc.text('Registration Number', startX + cellWidth * 2 + 5, currentY + 10);
              currentY += cellHeight;
              doc.font('Helvetica');
            }

            // Draw cell borders
            doc.rect(startX, currentY, cellWidth, cellHeight).stroke();
            doc.rect(startX + cellWidth, currentY, cellWidth, cellHeight).stroke();
            doc.rect(startX + cellWidth * 2, currentY, cellWidth * 2, cellHeight).stroke();

            // Cell content
            if (!seat.isEmpty && seat.registrationNumber) {
              // Row number (0-indexed, display as 1-indexed)
              doc.fontSize(9).text(`${seat.row + 1}`, startX + 5, currentY + 10);
              
              // Seat number (column + 1)
              doc.text(`${seat.col + 1}`, startX + cellWidth + 5, currentY + 10);
              
              // Registration number
              doc.fontSize(8).text(seat.registrationNumber, startX + cellWidth * 2 + 5, currentY + 10, {
                width: cellWidth * 2 - 10,
                ellipsis: true
              });
            } else {
              // Empty seat
              doc.fontSize(9).fillColor('gray').text('Empty', startX + 5, currentY + 10);
              doc.fillColor('black');
            }

            currentY += cellHeight;
          }
        }

        doc.moveDown();
      }

      // Footer
      doc.fontSize(8).fillColor('gray');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 50, { align: 'center' });
      doc.fillColor('black');

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

