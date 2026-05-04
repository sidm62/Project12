let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
updateCart();

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


        icon.innerHTML = "✅";
        title.innerText = "Onnistui!";
        text.innerText = `${name} on nyt lisätty ostoskoriin.`;
        footer.innerHTML = `<button class="btn-confirm" onclick="closeMenuModal()" style="width: 100%;">Selvä</button>`;
    };
}

function closeMenuModal() {
    document.getElementById("menuModal").style.display = "none";
}

function updateCart() {
    const count = document.getElementById('cart-count');
    if (count) {
        const totalItems = ostoskori.reduce((sum, item) => sum + item.amount, 0);
        count.innerText = totalItems;
    }
};

function updatenNavBar() {
    const authBtn = document.getElementById('main-auth-btn');
    const savedUser = localStorage.getItem('user');

    console.log("Tarkistaaan käyttäjä" + savedUser);

    if (savedUser && authBtn) {
        try {
            const user = JSON.parse(savedUser);
            authBtn.textContent = user.username;
            authBtn.href = "Profile.html";
            console.log("Nimi vaihdettu onnistui!");

            if (typeof registerLink !== 'undefined' && registerLink) {
                registerLink.style.display = "none";
            }

        } catch (error) {
            console.log("Virhe nimen vaihtamisessa: " + error);
        }

    }
}
window.onload = updatenNavBar;




// TIETOKANTAHAKU 

