// 1. DATA LOADING

var data      // data from the API is loaded, processed and stored here
// dataUrl is defined in the html files

// fetches data from API
async function loadData() {
  try {
    let res = await fetch(dataUrl)
    data = await res.json()
    console.log("data loaded")
  } catch (error) {
    $("#loadStatus").html("data load failed; see console")
    console.error(error)
  }
}

// mutates data into useful form
function annotateData() {
  data.levels.entries = [] // add entry counts
  let cutoffsIncluded = !!data.levels.cutoffs       // api cutoffs will be converted in-place to rank (index) form
  if (!cutoffsIncluded) {data.levels.cutoffs = []}  // unless they don't exist, whence they'll be calced from api cutoffLimits
  data.players.names = data.players.names.map(sanitise)
  for (let l = 0; l < data.body.length; l++) {
    data.body[l] = data.body[l].map((entry, p) => {
      let clean = entry.map(sanitise)
      return {
        p: p, l: l, value: clean[0], link: clean[1], note: clean[2],            // { playerID, levelID, value, link, note,
        time: parseTime(clean[0]), points: null, rank: null, rankQuality: null, //   time, points, rank, rankQuality }
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
        x.rankQuality = 1 - (x.rank-1)/series.length
        prevTime = x.time
      }
    }
    { // points
      let prevTime, points
      for (let [i, x] of series.slice().reverse().entries()) { // slice just makes a copy
        if (x.time != prevTime) { points = i+1 }
        x.points = points
        prevTime = x.time
      }
    }
    // entry counts
    data.levels.entries[l] = series.length
    // video cutoffs
    if (cutoffsIncluded) {   // current ≥v2.2 data format (api cutoff (times) → internal cutoff (indices))
      data.levels.cutoffs[l] = series.map(x => x.time).lastIndexOf(data.levels.cutoffs[l])
    } else {                 // legacy <v2.2 data format (api cutoffLimits → internal cutoff indices)
      let rqCount = series.filter(x => x.rankQuality >= data.levels.cutoffLimits?.rq).length
      let rCount  = series.filter(x => x.rank        <= data.levels.cutoffLimits?.r ).length
      data.levels.cutoffs[l] = Math.max(rqCount, rCount) - 1  // cutoff index (out-of-range means no cutoff)        
    }
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

// validates and converts time strings into floats (in seconds)
const timeRegex = /^(?!0)(?:(?:(\d?\d)\:(?=\d\d))?([0-5]?\d)\:(?=\d\d))?([0-5]?\d)(?:\.(\d\d?|xx))?$/
function parseTime(input) {
  // run regex, validate and convert values
  let matches = input.match(timeRegex) // returns null or [fullMatch, hrs, mins, secs, centisecs]
  if      (!matches)               {return null}
  else if (!matches[4])            {return null}
  else if (matches[4] == 'xx')     {return null}
  else if (matches[4].length == 1) {return null}
  // return result in seconds
  for (let i=1; i<matches.length; i++) { matches[i] = matches[i] ? parseInt(matches[i]) : 0 }
  return parseInt(matches[1]*60*60 + matches[2]*60 + matches[3]) + matches[4]/100
}

// sanitises input text in data to prevent injection attacks
const HTMLEscape = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"}
function sanitise(text) { return text.trim().replace(/[&<>'"]/g, match => HTMLEscape[match]) }
