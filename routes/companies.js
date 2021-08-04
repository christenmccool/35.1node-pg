const express = require("express");
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
// JSON response of the form {company: {code, name, description, invoices: [id, ...]}}
router.get('/:code', async (req, res, next) => {
    try {
        const {code} = req.params;
        const results = await db.query("SELECT * FROM companies JOIN invoices ON code=comp_code WHERE code=$1", [code]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Company with code ${code} cannot be found`, 404);
        }
        const compRes = results.rows[0];
        const invoiceIds = results.rows.map(row => row.id)
        const company = {code: compRes.code, name: compRes.name, description: compRes.description, 
                         invoices: invoiceIds}
        return res.json({company: company});
    } catch(err) {
        next(err);
    }
})

// Add a single company
// Takes JSON data of the form {code, name, description}
// JSON response of the form {company: {code, name, description}}
router.post('/', async (req, res, next) => {
    try {
        const {code, name, description} = req.body;
        const results = await db.query("INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *", [code, name, description]);
        console.log(results)
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