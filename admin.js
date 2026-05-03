// Ladatataan ruoat heti kun sivu aukeaa
document.addEventListener("DOMContentLoaded", haeRuoatAdminTaulukkoon);

async function haeRuoatAdminTaulukkoon() {
    try {
        const response = await fetch("http://localhost:3000/api/products");
        const ruoat = await response.json();

        const taulukko = document.getElementById("tuotteet-lista");
        taulukko.innerHTML = ""; 

        // Käydään jokainen ruoka läpi ja tehdään niille oma rivi taulukkoon
        ruoat.forEach(tuote => {
            
            // TARKISTETAAN ONKO TUOTTEELLA ALENNUS
            let hintaTulostus = `${tuote.price} €`; // Oletuksena normaali hinta
            
            if (tuote.discount_price !== null && tuote.discount_price > 0) {
                // Jos on alennus, yliviivataan vanha ja näytetään uusi punaisena
                hintaTulostus = `<span style="text-decoration: line-through; color: #888; font-size: 12px; margin-right: 5px;">${tuote.price} €</span> <span style="color: #ff3333; font-weight: bold;">${tuote.discount_price} € 🔥</span>`;
            }

            const rivi = `
                <tr style="border-bottom: 1px solid #444;">
                    <td style="padding: 12px;"><b>${tuote.name}</b></td>
                    <td style="padding: 12px; text-transform: capitalize;">${tuote.category || '-'}</td>
                    <td style="padding: 12px; color: #ff6b00; font-weight: bold;">${hintaTulostus}</td>
                    <td style="padding: 12px;">
                        <button onclick="avaaMuokkausIkkuna(${tuote.id}, '${tuote.name}', ${tuote.price}, '${tuote.category}', '${tuote.image_url}', ${tuote.discount_price || null})" 
                                style="background: #333; color: white; border: 1px solid #555; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">
                            <i class="fas fa-edit"></i> Muokkaa
                        </button>
                        
                        <button onclick="poistaTuote(${tuote.id})" 
                                style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Poista
                        </button>
                    </td>
                </tr>
            `;
            taulukko.innerHTML += rivi;
        });
    } catch (error) {
        console.error("Virhe ladattaessa:", error);
    }
}

// FUNKTIO TUOTTEEN POISTAMISELLE
async function poistaTuote(id) {
    if (!confirm("Haluatko varmasti poistaa tämän tuotteen?")) return;

    try {
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
            method: "DELETE"
        });

        if (response.ok) {
            haeRuoatAdminTaulukkoon(); // Päivitetään lista heti
        } else {
            alert("Poistaminen epäonnistui palvelimella.");
        }
    } catch (error) {
        console.error("Virhe poistossa:", error);
    }
}

// FUNKTIOT LISÄYSLOMAKKEELLE
function avaaLisaysIkkuna() {
    document.getElementById("lisays-lomake").style.display = "block";
}

function suljeLisaysIkkuna() {
    document.getElementById("lisays-lomake").style.display = "none";
}

async function tallennaUusiTuote() {
    const nimi = document.getElementById("uusi-nimi").value;
    const hinta = document.getElementById("uusi-hinta").value;
    const kategoria = document.getElementById("uusi-kategoria").value;
    const kuva = document.getElementById("uusi-kuva").value;

    if (!nimi || !hinta) {
        alert("Täytä nimi ja hinta!");
        return;
    }

    const uusiTuote = { name: nimi, price: parseFloat(hinta), category: kategoria, image_url: kuva };

    try {
        const response = await fetch("http://localhost:3000/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(uusiTuote)
        });

        if (response.ok) {
            suljeLisaysIkkuna();
            haeRuoatAdminTaulukkoon();
            document.getElementById("uusi-nimi").value = "";
            document.getElementById("uusi-hinta").value = "";
        }
    } catch (error) {
        console.error("Virhe tallennuksessa:", error);
    }
}
// --- UUSI PONNAHDUSIKKUNA MUOKKAUKSELLE ---
function avaaMuokkausIkkuna(id, nimi, hinta, kategoria, kuva, alennus) {
    document.getElementById("muokkaa-id").value = id;
    document.getElementById("muokkaa-nimi").value = nimi;
    document.getElementById("muokkaa-hinta").value = hinta;
    document.getElementById("muokkaa-kategoria").value = kategoria;
    document.getElementById("muokkaa-kuva").value = kuva !== 'null' ? kuva : ''; 
    
    // Jos alennushinta on olemassa, laitetaan se kenttään. Muuten tyhjä.
    document.getElementById("muokkaa-alennus").value = alennus !== null ? alennus : '';

    document.getElementById("muokkaus-tausta").style.display = "block";
    document.getElementById("muokkaus-lomake").style.display = "block";
}
function suljeMuokkausIkkuna() {
    document.getElementById("muokkaus-tausta").style.display = "none";
    document.getElementById("muokkaus-lomake").style.display = "none";
}

