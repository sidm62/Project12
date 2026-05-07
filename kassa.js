/**
 * ROAST BURGER - KASSA & TILAUS LOGIIKKA (kassa.js)
 * Hallitsee ostoskorin näyttämistä, hinnan laskentaa (ALV 14%)
 * sekä tilauksen lähettämistä backend-rajapintaan.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Tarkistetaan kummalla sivulla ollaan ja alustetaan oikeat toiminnot
    if (document.getElementById("kassa-lista")) {
        paivitaKassaNakyma();
    }

    if (document.getElementById("final-total")) {
        laskeLoppusumma();
    }
});

/**
 * Yleiskäyttöinen funktio ilmoitusikkunoiden (modal) näyttämiseen.
 * @param {string} otsikko - Otsikko
 * @param {string} teksti - Viesti käyttäjälle
 * @param {string} nappiTeksti - Painikkeen teksti
 * @param {Function} callback - Funktio joka ajetaan kun nappia painetaan
 */
function naytaIlmoitusModal(otsikko, teksti, nappiTeksti, callback = null) {
    const modal = document.getElementById("menuModal");
    const title = document.getElementById("modal-title");
    const text = document.getElementById("modal-text");
    const footer = document.getElementById("modal-footer");

    if (!modal) return;

    title.innerText = otsikko;
    text.innerText = teksti;
    footer.innerHTML = `<button class="btn-confirm" id="modal-ok-btn" style="width: 100%;">${nappiTeksti}</button>`;

    modal.style.display = "flex";

    document.getElementById("modal-ok-btn").onclick = function() {
        modal.style.display = "none";
        if (callback) callback();
    };
}

// --- KASSA.HTML LOGIIKKA ---

/**
 * Hakee tuotteet localStoragesta ja rakentaa ostoskorinäkymän.
 * Laskee välisumman ja ALV 14% osuuden.
 */
function paivitaKassaNakyma() {
    const kassaLista = document.getElementById("kassa-lista");
    const valisummaElement = document.getElementById("valisumma");
    const loppusummaElement = document.getElementById("Loppusumma");

    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        if (kassaLista) kassaLista.innerHTML = "<p style='text-align:center; padding:20px;'>Ostoskorisi on tyhjä.</p>";
        if (valisummaElement) valisummaElement.innerText = "0.00€";
        if (loppusummaElement) loppusummaElement.innerText = "0.00";
        return;
    }

    let valisummaYhteensa = 0;
    if (kassaLista) kassaLista.innerHTML = "";

    ostoskori.forEach((tuote, index) => {
        const hinta = parseFloat(tuote.price);
        // Käytetään amount-nimeä, joka on projektisi standardi
        const maara = parseInt(tuote.amount || tuote.quantity || 1);
        const riviSumma = hinta * maara;
        valisummaYhteensa += riviSumma;

        if (kassaLista) {
            kassaLista.innerHTML += `
                <div class="cart-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 0.5fr; padding: 10px 0; border-bottom: 1px solid #333; align-items: center;">
                    <span>${tuote.name}</span>
                    <span>${hinta.toFixed(2)}€</span>
                    <span>${maara}</span>
                    <span>${riviSumma.toFixed(2)}€</span>
                    <button onclick="poistaTuote(${index})" style="background:none; border:none; color:#ff4444; cursor:pointer; font-size:18px;">&times;</button>
                </div>
            `;
        }
    });

    // VERO POISTETTU: Loppusumma on nyt suoraan välisumma
    const loppusumma = valisummaYhteensa;

    if (valisummaElement) valisummaElement.innerText = valisummaYhteensa.toFixed(2) + "€";
    if (loppusummaElement) loppusummaElement.innerText = loppusumma.toFixed(2);
}

/** Poistaa tuotteen korista ja päivittää näkymän heti */
function poistaTuote(index) {
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    // Poistetaan tuote listasta
    ostoskori.splice(index, 1);

    // Tallennetaan muutos
    localStorage.setItem('ostoskori', JSON.stringify(ostoskori));

    // Päivitetään kassan listaus ja summat välittömästi
    paivitaKassaNakyma();

    // Päivitetään myös yläpalkin ostoskori-ikoni, jos funktio on olemassa
    if (typeof updateCart === "function") updateCart();
}

