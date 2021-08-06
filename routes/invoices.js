const express = require("express");
const ExpressError = require("../expressError")

const router = express.Router();
const db = require("../db");

// GET a list of invoices
// JSON response of the form {invoices: [{id, comp_code}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(
            "SELECT id, comp_code from invoices");
        res.json({invoices: results.rows})
    } catch(err) {
        next(err);
    }
})

// GET a single invoice
// JSON response of the form {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get('/:id', async (req, res, next) => {
    try {
        const {id} = req.params;
        const results = await db.query(
            "SELECT * FROM invoices JOIN companies ON comp_code=code WHERE id=$1", [id]);
        if (results.rows.length === 0) {
            throw new ExpressError(`Invoice with id ${id} cannot be found`, 404);
        }
        const invRes = results.rows[0];
        const company = {code: invRes.code, name: invRes.name, description: invRes.description};
        const invoice = {id:invRes.id, amt:invRes.amt, paid:invRes.paid, 
                         add_date:invRes.add_date, paid_date:invRes.paid_date,
                         company: company};
        res.json({invoice: invoice});
    } catch(err) {
        next(err);
    }
})

// Add a new invoice
// Takes JSON data of the form {comp_code, amt}
// JSON response of the form {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post('/', async (req, res, next) => {
    try {
        const {comp_code, amt} = req.body;
        const results = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *", [comp_code, amt])
        res.json({invoice: results.rows[0]});
    } catch(err) {
        next(err);
    }
})

// Edit a single existing invoice
// Takes JSON data of the form {amt}
// JSON response of the form {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.patch('/:id', async (req, res, next) => {
    try {
        const {id} = req.params;
        const pdResults = await db.query("SELECT paid, paid_date from invoices");
        if (pdResults.rows.length === 0) {
            throw new ExpressError(`Invoice with id ${id} cannot be found`, 404);
        }
        const pdStatus = pdResults.rows[0].paid;
        const pdDate = pdResults.rows[0].paid_date;


        const {amt, paid} = req.body;
        let paid_date;
        if (pdStatus === false && paid === true) {
            paid_date = new Date();
        } else if (pdStatus === true && paid === false) {
            paid_date = null;
        } else {
            paid_date = pdDate;
        }

        const results = await db.query(
            `UPDATE invoices SET 
                amt=$1, paid=$2, paid_date=$3 
                WHERE id=$4 returning *`, [amt, paid, paid_date, id]);

        res.json({invoice: results.rows[0]})
    } catch(err) {
        next(err);
    }
})

// Delete a single existing invoice
router.delete('/:id', async (req, res, next) => {
    try {
        const {id} = req.params;
        const results = await db.query("DELETE FROM invoices WHERE id=$1", [id])
        console.log(results);
        if (results.rowCount === 0) {
            throw new ExpressError(`Invoice with id ${id} cannot be found`, 404);
        }
        return res.json({status: "deleted"});
    } catch(err) {
        next(err);
    }
})

module.exports = router;