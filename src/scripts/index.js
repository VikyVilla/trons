'use strict'
import express from 'express';
import { ObjectID } from 'mongodb';
import { has } from 'lodash'
import {
    readData,
    updateData,
    createBulkData,
    deleteBulkData
} from './dbUtils';

const router = express.Router();
const DB_NAME = process.env.DB_NAME
const DB_COLLECTION_NAME = process.env.DB_COLLECTION_NAME

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

module.exports = router