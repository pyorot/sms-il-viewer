// data: load from API
var data
var dataUrl = "https://script.google.com/macros/s/AKfycbz3ihGMcxM65F3tfhXq38V_tkVdiLLJ9aIUl2sYSWiKQVALD1QTaHOPBsIQQQukrjE8ow/exec"
var l, p // persistent level+player ids
var aggregates = {}
dataUrl = "../data.json" // for debug
async function loadData() {
  try {
    let res = await fetch(dataUrl)
    data = await res.json()
    console.log("data loaded")
  } catch (error) {
    document.getElementById("lbh").innerHTML = "data load failed; see console"
    console.error(error)
  }
}

function annotateData() {
  for (let l_ = 0; l_ < data.body.length; l_++) {
    data.body[l_] = data.body[l_].map((entry, p_) => [p_, ...entry, null, null]) // [playerID, time, link, note, points, rank]
    let sortedData = data.body[l_]
      .filter(x => parseTime(x[1]))
      .sort((x,y) => (data.levels.reversed[l_] ? -1 : 1) * (parseTime(x[1]) - parseTime(y[1])))

    // ranks
    let prevTime, rank
    for (let [i, entry] of sortedData.entries()) {
      if (entry[1] != prevTime) { rank = i+1 }
      data.body[l_][entry[0]][5] = rank
      prevTime = entry[1]
    }

    // points
    let points
    for (let [i, entry] of sortedData.reverse().entries()) {
      if (entry[1] != prevTime) { points = i+1 }
      data.body[l_][entry[0]][4] = points
      prevTime = entry[1]
    }
  }
}

function generateAggregates() {
  let c = data.levels.codes
  aggregates["Total"]    = c
  aggregates["Movement"] = `b3 b3s b4 b6 b6s r1 r2 r3 r4 r4s r5 g1s p2 p2s p3 p6s `
                         + `s2 s2s s3 s4 s4s n1 n2 n6 n6s q3 q4 q6 c`
  aggregates["Any%"]     = `b2 b3 b3s b4 b5 b6 b6s b7 r1 r2 r3 r4 r4s r5 r6 r7 g7 g8 `
                         + `p1 p2 p2s p3 p4 p6s peyg peygj s1 s2 s2s s3 s4 s4s s5 s6 s6j s7 `
                         + `n1 n2 n3 n4 n6 n6s n7 q1 q3 q4 q5 q5s q6 q7 a c cb`
  aggregates["¬Any%"]    = `b1 b8 b3r* b3r b6r* b6r b100 r6* r8 r4r* r4r r100 `
                         + `g1 g1s g2 g3 g4 g5 g6 gh g1r* g1r g100 p5 p6 p8 p2r p6r p100 `
                         + `s8 s2r s4r s100 n5 n8 nh n6r n100 q2 q8 q5r qh q100 ar* ar a100 `
                         + `bp beach box1 box2 box3 chuck gbird grass jail lbell light lily pach rbell sgate ubell`
  aggregates["Secrets"]  = `b3s b6s r4s g1s p2s p6s s2s s4s n6s q5s`
  aggregates["SMs"]      = `b7 r7 g7 p7 s7 n7 q7`
  aggregates["Bianco"]   = c.slice(c.indexOf("b1"), c.indexOf("r1"))
  aggregates["Ricco"]    = c.slice(c.indexOf("r1"), c.indexOf("g1"))
  aggregates["Gelato"]   = c.slice(c.indexOf("g1"), c.indexOf("p1"))
  aggregates["Pinna"]    = c.slice(c.indexOf("p1"), c.indexOf("s1"))
  aggregates["Sirena"]   = c.slice(c.indexOf("s1"), c.indexOf("n1"))
  aggregates["Noki"]     = c.slice(c.indexOf("n1"), c.indexOf("q1"))
  aggregates["Pianta"]   = c.slice(c.indexOf("q1"), c.indexOf("a"))
  aggregates["Delfino"]  = c.slice(c.indexOf("a"))
  aggregates["Secret Reds"] = c.filter(code => code[2] == "r")
  aggregates["100s"]        = c.filter(code => code.slice(1) == "100")
}

