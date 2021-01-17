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

// ref: https://coderwall.com/p/whf3-a/hierarchical-data-in-postgres
// ref: https://coderwall.com/p/z00-yw/use-ltreee-plv8-to-fetch-hirarcical-records-as-json

// CREATE EXTENSION ltree;

// CREATE TABLE section (
//     id SERIAL PRIMARY KEY,
//     type TEXT,
//     name TEXT,
//     parent_id INTEGER REFERENCES section,
//     parent_path LTREE
// );

// CREATE INDEX section_parent_path_idx ON section USING GIST (parent_path);
// CREATE INDEX section_parent_id_idx ON section (parent_id);

// CREATE OR REPLACE FUNCTION update_section_parent_path() RETURNS TRIGGER AS $$
//     DECLARE
//         path ltree;
//     BEGIN
//         IF NEW.parent_id IS NULL THEN
//             NEW.parent_path = 'root'::ltree || NEW.id::text;
//         ELSEIF TG_OP = 'INSERT' OR OLD.parent_id IS NULL OR OLD.parent_id != NEW.parent_id THEN
//             SELECT parent_path || id::text FROM section WHERE id = NEW.parent_id INTO path;
//             IF path IS NULL THEN
//                 RAISE EXCEPTION 'Invalid parent_id %', NEW.parent_id;
//             END IF;
//             NEW.parent_path = path;
//         END IF;
//         RETURN NEW;
//     END;
// $$ LANGUAGE plpgsql;

// TRUNCATE TABLE section RESTART IDENTITY;

// CREATE TRIGGER parent_path_tgr
//     BEFORE INSERT OR UPDATE ON section
//     FOR EACH ROW EXECUTE PROCEDURE update_section_parent_path();