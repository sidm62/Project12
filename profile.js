/**
 * ROAST BURGER - PROFIILISIVUN LOGIIKKA (profile.js)
 * Hallitsee:
 * - Käyttäjäprofiilin tietojen haku (ID, sähköposti, rooli)
 * - Salasanan vaihtaminen validaatioineen
 * - Reaaliaikainen tilausten seuranta (Aktiiviset vs. Historia)
 * - "Tilaa uudelleen" -toiminnallisuus
 */

document.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("userId");

    // Estetään pääsy profiiliin ilman kirjautumista
    if (!userId) {
        console.log("Käyttäjä-ID puuttuu, ohjataan kirjautumiseen.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/auth/user/${userId}`);
        if (response.ok) {
            const user = await response.json();

            // Päivitetään profiilin perustiedot DOM-elementteihin
            if (document.getElementById("username")) document.getElementById("username").textContent = user.username;
            if (document.getElementById("email")) document.getElementById("email").textContent = user.email;
            if (document.getElementById("role")) document.getElementById("role").textContent = user.role || "Asiakas";

            // Haetaan ja listataan tilaushistoria
            naytaTilausHistoria();
            console.log("Profiilitiedot päivitetty.");
        }
    } catch (error) {
        console.error('Virhe profiilin haussa:', error);
    }
});

// --- SALASANAN HALLINTA ---

/** Näyttää piilotetun salasanan vaihtolomakkeen */
function changePassword() {
    const section = document.getElementById("password-change-section");
    const toggleBtn = document.getElementById("toggle-pw-btn");
    if (section) {
        section.style.display = "flex";
        if (toggleBtn) toggleBtn.style.display = "none";
    }
}

/** Lähettää uuden salasanan palvelimelle validoinnin jälkeen */
async function savePassword() {
    const userId = localStorage.getItem("userId");
    const passwordChange = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!passwordChange || !confirmPassword) {
        alert("Syötä uusi salasana ja vahvista se.");
        return;
    }

    if (passwordChange !== confirmPassword) {
        alert("Salasanat eivät täsmää!");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/auth/change-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: userId, newPassword: passwordChange }),
        });

        if (response.ok) {
            alert("Salasana vaihdettu onnistuneesti!");
            location.reload(); // Päivitetään sivu ja nollataan lomake
        } else {
            const data = await response.json();
            alert("Virhe: " + (data.message || "Salasanaa ei voitu vaihtaa."));
        }
    } catch (error) {
        console.error('Virhe salasanan vaihdossa:', error);
    }
}

// --- TILAUSHISTORIA JA SEURANTA ---

/**
 * Hakee käyttäjän kaikki tilaukset ja jakaa ne kahteen kategoriaan:
 * 1. Aktiiviset (Status: Vastaanotettu, Valmistuksessa)
 * 2. Historia (Status: Valmis)
 */
