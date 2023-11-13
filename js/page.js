// 3. PAGE CLASS
// a Page is an abstraction of a tab, which is a type of leaderboard
// each persists its own state and has its own table generator and sorting methods 

class Page {
  constructor(params) {
    Object.assign(this, params)                     // set fields
    $(`.nav.${this.name}`).html(params.loadNav())   // load nav
  }
  // static state
  static active         // currently active page
  static scoring        // global scoring setting
  // custom fields/methods
  name                  // page name (used as class on nav elements)
  dataIndex             // index of data to display
  sortIndex             // column index for table sort
  sortMethods           // methods for sorting table: { sortIndex: sortLambda }
  table                 // method to generate table
  // standard methods
  loadTable(dataIndex_) {
    this.dataIndex = dataIndex_                     // update own state
    $(`select.${this.name}`).val(dataIndex_)        // sync selector if it has one
    $(".nav").css("display", "none")                // hide all nav, then
    $(`.${this.name}`).css("display", "block")      // show relevant nav
    $("#lb").html(this.table())                     // load table
    Page.orientTooltips()
  }
  sortTable(sortIndex_) {
    this.sortIndex = sortIndex_                     // update own state
    $("#lb").html(this.table())                     // load table
    Page.orientTooltips()
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
var pageAggregate, pageLevel, pagePlayer
function loadPages() {
  pageAggregate = new Page({
    name: "aggregate",
    dataIndex: "Total",
    sortIndex: 2, // default to points sort
    sortMethods: {
      2: (a,b) => {
        switch (Page.scoring) {
          case "p":  case "ppct": return b.score - a.score;
          case "l1": case "linf": return a.score - b.score;
        }
      }, // points sort
      3: (a,b) => { // medal sort
        for (let i of [0,1,2]) {if (a.medals[i] != b.medals[i]) {return b.medals[i] - a.medals[i]}}
        return 0
      },
    },
    loadNav: navAggregate,
    table: tableAggregate,
  })
  pageLevel = new Page({
    name: "level",
    dataIndex: Object.keys(hashes.l)[Math.floor(Math.random()*Object.keys(hashes.l).length)], // random valid level
    sortIndex: 0, // default to rank sort (the only sort)
    sortMethods: {
      0: (x,y) => {return x.rank - y.rank}, // rank sort
    },
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
    loadNav: navPlayer,
    table: tablePlayer,
  })
  // sync scoring state with radio buttons
  Page.scoring = $('input[name="radioScoring"]:checked').val() ?? "p" // get value from settings
  $("#radioScoring-"+Page.scoring).prop("checked", true)              // set value in settings
}
