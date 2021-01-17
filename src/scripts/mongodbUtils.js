"use strict";
import mongo from 'mongodb';
const mongodb = mongo.MongoClient;
const ObjectId = mongo.ObjectId;
import logger from '../logs/logger';
var MONGO_URI = process.env.MONGO_URI

// if you need dynamic db use process.env.db / ${dbName} ? replace function
function removeData(dbName, collectionName, findById) {
    try {
        return new Promise((resolve, reject) => {
            mongodb.connect(
                MONGO_URI, {
                    useNewUrlParser: true
                },
                (err, client) => {
                    logger.info('Connected to Mongo Cluster')
                    if (err) {
                        logger.error(err)
                        reject(err)
                    } else {
                        const db = client.db(dbName)
                        const collection = db.collection(collectionName)
                        collection.remove({
                            "_id": new ObjectId(findById._id)
                        }, (err, result) => {
                            if (err) {
                                logger(err)
                                reject(err)
                            } else {
                                resolve(result.result)
                            }
                        })
                    }
                    client.close()
                }
            )
        })
    } catch (error) {
        logger.error(error)
    }
}

function updateData(dbName, collectionName, findById, values) {
    if (
        typeof values === "object" &&
        typeof values !== null
    ) {
        try {
            return new Promise((resolve, reject) => {
                mongodb.connect(
                    MONGO_URI, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                    },
                    (err, client) => {
                        logger.info('Connected to Mongo Cluster')
                        if (err) {
                            logger.error(err)
                            reject(err)
                        } else {
                            const db = client.db(dbName)
                            const collection = db.collection(collectionName)

                            collection.findOneAndUpdate({
                                "_id": new ObjectId(findById._id)
                            }, {
                                $set: values
                            }, {
                                new: true
                            }, (err, result) => {
                                if (err) {
                                    logger.error(err)
                                    reject(err)
                                } else {
                                    resolve(result.value)
                                }
                            })
                        }
                        // client.close()
                    }
                )
            })
        } catch (error) {
            logger.error(error)
        }
    } else {
        return {
            status: "Cannot update empty values or updateID is invalid"
        };
    }
}

async function readData(dbName, collectionName, sort, skip, limit, values) {
    const reqData = values || {};
    const skipNos = skip || 0;
    const limitNos = limit || 10;
    const sorting = sort || -1;
    try {
        return new Promise((resolve, reject) => {
            mongodb.connect(
                MONGO_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                },
                (err, client) => {
                    logger.info('Connected to Mongo Cluster')
                    if (err) {
                        logger.error(err)
                        reject(err)
                    } else {
                        const db = client.db(dbName)
                        const collection = db.collection(collectionName)
                        collection.find(values)
                            .sort({
                                _id: Number(sorting)
                            })
                            .skip(skipNos)
                            .limit(limitNos)
                            .toArray((err, docs) => {
                                if (err) {
                                    logger.error(err)
                                    reject(err)
                                } else {
                                    resolve(docs)
                                }
                            })
                    }
                    // client.close()
                }
            )
        })
    } catch (error) {
        logger.error(error)
    }
}

function createData(dbName, collectionName, values) {
    if (typeof values === "object" && typeof values !== null) {
        try {
            return new Promise((resolve, reject) => {
                mongodb.connect(
                    MONGO_URI, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                    },
                    (err, client) => {
                        logger.info('Connected to Mongo Cluster')
                        if (err) {
                            logger.error(err)
                            reject(err)
                        } else {
                            const db = client.db(dbName)
                            const collection = db.collection(collectionName)
                            collection.insertOne(values, (err, result) => {
                                if (err) {
                                    logger.error(err)
                                    reject(err)
                                } else {
                                    resolve(result)
                                }
                            })
                        }
                        // client.close()
                    }
                )
            })
        } catch (error) {
            logger.error(error)
        }
    } else {
        return {
            status: "Cannot insert empty values"
        };
    }
}

function createBulkData(dbName, collectionName, values) {
    if (Array.isArray(values) && typeof values !== null) {
        try {
            return new Promise((resolve, reject) => {
                mongodb.connect(
                    MONGO_URI, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                    },
                    (err, client) => {
                        logger.info('Connected to Mongo Cluster')
                        if (err) {
                            logger.error(err)
                            reject(err)
                        } else {
                            const db = client.db(dbName)
                            const collection = db.collection(collectionName)
                            collection.insertMany(values, (err, result) => {
                                if (err) {
                                    logger.error(err)
                                    reject(err)
                                } else {
                                    // add webhook here for updating the other users about changes in file/folder system
                                    resolve(result)
                                }
                            })
                        }
                        // client.close()
                    }
                )
            })
        } catch (error) {
            logger.error(error)
        }
    } else {
        return {
            status: "Cannot insert empty values"
        };
    }
}

