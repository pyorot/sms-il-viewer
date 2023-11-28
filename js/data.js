// 1. DATA LOADING

var data      // data from the API is loaded, processed and stored here
var dataUrl = "https://script.google.com/macros/s/AKfycbz3ihGMcxM65F3tfhXq38V_tkVdiLLJ9aIUl2sYSWiKQVALD1QTaHOPBsIQQQukrjE8ow/exec"
// dataUrl = "../data.json" // enable this for debugging

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
  data.levels.cutoffs = [] // add video cutoffs (this will be the row index rather than the actual time)
  for (let l = 0; l < data.body.length; l++) {
    data.body[l] = data.body[l].map((entry, p) => { return {
      p: p, l: l,                                                             // { playerID, levelID,
      value: entry[0], link: entry[1], note: entry[2],                        //   value, link, note,
      time: parseTime(entry[0]), points: null, rank: null, rankQuality: null, //   time, points, rank, rankQuality }
    }})
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
    // entry counts + cutoffs
    data.levels.entries[l] = series.length
    let rqCount = series.filter(x => x.rankQuality >= 0.85).length  // number of times with ≥0.85 rankQuality
    data.levels.cutoffs[l] = Math.max(rqCount, 3) - 1               // cutoff index (out-of-range means no cutoff)
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
