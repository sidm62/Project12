/**
 * ROAST BURGER - TUOTEKOHTAINEN LOGIIKKA (product.js)
 * Hallitsee:
 * - Tuotetietojen hakemista URL-parametrien perusteella
 * - Tuotemäärän muuttamista (+/- painikkeet)
 * - Tuotteen personointia (juomavalinnat, lisätiedot)
 * - Personoidun tuotteen tallentamista ostoskoriin
 */

// 1. HAKU: Haetaan URL-osoitteesta tuotteen nimi (esim. ?nimi=Classic%20Burger)
const params = new URLSearchParams(window.location.search);
const tuoteNimi = params.get('nimi');

/**
 * Staattinen tuotetieto-objekti (voidaan korvata myös tietokantahaulla).
 */
const tuotteet = {
    "Classic Burger": { hinta: 8.99, kuva: "images/classic.jpg" },
    "Roast Burger": { hinta: 10.99, kuva: "images/roast.jpg" },
    "Juustoburger": { hinta: 9.50, kuva: "images/cheese.jpg" }
};

const tiedot = tuotteet[tuoteNimi];

/**
 * Alustaa sivun tiedot, jos tuote löytyi sanakirjasta.
 */
if (tiedot) {
    if (document.getElementById('tuote-nimi')) {
        document.getElementById('tuote-nimi').innerText = tuoteNimi;
    }
    if (document.getElementById('tuote-hinta')) {
        document.getElementById('tuote-hinta').innerText = tiedot.hinta.toFixed(2) + "€";
    }
    if (document.getElementById('tuote-kuva')) {
        document.getElementById('tuote-kuva').src = tiedot.kuva;
    }
}

/**
 * Muuttaa tilausmäärää käyttöliittymässä.
 * @param {number} muutos - Lisättävä tai vähennettävä määrä (esim. 1 tai -1).
 */
function muutaMaara(muutos) {
    const input = document.getElementById('maara');
    if (!input) return;

    let arvo = parseInt(input.value) + muutos;
    if (arvo < 1) arvo = 1; // Määrä ei voi olla alle yhden
    input.value = arvo;
}

/**
 * Kerää personointitiedot ja lähettää ne ostoskoriin.
 * Ohjaa lopuksi käyttäjän kassanäkymään.
 */
function lisaaMuokattuTuote() {
    const maaraInput = document.getElementById('maara');
    const drinkSelect = document.getElementById('drink-select');
    const lisatiedotInput = document.getElementById('lisatiedot');

    const maara = maaraInput ? parseInt(maaraInput.value) : 1;
    const juoma = drinkSelect ? drinkSelect.value : "Ei juomaa";
    const huomautus = lisatiedotInput ? lisatiedotInput.value : "";

    // Luodaan merkkijono, joka erottaa personoidun tuotteen muista saman nimisistä
    const extraInfo = `Juoma: ${juoma} | Huom: ${huomautus}`;

    lisaaKoriin(tuoteNimi, tiedot.hinta, maara, extraInfo);

    // Siirrytään kassalle
    window.location.href = "Kassa.html";
}

/**
 * Tallentaa tuotteen paikalliseen muistiin (localStorage).
 * Jos täsmälleen samalla nimellä ja lisätiedoilla varustettu tuote on jo korissa,
 * kasvatetaan vain sen määrää.
 * * @param {string} nimi - Tuotteen nimi.
 * @param {number} hinta - Yksikköhinta.
 * @param {number} maara - Tilattava määrä.
 * @param {string} lisatiedot - Personointitiedot (extra).
 */
function lisaaKoriin(nimi, hinta, maara, lisatiedot) {
    let ostoskori = JSON.parse(localStorage.getItem('ostoskori')) || [];

    // Etsitään onko täysin vastaava tuote jo korissa
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