var fs = require('fs')

exports.handler = async (event, context) => {
  console.log(event)
  if(event.httpMethod === 'POST') {
    console.log(event.body)
    fs.writeFileSync("data.js", `var data = JSON.parse(\n\`${JSON.stringify(event.body)}\`\n)`)
    // (err) => { if (err) {console.log(err)} }
    return { statusCode: 201, body: 'Accepted' }
  } else {
    return { statusCode: 400, body: 'Unknown' }
  }
}