/** Laskee summat Tilaus.html-sivulla (toimituskulut huomioiden) */
function laskeLoppusumma() {
    const ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    // Lasketaan tuotteiden summa
    let tuoteSumma = ostoskori.reduce((sum, t) => {
        const hinta = parseFloat(t.price) || 0;
        const maara = parseInt(t.amount || t.quantity) || 0;
        return sum + (hinta * maara);
    }, 0);

    // Haetaan valittu toimitustapa
    const toimitusRadio = document.querySelector('input[name="delivery"]:checked');
    const toimitusKulu = toimitusRadio ? parseFloat(toimitusRadio.value) : 0;

    // KOKONAISSUMMA ILMAN VEROJA
    const kokonaisSumma = tuoteSumma + toimitusKulu;

    // Päivitetään käyttöliittymä
    if(document.getElementById("cart-subtotal")) {
        document.getElementById("cart-subtotal").innerText = tuoteSumma.toFixed(2) + " €";
    }
    if(document.getElementById("delivery-cost")) {
        document.getElementById("delivery-cost").innerText = toimitusKulu.toFixed(2) + " €";
    }
    if(document.getElementById("final-total")) {
        document.getElementById("final-total").innerText = kokonaisSumma.toFixed(2) + " €";
    }
}
/**
 * Lähettää valmiin tilauksen backendille.
 * @async
 */
async function lahetaTilaus() {
    const ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
    const finalTotalElem = document.getElementById("final-total");
    const summa = finalTotalElem ? parseFloat(finalTotalElem.innerText) : 0;

    const maksutapa = document.querySelector('input[name="payment"]:checked')?.value || "Ei valittu";
    const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
    const toimitustapa = deliveryRadio?.value === "0.00" ? "Nouto" : "Kuljetus";

    const userJson = localStorage.getItem('user');
    let userId = null;

    if (userJson) {
        userId = JSON.parse(userJson).id;
    }

    if (!userId) {
        naytaIlmoitusModal("Kirjaudu sisään", "Sinun täytyy olla kirjautunut sisään lähettääksesi tilauksen.", "Kirjaudu", () => {
            window.location.href = "login.html";
        });
        return;
    }

    const tilausData = {
        userId: userId,
        total_price: summa,
        payment_method: maksutapa,
        delivery_method: toimitustapa,

        tuotteet: ostoskori.map(tuote => ({
            id: tuote.id,
            amount: tuote.amount,
            price: tuote.price
        }))
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tilausData),
        });

        if (response.ok) {
            localStorage.removeItem('ostoskori');
            naytaIlmoitusModal("Tilaus vastaanotettu!", "Kiitos tilauksestasi! Alamme valmistaa sitä heti.", "Jatka tilaamista", () => {
                window.location.href = "Roast.html";
            });
        } else {
            naytaIlmoitusModal("Virhe", "Tilausta ei voitu käsitellä.", "OK");
        }
    } catch (err) {
        console.error("Yhteysvirhe:", err);
        naytaIlmoitusModal("Yhteysvirhe", "Palvelimeen ei saatu yhteyttä.", "OK");
    }
}

/** Käynnistää tilausprosessin ja siirtää käyttäjän eteenpäin */
function tilaus(event) {
    if (event) event.preventDefault();

    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        // Jos sinulla on naytaIlmoitusModal käytössä:
        if (typeof naytaIlmoitusModal === "function") {
            naytaIlmoitusModal("Hups!", "Ostoskorisi on tyhjä!", "Selvä");
        } else {
            alert("Ostoskorisi on tyhjä!");
        }
        return;
    }

    // Siirrytään varsinaiselle tilauslomakkeelle
    window.location.href = "Tilaus.html";
}

// --- MODAALIEN HALLINTA ---

function closeModal() {
    const confirmModal = document.getElementById("confirmModal");
    if(confirmModal) confirmModal.style.display = "none";
}