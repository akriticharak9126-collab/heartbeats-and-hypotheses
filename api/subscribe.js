
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
      return res.status(400).json({ error: "Please enter a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/newsletter_subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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
      throw new Error("Database request failed.");
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
 
