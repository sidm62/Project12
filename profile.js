document.addEventListener("DOMContentLoaded", async () => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        console.log("Käyttäjä-ID puuttuu, ohjataan kirjautumiseen.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/auth/user/${userId}`);
        if (response.ok) {
            const user = await response.json();


            if (document.getElementById("username")) {
                document.getElementById("username").textContent = user.username;
            }

            if (document.getElementById("email")) {
                document.getElementById("email").textContent = user.email;
            }


            if (document.getElementById("role")) {
                document.getElementById("role").textContent = user.role || "Asiakas";
            }

            naytaTilausHistoria();

            console.log("Tiedot haettu tietokannasta ja päivitetty sivulle");

        } else {
            console.log("Käyttäjätietoja ei saatu tietokannasta", response.status);
        }
    } catch (error) {
        console.error('Virhe profiilin haussa:', error);
    }
});

function changePassword() {
    const section = document.getElementById("password-change-section");
    const toggleBtn = document.getElementById("toggle-pw-btn"); // Varmista että ID on oikein

    if (section) {
        section.style.display = "flex";
        if (toggleBtn) toggleBtn.style.display = "none";
    }
}

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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId: userId, newPassword: passwordChange }),
        });

        const data = await response.json();


        if (response.ok) {
            alert("Salasana vaihdettu onnistuneesti!");


            document.getElementById("password").value = "";
            document.getElementById("confirm-password").value = "";
            document.getElementById("password-change-section");

            const toggleBtn = document.getElementById("toggle-pw-btn");
            if (toggleBtn) toggleBtn.style.display = "block";
        } else {
            alert("Virhe: " + (data.message || "Salasanaa ei voitu vaihtaa."));
        }
    } catch (error) {
        console.error('Virhe salasanan vaihdossa:', error);
        alert("Yhteysvirhe palvelimeen.");
    }
}

function logout() {
    console.log("Kirjaudutaan ulos...");


    localStorage.removeItem("userId");
    localStorage.removeItem("user");


    window.location.href = "Roast.html";
}

const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

