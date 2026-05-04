const request = require('supertest');
const app = require('./server'); // Varmista, että tämä on oikea polku server.js -tiedostoosi

describe('ROAST Backend Integraatiotestit', () => {
    
    // Testi 1: HSL API -yhteys
    it('1. GET /api/hsl pitäisi palauttaa status 200 ja JSON-dataa', async () => {
        const response = await request(app).get('/api/hsl');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    // Testi 2: Ruokalistan lataus
    it('2. GET /api/products pitäisi palauttaa status 200', async () => {
        const response = await request(app).get('/api/products'); // MUUTETTU REITTINIMI TÄHÄN
        expect(response.statusCode).toBe(200);
    });

    // Testi 3: Adminin tilauslista
    it('3. GET /api/orders pitäisi palauttaa status 200 (Admin tilauslista)', async () => {
        const response = await request(app).get('/api/orders');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
    });

    // Testi 4: Käyttäjän tilaushistoria
    it('4. GET /api/orders/user/1 pitäisi palauttaa status 200 (Käyttäjän historia)', async () => {
        const response = await request(app).get('/api/orders/user/1');
        expect(response.statusCode).toBe(200);
    });

    // Testi 5: Tilauksen virheenkäsittely
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