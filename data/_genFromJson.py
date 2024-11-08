# convert older data json to current format
import json, re
from urllib import parse as urlfn
from _genHtml import genPage
from _anon import processAnons
dataRoot = "data/src/json/" # make a symlink: data/src/json → [actual data folder]

# levels haven't changed since late 2021 so we inject the latest metadata into all data
with open("data/_levels.json") as f:
    levels = json.loads(f.read())
levels.pop("indices", None)

def convert(timestamp):
    # read
    with open(f"{dataRoot}{timestamp}.json") as f:
        data = json.loads(f.read())
    # patches
    cutoffDict = {k: data["levels"][k] for k in ["cutoffs", "cutoffLimits"] if k in data["levels"]}
    data["levels"] = levels | cutoffDict
    processAnons(data)
    for level in data["body"]:
        for i, run in enumerate(level):
            if run[1] == None: run[1] = ""                                  # v2.0+: null links → ""
            while len(run) >= 1 and run[-1] == "": del run[-1]              # v2.3+: delete trailing "" params
            if len(run) >= 2 and run[1] != "": run[1] = urlClean(run[1])
    # write
    with open(f"data/{timestamp}.json", "w") as f:
        f.write(json.dumps(data, separators=(',', ':')))
    genPage(timestamp)
    print("converted:", timestamp)

def urlClean(oldUrl):
    url = urlfn.urlparse(oldUrl)
    query = urlfn.parse_qs(url.query)
    # patches
    if "youtu" in url.netloc:
        for key in ["si", "feature", "ab_channel"]: query.pop(key, None)
        if "youtube.com" in url.netloc and "watch" in url.path: # excludes yt shorts
            url = url._replace(netloc = "youtu.be")
            url = url._replace(path   = query["v"][0])
            query.pop("v")
        elif "youtu.be" in url.netloc: pass
        # else: print("!:", oldUrl) # log weird youtube urls (like shorts)
    elif "twitch" in url.netloc:
        for key in ["filter", "range", "sort", "tt_medium", "tt_content"]: query.pop(key, None)
    elif "twitter" in url.netloc or "x.com" in url.netloc:
        for key in ["s", "t"]: query.pop(key, None)
    # else: print("!:", oldUrl) # log weird source websites
    # end patches
    url = url._replace(query  = urlfn.urlencode(query, doseq=True))
    url = urlfn.urlunparse(url)
    # if oldUrl != url: print("<", oldUrl, "\n>", url, "\n")
    return url

tsList = [
    "20230701",      "20231101-1600", "20231201-1605", "20240101-1600",
    "20240301-1600", "20240401-1500", "20240501-1500", "20240601-1500",
    "20240701-1500", "20240801-1500", "20240901-1500", "20241001-1500",
    "20241101-1600",
]
for timestamp in tsList: convert(timestamp)
