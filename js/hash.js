// 3. HASH NAVIGATION SYSTEM
// hashes are strings that follow "#" in the URL to identify unique leaderboards for navigation
// bidirectional hash indices are stored in Page hashes + indices fields

// encodes hashes from strings in data to url-compatible strings
function encodeHash(text) {
  return decodeURIComponent(text.replace(/%(?![0-9a-fA-F]{2})/g,"%25"))   // parses url-encoded chars
             .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")           // strips diacritics
             .toLowerCase().replace(/\s/g ,'_')                           // space → _
             .replace(/[^\w\-\+\*\.~!]/g ,'-')                            // rejected chars → - 
}

// custom Page methods, run in constructor; generate hash index from data
function hashAggregate() {
  for (let s_ of Object.keys(data.levels.aggregates)) {
    this.hashes[s_] = encodeHash(s_);      this.indices[encodeHash(s_)] = s_
  }
}
function hashLevel() {
  for (let [l_, level] of data.levels.codes.entries()) {
    if (level == "") { continue } // skips dividers
    this.hashes[l_] = encodeHash(level);   this.indices[encodeHash(level)] = l_
  }
}
function hashPlayer() {
  for (let [p_, player] of data.players.names.entries()) {
    this.hashes[p_] = encodeHash(player);  this.indices[encodeHash(player)] = p_
  }
}

// navigation sender
// all page navigation is done by this command, which sets URL hash, which the next function handles
function go(endpoint, index) {
  location.hash = pages[endpoint].hashes[index]
}

// navigation receiver
// event handler bound to URL hash change; runs loadTable method of relevant page
function onHashChange() {
  let target = encodeHash(location.hash.substring(1))
  console.log("navigating:", target)
  document.title = document.title.split(" |")[0] + " | " + target
  // select Page object
  let targetPage
  for (let page of Object.values(pages)) { if (target in page.indices) { targetPage = page } }
  // load page or re-trigger function
  if (targetPage) {
    Page.active = targetPage
    Page.active.loadTable(Page.active.indices[target])          // load table
    $("#radioPages-"+Page.active.name[0]).prop("checked", true) // set active page in navigation bar  
  } else {
    location.hash = "all" in pageAggregate.indices ? "all" : "total" // total is for backward compat.
  }
}
