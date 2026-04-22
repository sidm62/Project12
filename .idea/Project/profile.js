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

            console.log("Tiedot haettu tietokannasta ja päivitetty sivulle");

        } else {
            console.log("Käyttäjätietoja ei saatu tietokannasta", response.status);
        }
    } catch (error) {
        console.error('Virhe profiilin haussa:', error);
    }
});

async function changePassword() {
    const userId = localStorage.getItem("userId");
    const passwordChange = prompt("Syötä uusi salasana:");

     try {
         const response = await fetch(`http://localhost:3000/api/auth/user/${userId}`, {
             method: "PUT",
             headers: {
                 "Content-Type": "application/json"
             },
             body: JSON.stringify({userId: userId, newPassword: passwordChange}),
         });
         const data = await response.json();
         if (!response.ok) {
             console.log("Salasana vaihdettu")
             if (document.getElementById("password")) {
                 document.getElementById("password").value = passwordChange;
             }
         } else {
             console.log("Virhe"+ data.message);
         }
     } catch (error) {
         console.error('Virhe salasana haussa:', error);
     }
}

function logout() {
    console.log("Kirjaudutaan ulos...");


    localStorage.removeItem("userId");
    localStorage.removeItem("user");


    window.location.href = "Roast.html";
}

const logoutBtn = document.getElementById("logout-btn"); // Huom: tarkista onko ID "logoutbtn" vai "logout-btn"
if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
}

