
/* HEARTBEATS & HYPOTHESES
   Interactive website features
*/

console.log("Welcome to Heartbeats & Hypotheses!");

// Automatically update copyright year
const yearElement = document.querySelector("#current-year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Reading progress bar
const progressBar = document.createElement("div");

progressBar.style.position = "fixed";
progressBar.style.top = "0";
progressBar.style.left = "0";
progressBar.style.height = "3px";
progressBar.style.width = "0%";
progressBar.style.background = "#B39461";
progressBar.style.zIndex = "9999";
progressBar.style.transition = "width 0.1s linear";

document.body.appendChild(progressBar);

window.addEventListener("scroll", () => {
    const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

    const progress = scrollable > 0
        ? (window.scrollY / scrollable) * 100
        : 0;

    progressBar.style.width = progress + "%";
});

// Smooth navigation
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
        const target = document.querySelector(
            link.getAttribute("href")
        );

        if (target) {
            event.preventDefault();
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

// Newsletter subscription
const newsletterForm = document.querySelector("#newsletter-form");
const newsletterMessage = document.querySelector("#newsletter-message");

if (newsletterForm) {
    newsletterForm.addEventListener("submit", async event => {
        event.preventDefault();

        const emailInput = document.querySelector("#subscriber-email");
        const button = newsletterForm.querySelector("button");
        const email = emailInput.value.trim();

        button.disabled = true;
        button.textContent = "Please wait...";

        newsletterMessage.textContent = "Adding your subscription...";

        try {
            const response = await fetch("/api/subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Subscription failed.");
            }

            newsletterMessage.textContent = result.message;
            newsletterForm.reset();

        } catch (error) {
            newsletterMessage.textContent = error.message ||
                "Something went wrong. Please try again.";
        } finally {
            button.disabled = false;
            button.textContent = "Subscribe →";
        }
    });
}

console.log("Your journal is ready to explore.");