function levelListToIDs(list) {
  let slice = typeof(list) == "string" ? list.split(" ") : list;   let i = 0;
  let full  = data.levels.codes;                                   let j = 0;
  let output = []
  while (i < slice.length) { // zip algorithm (linear time)
    while (slice[i] != full[j]) {
      j++
      if (j >= full.length) { throw `invalid level code: ${slice[i]}` }
    }
    output.push(j)
    i++
  }
  return output
}

const regex = /^(?!0)(?:(?:(\d?\d)\:(?=\d\d))?([0-5]?\d)\:(?=\d\d))?([0-5]?\d)(?:\.(\d\d?|xx))?$/
function parseTime(input) {
  // run regex, validate and convert values
  let matches = input.match(regex) // returns null or [fullMatch, hrs, mins, secs, centisecs]
  if      (!matches)               {return null}
  else if (!matches[4])            {return null}
  else if (matches[4] == 'xx')     {return null}
  else if (matches[4].length == 1) {return null}
  // return result in seconds
  for (let i=1; i<matches.length; i++) { matches[i] = matches[i] ? parseInt(matches[i]) : 0 }
  return parseInt(matches[1]*60*60 + matches[2]*60 + matches[3]) + matches[4]/100
}


// div loaders
function navtop() {
  document.getElementById("navtop").innerHTML = `
    <div>SMS ILs</div>
    <input type="radio" id="nt-1" name="nt">
    <label for="nt-1" onclick="return panelRightAggregate()">Overall</label>
    <input type="radio" id="nt-2" name="nt">
    <label for="nt-2" onclick="return panelRightLevel(l)">Levels</label>
    <input type="radio" id="nt-3" name="nt">
    <label for="nt-3" onclick="return panelRightPlayers()">Players</label>
  `
}


function navleft() {
  const worldCodes = {"Bianco": "b", "Ricco": "r", "Gelato": "g", "Pinna": "p",
  "Sirena": "s", "Noki": "n", "Pianta": "q", "Delfino": ""}

  let html = `<div>`
  let prevWorld = ""
  for (let [l_,level] of data.levels.names.entries()) {
    if (level.substring(0,7)=="divider") {continue}
    let world = level.split(" ")[0]
    if (world != prevWorld) {
      prevWorld = world
      html += `</div></div>
      <div class="tab" tabindex="-1">
        <input type="radio" id="rd-${world}" name="rd">
        <label class="tab-label" for="rd-${world}">${world}</label>
        <div class="tab-content">`
    }
    let code = data.levels.codes[l_]
    html += `<button onclick="l=${l_}; return panelRightLevel(l)" tabindex="-1">${code}</button>`
  }
  html += "</div></div>"
  document.getElementById("navleft").innerHTML = html

  // binds menu-button deselect routine; see https://stackoverflow.com/a/27476660/6149041
  $("input[name=rd]").on("click", function (e) {
    let inp=$(this) // cache the selector
    if (inp.is(".theone")) { // if it has the "selected" class
      inp.prop("checked",false).removeClass("theone")
    } else {
      $(`input:radio[name='${inp.prop("name")}'].theone`).removeClass("theone")
      inp.addClass("theone")
    }
  })
}


function panelRightAggregate() {
  titleAggregate()
  lbAggregate()
  $("#navleft").css("display", "none")
}
function titleAggregate() {
  $("#title").html(`
    <select id="sel" name="sel" onchange="lbAggregate()">
      ${Object.keys(aggregates).map(agg => `<option value="${agg}">${agg}</option>`).join('')}
    </select>
  `)
}
function lbAggregate() {
  let selection = $("select#sel option").filter(":selected").val()
  let levelIDs = levelListToIDs(aggregates[selection])
  let isotopes = [levelListToIDs("peyg peygj"), levelListToIDs("s6 s6j")]

  let html = `<table><tr>
      <th class="cell-a1">#</th>
      <th class="cell-a2">player</th>
      <th class="cell-a3">points</th>
      <th class="cell-a4">🥇</th>
      <th class="cell-a5">🥈</th>
      <th class="cell-a6">🥉</th>
      <th class="cell-a7">v</th>
      <th class="cell-a8">n</th>
    </tr>`

  let table = [] // literal display table
  for (let p_ = 0; p_ < data.players.names.length; p_++) {
    let row = [0, "", 0, 0, 0, 0, 0, 0]
    row[1] = data.players.names[p_]
    for (let l_ of levelIDs) {
      if (!data.body[l_][p_][4]) { continue } // skip unsubmitted levels
      row[2] += data.body[l_][p_][4]          // add points
      if (data.body[l_][p_][5] <= 3) { row[2 + data.body[l_][p_][5]] += 1 } // add medals
      row[6] += data.body[l_][p_][2] ? 1 : 0  // add links (v)
      row[7] += 1                             // add submissions (n)
    }
    for (let pair of isotopes) {
      if (pair[0] in levelIDs && data.body[pair[0]][p_][4] && data.body[pair[1]][p_][4]) {
        row[2] -= Math.min(data.body[pair[0]][p_][4], data.body[pair[1]][p_][4])
      }
    }
    table.push(row)
  }
  table.sort((r,s) => s[2] - r[2])

  // aggregate rank calculation + display code
  let prevPoints, rank
  for (let [i,row] of table.entries()) {
    if (row[2] != prevPoints) { rank = i+1 }
    row[0] = rank
    html += `<tr>
      ${row.map((cell,i) => `<td class="cell-a${i+1}">${cell}</td>`).join("")}
    </tr>`
    prevPoints = row[2]
  }

  html += `</table>`
  $("#lb").html(html)
}


