// 7. PAGE TABLE METHODS
// these return html for the table components of each Page
// convention: x,y denote individual runs; p,l are player/level indices rsp.
// they depend on class properties: this.dataIndex, this.sortIndex, Page.scoring

// footer html generator
function tableFooterHTML(tableWidth) {
  // colspans that are larger than the table width cause extra scrollable whitespace on Gecko only
  return `<tr><td colspan="${tableWidth}" id="tableFooter">
    this app was made by <a href='https://shoutplenty.netlify.app/sms'>shoutplenty</a> 
    (<a href='https://github.com/pyorot/sms-il-viewer'>code</a>: v2.2)
  </td></tr>`
}


// note parser
const URLMedial   = /\w\-\+\*\/\?\&\=\#\.\@\:\;/              // valid URL characters
const URLFinal    = /\w\-\+\*\/\?\&\=\#/                      // as above but with some characters banned
try { // USES REGEX LOOKBEHIND SO REQUIRES SAFARI/IOS 16.4 (2023/03) OR OTHER BROWSERS POST–2020/08
  var URLRegex    = new RegExp(`(?<!<a href=")https?\:\/\/[${URLMedial.source}]*[${URLFinal.source}]`,"g")
  // ^ (ignores already-formatted urls with <a> tag) http(s):// + any combo of medials + one final
  var MDLinkRegex = new RegExp(`\\[([^\\[\\]]+)\\]\\(\\s*(${URLRegex.source})\\s*\\)`,"g")  // [a](b), where a non-empty non-][ and b valid URL inside spaces
} catch (e) { // hobbled lookbehind-free version of URLRegex; delete this shit in like 2027
  console.warn(e, e.stack)
  var URLRegex    = new RegExp(              `https?\:\/\/[${URLMedial.source}]*[${URLFinal.source}]`,"g")  // as above but no lookbehind
}

function tooltipHTML(note) {
  note = note.replace(/\n/g, "<br>")                          // render newlines
  if (URLRegex.source.slice(0,4) == "(?<!") {                 // checks for lookbehind
    // we cannot run the URLRegex twice without the lookbehind else it would format markdown URLs twice
    // so this must be skipped in that case; delete this shit in like 2027
    note =  note.replace(MDLinkRegex, (match, text, link) => { // format markdown URLs (text/link params are 1st/2nd capture groups)
              try {new URL(link)} catch (_){return match}     // skip URLs that fail validation (more secure)
              return `<a href="${link}">${text}</a>`
            })
  }
  note =  note.replace(URLRegex, match => {                      // format raw URLs (match param is entire match)
            try {new URL(match)} catch (_){return match}        // skip URLs that fail validation (more secure)
            return `<a href="${match}">${match}</a>`
          })
  return `<div class="tooltip">📝<div class="tooltipbox"><div class="tooltiptext">${note}</div></div></div>`
}


