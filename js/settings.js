// 4. SETTINGS SET ROUTINES

// runs on webpage load
function loadSettings() {
  toggleHelp    ($('#check-help')    .is(':checked'))
  toggleSettings($('#check-settings').is(':checked'))
  // toggleTheme is called explicitly before data load
  setScoring    (localStorage.getItem("scoring") ?? $('meta[name=default-sort]').attr("content"))
  setAnon       (JSON.parse(localStorage.getItem("anon") ?? "true")) // localStorage is always string 
}

// toggles the help panel (full height) (bound to click toggle)
function toggleHelp(override) {
  let newState = override ?? ($("#panelbottomoverlay").css("max-height") == "0%") // swap setting if not overridden
  console.log("setting help panel:", newState)
  $("#panelbottom")       .css("max-height", newState ? "0%" : "none")
  $("#panelbottomoverlay").css("max-height", newState ? "none" : "0%")
}

// toggles the settings panel (fixed height) (bound to click toggle)
function toggleSettings(override) {
  let newState = override ?? ($("#settings").css("max-height") == "0%") // swap setting if not overridden
  console.log("setting settings panel:", newState)
  $("#settings").css("max-height", newState ? "none" : "0%")
}

// toggles the colour scheme between light and dark
function toggleTheme(override) {
  let ss = document.documentElement.style                             // style setter
  let sg = getComputedStyle(document.documentElement)                 // style getter
  let oldTheme = sg.getPropertyValue("--colBody1") == sg.getPropertyValue("--colBody1Dark") ? "Dark" : "Light"
  let newTheme = override ?? (oldTheme == "Dark" ? "Light" : "Dark")  // swap setting if not overridden
  console.log("setting theme:", newTheme)
  let props = ["Body1", "Body2", "Body3", "Body4", "Text", "Link", "LinkVisited", "Highlight",
               "Head1", "Head1Active", "Head2", "Head2Active", "Head3"]
  for (let prop of props) { ss.setProperty("--col"+prop, sg.getPropertyValue("--col"+prop+newTheme)) }  // sets css variables
  $('meta[name=theme-color]').attr("content", sg.getPropertyValue("--colHead1"+newTheme))               // colours iOS Safari screen top
  $('#themeButton').html(newTheme == "Dark" ? "☀️" : "🌙")
  localStorage.setItem("theme", newTheme)
}

// updates scoring setting and triggers table refresh if needed
function setScoring(scoring) {
  console.log("setting scoring:", scoring)
  Page.scoring = scoring
  Page.active?.refreshTable()
  $("#radioScoring-"+Page.scoring).prop("checked", true) // set value in settings bar
  localStorage.setItem("scoring", scoring)
}

// toggles anon prompt state
function toggleAnon(override) {
  if ($('#anonButton').html() == "A.") { // this button text means anon is false
    $('#blockAnonPrompt').css("display", "none")
    setAnon(true)
  } else {
    switch (override) {
      case true:  // abort de-anon
        return $('#blockAnonPrompt').css("display", "none")
      case false: // confirm de-anon
        setAnon(false)
        return $('#blockAnonPrompt').css("display", "none")
      default:    // click settings-bar anon button again
        let prompt = $('#blockAnonPrompt').css("display") == "block"
        return $('#blockAnonPrompt').css("display", prompt ? "none": "block")
    }
  }
}

// toggles anon state
function setAnon(anon) {
  console.log("setting anon:", anon)
  let translation = {} // name change: {from: to}
  for (let [initial, name] of Object.entries(data.players.anon)) {
    translation[anon ? name : initial] = anon ? initial : name
  }
  for (let [p,player] of data.players.names.entries()) {                        // swap names per anon dict
    if (player in translation) { data.players.names[p] = translation[player] }  // in table data
    $(`option[value=${p}]`).html(translation[player])                           // in player dropdown
  }
  Page.active?.refreshTable()
  $('#anonButton').html(anon ? "anon" : "A.")
  localStorage.setItem("anon", anon)
}