async function haeRuoatTietokannasta() {
    try {
        const response = await fetch("http://localhost:3000/api/products");
        const ruoat = await response.json();

        const ruokalista = document.getElementById("ruokalista");
        if (!ruokalista) return; 

        ruokalista.innerHTML = ""; 

        // ---------------------------------------------------------
        // 1. AUTOMAATTINEN PÄIVÄN ERIKOINEN
        // ---------------------------------------------------------
        const viikonpaivatEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const viikonpaivatFi = ["SUNNUNTAIN", "MAANANTAIN", "TIISTAIN", "KESKIVIIKON", "TORSTAIN", "PERJANTAIN", "LAUANTAIN"];
        
        const paivaIndeksi = new Date().getDay(); // Antaa numeron 0-6 (0 on sunnuntai)
        const tanaanOnEn = viikonpaivatEn[paivaIndeksi]; // Esim. "Thursday" (Tietokantaa varten)
        const paivaSuomeksi = viikonpaivatFi[paivaIndeksi]; // Esim. "TORSTAIN" (Nettisivua varten)

        // Etsitään ruoka, jonka 'weekday' sarake vastaa tätä englanninkielistä päivää
        const paivanTarjous = ruoat.find(tuote => tuote.weekday === tanaanOnEn);

        if (paivanTarjous) {
            const kuvaSrc = paivanTarjous.image_url ? `images/${paivanTarjous.image_url}` : '';
            const kuvaHTML = kuvaSrc ? `<img src="${kuvaSrc}" alt="${paivanTarjous.name}" class="product-image">` : '';

            // Lasketaan 20% alennus 
            const normaaliHinta = paivanTarjous.price;
            const tarjousHinta = (normaaliHinta * 0.8).toFixed(2);

            //lukee oikea päivä ja vanha hinta on yliviivattu
            ruokalista.innerHTML += `
                <div class="category-section" style="margin-top: 0; margin-bottom: 40px;">
                    <h2 class="category-title" style="color: #ff6b00; border-bottom-color: #ff6b00;">
                        🌟 ${paivaSuomeksi} TARJOUS 🌟
                    </h2>
                    <div class="product-card" style="border: 2px solid #ff6b00; background: #2a1b12;">
                        <div class="product-info">
                            <h3 style="font-size: 24px;">${paivanTarjous.name}</h3>
                            <p style="font-size: 16px; color: #ddd;">${paivanTarjous.description || ''}</p>
                            <div class="product-price">
                                <span style="text-decoration: line-through; color: #888; font-size: 14px; margin-right: 10px;">${normaaliHinta}€</span>
                                <span style="font-size: 22px; color: #ff6b00; font-weight: bold;">Nyt vain ${tarjousHinta}€</span>
                            </div>
                        </div>
                        <div class="product-image-container">
                            ${kuvaHTML}
                            <button class="btn-add-product" onclick="lisaaKoriin(${paivanTarjous.id}, '${paivanTarjous.name}', ${tarjousHinta})" style="background: #ff6b00; padding: 12px 20px;">
                                <i class="fas fa-cart-plus"></i> Lisää
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        // ---------------------------------------------------------
        // 2. NORMAALI RUOKALISTAN TULOSTUS (Ryhmittely)
        // ---------------------------------------------------------
        const ryhmat = {
            "Burgerit": [],
            "Pääruoat": [],
            "Lisukkeet": [],
            "Juomat": [],
            "Jälkiruoat": []
        };

        ruoat.forEach(tuote => {
            let dbKat = tuote.category ? tuote.category.toLowerCase() : "";
            if (dbKat === "burger") ryhmat["Burgerit"].push(tuote);
            else if (dbKat === "main") ryhmat["Pääruoat"].push(tuote);
            else if (dbKat === "side") ryhmat["Lisukkeet"].push(tuote);
            else if (dbKat === "drink") ryhmat["Juomat"].push(tuote);
            else if (dbKat === "dessert") ryhmat["Jälkiruoat"].push(tuote);
        });

        for (const [kategoriaNimi, tuotteet] of Object.entries(ryhmat)) {
            if (tuotteet.length === 0) continue; 

            // Etsitään ID:tä varten oikea englanninkielinen sana
            let katId = "";
            if (kategoriaNimi === "Burgerit") katId = "cat-burger";
            if (kategoriaNimi === "Pääruoat") katId = "cat-main";
            if (kategoriaNimi === "Lisukkeet") katId = "cat-side";
            if (kategoriaNimi === "Juomat") katId = "cat-drink";
            if (kategoriaNimi === "Jälkiruoat") katId = "cat-dessert";

            let html = `
                <div class="category-section" id="${katId}">
                    <h2 class="category-title">${kategoriaNimi}</h2>
                    <div class="product-grid">
            `;

            tuotteet.forEach(tuote => {
                const kuvaSrc = tuote.image_url ? `images/${tuote.image_url}` : '';
                const kuvaHTML = kuvaSrc ? `<img src="${kuvaSrc}" alt="${tuote.name}" class="product-image">` : '';

                html += `
                    <div class="product-card">
                        <div class="product-info">
                            <h3>${tuote.name}</h3>
                            <p>${tuote.description || ''}</p>
                            <div class="product-price">${tuote.price}€</div>
                        </div>
                        <div class="product-image-container">
                            ${kuvaHTML}
                            <button class="btn-add-product" onclick="lisaaKoriin(${tuote.id}, '${tuote.name}', ${tuote.price})">
                                <i class="fas fa-plus"></i> Lisää
                            </button>
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
            ruokalista.innerHTML += html;
        }

    } catch (error) {
        console.error("Virhe ruokien haussa:", error);
    }
}
// --- SMOOTH SCROLL  ---

// Rullaa pehmeästi valittuun kategoriaan
function scrollToCategory(id) {
    const element = document.getElementById(id);
    if (element) {
        const y = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({top: y, behavior: 'smooth'});
    }
}

// Seuraa rullausta ja päivittää aktiivisen kategorian valikkoon
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('.category-section');

    // Katsotaan mitä kategoriaa selataan parhaillaan
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });

    // Vaihdetaan oranssi viiva oikean otsikon alle
    const navLi = document.querySelectorAll('.category-list-horizontal li');
    navLi.forEach(li => {
        li.classList.remove('active');
        if (li.getAttribute('onclick').includes(current)) {
            li.classList.add('active');
        }
    });
});

document.addEventListener("DOMContentLoaded", haeRuoatTietokannasta);