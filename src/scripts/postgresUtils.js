const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect()


async function query(query) {
    return new Promise((resolve, reject) => {
        try {
            client
                .query(query)
                .then(res => {
                    resolve({ status: "success", data: res.rows })
                })
                .catch(e => {
                    client.end()
                    console.log("query -> e", e)
                    reject({ status: "failure" })
                })
        } catch (err) {
            reject({ "status": "failure" })
        }
    });
}

module.exports = { query }



// CREATE TABLE section (
//     id INTEGER PRIMARY KEY,
//     type TEXT,
//     name TEXT,
//     parent_id INTEGER REFERENCES section,
//     parent_path LTREE
// );

// INSERT INTO section ( name, parent_path) VALUES ( 'Section 1', NULL);
// INSERT INTO section ( name, parent_id) VALUES ( 'Section A.1', 1);
// INSERT INTO section ( name, parent_id) VALUES ( 'Section B', NULL);
// INSERT INTO section ( name, parent_id) VALUES ( 'Section B.1', 3);
// INSERT INTO section ( name, parent_id) VALUES ( 'Section B.2', 3);
// INSERT INTO section ( name, parent_id) VALUES ( 'Section B.2.1', 5);

// ref: https://coderwall.com/p/whf3-a/hierarchical-data-in-postgres
// ref: https://coderwall.com/p/z00-yw/use-ltreee-plv8-to-fetch-hirarcical-records-as-json