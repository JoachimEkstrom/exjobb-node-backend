const { OPCUAClient, makeBrowsePath, AttributeIds, resolveNodeId, TimestampsToReturn } = require("node-opcua")
const opcua = require("node-opcua")
const async = require("async")
const influxdb = require("./InfluxDb")
const endpointUrl = "opc.tcp://DESKTOP-3NAA2AR:4841/"
const dbUrl = "http://localhost:8086/"
const dbName = "ExJobb"
let the_session
let client
let responeData = []

async function runOpcClient() {
    client = OPCUAClient.create({
        endpoint_must_exist: false,
    })
    client.on("backoff", (retry, delay) =>
        console.log(
            "still trying to connect to ",
            endpointUrl,
            ": retry =",
            retry,
            "next attempt in ",
            delay / 1000,
            "seconds"
        )
    )

    async.series([
        // step 1 : connect to
        function () {
            client.connect(endpointUrl, function (err) {
                if (err) {
                    console.log("Cannot connect to endpoint :", endpointUrl)
                } else {
                    console.log("Connected!")
                    client.createSession(function (err, session) {
                        if (err) {
                            return err
                        }
                        console.log("Session created!")
                        the_session = session
                    })
                }
            })
        },
    ])
}
//read variables with read
async function readData() {
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
        responeData = []
        if (!err) {
            for (i = 0; i < dataValue.length; i++) {
                responeData = [...responeData, dataValue[i].value.value]
            }

            influxdb.storeData(dbUrl, dbName, responeData)
        }
        return err
    })
}

async function callAddMethod(a, b) {
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
        console.log("Result: ", results[0].outputArguments[0].value, "\n")
    })
}

async function callAddMethodNoArguments() {
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
        console.log("Result: ", results[0].outputArguments[0].value, "\n")
    })
}

// close session
async function closeSession() {
    the_session.close(function (err) {
        if (err) {
            console.log("closing session failed ?")
        }
    })
    client.disconnect(function () {
        console.log("Disconnecting")
    })
}

// Run commands
runOpcClient()

setTimeout(() => {}, 500)

setInterval(() => {
    readData()
    callAddMethod(5.4, 10.3)
    callAddMethodNoArguments()
}, 1000)

// setTimeout(() => {
//     closeSession()
// }, 500)
