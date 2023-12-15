// 5. PAGE CLASS
// a Page is an abstraction of a tab, which is a type of leaderboard
// each persists its own state and has its own table generator and sorting methods 

class Page {
  constructor(params) {
    Object.assign(this, params)                   // set fields
    this.loadHashes()
    $(`.nav.${this.name}`).html(this.loadNav())   // load nav
  }
  // static state
  static active         // currently active page object
  static scoring        // global scoring setting
  // custom fields/methods
  name                  // page name (used as class on nav elements)
  hashes = {}           // navigation: indices → hashes
  indices = {}          // navigation: hashes → indices
  dataIndex             // index of data to display
  sortIndex             // column index for table sort
  sortMethods           // methods for sorting table: { sortIndex: sortLambda }
  table                 // method to generate table
  // standard methods
  refreshTable() {
    $("#lb").html(this.table())                     // generate and paste table
    Page.orientTooltips()                           // sort out OoB tooltips
  }
  loadTable(dataIndex_) {
    this.dataIndex = dataIndex_                     // update own state
    $(`select.${this.name}`).val(dataIndex_)        // sync selector if it has one
    $(`.page`).css("display", "none")               // hide all page elements, then
    $(`.${this.name}`).css("display", "block")      // show relevant nav
    this.refreshTable()
  }
  sortTable(sortIndex_) {
    this.sortIndex = sortIndex_                     // update own state
    this.refreshTable()
  }
  // since this basic css feature (anchor positioning) is apparently still missing
  // in 2023, we need to run this routine after every table load to flip the tooltips
  // that would overflow off the top of the table so that they render below their icon
  static orientTooltips() {
    let yBase = $("table")[0].getBoundingClientRect().y // absolute y-coord of table
    for (let tooltipbox of $(".tooltipbox")) {
      let y = tooltipbox.getBoundingClientRect().y // absolute y-coord of tooltip top
      if (y < yBase) { tooltipbox.classList.add("flip") }
    }
  }
}

// objects: the 3 Pages and their initial states
// the loadNav and table methods are specified on nav.js and table.js respectively
var pages, pageAggregate, pageLevel, pagePlayer   // global variables
function loadPages() {
  pageAggregate = new Page({
    name: "aggregate",
    dataIndex: "Total",
    sortIndex: 2, // default to points sort
    sortMethods: {
      1: (a,b) => { // alphabetical sort
        return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
      },
      2: (a,b) => { // points sort
        switch (Page.scoring) {
          case "p":  case "ppct": return b.score - a.score;
          case "l1": case "linf": return a.score - b.score;
        }
      },
      3: (a,b) => { // medal sort
        for (let i of [0,1,2]) {if (a.medals[i] != b.medals[i]) {return b.medals[i] - a.medals[i]}}
        return 0
      },
      6: (a,b) => { // video sort
        if (a.v[0] != b.v[0]) {return b.v[0] - a.v[0]} // unique level entries, then
        if (a.v[1] != b.v[1]) {return b.v[1] - a.v[1]} // isotope entries, then
        if (a.n[0] != b.n[0]) {return b.n[0] - a.n[0]} // unique level videos, then
        return b.n[1] - a.n[1]                         // isotope videos
      },
      7: (a,b) => { // entry sort
        if (a.n[0] != b.n[0]) {return b.n[0] - a.n[0]} // as above but with entries ↔ videos
        if (a.n[1] != b.n[1]) {return b.n[1] - a.n[1]}
        if (a.v[0] != b.v[0]) {return b.v[0] - a.v[0]}
        return b.v[1] - a.v[1]
      },
    },
    loadHashes: hashAggregate,
    loadNav: navAggregate,
    table: tableAggregate,
  })
  pageLevel = new Page({
    name: "level",
    dataIndex: random(data.levels.codes.map((v,i)=>[i,v]).filter(x=>x[1]!="").map(x=>x[0])), // random valid level
    sortIndex: 0, // default to rank sort (the only sort)
    sortMethods: {
      0: (x,y) => {return x.rank - y.rank}, // rank sort
    },
    loadHashes: hashLevel,
    loadNav: navLevel,
    table: tableLevel,
  })
  pagePlayer = new Page({
    name: "player",
    dataIndex: Math.floor(Math.random()*4), // random top-4 player
    sortIndex: 0, // default to level sort
    sortMethods: {
      0: (x,y) => {return x.l      - y.l     }, // level sort
      1: (x,y) => {return x.rank   - y.rank  }, // rank sort
      2: (x,y) => {return y.points - x.points}, // points sort
    },
    loadHashes: hashPlayer,
    loadNav: navPlayer,
    table: tablePlayer,
  })
  pages = {'a': pageAggregate, 'l': pageLevel, 'p': pagePlayer}
}

function random(array) { return array[Math.floor(Math.random()*array.length)] }
