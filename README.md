# Roast & Route 🍔🚌

**Tekijät:** [Mohamed Sidiiq ja Al-khrsan Ali]

## 1. Sovelluksen idea ja kohderyhmä
Roast & Route on full-stack -websovellus, joka yhdistää hampurilaisravintolan tilausjärjestelmän ja reaaliaikaiset joukkoliikenteen aikataulut. Sovelluksen etusivulle tuodaan HSL:n avoimesta rajapinnasta Sörnäisten pysäkin reaaliaikaiset bussien lähtöajat. 

Kohderyhmänä ovat erityisesti lähistön opiskelijat, työntekijät ja ohikulkijat. Ideana on, että asiakas voi tilata ruokaa ja seurata samalla bussinsa saapumista suoraan samalta sivulta, jolloin turha pysäkillä paleleminen jää pois.

## 2. Toiminnallisuudet
* **Dynaaminen Menu:** Tuotteet, alennukset ja allergeenimerkit (L, G, V) renderöidään dynaamisesti tietokannasta.
* **Käyttäjänhallinta:** Rekisteröityminen ja kirjautuminen (JWT/Session).
* **Ostoskori & Tilaus:** Tuotteiden hallinta korissa ja tilausten lähettäminen tietokantaan.
* **Profiilisivu:** Sisäänkirjautunut asiakas näkee oman tilaushistoriansa.
* **HSL-integraatio:** Node.js-backend toimii proxyna välttäen CORS-virheet ja hakee GraphQL-rajapinnasta reaaliaikaiset aikataulut.
* **Admin-paneeli:** Erillinen näkymä ylläpidolle tilausten ja palautteiden seuraamiseen.

## 3. Demo (Live-versio)
Sovellus pyörii koulun eCloud-palvelimella. Voit testata sitä livenä täällä:
👉 http://10.120.36.67/Roast.html
*(Huom: Vaatii koulun verkon tai VPN-yhteyden toimiakseen).*

## 4. Testausohjeet (Näin löydät kaikki ominaisuudet)
Olemme rakentaneet paljon ominaisuuksia, joiden testaamiseksi pyydämme seuraamaan näitä askelia:

1. **HSL-rajapinta:** Avaa yllä oleva linkki etusivulle. Selaa hieman alaspäin, niin näet reaaliaikaisesti päivittyvät bussien aikataulut.
2. **Käyttäjätilin luonti:** Paina ylävalikosta "Rekisteröidy" ja luo itsellesi testitunnus.
3. **Kirjautuminen:** Kirjaudu sisään juuri luomillasi tunnuksilla.
4. **Tilaaminen:** Mene "Menu"-välilehdelle. Huomaa dynaamiset allergeenimerkit ja alennukset. Lisää pari tuotetta ostoskoriin.
5. **Kassa:** Mene ostoskoriin ja lähetä tilaus.
6. **Omat tiedot:** Valikosta pääset profiiliisi, jonne äsken tekemäsi tilaus on nyt tallentunut.
7. **Palaute:** Testaa lähettää meille viesti Palaute/Ota yhteyttä -lomakkeen kautta.
8. **Admin-näkymä:** Mene osoitteeseen `http://10.120.36.67/admin.html`. Täältä näet äsken tekemäsi tilauksen ja lähettämäsi palautteen ylläpitäjän silmin.

## 5. Kehittäjille (Asennus omalle koneelle)
Jos haluat ajaa koodia paikallisesti oman koneesi localhostissa:
1. Kloonaa tämä repositorio koneellesi.
2. Varmista, että asennettuna on Node.js.
3. Avaa terminaali projektin kansiossa ja aja komento `npm install` (asentaa Express.js yms. riippuvuudet).
4. Käynnistä backend-palvelin komennolla `node server.js`.
5. Avaa selaimessa `Roast.html` (esim. VS Coden Live Serverillä).
*(Huom: Tuotantopalvelimella sovellusta pidetään pystyssä PM2-prosessin avulla).*