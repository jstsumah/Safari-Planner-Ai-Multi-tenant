import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';
import { expand } from 'dotenv-expand';
import { createServer as createViteServer } from 'vite';

const myEnv = dotenv.config();
expand(myEnv);

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
      const ai = new GoogleGenAI(GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
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
