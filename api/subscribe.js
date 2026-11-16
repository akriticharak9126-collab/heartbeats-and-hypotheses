
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body || {};

    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        error: "Please enter a valid email address."
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;

    if (!supabaseUrl || !supabaseKey || !resendKey) {
      console.error("Missing environment variables.");
      return res.status(500).json({
        error: "Server configuration is incomplete."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanUrl = supabaseUrl.trim().replace(/\/+$/, "");

    const response = await fetch(
      `${cleanUrl}/rest/v1/newsletter_subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ email: normalizedEmail })
      }
    );

    if (response.status === 409) {
      return res.status(409).json({
        error: "This email is already subscribed."
      });
    }

    if (!response.ok) {
      const details = await response.text();
      console.error("Supabase error:", response.status, details);

      return res.status(500).json({
        error: "Database error. Please try again later."
      });
    }

    // Notify the website owner
    try {
      const mailResponse = await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: "Heartbeats & Hypotheses <onboarding@resend.dev>",
            to: ["akriticharak9126@gmail.com"],
            subject: "New newsletter subscriber!",
            html: `
              <h2>You have a new subscriber!</h2>
              <p><strong>Email:</strong> ${normalizedEmail}</p>
              <p>They just subscribed to Heartbeats & Hypotheses.</p>
            `
          })
        }
      );

      if (!mailResponse.ok) {
        console.error(
          "Resend notification error:",
          await mailResponse.text()
        );
      }
    } catch (mailError) {
      console.error("Notification failed:", mailError.message);
    }

    return res.status(200).json({
      message: "Your signup has been received!"
    });

  } catch (error) {
    console.error("Newsletter signup error:", error.message);

    return res.status(500).json({
      error: "Something went wrong. Please try again later."
    });
  }
}
