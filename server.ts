import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import speakeasy from "speakeasy";
import crypto from "crypto";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

// Supabase admin client (server-side only)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Paystack webhook — must be before express.json()
  app.post("/api/paystack/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(req.body)
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(req.body.toString());
    const { event, data } = payload;

    if (event === 'charge.success' || event === 'subscription.create') {
      const { userId, planId } = data.metadata;
      await supabaseAdmin.from('billing').upsert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        paystack_customer_code: data.customer?.customer_code,
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (event === 'subscription.disable') {
      const { userId } = data.metadata;
      await supabaseAdmin.from('billing').update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // Billing: Initialize Paystack payment
  app.post("/api/billing/initialize", async (req, res) => {
    const { email, planId, userId } = req.body;

    const planCodes: Record<string, string> = {
      'PRO': process.env.VITE_PAYSTACK_PRO_PLAN!,
      'BUSINESS': process.env.VITE_PAYSTACK_BUSINESS_PLAN!
    };

    const amounts: Record<string, number> = {
      'PRO': 300000,      // ₦3,000 in kobo
      'BUSINESS': 450000  // ₦4,500 in kobo
    };

    try {
      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          amount: amounts[planId],
          plan: planCodes[planId],
          metadata: { userId, planId },
          callback_url: `${process.env.APP_URL}/dashboard?billing=success`
        })
      });

      const data = await response.json();
      if (!data.status) throw new Error(data.message);
      res.json({ url: data.data.authorization_url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2FA: Setup
  app.post("/api/2fa/setup", async (req, res) => {
    const { userId } = req.body;
    const secret = speakeasy.generateSecret({ name: `Konnekt.ng (${userId})` });

    try {
      await supabaseAdmin.from('security').upsert({
        user_id: userId,
        enabled: false,
        pending_secret: secret.base32,
        pending_otpauth_url: secret.otpauth_url,
        updated_at: new Date().toISOString()
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
      const { data: secData } = await supabaseAdmin
        .from('security')
        .select('pending_secret')
        .eq('user_id', userId)
        .single();

      if (!secData?.pending_secret) {
        return res.status(400).json({ error: "No setup in progress" });
      }

      const verified = speakeasy.totp.verify({
        secret: secData.pending_secret,
        encoding: 'base32',
        token
      });

      if (verified) {
        await supabaseAdmin.from('security').update({
          enabled: true,
          secret: secData.pending_secret,
          pending_secret: null,
          pending_otpauth_url: null,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId);
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
      const { data: secData } = await supabaseAdmin
        .from('security')
        .select('enabled, secret')
        .eq('user_id', userId)
        .single();

      if (!secData?.enabled) return res.json({ success: true });

      const verified = speakeasy.totp.verify({
        secret: secData.secret,
        encoding: 'base32',
        token
      });

      res.json({ success: verified });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Gemini: Generate bio
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
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      res.json({ bio: response.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate bio" });
    }
  });

  // Vite middleware
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