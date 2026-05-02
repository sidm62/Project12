document.addEventListener("DOMContentLoaded", () => {
    // Tarkistetaan kummalla sivulla ollaan
    if (document.getElementById("kassa-lista")) {
        paivitaKassaNakyma();
    }

    if (document.getElementById("final-total")) {
        laskeLoppusumma();
    }
});

function naytaIlmoitusModal(otsikko, teksti,nappiTeksti, callback = null) {
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

function paivitaKassaNakyma() {
    const kassaLista = document.getElementById("kassa-lista");
    const valisummaElement = document.getElementById("valisumma");
    const veroElement = document.getElementById("vero");
    const loppusummaElement = document.getElementById("Loppusumma");

    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        if (kassaLista) kassaLista.innerHTML = "<p style='text-align:center; padding:20px;'>Ostoskorisi on tyhjä.</p>";
        return;
    }

    let valisummaYhteensa = 0;
    if (kassaLista) kassaLista.innerHTML = "";

    ostoskori.forEach((tuote, index) => {
        const hinta = parseFloat(tuote.price);
        const maara = parseInt(tuote.quantity || tuote.amount);
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

    const vero = valisummaYhteensa * 0.14;
    const loppusumma = valisummaYhteensa + vero;

    if (valisummaElement) valisummaElement.innerText = valisummaYhteensa.toFixed(2) + "€";
    if (veroElement) veroElement.innerText = vero.toFixed(2) + "€";
    if (loppusummaElement) loppusummaElement.innerText = loppusumma.toFixed(2);
}

function tilaus(event) {
    if (event) event.preventDefault();
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        naytaIlmoitusModal("Hups!", "Ostoskorisi on tyhjä!", "Selvä");
        return;
    }

    const confirmModal = document.getElementById("confirmModal");
    if (confirmModal) {
        confirmModal.style.display = "flex";
    }
}
// Tämä funktio ajetaan, kun Kassa.html:n modalissa klikataan "Vahvista"
function processOrder() {
    // Siirrytään uudelle sivulle täyttämään tiedot
    window.location.href = "Tilaus.html";
}

// --- TILAUS.HTML LOGIIKKA ---

function laskeLoppusumma() {
    const ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    // 1. Perushinta tuotteista
    let tuoteSumma = ostoskori.reduce((sum, t) => sum + (parseFloat(t.price) * parseInt(t.amount)), 0);

    // 2. Toimituskulu (jos radio-nappi löytyy)
    const toimitusRadio = document.querySelector('input[name="delivery"]:checked');
    const toimitusKulu = toimitusRadio ? parseFloat(toimitusRadio.value) : 0;

    const kokonaisSumma = tuoteSumma + toimitusKulu;
    const veroOsuus = kokonaisSumma * (14 / 114); // 14% ALV osuus
    const veroton = kokonaisSumma - veroOsuus;

    // Päivitetään Tilaus.html elementit (jos ne ovat sivulla)
    if(document.getElementById("cart-subtotal")) document.getElementById("cart-subtotal").innerText = tuoteSumma.toFixed(2) + " €";
    if(document.getElementById("delivery-cost")) document.getElementById("delivery-cost").innerText = toimitusKulu.toFixed(2) + " €";
    if(document.getElementById("final-total")) document.getElementById("final-total").innerText = kokonaisSumma.toFixed(2) + " €";
    if(document.getElementById("taxless-total")) document.getElementById("taxless-total").innerText = veroton.toFixed(2) + " €";
    if(document.getElementById("tax-amount")) document.getElementById("tax-amount").innerText = veroOsuus.toFixed(2) + " €";
}

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
        naytaIlmoitusModal( "Kirjaudu sisään", "Sinun täytyy olla kirjautunut sisään lähettääksesi tilauksen.", "Kirjaudu", () => {
            window.location.href = "login.html";
        });
        return;
    }
    const tilausData = {
        userId: userId,
        total_price: summa,
        payment_method: maksutapa,
        delivery_method: toimitustapa,
        tuotteet: ostoskori
    };

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tilausData),
        });

        if (response.ok) {
            localStorage.removeItem('ostoskori');
            // Korvattu alert modaalilla
            naytaIlmoitusModal("Tilaus vastaanotettu!", "Kiitos tilauksestasi! Alamme valmistaa sitä heti.", "Jatka tilaamista", () => {
                window.location.href = "Roast.html";
            });

        } else {
            naytaIlmoitusModal( "Virhe", "Tilausta ei voitu käsitellä. Yritä uudelleen myöhemmin.", "OK");
        }
    } catch (err) {
        console.error("Yhteysvirhe:", err);
        naytaIlmoitusModal( "Yhteysvirhe", "Palvelimeen ei saatu yhteyttä.", "OK");
    }
}

// --- YLEISET ---

function closeModal() {
    const confirmModal = document.getElementById("confirmModal");
    if(confirmModal) confirmModal.style.display = "none";
}

function poistaTuote(index) {
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
    ostoskori.splice(index, 1);
    localStorage.setItem('ostoskori', JSON.stringify(ostoskori));
    paivitaKassaNakyma();
}