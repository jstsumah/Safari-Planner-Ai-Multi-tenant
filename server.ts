import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import { expand } from 'dotenv-expand';
import { createServer as createViteServer } from 'vite';
import paypal from 'paypal-rest-sdk';

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

const PAYPAL_MODE = (process.env.PAYPAL_MODE || 'sandbox').trim().toLowerCase();
const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();

console.log('--- PayPal Config Diagnostic ---');
console.log(`MODE: [${PAYPAL_MODE}]`);
console.log(`CLIENT_ID: [${PAYPAL_CLIENT_ID.substring(0, 10)}...] (len: ${PAYPAL_CLIENT_ID.length})`);
console.log(`SECRET: [${PAYPAL_CLIENT_SECRET.substring(0, 10)}...] (len: ${PAYPAL_CLIENT_SECRET.length})`);
console.log('--------------------------------');

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.warn("CRITICAL: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is missing.");
}

paypal.configure({
  mode: PAYPAL_MODE as any,
  client_id: PAYPAL_CLIENT_ID,
  client_secret: PAYPAL_CLIENT_SECRET
});

// __filename and __dirname removed (unused warning)


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

  app.post('/api/paypal/create-order', (req, res) => {
    const { plan, companyId } = req.body;
    const price = plan === 'pro' ? '60.00' : '30.00';
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    const create_payment_json = {
        "intent": "sale",
        "payer": { "payment_method": "paypal" },
        "redirect_urls": {
          "return_url": `${process.env.APP_URL}/success?companyId=${companyId}`,
          "cancel_url": `${process.env.APP_URL}/cancel`
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": `${plan} Subscription`,
              "sku": plan,
              "price": price,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": { "currency": "USD", "total": price },
          "description": `Subscription to ${plan} plan.`
        }]
    };

    paypal.payment.create(create_payment_json, (error: any, payment: any) => {
        if (error) {
            console.error('PayPal Create Payment Error:', JSON.stringify(error, null, 2));
            const errorMessage = error.response?.message || error.message || 'Failed to create PayPal payment';
            res.status(500).json({ error: errorMessage, details: error.response });
        } else {
            for (let i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
                    res.json({ approvalUrl: payment.links[i].href });
                }
            }
        }
    });
  });

  app.post('/api/paypal/capture-order', (req, res) => {
    const { paymentId, payerId } = req.body;
    const execute_payment_json = {
      "payer_id": payerId
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error: any, payment) => {
      if (error) {
        console.error('PayPal Execute Payment Error:', JSON.stringify(error, null, 2));
        const errorMessage = error.response?.message || error.message || 'Failed to execute PayPal payment';
        res.status(500).json({ error: errorMessage, details: error.response });
      } else {
        res.json({ payment });
      }
    });
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
