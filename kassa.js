
document.addEventListener("DOMContentLoaded", () => {
    paivitaKassaNakyma();
});

function paivitaKassaNakyma() {
    const kassaLista = document.getElementById("kassa-lista");
    const valisummaElement = document.getElementById("valisumma");
    const veroElement = document.getElementById("vero");
    const loppusummaElement = document.getElementById("Loppusumma");

    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    // Jos kori on tyhjä, näytetään ilmoitus
    if (ostoskori.length === 0) {
        kassaLista.innerHTML = "<p style='text-align:center; padding:20px;'>Ostoskorisi on tyhjä.</p>";
        return;
    }

    let valisummaYhteensa = 0;
    kassaLista.innerHTML = ""; // Tyhjennetään pohja

    ostoskori.forEach(tuote => {
        const hinta = parseFloat(tuote.price);
        const maara = parseInt(tuote.amount);
        const riviSumma = hinta * maara;
        valisummaYhteensa += riviSumma;

        // Luodaan rivi HTML-rakenteen mukaisesti
        kassaLista.innerHTML += `
            <div class="cart-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 10px 0; border-bottom: 1px solid #333;">
                <span>${tuote.name}</span>
                <span>${hinta.toFixed(2)}€</span>
                <span>${maara}</span>
                <span>${riviSumma.toFixed(2)}€</span>
            </div>
        `;
    });


    const vero = valisummaYhteensa * 0.14;
    const loppusumma = valisummaYhteensa + vero;


    if (valisummaElement) valisummaElement.innerText = valisummaYhteensa.toFixed(2) + "€";
    if (veroElement) veroElement.innerText = vero.toFixed(2) + "€";
    if (loppusummaElement) loppusummaElement.innerText = loppusumma.toFixed(2);
}


function tilaus(event) {
    event.preventDefault();
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        alert("Ostoskori on tyhjä!");
        return;
    }
    document.getElementById("confirmModal").style.display = "flex";
}


function processOrder() {
    const ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    // KORJAUS: Varmistetaan että muuttujan nimi on oikein
    const hintaElement = document.getElementById("Loppusumma");
    const summa = hintaElement ? hintaElement.innerText : "0.00";

    if (ostoskori.length > 0) {
        let tilausHistoria = JSON.parse(localStorage.getItem('tilausHistoria')) || [];
        const uusiTilaus = {
            paivamaara: new Date().toLocaleString("fi-FI"),
            tuotteet: ostoskori.map(item => `${item.amount}x ${item.name}`).join(", "),
            hinta: summa + "€"
        };

        tilausHistoria.unshift(uusiTilaus);
        localStorage.setItem('tilausHistoria', JSON.stringify(tilausHistoria));
    }

    localStorage.removeItem('ostoskori');
    window.location.href = "Tilaus.html";
}

function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
}