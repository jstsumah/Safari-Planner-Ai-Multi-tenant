import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import { expand } from 'dotenv-expand';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();
// Fallback to .env.example if running in dev and .env is missing or incomplete
if (process.env.NODE_ENV !== 'production') {
  const examplePath = path.join(process.cwd(), '.env.example');
  const exampleEnv = dotenv.config({ path: examplePath });
  if (exampleEnv.parsed) {
    Object.keys(exampleEnv.parsed).forEach(key => {
      const val = exampleEnv.parsed![key];
      if (val && (!process.env[key] || process.env[key] === '')) {
        process.env[key] = val;
      }
    });
  }
}
const myEnv = { parsed: process.env }; // Mock the object for expand
expand(myEnv as any);

const PESAPAL_CONSUMER_KEY = (process.env.PESAPAL_CONSUMER_KEY || '').trim();
const PESAPAL_CONSUMER_SECRET = (process.env.PESAPAL_CONSUMER_SECRET || '').trim();
const PESAPAL_RAW_MODE = (process.env.PESAPAL_MODE || 'sandbox').trim().toLowerCase();
const PESAPAL_MODE = (PESAPAL_RAW_MODE === 'production' || PESAPAL_RAW_MODE === 'live') ? 'production' : 'sandbox';
const PESAPAL_IPN_ID = (process.env.PESAPAL_IPN_ID || '').trim();

const PESAPAL_URL = PESAPAL_MODE === 'production' 
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

console.log(`[Server] NODE_ENV: [${process.env.NODE_ENV}]`);
console.log('--- PesaPal Config Diagnostic ---');
console.log(`RAW_MODE_ENV: [${process.env.PESAPAL_MODE}]`);
console.log(`EVALUATED_MODE: [${PESAPAL_MODE}]`);
console.log(`BASE_URL: [${PESAPAL_URL}]`);
console.log(`KEY: [${PESAPAL_CONSUMER_KEY.substring(0, 5)}...${PESAPAL_CONSUMER_KEY.slice(-3)}] (len: ${PESAPAL_CONSUMER_KEY.length})`);
console.log(`SECRET: [${PESAPAL_CONSUMER_SECRET.substring(0, 3)}...${PESAPAL_CONSUMER_SECRET.slice(-3)}] (len: ${PESAPAL_CONSUMER_SECRET.length})`);
console.log('--------------------------------');

