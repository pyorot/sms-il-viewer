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
  hashes.l = data.levels.codes
  for (let [l_, level] of data.levels.codes.entries()) {
    hashes.l[l_] = enc(level);     indices.l[enc(level)] = l_
  }
  for (let s_ of Object.keys(aggregates)) {
    hashes.a[s_] = enc(s_);        indices.a[enc(s_)] = s_
  }
}

// binds deselect routine to all radio button sets
// see https://stackoverflow.com/a/27476660/6149041
function bindRadioDeselection() {
  $("input:radio").on("click", function (e) {
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
  $("#menu").html(`
    <div class="help" onclick="toggleHelp()">SMS ILs</div>
    <input type="radio" id="rMenu-aggregate" name="rMenu">
    <label for="rMenu-aggregate" onclick="${go("a", "pageAggregate.dataIndex")}">Overall</label>
    <input type="radio" id="rMenu-level" name="rMenu">
    <label for="rMenu-level" onclick="${go("l", "pageLevel.dataIndex")}">Levels</label>
    <input type="radio" id="rMenu-player" name="rMenu">
    <label for="rMenu-player" onclick="${go("p", "pagePlayer.dataIndex")}">Players</label>
  `)
  $("#panelbottomoverlay").click(toggleHelp)
}

// toggles the help panel (bound to some click controls)
function toggleHelp() {
  let helpActive = $("#panelbottom").css("max-height") == "0%"
  $("#panelbottom")       .css("max-height", helpActive ? "none" : "0%")
  $("#panelbottomoverlay").css("max-height", helpActive ? "0%" : "none")
}


// utility to generate JS commands that navigate to a given leaderboard
// all navigation between leaderboards is done by running this command
// which sets the URL hash, which the below function handles
function go(endpoint, index) { return `location.hash=hashes.${endpoint}[${index}]`}

// event handler bound to URL hash change; runs loadTable method of relevant page
function loadBodyfromHash() {
  let target = location.hash.substring(1).toLowerCase()
  document.title = "SMS IL Tracker Viewer"
  if (!target) { return pageAggregate.loadTable("Total") }
  document.title += " | " + target
  if (target in indices.l) { return pageLevel.loadTable(indices.l[target]) }
  if (target in indices.p) { return pagePlayer.loadTable(indices.p[target]) }
  if (target in indices.a) { return pageAggregate.loadTable(indices.a[target]) }
  return pageAggregate.loadTable("Total")
}

// script that runs on webpage load
(async() => {
  // load data
  await loadData()        // blocking data load
  annotateData()          // convert data into useful (and final) form
  generateAggregates()    // aggregates are used to filter the overall leaderboards
  generateHashes()        // hashes are used for navigation via URL changing
  console.log(data)

  // load website
  loadPages()             // creates Page objects (representing tabs in main menu)
  loadMenu()
  bindRadioDeselection()  // binds a UI control
  loadBodyfromHash()      // runs initial navigation (from initial URL)
  window.addEventListener("hashchange", loadBodyfromHash) // binds navigation method
})()
