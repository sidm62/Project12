/**
 * ROAST BURGER - PÄÄLOGIIKKA (index.js)
 * Sisältää:
 * - Ostoskorin hallinnan (localStorage)
 * - Ruokalistan dynaamisen haun ja ryhmittelyn
 * - Päivän tarjous -logiikan
 * - Käyttäjän autentikoinnin tarkistuksen navigaatiossa
 * - Monikielisyyden (MyMemory API)
 */

// --- ALUSTUS ---
let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

/**
 * Suoritetaan, kun sivu on ladattu. Alustaa käyttöliittymän elementit.
 */
document.addEventListener("DOMContentLoaded", () => {
    haeRuoatTietokannasta();
    updateCart();
    updatenNavBar();
});

// --- OSTOSKORIN HALLINTA ---

/**
 * Lisää valitun tuotteen ostoskoriin ja näyttää vahvistusikkunan.
 * @param {number} id - Tuotteen ID
 * @param {string} name - Tuotteen nimi
 * @param {number} price - Tuotteen hinta
 */
function lisaaKoriin(id, name, price) {
    const modal = document.getElementById("menuModal");
    const title = document.getElementById("modal-title");
    const text = document.getElementById("modal-text");
    const footer = document.getElementById("modal-footer");
    const icon = document.getElementById("modal-icon");

    icon.innerHTML = "🍔";
    title.innerText = "Lisätäänkö koriin?";
    text.innerText = `Haluatko lisätä tuotteen "${name}" ostoskoriin?`;

    footer.innerHTML = `
        <button class="btn-cancel" onclick="closeMenuModal()">Peruuta</button>
        <button class="btn-confirm" id="confirm-add-action">Lisää</button>
    `;

    modal.style.display = "flex";

    document.getElementById("confirm-add-action").onclick = function() {
        const existingProduct = ostoskori.find(item => item.name === name);
        if (existingProduct) {
            existingProduct.amount += 1;
        } else {
            ostoskori.push({ id: id, name: name, price: price, amount: 1, extra: "" });
        }

        localStorage.setItem('ostoskori', JSON.stringify(ostoskori));
        updateCart();

        // Muutetaan modal onnistumisilmoitukseksi
        icon.innerHTML = "✅";
        title.innerText = "Onnistui!";
        text.innerText = `${name} on nyt lisätty ostoskoriin.`;
        footer.innerHTML = `<button class="btn-confirm" onclick="closeMenuModal()" style="width: 100%;">Selvä</button>`;
    };
}

/** Sulkee ostoskorin vahvistusikkunan */
function closeMenuModal() {
    document.getElementById("menuModal").style.display = "none";
}

/** Päivittää ostoskorin kuvakkeen lukumäärän navigointipalkissa */
function updateCart() {
    // Haetaan uusin tila localStoragesta
    const ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
    const countElement = document.getElementById('cart-count');

    if (countElement) {
        // Lasketaan tuotteiden yhteismäärä (amount)
        const totalItems = ostoskori.reduce((sum, item) => sum + (parseInt(item.amount) || 0), 0);
        countElement.innerText = totalItems;

        // Valinnainen: Piilotetaan koko "cart-status" jos kori on tyhjä
        const cartStatus = document.getElementById('cart-status');
        if (cartStatus) {
            cartStatus.style.display = totalItems > 0 ? "block" : "none";
        }
    }
}

// --- KÄYTTÄJÄN HALLINTA ---

/**
 * Päivittää navigointipalkin vastaamaan käyttäjän tilaa.
 * Jos käyttäjä on kirjautunut, vaihdetaan 'Kirjaudu' -> 'Käyttäjänimi'.
 */
function updatenNavBar() {
    const authBtn = document.getElementById('main-auth-btn');
    const registerLink = document.getElementById('registerLink');
    const savedUser = localStorage.getItem('user');

    if (savedUser && authBtn) {
        try {
            const user = JSON.parse(savedUser);
            authBtn.textContent = user.username;
            authBtn.href = "Profile.html";

            if (registerLink) {
                registerLink.style.display = "none";
            }
        } catch (error) {
            console.error("Virhe käyttäjätietojen käsittelyssä:", error);
        }
    }
}

// --- RUOKALISTAN HAKU JA GENEROINTI ---

/**
 * Hakee tuotteet backendiltä, generoi päivän tarjouksen ja ryhmittelee muun listan.
 * @async
 */