function deleteBulkData(dbName, collectionName, values) {
    if (Array.isArray(values) && typeof values !== null) {
        try {
            return new Promise((resolve, reject) => {
                mongodb.connect(
                    MONGO_URI, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                    },
                    (err, client) => {
                        logger.info('Connected to Mongo Cluster')
                        if (err) {
                            logger.error(err)
                            reject(err)
                        } else {
                            const db = client.db(dbName)
                            const collection = db.collection(collectionName)
                            collection.deleteMany({ _id: { $in: values } }, (err, result) => {
                                if (err) {
                                    logger.error(err)
                                    reject(err)
                                } else {
                                    resolve(result)
                                }
                            })
                        }
                        // client.close()
                    }
                )
            })
        } catch (error) {
            logger.error(error)
        }
    } else {
        return {
            status: "Cannot insert empty values"
        };
    }
}

function findOne(dbName, collectionName, values) {
    if (
        typeof values === "object" &&
        typeof values !== null
    ) {
        try {
            return new Promise((resolve, reject) => {
                mongodb.connect(
                    MONGO_URI, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                    },
                    (err, client) => {
                        logger.info('Connected to Mongo Cluster')
                        if (err) {
                            logger.error(err)
                            reject(err)
                        } else {
                            const db = client.db(dbName)
                            const collection = db.collection(collectionName)
                            collection.findOne(values, (err, result) => {
                                if (err) {
                                    logger.error(err)
                                    reject(err)
                                } else {
                                    resolve(result)
                                }
                            })
                        }
                        // client.close()
                    }
                )
            })
        } catch (error) {
            logger.error(error)
        }
    } else {
        return {
            status: "Cannot update empty values or updateID is invalid"
        };
    }
}

function deleteCollection(dbName, collectionName, values) {
    values = {}
    try {
        return new Promise((resolve, reject) => {
            mongodb.connect(
                MONGO_URI, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                },
                (err, client) => {
                    logger.info('Connected to Mongo Cluster')
                    if (err) {
                        logger.error(err)
                        reject(err)
                    } else {
                        const db = client.db(dbName)
                        const collection = db.collection(collectionName)
                        collection.deleteMany(values, (err, result) => {
                            if (err) {
                                logger.error(err)
                                reject(err)
                            } else {
                                resolve(result)
                            }
                        })
                    }
                    // client.close()
                }
            )
        })
    } catch (error) {
        logger.error(error)
    }
}

// function searchData(dbName, collectionName, values, skip, limit) {
//   skip = skip ? skip : 0
//   limit = limit ? limit : 0
//   if (typeof values === "object" && typeof values !== null) {
//     try {
//       return new Promise((resolve, reject) => {
//         mongodb.connect(
//           `mongodb+srv://stud:stud@cluster0-sg6dc.mongodb.net/${dbName}?retryWrites=true&w=majority`,
//           { useNewUrlParser: true },
//           (err, client) => {
//             console.log('Connected to Mongo Cluster')
//             if (err) {
//               console.log(err)
//               reject(err)
//             } else {
//               const db = client.db(dbName)
//               const collection = db.collection(collectionName)
//               const query = values.transactionDate || values.invoiceDate ?
//                 {[Object.keys(values)[0]]:
//                   { $gt: values[Object.keys(values)[0]]['from'],
//                   $lt: values[Object.keys(values)[0]]['to']}} :
//                 {[Object.keys(values)[0]]: {$regex: values[Object.keys(values)[0]], $options: 'i'}}
//               collection.find(query)
//               .sort({_id: -1})
//               .skip(skip)
//               .limit(limit)
//               .toArray((err, docs) => {
//                 if (err) {
//                   console.log(err)
//                   reject(err)
//                 } else {
//                   resolve(docs)
//                 }
//               })
//             }
//           }
//         )
//       })
//     } catch (error) {
//       console.log(error)
//     }
//   } else {
//     return { status: "Cannot Search empty values" };
//   }
// }

module.exports = {
    createData,
    readData,
    updateData,
    removeData,
    findOne,
    createBulkData,
    deleteBulkData,
    deleteCollection
    // searchData
};