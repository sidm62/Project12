const params = new URLSearchParams(window.location.search);
const tuoteNimi = params.get('nimi');

const tuotteet = {
    "Classic Burger": { hinta: 8.99, kuva: "classic.jpg" },
    "Roast Burger": { hinta: 10.99, kuva: "roast.jpg" }
};

const tiedot = tuotteet[tuoteNimi];

if (tiedot) {
    document.getElementById('tuote-nimi').innerText = tuoteNimi;
    document.getElementById('tuote-hinta').innerText = tiedot.hinta.toFixed(2) + "€";
    document.getElementById('tuote-kuva').src = tiedot.kuva;
}

function muutaMaara(muutos) {
    const input = document.getElementById('maara');
    let arvo = parseInt(input.value) + muutos;
    if (arvo < 1) arvo = 1;
    input.value = arvo;
}

function lisaaMuokattuTuote() {
    const maara = parseInt(document.getElementById('maara').value);
    const juoma = document.getElementById('drink-select').value;
    const lisatiedot = document.getElementById('lisatiedot').value;

    // Yhdistetään juoma ja tekstikentän tiedot ostoskoria varten
    const extraInfo = `Juoma: ${juoma} | Huom: ${lisatiedot}`;

    lisaaKoriin(tuoteNimi, tiedot.hinta, maara, extraInfo);
    window.location.href = "Kassa.html";
}

function lisaaKoriin(nimi, hinta, maara, lisatiedot) {
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];
    const tuotefind = ostoskori.find(item => item.name === nimi && item.extra === lisatiedot);

    if (tuotefind) {
        tuotefind.amount += maara;
    } else {
        ostoskori.push({
            name: nimi,
            price: hinta,
            amount: maara,
            extra: lisatiedot
        });
    }
    localStorage.setItem('ostoskori', JSON.stringify(ostoskori));
}