const express = require('express')
const bodyParser = require('body-parser')
const app = express()
var fs = require('fs')

app.use(express.static('.'))
app.use(bodyParser.json())

app.listen(3000, () => {
  console.log(`Listening`)
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.post('/upload', (req, res) => {
  console.log(req.body)
  res.status(201).json({ message: 'Accepted' })
  fs.writeFile("data.js", `var data = JSON.parse(\n\`${JSON.stringify(req.body)}\`\n)`,
    (err) => { if (err) {console.log(err)} }
  )
})
