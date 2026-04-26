import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GeneratedItinerary, SafariFormData, BrandingConfig } from '../types';

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

export const generateInvoicePDF = (report: CostingReport, formData: SafariFormData, tripTitle: string, invoiceNumber: string): Blob => {
  const doc = new jsPDF() as any;
  doc.setFontSize(20);
  doc.text("INVOICE", 20, 20);
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoiceNumber}`, 20, 30);
  doc.text(`Trip: ${tripTitle}`, 20, 35);
  doc.text(`Client: ${formData.name}`, 20, 40);

  const tableData = report.items.map(item => [
    item.description,
    item.quantity.toString(),
    `$${item.unitPrice.toLocaleString()}`,
    `$${item.total.toLocaleString()}`
  ]);

  doc.autoTable({
    startY: 50,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    foot: [['', '', 'Total Amount:', `$${report.total.toLocaleString()}`]],
  });

  return doc.output('blob');
};

export const generateReceiptPDF = (payment: any, branding: any): Blob => {
  const doc = new jsPDF() as any;
  doc.setFontSize(20);
  doc.setTextColor(branding.primaryColor || '#8f8664');
  doc.text("RECEIPT", 20, 20);
  doc.setFontSize(10);
  doc.text(`Date: ${payment.date}`, 20, 30);
  doc.text(`Customer: ${payment.customerName}`, 20, 35);
  doc.text(`Reference: ${payment.reference}`, 20, 40);
  doc.text(`Amount Paid: $${payment.amount.toLocaleString()}`, 20, 50);
  doc.text(`Payment Method: ${payment.method}`, 20, 55);
  return doc.output('blob');
};

export const generatePaymentVoucherPDF = (payment: any, branding?: any): Blob => {
  const doc = new jsPDF() as any;
  doc.setFontSize(20);
  if (branding?.primaryColor) {
    doc.setTextColor(branding.primaryColor);
  }
  doc.text("PAYMENT VOUCHER", 20, 20);
  doc.setFontSize(10);
  doc.text(`Payee: ${payment.customerName}`, 20, 30);
  doc.text(`Amount: $${payment.amount.toLocaleString()}`, 20, 35);
  doc.text(`Method: ${payment.method}`, 20, 40);
  doc.text(`Reference: ${payment.reference}`, 20, 45);
  return doc.output('blob');
};

export const generateSupplierVoucherPDF = (data: any): Blob => {
  const doc = new jsPDF() as any;
  doc.setFontSize(20);
  doc.text("SUPPLIER VOUCHER", 20, 20);
  doc.setFontSize(10);
  doc.text(`Supplier: ${data.supplierName || 'Global Suppliers'}`, 20, 30);
  doc.text(`Amount: $${data.amount?.toLocaleString()}`, 20, 35);
  return doc.output('blob');
};