async function naytaTilausHistoria() {
    const historyContainer = document.getElementById("history-container");
    const activeContainer = document.getElementById("active-orders-list"); // Uusi seurantalaatikko
    const uId = localStorage.getItem("userId");

    if (!historyContainer || !uId) return;

    try {
        const response = await fetch(`http://localhost:3000/api/orders/user/${uId}`);
        const data = await response.json();

        if (data.length === 0) {
            historyContainer.innerHTML = "<p>Ei aiempia tilauksia.</p>";
            if (activeContainer) activeContainer.innerHTML = "<p style='color:#ccc;'>Ei aktiivisia tilauksia.</p>";
            return;
        }

        // 1. Ryhmitellään data tilauksittain
        const orders = data.reduce((acc, curr) => {
            if (!acc[curr.orderId]) {
                let hinta = String(curr.total_price).replace(',', '.');
                acc[curr.orderId] = {
                    id: curr.orderId,
                    date: new Date(curr.created_at).toLocaleDateString("fi-FI"),
                    summa: parseFloat(hinta) || 0,
                    status: curr.status || "Vastaanotettu", // Otetaan status talteen (oletus "Vastaanotettu")
                    tuotteet: []
                };
            }

            acc[curr.orderId].tuotteet.push({
                id: curr.product_id,
                name: curr.name,
                price: curr.price,
                quantity: curr.quantity
            });
            return acc;
        }, {});

        // 2. Valmistellaan HTML-muuttujat kumpaankin laatikkoon
        let historiaHtml = '<h3 style="margin-top:20px;">Tilaushistoria</h3><ul style="list-style:none; padding:0; text-align:left;">';
        let aktiivisetHtml = '';
        
        let onkoAktiivisia = false;
        let onkoHistoriaa = false;

        // 3. Käydään tilaukset läpi ja lajitellaan ne statuksen perusteella
        Object.values(orders).forEach(order => {
            const tuotteetTeksti = order.tuotteet.map(p => `${p.quantity}x ${p.name}`).join(", ");
            const tuotteetJson = JSON.stringify(order.tuotteet).replace(/"/g, '&quot;');

            // Jos tilauksen status EI OLE "Valmis", se menee ylös seurantaan
            if (order.status !== "Valmis") {
                onkoAktiivisia = true;
                aktiivisetHtml += `
                    <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #ff6b00;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <strong style="color: #fff; font-size: 1.1rem;">Tilaus #${order.id}</strong>
                            <span style="background: #ff6b00; color: white; padding: 5px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
                                ⏳ ${order.status}
                            </span>
                        </div>
                        <p style="margin: 0 0 10px 0; color: #ccc; font-size: 0.95rem;">${tuotteetTeksti}</p>
                        <p style="margin: 0; color: #fff; font-weight: bold;">Yhteensä: ${order.summa.toFixed(2)}€</p>
                    </div>
                `;
            } 
            // Jos tilauksen status ON "Valmis", se menee alas vanhaan historiaan
            else {
                onkoHistoriaa = true;
                historiaHtml += `
                    <li style="border-bottom: 1px solid #444; padding: 15px 0; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>Tilaus #${order.id} | ${order.date} | ${order.summa.toFixed(2)}€</strong><br>
                            <small style="color: #aaa;">${tuotteetTeksti}</small>
                        </div>
                        <button onclick="orderAgain('${tuotteetJson}')" class="btn-login" style="width: auto; padding: 8px 15px; font-size: 0.8rem; margin: 0;">
                            Tilaa uudelleen
                        </button>
                    </li>`;
            }
        });

        historiaHtml += '</ul>';

        // 4. Päivitetään aktiivisten tilausten laatikko
        if (activeContainer) {
            if (onkoAktiivisia) {
                activeContainer.innerHTML = aktiivisetHtml;
            } else {
                activeContainer.innerHTML = '<p style="color: #ccc; font-style: italic;">Ei aktiivisia tilauksia tällä hetkellä.</p>';
            }
        }

        // 5. Päivitetään vanhan historian laatikko
        if (onkoHistoriaa) {
            historyContainer.innerHTML = historiaHtml;
        } else {
            historyContainer.innerHTML = "<p>Ei aiempia tilauksia.</p>";
        }

    } catch (error) {
        console.error("Haku epäonnistui:", error);
        historyContainer.innerHTML = "<p>Virhe historian haussa.</p>";
    }
}
function orderAgain(tuotteetRaw) {
    const modal = document.getElementById("menuModal");
    const title = document.getElementById("modal-title");
    const text = document.getElementById("modal-text");
    const footer = document.getElementById("modal-footer");
    const icon = document.getElementById("modal-icon");





    try {

        const tuotteetArray = JSON.parse(tuotteetRaw);

        icon.innerHTML = "🔄";
        title.innerText = "Tilaa uudelleen?";
        text.innerText = "Haluatko lisätä kaikki tämän tilauksen tuotteet ostoskoriin?";

        footer.innerHTML = `
            <button class="btn-cancel" onclick="closeMenuModal()">Peruuta</button>
            <button class="btn-confirm" id="confirm-reorder-action">Lisää kaikki</button>
        `;

        modal.style.display = "flex";

        document.getElementById("confirm-reorder-action").onclick = function() {

            let ostoskori = JSON.parse(localStorage.getItem("ostoskori")) || [];

            tuotteetArray.forEach(oldItem => {
                const existingItem = ostoskori.find(item => item.id === oldItem.id);

                if (existingItem) {
                    existingItem.quantity += oldItem.quantity;
                } else {
                    ostoskori.push({
                        id: oldItem.id,
                        name: oldItem.name,
                        price: oldItem.price,
                        quantity: oldItem.quantity
                    });
                }
            });

            localStorage.setItem("ostoskori", JSON.stringify(ostoskori));

            if (typeof updateCart === "function") updateCart();

            icon.innerHTML = "✅";
            title.innerText = "Onnistui!";
            text.innerText = "Tuotteet on lisätty ostoskoriin.";
            footer.innerHTML = `
                <button class="btn-confirm" onclick="window.location.href='Kassa.html'">Mene kassalle</button>
                <button class="btn-cancel" onclick="closeMenuModal()">Jatka selailua</button>
            `;
        };
    } catch (error) {
        console.error("Virhe:", error);
    }

}