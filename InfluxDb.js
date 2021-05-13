let fetch = require("node-fetch")

async function storeData(url, db, data) {
    let completeString = ""
    let measurement = data[0]
    let tagNames = data[1]
    let tagValues = data[2]
    let fieldNames = data[3]
    let fieldValues = data[4]
    let timestamp = data[5]

    completeString = fixMeasurement(completeString, measurement)
    completeString = combineNameValue(completeString, tagNames, tagValues, true)
    completeString = combineNameValue(completeString, fieldNames, fieldValues, false)
    completeString = addTimestamp(completeString, timestamp)

    console.log(completeString)
    let res = await postData(url, db, completeString)
    return res
}

function fixMeasurement(incString, name) {
    incString += name
    incString += ","

    return incString
}

function combineNameValue(incString, name, value, tags) {
    for (i = 0; i < name.length; i++) {
        if (name[i] !== "") {
            incString += name[i]
            incString += "="
            incString += value[i]
            if (i + 1 < name.length && name[i + 1] !== "") {
                incString += ","
            }
        }
    }
    if (tags) {
        incString += " "
    }
    return incString
}

function addTimestamp(incString, time) {
    if (time !== "") {
        incString += " "
        incString += time
    }

    return incString
}

async function postData(url, db, data) {
    let res = await new Promise((resolve, reject) => {
        fetch(`${url}write?db=${db}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: data,
        }).then((response) => {
            console.log(response.status, "\n")
            let status = response.status
            resolve({ status, data })
            //console.log(response.statusText)
            //console.log(response.headers)
        })
    })
    return res
}

module.exports = {
    storeData,
}
