const express = require("express");
const slugify = require("slugify");

const ExpressError = require("../expressError")

const router = express.Router();
const db = require("../db");

// GET a list of companies
// JSON response of the form {companies: [{code, name}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query("SELECT code, name FROM companies");
        return res.json({companies: results.rows})
    } catch(err) {
        next(err);
    }
})

// GET a single company
// JSON response of the form {company: {code, name, description, invoices: [id, ...], industries: [id, ...]}}
router.get('/:code', async (req, res, next) => {
    try {
        const {code} = req.params;
        const results = await db.query(`
            SELECT * FROM companies 
            LEFT JOIN invoices ON companies.code=invoices.comp_code 
            LEFT JOIN companies_industries ON companies.code=companies_industries.comp_code 
            LEFT JOIN industries ON industries.code=companies_industries.ind_code 
            WHERE companies.code=$1`, [code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Company with code ${code} cannot be found`, 404);
        }
        const compRes = results.rows[0];
        const invoiceIds = [...new Set(results.rows.map(row => row.id))];
        const industriesArr = [...new Set(results.rows.map(row => row.industry))];

        console.log(industriesArr);
        const company = {code: compRes.code, name: compRes.name, description: compRes.description, 
                         invoices: invoiceIds, industries: industriesArr}

        return res.json({company: company});
    } catch(err) {
        next(err);
    }
})

// Add a new company
// Takes JSON data of the form {code, name, description}
// JSON response of the form {company: {code, name, description}}
router.post('/', async (req, res, next) => {
    try {
        // const {code, name, description} = req.body;
        const {name, description} = req.body;
        const code = slugify(name, {lower: true});
        const results = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *", [code, name, description]);
        return res.status(201).json({company: results.rows[0]});
    } catch(err) {
        next(err);
    }
}) 

// Edit a single existing company
// Takes JSON data of the form {name, description}
// JSON response of the form {company: {code, name, description}}
router.patch('/:code', async (req, res, next) => {
    try {
        const {code} = req.params;
        const {name, description} = req.body;
        const results = await db.query("UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *", [name, description, code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Company with code ${code} cannot be found`, 404);
        }
        return res.json({company: results.rows[0]});
    } catch(err) {
        next(err);
    }
})

// Delete a single existing company
router.delete('/:code', async (req, res, next) => {
    try {
        const {code} = req.params;
        const results = await db.query("DELETE FROM companies WHERE code=$1", [code]);
        if (results.rowCount === 0) {
            throw new ExpressError(`Company with code ${code} cannot be found`, 404);
        }
        return res.json({status: "deleted"});
    } catch(err) {
        next(err);
    }
})


module.exports = router;