function panelRightLevel(l_) {
  let table = data.body[l_].filter(x => !!x[5]).sort((x,y) => x[5] - y[5])
  let html = `<table><tr>
      <th class="cell-l1">#</th>
      <th class="cell-l2">player</th>
      <th class="cell-l3">time</th>
      <th class="cell-l4">note</th>
    </tr>`
  for (let entry of table) {
    let time = entry[2] ? `<a href=${entry[2]}>${entry[1]}</a>` : `${entry[1]}`
    let note = entry[3] ? `<div class="tooltip">📝<span class="tooltiptext">${entry[3]}</span></div>` : ``
    html += `<tr>
      <td class="cell-l1">${entry[5]}</td>
      <td class="cell-l2">${data.players.names[entry[0]]}</td>
      <td class="cell-l3">${time}</td>
      <td class="cell-l4">${note}</td>
    </tr>`
  }
  html += `</table>`
  $("#title").html(`<h2>${data.levels.names[l_]}</h2>`)
  $("#lb").html(html)
  $("#navleft").css("display", "block")
}


function panelRightPlayers() {
  titlePlayers()
  lbPlayers()
  $("#navleft").css("display", "none")
}
function titlePlayers() {
  $("#title").html(`
    <select id="sel" name="sel" onchange="lbPlayers()">
      ${data.players.names.map((name,p_) => `<option value="${p_}" ${p == p_ ? `selected="selected"` : ``}>${name}</option>`).join('')}
    </select>
  `)
}
function lbPlayers() {
  p = $("select#sel option").filter(":selected").val()
  let table = data.body.map(levelData => levelData[p])
  table.forEach((x, l_) => { x[0] = l_ }) // swap player index for level index
  table = table.filter(x => !!x[5]).sort((x,y) => x[5] - y[5])
  let html = `<table><tr>
      <th class="cell-p1">level</th>
      <th class="cell-p2">rank</th>
      <th class="cell-p3">points</th>
      <th class="cell-p4">time</th>
      <th class="cell-p5">note</th>
    </tr>`
  for (let entry of table) { // entry[0] is now level index
    let time = entry[2] ? `<a href=${entry[2]}>${entry[1]}</a>` : `${entry[1]}`
    let note = entry[3] ? `<div class="tooltip">📝<span class="tooltiptext">${entry[3]}</span></div>` : ``
    html += `<tr>
      <td class="cell-p1">${data.levels.codes[entry[0]]}</td>
      <td class="cell-p2">${entry[5]}</td>
      <td class="cell-p3">${entry[4]}</td>
      <td class="cell-p4">${time}</td>
      <td class="cell-p5">${note}</td>
    </tr>`
  }
  html += `</table>`
  
  $("#lb").html(html)
}


(async() => {
  // load data
  await loadData() // blocking data load
  console.log(data)
  l = Math.floor(Math.random()*data.levels.names.length)
  p = Math.floor(Math.random()*4)
  annotateData()
  generateAggregates()
  console.log(data)

  // load website
  navtop()
  navleft()
  panelRightAggregate()
})()
