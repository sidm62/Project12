document.addEventListener("DOMContentLoaded", () => {
    // Tarkistetaan kummalla sivulla ollaan
    if (document.getElementById("kassa-lista")) {
        paivitaKassaNakyma();
    }

    if (document.getElementById("final-total")) {
        laskeLoppusumma();
    }
});

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
        const maara = parseInt(tuote.amount);
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
    event.preventDefault();
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        alert("Ostoskori on tyhjä!");
        return;
    }
    // Näyttää modalin Kassa.html-sivulla
    document.getElementById("confirmModal").style.display = "flex";
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
        alert("Kirjaudu sisään!");
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
            alert("Tilaus vastaanotettu!");
            window.location.href = "Roast.html";
        } else {
            alert("Virhe tilauksessa.");
        }
    } catch (err) {
        console.error("Yhteysvirhe:", err);
    }
}

// --- YLEISET ---

function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
}

function poistaTuote(index) {
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
    ostoskori.splice(index, 1);
    localStorage.setItem('ostoskori', JSON.stringify(ostoskori));
    paivitaKassaNakyma();
}