/**
 * ROAST BURGER - REKISTERÖINTILOGIIKKA (register.js)
 * Hallitsee uuden käyttäjätilin luomista:
 * - Kerää lomaketiedot (käyttäjänimi, sähköposti, salasana)
 * - Lähettää tiedot POST-pyynnöllä autentikointirajapintaan
 * - Käsittelee virhetilanteet (esim. sähköposti jo käytössä)
 * - Ohjaa käyttäjän etusivulle onnistumisen jälkeen
 */

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");

    // Varmistetaan, että lomake-elementti on olemassa sivulla
    if (registerForm) {
        /**
         * Kuuntelee lomakkeen lähetystapahtumaa.
         * @async
         * @param {Event} e - Submit-tapahtuma
         */
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Estetään sivun uudelleenlataus

            // Kerätään arvot syötekentistä
            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // Perusvalidointi selaimen puolella (valinnainen lisäys)
            if (password.length < 6) {
                naytaIlmoitusModal("Salasanan on oltava vähintään 6 merkkiä pitkä.","","OK");
                return;
            }

            try {
                // Lähetetään rekisteröintipyyntö palvelimelle
                const response = await fetch("http://localhost:3000/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Rekisteröinti onnistui
                    naytaIlmoitusModal( "Käyttäjätili luotu onnistuneesti!", "Voit nyt kirjautua sisään uudella tililläsi.", "Kirjaudu",
                        () => { window.location.href = "Roast.html"; }
                    );
                } else {
                    // Palvelin palautti virheen (esim. validointivirhe tai duplikaatti)
                    naytaIlmoitusModal("Rekisteröityminen epäonnistui ", "Tuntematon virhe", "OK");
                }
            } catch (error) {
                // Verkkovirheet tai palvelin alhaalla
                console.error("Yhteysvirhe rekisteröinnissä: ", error);
                naytaIlmoitusModal("Palvelimeen ei saatu yhteyttä" ,"Yritä myöhemmin uudelleen.", "OK");
            }
        });
    } else {
        naytaIlmoitusModal("Rekisteröitymislomaketta ei löytynyt sivulta!", "","OK");
    }
});