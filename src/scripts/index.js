'use strict'
import express from 'express';
import { ObjectID } from 'mongodb';
import { has } from 'lodash'
import {
    readData,
    updateData,
    createBulkData,
    deleteBulkData
} from './mongodbUtils';
import { query } from "./postgresUtils";

const router = express.Router();
const DB_NAME = process.env.DB_NAME
const DB_COLLECTION_NAME = process.env.DB_COLLECTION_NAME


// below endpoints implemented with mongodb  
/**
 * @param {string} folder_name
 * @param {string} sort
 */
router.get('/get_records', async(req, res) => {
    const folder_name = req.query.folder_name;
    const sort = req.query.sort

    try {
        if (folder_name) {
            // get a particular folder with childs
            let read_records = await readData(DB_NAME, DB_COLLECTION_NAME, sort, '', '', { path: { '$regex': '.*' + folder_name + '.*' } })
            let result = treeify(read_records)
            return res.send(result)
        } else {
            let read_records = await readData(DB_NAME, DB_COLLECTION_NAME, sort, '', '', '')
            console.log("read_records", read_records)
            let result = treeify(read_records)
            return res.send(result)
        }
    } catch (err) {
        return res.sendStatus(400)
    }
})

router.post('/create_records', async(req, res) => {
    const body = req.body;
    try {
        req.body.map(element => {
            if (element.path === '/') {
                return res.sendStatus(400)
            }
        });

        // need to add some strong validation for body
        // check the path already exists

        let create_records = await createBulkData(DB_NAME, DB_COLLECTION_NAME, body)
        return res.send(create_records.ops)
    } catch (err) {
        return res.sendStatus(400)
    }

})

router.delete('/delete_records', async(req, res) => {
    let body = [];

    // need to add some strong validation for body
    try {
        req.body.map(element => {
            body.push(new ObjectID(element._id))
        });
        // need to find and delete sub records
        let delete_records = await deleteBulkData(DB_NAME, DB_COLLECTION_NAME, body)
        return res.send(delete_records)
    } catch (err) {
        return res.sendStatus(400)
    }

})

router.put('/put_records', async(req, res) => {
    const body = req.body
    const source_data = body[0]
    const destination_data = body[1]

    // /-handle slash 
    if (source_data.path === "/") {
        return res.sendStatus(400)
    }
    try {
        if (has(source_data, 'type') && source_data.type === 'image') {
            const split = source_data.path.split("/") //[ "", "a" ]
            const file_name = split[split.length - 1] // a
            const _id = source_data._id

            if (destination_data.path === '/') {
                source_data.path = destination_data.path + file_name
            } else {
                source_data.path = destination_data.path + '/' + file_name
            }
            delete source_data._id

            let update_record = await updateData(DB_NAME, DB_COLLECTION_NAME, { _id }, source_data)
            return res.send(update_record)
        } else if (has(source_data, 'type') && source_data.type === 'directory') {

            let read_records = await readData(DB_NAME, DB_COLLECTION_NAME, '', '', '', { path: { '$regex': '.*' + source_data.path + '.*' } })
            let map_records = [],
                ids = [];

            read_records.map(data => {
                ids.push(new ObjectID(data._id))
                delete data._id
                if (destination_data.path === '/') {
                    data.path = destination_data.path + source_data.name + data.path.replace(source_data.path, "")
                } else {
                    data.path = destination_data.path + '/' + source_data.name + data.path.replace(source_data.path, "")
                }
                map_records.push({...data })
            })

            Promise.all([deleteBulkData(DB_NAME, DB_COLLECTION_NAME, ids), createBulkData(DB_NAME, DB_COLLECTION_NAME, map_records)]).then((values) => {
                return res.send(values[1].ops)
            })
        }
    } catch (err) {
        return res.sendStatus(400)
    }

})

