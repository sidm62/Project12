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
    const container = document.getElementById("history-container");
    const uId = localStorage.getItem("userId");

    if (!container || !uId) return;

    try {
        const response = await fetch(`http://localhost:3000/api/orders/user/${uId}`);
        const data = await response.json();

        if (data.length === 0) {
            container.innerHTML = "<p>Ei aiempia tilauksia.</p>";
            return;
        }

        const orders = data.reduce((acc, curr) => {
            if (!acc[curr.orderId]) {
                let hinta = String(curr.total_price).replace(',', '.');
                acc[curr.orderId] = {
                    id: curr.orderId,
                    date: new Date(curr.created_at).toLocaleDateString("fi-FI"),
                    summa: parseFloat(hinta) || 0,
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

        let html = '<h3 style="margin-top:20px;">Tilaushistoria</h3><ul style="list-style:none; padding:0; text-align:left;">';

        Object.values(orders).forEach(order => {

            const tuotteetTeksti = order.tuotteet.map(p => `${p.quantity}x ${p.name}`).join(", ");


            const tuotteetJson = JSON.stringify(order.tuotteet).replace(/"/g, '&quot;');

            html += `
                <li style="border-bottom: 1px solid #444; padding: 15px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>Tilaus #${order.id} | ${order.date} | ${order.summa.toFixed(2)}€</strong><br>
                        <small style="color: #aaa;">${tuotteetTeksti}</small>
                    </div>
                    <button onclick="orderAgain('${tuotteetJson}')" class="btn-login" style="width: auto; padding: 8px 15px; font-size: 0.8rem; margin: 0;">
                        Tilaa uudelleen
                    </button>
                </li>`;
        });
        html += '</ul>';
        container.innerHTML = html;

    } catch (error) {
        console.error("Haku epäonnistui:", error);
        container.innerHTML = "<p>Virhe historian haussa.</p>";
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