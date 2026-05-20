import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import * as admin from "firebase-admin";
import speakeasy from "speakeasy";
import crypto from "crypto";

dotenv.config();

function webhookSecretVerified(body: any, signature: string | undefined, secret: string | undefined): boolean {
  if (!secret || !signature) return false;
  try {
    const hash = crypto.createHmac("sha512", secret)
      .update(JSON.stringify(body))
      .digest("hex");
    return hash === signature;
  } catch (e) {
    console.error("Failed to verify Paystack signature:", e);
    return false;
  }
}

// Lazy Firebase Admin and firestore initialization
let dbInstance: admin.firestore.Firestore | null = null;
const getDb = () => {
  if (!dbInstance) {
    try {
      if (admin.apps.length === 0) {
        let projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
        try {
          const configPath = path.join(process.cwd(), "firebase-applet-config.json");
          if (fs.existsSync(configPath)) {
            const parsed = JSON.parse(fs.readFileSync(configPath, "utf-8"));
            if (parsed.projectId) {
              projectId = parsed.projectId;
            }
          }
        } catch (e) {
          console.warn("Could not read firebase-applet-config.json at startup", e);
        }
        
        admin.initializeApp({
          projectId: projectId
        });
      }
      dbInstance = admin.firestore();
    } catch (error: any) {
      console.error("Failed to initialize Firebase Admin:", error);
      throw error;
    }
  }
  return dbInstance;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Paystack Webhook
  app.post("/api/paystack/webhook", express.json(), async (req, res) => {
    const signature = req.headers['x-paystack-signature'] as string;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!webhookSecretVerified(req.body, signature, paystackSecret)) {
      console.warn("Paystack Webhook signature verification failed or secret not set.");
    }

    const { event, data } = req.body;

    if (event === 'charge.success') {
      const userId = data?.metadata?.userId;
      const planId = data?.metadata?.planId;

      if (userId && planId) {
        try {
          // Update user private billing status
          await getDb().doc(`users/${userId}/private/billing`).set({
            planId,
            status: 'active',
            paystackReference: data.reference,
            customerEmail: data.customer?.email,
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          // Synchronize to profile plan field
          const profileQuery = await getDb().collection("profiles").where("ownerId", "==", userId).limit(1).get();
          if (!profileQuery.empty) {
            await profileQuery.docs[0].ref.set({
              plan: planId
            }, { merge: true });
            console.log(`Successfully upgraded profile plan for owner ${userId} to ${planId}`);
          }
        } catch (dbErr) {
          console.error("Database sync failed for Paystack webhook:", dbErr);
        }
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // Billing: Create Paystack Transaction & Checkout Session
  app.post("/api/billing/create-checkout", async (req, res) => {
    const { userId, planId, userEmail } = req.body;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      console.error("PAYSTACK_SECRET_KEY environment variable is missing.");
      return res.status(500).json({ error: "Paystack billing credentials are not configured on the server." });
    }

    const planCodes: Record<string, string | undefined> = {
      'PRO': process.env.PAYSTACK_PLAN_PRO,
      'BUSINESS': process.env.PAYSTACK_PLAN_BUSINESS
    };

    const planCode = planCodes[planId];

    const bodyPayload: any = {
      email: userEmail || "customer@konnekt.ng",
      callback_url: `${req.headers.origin}/dashboard?billing=success`,
      metadata: { userId, planId }
    };

    // If a custom Paystack dashboard subscription plan code is configured, supply it.
    // Paystack automatically applies the amount, cycle and rules configured on your Paystack dashboard.
    // Otherwise, we fall back to initializing a custom amount.
    if (planCode) {
      bodyPayload.plan = planCode;
    } else {
      const prices: Record<string, number> = {
        'PRO': 3000,
        'BUSINESS': 4500
      };
      bodyPayload.amount = (prices[planId] || 3000) * 100; // Paystack takes amount in kobo
    }

    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackSecret}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      });

      const paystackData = await response.json() as any;

      if (paystackData.status && paystackData.data?.authorization_url) {
        res.json({ url: paystackData.data.authorization_url });
      } else {
        console.error("Paystack Init Response Error:", paystackData);
        res.status(400).json({ error: paystackData.message || "Could not initialize dynamic Paystack checkout" });
      }
    } catch (error: any) {
      console.error("Paystack Initialize Catch Exception:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2FA: Setup
  app.post("/api/2fa/setup", async (req, res) => {
    const { userId } = req.body;
    const secret = speakeasy.generateSecret({ name: `Konnekt.ng (${userId})` });
    
    try {
      // Store secret (unverified state)
      await getDb().doc(`users/${userId}/private/security_pending`).set({
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      res.json({ secret: secret.base32, otpauth_url: secret.otpauth_url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2FA: Verify & Enable
  app.post("/api/2fa/verify", async (req, res) => {
    const { userId, token } = req.body;
    try {
      const pendingDoc = await getDb().doc(`users/${userId}/private/security_pending`).get();
      if (!pendingDoc.exists) return res.status(400).json({ error: "No setup in progress" });
      
      const { secret } = pendingDoc.data()!;
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
      });

      if (verified) {
        // Promote to active security config
        await getDb().doc(`users/${userId}/private/security`).set({
          enabled: true,
          secret,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await pendingDoc.ref.delete();
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid token" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2FA: Challenge
  app.post("/api/2fa/challenge", async (req, res) => {
    const { userId, token } = req.body;
    try {
      const secDoc = await getDb().doc(`users/${userId}/private/security`).get();
      if (!secDoc.exists || !secDoc.data()?.enabled) {
        return res.json({ success: true }); // Not enabled
      }
      
      const { secret } = secDoc.data()!;
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token
      });

      res.json({ success: verified });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini Proxy Route
  app.post("/api/gemini/generate-bio", async (req, res) => {
    try {
      const { industry, intent } = req.body;
      if (!industry || !intent) {
        return res.status(400).json({ error: "Industry and Intent are required" });
      }

      const prompt = `Generate a short, professional, and punchy bio for a Konnekt profile.
      Industry: ${industry}
      Intent: ${intent}
      The bio should be under 200 characters and highlight the user's expertise and goal.
      Return ONLY the bio text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ bio: response.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate bio" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