async function tallennaMuokkaukset() {
    const id = document.getElementById("muokkaa-id").value;
    const alennusKentta = document.getElementById("muokkaa-alennus").value;
    
    const paivitettyTuote = {
        name: document.getElementById("muokkaa-nimi").value,
        price: parseFloat(document.getElementById("muokkaa-hinta").value),
        category: document.getElementById("muokkaa-kategoria").value,
        image_url: document.getElementById("muokkaa-kuva").value,
        // Jos alennuskenttä on tyhjä, lähetetään tietokantaan null
        discount_price: alennusKentta ? parseFloat(alennusKentta) : null
    };
    

    try {
        const response = await fetch(`http://localhost:3000/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paivitettyTuote)
        });

        if (response.ok) {
            suljeMuokkausIkkuna();
            haeRuoatAdminTaulukkoon(); 
        } else {
            alert("Virhe tallennuksessa!");
        }
    } catch (error) {
        console.error("Virhe muokkauksessa:", error);
    }
}
// --- TILAUSTEN HALLINTA ---

// Ladataan tilaukset heti kun sivu aukeaa (lisää tämä koodin yläosaan muiden latauksien yhteyteen, jos haluat)
document.addEventListener("DOMContentLoaded", haeTilauksetAdminPaneeliin);

// Funktio, joka hakee tilaukset
async function haeTilauksetAdminPaneeliin() {
    try {
        const response = await fetch("http://localhost:3000/api/orders");
        const tilaukset = await response.json();

        const laatikko = document.getElementById("tilaukset-lista");
        if (!laatikko) return;
        
        laatikko.innerHTML = ""; // Tyhjennetään vanhat pois

        if (tilaukset.length === 0) {
            laatikko.innerHTML = "<p style='color: #aaa;'>Ei saapuneita tilauksia.</p>";
            return;
        }

        tilaukset.forEach(tilaus => {
            // Määritetään napit tilauksen nykyisen statuksen perusteella
            let toimintoNapit = "";
            let statusVari = "#aaa"; // Oletusväri

            if (tilaus.status === 'received' || tilaus.status === 'Vastaanotettu') {
                statusVari = "#e74c3c"; // Punainen, vaatii huomiota
                toimintoNapit = `<button onclick="paivitaTilausStatus(${tilaus.id}, 'Valmistuksessa')" style="background: #f39c12; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Siirrä valmistukseen</button>`;
            } else if (tilaus.status === 'Valmistuksessa') {
                statusVari = "#f39c12"; // Oranssi
                toimintoNapit = `<button onclick="paivitaTilausStatus(${tilaus.id}, 'Valmis')" style="background: #27ae60; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">Merkitse Valmiiksi</button>`;
            } else if (tilaus.status === 'Valmis') {
                statusVari = "#27ae60"; // Vihreä
                toimintoNapit = `<span style="color: #27ae60; font-weight: bold;"><i class="fas fa-check"></i> Tilaus toimitettu</span>`;
            }

            // Rakennetaan tilauksen HTML-kortti
            const tilausKortti = `
                <div style="border: 1px solid #444; padding: 15px; border-radius: 8px; background: #222;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #ff6b00;">Tilaus #${tilaus.id}</h4>
                        <span style="color: ${statusVari}; font-weight: bold;">Tila: ${tilaus.status}</span>
                    </div>
                    <p style="margin: 5px 0; color: #ddd;">Yhteensä: <b>${tilaus.total_price} €</b></p>
                    <div style="margin-top: 15px; text-align: right;">
                        ${toimintoNapit}
                    </div>
                </div>
            `;
            laatikko.innerHTML += tilausKortti;
        });
    } catch (error) {
        console.error("Virhe tilausten haussa:", error);
    }
}

// Funktio, joka lähettää uuden statuksen palvelimelle (Parametrit: orderId, uusiStatus)
async function paivitaTilausStatus(orderId, uusiStatus) {
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: uusiStatus })
        });

        if (response.ok) {
            // Kun päivitys onnistui, päivitetään lista heti, jotta muutos näkyy ruudulla
            haeTilauksetAdminPaneeliin();
        } else {
            alert("Virhe statuksen päivityksessä.");
        }
    } catch (error) {
        console.error("Virhe:", error);
    }
}