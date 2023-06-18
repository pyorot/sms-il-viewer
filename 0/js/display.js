// convention: x,y denote individual runs; p,l are player/level indices rsp.

// selected options
var l, p, s // persistent levelID, playerID, selection state

// nav

function navtop() {
  $("#navtop").html(`
    <div>SMS ILs</div>
    <input type="radio" id="nt-1" name="nt">
    <label for="nt-1" onclick="return bodyAggregate(s)">Overall</label>
    <input type="radio" id="nt-2" name="nt">
    <label for="nt-2" onclick="return bodyLevel(l)">Levels</label>
    <input type="radio" id="nt-3" name="nt">
    <label for="nt-3" onclick="return bodyPlayers(p)">Players</label>
  `)
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
    html += `<button onclick="return bodyLevel(${l_})" tabindex="-1">${code}</button>`
  }
  html += "</div></div>"
  $("#navleft").html(html)

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

// panels

function bodyAggregate(s_) {
  titleAggregate(s_)
  lbAggregate(s_)
  $("#navleft").css("display", "none")
}
function titleAggregate(s_) { // s__ is the next level of dummy variable
  $("#title").html(`
    <select id="sel" name="sel" onchange="lbAggregate($('select#sel option').filter(':selected').val())">
      ${Object.keys(aggregates).map(s__ => `<option value="${s__}" ${s__ == s_ ? `selected="selected"` : ``}>${s__}</option>`).join('')}
    </select>
  `)
}
function lbAggregate(s_) {
  s = s_ // update global index
  let levelIDs = levelListToIDs(aggregates[s_])
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
      let x = data.body[l_][p_]
      if (!x.points) { continue }                // skip unsubmitted levels
      row[2] += x.points                         // add points
      if (x.rank <= 3) { row[2 + x.rank] += 1 }  // add medals
      row[6] += x.link ? 1 : 0                   // add links (v)
      row[7] += 1                                // add submissions (n)
    }
    for (let pair of isotopes) {  // take larger of two points values for isotopes
      if (levelIDs.includes(pair[0])) {
        let [pts1, pts2] = [data.body[pair[0]][p_].points, data.body[pair[1]][p_].points]
        if (pts1 && pts2) { row[2] -= Math.min(pts1, pts2) }
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


function bodyLevel(l_) {
  titleLevel(l_)
  lbLevel(l_)
  $("#navleft").css("display", "block")
}
function titleLevel(l_) {
  $("#title").html(`<div>${data.levels.names[l_]}</div>`)
}
function lbLevel(l_) {
  l = l_ // update persistent global index
  let table = data.body[l_].filter(x => !!x.rank).sort((x,y) => x.rank - y.rank)
  let html = `<table><tr>
      <th class="cell-l1">#</th>
      <th class="cell-l2">player</th>
      <th class="cell-l3">time</th>
      <th class="cell-l4">note</th>
    </tr>`
  for (let x of table) {
    let timeHTML = x.time ? `<a href=${x.link}>${x.time}</a>` : `${x.time}`
    let noteHTML = x.note ? `<div class="tooltip">📝<span class="tooltiptext">${x.note}</span></div>` : ``
    html += `<tr>
      <td class="cell-l1">${x.rank}</td>
      <td class="cell-l2">${data.players.names[x.p]}</td>
      <td class="cell-l3">${timeHTML}</td>
      <td class="cell-l4">${noteHTML}</td>
    </tr>`
  }
  html += `</table>`
  $("#lb").html(html)
}


function bodyPlayers(p_) {
  titlePlayers(p_)
  lbPlayers(p_)
  $("#navleft").css("display", "none")
}
function titlePlayers(p_) { // p__ is the next level of dummy variable
  $("#title").html(`
    <select id="sel" name="sel" onchange="lbPlayers($('select#sel option').filter(':selected').val())">
      ${data.players.names.map((name,p__) =>
        `<option value="${p__}" ${p__ == p_ ? `selected="selected"` : ``}>${name}</option>`).join('')
      }
    </select>
  `)
}
function lbPlayers(p_) {
  p = p_ // update persistent global index
  let table = data.body.map(levelData => levelData[p_])
  table = table.filter(x => !!x.rank).sort((x,y) => x.rank - y.rank)
  let html = `<table><tr>
      <th class="cell-p1">level</th>
      <th class="cell-p2">rank</th>
      <th class="cell-p3">points</th>
      <th class="cell-p4">time</th>
      <th class="cell-p5">note</th>
    </tr>`
  for (let x of table) {
    let timeHTML = x.link ? `<a href=${x.link}>${x.time}</a>` : `${x.time}`
    let noteHTML = x.note ? `<div class="tooltip">📝<span class="tooltiptext">${x.note}</span></div>` : ``
    html += `<tr>
      <td class="cell-p1">${data.levels.codes[x.l]}</td>
      <td class="cell-p2">${x.rank}</td>
      <td class="cell-p3">${x.points}</td>
      <td class="cell-p4">${timeHTML}</td>
      <td class="cell-p5">${noteHTML}</td>
    </tr>`
  }
  html += `</table>`
  
  $("#lb").html(html)
}


// main loading script
(async() => {
  // load data
  await loadData() // blocking data load
  l = Math.floor(Math.random()*data.levels.names.length)
  p = Math.floor(Math.random()*4)
  s = "Total"
  annotateData()
  generateAggregates()
  console.log(data)

  // load website
  navtop()
  navleft()
  bodyAggregate(s)
})()
