const PDFDocument = require('pdfkit');

/**
 * Generate a professional PDF invoice stream for a completed/confirmed vehicle purchase order.
 * @param {Object} order - Populated Order document (buyerId, sellerId, vehicleId)
 * @param {WritableStream} stream - Target writable response stream
 */
const generateInvoice = (order, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // Colors
  const primaryColor = '#1E40AF'; // Blue 800
  const secondaryColor = '#3B82F6'; // Blue 500
  const darkTextColor = '#1F2937'; // Gray 800
  const lightTextColor = '#6B7280'; // Gray 500
  const bgLight = '#F3F4F6'; // Gray 100

  // --- Header ---
  doc
    .fillColor(primaryColor)
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('DEALS ON WHEELS', 50, 45)
    .fontSize(10)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text('Official Vehicle Purchase Invoice & Sale Receipt', 50, 72);

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('INVOICE', 400, 45, { align: 'right' })
    .fontSize(9)
    .font('Helvetica')
    .fillColor(darkTextColor)
    .text(`Invoice No: INV-${order._id.toString().substring(18).toUpperCase()}`, 400, 65, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`, 400, 78, { align: 'right' })
    .text(`Status: ${order.status.toUpperCase()}`, 400, 91, { align: 'right' });

  // Horizontal Rule
  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, 110)
    .lineTo(550, 110)
    .stroke();

  // --- Customer & Seller Details ---
  let startY = 125;

  // Buyer Column
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('BUYER DETAILS', 50, startY)
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(darkTextColor)
    .text(order.buyerId?.name || 'N/A', 50, startY + 18)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text(`Email: ${order.buyerId?.email || 'N/A'}`, 50, startY + 32)
    .text(`Phone: ${order.buyerId?.phone || 'N/A'}`, 50, startY + 46)
    .text(`Location: ${order.buyerId?.city || ''}, ${order.buyerId?.state || ''}`, 50, startY + 60);

  // Seller Column
  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('SELLER DETAILS', 300, startY)
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(darkTextColor)
    .text(order.sellerId?.name || 'N/A', 300, startY + 18)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text(`Email: ${order.sellerId?.email || 'N/A'}`, 300, startY + 32)
    .text(`Phone: ${order.sellerId?.phone || 'N/A'}`, 300, startY + 46)
    .text(`Location: ${order.sellerId?.city || ''}, ${order.sellerId?.state || ''}`, 300, startY + 60);

  // --- Vehicle Details Section ---
  startY = 220;

  doc
    .fillColor(bgLight)
    .rect(50, startY, 500, 24)
    .fill();

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('VEHICLE SPECIFICATIONS & PARTICULARS', 60, startY + 7);

  const vehicle = order.vehicleId || {};

  const vehicleInfo = [
    ['Vehicle Title:', vehicle.title || 'N/A'],
    ['Brand / Model:', `${vehicle.brand || ''} ${vehicle.model || ''}`],
    ['Year of Mfg:', `${vehicle.year || 'N/A'}`],
    ['Registration No:', vehicle.registrationNumber || 'N/A'],
    ['VIN / Chassis:', vehicle.vinNumber || 'N/A'],
    ['Fuel / Transmission:', `${vehicle.fuelType || 'N/A'} / ${vehicle.transmission || 'N/A'}`]
  ];

  let gridY = startY + 32;
  vehicleInfo.forEach(([label, value], idx) => {
    const xPos = idx % 2 === 0 ? 60 : 300;
    const yPos = gridY + Math.floor(idx / 2) * 20;

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(darkTextColor)
      .text(label, xPos, yPos)
      .font('Helvetica')
      .fillColor(lightTextColor)
      .text(value, xPos + 100, yPos);
  });

  // --- Financial Summary Table ---
  startY = 350;

  doc
    .fillColor(primaryColor)
    .rect(50, startY, 500, 24)
    .fill();

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#FFFFFF')
    .text('DESCRIPTION', 60, startY + 7)
    .text('AMOUNT (INR)', 450, startY + 7, { align: 'right' });

  const formatCurrency = (num) => {
    return `Rs. ${Number(num || 0).toLocaleString('en-IN')}`;
  };

  let itemY = startY + 32;

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(darkTextColor)
    .text(`Purchase of ${vehicle.title || 'Vehicle'}`, 60, itemY)
    .text(formatCurrency(order.amount), 450, itemY, { align: 'right' });

  doc
    .strokeColor('#E5E7EB')
    .lineWidth(1)
    .moveTo(50, itemY + 20)
    .lineTo(550, itemY + 20)
    .stroke();

  // Total Line
  const totalY = itemY + 32;

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('TOTAL AMOUNT PAID', 60, totalY)
    .text(formatCurrency(order.amount), 450, totalY, { align: 'right' });

  // Payment Verification Footer
  const footerY = totalY + 60;

  doc
    .fillColor('#F9FAFB')
    .rect(50, footerY, 500, 60)
    .fill()
    .strokeColor('#D1D5DB')
    .stroke();

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor(darkTextColor)
    .text('Payment Verification & Guarantee:', 60, footerY + 10)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text(`Order ID: ${order._id}`, 60, footerY + 24)
    .text(`Razorpay Payment Ref: ${order.paymentDetails?.razorpayPaymentId || 'VERIFIED_ELECTRONIC_TRANSFER'}`, 60, footerY + 38);

  // Footer Disclaimer
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(lightTextColor)
    .text('This is a computer-generated tax invoice and sale receipt issued by Deals on Wheels marketplace.', 50, 720, { align: 'center' });

  doc.end();
};

module.exports = { generateInvoice };
