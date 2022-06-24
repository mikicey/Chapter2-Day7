const {Pool} = require("pg");

const dbPool = new Pool({
    database: "portfolio",
    port: "5432",
    user: "postgres",
    password: "pgsql.mik.158"
})

module.exports = dbPool;