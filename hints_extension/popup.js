document.addEventListener("DOMContentLoaded", async function () {
    const hintsContainer = document.getElementById("hintsContainer");

    try {
        const response = await fetch(chrome.runtime.getURL("hints.json"));
        const data = await response.json();
        hintsContainer.innerHTML = "";

        data.hints.forEach((hint, index) => {
            const hintElement = document.createElement("div");
            hintElement.classList.add("hint-item");

            hintElement.innerHTML = `
                <button class="hint-title" data-index="${index}">Hint ${index + 1} ▼</button>
                <p class="hint-content" style="display: none;">${hint}</p>
            `;

            hintsContainer.appendChild(hintElement);
        });

        document.querySelectorAll(".hint-title").forEach(button => {
            button.addEventListener("click", function () {
                const content = this.nextElementSibling;
                content.style.display = content.style.display === "none" ? "block" : "none";
            });
        });

    } catch (error) {
        hintsContainer.innerHTML = "<p>Error loading hints.</p>";
    }
});