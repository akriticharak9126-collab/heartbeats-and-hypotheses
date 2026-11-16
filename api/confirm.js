import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const token = req.query.token;

    if (!token || typeof token !== "string") {
      return res.status(400).send("Invalid confirmation link.");
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const supabaseUrl = process.env.SUPABASE_URL
      ?.trim()
      .replace(/\/+$/, "");

    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing server configuration.");
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/newsletter_subscribers?confirmation_token_hash=eq.${tokenHash}&confirmed_at=is.null&select=id`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          confirmed_at: new Date().toISOString(),
          confirmation_token_hash: null
        })
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const updated = await response.json();

    if (!updated.length) {
      return res.status(400).send(
        "This confirmation link is invalid or has already been used."
      );
    }

    return res.status(200).send(
      "Your subscription is confirmed! Welcome to Heartbeats & Hypotheses."
    );

  } catch (error) {
    console.error("Confirmation error:", error.message);

    return res.status(500).send(
      "We couldn't confirm your subscription. Please try again later."
    );
  }
}
