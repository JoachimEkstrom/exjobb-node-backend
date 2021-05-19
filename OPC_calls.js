const { AttributeIds } = require("node-opcua")
const opcua = require("node-opcua")

//  read a variable
async function readVariable(OPCUA_Session, nodeId) {
    let res = await new Promise((resolve, reject) => {
        OPCUA_Session.read({ nodeId: nodeId, attributeId: AttributeIds.Value }, (err, dataValue) => {
            if (!err) {
                if (dataValue.value.value !== null) {
                    resolve(dataValue.value.value)
                } else {
                    resolve("Returned NULL value")
                }
            } else {
                reject("Error: Could not read varable ", err)
            }
        })
    })
    return res
}

//  write a variable
async function writeVariable(OPCUA_Session, nodeId, newValue) {
    let res = await new Promise((resolve, reject) => {
        let data = {
            nodeId: nodeId,
            attributeId: AttributeIds.Value,
            value: {
                value: {
                    dataType: opcua.DataType.Int16,
                    value: newValue,
                },
            },
        }

        OPCUA_Session.write(data, (err, statusCode) => {
            if (!err) {
                if (statusCode !== null) {
                    resolve(statusCode)
                } else {
                    resolve("Returned NULL value")
                }
            } else {
                reject("Error: Could not read varable ", err)
            }
        })
    })
    return res
}
//read complete Influx String with read
async function readData(OPCUA_Session) {
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
        OPCUA_Session.read(nodeToRead, maxAge, function (err, dataValue) {
            responseData = []
            if (!err) {
                for (i = 0; i < dataValue.length; i++) {
                    responseData = [...responseData, dataValue[i].value.value]
                }
                if (responseData[0] !== null) {
                    resolve(responseData)
                } else {
                    resolve("No data returned")
                }
            }
        })
    })
    return res
}

async function callAddMethod(OPCUA_Session, uri, a, b) {
    let res = await new Promise((resolve, reject) => {
        let objId = uri.split("#")
        let methodToCalls = [
            {
                objectId: objId[0], //"ns=7;s=MAIN.methods"
                methodId: uri, //"ns=7;s=MAIN.methods#Method_Add2"
                inputArguments: [
                    { dataType: opcua.DataType.Float, value: a },
                    { dataType: opcua.DataType.Float, value: b },
                ],
            },
        ]

        OPCUA_Session.call(methodToCalls, function (err, results) {
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

async function callAddMethodNoArguments(OPCUA_Session) {
    let res = await new Promise((resolve, reject) => {
        let methodToCalls = [
            {
                objectId: "ns=7;s=MAIN.methods",
                methodId: "ns=7;s=MAIN.methods#Method_Add",
            },
        ]

        OPCUA_Session.call(methodToCalls, function (err, results) {
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
async function browseSession(OPCUA_Session, uri) {
    let res = await new Promise((resolve, reject) => {
        OPCUA_Session.browse(uri, function (err, browseResult) {
            if (!err) {
                let data = []

                for (let i = 0; i < browseResult.references.length; i++) {
                    // console.log(browseResult.references[i])
                    data = [
                        ...data,
                        {
                            name: browseResult.references[i].browseName.toString(),
                            id: browseResult.references[i].nodeId.toString(),
                            nodeClass: browseResult.references[i].nodeClass,
                            arguments: [],
                            result: "",
                            // NodeClass
                            // OBJECT_1
                            // VARIABLE_2
                            // METHOD_4
                            // OBJECT_TYPE_8
                            // VARIABLE_TYPE_16
                            // REFERENCE_TYPE_32
                            // DATA_TYPE_64
                            // VIEW_128
                        },
                    ]
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
async function closeSession(OPCUA_Session) {
    OPCUA_Session.close(function (err) {
        if (err) {
            console.log("closing session failed ?")
        }
    })
    client.disconnect(function () {
        console.log("Disconnecting")
    })
}

module.exports = {
    readVariable,
    writeVariable,
    readData,
    callAddMethod,
    callAddMethodNoArguments,
    browseSession,
    closeSession,
}
