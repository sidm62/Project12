document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch("http://localhost:3000/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({username, password})
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("userId", data.user.id);

                    // Tarkistetaan onko käyttäjä ylläpitäjä
                    if (data.user.role === 'ADMIN' || data.user.role === 'admin') {
                        window.location.href = "admin.html"; // Ohjataan suoraan admin-paneeliin
                    } else {
                        // TAVALLINEN ASIAKAS: Alkuperäinen logiikkasi
                        const previousPage = document.referrer;

                        if (previousPage && previousPage.includes(window.location.hostname) && !previousPage.includes("register.html")) {
                            window.location.href = previousPage;
                        } else {
                            window.location.href = "Roast.html";
                        }
                    }
                } else {
                    naytaIlmoitusModal("Kirjautuminen epäonnistui", data.message || "Tarkista käyttäjätiedot ja yritä uudelleen.", "OK");
                }

            } catch (error) {
                console.log(error);
            }
        });
    }
});