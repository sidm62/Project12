document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");

    if (registerForm) {
        registerForm.addEventListener("submit",async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch("http://localhost:3000/api/auth/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({username, email, password})
                });

                const data = await response.json();

                if (response.ok) {
                    alert(data.message);
                    window.location.href = "Roast.html";
                } else {
                    alert("Rekisteröityminen epäonnistui: " + data.error);
                }
            } catch (error) {
                console.log("Yhteysvirhe" + error);
            }
    });
} else {
    console.error("Rekisteröitymislomaketta ei löytynyt!");
}
});