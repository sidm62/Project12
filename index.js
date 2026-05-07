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

// --- APUFUNKTIO RUOKAVALIOMERKINNÖILLE ---
function luoAllergeenitHTML(allergeeniTeksti) {
    if (!allergeeniTeksti) return "";
    const lista = allergeeniTeksti.split(",").map(s => s.trim());
    let html = '<div class="allergen-container" style="display: flex; align-items: center; gap: 4px;">';
    
    lista.forEach((merkki, indeksi) => {
        html += `<span class="allergen-badge ${merkki}">${merkki}</span>`;
        // Lisätään pilkku, jos kyseessä ei ole listan viimeinen merkki
        if (indeksi < lista.length - 1) {
            html += '<span style="color: white; font-weight: bold;">,</span>';
        }
    });
    
    html += '</div>';
    return html;
}

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
            const allergeenitHTML = luoAllergeenitHTML(paivanTarjous.allergens);
            
            ruokalista.innerHTML += `
                <div class="category-section" style="margin-bottom: 40px;">
                    <h2 class="category-title" style="color: #ff6b00;">🌟 ${viikonpaivatFi[paivaIndeksi]} TARJOUS 🌟</h2>
                    <div class="product-card highlight-card">
                        <div class="product-info">
                            <h3>${paivanTarjous.name}</h3>
                            <p>${paivanTarjous.description || ''}</p>
                            ${allergeenitHTML}
                            <div class="product-price">
                                <span class="old-price-strike" style="text-decoration: line-through; color: #888; margin-right: 10px;">${paivanTarjous.price}€</span>
                                <span class="new-price" style="color: #ff6b00; font-weight: bold;">${tarjousHinta}€</span>
                            </div>
                        </div>
                        <div class="product-image-container">
                            <img src="images/${paivanTarjous.image_url}" alt="${paivanTarjous.name}" class="product-image">
                            <button class="btn-add-product" onclick="lisaaKoriin(${paivanTarjous.id}, '${paivanTarjous.name}', ${tarjousHinta})">Lisää</button>
                        </div>
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
                const allergeenitHTML = luoAllergeenitHTML(tuote.allergens);
                
                let hintaTulostus = `${tuote.price} €`;
                let ostoskoriHinta = tuote.price;

                if (tuote.discount_price !== null && tuote.discount_price > 0) {
                    hintaTulostus = `
                        <span style="text-decoration: line-through; color: #888; font-size: 0.9em;">${tuote.price} €</span> 
                        <span style="color: #ff3333; font-weight: bold; margin-left: 8px;">${tuote.discount_price} € 🔥</span>
                    `;
                    ostoskoriHinta = tuote.discount_price;
                }

                html += `
                    <div class="product-card">
                        <div class="product-info">
                            <h3>${tuote.name}</h3>
                            <p>${tuote.description || ''}</p>
                            ${allergeenitHTML}
                            <div class="product-price">${hintaTulostus}</div>
                        </div>
                        <div class="product-image-container">
                            <img src="images/${tuote.image_url}" alt="${tuote.name}" class="product-image">
                            <button class="btn-add-product" onclick="lisaaKoriin(${tuote.id}, '${tuote.name}', ${ostoskoriHinta})">Lisää</button>
                        </div>
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

// --- HSL API: AIKATAULUJEN HAKU (OMALTA PALVELIMELTA) ---
async function haeHSL() {
    const listaElementti = document.getElementById("hsl-lista");
    
    if (!listaElementti) {
        return; 
    }

    try {
        const baseUrl = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') 
        ? 'http://localhost:3000' 
        : 'http://10.120.36.67:3000';

const response = await fetch(`${baseUrl}/api/hsl`);
        
        // SUOJAMUURI: Jos backend palauttaa virheen (kuten 500), heitetään virhe heti
        if (!response.ok) {
            throw new Error(`Palvelinvirhe: ${response.status}`);
        }

        const data = await response.json();
        
        // SUOJAMUURI: Varmistetaan, että HSL-data on olemassa ennen sen lukemista
        if (!data || !data.data || !data.data.stop) {
            throw new Error("Datan muoto on väärä tai avain ei ole vielä aktiivinen.");
        }

        const lahdot = data.data.stop.stoptimesWithoutPatterns;
        
        listaElementti.innerHTML = ""; // Tyhjennetään teksti

        lahdot.forEach(lahto => {
            const tunnit = Math.floor(lahto.realtimeDeparture / 3600) % 24;
            const minuutit = Math.floor((lahto.realtimeDeparture % 3600) / 60);
            const aika = `${tunnit.toString().padStart(2, '0')}:${minuutit.toString().padStart(2, '0')}`;
            
            // Tehdään tulostuksesta asiakkaalle selkeämpi ja visuaalisempi
            listaElementti.innerHTML += `
                <li style="padding: 10px 0; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.1em; color: #ff6b00;">🚌 <strong>${aika}</strong></span>
                    <span style="font-size: 0.9em; color: #aaa;">Suunta: ${lahto.headsign} (Jää pois Sörnäisissä)</span>
                </li>
            `;
        });

    } catch (error) {
        console.error("Virhe HSL-datan haussa:", error);
        if (listaElementti) {
            listaElementti.innerHTML = "<li style='color: #e74c3c;'>Aikatauluja ei voitu ladata (Palvelinvirhe).</li>";
        }
    }
}

// Suoritetaan haku automaattisesti, kun sivu ladataan
document.addEventListener("DOMContentLoaded", haeHSL);