function tableAggregate() {
  // aggregates are sets of levels by which the leaderboard viewer can be filtered
  // isotopes (pairs for which only the better is counted for points/ranks) complicate the design of this algorithm
  // they are handled simultaneously, so are not listed separately in levelIDs
  let levelIDs = levelListToIDs(data.levels.aggregates[this.dataIndex])
  let scoringName = {"p": "points", "ppct": "pts %", "l1": "ℓ<sub>1</sub>", "linf": "ℓ<sub>∞</sub>"}[Page.scoring]
  let html = `<table><tr>
      <th class="cell-a1">#</th>
      <th class="cell-a2 selectable" onclick="pageAggregate.sortTable(1)">player</th>
      <th class="cell-a3 selectable" onclick="pageAggregate.sortTable(2)">${scoringName}</th>
      <th class="cell-a4 selectable" onclick="pageAggregate.sortTable(3)">🥇</th>
      <th class="cell-a5">🥈</th>
      <th class="cell-a6">🥉</th>
      <th class="cell-a7 selectable" onclick="pageAggregate.sortTable(6)">v</th>
      <th class="cell-a8 selectable" onclick="pageAggregate.sortTable(7)">n</th>
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
      let xCode = data.levels.codes[l_]
      let y = data.levels.isotopes[xCode] ? data.body[l_+1][p_] : {points: null, rank: null}
      let yCode = data.levels.isotopes[xCode] ? data.levels.codes[l_+1] : undefined
      // entries = highest entry count of all isotopes
      x.entries = data.levels.entries[l_]
      y.entries = data.levels.isotopes[xCode] ? data.levels.entries[l_+1] : null
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
      if ([1,2,3].includes(x.rank) && !data.levels.medalless.includes(xCode)) {table[p_].medals[x.rank-1]++}
      if ([1,2,3].includes(y.rank) && !data.levels.medalless.includes(yCode)) {table[p_].medals[y.rank-1]++}
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
    let value = { // depends on sort setting; these need to uniquely id sorts but needn't sort correctly themselves
      1: undefined,
      2: entry.score,
      3: entry.medals.toString(),
      6: entry.v.concat(...entry.n).toString(),
      7: entry.n.concat(...entry.v).toString(),
    }[this.sortIndex] 
    if (value != prevValue) { rank = i + 1 }
    entry.rank = rank
    prevValue = value
    // generate display code
    html += `<tr><td class="cell-a1">${entry.rank ?? ""}</td>`
          + `<td class="cell-a2 selectable" onclick="go('p',${entry.p})">${entry.name}</td>`
          + `<td class="cell-a3">${entry.score}</td>`
          + `<td class="cell-a4">${entry.medals[0]}</td>`
          + `<td class="cell-a5">${entry.medals[1]}</td>`
          + `<td class="cell-a6">${entry.medals[2]}</td>`
          + `<td class="cell-a7">${String(entry.v[0])+"'".repeat(entry.v[1])}</td>`
          + `<td class="cell-a8">${String(entry.n[0])+"'".repeat(entry.n[1])}</td></tr>`
  }

  // total entries at foot of table
  let totalEntries = levelIDs.map(l_ => data.levels.entries[l_]).reduce((a, b) => a + b, 0) // only includes 1st isotopes
  let scorableEntries = totalEntries // levels available for scoring; will adjust isotopes as below:
  for (let code in data.levels.isotopes) {
    let l_ = data.levels.codes.indexOf(code)
    if (levelIDs.includes(l_)) {
      let [xEntries, yEntries] = [data.levels.entries[l_], data.levels.entries[l_+1]]
      totalEntries += yEntries // add 2nd isotopes to total
      // total possible score includes larger isotope's entry count for points-based scoring and smaller for rank-based scoring
      scorableEntries += -xEntries +(["p", "ppct"].includes(Page.scoring) ? Math.max(xEntries, yEntries) : Math.min(xEntries, yEntries))
    }
  }
  html += `<tr><td colspan="8" id="totalEntries">total entries:
           ${totalEntries}${scorableEntries < totalEntries ? ` (${scorableEntries} available for ${scoringName})` : ""}</td></tr>`

  // include footer iff it would stay near the bottom of the screen. 28 is current row height in stylesheet
  let includeFooter = 28 * (table.length + 2) >= parseInt($("#lb").css("height"),10) - 5
  return html + (includeFooter ? tableFooterHTML(8) : "") + "</table>"
}


function tableLevel() {
  let table = data.body[this.dataIndex].filter(x => !!x.rank).sort(this.sortMethods[this.sortIndex])
  let cutoffIndex = data.levels.cutoffs[this.dataIndex]
  $("#titleLevel").html(`<div>${data.levels.names[this.dataIndex]}</div>`)
  let html = `<table><tr>
      <th class="cell-l1">#</th>
      <th class="cell-l2">player</th>
      <th class="cell-l3">time</th>
      <th class="cell-l4">note</th>
    </tr>`
  for (let [i,x] of table.entries()) {
    let colour = {1: "gold", 2: "silver", 3: "bronze"}[x.rank] // html class annotation for colouring
    if (!colour) { colour = "" }
    let valueHTML = x.link ? `<a href="${x.link}">${x.value}</a>` : `${x.value}`
    let noteHTML = x.note ? tooltipHTML(x.note) : ``
    let cutoff = i == cutoffIndex && this.sortIndex == 0 ? `cutoff` : `` // cutoff appears as bottom border
    html += `<tr>
      <td class="cell-l1 ${cutoff} ${colour}">${x.rank}</td>
      <td class="cell-l2 ${cutoff} selectable" onclick="go('p',${x.p})">${data.players.names[x.p]}</td>
      <td class="cell-l3 ${cutoff}">${valueHTML}</td>
      <td class="cell-l4 ${cutoff}">${noteHTML}</td>
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
    let valueHTML = x.link ? `<a href="${x.link}">${x.value}</a>` : `${x.value}`
    let noteHTML = x.note ? tooltipHTML(x.note) : ``
    html += `<tr>
      <td class="cell-p1 selectable" onclick="go('l',${x.l})">${data.levels.codes[x.l]}</td>
      <td class="cell-p2 ${colourClass}">${x.rank}</td>
      <td class="cell-p3">${x.points}</td>
      <td class="cell-p4">${valueHTML}</td>
      <td class="cell-p5">${noteHTML}</td>
    </tr>`
  }
  // include footer iff it would stay near the bottom of the screen. 28 is current row height in stylesheet
  let includeFooter = 28 * (table.length + 2) >= parseInt($("#lb").css("height"),10) - 5
  return html + (includeFooter ? tableFooterHTML(5) : "") + "</table>"
}
