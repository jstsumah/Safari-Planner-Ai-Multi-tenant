
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GeneratedItinerary, SafariFormData, CostingReport, Payment, BrandingConfig } from '../types';

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export const generateItineraryPDF = (itinerary: GeneratedItinerary, formData: SafariFormData, branding: BrandingConfig): Blob => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const primaryRGB = hexToRgb(branding?.primaryColor || '#8f8664');

  doc.setFillColor(...primaryRGB); 
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Safari Itinerary Proposal", 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Prepared for: ${formData.name} (${formData.country})`, 14, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 30);
  
  doc.setFontSize(10);
  doc.text(`Party: ${formData.adults} Ad, ${formData.youngAdults} Tn, ${formData.children} Ch`, 14, 36);

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(16);
  doc.text(itinerary.tripTitle, 14, 50);

  doc.setFontSize(10);
  doc.text(doc.splitTextToSize(itinerary.summary, 180), 14, 60);

  let finalY = 80;

  doc.setFontSize(12);
  doc.setTextColor(115, 106, 79);
  doc.text("Trip Highlights", 14, finalY);
  finalY += 6;
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  itinerary.highlights.forEach((highlight) => {
    doc.text(`• ${highlight}`, 18, finalY);
    finalY += 5;
  });
  finalY += 10;

  const tableData = itinerary.schedule.map(day => {
    const dayPrefix = day.dayLabel 
        ? (day.dayLabel.match(/^day/i) ? day.dayLabel : `Day ${day.dayLabel}`)
        : `Day ${day.day}`;

    return [
      dayPrefix,
      day.title,
      `${day.morningActivity}\n${day.afternoonActivity}`,
      day.accommodation,
      day.driveTime
    ];
  });

  autoTable(doc, {
    startY: finalY,
    head: [['Day', 'Title', 'Activities', 'Lodge', 'Drive Time']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: primaryRGB, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 20 },
      2: { cellWidth: 60 },
      4: { cellWidth: 25 }
    }
  });

  // @ts-expect-error: jspdf-autotable adds lastAutoTable to jsPDF instance
  let finalYAfterTable = doc.lastAutoTable?.finalY || finalY;
  finalYAfterTable += 10;

  // Includes & Excludes Section
  if ((itinerary.includes && itinerary.includes.length > 0) || (itinerary.excludes && itinerary.excludes.length > 0)) {
    // Check if we need a new page
    if (finalYAfterTable > pageHeight - 60) {
      doc.addPage();
      finalYAfterTable = 20;
    }

    const startX = 14;
    const colWidth = (pageWidth - 28) / 2;

    // Includes
    if (itinerary.includes && itinerary.includes.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(115, 106, 79);
      doc.text("What's Included", startX, finalYAfterTable);
      finalYAfterTable += 6;
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      itinerary.includes.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item}`, colWidth - 5);
        doc.text(lines, startX + 2, finalYAfterTable);
        finalYAfterTable += (lines.length * 4) + 1;
      });
    }

    // Reset Y for Excludes if needed, or continue below
    let excludesY = finalYAfterTable + 5;
    if (itinerary.excludes && itinerary.excludes.length > 0) {
      if (excludesY > pageHeight - 40) {
        doc.addPage();
        excludesY = 20;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(115, 106, 79);
      doc.text("What's Excluded", startX, excludesY);
      excludesY += 6;
      
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      itinerary.excludes.forEach((item) => {
        const lines = doc.splitTextToSize(`• ${item}`, colWidth - 5);
        doc.text(lines, startX + 2, excludesY);
        excludesY += (lines.length * 4) + 1;
      });
      finalYAfterTable = excludesY;
    }
  }

  const lastTableY = finalYAfterTable;
  
  doc.setFontSize(12);
  doc.setTextColor(115, 106, 79);
  
  const costText = `Estimated Total Cost: ${itinerary.totalEstimatedCost}`;
  const splitCostText = doc.splitTextToSize(costText, pageWidth - 28);
  const costBlockHeight = splitCostText.length * 6; 

  let footerStartY = pageHeight - 25 - costBlockHeight;

  if (lastTableY > footerStartY - 10) {
    doc.addPage();
    footerStartY = pageHeight - 25 - costBlockHeight;
  }

  doc.text(splitCostText, 14, footerStartY);

  doc.setFontSize(8);
  doc.setTextColor(150);
  const agencyName = branding.agencyName || 'Custom Safari Planner AI';
  const contactInfo = [
    branding.contactEmail && `Email: ${branding.contactEmail}`,
    branding.contactPhone && `Phone: ${branding.contactPhone}`,
    branding.contactAddress && `Address: ${branding.contactAddress}`
  ].filter(Boolean).join(' | ');
  
  doc.text(agencyName, 14, pageHeight - 14);
  if (contactInfo) {
    doc.text(contactInfo, 14, pageHeight - 10);
  }

  return doc.output('blob');
};

export const generateInvoicePDF = (report: CostingReport, formData: SafariFormData, itineraryTitle: string, invoiceNumber: string, branding: BrandingConfig, payments: Payment[] = []): Blob => {
  const doc = new jsPDF();
  const primaryRGB = hexToRgb(branding?.primaryColor || '#8f8664');
  
  doc.setFillColor(...primaryRGB); 
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("INVOICE", 14, 25);
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoiceNumber}`, 150, 15);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 22);
  doc.text(`Due Date: ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 150, 29);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(formData.name, 14, 62);
  doc.text(formData.email, 14, 69);
  doc.text(formData.country, 14, 76);

  doc.setFont("helvetica", "bold");
  doc.text("FROM:", 120, 55);
  doc.setFont("helvetica", "normal");
  doc.text(branding.agencyName || "Soroi Safari Co.", 120, 62);
  doc.text(branding.contactAddress || "123 Wild Way, Nairobi", 120, 69);
  doc.text(branding.contactPhone || "Kenya", 120, 76);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Project: ${itineraryTitle}`, 14, 95);
  doc.text(`Party: ${formData.adults} Adults, ${formData.youngAdults} Teens, ${formData.children} Children`, 14, 101);

  const tableData = report.items.map(item => [
    item.type,
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toLocaleString()}`,
    `$${item.total.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 110,
    head: [['Category', 'Description', 'Qty', 'Rate', 'Total']],
    body: tableData,
    headStyles: { fillColor: primaryRGB },
    styles: { fontSize: 9 }
  });

  // @ts-expect-error: jspdf-autotable adds lastAutoTable to jsPDF instance
  let currentY = doc.lastAutoTable?.finalY || 110;
  
  if (payments && payments.length > 0) {
    currentY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PAYMENTS RECEIVED:", 14, currentY);
    currentY += 5;
    
    payments.forEach(p => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${new Date(p.date).toLocaleDateString()} - ${p.method} (${p.reference})`, 14, currentY);
      doc.text(`-$${p.amount.toLocaleString()}`, 195, currentY, { align: 'right' });
      currentY += 5;
    });
  }

  currentY += 10;
  const labelX = 135;
  const valueX = 195;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  doc.text("Subtotal:", labelX, currentY);
  doc.text(`$${report.subtotal.toLocaleString()}`, valueX, currentY, { align: 'right' });
  
  doc.text(`Markup (${report.markupPercentage}%):`, labelX, currentY + 8);
  doc.text(`$${report.markupAmount.toLocaleString()}`, valueX, currentY + 8, { align: 'right' });
  
  doc.text(`Tax (${report.taxPercentage}%):`, labelX, currentY + 16);
  doc.text(`$${report.taxAmount.toLocaleString()}`, valueX, currentY + 16, { align: 'right' });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = Math.max(0, Math.round(report.total) - totalPaid);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Total Project Price:", labelX, currentY + 28);
  doc.text(`$${Math.round(report.total).toLocaleString()}`, valueX, currentY + 28, { align: 'right' });

  doc.setFontSize(14);
  doc.setTextColor(balanceDue > 0 ? [180, 0, 0] : [0, 150, 0]);
  doc.text("BALANCE DUE:", labelX, currentY + 38);
  doc.text(`$${balanceDue.toLocaleString()}`, valueX, currentY + 38, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  const agencyName = branding.agencyName || 'Custom Safari Planner AI';
  const contactInfo = [
    branding.contactEmail && `Email: ${branding.contactEmail}`,
    branding.contactPhone && `Phone: ${branding.contactPhone}`,
    branding.contactAddress && `Address: ${branding.contactAddress}`
  ].filter(Boolean).join(' | ');
  
  doc.text(agencyName, 14, 280);
  if (contactInfo) {
    doc.text(contactInfo, 14, 285);
  }

  return doc.output('blob');
};

/**
 * RESTORED: Individual Payment Voucher (Client Acknowledgement)
 */
export const generatePaymentVoucherPDF = (payment: Payment, branding: BrandingConfig): Blob => {
  const doc = new jsPDF();
  const primaryRGB = hexToRgb(branding?.primaryColor || '#8f8664');
  
  doc.setFillColor(...primaryRGB); 
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("PAYMENT VOUCHER", 14, 25);
  
  doc.setFontSize(10);
  doc.text(`Voucher #: VCH-${payment.id.slice(0, 8).toUpperCase()}`, 150, 15);
  doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 150, 22);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("ACCOUNT OF:", 14, 60);
  doc.setFont("helvetica", "normal");
  doc.text(payment.customerName, 14, 67);

  doc.setFont("helvetica", "bold");
  doc.text("TRIP REFERENCE:", 14, 85);
  doc.setFont("helvetica", "normal");
  doc.text(payment.tripTitle, 14, 92);

  autoTable(doc, {
    startY: 110,
    head: [['Description', 'Method', 'Reference', 'Amount']],
    body: [
      [
        'Safari Booking Installment', 
        payment.method, 
        payment.reference || 'N/A', 
        `$${payment.amount.toLocaleString()}`
      ]
    ],
    headStyles: { fillColor: primaryRGB }, 
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // @ts-expect-error: jspdf-autotable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable.finalY + 20;
  
  doc.setFontSize(10);
  doc.text("NOTES:", 14, finalY);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Payment confirmed and allocated to itinerary.", 14, finalY + 7);

  doc.setFillColor(245, 244, 240); 
  doc.rect(130, finalY - 10, 65, 25, 'F');
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("VOUCHER TOTAL:", 135, finalY + 7);
  doc.text(`$${payment.amount.toLocaleString()}`, 190, finalY + 7, { align: 'right' });

  doc.setFontSize(9);
  doc.text("__________________________", 14, 260);
  doc.text("Authorized Signature", 14, 266);

  doc.text("__________________________", 135, 260);
  doc.text("Receiver Signature", 135, 266);

  return doc.output('blob');
};

/**
 * RENAMED: Supplier Disbursement Plan / Supplier Voucher
 */
export const generateSupplierVoucherPDF = (voucherInfo: Payment, groupedItems: any, branding: BrandingConfig): Blob => {
  const doc = new jsPDF();
  const primaryRGB = hexToRgb(branding?.primaryColor || '#8f8664');
  
  // Header
  doc.setFillColor(...primaryRGB); 
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("SUPPLIER PAYMENT VOUCHER", 14, 20);
  
  doc.setFontSize(10);
  doc.text(`Voucher #: ${voucherInfo.id}`, 145, 15);
  doc.text(`Date: ${new Date(voucherInfo.date).toLocaleDateString()}`, 145, 22);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PROJECT ALLOCATION SUMMARY:", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.text(voucherInfo.tripTitle, 14, 62);
  doc.text(`Reference: ${voucherInfo.reference}`, 14, 69);

  let currentY = 80;

  // Process grouped categories
  Object.entries(groupedItems).forEach(([category, group]: [string, any]) => {
    if (group.items.length === 0) return;

    // Category Header
    doc.setFillColor(240, 239, 230);
    doc.rect(14, currentY, 181, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${category.toUpperCase()} ALLOCATIONS`, 18, currentY + 5.5);
    currentY += 12;

    const tableData = group.items.map((item: any) => [
      item.description,
      item.quantity.toString(),
      `$${item.unitPrice.toLocaleString()}`,
      `$${item.total.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      theme: 'plain',
      headStyles: { fontStyle: 'bold', textColor: [100, 100, 100], fontSize: 8 },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } }
    });

    // @ts-expect-error: jspdf-autotable adds lastAutoTable to jsPDF instance
    currentY = doc.lastAutoTable.finalY + 5;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal ${category}:`, 140, currentY);
    doc.text(`$${group.subtotal.toLocaleString()}`, 195, currentY, { align: 'right' });
    currentY += 12;

    // Check for page overflow
    if (currentY > 260) {
        doc.addPage();
        currentY = 20;
    }
  });

  // Final Grand Total
  currentY += 5;
  doc.setLineWidth(0.5);
  doc.line(120, currentY, 195, currentY);
  currentY += 10;
  
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text("TOTAL DISBURSEMENT:", 120, currentY);
  doc.text(`$${voucherInfo.amount.toLocaleString()}`, 195, currentY, { align: 'right' });

  // Signatures
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("__________________________", 14, 260);
  doc.text("Prepared By (Accounts)", 14, 266);
  
  doc.text("__________________________", 135, 260);
  doc.text("Authorized For Payment", 135, 266);

  return doc.output('blob');
};

export const generateReceiptPDF = (payment: Payment, branding: BrandingConfig): Blob => {
  const doc = new jsPDF();
  const primaryRGB = hexToRgb(branding?.primaryColor || '#8f8664');
  
  doc.setFillColor(...primaryRGB); 
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("OFFICIAL RECEIPT", 14, 25);
  
  doc.setFontSize(10);
  doc.text(`Receipt #: RCT-${payment.id.slice(0, 8).toUpperCase()}`, 150, 15);
  doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 150, 22);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIVED FROM:", 14, 60);
  doc.setFont("helvetica", "normal");
  doc.text(payment.customerName, 14, 67);

  doc.setFont("helvetica", "bold");
  doc.text("IN PAYMENT OF:", 14, 85);
  doc.setFont("helvetica", "normal");
  doc.text(payment.tripTitle, 14, 92);

  autoTable(doc, {
    startY: 110,
    head: [['Transaction Date', 'Payment Method', 'Reference', 'Amount']],
    body: [
      [
        new Date(payment.date).toLocaleDateString(), 
        payment.method, 
        payment.reference || 'N/A', 
        `$${payment.amount.toLocaleString()}`
      ]
    ],
    headStyles: { fillColor: primaryRGB }, 
    styles: { fontSize: 10, cellPadding: 5 }
  });

  // @ts-expect-error: jspdf-autotable adds lastAutoTable to jsPDF instance
  const finalY = doc.lastAutoTable.finalY + 20;
  
  doc.setFontSize(10);
  doc.text("AMOUNT IN WORDS:", 14, finalY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");
  doc.text(`*** ${payment.amount.toLocaleString()} US DOLLARS ***`, 14, finalY + 7);

  doc.setFillColor(232, 245, 233); 
  doc.rect(130, finalY - 10, 65, 25, 'F');
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("TOTAL PAID:", 135, finalY + 7);
  doc.text(`$${payment.amount.toLocaleString()}`, 190, finalY + 7, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("We acknowledge with thanks the receipt of the above mentioned payment.", 14, finalY + 40);

  doc.text("__________________________", 135, finalY + 60);
  doc.text("Accounts Department", 135, finalY + 67);

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150);
  doc.text(`${branding.agencyName || "Soroi Safari Co."} | ${branding.contactAddress || "123 Wild Way, Nairobi"} | ${branding.financeEmail || "finance@soroi.com"}`, 14, 280);

  return doc.output('blob');
};
