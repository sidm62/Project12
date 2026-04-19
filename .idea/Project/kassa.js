function tilaus(event) {
    event.preventDefault();

    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    if (ostoskori.length === 0) {
        console.log("Ostoskori is be empty");
        return;
    }
    document.getElementById("confirmModal").style.display = "flex";
}
function processOrder() {
    const ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
    const hinta = document.getElementById("Loppusumma") || document.getElementById("total-summa");
    const summa = hintaElement ? hintaElement.innerText: "0.00"

    if (ostoskori.length > 0) {
        let tilausHistoria = JSON.parse(localStorage.getItem('tilausHistoria')) || [];
        const uusiTilaus = {
            paivamaara: new Date().toLocaleString("fi-FI" ),
            tuotteet: ostoskori.map(item => `${item.amount}x ${item.name}`).join(", "),
            hinta: summa + "€"
        };
    tilausHistoria.unshift(uusiTilaus);
    localStorage.setItem('tilausHistoria',JSON.stringify(tilausHistoria) );

    }

    localStorage.removeItem('ostoskori');

    window.location.href= "Tilaus.html";

}

function closeModal() {
    document.getElementById("confirmModal").style.display = "none";
}