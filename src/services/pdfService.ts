import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GeneratedItinerary, SafariFormData, BrandingConfig, CostingReport } from '../types';

const orangeBadgeFallback = (doc: any) => {
  doc.setFillColor(249, 115, 22); // orange (#F97316)
  doc.rect(25, 26, 4, 16, 'F');
  doc.rect(32, 29, 4, 10, 'F');
};

const getBrandPrimaryRgb = (branding?: any): [number, number, number] => {
  const defaultRgb: [number, number, number] = [30, 41, 59]; // default deep slate/navy (#1E293B)
  const colorStr = branding?.primaryColor;
  if (!colorStr) return defaultRgb;
  
  const cleaned = colorStr.replace('#', '').trim();
  if (cleaned.length === 6) {
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return [r, g, b];
    }
  } else if (cleaned.length === 3) {
    const r = parseInt(cleaned.charAt(0) + cleaned.charAt(0), 16);
    const g = parseInt(cleaned.charAt(1) + cleaned.charAt(1), 16);
    const b = parseInt(cleaned.charAt(2) + cleaned.charAt(2), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return [r, g, b];
    }
  }
  return defaultRgb;
};

export const generateItineraryPDF = (itinerary: GeneratedItinerary, formData: SafariFormData, branding: BrandingConfig): Blob => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set fonts if possible or use defaults
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(branding.primaryColor || '#8f8664');
  
  // Header
  doc.text(branding.agencyName || branding.appName, 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(branding.agencyDescription || '', 20, 26);
  
  // Trip Title
  doc.setFontSize(28);
  doc.setTextColor(0);
  doc.text(itinerary.tripTitle, 20, 45);
  
  // Summary
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const summaryLines = doc.splitTextToSize(itinerary.summary, pageWidth - 40);
  doc.text(summaryLines, 20, 55);
  
  let currentY = 55 + (summaryLines.length * 7) + 10;
  
  // Highlights
  doc.setFont("helvetica", "bold");
  doc.text("Highlights", 20, currentY);
  currentY += 7;
  doc.setFont("helvetica", "normal");
  itinerary.highlights.forEach(h => {
    doc.text(`• ${h}`, 25, currentY);
    currentY += 6;
  });
  
  currentY += 10;
  
  // Schedule Table
  const tableData = itinerary.schedule.map(day => [
    `Day ${day.day}`,
    day.title,
    day.accommodation,
    day.meals
  ]);
  
  doc.autoTable({
    startY: currentY,
    head: [['Day', 'Activity', 'Accommodation', 'Meals']],
    body: tableData,
    headStyles: { fillColor: branding.primaryColor || [143, 134, 100] },
    margin: { left: 20, right: 20 }
  });
  
  // Add detailed day descriptions on new pages
  itinerary.schedule.forEach((day) => {
    doc.addPage();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Day ${day.day}: ${day.title}`, 20, 20);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(day.description, pageWidth - 40);
    doc.text(descLines, 20, 30);
    
    let y = 30 + (descLines.length * 7) + 10;
    
    doc.setFont("helvetica", "bold");
    doc.text("Morning:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(day.morningActivity, 45, y);
    y += 7;
    
    doc.setFont("helvetica", "bold");
    doc.text("Afternoon:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(day.afternoonActivity, 45, y);
    y += 7;
    
    doc.setFont("helvetica", "bold");
    doc.text("Lodging:", 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(day.accommodation, 45, y);
  });
  
  return doc.output('blob');
};

export const generateInvoicePDF = (
  report: CostingReport,
  formData: SafariFormData,
  tripTitle: string,
  invoiceNumber: string,
  branding?: BrandingConfig,
  payments?: any[],
  totalPaidAmount?: number
): Blob => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top corporate slate/navy banner
  const [brandR, brandG, brandB] = getBrandPrimaryRgb(branding);
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(15, 15, pageWidth - 30, 38, 'F');

  // Render custom logo if defined, otherwise default to orange badge helper
  let textX = 42;
  if (branding?.agencyLogo) {
    textX = 47;
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, 25, 16, 16, 1.5, 1.5, 'F');
      doc.addImage(branding.agencyLogo, 'PNG', 26, 26, 14, 14);
    } catch (e) {
      orangeBadgeFallback(doc);
      textX = 42;
    }
  } else {
    orangeBadgeFallback(doc);
  }

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(branding?.agencyName || branding?.appName || "Safari Planner Agency", textX, 31);

  // Subtitle/Email/Phone in banner left side
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240); // slate-200
  const pdfContactEmail = branding?.pdfContactEmail || branding?.contactEmail || 'sales@safari-agency.com';
  const pdfContactPhone = branding?.pdfContactPhone || branding?.contactPhone || '+254712345678';
  const pdfContactAddress = branding?.pdfContactAddress || branding?.contactAddress || 'Nairobi, Kenya';
  doc.text(`Email: ${pdfContactEmail}   |   Tel: ${pdfContactPhone}`, textX, 37);
  doc.text(`Address: ${pdfContactAddress}`, textX, 43);

  // Document Title label "INVOICE"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", pageWidth - 25, 33, { align: 'right' });

  // Invoice Number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(241, 245, 249);
  doc.text(`Ref No. ${invoiceNumber}`, pageWidth - 25, 40, { align: 'right' });

  // Dates
  const todayStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Invoice Date:   ${todayStr}`, pageWidth - 25, 45, { align: 'right' });
  
  const dueDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`Due Date:       ${dueDateStr}`, pageWidth - 25, 49, { align: 'right' });

  // Details Divider Row
  let y = 63;
  doc.setDrawColor(brandR, brandG, brandB);
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Double Column headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB); // brand primary color
  doc.text("Billed To:", 20, y);
  doc.text("Trip Details:", pageWidth / 2 + 10, y);

  y += 2;
  doc.line(20, y, pageWidth / 2 - 10, y);
  doc.line(pageWidth / 2 + 10, y, pageWidth - 20, y);
  y += 5;

  // Fill in column contents
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB);

  const billedToLines = [
    formData.name,
    formData.phone ? `Tel: ${formData.phone}` : '',
    formData.email ? `Email: ${formData.email}` : '',
    formData.country ? `Country: ${formData.country}` : ''
  ].filter(Boolean);

  const tripLines = [
    tripTitle,
    formData.startDate ? `Start: ${new Date(formData.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}` : '',
    formData.pax ? `Guests: ${formData.pax} Pax` : ''
  ].filter(Boolean);

  const maxLines = Math.max(billedToLines.length, tripLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (billedToLines[i]) doc.text(billedToLines[i], 20, y + (i * 4.5));
    if (tripLines[i]) doc.text(tripLines[i], pageWidth / 2 + 10, y + (i * 4.5));
  }

  y += (maxLines * 4.5) + 8;

  // Build clean Table Row items
  const markupPercentage = report.markupPercentage || 0;
  const markupFactor = 1 + (markupPercentage / 100);

  const tableData = report.items.map((item, index) => {
    const itemUnitPriceWithMarkup = item.unitPrice * markupFactor;
    const itemTotalWithMarkup = item.total * markupFactor;
    return [
      (index + 1).toString(),
      item.description,
      item.quantity ? `${item.quantity}` : '1',
      `$${itemUnitPriceWithMarkup.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `$${itemTotalWithMarkup.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  // Table rendering via autoTable
  doc.autoTable({
    startY: y,
    head: [['No.', 'Description', 'Quantity', 'Unit Price (USD)', 'Amount (USD)']],
    body: tableData,
    margin: { left: 15, right: 15 },
    headStyles: { 
      fillColor: [brandR, brandG, brandB], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 8.5 
    },
    bodyStyles: { 
      textColor: [brandR, brandG, brandB], 
      fontSize: 8.5 
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let curY = finalY;

  // Calculations
  const subtotal = report.subtotal || report.total;
  const taxAmount = report.taxAmount || 0;
  const taxPercentage = report.taxPercentage || 0;
  const total = report.total;
  const paid = totalPaidAmount || 0;
  const balanceDue = Math.max(0, total - paid);

  // Totals Drawer on right
  const totalBoxWidth = 85;
  const totalsX = pageWidth - 15 - totalBoxWidth;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);

  const subtotalWithMarkup = subtotal * markupFactor;

  doc.text("Subtotal:", totalsX, curY);
  doc.text(`$${subtotalWithMarkup.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY, { align: 'right' });
  curY += 5;

  if (taxAmount > 0) {
    doc.text(`Tax / VAT (${taxPercentage}%):`, totalsX, curY);
    doc.text(`$${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY, { align: 'right' });
    curY += 5;
  }

  if (paid > 0) {
    doc.text("Amount Paid:", totalsX, curY);
    doc.text(`$${paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY, { align: 'right' });
    curY += 5;
  }

  // Draw Shaded Total Highlight box
  curY += 2;
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(totalsX - 4, curY - 4, totalBoxWidth + 4, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const totalLabel = paid > 0 ? "Amount Due:" : "Total Amount:";
  const totalValue = paid > 0 ? balanceDue : total;
  doc.text(totalLabel, totalsX, curY + 2.5);
  doc.text(`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY + 2.5, { align: 'right' });

  // Settle Details, Notes (Left Side), Signatures (Right Side)
  const bottomY = Math.max(curY + 16, finalY + 12);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Payment Information", 20, bottomY);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);
  const bankName = branding?.pdfBankName || 'Great Plains Wildlife Bank';
  const accountName = branding?.pdfAccountName || branding?.agencyName || branding?.appName || 'Safari Planner Agency Ltd';
  const accountNo = branding?.pdfAccountNumber || '102-3984-5928-1';
  const swiftCode = branding?.pdfSwiftCode || 'GPWLKENX';
  const paymentNotes = branding?.pdfPaymentNotes || 'Please include the booking reference number in your wire payment instructions.';

  doc.text(`Bank Name:      ${bankName}`, 20, bottomY + 5);
  doc.text(`Account Name:   ${accountName}`, 20, bottomY + 9);
  doc.text(`Account No:     ${accountNo}`, 20, bottomY + 13);
  doc.text(`SWIFT Code:     ${swiftCode}`, 20, bottomY + 17);
  doc.text(`Payment Due:    ${dueDateStr}`, 20, bottomY + 21);

  let nextSectionY = bottomY + 34;
  if (paymentNotes) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandR, brandG, brandB);
    doc.text("Instructions", 20, nextSectionY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(brandR, brandG, brandB);
    const noteLines = doc.splitTextToSize(paymentNotes, pageWidth - 40);
    doc.text(noteLines, 20, nextSectionY + 6);
    nextSectionY += noteLines.length * 5 + 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Terms & Conditions", 20, nextSectionY);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);
  const termsText = branding?.pdfTermsConditions || "Please send proof of payment to our booking or finance email address. Balance payments are required prior to departure. Booking is subject to our terms of agreement.";
  const termsLines = doc.splitTextToSize(termsText, pageWidth - 40);
  doc.text(termsLines, 20, nextSectionY + 6);

  // Line (Left blank above as requested for physical or digital signing)
  const sigX = pageWidth - 65;
  doc.setDrawColor(brandR, brandG, brandB);
  doc.setLineWidth(0.5);
  doc.line(sigX, bottomY + 19, pageWidth - 20, bottomY + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Authorized Signature", sigX + 11, bottomY + 23);

  // Fine contact Footer
  const footerY = pageHeight - 15;
  
  // Clean centered "Thank you" above the line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Thank you for choosing our safari services", pageWidth / 2, footerY - 8, { align: 'center' });

  // Draw footer line
  doc.setDrawColor(brandR, brandG, brandB);
  doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

  // Balanced contact details centered below the line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(brandR, brandG, brandB);
  const emailVal = branding?.pdfContactEmail || branding?.contactEmail || branding?.email || "reservations@safaricompany.com";
  const webVal = branding?.website || "www.safaricompany.com";
  const phoneVal = branding?.pdfContactPhone || branding?.contactPhone || branding?.phone || "+254 712 345678";
  doc.text(`Email: ${emailVal}   |   Website: ${webVal}   |   Tel: ${phoneVal}`, pageWidth / 2, footerY + 2, { align: 'center' });

  return doc.output('blob');
};

export const generateReceiptPDF = (payment: any, branding: any): Blob => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top corporate slate/navy banner
  const [brandR, brandG, brandB] = getBrandPrimaryRgb(branding);
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(15, 15, pageWidth - 30, 38, 'F');

  // Render custom logo if defined, otherwise default to orange badge helper
  let textX = 42;
  if (branding?.agencyLogo) {
    textX = 47;
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, 25, 16, 16, 1.5, 1.5, 'F');
      doc.addImage(branding.agencyLogo, 'PNG', 26, 26, 14, 14);
    } catch (e) {
      orangeBadgeFallback(doc);
      textX = 42;
    }
  } else {
    orangeBadgeFallback(doc);
  }

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(branding?.agencyName || branding?.appName || "Safari Planner Agency", textX, 31);

  // Subtitle/Email/Phone in banner left side
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240); 
  const pdfContactEmail = branding?.pdfContactEmail || branding?.contactEmail || 'sales@safari-agency.com';
  const pdfContactPhone = branding?.pdfContactPhone || branding?.contactPhone || '+254712345678';
  const pdfContactAddress = branding?.pdfContactAddress || branding?.contactAddress || 'Nairobi, Kenya';
  doc.text(`Email: ${pdfContactEmail}   |   Tel: ${pdfContactPhone}`, textX, 37);
  doc.text(`Address: ${pdfContactAddress}`, textX, 43);

  // Document Title label "RECEIPT"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("RECEIPT", pageWidth - 25, 33, { align: 'right' });

  // Receipt Reference Ref No.
  const recRef = payment.reference || `REC-${Date.now().toString().slice(-6)}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(241, 245, 249);
  doc.text(`Ref No. ${recRef.split(':')[0]}`, pageWidth - 25, 40, { align: 'right' });

  // Receipt Date
  const receiptDateStr = payment.date ? new Date(payment.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Receipt Date:  ${receiptDateStr}`, pageWidth - 25, 45, { align: 'right' });

  // Details Column Row Section
  let y = 63;
  doc.setDrawColor(brandR, brandG, brandB); 
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Headers for columns
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Paid By (Customer):", 20, y);
  doc.text("Payment Destination:", pageWidth / 2 + 10, y);

  y += 2;
  doc.line(20, y, pageWidth / 2 - 10, y);
  doc.line(pageWidth / 2 + 10, y, pageWidth - 20, y);
  y += 5;

  // Details content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB);

  const customerLines = [
    payment.customerName || 'Valued Safari Guest',
    payment.customerEmail ? `Email: ${payment.customerEmail}` : '',
    payment.customerPhone ? `Tel: ${payment.customerPhone}` : ''
  ].filter(Boolean);

  const agencyLines = [
    branding?.agencyName || branding?.appName || 'Safari Planner Agency Ltd',
    `Bank Route: ${payment.method || 'Direct Deposit'}`,
    `Ref: ${payment.reference || 'Booking Confirmation Payments'}`
  ].filter(Boolean);

  const maxLines = Math.max(customerLines.length, agencyLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (customerLines[i]) doc.text(customerLines[i], 20, y + (i * 4.5));
    if (agencyLines[i]) doc.text(agencyLines[i], pageWidth / 2 + 10, y + (i * 4.5));
  }

  y += (maxLines * 4.5) + 8;

  // Create clean Table row for payments
  const tableData = [[
    '1',
    payment.reference || 'Safari Tour Booking Transaction Settlement',
    payment.method || 'Bank Transfer',
    `$${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]];

  doc.autoTable({
    startY: y,
    head: [['No.', 'Description / Payment For', 'Payment Mode', 'Paid Amount (USD)']],
    body: tableData,
    margin: { left: 15, right: 15 },
    headStyles: { 
      fillColor: [brandR, brandG, brandB], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 8.5 
    },
    bodyStyles: { 
      textColor: [brandR, brandG, brandB], 
      fontSize: 8.5 
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let curY = finalY;

  // Subtotal block on the right
  const totalBoxWidth = 85;
  const totalsX = pageWidth - 15 - totalBoxWidth;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);

  doc.text("Received Net:", totalsX, curY);
  doc.text(`$${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY, { align: 'right' });
  curY += 5;

  // Draw Highlighted Total Box
  curY += 2;
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(totalsX - 4, curY - 4, totalBoxWidth + 4, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Total Settled:", totalsX, curY + 2.5);
  doc.text(`$${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY + 2.5, { align: 'right' });

  // Bottom Notes and Signature section
  const bottomY = Math.max(curY + 20, finalY + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Agency Receipt Guarantee", 20, bottomY);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);
  const guaranteeLines = doc.splitTextToSize("Your payment has been successfully recorded in our central booking engine. Confirmation vouchers and safari execution items are in preparation.", pageWidth - 40);
  doc.text(guaranteeLines, 20, bottomY + 7);

  // Signature on the right (Left blank for manual signature as requested)
  const sigX = pageWidth - 65;

  // Line for signature
  doc.setDrawColor(brandR, brandG, brandB);
  doc.setLineWidth(0.5);
  doc.line(sigX, bottomY + 19, pageWidth - 20, bottomY + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Receiver Signature & Stamp", sigX + 8, bottomY + 23);

  // Footer text
  const footerY = pageHeight - 15;
   // Clean centered "Thank you" above the line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Thank you for choosing our safari services", pageWidth / 2, footerY - 8, { align: 'center' });

  // Draw footer line
  doc.setDrawColor(brandR, brandG, brandB);
  doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

  // Balanced contact details centered below the line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(brandR, brandG, brandB);
  const emailVal = branding?.pdfContactEmail || branding?.contactEmail || branding?.email || "reservations@safaricompany.com";
  const webVal = branding?.website || "www.safaricompany.com";
  const phoneVal = branding?.pdfContactPhone || branding?.contactPhone || branding?.phone || "+254 712 345678";
  doc.text(`Email: ${emailVal}   |   Website: ${webVal}   |   Tel: ${phoneVal}`, pageWidth / 2, footerY + 2, { align: 'center' });

  return doc.output('blob');
};

export const generatePaymentVoucherPDF = (payment: any, branding: any): Blob => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Navy corporate banner
  const [brandR, brandG, brandB] = getBrandPrimaryRgb(branding);
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(15, 15, pageWidth - 30, 38, 'F');

  // Render custom logo if defined, otherwise default to orange badge helper
  let textX = 42;
  if (branding?.agencyLogo) {
    textX = 47;
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, 25, 16, 16, 1.5, 1.5, 'F');
      doc.addImage(branding.agencyLogo, 'PNG', 26, 26, 14, 14);
    } catch (e) {
      orangeBadgeFallback(doc);
      textX = 42;
    }
  } else {
    orangeBadgeFallback(doc);
  }

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(branding?.agencyName || branding?.appName || "Safari Planner Agency", textX, 31);

  // Subtitle/Email/Phone in banner left side
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240); 
  const pdfContactEmail = branding?.pdfContactEmail || branding?.contactEmail || 'finance@safaricompany.com';
  const pdfContactPhone = branding?.pdfContactPhone || branding?.contactPhone || '+254712345678';
  const pdfContactAddress = branding?.pdfContactAddress || branding?.contactAddress || 'Nairobi, Kenya';
  doc.text(`Email: ${pdfContactEmail}   |   Tel: ${pdfContactPhone}`, textX, 37);
  doc.text(`Address: ${pdfContactAddress}`, textX, 43);

  // Document Title label "PAYMENT VOUCHER"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18); 
  doc.setTextColor(255, 255, 255);
  doc.text("PAYMENT VOUCHER", pageWidth - 25, 33, { align: 'right' });

  // Voucher Reference No.
  const vchRef = payment.reference || `VCH-${Date.now().toString().slice(-6)}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(241, 245, 249);
  doc.text(`Ref No. ${vchRef.split(':')[0]}`, pageWidth - 25, 40, { align: 'right' });

  // Voucher Date
  const voucherDateStr = payment.date ? new Date(payment.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Voucher Date:  ${voucherDateStr}`, pageWidth - 25, 45, { align: 'right' });

  // Details Column Row Section
  let y = 63;
  doc.setDrawColor(brandR, brandG, brandB); 
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Headers for columns
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Paid To (Payee):", 20, y);
  doc.text("Disbursment Agency:", pageWidth / 2 + 10, y);

  y += 2;
  doc.line(20, y, pageWidth / 2 - 10, y);
  doc.line(pageWidth / 2 + 10, y, pageWidth - 20, y);
  y += 5;

  // Details content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB);

  const payeeLines = [
    payment.customerName || 'Valued Recipient',
    payment.customerEmail ? `Email: ${payment.customerEmail}` : '',
    payment.customerPhone ? `Tel: ${payment.customerPhone}` : ''
  ].filter(Boolean);

  const agencyLines = [
    branding?.agencyName || branding?.appName || 'Safari Planner Agency Ltd',
    `Method: ${payment.method || 'Direct Bank Settlement'}`,
    `Reference: ${payment.reference || 'Corporate Reimbursement'}`
  ].filter(Boolean);

  const maxLines = Math.max(payeeLines.length, agencyLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (payeeLines[i]) doc.text(payeeLines[i], 20, y + (i * 4.5));
    if (agencyLines[i]) doc.text(agencyLines[i], pageWidth / 2 + 10, y + (i * 4.5));
  }

  y += (maxLines * 4.5) + 8;

  // Table row for voucher disbursement details
  const tableData = [[
    '1',
    payment.reference || 'Approved Payment Voucher Disbursment',
    payment.method || 'Cash Desk / Transfer',
    `$${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]];

  doc.autoTable({
    startY: y,
    head: [['No.', 'Disbursement Category / Particulars', 'Sourcing Account', 'Voucher Amount (USD)']],
    body: tableData,
    margin: { left: 15, right: 15 },
    headStyles: { 
      fillColor: [brandR, brandG, brandB], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 8.5 
    },
    bodyStyles: { 
      textColor: [brandR, brandG, brandB], 
      fontSize: 8.5 
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let curY = finalY;

  // Subtotal block on the right
  const totalBoxWidth = 85;
  const totalsX = pageWidth - 15 - totalBoxWidth;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);

  doc.text("Voucher Total:", totalsX, curY);
  doc.text(`$${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY, { align: 'right' });
  curY += 5;

  // Draw Highlighted Total Box
  curY += 2;
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(totalsX - 4, curY - 4, totalBoxWidth + 4, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Net Paid Amount:", totalsX, curY + 2.5);
  doc.text(`$${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY + 2.5, { align: 'right' });

  // Bottom Notes and Signature section
  const bottomY = Math.max(curY + 20, finalY + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Compliance Statement", 20, bottomY);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);
  const complianceLines = doc.splitTextToSize("This disbursement voucher has been authorized by general bookkeeping and audit compliance workflows. All associated documentation has been verified as correct.", pageWidth - 40);
  doc.text(complianceLines, 20, bottomY + 7);

  // Signature on the right (Left blank for manual signature as requested)
  const sigX = pageWidth - 65;

  // Line for signature
  doc.setDrawColor(brandR, brandG, brandB);
  doc.setLineWidth(0.5);
  doc.line(sigX, bottomY + 19, pageWidth - 20, bottomY + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Approved & Audited By", sigX + 11, bottomY + 23);

  // Footer text
  const footerY = pageHeight - 15;
  
  // Clean centered "Thank you" above the line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Thank you for choosing our safari services", pageWidth / 2, footerY - 8, { align: 'center' });

  // Draw footer line
  doc.setDrawColor(brandR, brandG, brandB);
  doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

  // Balanced contact details centered below the line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(brandR, brandG, brandB);
  const emailVal = branding?.pdfContactEmail || branding?.contactEmail || branding?.email || "finance@safaricompany.com";
  const webVal = branding?.website || "www.safaricompany.com";
  const phoneVal = branding?.pdfContactPhone || branding?.contactPhone || branding?.phone || "+254 712 345678";
  doc.text(`Email: ${emailVal}   |   Website: ${webVal}   |   Tel: ${phoneVal}`, pageWidth / 2, footerY + 2, { align: 'center' });

  return doc.output('blob');
};

export const generateSupplierVoucherPDF = (data: any, groupedItems?: any, branding?: BrandingConfig): Blob => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Navy corporate banner
  const [brandR, brandG, brandB] = getBrandPrimaryRgb(branding);
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(15, 15, pageWidth - 30, 38, 'F');

  // Render custom logo if defined, otherwise default to orange badge helper
  let textX = 42;
  if (branding?.agencyLogo) {
    textX = 47;
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(25, 25, 16, 16, 1.5, 1.5, 'F');
      doc.addImage(branding.agencyLogo, 'PNG', 26, 26, 14, 14);
    } catch (e) {
      orangeBadgeFallback(doc);
      textX = 42;
    }
  } else {
    orangeBadgeFallback(doc);
  }

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(branding?.agencyName || branding?.appName || "Safari Planner Agency", textX, 31);

  // Subtitle/Email/Phone in banner left side
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240); 
  const pdfContactEmail = branding?.pdfContactEmail || branding?.contactEmail || 'accounts@safari-agency.com';
  const pdfContactPhone = branding?.pdfContactPhone || branding?.contactPhone || '+254712345678';
  const pdfContactAddress = branding?.pdfContactAddress || branding?.contactAddress || 'Nairobi, Kenya';
  doc.text(`Email: ${pdfContactEmail}   |   Tel: ${pdfContactPhone}`, textX, 37);
  doc.text(`Address: ${pdfContactAddress}`, textX, 43);

  // Document Title label "SUPPLIER VOUCHER"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("SUPPLIER VOUCHER", pageWidth - 25, 33, { align: 'right' });

  // Voucher Reference No.
  const vchRef = data.id || `SPL-${Date.now().toString().slice(-6)}`;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(241, 245, 249);
  doc.text(`Ref No. ${vchRef}`, pageWidth - 25, 40, { align: 'right' });

  // Allocation Date
  const allocationDateStr = data.date ? new Date(data.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Allocation Date: ${allocationDateStr}`, pageWidth - 25, 45, { align: 'right' });

  // Details Column Row Section
  let y = 63;
  doc.setDrawColor(brandR, brandG, brandB); 
  doc.setLineWidth(0.5);
  doc.line(15, y, pageWidth - 15, y);
  y += 6;

  // Headers for columns
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Supplier Sourcing:", 20, y);
  doc.text("Associated Safari Booking:", pageWidth / 2 + 10, y);

  y += 2;
  doc.line(20, y, pageWidth / 2 - 10, y);
  doc.line(pageWidth / 2 + 10, y, pageWidth - 20, y);
  y += 5;

  // Details content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(brandR, brandG, brandB);

  const supplierLines = [
    data.supplierName || 'Primary Ground Handlers & Lodges',
    `Allocation Run: ${data.method || 'Partner Cost Allocations'}`,
    `Disbursement Agent: Internal Accounts Team`
  ].filter(Boolean);

  const bookingLines = [
    data.tripTitle || 'Safari Tour Package',
    `Booking ID: ${data.itineraryId ? data.itineraryId.slice(0, 8).toUpperCase() : 'N/A'}`,
    `Reference: ${data.reference || 'Supplier Settlements'}`
  ].filter(Boolean);

  const maxLines = Math.max(supplierLines.length, bookingLines.length);
  for (let i = 0; i < maxLines; i++) {
    if (supplierLines[i]) doc.text(supplierLines[i], 20, y + (i * 4.5));
    if (bookingLines[i]) doc.text(bookingLines[i], pageWidth / 2 + 10, y + (i * 4.5));
  }

  y += (maxLines * 4.5) + 8;

  // Flatten items for table
  let tableData: any[] = [];
  let index = 1;
  let totalCalculated = 0;
  
  if (groupedItems) {
    Object.entries(groupedItems).forEach(([type, group]: [string, any]) => {
      if (group.items && group.items.length > 0) {
        group.items.forEach((item: any) => {
          tableData.push([
            `${index++}`,
            `[${type}] ${item.description}`,
            item.quantity ? `${item.quantity}` : '1',
            `$${(item.unitPrice || item.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `$${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ]);
          totalCalculated += item.total;
        });
      }
    });
  }

  if (tableData.length === 0) {
    tableData = [[
      '1',
      data.reference || 'Comprehensive supplier cost allocation',
      '1',
      `$${data.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `$${data.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]];
    totalCalculated = data.amount || 0;
  }

  doc.autoTable({
    startY: y,
    head: [['No.', 'Supplier Item & Particulars', 'Qty/Pax', 'Cost (USD)', 'Total (USD)']],
    body: tableData,
    margin: { left: 15, right: 15 },
    headStyles: { 
      fillColor: [brandR, brandG, brandB], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 8.5 
    },
    bodyStyles: { 
      textColor: [brandR, brandG, brandB], 
      fontSize: 8.5 
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let curY = finalY;

  // Subtotal block on the right
  const totalBoxWidth = 85;
  const totalsX = pageWidth - 15 - totalBoxWidth;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);

  doc.text("Accumulated Costs:", totalsX, curY);
  doc.text(`$${totalCalculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY, { align: 'right' });
  curY += 5;

  // Draw Highlighted Total Box
  curY += 2;
  doc.setFillColor(brandR, brandG, brandB);
  doc.rect(totalsX - 4, curY - 4, totalBoxWidth + 4, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Approved Settle Total:", totalsX, curY + 2.5);
  doc.text(`$${totalCalculated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, curY + 2.5, { align: 'right' });

  // Bottom Notes and Signature section
  const bottomY = Math.max(curY + 20, finalY + 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Cost Allocation Notice", 20, bottomY);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(brandR, brandG, brandB);
  const costNoticeLines = doc.splitTextToSize("Supplier disbursement values correspond precisely to contracted rates on lodge rooms, park entries, and transport assets. Payables are settled on dynamic schedules.", pageWidth - 40);
  doc.text(costNoticeLines, 20, bottomY + 7);

  // Signature on the right (Left blank for manual signature as requested)
  const sigX = pageWidth - 65;

  // Line for signature
  doc.setDrawColor(brandR, brandG, brandB);
  doc.setLineWidth(0.5);
  doc.line(sigX, bottomY + 19, pageWidth - 20, bottomY + 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Operations Approval Sign-off", sigX + 4, bottomY + 23);

  // Footer text
  const footerY = pageHeight - 15;
  
  // Clean centered "Thank you" above the line
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(brandR, brandG, brandB);
  doc.text("Thank you for choosing our safari services", pageWidth / 2, footerY - 8, { align: 'center' });

  // Draw footer line
  doc.setDrawColor(brandR, brandG, brandB);
  doc.line(15, footerY - 4, pageWidth - 15, footerY - 4);

  // Balanced contact details centered below the line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(brandR, brandG, brandB);
  const emailVal = branding?.pdfContactEmail || branding?.contactEmail || branding?.email || "finance@safaricompany.com";
  const webVal = branding?.website || "www.safaricompany.com";
  const phoneVal = branding?.pdfContactPhone || branding?.contactPhone || branding?.phone || "+254 712 345678";
  doc.text(`Email: ${emailVal}   |   Website: ${webVal}   |   Tel: ${phoneVal}`, pageWidth / 2, footerY + 2, { align: 'center' });

  return doc.output('blob');
};
