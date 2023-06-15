const worldCodes = {"Bianco": "b", "Ricco": "r", "Gelato": "g", "Pinna": "p",
  "Sirena": "s", "Noki": "n", "Pianta": "q", "Delfino": ""}

// data: load from API
var data
var dataUrl = "https://script.google.com/macros/s/AKfycbz3ihGMcxM65F3tfhXq38V_tkVdiLLJ9aIUl2sYSWiKQVALD1QTaHOPBsIQQQukrjE8ow/exec"
// dataUrl = "data.json" // for debug
async function loadData() {
  try {
    let res = await fetch(dataUrl)
    data = await res.json()
    console.log("data loaded:")
    console.log(data)
  } catch (error) {
    document.getElementById("lbh").innerHTML = "data load failed; see console"
    console.error(error)
  }
}


function loadNav() {
  let html = `<div class="tab">
    <input type="radio" id="rd-overall" name="rd">
    <label class="tab-label" id="tab-overall" for="rd-overall" onclick="return loadLbOverall()">
      Overall
    </label>
  `
  let prevWorld = ""
  for (let [l,level] of data.levels.names.entries()) {
    if (level.substring(0,7)=="divider") {continue}
    let world = level.split(" ")[0]
    if (world != prevWorld) {
      prevWorld = world
      html += `</div></div>
      <div class="tab">
        <input type="radio" id="rd-${world}" name="rd">
        <label class="tab-label" for="rd-${world}">${world}</label>
        <div class="tab-content">`
    }

    let ep = worldCodes[world]
    
    ep += level.substring(level.indexOf(" ")+1)
      .replace(" Full", "").replace(" Secret", "s").replace(" Sandbird", "s")
      .replace("Hidden 1", "h").replace("Hidden 2", "h")
      .replace(" Reds", "r").replace(" Non- Hover", "*").replace(" Hover", "")
      .replace("6 (EYG)", "eyg").replace(" US/PAL", "").replace(" JP", "j")
      .replace(" RTA", "").replace(" Non-RTA", "*")
      .replace(" No Setup", "").replace(" No Hyper-Hover", "")
      .replace("Airstrip", "a").replace("Corona Mountain", "c").replace(" Bowser", "b")
      .replace("Box Game ", "box")
      .replace("Beach Pipe", "bp").replace("Beach Shine", "beach")
      .replace("Chuckster", "chuck").replace("Gold Bird", "gbird").replace("Grass Pipe", "grass")
      .replace("Jails", "jail").replace("Light- house", "light").replace("Lilypad", "lily")
      .replace("Pachinko", "pach").replace("Shine Gate", "sgate")
      .replace("Left Bell", "lbell").replace("Right Bell", "rbell").replace("Underbell", "ubell")
      .replace("a 100", "a100")

    html += `<button onclick="return loadLb(${l})">${ep}</button>`
  }
  html += "</div></div>"
  document.getElementById("nav").innerHTML = html

  // binds menu-button deselect routine; see https://stackoverflow.com/a/27476660/6149041
  $("input:radio").on("click", function (e) {
    let inp=$(this) // cache the selector
    if (inp.is(".theone")) { // if it has the "selected" class
      inp.prop("checked",false).removeClass("theone")
    } else {
      $(`input:radio[name='${inp.prop("name")}'].theone`).removeClass("theone")
      inp.addClass("theone")
    }
  })
}


function loadLbOverall() {
  let html = `<tr>
      <th style="width:50px">#</th>
      <th style="width:175px">player</th>
      <th style="width:75px">points</th>
      <th style="width:33px">🥇</th>
      <th style="width:34px">🥈</th>
      <th style="width:33px">🥉</th>
      <th style="width:50px">v</th>
      <th style="width:50px">n</th>
    </tr>`
  
  let prevPoints, rank
  for (let [i,row] of data.overall.entries()) {
    if (row[1] != prevPoints) { rank = i+1 }
    html += `<tr>
      <td style="font-weight: bold">${rank}</td>
      <td>${row[0]}</td>
      <td>${row[1]}</td>
      <td style="font-weight: bold; color: #e8b600">${row[2]}</td>
      <td style="font-weight: bold; color: #999999">${row[3]}</td>
      <td style="font-weight: bold; color: #b35c00">${row[4]}</td>
      <td style="font-style: italic">${row[5]}</td>
      <td style="font-weight: bold">${row[6]}</td>
    </tr>`
    prevPoints = row[1]
  }
  document.getElementById("lbh").innerHTML = "SMS IL Leaderboard"
  document.getElementById("lbt").innerHTML = html
}


function loadLb(l) {
  let rev = data.levels.reversed[l]
  let table = data.body[l].map((row,p) => [data.players.names[p]].concat(row)).filter(r => parseTime(r[1]))
  table.sort((r,s) => (rev ? -1 : 1) * (parseTime(r[1]) - parseTime(s[1]))) // [player, time, link, note]

  let html = `<tr>
      <th style="width:75px">#</th>
      <th style="width:225px">player</th>
      <th style="width:125px">time</th>
      <th style="width:75px">note</th>
    </tr>`
  let prevTime, rank
  for (let [i,row] of table.entries()) {
    if (row[1] != prevTime) { rank = i+1 }
    let time = row[2]? `<a href=${row[2]}>${row[1]}</a>` : `${row[1]}`
    let note = row[3]? `<div class="tooltip">📝<span class="tooltiptext">${row[3]}</span></div>` : ""
    html += `<tr>
      <td>${rank}</td>
      <td>${row[0]}</td>
      <td>${time}</td>
      <td>${note}</td>
    </tr>`
    prevTime = row[1]
  }
  document.getElementById("lbh").innerHTML = data.levels.names[l]
  document.getElementById("lbt").innerHTML = html
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


(async() => {
  await loadData() // blocking data load
  loadNav()
  loadLbOverall()
})()
