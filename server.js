var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_express_async_errors = require("express-async-errors");
var import_cors = __toESM(require("cors"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_path = __toESM(require("path"), 1);
var import_compression = __toESM(require("compression"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_morgan = __toESM(require("morgan"), 1);
var import_dotenv_expand = require("dotenv-expand");
var import_vite = require("vite");
import_dotenv.default.config();
if (process.env.NODE_ENV !== "production") {
  const examplePath = import_path.default.join(process.cwd(), ".env.example");
  const exampleEnv = import_dotenv.default.config({ path: examplePath });
  if (exampleEnv.parsed) {
    Object.keys(exampleEnv.parsed).forEach((key) => {
      const val = exampleEnv.parsed[key];
      if (val && (!process.env[key] || process.env[key] === "")) {
        process.env[key] = val;
      }
    });
  }
}
var myEnv = { parsed: process.env };
(0, import_dotenv_expand.expand)(myEnv);
var PESAPAL_CONSUMER_KEY = (process.env.PESAPAL_CONSUMER_KEY || "").trim();
var PESAPAL_CONSUMER_SECRET = (process.env.PESAPAL_CONSUMER_SECRET || "").trim();
var PESAPAL_RAW_MODE = (process.env.PESAPAL_MODE || "sandbox").trim().toLowerCase();
var PESAPAL_MODE = PESAPAL_RAW_MODE === "production" || PESAPAL_RAW_MODE === "live" ? "production" : "sandbox";
var PESAPAL_IPN_ID = (process.env.PESAPAL_IPN_ID || "").trim();
var PAYSTACK_SECRET_KEY = (process.env.PAYSTACK_SECRET_KEY || "").trim();
var PAYSTACK_CURRENCY = (process.env.PAYSTACK_CURRENCY || "KES").trim().toUpperCase();
var PESAPAL_URL = PESAPAL_MODE === "production" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3";
console.log(`[Server] NODE_ENV: [${process.env.NODE_ENV}]`);
console.log("--- PesaPal Config Diagnostic ---");
console.log(`RAW_MODE_ENV: [${process.env.PESAPAL_MODE}]`);
console.log(`EVALUATED_MODE: [${PESAPAL_MODE}]`);
console.log(`BASE_URL: [${PESAPAL_URL}]`);
console.log(`KEY: [${PESAPAL_CONSUMER_KEY.substring(0, 5)}...${PESAPAL_CONSUMER_KEY.slice(-3)}] (len: ${PESAPAL_CONSUMER_KEY.length})`);
console.log(`SECRET: [${PESAPAL_CONSUMER_SECRET.substring(0, 3)}...${PESAPAL_CONSUMER_SECRET.slice(-3)}] (len: ${PESAPAL_CONSUMER_SECRET.length})`);
console.log("--------------------------------");
async function getPesaPalToken() {
  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
    throw new Error("PesaPal credentials missing");
  }
  const tokenUrl = `${PESAPAL_URL}/api/Auth/RequestToken`;
  console.log(`[PesaPal] Requesting token from: ${tokenUrl}`);
  console.log(`[PesaPal] Using Key: ${PESAPAL_CONSUMER_KEY.substring(0, 4)}...${PESAPAL_CONSUMER_KEY.slice(-4)}`);
  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET
      })
    });
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const errorText = await response.text();
      console.error(`[PesaPal] Non-JSON response from ${tokenUrl}:`, errorText.substring(0, 500));
      throw new Error(`PesaPal API returned an unexpected response (Status ${response.status}). The service might be down or the URL is incorrect.`);
    }
    const data = await response.json();
    console.log(`[PesaPal] Token Response Status: ${response.status}`);
    console.log(`[PesaPal] API Response JSON: ${JSON.stringify(data)}`);
    if (data.error || data.status && data.status !== "200" && data.status !== 200) {
      const errorCode = data.error?.code || data.code || "unknown_error";
      const errorMsg = data.error?.message || data.message || "Unknown API Error";
      let detail = "";
      if (errorCode === "invalid_consumer_key_or_secret_provided") {
        detail = `The Consumer Key or Secret provided does not match the current environment (${PESAPAL_MODE}). If these are LIVE keys, set PESAPAL_MODE=production. If they are SANDBOX keys, set PESAPAL_MODE=sandbox. Current URL: ${PESAPAL_URL}`;
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
      throw new Error("PesaPal response received but no token found. Check if you are using V3 keys.");
    }
    return token;
  } catch (error) {
    console.error("[PesaPal] getPesaPalToken error:", error);
    throw error;
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  app.use((0, import_helmet.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false
  }));
  app.use((0, import_compression.default)());
  app.use((0, import_cors.default)());
  app.use(import_express.default.json({ limit: "10mb" }));
  app.use((0, import_morgan.default)(":method :url :status :res[content-length] - :response-time ms", {
    skip: (req, res) => req.path.startsWith("/src/")
  }));
  app.use((req, res, next) => {
    if (!req.path.startsWith("/src/")) {
      console.log(`[Global/Request] Incoming request: ${req.method} ${req.originalUrl}`);
    }
    next();
  });
  const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
  const MAILERSEND_FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL;
  const apiRouter = import_express.default.Router();
  apiRouter.use((req, res, next) => {
    console.log(`[API Router] Incoming request: ${req.method} ${req.originalUrl}`);
    next();
  });
  apiRouter.get("/ping", (req, res) => {
    res.json({ pong: true, time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  apiRouter.get("/pesapal/test-config", async (req, res) => {
    try {
      const token = await getPesaPalToken();
      res.json({
        success: true,
        token_preview: token.substring(0, 10) + "...",
        mode: PESAPAL_MODE,
        url: PESAPAL_URL
      });
    } catch (error) {
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
  apiRouter.post("/pesapal/submit-order", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    const { plan, companyId, email } = req.body;
    const amount = plan === "pro" ? 60 : 30;
    if (!companyId) {
      return res.status(400).json({ error: "companyId is required" });
    }
    if (!PESAPAL_IPN_ID) {
      return res.status(500).json({ error: "PESAPAL_IPN_ID is not configured. Please register an IPN URL in PesaPal dashboard." });
    }
    try {
      const token = await getPesaPalToken();
      const merchantReference = `SP-${companyId}`;
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.get("host");
      const dynamicBaseUrl = `${protocol}://${host}`;
      const baseUrl = process.env.APP_URL || process.env.SHARED_APP_URL || dynamicBaseUrl;
      const callbackUrl = `${baseUrl}/payment-complete`;
      console.log(`[PesaPal] Using IPN_ID: [${PESAPAL_IPN_ID}]`);
      console.log(`[PesaPal] Using Callback URL: [${callbackUrl}]`);
      console.log(`[PesaPal] Using Merchant Ref: [${merchantReference}]`);
      const payload = {
        id: merchantReference,
        currency: "USD",
        amount,
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
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("[PesaPal] SubmitOrder Non-JSON response:", errorText.substring(0, 500));
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
        console.error("[PesaPal] Missing redirect_url in response:", data);
        throw new Error(`PesaPal returned successful status but no redirect URL. Message: ${data.message || "None"}`);
      }
      res.json({
        redirect_url: redirectUrl,
        order_tracking_id: orderTrackingId
      });
    } catch (error) {
      console.error("PesaPal Submit Order Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  apiRouter.get("/checkout/init", (req, res) => {
    res.json({ message: "Paystack initialization endpoint exists. Use POST to initiate a checkout.", method: req.method });
  });
  apiRouter.post("/checkout/init", async (req, res) => {
    console.log("[DEBUG] Entering POST /checkout/init");
    res.setHeader("Content-Type", "application/json");
    const { plan, companyId, email } = req.body;
    console.log(`[Paystack] Received init request: plan=${plan}, companyId=${companyId}`);
    let baseAmount = plan === "pro" ? 60 : 30;
    if (PAYSTACK_CURRENCY === "KES") {
      baseAmount = plan === "pro" ? 7800 : 3900;
    } else if (PAYSTACK_CURRENCY === "NGN") {
      baseAmount = plan === "pro" ? 9e4 : 45e3;
    }
    const amount = Math.round(baseAmount * 100);
    if (!PAYSTACK_SECRET_KEY) {
      console.error("[Paystack] PAYSTACK_SECRET_KEY is missing in environment");
      return res.status(500).json({ error: "Paystack is not configured on the server. Please add PAYSTACK_SECRET_KEY to your environment variables." });
    }
    try {
      const merchantReference = `SP-${companyId}-${Date.now()}`;
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.get("host");
      const dynamicBaseUrl = `${protocol}://${host}`;
      const baseUrl = process.env.APP_URL || process.env.SHARED_APP_URL || dynamicBaseUrl;
      const callbackUrl = `${baseUrl.replace(/\/$/, "")}/payment-complete`;
      console.log(`[Paystack] Initializing: ${amount} ${PAYSTACK_CURRENCY} | Callback: ${callbackUrl}`);
      const pResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email || "billing@wildrhythm.com",
          amount,
          currency: PAYSTACK_CURRENCY,
          reference: merchantReference,
          callback_url: callbackUrl,
          metadata: {
            plan,
            companyId,
            custom_fields: [
              { display_name: "Plan", variable_name: "plan", value: plan },
              { display_name: "Company ID", variable_name: "company_id", value: companyId }
            ]
          }
        })
      });
      const pContentType = pResponse.headers.get("content-type");
      let pData;
      if (pContentType && pContentType.includes("application/json")) {
        pData = await pResponse.json();
      } else {
        const pText = await pResponse.text();
        console.error("[Paystack] Non-JSON response from Paystack:", pText.substring(0, 500));
        throw new Error(`Paystack API unexpected response format (Status ${pResponse.status})`);
      }
      if (!pResponse.ok) {
        console.error("[Paystack] API Error:", pData);
        throw new Error(pData.message || "Paystack initialization failed");
      }
      console.log("[Paystack] Initialization successful");
      return res.json(pData.data);
    } catch (error) {
      console.error("[Paystack] Final Error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  apiRouter.get("/checkout/confirm/:reference", async (req, res) => {
    const { reference } = req.params;
    console.log(`[Paystack] Verifying transaction: ${reference}`);
    if (!PAYSTACK_SECRET_KEY) {
      console.error("[Paystack] Secret key missing during verification");
      return res.status(500).json({ error: "Paystack is not configured." });
    }
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      });
      const data = await response.json();
      console.log(`[Paystack] Verify API Status: ${response.status}`);
      console.log(`[Paystack] Verify API Data Status: ${data.status}`);
      if (!response.ok) {
        console.error("[Paystack] Verification API error:", data);
        throw new Error(data.message || "Paystack verification failed");
      }
      res.json(data.data);
    } catch (error) {
      console.error("Paystack Verification Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  apiRouter.get("/pesapal/transaction-status", async (req, res) => {
    const { OrderTrackingId } = req.query;
    console.log(`[PesaPal] Getting status for: ${OrderTrackingId}`);
    if (!OrderTrackingId) return res.status(400).json({ error: "OrderTrackingId is required" });
    try {
      const token = await getPesaPalToken();
      const response = await fetch(`${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("[PesaPal] GetTransactionStatus Non-JSON response:", errorText.substring(0, 500));
        throw new Error(`PesaPal API returned an unexpected response format while fetching status (Status ${response.status})`);
      }
      const data = await response.json();
      console.log(`[PesaPal] Status API Status: ${response.status}`);
      console.log(`[PesaPal] Status API Data Status: ${data.status_code} (${data.payment_status_description})`);
      if (!response.ok) {
        console.error("[PesaPal] Status API error:", data);
        throw new Error(data.error?.message || "Failed to get PesaPal transaction status");
      }
      res.json(data);
    } catch (error) {
      console.error("PesaPal Status Error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  apiRouter.get("/pesapal/register-ipn", async (req, res) => {
    try {
      const token = await getPesaPalToken();
      const ipnUrl = "https://safariplanner.style-upsystems.com/api/pesapal/ipn";
      const response = await fetch(`${PESAPAL_URL}/api/URLRegistration/RegisterIPN`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          url: ipnUrl,
          ipn_notification_type: "GET"
        })
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("[PesaPal] RegisterIPN Non-JSON response:", errorText.substring(0, 500));
        throw new Error(`PesaPal API returned an unexpected response format during IPN registration (Status ${response.status})`);
      }
      const data = await response.json();
      res.json({
        message: "Use the IPN_ID below in your .env file",
        ipn_id: data.ipn_id,
        raw_response: data
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const handleIpn = async (req, res) => {
    const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = req.method === "POST" ? req.body : req.query;
    console.log(`--- PesaPal IPN Received (${req.method}) ---`);
    console.log(`Tracking ID: ${OrderTrackingId}`);
    console.log(`Type: ${OrderNotificationType}`);
    console.log(`Reference: ${OrderMerchantReference}`);
    if (!OrderTrackingId) {
      return res.status(200).send("OK");
    }
    try {
      const token = await getPesaPalToken();
      const response = await fetch(`${PESAPAL_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      const statusData = await response.json();
      if (response.ok && (statusData.payment_status_description === "Success" || statusData.status_code === 1)) {
        console.log(`Transaction ${OrderTrackingId} verified as SUCCESS.`);
      }
      res.json({
        "orderNotificationType": OrderNotificationType,
        "orderTrackingId": OrderTrackingId,
        "orderMerchantReference": OrderMerchantReference,
        "status": 200
      });
    } catch (error) {
      console.error("Error processing PesaPal IPN:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  apiRouter.get("/pesapal/ipn", handleIpn);
  apiRouter.post("/pesapal/ipn", handleIpn);
  apiRouter.post("/send-email", async (req, res) => {
    try {
      const { to, cc, subject, html, attachment } = req.body;
      if (!to || !subject || !html) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!MAILERSEND_API_KEY || !MAILERSEND_FROM_EMAIL) {
        return res.status(503).json({ message: "Email service not configured" });
      }
      const payload = {
        from: {
          email: MAILERSEND_FROM_EMAIL,
          name: "Safari Planner"
        },
        to: [{ email: to }],
        cc: cc ? [{ email: cc }] : [],
        subject,
        html,
        attachments: attachment ? [
          {
            content: attachment.content,
            filename: attachment.filename,
            disposition: "attachment"
          }
        ] : []
      };
      const response = await fetch("https://api.mailersend.com/v1/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Authorization": `Bearer ${MAILERSEND_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("MailerSend API Error:", errorText);
        return res.status(response.status).json({ message: "Failed to send email", details: errorText });
      }
      return res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
      console.error("Server Error:", error);
      return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
  });
  apiRouter.use((req, res) => {
    console.warn(`[API 404] ${req.method} ${req.originalUrl} | Router Path: ${req.path}`);
    res.status(404).json({
      error: "API endpoint not found",
      path: req.originalUrl,
      routerPath: req.path,
      method: req.method,
      message: "The requested API endpoint was not found on this server."
    });
  });
  app.use("/api/", apiRouter);
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      root: process.cwd(),
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res, next) => {
      const isApiRequest = req.path.startsWith("/api") || req.originalUrl.startsWith("/api");
      const looksLikeAsset = req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|map|tsx|ts)$/);
      if (isApiRequest || looksLikeAsset) {
        return next();
      }
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.use((err, req, res, next) => {
    const isApiRequest = req.path.startsWith("/api/") || req.originalUrl.startsWith("/api/");
    console.error(`[Global Error] ${req.method} ${req.originalUrl}:`, err);
    if (isApiRequest) {
      return res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        path: req.originalUrl,
        method: req.method,
        stack: process.env.NODE_ENV === "development" ? err.stack : void 0
      });
    }
    res.status(500).send("An internal server error occurred.");
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.js.map
