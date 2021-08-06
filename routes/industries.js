const express = require("express");
const ExpressError = require("../expressError")

const router = express.Router();
const db = require("../db");

// GET a list of industries
// JSON response of the form {industries: [{code, name, companies: [code, ...]}, ...]}
router.get('/', async (req, res, next) => {
    try {
        const indResults = await db.query(`
            SELECT * FROM industries`
        );
        const industryInfo = indResults.rows;

        const results = await db.query(`
            SELECT * FROM industries
            LEFT JOIN companies_industries ON code=ind_code`
        );

        const codes = [... new Set(results.rows.map(row => row.code))];
        const industries = [];
        for (let code of codes) {
            const industry = {code}
            industry.industry = results.rows.find(row => row.code === code).industry;
            industry.companies = results.rows.filter(row => row.code === code).map(obj => obj.comp_code);
            industries.push(industry);
        }

        return res.json({industries})
    } catch (err) {
        next(err);
    }
})

// Add a new industry
// Takes JSON data of the form {code, industry}
// JSON response of the form {industry: {code, industry}}
router.post('/', async (req, res, next) => {
    try {
        const {code, industry} = req.body;
        const results = await db.query(`INSERT INTO industries (code, industry)
                                  VALUES ($1, $2) RETURNING code, industry`, [code, industry])
        return res.json({industry: results.rows[0]})
    } catch(err) {
        next(err);
    }
})

// Associate an industry to a company
// Takes JSON data of the form {comp_code}
// JSON response of the form {result: {ind_code, comp_code}}
router.post('/:ind_code', async (req, res, next) => {
    try {
        const {ind_code} = req.params;
        const {comp_code} = req.body;

        const results = await db.query(`INSERT INTO companies_industries
                                  (ind_code, comp_code)
                                  VALUES ($1, $2) returning *`, [ind_code, comp_code]);

        return res.json({companies_industries: results.rows[0]})
    } catch(err) {
        next(err);
    }
})


module.exports = router;