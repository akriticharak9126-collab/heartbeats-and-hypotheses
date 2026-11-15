
/* HEARTBEATS & HYPOTHESES
   Interactive website features
*/

// Welcome message
console.log("Welcome to Heartbeats & Hypotheses!");

// Automatically update copyright year
const yearElement = document.querySelector("#current-year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Create reading progress bar
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

// Update progress while scrolling
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

console.log("Your journal is ready to explore.");
