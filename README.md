# Roast & Route 🍔🚌

**Tekijät:** Mohamed Sidiiq ja Al-khrsan Ali

## 1. Sovelluksen idea ja kohderyhmä
Roast & Route on täyden palvelun full-stack -websovellus, joka hoitaa modernin hampurilaisravintolan koko tilausprosessin alusta loppuun. 

Ideana on tarjota asiakkaille sujuva kokemus: he voivat selata ruokalistaa, tehdä tilauksia ja seurata tilauksensa edistymistä reaaliajassa omasta profiilistaan. Henkilökunnalle sovellus tarjoaa tehokkaan Admin-paneelin koko ravintolan hallintaan. Koska ravintolamme sijaitsee vilkkaalla paikalla, toimme etusivulle lisäpalveluna myös HSL:n rajapinnasta reaaliaikaiset bussiaikataulut asiakkaita varten.

## 2. Toiminnallisuudet
* **Täysi Admin-paneeli:** Ylläpito voi lisätä, muokata ja poistaa ruokalistan tuotteita sekä hyväksyä ja päivittää tilausten tilaa (esim. "Vastaanotettu" -> "Valmistuksessa").
* **Aktiivisen tilauksen seuranta:** Asiakas näkee profiilistaan livenä, missä vaiheessa hänen juuri tekemänsä tilaus on.
* **Ostoskori & Tilaushistoria:** Sujuva tilausprosessi. Kirjautuneet asiakkaat näkevät myös kaikki vanhat tilauksensa historiasta.
* **Dynaaminen Menu:** Ruokalistan tuotteet, päivän tarjoukset ja allergeenimerkit renderöidään suoraan tietokannasta.
* **Käyttäjänhallinta:** Turvallinen rekisteröityminen ja kirjautuminen (JWT/Session).
* **HSL-integraatio:** Etusivulla näkyvät livenä lähimmät bussit suoraan HSL:n rajapinnasta, jotta asiakkaat löytävät helposti perille.

## 3. Demo (Live-versio)
Sovellus pyörii koulun eCloud-palvelimella. Voit testata sitä livenä täällä:
👉 http://10.120.36.67/Roast.html
*(Huom: Vaatii koulun verkon tai VPN-yhteyden toimiakseen).*

## 4. Testausohjeet (Näin löydät kaikki ominaisuudet)
Olemme rakentaneet paljon ominaisuuksia, joiden testaamiseksi pyydämme seuraamaan näitä askelia:
1. **HSL-rajapinta:** Avaa yllä oleva linkki etusivulle. Selaa hieman alaspäin, niin näet reaaliaikaisesti päivittyvät bussien aikataulut.
2. **Käyttäjätilin luonti:** Paina ylävalikosta "Rekisteröidy" ja luo itsellesi testitunnus.
3. **Kirjautuminen:** Kirjaudu sisään juuri luomillasi tunnuksilla.
4. **Tilaaminen:** Mene "Menu"-välilehdelle. Lisää pari tuotetta ostoskoriin.
5. **Kassa:** Mene ostoskoriin ja lähetä tilaus.
6. **Omat tiedot:** Valikosta pääset profiiliisi, jonne äsken tekemäsi tilaus on nyt tallentunut.
7. **Admin-näkymä:** Mene osoitteeseen `http://10.120.36.67/admin.html`. Täältä näet äsken tekemäsi tilauksen ja lähettämäsi palautteen ylläpitäjän silmin.

## 5. Anna palautetta
Kun olet testannut sovelluksen, täytäthän lyhyen palautelomakkeemme täällä: 
👉 **[Täytä palautelomake tästä](https://docs.google.com/forms/d/e/1FAIpQLSeA_tIZfDcyUKfjEnXpRNjGMCA_nUQBiXBlUExGTpquBliGug/viewform?usp=header)**

## 6. Kehittäjille (Asennus omalle koneelle)
Jos haluat ajaa koodia paikallisesti oman koneesi localhostissa:
1. Kloonaa tämä repositorio koneellesi.
2. Varmista, että asennettuna on Node.js.
3. Avaa terminaali projektin kansiossa ja aja komento:
   ```bash
   npm install