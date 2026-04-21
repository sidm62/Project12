document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch("http://localhost:3000/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({username, password})
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    localStorage.setItem("userId", data.user.id);
                    window.location.href = "Roast.html";
                } else {
                    alert("Kirjautuminen epäonnistui: " + data.message);
                }

            } catch (error) {
                console.log(error);
            }
        });
    }
});