async function getPesaPalToken() {
  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
    throw new Error('PesaPal credentials missing');
  }

  const tokenUrl = `${PESAPAL_URL}/api/Auth/RequestToken`;
  console.log(`[PesaPal] Requesting token from: ${tokenUrl}`);
  console.log(`[PesaPal] Using Key: ${PESAPAL_CONSUMER_KEY.substring(0, 4)}...${PESAPAL_CONSUMER_KEY.slice(-4)}`);
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET
      })
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      console.error(`[PesaPal] Non-JSON response from ${tokenUrl}:`, errorText.substring(0, 500));
      throw new Error(`PesaPal API returned an unexpected response (Status ${response.status}). The service might be down or the URL is incorrect.`);
    }

    const data = await response.json();
    console.log(`[PesaPal] Token Response Status: ${response.status}`);
    console.log(`[PesaPal] API Response JSON: ${JSON.stringify(data)}`);
    
    // Aggressively check for error responses
    if (data.error || (data.status && data.status !== "200" && data.status !== 200)) {
      const errorCode = data.error?.code || data.code || 'unknown_error';
      const errorMsg = data.error?.message || data.message || 'Unknown API Error';
      
      let detail = "";
      if (errorCode === "invalid_consumer_key_or_secret_provided") {
        detail = `The Consumer Key or Secret provided does not match the current environment (${PESAPAL_MODE}). ` +
                 `If these are LIVE keys, set PESAPAL_MODE=production. If they are SANDBOX keys, set PESAPAL_MODE=sandbox. ` +
                 `Current URL: ${PESAPAL_URL}`;
      }
      
      console.error(`[PesaPal] Auth Failure [${errorCode}]: ${errorMsg}`);
      console.error(`[PesaPal] Detail: ${detail}`);
      throw new Error(`PesaPal Auth Failed: ${errorCode}. ${detail}`);
    }

    if (!response.ok) {
      throw new Error(`Connection to PesaPal failed with status ${response.status}`);
    }

    const token = data.token || data.access_token;
    if (!token) {
      throw new Error('PesaPal response received but no token found. Check if you are using V3 keys.');
    }

    return token;
  } catch (error: any) {
    console.error('[PesaPal] getPesaPalToken error:', error);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Security headers
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  }));

  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // --- API ROUTES ---

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // DEBUG ENDPOINT
  app.get('/api/pesapal/test-config', async (req, res) => {
    try {
      const token = await getPesaPalToken();
      res.json({ 
        success: true, 
        token_preview: token.substring(0, 10) + '...',
        mode: PESAPAL_MODE,
        url: PESAPAL_URL
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        mode: PESAPAL_MODE,
        url: PESAPAL_URL,
        key_len: PESAPAL_CONSUMER_KEY.length,
        secret_len: PESAPAL_CONSUMER_SECRET.length
      });
    }
  });

  app.post('/api/pesapal/submit-order', async (req, res) => {
    const { plan, companyId, email } = req.body;
    const amount = plan === 'pro' ? 60.00 : 30.00;
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }

    if (!PESAPAL_IPN_ID) {
      return res.status(500).json({ error: 'PESAPAL_IPN_ID is not configured. Please register an IPN URL in PesaPal dashboard.' });
    }
    
    try {
      const token = await getPesaPalToken();
      // Use full companyId in reference to allow identification. 
      // PesaPal V3 reference limit is usually 50 chars. SP (2) + "-" (1) + UUID (36) = 39 chars.
      const merchantReference = `SP-${companyId}`;
      
      // Use full URL if available, otherwise try to construct it or use a placeholder
      const baseUrl = process.env.APP_URL || process.env.SHARED_APP_URL || "";
      // Use /success as it's already a route in App.tsx
      const callbackUrl = baseUrl ? `${baseUrl}/success` : "https://safariplanner.style-upsystems.com/success";

      console.log(`[PesaPal] Using IPN_ID: [${PESAPAL_IPN_ID}]`);
      console.log(`[PesaPal] Using Callback URL: [${callbackUrl}]`);
      console.log(`[PesaPal] Using Merchant Ref: [${merchantReference}]`);

      const payload = {
        id: merchantReference,
        currency: "USD",
        amount: amount,
        description: `SafariPlanner ${plan} Plan Subscription`,
        callback_url: callbackUrl,
        notification_id: PESAPAL_IPN_ID,
        billing_address: {
          email_address: email || "billing@wildrhythm.com",
          phone_number: "",
          country_code: "KE",
          first_name: "Customer",
          middle_name: "",
          last_name: (companyId || "Client").substring(0, 8),
          line_1: "",
          line_2: "",
          city: "Nairobi",
          state: "",
          postal_code: "",
          zip_code: ""
        }
      };

      console.log(`[PesaPal] Payload: ${JSON.stringify(payload)}`);

      const response = await fetch(`${PESAPAL_URL}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('[PesaPal] SubmitOrder Non-JSON response:', errorText.substring(0, 500));
        throw new Error(`PesaPal API returned an unexpected response format during transaction submission (Status ${response.status})`);
      }

      const data = await response.json();
      console.log(`[PesaPal] SubmitOrder Response Status: ${response.status}`);
      console.log(`[PesaPal] SubmitOrder Response Data: ${JSON.stringify(data)}`);
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `PesaPal SubmitOrderRequest failed (Status ${response.status})`);
      }

      const redirectUrl = data.redirect_url || data.url || data.redirectUrl;
      const orderTrackingId = data.order_tracking_id || data.orderTrackingId;

      if (!redirectUrl) {
        console.error('[PesaPal] Missing redirect_url in response:', data);
        throw new Error(`PesaPal returned successful status but no redirect URL. Message: ${data.message || 'None'}`);
      }

      res.json({ 
        redirect_url: redirectUrl, 
        order_tracking_id: orderTrackingId 
      });
    } catch (error: any) {
      console.error('PesaPal Submit Order Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/pesapal/transaction-status', async (req, res) => {
    const { OrderTrackingId } = req.query;
    if (!OrderTrackingId) return res.status(400).json({ error: 'OrderTrackingId is required' });

    try {
      const token = await getPesaPalToken();
      const response = await fetch(`${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('[PesaPal] GetTransactionStatus Non-JSON response:', errorText.substring(0, 500));
        throw new Error(`PesaPal API returned an unexpected response format while fetching status (Status ${response.status})`);
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to get PesaPal transaction status');
      }

      res.json(data);
    } catch (error: any) {
      console.error('PesaPal Status Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // HELPER TO GET IPN ID: Visit this URL to get your IPN_ID
  app.get('/api/pesapal/register-ipn', async (req, res) => {
    try {
      const token = await getPesaPalToken();
      const ipnUrl = "https://safariplanner.style-upsystems.com/api/pesapal/ipn";
      
      const response = await fetch(`${PESAPAL_URL}/api/URLRegistration/RegisterIPN`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          url: ipnUrl,
          ipn_notification_type: "GET"
        })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('[PesaPal] RegisterIPN Non-JSON response:', errorText.substring(0, 500));
        throw new Error(`PesaPal API returned an unexpected response format during IPN registration (Status ${response.status})`);
      }

      const data = await response.json();
      res.json({ 
        message: "Use the IPN_ID below in your .env file",
        ipn_id: data.ipn_id,
        raw_response: data 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/pesapal/ipn', async (req, res) => {
    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = req.query;
    
    console.log('--- PesaPal IPN Received (GET) ---');
    console.log(`Tracking ID: ${OrderTrackingId}`);
    console.log(`Type: ${OrderNotificationType}`);
    console.log(`Reference: ${OrderMerchantReference}`);

    if (!OrderTrackingId) {
      return res.status(400).send('Missing Tracking ID');
    }

    try {
      // 1. Get Token
      const token = await getPesaPalToken();
      
      // 2. Query PesaPal for the actual status
      const response = await fetch(`${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const statusData = await response.json();
      
      if (response.ok && statusData.payment_status_description === 'Success') {
        console.log(`Transaction ${OrderTrackingId} verified as SUCCESS.`);
        
        // Extract company ID from merchant reference (e.g., SP-uuid-timestamp)
        const refParts = (OrderMerchantReference as string || '').split('-');
        if (refParts.length >= 2) {
          // Note: In a real implementation we would update the DB here
          // We don't have the full company UUID in the ref necessarily, 
          // so we'd typically query by reference.
          console.log(`Ready to update subscription for reference: ${OrderMerchantReference}`);
        }
      }

      // 3. Acknowledge the IPN to PesaPal
      // PesaPal expects a specific JSON response to acknowledge receipt
      res.json({
        "orderNotificationType": OrderNotificationType,
        "orderTrackingId": OrderTrackingId,
        "orderMerchantReference": OrderMerchantReference,
        "status": 200
      });

    } catch (error) {
      console.error('Error processing PesaPal IPN:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is missing from environment variables.");
  }

  app.post('/api/generate-itinerary', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ message: 'Prompt is required' });
      if (!GEMINI_API_KEY) return res.status(503).json({ message: 'AI service not configured' });

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      
      const responseText = response.text;
      if (!responseText) throw new Error("Empty AI response");
      
      return res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      return res.status(500).json({ message: 'AI generation failed', error: error.message });
    }
  });

  const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
  const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL;

  app.post('/api/send-email', async (req, res) => {
    try {
      const { to, cc, subject, html, attachment } = req.body;

      if (!to || !subject || !html) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      if (!MAILERSEND_API_KEY || !MAILERSEND_FROM_EMAIL) {
        return res.status(503).json({ message: 'Email service not configured' });
      }

      const payload = {
        from: {
          email: MAILERSEND_FROM_EMAIL,
          name: "Safari Planner"
        },
        to: [{ email: to }],
        cc: cc ? [{ email: cc }] : [],
        subject: subject,
        html: html,
        attachments: attachment ? [
          {
            content: attachment.content,
            filename: attachment.filename,
            disposition: "attachment"
          }
        ] : []
      };

      const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Authorization': `Bearer ${MAILERSEND_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error("MailerSend API Error:", errorText);
          return res.status(response.status).json({ message: 'Failed to send email', details: errorText });
      }

      return res.status(200).json({ message: 'Email sent successfully' });

    } catch (error: any) {
      console.error("Server Error:", error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });

  // --- VITE MIDDLEWARE / STATIC ASSETS ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
