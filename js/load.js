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
  // bind menu buttons
  $("#radioPages-a + label").attr("onclick", go('a', 'pageAggregate.dataIndex'))
  $("#radioPages-l + label").attr("onclick", go('l', 'pageLevel.dataIndex'    ))
  $("#radioPages-p + label").attr("onclick", go('p', 'pagePlayer.dataIndex'   ))
  // load menu bar
  $("#loadStatus"  ).css("display", "none")
  $("#menuPages"   ).css("display", "flex")
  $("#menuToggles" ).css("display", "flex")
  // set panel visibility based on states of toggle controls
  let helpActive = $('#check-help').is(':checked')
  $("#panelbottom").css("max-height", helpActive ? "0%" : "none")
  $("#panelbottomoverlay").css("max-height", helpActive ? "none" : "0%")
  let settingsActive = $('#check-settings').is(':checked')
  $("#settings").css("max-height", settingsActive ? "none" : "0%")
}

// toggles the help panel (full height) (bound to click toggle)
function toggleHelp() {
  let active = $("#panelbottomoverlay").css("max-height") == "none"
  $("#panelbottom")       .css("max-height", active ? "none" : "0%")
  $("#panelbottomoverlay").css("max-height", active ? "0%" : "none")
}

// toggles the settings panel (fixed height) (bound to click toggle)
function toggleSettings() {
  let active = $("#settings").css("max-height") == "none"
  $("#settings").css("max-height", active ? "0%" : "none")
}

// toggles the colour scheme between light and dark
function toggleColours() {
  let ss = document.documentElement.style               // style setter
  let sg = getComputedStyle(document.documentElement)   // style getter
  let oldTheme = sg.getPropertyValue("--colBody1") == sg.getPropertyValue("--colBody1Dark") ? "Dark" : "Light"
  let newTheme = oldTheme == "Dark" ? "Light" : "Dark"  // swap theme
  let props = ["Body1", "Body2", "Body2Active", "Text", "Link", "LinkVisited", "Highlight",
    "Head1", "Head1Active", "Head2", "Head2Active", "Head3", "Head3Active"]
  for (let prop of props) { ss.setProperty("--col"+prop, sg.getPropertyValue("--col"+prop+newTheme)) }
}

// utility to generate JS commands that navigate to a given leaderboard
// all navigation between leaderboards is done by running this command
// which sets the URL hash, which the below function handles
function go(endpoint, index) { return `location.hash=hashes.${endpoint}[${index}]`}

// updates scoring setting and triggers table refresh if needed
function setScoring(scoring) {
  Page.scoring = scoring
  if (Page.active == "a") { $("#lb").html(pageAggregate.table()) } // refresh current table
}

// event handler bound to URL hash change; runs loadTable method of relevant page
function loadBodyfromHash() {
  let target = location.hash.substring(1).toLowerCase()
  document.title = "SMS IL Tracker Viewer"
  if (!target) { return pageAggregate.loadTable("Total") }
  document.title += " | " + target
  if (target in indices.l) { Page.active = "l"; return pageLevel.loadTable(indices.l[target]) }
  if (target in indices.p) { Page.active = "p"; return pagePlayer.loadTable(indices.p[target]) }
  if (target in indices.a) { Page.active = "a"; return pageAggregate.loadTable(indices.a[target]) }
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
  loadMenu()
  loadPages()             // creates Page objects (representing tabs in main menu)
  bindRadioDeselection()  // binds a UI control
  loadBodyfromHash()      // runs initial navigation (from initial URL)
  window.addEventListener("hashchange", loadBodyfromHash) // binds navigation method
})()
