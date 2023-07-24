// 1. DATA LOADING

var data              // data from the API is loaded, processed and stored here
var aggregates = {}   // groups of levels for the overall (aggregate) leaderboards

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
  data.levels.entries = [] // add entry count array to levels
  for (let l_ = 0; l_ < data.body.length; l_++) {
    data.body[l_] = data.body[l_].map((entry, p_) => { return {
      p: p_, l: l_, time: entry[0], link: entry[1], note: entry[2], points: null, rank: null
    }}) // {playerID, levelID, time, link, note, points, rank}
    let sortedData = data.body[l_]
      .filter(x => parseTime(x.time))
      .sort((x,y) => (data.levels.reversed[l_] ? -1 : 1) * (parseTime(x.time) - parseTime(y.time)))
    // recall the standard rank algorithm: given a sorted list,
    // its index+1 is its rank unless its tied (repeated value), whence the rank persists
    { // ranks
      let prevTime, rank
      for (let [i, x] of sortedData.entries()) {
        if (x.time != prevTime) { rank = i+1 } // set rank to index+1 if changed, else persist it
        x.rank = rank
        prevTime = x.time
      }
    }
    { // points
      let prevTime, points
      for (let [i, x] of sortedData.reverse().entries()) {
        if (x.time != prevTime) { points = i+1 }
        x.points = points
        prevTime = x.time
      }
    }
    data.levels.entries[l_] = sortedData.length
  }
}

// aggregates are specified here
function generateAggregates() {
  let c = data.levels.codes
  aggregates["Total"]    = c
  aggregates["Movement"] = `b3 b3s b4 b6 b6s r1 r2 r3 r4 r4s r5 g1s p2 p2s p3 p6s `
                         + `s2 s2s s3 s4 s4s n1 n2 n6 n6s q3 q4 q6 c`
  aggregates["Any%"]     = `b2 b3 b3s b4 b5 b6 b6s b7 r1 r2 r3 r4 r4s r5 r6 r7 g7 g8 `
                         + `p1 p2 p2s p3 p4 p6s peyg peygj p7 s1 s2 s2s s3 s4 s4s s5 s6 s6j s7 `
                         + `n1 n2 n3 n4 n6 n6s n7 q1 q3 q4 q5 q5s q6 q7 a c cb`
  aggregates["NotAny%"]  = `b1 b8 b3r* b3r b6r* b6r b100 r6* r8 r4r* r4r r100 `
                         + `g1 g1s g2 g3 g4 g4s g5 g6 gh g1r* g1r g100 p5 p6 p8 p2r p6r p100 `
                         + `s8 s2r s4r s100 n5 n8 nh n6r* n6r n100 q2 q8 q5r qh q100 ar* ar a100 `
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
  aggregates["SecretReds"] = c.filter(code => code[2] == "r")
  aggregates["100s"]       = c.filter(code => code.slice(1) == "100")
}

// utility to convert list of level codes into list of IDs (linear time)
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

// validates and converts time strings into floats (in seconds)
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
