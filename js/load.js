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
  for (let s_ of Object.keys(aggregates)) {
    hashes.a[s_] = enc(s_);        indices.a[enc(s_)] = s_
  }
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
  // set panel visibility based on states of toggle controls
  toggleHelp    ($('#check-help')    .is(':checked'))
  toggleSettings($('#check-settings').is(':checked'))
}

// toggles the help panel (full height) (bound to click toggle)
function toggleHelp(override) {
  let newState = override ?? ($("#panelbottomoverlay").css("max-height") == "0%") // swap setting if not overridden
  $("#panelbottom")       .css("max-height", newState ? "0%" : "none")
  $("#panelbottomoverlay").css("max-height", newState ? "none" : "0%")
}

// toggles the settings panel (fixed height) (bound to click toggle)
function toggleSettings(override) {
  let newState = override ?? ($("#settings").css("max-height") == "0%") // swap setting if not overridden
  $("#settings").css("max-height", newState ? "none" : "0%")
}

// toggles the colour scheme between light and dark
function toggleTheme(override) {
  let ss = document.documentElement.style                             // style setter
  let sg = getComputedStyle(document.documentElement)                 // style getter
  let oldTheme = sg.getPropertyValue("--colBody1") == sg.getPropertyValue("--colBody1Dark") ? "Dark" : "Light"
  let newTheme = override ?? (oldTheme == "Dark" ? "Light" : "Dark")  // swap setting if not overridden
  let props = ["Body1", "Body2", "Body2Active", "Text", "Link", "LinkVisited", "Highlight",
    "Head1", "Head1Active", "Head2", "Head2Active", "Head3"]
  for (let prop of props) { ss.setProperty("--col"+prop, sg.getPropertyValue("--col"+prop+newTheme)) }
  $('meta[name=theme-color]').attr("content", newTheme == "Dark" ? sg.getPropertyValue("--colHead1Dark") : sg.getPropertyValue("--colHead1Light")) // colours top of screen on iPhone
  localStorage.setItem("theme", newTheme)
}

// updates scoring setting and triggers table refresh if needed
function toggleScoring(scoring) {
  Page.scoring = scoring
  if (Page.active == "a") { $("#lb").html(pageAggregate.table()) } // refresh table
  // sync scoring state with radio buttons and persisted state
  $("#radioScoring-"+Page.scoring).prop("checked", true) // set value in settings bar
  localStorage.setItem("scoring", scoring)
}

// utility to generate JS commands that navigate to a given leaderboard
// all navigation between leaderboards is done by running this command
// which sets the URL hash, which the below function handles
function go(endpoint, index) { return `location.hash=hashes.${endpoint}[${index}]`}

// event handler bound to URL hash change; runs loadTable method of relevant page
function loadBodyfromHash() {
  let target = location.hash.substring(1).toLowerCase()
  console.log("target hash:", target)
  document.title = "SMS IL Tracker Viewer | " + target
  if      (target in indices.l) { Page.active = "l";     pageLevel.loadTable(indices.l[target]) }
  else if (target in indices.p) { Page.active = "p";    pagePlayer.loadTable(indices.p[target]) }
  else if (target in indices.a) { Page.active = "a"; pageAggregate.loadTable(indices.a[target]) }
  else { location.hash = "total"; return } // else, retrigger this function with default hash
  // sync active-page state with radio buttons
  $("#radioPages-"+Page.active).prop("checked", true) // set value in navigation bar
}

// script that runs on webpage load
(async() => {
  // load persistent theme
  toggleTheme(localStorage.getItem("theme") ?? "Dark")

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
  toggleScoring(localStorage.getItem("scoring") ?? "p")   // loads other persistent settings
  // document.addEventListener('touchmove', event => event.scale !== 1 && event.preventDefault(), { passive: false }) // to disable zooming
})()
