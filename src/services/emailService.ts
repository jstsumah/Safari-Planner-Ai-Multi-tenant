import { SafariFormData, GeneratedItinerary, BrandingConfig } from "../types";

export const generateEmailHtml = (formData: SafariFormData, itinerary: GeneratedItinerary, branding?: BrandingConfig): string => {
  const appName = branding?.appName || "SafariPlanner.ai";
  return `
    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
      <h1 style="color: #8f8664;">Safari Booking Request</h1>
      <p>A new safari has been designed and a booking request has been initiated.</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Trip Details</h2>
        <p><strong>Title:</strong> ${itinerary.tripTitle}</p>
        <p><strong>Summary:</strong> ${itinerary.summary}</p>
        <p><strong>Estimated Cost:</strong> ${itinerary.totalEstimatedCost}</p>
      </div>

      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Guest Information</h2>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Guests:</strong> ${formData.adults} Adults, ${formData.youngAdults} Young Adults, ${formData.children} Children</p>
        <p><strong>Start Date:</strong> ${formData.startDate}</p>
        <p><strong>Duration:</strong> ${formData.durationDays} Days</p>
      </div>

      <p>Please find the detailed PDF itinerary attached to this email.</p>
      
      <footer style="margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
        Sent via ${appName}
      </footer>
    </div>
  `;
};

interface SendEmailParams {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  attachment?: {
    content: string; // base64
    filename: string;
  };
}

export const sendSafariEmail = async (params: SendEmailParams): Promise<void> => {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  const text = await response.text();
  let data;
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        // ignore
      }
    }
    throw new Error(data?.message || data?.error || `Failed to send email (Status ${response.status})`);
  }
};
