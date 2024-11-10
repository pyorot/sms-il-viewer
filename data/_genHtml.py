# create pages for data jsons
import re, shutil

def genPage(outFilename):
    pageFilename = f"{outFilename[2:6]}.html"
    shutil.copyfile("live.html", pageFilename)
    with open(pageFilename) as file:
        text = file.read()
    text = re.sub(r'dataUrl = "([^"]+)"', f'dataUrl = "data/{outFilename}.json"', text)
    dateText = re.sub(r"^(\d\d\d\d)(\d\d)(\d\d)", r"\1/\2/\3", outFilename)
    dateText = re.sub(r"^([^-]*)-(\d\d)(\d\d).*$", r"\1 \2:\3 UTC", dateText)
    topHtml = f'<label style="flex:1;height:100%" onclick="location.href=`/`">🏠</label><div style="flex:2">{dateText[2:7]}</div>'
    text = re.sub(r'SMS ILs(?=[\s\n]*</div>)', topHtml, text)
    text = re.sub(r"</h2>(\s*)<p>", rf'</h2>\1<p style="background:rgba(211,211,211,30%)"> The data here is frozen to <b>{dateText}</b>.</p>\1<p>', text)
    with open(pageFilename, "w") as file:
        file.write(text)
