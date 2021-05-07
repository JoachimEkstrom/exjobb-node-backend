const { OPCUAClient, makeBrowsePath, AttributeIds, resolveNodeId, TimestampsToReturn } = require("node-opcua")
const opcua = require("node-opcua")
const influxdb = require("./InfluxDb")
const dbUrl = "http://localhost:8086/"
const dbName = "ExJobb"
let responeData = []

//read variables with read
async function readData(the_session) {
    let res = await new Promise((resolve, reject) => {
        const maxAge = 0
        const nodeToRead = [
            {
                nodeId: "ns=7;s=GVL.toInfluxDB.sMeasurement",
                attributeId: AttributeIds.Value,
            },
            {
                nodeId: "ns=7;s=GVL.toInfluxDB.sTagsNames",
                attributeId: AttributeIds.Value,
            },
            {
                nodeId: "ns=7;s=GVL.toInfluxDB.sTagsValues",
                attributeId: AttributeIds.Value,
            },
            {
                nodeId: "ns=7;s=GVL.toInfluxDB.sFieldsNames",
                attributeId: AttributeIds.Value,
            },
            {
                nodeId: "ns=7;s=GVL.toInfluxDB.sFieldValues",
                attributeId: AttributeIds.Value,
            },
            {
                nodeId: "ns=7;s=GVL.toInfluxDB.dTimeStamp",
                attributeId: AttributeIds.Value,
            },
        ]
        the_session.read(nodeToRead, maxAge, function (err, dataValue) {
            responseData = []
            if (!err) {
                for (i = 0; i < dataValue.length; i++) {
                    responseData = [...responseData, dataValue[i].value.value]
                }
                if (responseData[0] !== null) {
                    resolve(influxdb.storeData(dbUrl, dbName, responseData))
                } else {
                    console.log("No data returned")
                    resolve("No data returned")
                }
            }
        })
    })
    return res
}

async function callAddMethod(the_session, a, b) {
    let res = await new Promise((resolve, reject) => {
        let methodToCalls = [
            {
                objectId: "ns=7;s=MAIN.methods",
                methodId: "ns=7;s=MAIN.methods#Method_Add2",
                inputArguments: [
                    { dataType: opcua.DataType.Float, value: a },
                    { dataType: opcua.DataType.Float, value: b },
                ],
            },
        ]

        the_session.call(methodToCalls, function (err, results) {
            if (err) {
                console.log("Err: " + err)
            }
            console.log("Inputs: ", a, b)
            if (results[0].statusCode._name !== "Bad") {
                console.log("Result: ", results[0].outputArguments[0].value, "\n")
                resolve(results[0].outputArguments[0].value)
            } else {
                resolve("No response from OPC Method") // Should be change to reject as soon as testiog is done.
            }
        })
    })

    return res
}

async function callAddMethodNoArguments(the_session) {
    let res = await new Promise((resolve, reject) => {
        let methodToCalls = [
            {
                objectId: "ns=7;s=MAIN.methods",
                methodId: "ns=7;s=MAIN.methods#Method_Add",
            },
        ]

        the_session.call(methodToCalls, function (err, results) {
            console.log("Calling function without arguments")
            if (err) {
                console.log("Err: " + err)
            }
            if (results[0].statusCode._name !== "Bad") {
                console.log("Result: ", results[0].outputArguments[0].value, "\n")
                resolve(results[0].outputArguments[0].value)
            } else {
                reject("No response from OPC Method")
            }
        })
    })
    return res
}

// browse session
async function browseSession(the_session) {
    let res = await new Promise((resolve, reject) => {
        the_session.browse("RootFolder", function (err, browseResult) {
            if (!err) {
                let data
                console.log("Browsing rootfolder: ")
                for (let reference of browseResult.references) {
                    console.log(reference.browseName.toString(), reference.nodeId.toString())
                    data = [...data, { name: reference.browseName.toString(), id: reference.nodeId.toString() }]
                }
                resolve(data)
            } else {
                reject("Browsing OPC server failed")
            }
        })
    })
    return res
}

// close session
async function closeSession(the_session) {
    the_session.close(function (err) {
        if (err) {
            console.log("closing session failed ?")
        }
    })
    client.disconnect(function () {
        console.log("Disconnecting")
    })
}

module.exports = { readData, callAddMethod, callAddMethodNoArguments, closeSession }
