// 4. PAGE NAV METHODS
// these return html for the navigation components of each Page

function navLevel() {
  let html = `<div>`
  let prevWorld = ""
  for (let [l_,level] of data.levels.names.entries()) {
    if (level.substring(0,7)=="divider") {continue}
    let world = level.split(" ")[0]
    if (world != prevWorld) {
      prevWorld = world
      html += `</div></div>
      <div class="tab" tabindex="-1">
        <input type="radio" id="rd-${world}" name="rd">
        <label class="tab-label B${world}" for="rd-${world}">${world}</label>
        <div class="tab-content">`
    }
    let code = data.levels.codes[l_]
    html += `<button class="T${world}" onclick="${go("l",l_)}" tabindex="-1">${code}</button>`
  }
  html += "</div></div>"
  return html
}

function navAggregate() {
  let valueCmd = `$('select.${this.name}').val()` // to pull value from select
  return `<select class="${this.name}" onchange="${go("a",valueCmd)}">
    ${Object.keys(aggregates).map(s_ => `<option value="${s_}">${s_}</option>`).join('')}
  </select>`
}

function navPlayer() {
  let valueCmd = `$('select.${this.name}').val()` // to pull value from select
  return `<select class="${this.name}" onchange="${go("p",valueCmd)}">
    ${data.players.names.map((name,p_) => `<option value="${p_}">${name}</option>`).join('')}
  </select>`
}
