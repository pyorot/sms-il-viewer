// 1. DATA LOADING

var data      // data from the API is loaded, processed and stored here
// dataUrl is defined in the html files

// fetches data from API
async function fetchData() {
  console.log(`data address: ${dataUrl}`)
  try {
    let res = await fetch(dataUrl)
    data = await res.json()
  } catch(error) {
    $("#loadStatus").html("❌ | data fetch failed | see console"); throw(error)
  }
}

// mutates data into useful form
function parseData() {
  try {
    for (let field of ["levels", "players", "body"]) {if (!data[field]) {throw `data missing ${field} field`}}
    // in a future major version, change "level.body" to "level.runs"
    data.players.names = data.players.names.map(sanitise)
    // process levels
    data.levels.entries = [] // add entry counts
    data.levels.cutoffIndices = [] // and cutoffs in row index form
    for (let l = 0; l < data.body.length; l++) {
      data.body[l] = data.body[l].map((run, p) => {
        run = run.map(sanitise)
        return {
          p: p, l: l, value: run[0]??"", link: run[1]??"", note: run[2]??"",          // { playerID, levelID, value, link, note,
          time: parseTime(run[0]??""), points: null, rank: null, pQ: null, rQ: null,  //   time, points, rank, ptsQuality, rkQuality }
        }
      })
      let series = data.body[l]
        .filter(x => x.time)
        .sort((x,y) => (data.levels.reversed[l] ? -1 : 1) * (x.time - y.time))
      // recall the standard rank algorithm: given a sorted list,
      // its index+1 is its rank unless its tied (repeated value), whence the rank persists
      { // ranks
        let prevTime, rank
        for (let [i, x] of series.entries()) {
          if (x.time != prevTime) { rank = i+1 } // set rank to index+1 if changed, else persist it
          x.rank = rank
          x.rQ = 1 - (rank-1)/series.length
          prevTime = x.time
        }
      }
      { // points
        let prevTime, points
        for (let [i, x] of series.slice().reverse().entries()) { // slice just makes a copy
          if (x.time != prevTime) { points = i+1 }
          x.points = points
          x.pQ = points/series.length
          prevTime = x.time
        }
      }
      // entry counts
      data.levels.entries[l] = series.length
      // video cutoffs
      if (!!data.levels.cutoffs) {    // current ≥v2.2 data format (api cutoff (times) → internal cutoff indices)
        data.levels.cutoffIndices[l] = series.map(x => x.time).lastIndexOf(data.levels.cutoffs[l])
      } else {                        // legacy <v2.2 data format (api cutoffLimits → internal cutoff indices)
        let rqCount = series.filter(x => x.rQ   >= data.levels.cutoffLimits?.rq).length
        let rCount  = series.filter(x => x.rank <= data.levels.cutoffLimits?.r ).length
        data.levels.cutoffIndices[l] = Math.max(rqCount, rCount) - 1  // cutoff index (out-of-range means no cutoff)        
      }
    }
    // pre-compute mapping of aggregates to level indices (can better handle not-found errors on load)
    data.levels.aggregateIndices = Object.fromEntries(Object.entries(data.levels.aggregates).map(([k, v]) => [k, levelListToIDs(v)]))
  } catch(error) {
    $("#loadStatus").html("❌ | data parse failed | see console"); throw(error)
  }
}

// utility to convert list of level codes into list of IDs (linear time)
function levelListToIDs(list) {
  let full  = data.levels.codes
  let [i,j] = [0,0]
  let output = []
  while (i < list.length) { // zip algorithm (linear time)
    while (list[i] != full[j]) {
      j++
      if (j >= full.length) { throw `invalid level code: ${list[i]}` }
    }
    output.push(j)
    i++
  }
  return output
}

// converts time string into float (in seconds); returns undefined if invalid time
const timeRegex = /^(?!0)(?:(?:(\d?\d)\:(?=\d\d))?([0-5]?\d)\:(?=\d\d))?([0-5]?\d)(\.\d\d\d?)$/ // 2dp/3dp required
function parseTime(input) {
  let match = input.match(timeRegex)?.map(x => x ?? 0) // returns null or [fullMatch, hrs, mins, secs, centi/millisecs]
  if (match) { return parseInt(match[1])*60*60 + parseInt(match[2])*60 + parseInt(match[3]) + parseFloat(match[4]) }
}
// == regex explanation ==
/*
(?!0)				   // no leading zero
(?:            // optional minutes+hours block
	(?:          // optional hours block
		(\d?\d)		 // hours digits
		\:(?=\d\d) // : (only if two digits follow)
	)?
	([0-5]?\d)	 // mins digits
	\:(?=\d\d)	 // : (only if two digits follow)
)?
([0-5]?\d)		 // secs digits
(\.\d\d\d?)	   // . followed by centisecs or millisecs digits
*/

// sanitises input text in data to prevent injection attacks; forces input string-type requirement
const HTMLEscape = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"}
function sanitise(text) { return text.trim().replace(/[&<>'"]/g, match => HTMLEscape[match]) }
