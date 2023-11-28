// 2. INTERFACE LOADING

// hashes are strings that follow "#" in the URL to identify unique leaderboards for navigation
// this is a bidirectional index, split across the three pages (from the main menu)
var indices = {"a": {}, "l": {}, "p": {}} // url hashes → state indices
var hashes  = {"a": {}, "l": {}, "p": {}} // state indices → url hashes

// compiles the above index
function generateHashes() {
  let enc = text => text.toLowerCase().replace(/\s/g ,'_').replace(/[^\w\.\*]/g ,'')
  for (let [p_, player] of data.players.names.entries()) {
    hashes.p[p_] = enc(player);    indices.p[enc(player)] = p_
  }
  for (let [l_, level] of data.levels.codes.entries()) {
    if (level == "") { continue } // skips dividers
    hashes.l[l_] = enc(level);     indices.l[enc(level)] = l_
  }
  for (let s_ of Object.keys(data.levels.aggregates)) {
    hashes.a[s_] = enc(s_);        indices.a[enc(s_)] = s_
  }
}

// utility to generate JS commands that navigate to a given leaderboard
// all navigation between leaderboards is done by running this command
// which sets the URL hash, which the below function handles
function go(endpoint, index) { return `location.hash=hashes.${endpoint}[${index}]`}

// event handler bound to URL hash change; runs loadTable method of relevant page
function onHashChange() {
  let target = location.hash.substring(1).toLowerCase()
  console.log("target hash:", target)
  document.title = "SMS IL Tracker Viewer | " + target
  if      (target in indices.l) { Page.active = pageLevel     }
  else if (target in indices.p) { Page.active = pagePlayer    }
  else if (target in indices.a) { Page.active = pageAggregate }
  else    { location.hash = "total"; return } // else, retrigger this function with default hash
  // load page
  Page.active.loadTable(indices[Page.active.name[0]][target]) // load table
  $("#radioPages-"+Page.active.name[0]).prop("checked", true) // set active page in navigation bar
}

// binds deselect routine to rd radio button set
// see https://stackoverflow.com/a/27476660/6149041
function bindRadioDeselection() {
  $("input:radio[name='rd']").on("click", function (e) {
    let inp = $(this) // cache the selector
    if (inp.is(".theone")) { // if it has the "selected" class
      inp.prop("checked",false).removeClass("theone") // deselect it
    } else { // else deselect all others from its set and select it
      $(`input:radio[name='${inp.prop("name")}'].theone`).removeClass("theone")
      inp.addClass("theone")
    }
  })
}

// loads the top menu
function loadMenu() {
  // bind menu buttons
  $("#radioPages-a + label").attr("onclick", go('a', 'pageAggregate.dataIndex'))
  $("#radioPages-l + label").attr("onclick", go('l',     'pageLevel.dataIndex'))
  $("#radioPages-p + label").attr("onclick", go('p',    'pagePlayer.dataIndex'))
  // load menu bar
  $("#loadStatus"  ).css("display", "none")
  $("#menuPages"   ).css("display", "flex")
  $("#menuToggles" ).css("display", "flex")
}

// script that runs on webpage load
(async() => {
  // load data
  await loadData()        // blocking data load
  annotateData()          // convert data into useful (and final) form
  generateHashes()        // hashes are used for navigation via URL changing
  console.log(data)

  // load website
  $("#helpHTML").html(data.levels.helpHTML)
  $("#anonHTML").html(data.players.anonHTML)
  if (!data.players.anonHTML) { $("#anonButton").css("display", "none") }
  loadMenu()
  loadPages()             // creates Page objects (representing tabs in main menu)
  loadSettings()
  bindRadioDeselection()                              // binds a UI control
  // document.addEventListener('touchmove', event => event.scale !== 1 && event.preventDefault(), { passive: false }) // to disable zooming
  window.addEventListener("hashchange", onHashChange) // binds navigation method
  onHashChange()                                      // runs navigation from initial URL
})()
