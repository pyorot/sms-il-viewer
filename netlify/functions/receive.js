
exports.handler = async (event, context, callback) => {
    if(event.httpMethod === 'POST' && event.path === '/upload') {
        console.log(event.body)
        callback(null, { statusCode: 201, message: 'Accepted' })
        fs.writeFile("data.js", `var data = JSON.parse(\n\`${JSON.stringify(event.body)}\`\n)`,
          (err) => { if (err) {console.log(err)} }
        )
    }
}