function treeify(files) {
    var path = require('path')

    files = files.reduce(function(tree, f) {
        var dir = path.dirname(f.path)

        if (tree[dir]) {
            tree[dir].children.push(f)
        } else {
            tree[dir] = { implied: true, children: [f] }
        }

        if (tree[f.path]) {
            f.children = tree[f.path].children
        } else {
            f.children = []
        }
        return (tree[f.path] = f), tree
    }, {})


    return Object.keys(files).reduce(function(tree, f) {
        if (files[f].implied) {
            return tree.concat(files[f].children)
        }

        return tree
    }, [])
}

// below endpoints implemented with postgres

const POSTGRES_DB_NAME = "section";

router.get('/records', async(req, res) => {
    try {
        const folder_path = req.query.folder_path // path based search point to column parent_path
        const folder_name = req.query.folder_name
        const sort = req.query.sort //DESC , ASC , PATH

        let sql_query = `SELECT * FROM ${POSTGRES_DB_NAME} `

        if (folder_path && folder_name) {
            return res.sendStatus(400)
        }

        if (folder_path) {
            sql_query += `WHERE parent_path ~ '${folder_path}.*' `;
        } else if (folder_name) {
            sql_query += `WHERE position('${folder_name}' in name) > 0 `
        }

        if (sort === "DESC") {
            sql_query += "ORDER BY name DESC"
        } else if (sort === "ASC") {
            sql_query += "ORDER BY name ASC"
        } else if (sort === "PATH") {
            sql_query += "ORDER BY parent_path"
        }

        console.log(sql_query)

        query(sql_query).then(response_data => {
            return res.send(response_data.data)
        }).catch(err => {
            console.log("err", err)
            return res.sendStatus(400)
        })
    } catch (err) {
        return res.sendStatus(400)
    }

})

router.post('/records', async(req, res) => {
    try {
        const body = req.body;
        const sql_query = `INSERT INTO ${POSTGRES_DB_NAME} ( type , name, parent_id) VALUES `
        let value = "",
            valid = true

        body.map((element, index) => {
            if (!element.type || !element.name || !element.parent_id) {
                valid = false;
            }
            value += `('${element.type}', '${element.name}', ${element.parent_id})`
            if (body.length - 1 == index) {
                value += ";"
            } else {
                value += ","
            }
        })
        if (!valid) {
            return res.send({ "status": "failure", "message": "Missing params" })
        }
        console.log(sql_query + value)
        query(sql_query + value).then(data => {
            // Notify other users if someone adds a file/folder in the system.
            return res.send(data)
        }).catch(err => {
            console.log("err", err)
            return res.sendStatus(400)
        })
    } catch (err) {
        return res.sendStatus(400)
    }
});

router.delete('/records', async(req, res) => {
    try {
        const body = req.body;
        let sql_query = "";
        let valid = true;

        // delete the sub record also  

        body.map(element => {
            if (!element.parent_path) {
                valid = false;
            }
            sql_query += `DELETE FROM ${POSTGRES_DB_NAME} WHERE parent_path ~ '${element.parent_path}.*';`
        })

        if (!valid) {
            return res.send({ "status": "failure", "message": "Missing parent_path" })
        }

        console.log("sql_query", sql_query)

        query(sql_query).then(data => {
            return res.send({ "status": "success", data })
        }).catch(err => {
            console.log("err", err)
            return res.sendStatus(400)
        })
    } catch (err) {
        return res.sendStatus(400)
    }

})

router.put('/records', async(req, res) => {
    try {
        const body = req.body
        const source_data = body[0]
        const destination_data = body[1]

        if (!source_data.id || !destination_data) {
            return res.send({ "status": "failure", "message": "Missing id" })
        }

        // use destination id as null for move into root 

        const sql_query = `UPDATE ${POSTGRES_DB_NAME} SET parent_id = ${destination_data.id} where id = ${source_data.id};`
        console.log("treeify -> sql_query", sql_query)
        query(sql_query).then(data => {
            return res.send(data)
        }).catch(err => {
            console.log("err", err)
            return res.sendStatus(400)
        })
    } catch (err) {
        return res.sendStatus(400)
    }

})

module.exports = router