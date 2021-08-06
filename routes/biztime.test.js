process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testCompany, testInvoice;

beforeEach(async() => {
    const compResults = await db.query(`
                    INSERT INTO companies (code, name, description)
                    VALUES ('amzn', 'Amazon', 'Taking over the world')
                    RETURNING code, name, description`);

    testCompany = compResults.rows[0];

    const invResults = await db.query(`
                    INSERT INTO invoices (comp_code, amt)
                    VALUES ('amzn', 100)
                    RETURNING id, comp_code, amt`);

    testInvoice = invResults.rows[0];
})

afterEach(async () => {
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");

})

afterAll(async () => {
    await db.end();
})


describe("GET /companies", () => {
    test("Get a list of all companies", async () => {
        const results = await request(app).get("/companies");
        expect(results.statusCode).toBe(200);
        expect(results.body).toEqual({companies: [{code: testCompany.code, name: testCompany.name}]});
    })
})

describe("GET /companies/:code", () => {
    test("Get a single company", async () => {
        const results = await request(app).get(`/companies/${testCompany.code}`);
        expect(results.statusCode).toBe(200);
        expect(results.body).toEqual({company: {code: testCompany.code, name: testCompany.name, description: testCompany.description, invoices: [testInvoice.id]}});
    })
    test("Respond with 404 for invalide company id", async () => {
        const results = await request(app).get(`/companies/0`);
        expect(results.statusCode).toBe(404);
    })
})

describe("POST /companies", () => {
    test("Post a new company", async () => {
        const results = await request(app).post(`/companies/`).send({code:'ntflx', name:'Netflix', description:'Streaming content'});
        expect(results.statusCode).toBe(201);
        expect(results.body).toEqual({company: {code: 'ntflx', name: 'Netflix', description: 'Streaming content'}});
    })
})

describe("PATCH /companies/:id", () => {
    test("Edit a single company", async () => {
        const results = await request(app).patch(`/companies/${testCompany.code}`).send({name:'Amazon', description:'Taking over the universe'});
        expect(results.statusCode).toBe(200);
        expect(results.body).toEqual({company: {code: 'amzn', name: 'Amazon', description: 'Taking over the universe'}});
    })
    test("Respond with 404 for invalide company id", async () => {
        const results = await request(app).patch(`/companies/0`).send({name:'Amazon', description:'Taking over the universe'});
        expect(results.statusCode).toBe(404);
    })
})

describe("DELETE /companies/:id", () => {
    test("Delete a company", async () => {
        const results = await request(app).delete(`/companies/${testCompany.code}`);
        expect(results.statusCode).toBe(200);
        expect(results.body).toEqual({status: 'deleted'});
    })
    test("Respond with 404 for invalide company id", async () => {
        const results = await request(app).delete(`/companies/0`);
        expect(results.statusCode).toBe(404);
    })
})