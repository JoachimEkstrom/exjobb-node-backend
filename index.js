const { OPCUAClient } = require("node-opcua")
const async = require("async")
const OPC_calls = require("./OPC_calls.js")
const endpointUrl = "opc.tcp://DESKTOP-3NAA2AR:4841/"
const influxdb = require("./InfluxDb")
const dbUrl = "http://localhost:8086/"
const dbName = "ExJobb"

let OPCUA_Session
let client

const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const app = express()
const port = 3005

app.use(cors())
app.use(bodyParser.json())

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
                        OPCUA_Session = session
                    })
                }
            })
        },
    ])
}

// Start OPC Server
runOpcClient()

// Express server

app.get("/addToInfluxDb", async (req, res) => {
    let data = await OPC_calls.readData(OPCUA_Session)
    let response = await influxdb.storeData(dbUrl, dbName, data)
    console.log(response)
    res.json(response)
})
app.post("/readvariable", async (req, res) => {
    let data = await OPC_calls.readVariable(OPCUA_Session, req.body.nodeId)
    console.log(data)
    res.json(data)
})
app.post("/writeVariable", async (req, res) => {
    let data = await OPC_calls.writeVariable(OPCUA_Session, req.body.nodeId, req.body.newValue)
    console.log(data)
    res.json(data)
})
app.post("/callMethod", async (req, res) => {
    let data = await OPC_calls.callAddMethod(OPCUA_Session, req.body.uri, req.body.a, req.body.b)
    console.log(data)
    res.json(data)
})
app.post("/browseOPCServer", async (req, res) => {
    let data = await OPC_calls.browseSession(OPCUA_Session, req.body.uri)
    console.log(data)
    res.json(data)
})

app.listen(port, () => {
    console.log(`OPC Backend is listening at http://localhost:${port}`)
})
