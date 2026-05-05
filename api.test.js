/**
 * @fileoverview Integraatiotestit ROAST Burger -backendille.
 * Testit suoritetaan Jest-testikehyksellä ja Supertest-kirjastolla.
 * Varmistaa API-reittien toimivuuden, statuskoodit ja JSON-vastaukset.
 */

const request = require('supertest');
const app = require('./server');

describe('ROAST Backend Integraatiotestit', () => {

    /**
     * @test Varmistaa yhteyden HSL:n reittioppaan API-rajapintaan.
     * @route GET /api/hsl
     * @expected Status 200 ja JSON-objekti, joka sisältää 'data'-kentän.
     */
    it('1. GET /api/hsl pitäisi palauttaa status 200 ja JSON-dataa', async () => {
        const response = await request(app).get('/api/hsl');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    /**
     * @test Testaa ruokalistan tuotteiden hakemista tietokannasta.
     * @route GET /api/products
     * @expected Status 200.
     */
    it('2. GET /api/products pitäisi palauttaa status 200', async () => {
        const response = await request(app).get('/api/products');
        expect(response.statusCode).toBe(200);
    });

    /**
     * @test Varmistaa, että ylläpitäjä (Admin) saa listan kaikista tilauksista.
     * @route GET /api/orders
     * @expected Status 200 ja vastaus on taulukkomuodossa (Array).
     */
    it('3. GET /api/orders pitäisi palauttaa status 200 (Admin tilauslista)', async () => {
        const response = await request(app).get('/api/orders');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    /**
     * @test Hakee tietyn käyttäjän tilaushistorian.
     * @route GET /api/orders/user/:id
     * @param {number} userId - Käytetty testitunnus: 1.
     * @expected Status 200.
     */
    it('4. GET /api/orders/user/1 pitäisi palauttaa status 200 (Käyttäjän historia)', async () => {
        const response = await request(app).get('/api/orders/user/1');
        expect(response.statusCode).toBe(200);
    });

    /**
     * @test Testaa tilauksen luomisen validointia (Bad Request).
     * @route POST /api/orders
     * @payload Viallinen tilausobjekti (tuotteet-kenttä puuttuu).
     * @expected Status 400 ja virheilmoitus puuttuvista tuotteista.
     */
    it('5. POST /api/orders pitäisi palauttaa 400 Bad Request, jos tuotteet puuttuvat', async () => {
        const viallinenTilaus = {
            userId: 1,
            total_price: 10.00
        };

        const response = await request(app)
            .post('/api/orders')
            .send(viallinenTilaus);

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Tuotteet puuttuvat tai ne ovat väärässä muodossa");
    });
});