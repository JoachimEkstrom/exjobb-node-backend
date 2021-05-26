const { AttributeIds } = require("node-opcua")

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
                reject("Error: Could not read varable")
            }
        })
    })
    return res
}

//  write to a variable
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
                    if (statusCode._name === "Good") resolve("Value written to OPC Server")
                } else {
                    resolve("Returned NULL value")
                }
            } else {
                reject("Error: Could not write varable")
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
                    reject("No data returned")
                }
            }
        })
    })
    return res
}

// Call a method with arguments
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
                reject("No response from OPC Method") // Should be change to reject as soon as testiog is done.
            }
        })
    })

    return res
}

// Call a method without arguments
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

// browse folder in the OPC server
async function browseSession(OPCUA_Session, uri) {
    let data = await new Promise((resolve, reject) => {
        OPCUA_Session.browse(uri, function (err, browseResult) {
            if (!err) {
                let data = []
                // console.log(browseResult.references)
                // console.log(browseResult.typeDefinition)
                // console.log(browseResult.displayName)
                // console.log(browseResult.referenceTypeId)
                let readOnly = false
                let name = ""
                for (let i = 0; i < browseResult.references.length; i++) {
                    // remove namespace from name
                    name = browseResult.references[i].browseName.toString()
                    name = name.split(":")
                    if (name[1]) {
                        name = name[1]
                    } else {
                        name = name[0]
                    }

                    data = [
                        ...data,
                        {
                            name: name,
                            id: browseResult.references[i].nodeId.toString(),
                            nodeClass: browseResult.references[i].nodeClass,
                            arguments: [],
                            result: "",
                            readOnly: readOnly,
                            dataType: "",
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

    for (let i = 0; i < data.length; i++) {
        if (data[i].nodeClass === 2) {
            let res = await readAttributes(OPCUA_Session, data[i].id)
            data[i].readOnly = res.readOnly
            data[i].dataType = res.dataType
        }
    }
    return data
}

async function readAttributes(OPCUA_Session, id) {
    let data = await new Promise((resolve, reject) => {
        let data = {
            readOnly: "",
            dataType: "",
        }

        OPCUA_Session.readAllAttributes(id, (err, nodesToRead, dataValues, diagnostics) => {
            if (!err) {
                console.log(nodesToRead)
                if (nodesToRead.userAccessLevel === 3) {
                    data.readOnly = false
                } else {
                    data.readOnly = true
                }
                data.dataType = nodesToRead.dataType.value
                resolve(data)
            } else {
                reject("Could not read attributes from node")
            }
        })
    })
    return data
}

// get the arguments for a method
async function getMethodArguments(OPCUA_Session, uri) {
    let res = await new Promise((resolve, reject) => {
        const inputArgumentNodeId = `${uri}.InputArguments`
        const outputArgumentNodeId = `${uri}.OutputArguments`

        const nodesToRead = [
            { attributeIds: AttributeIds.Value, nodeId: inputArgumentNodeId },
            { attributeIds: AttributeIds.Value, nodeId: outputArgumentNodeId },
        ]
        const maxAge = 0
        OPCUA_Session.read(nodesToRead, maxAge, function (err, dataValue) {
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
            } else {
                reject("Error getting arguments")
            }
            // Datatypes and their OPC UA Id number
            //      ID	Name	Description
            // 1	Boolean	A two-state logical value (true or false).
            // 2	SByte	An integer value between −128 and 127 inclusive.
            // 3	Byte	An integer value between 0 and 255 inclusive.
            // 4	Int16	An integer value between −32 768 and 32 767 inclusive.
            // 5	UInt16	An integer value between 0 and 65 535 inclusive.
            // 6	Int32	An integer value between −2 147 483 648 and 2 147 483 647 inclusive.
            // 7	UInt32	An integer value between 0 and 4 294 967 295 inclusive.
            // 8	Int64	An integer value between −9 223 372 036 854 775 808 and 9 223 372 036 854 775 807 inclusive.
            // 9	UInt64	An integer value between 0 and 18 446 744 073 709 551 615 inclusive.
            // 10	Float	An IEEE single precision (32 bit) floating point value.
            // 11	Double	An IEEE double precision (64 bit) floating point value.
            // 12	String	A sequence of Unicode characters.
            // 13	DateTime	An instance in time.
            // 14	Guid	A 16-byte value that can be used as a globally unique identifier.
            // 15	ByteString	A sequence of octets.
            // 16	XmlElement	An XML element.
            // 17	NodeId	An identifier for a node in the address space of an OPC UA Server.
            // 18	ExpandedNodeId	A NodeId that allows the namespace URI to be specified instead of an index.
            // 19	StatusCode	A numeric identifier for an error or condition that is associated with a value or an operation.
            // 20	QualifiedName	A name qualified by a namespace.
            // 21	LocalizedText	Human readable text with an optional locale identifier.
            // 22	ExtensionObject	A structure that contains an application specific data type that may not be recognized by the receiver.
            // 23	DataValue	A data value with an associated status code and timestamps.
            // 24	Variant	A union of all of the types specified above.
            // 25	DiagnosticInfo	A structure that contains detailed error and diagnostic information associated with a StatusCode.
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
    getMethodArguments,
    closeSession,
}
