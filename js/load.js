// 2. APP LOADING

// binds deselect routine to navLevel radio button set
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

// binds caching of scoll state to #lb
function bindScrollState() {
  $("#lb").on("scrollend", function (e) {Page.active.scroll = $(this).scrollTop()})
}

// script that runs on webpage load
(async() => {
  toggleTheme(localStorage.getItem("theme") ?? "Dark")  // has to be run eagerly to style load screen
  // load data
  await loadData()        // blocking data load
  annotateData()          // convert data into useful (and final) form
  console.log("data:", data)
  // load frontend
  $("#helpHTML").html(data.levels.helpHTML)
  $("#anonHTML").html(data.players.anonHTML)
  if (!data.players.anonHTML) { $("#anonButton").css("display", "none") }
  $("#loadStatus").css("display", "none")               // represents data load completed
  $("#menuPages, #menuToggles").css("display", "flex")  // represents data load completed
  // load backend
  loadPages()                                           // Pages represent main tabs
  loadSettings()                                        // applies settings (mostly persisted)
  bindRadioDeselection()                                // binds a UI control
  bindScrollState()                                     // binds a UI control
  // document.addEventListener('touchmove', event => event.scale !== 1 && event.preventDefault(), { passive: false }) // to disable zooming
  window.addEventListener("hashchange", onHashChange)   // binds navigation method
  // start app
  onHashChange()                                        // runs navigation from initial URL
})()
