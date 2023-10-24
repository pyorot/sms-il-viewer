// 5. PAGE TABLE METHODS
// these return html for the table components of each Page
// convention: x,y denote individual runs; p,l are player/level indices rsp.

// aux html generators
function tableFooterHTML(tableWidth) {
  // colspans that are larger than the table width cause extra scrollable whitespace on Gecko only
  return `<tr><td colspan="${tableWidth}" id="tableFooter">
    this app was made by shoutplenty (<a href='https://github.com/pyorot/sms-il-viewer'>v1.2</a>)
  </td></tr>`
}
function tooltipHTML(note) {
  return `<div class="tooltip">📝<div class="tooltipbox"><div class="tooltiptext">${note}</div></div></div>`
}

// generates table html; depends on class properties:
// this.dataIndex, this.sortIndex, Page.scoring
function tableAggregate() {
  // isotopes complicate the design of this algorithm
  // they are handled simultaneously, so are not listed separately in levelIDs
  let levelIDs = levelListToIDs(aggregates[this.dataIndex])
  let scoringName = {"p": "points", "ppct": "pts %", "l1": "ℓ<sub>1</sub>", "linf": "ℓ<sub>∞</sub>"}[Page.scoring]
  let html = `<table><tr>
      <th class="cell-a1">#</th>
      <th class="cell-a2">player</th>
      <th class="cell-a3 selectable" onclick="pageAggregate.sortTable(2)">${scoringName}</th>
      <th class="cell-a4 selectable" onclick="pageAggregate.sortTable(3)">🥇</th>
      <th class="cell-a5">🥈</th>
      <th class="cell-a6">🥉</th>
      <th class="cell-a7">v</th>
      <th class="cell-a8">n</th>
    </tr>`
  
  let table = [] // this is for raw data; it'll be reformatted for display later
  for (let p_ = 0; p_ < data.players.names.length; p_++) {
    // table entry format spec
     table[p_] = {
      p: p_,                          // player index
      name: data.players.names[p_],   // player name
      pts: 0,           // points
      l1: 0,            // l1 (sum of ranks-minus-one)
      linf: null,       // l∞ (maximum rank-minus-one)
      medals: [0,0,0],  // medal count
      entries: 0,       // entry count across submitted levels
      v: [0,0],         // video count [0: unique levels, 1: redundant isotopes]
      n: [0,0],         // level count [0: unique levels, 1: redundant isotopes]
    }
    // iterate level-by-level to populate stats (isotopes are handled simultaneously)
    for (let l_ of levelIDs) {
      // x is the main entry; y the isotope entry where applicable (assumed to have index l_+1)
      let x = data.body[l_][p_]
      let y = isotopes[data.levels.codes[l_]] ? data.body[l_+1][p_] : {points: null, rank: null}
      // entries = highest entry count of all isotopes
      x.entries = data.levels.entries[l_]
      y.entries = isotopes[data.levels.codes[l_]] ? data.levels.entries[l_+1] : null
      table[p_].entries += Math.max(x.entries, y.entries ?? 0)
      // points, submissions, videos
      if (x.time || y.time) { table[p_].n[0]++ }
      if (x.time && y.time) { table[p_].n[1]++ }
      if (x.link || y.link) { table[p_].v[0]++ }
      if (x.link && y.link) { table[p_].v[1]++ }
      table[p_].pts += Math.max(x.points ?? 0, y.points ?? 0)
      // l1/linf count the best rank across isotopes, assuming rank = entries for unsubmitted levels
      let rankPenalty = Math.min(x.rank ?? x.entries + 1, y.rank ?? (y.entries ?? Infinity) + 1) - 1
      table[p_].l1 += rankPenalty
      table[p_].linf = Math.max(table[p_].linf, rankPenalty)
      // medals treat the isotopes as separate levels
      for (let r of [x.rank, y.rank]) { if ([1,2,3].includes(r)) { table[p_].medals[r-1]++ } }
    }
    // score is the statistic that will be displayed
    table[p_].score = {
      "p":    table[p_].pts,
      "ppct": (Math.floor((table[p_].pts/table[p_].entries)*10000)/100).toFixed(2),
      "l1":   table[p_].l1,
      "linf": table[p_].linf,
    }[Page.scoring]
  }
  table.sort(this.sortMethods[this.sortIndex])

  // recall the standard rank algorithm: given a sorted list,
  // its index+1 is its rank unless its tied (repeated value), whence the rank persists
  let prevValue, rank
  for (let [i,entry] of table.entries()) {
    // calculate ranks
    let value = {2: entry.score, 3: entry.medals.toString()}[this.sortIndex] // depends on sort setting
    if (value != prevValue) { rank = i + 1 }
    entry.rank = rank
    prevValue = value
    // generate display code
    html += `<tr><td class="cell-a1">${entry.rank}</td>`
          + `<td class="cell-a2 selectable" onclick="${go("p",entry.p)}">${entry.name}</td>`
          + `<td class="cell-a3">${entry.score}</td>`
          + `<td class="cell-a4">${entry.medals[0]}</td>`
          + `<td class="cell-a5">${entry.medals[1]}</td>`
          + `<td class="cell-a6">${entry.medals[2]}</td>`
          + `<td class="cell-a7">${String(entry.v[0])+"'".repeat(entry.v[1])}</td>`
          + `<td class="cell-a8">${String(entry.n[0])+"'".repeat(entry.n[1])}</td></tr>`
  }

  // include footer iff it would stay near the bottom of the screen. 28 is current row height in stylesheet
  let includeFooter = 28 * (table.length + 2) >= parseInt($("#lb").css("height"),10) - 5
  return html + (includeFooter ? tableFooterHTML(8) : "") + "</table>"
}


function tableLevel() {
  let table = data.body[this.dataIndex].filter(x => !!x.rank).sort(this.sortMethods[this.sortIndex])
  $("#titleLevel").html(`<div>${data.levels.names[this.dataIndex]}</div>`)
  let html = `<table><tr>
      <th class="cell-l1">#</th>
      <th class="cell-l2">player</th>
      <th class="cell-l3">time</th>
      <th class="cell-l4">note</th>
    </tr>`
  for (let x of table) {
    let colourClass = {1: "gold", 2: "silver", 3: "bronze"}[x.rank] // html class annotation for colouring
    if (!colourClass) { colourClass = "" }
    let timeHTML = x.link ? `<a href=${x.link}>${x.time}</a>` : `${x.time}`
    let noteHTML = x.note ? tooltipHTML(x.note) : ``
    html += `<tr>
      <td class="cell-l1 ${colourClass}">${x.rank}</td>
      <td class="cell-l2 selectable" onclick="${go("p",x.p)}">${data.players.names[x.p]}</td>
      <td class="cell-l3">${timeHTML}</td>
      <td class="cell-l4">${noteHTML}</td>
    </tr>`
  }
  // include footer iff it would stay near the bottom of the screen. 28 is current row height in stylesheet
  let includeFooter = 28 * (table.length + 2) >= parseInt($("#lb").css("height"),10) - 5
  return html + (includeFooter ? tableFooterHTML(4) : "") + "</table>"
}


function tablePlayer() {
  let table = data.body.map(levelData => levelData[this.dataIndex])
  table = table.filter(x => !!x.rank).sort(this.sortMethods[this.sortIndex])
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
    let noteHTML = x.note ? tooltipHTML(x.note) : ``
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
  return html + (includeFooter ? tableFooterHTML(5) : "") + "</table>"
}
