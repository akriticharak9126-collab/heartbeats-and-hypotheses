
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

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables.");
      return res.status(500).json({
        error: "Server configuration is incomplete."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const cleanSupabaseUrl = supabaseUrl.trim().replace(/\/+$/, "");

const response = await fetch(
  `${cleanSupabaseUrl}/rest/v1/newsletter_subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          email: normalizedEmail
        })
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
