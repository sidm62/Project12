Käyttöohjeet: Roast & Route -sovellus
Tämä ohje auttaa sinua testaamaan sovelluksen keskeiset toiminnot. Sovellus on optimoitu käytettäväksi tietokoneen selaimella.

1. Aloittaminen (Live-linkki)
   Avaa selain ja mene osoitteeseen:

 http://10.120.36.67/Roast.html

2. Päätoiminnot
   🍔 Menu ja tilaaminen
   Selaa sivua alaspäin Menu-osioon. Tuotteet haetaan dynaamisesti tietokannasta.

Valitse haluamasi tuote ja paina "Lisää ostoskoriin".

Ostoskori päivittyy automaattisesti. Voit lisätä tai poistaa tuotteita.

Paina "Tilaa". Jos et ole kirjautunut sisään, sovellus pyytää sinua kirjautumaan tai rekisteröitymään.

👤 Rekisteröityminen ja kirjautuminen
Klikkaa navigointipalkista "Kirjaudu" tai "Rekisteröidy".

Luo uusi käyttäjä (muista käyttäjänimi ja salasana).

Kirjautumisen jälkeen voit tarkastella omaa profiiliasi, jossa näkyy henkilökohtainen tilaushistoriasi.

 Palautteen jättäminen (Feedback)
Mene sivun alareunaan tai erilliselle "Ota yhteyttä" -sivulle.

Täytä lomakkeeseen nimesi, sähköpostisi ja viestisi (esim. "Loistava palvelu!").

Paina "Lähetä". Viesti tallentuu palvelimen kautta MySQL-tietokantaan.

3. Opettajan työkalu: Admin-näkymä
   Jotta voit varmistaa, että tiedot tallentuvat oikein tietokantaan, käytä Admin-näkymää:

 http://10.120.36.67/admin.html

Admin-sivulla voit:

Nähdä listauksen kaikista lähetetyistä palautteista.

Tarkastella tehtyjä tilauksia ja niiden tiloja.

Varmistaa, että uudet käyttäjät on lisätty järjestelmään.

 Tekniset huomautukset
Istunnot: Sovellus käyttää paikallista tallennusta (localStorage) tai session-hallintaa pitääkseen sinut kirjautuneena.

Varmuus: Jos sovellus ei vastaa, varmista että eCloud-palvelimella on PM2-prosessi käynnissä (Project2).