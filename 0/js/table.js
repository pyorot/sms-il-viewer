// 5. PAGE TABLE METHODS
// these return html for the table components of each Page
// convention: x,y denote individual runs; p,l are player/level indices rsp.

var tableFooterHTML = `<tr><td colspan="20" id="tableFooter">
  this webapp was made by shoutplenty (<a href='https://github.com/pyorot/sms-il-viewer'>v1</a>)
</td></tr>`

function tableAggregate(s_=this.dataIndex, sortIndex=this.sortIndex) {
  let levelIDs = levelListToIDs(aggregates[s_])
  let isotopes = [levelListToIDs("peyg peygj"), levelListToIDs("s6 s6j")]
  // isotopes are pairs of levels for which only the higher is counted for points

  let html = `<table><tr>
      <th class="cell-a1">#</th>
      <th class="cell-a2">player</th>
      <th class="cell-a3 selectable" onclick="pageAggregate.sortTable(2)">points</th>
      <th class="cell-a4 selectable" onclick="pageAggregate.sortTable(3)">🥇</th>
      <th class="cell-a5">🥈</th>
      <th class="cell-a6">🥉</th>
      <th class="cell-a7">v</th>
      <th class="cell-a8">n</th>
    </tr>`

  let table = [] // literal display table
  for (let p_ = 0; p_ < data.players.names.length; p_++) {
    let row = [0, "", 0, 0, 0, 0, 0, 0]
    row[1] = {p: p_, name: data.players.names[p_]} // will be turned into link=p, value=name
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
        if (pts1 && pts2) { row[2] -= Math.min(pts1, pts2) } // if both points exist, deduct the lower
      }
    }
    table.push(row)
  }
  table.sort(this.sortMethods[sortIndex])

  // aggregate rank calculation + display code
  // having sorted the table, we iterate thru linearly to get aggregate ranks
  // recall the standard rank algorithm: given a sorted list,
  // its index+1 is its rank unless its tied (repeated value), whence the rank persists
  let prevValue, rank
  for (let [i,row] of table.entries()) {
    let value = {2: row[2], 3: row.slice(3,6).toString()}[sortIndex] // depends on sort setting
    if (value != prevValue) { rank = i+1 }
    row[0] = rank
    let rowHTML = row.map((cell,i) => `<td class="cell-a${i+1}">${cell}</td>`)
    rowHTML[1] = `<td class="cell-a2 selectable" onclick="${go("p",row[1].p)}">${row[1].name}</td>`
    html += `<tr>${rowHTML.join("")}</tr>`
    prevValue = value
  }
  // include footer iff it would stay near the bottom of the screen. 28 is current row height in stylesheet
  let includeFooter = 28 * (table.length + 2) >= parseInt($("#lb").css("height"),10) - 5
  return html + (includeFooter ? tableFooterHTML : "") + "</table>"
}


function tableLevel(l_=this.dataIndex, sortIndex=this.sortIndex) {
  let table = data.body[l_].filter(x => !!x.rank).sort(this.sortMethods[sortIndex])
  $("#titleLevel").html(`<div>${data.levels.names[l_]}</div>`)
  let html = `<table><tr>
      <th class="cell-l1">#</th>
      <th class="cell-l2">player</th>
      <th class="cell-l3">time</th>
      <th class="cell-l4">note</th>
    </tr>`
  for (let x of table) {
    let colourClass = {1: "gold", 2: "silver", 3: "bronze"}[x.rank] // html class annotation for colouring
    if (!colourClass) { colourClass = "" }
    let timeHTML = x.time ? `<a href=${x.link}>${x.time}</a>` : `${x.time}`
    let noteHTML = x.note ? `<div class="tooltip">📝<span class="tooltiptext">${x.note}</span></div>` : ``
    html += `<tr>
      <td class="cell-l1 ${colourClass}">${x.rank}</td>
      <td class="cell-l2 selectable" onclick="${go("p",x.p)}">${data.players.names[x.p]}</td>
      <td class="cell-l3">${timeHTML}</td>
      <td class="cell-l4">${noteHTML}</td>
    </tr>`
  }
  // include footer iff it would stay near the bottom of the screen. 28 is current row height in stylesheet
  let includeFooter = 28 * (table.length + 2) >= parseInt($("#lb").css("height"),10) - 5
  return html + (includeFooter ? tableFooterHTML : "") + "</table>"
}


function tablePlayer(p_=this.dataIndex, sortIndex=this.sortIndex) {
  let table = data.body.map(levelData => levelData[p_])
  table = table.filter(x => !!x.rank).sort(this.sortMethods[sortIndex])
  let html = `<table><tr>
      <th class="cell-p1 selectable" onclick="pagePlayer.sortTable(0)">level</th>
      <th class="cell-p2 selectable" onclick="pagePlayer.sortTable(1)">rank</th>
      <th class="cell-p3 selectable" onclick="pagePlayer.sortTable(2)">points</th>
      <th class="cell-p4">time</th>
      <th class="cell-p5">note</th>
    </tr>`
  for (let x of table) {
    let colourClass = {1: "gold", 2: "silver", 3: "bronze"}[x.rank]  // html class annotation for colouring
    if (!colourClass) { colourClass = "" }
    let timeHTML = x.link ? `<a href=${x.link}>${x.time}</a>` : `${x.time}`
    let noteHTML = x.note ? `<div class="tooltip">📝<span class="tooltiptext">${x.note}</span></div>` : ``
    html += `<tr>
      <td class="cell-p1 selectable" onclick="${go("l",x.l)}">${data.levels.codes[x.l]}</td>
      <td class="cell-p2 ${colourClass}">${x.rank}</td>
      <td class="cell-p3">${x.points}</td>
      <td class="cell-p4">${timeHTML}</td>
      <td class="cell-p5">${noteHTML}</td>
    </tr>`
  }
  // include footer iff it would stay near the bottom of the screen. 28 is current row height in stylesheet
  let includeFooter = 28 * (table.length + 2) >= parseInt($("#lb").css("height"),10) - 5
  return html + (includeFooter ? tableFooterHTML : "") + "</table>"
}