async function haeRuoatTietokannasta() {
    try {
        const response = await fetch("http://localhost:3000/api/products");
        const ruoat = await response.json();
        const ruokalista = document.getElementById("ruokalista");
        if (!ruokalista) return;

        ruokalista.innerHTML = "";

        const viikonpaivatEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const viikonpaivatFi = ["SUNNUNTAIN", "MAANANTAIN", "TIISTAIN", "KESKIVIIKON", "TORSTAIN", "PERJANTAIN", "LAUANTAIN"];
        const paivaIndeksi = new Date().getDay();
        const tanaanEn = viikonpaivatEn[paivaIndeksi];

        const paivanTarjous = ruoat.find(tuote => tuote.weekday === tanaanEn);

        // 1. PÄIVÄN TARJOUS
        if (paivanTarjous) {
            const tarjousHinta = (paivanTarjous.price * 0.8).toFixed(2);
            ruokalista.innerHTML += `
                <div class="category-section" style="margin-bottom: 40px;">
                    <h2 class="category-title" style="color: #ff6b00;">🌟 ${viikonpaivatFi[paivaIndeksi]} TARJOUS 🌟</h2>
                    <div class="product-card highlight-card">
                        <img src="images/${paivanTarjous.image_url}" alt="${paivanTarjous.name}" class="product-image">
                        <div class="product-info">
                            <h3>${paivanTarjous.name}</h3>
                            <p>${paivanTarjous.description || ''}</p>
                            <div class="product-price">
                                <span class="old-price-strike">${paivanTarjous.price}€</span>
                                <span class="new-price">${tarjousHinta}€</span>
                            </div>
                        </div>
                        <button class="btn-add-product" onclick="lisaaKoriin(${paivanTarjous.id}, '${paivanTarjous.name}', ${tarjousHinta})">Lisää</button>
                    </div>
                </div>`;
        }

        // 2. RYHMITTELYYN PERUSTUVA LISTA
        const ryhmat = { "Burgerit": "burger", "Pääruoat": "main", "Lisukkeet": "side", "Juomat": "drink", "Jälkiruoat": "dessert" };

        for (const [nimi, koodi] of Object.entries(ryhmat)) {
            const kategoriaTuotteet = ruoat.filter(t => t.category && t.category.toLowerCase() === koodi);
            if (kategoriaTuotteet.length === 0) continue;

            let html = `<div class="category-section" id="cat-${koodi}">
                            <h2 class="category-title">${nimi}</h2>
                            <div class="product-grid">`;

            kategoriaTuotteet.forEach(tuote => {
                html += `
                    <div class="product-card">
                        <img src="images/${tuote.image_url}" alt="${tuote.name}" class="product-image">
                        <div class="product-info">
                            <h3>${tuote.name}</h3>
                            <p>${tuote.description || ''}</p>
                            <div class="product-price">${tuote.price}€</div>
                        </div>
                        <button class="btn-add-product" onclick="lisaaKoriin(${tuote.id}, '${tuote.name}', ${tuote.price})">Lisää</button>
                    </div>`;
            });
            html += `</div></div>`;
            ruokalista.innerHTML += html;
        }
    } catch (error) {
        console.error("Virhe ruokien latauksessa:", error);
    }
}
// --- NAVIGOINTI JA RULLAUS ---

/** Rullaa näkymän pehmeästi kategoriaan */
function scrollToCategory(id) {
    const element = document.getElementById(id);
    if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({top: y, behavior: 'smooth'});
    }
}


/**
 * Yleiskäyttöinen modaali-funktio ilmoitusten näyttämiseen.
 */
function naytaIlmoitusModal(otsikko, teksti, nappiTeksti, callback = null) {
    const modal = document.getElementById("menuModal");
    const title = document.getElementById("modal-title");
    const text = document.getElementById("modal-text");
    const footer = document.getElementById("modal-footer");

    // Jos HTML-rakennnetta ei löydy, käytetään varajärjestelmänä alertia
    if (!modal) {
        alert(otsikko + ": " + teksti);
        if (callback) callback();
        return;
    }

    // Päivitetään modaalin sisältö
    title.innerText = otsikko;
    text.innerText = teksti;

    // Luodaan painike dynaamisesti
    footer.innerHTML = `<button class="btn-confirm" id="modal-ok-btn" style="width: 100%;">${nappiTeksti}</button>`;

    // Tuodaan modaali näkyviin (CSS:ssä oletuksena display: none)
    modal.style.display = "flex";

    // Määritetään mitä tapahtuu kun nappia painetaan
    document.getElementById("modal-ok-btn").onclick = function() {
        modal.style.display = "none"; // Suljetaan modaali
        if (callback) callback();      // Jos callback annettu, suoritetaan se
    };
}