/**
 * Alustaa kirjautumissivun tapahtumankuuntelijat, kun DOM on latautunut.
 * Käsittelee lomakkeen lähetyksen, autentikoinnin backend-rajapintaan
 * ja käyttäjän uudelleenohjauksen roolin perusteella.
 */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        /**
         * Kuuntelee kirjautumislomakkeen lähetystapahtumaa.
         * * @param {Event} e - Submit-tapahtuma.
         * @async
         */
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Haetaan syötetyt arvot käyttöliittymästä
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            try {
                /**
                 * Lähettää kirjautumistiedot palvelimelle POST-pyynnöllä.
                 * @fetch {POST} http://localhost:3000/api/auth/login
                 */
                const response = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({username, password})
                });

                const data = await response.json();

                if (response.ok) {
                    /**
                     * Tallennetaan käyttäjätiedot selaimen muistiin (localStorage).
                     * @storage {Object} user - Käyttäjän tiedot (id, username, role).
                     * @storage {number} userId - Käyttäjän yksilöllinen tunniste.
                     */
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("userId", data.user.id);

                    /**
                     * Uudelleenohjauksen hallinta roolin mukaan:
                     * 1. ADMIN: Ohjataan suoraan ylläpitopaneeliin.
                     * 2. ASIAKAS: Palautetaan takaisin edelliselle sivulle (jos mahdollista)
                     * tai ohjataan pääsivulle (Roast.html).
                     */
                    if (data.user.role === 'ADMIN' || data.user.role === 'admin') {
                        window.location.href = "admin.html";
                    } else {
                        const previousPage = document.referrer;

                        // Tarkistetaan, että edellinen sivu kuuluu omalle sivustolle eikä ole rekisteröitymissivu
                        if (previousPage && previousPage.includes(window.location.hostname) && !previousPage.includes("register.html")) {
                            window.location.href = previousPage;
                        } else {
                            window.location.href = "Roast.html";
                        }
                    }
                } else {
                    /**
                     * Näytetään virheilmoitus, jos kirjautuminen epäonnistuu (esim. väärä salasana).
                     */
                    naytaIlmoitusModal(
                        "Kirjautuminen epäonnistui",
                        data.message || "Tarkista käyttäjätiedot ja yritä uudelleen.",
                        "OK"
                    );
                }

            } catch (error) {
                /**
                 * Tulostetaan mahdolliset yhteysvirheet konsoliin.
                 */
                console.log("Yhteysvirhe palvelimeen: ", error);
            }
        });
    }
});