async function naytaTilausHistoria() {
    const historyContainer = document.getElementById("history-container");
    const activeContainer = document.getElementById("active-orders-list");
    const uId = localStorage.getItem("userId");

    if (!historyContainer || !uId) return;

    try {
        const response = await fetch(`http://localhost:3000/api/orders/user/${uId}`);
        const data = await response.json();

        if (data.length === 0) {
            historyContainer.innerHTML = "<p>Ei aiempia tilauksia.</p>";
            if (activeContainer) activeContainer.innerHTML = "<p>Ei aktiivisia tilauksia.</p>";
            return;
        }

        const orders = data.reduce((acc, curr) => {
            if (!acc[curr.orderId]) {
                acc[curr.orderId] = {
                    id: curr.orderId,
                    date: new Date(curr.created_at).toLocaleDateString("fi-FI"),
                    summa: parseFloat(String(curr.total_price).replace(',', '.')) || 0,
                    status: curr.status || "Vastaanotettu",
                    tuotteet: []
                };
            }
            acc[curr.orderId].tuotteet.push({
                id: curr.product_id,
                name: curr.name,
                price: curr.price,
                amount: curr.quantity
            });
            return acc;
        }, {});

        let historiaHtml = '<h3>Menneet tilaukset</h3><ul class="history-list">';
        let aktiivisetHtml = '';
        let hasActive = false;
        let hasHistory = false;

        Object.values(orders).reverse().forEach(order => {
            const tuotteetTeksti = order.tuotteet.map(p => `${p.amount}x ${p.name}`).join(", ");
            const tuotteetJson = JSON.stringify(order.tuotteet).replace(/"/g, '&quot;');

            // TARKISTUS: Onko tilaus vielä tuloillaan?
            if (order.status !== "Valmis" && order.status !== "Peruttu") {
                hasActive = true;
                aktiivisetHtml += `
                    <div class="active-order-card" style="border: 1px solid #ff6b00; padding: 15px; margin-bottom: 10px; border-radius: 8px;">
                        <div class="active-order-header" style="display: flex; justify-content: space-between;">
                            <strong>Tilaus #${order.id}</strong>
                            <span class="status-badge">⏳ ${order.status}</span>
                        </div>
                        <p>${tuotteetTeksti}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong>Yhteensä: ${order.summa.toFixed(2)}€</strong>
                            <button onclick="orderAgain('${tuotteetJson}')" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;">
                                Tilaa uudelleen
                            </button>
                        </div>
                    </div>`;
            } else {
                hasHistory = true;
                historiaHtml += `
                    <li class="history-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding: 10px 0;">
                        <div>
                            <strong>Tilaus #${order.id} | ${order.date} | ${order.summa.toFixed(2)}€</strong><br>
                            <small>${tuotteetTeksti}</small>
                        </div>
                        <button onclick="orderAgain('${tuotteetJson}')" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem;">
                            Tilaa uudelleen
                        </button>
                    </li>`;
            }
        });

        if (activeContainer) activeContainer.innerHTML = hasActive ? aktiivisetHtml : "<p>Ei aktiivisia tilauksia.</p>";
        historyContainer.innerHTML = hasHistory ? historiaHtml + '</ul>' : "<p>Ei aiempia tilauksia.</p>";

    } catch (error) {
        console.error("Tilaushistorian haku epäonnistui:", error);
    }
}
/** * Mahdollistaa vanhan tilauksen sisällön kopioimisen ostoskoriin.
 * @param {string} tuotteetRaw - JSON-merkkijono tilauksen tuotteista.
 */
function orderAgain(tuotteetRaw) {
    const modal = document.getElementById("menuModal");
    const tuotteetArray = JSON.parse(tuotteetRaw);

    document.getElementById("modal-icon").innerHTML = "🔄";
    document.getElementById("modal-title").innerText = "Tilaa uudelleen?";
    document.getElementById("modal-text").innerText = "Lisätäänkö kaikki tilauksen tuotteet ostoskoriin?";

    document.getElementById("modal-footer").innerHTML = `
        <button class="btn-cancel" onclick="closeMenuModal()">Peruuta</button>
        <button class="btn-confirm" id="confirm-reorder">Lisää kaikki</button>
    `;

    modal.style.display = "flex";

    document.getElementById("confirm-reorder").onclick = function() {
        let ostoskori = JSON.parse(localStorage.getItem("ostoskori")) || [];

        tuotteetArray.forEach(oldItem => {
            const target = ostoskori.find(item => item.id === oldItem.id);
            if (target) {
                target.quantity += oldItem.quantity;
            } else {
                ostoskori.push({...oldItem});
            }
        });

        localStorage.setItem("ostoskori", JSON.stringify(ostoskori));
        window.location.href = 'Kassa.html';
    };
}

/** Uloskirjautuminen */
function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    window.location.href = "Roast.html";
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) logoutBtn.addEventListener("click", logout);