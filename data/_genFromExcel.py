# convert excel tool to data json (2022/01 onwards)
import json, re, openpyxl
from _genHtml import genPage
from _anon import processAnons
dataRoot = "data/src/excel/" # make a symlink: data/src/excel → [actual data folder]

# levels haven't changed since late 2021 so we inject the latest metadata into all data
L = 125
with open("data/_levels.json") as f:
    levels = json.loads(f.read())
levels.pop("indices", None)

def convert(timestamp):
    # read
    inFilename = f"SMSILS-{timestamp}.xlsx"
    s = openpyxl.load_workbook(filename = f"{dataRoot}{inFilename}", data_only = True)["View"]
    data = {
        "src":     inFilename,       "levels": levels,
        "players": {"names": []},    "body":   [[] for _ in range(L)],
    }
    # players
    for r in s[f"B7:B250"]:
        if r[0].value: data["players"]["names"].append(r[0].value)
    P = len(data["players"]["names"])
    processAnons(data)
    # runs
    p = -1
    for r in s[f"P7:EJ{P+6}"]:
        p += 1; l = -1
        for c in r:
            l += 1
            if c.value:
                t = str(c.value)
                while t[0] in "0:": t = t[1:]
                if t[-4:] == "0000": t = t[:-4]
                if "." not in t: t += ".00"
                data["body"][l].append([t])
            else:
                data["body"][l].append([])
    # write
    [yS, mS, dS, hmS] = map(int, timestamp.split("-"))
    if 4 <= mS <= 10: hmS -= 100 # convert uk time (excel filenames) to utc
    outFilename = f"{yS}{mS:02d}{dS:02d}-{hmS:04d}"
    with open(f"data/{outFilename}.json", "w") as f:
        f.write(json.dumps(data, separators=(',', ':')))
    genPage(outFilename)
    print("converted:", timestamp)

tsList = [
    "2022-01-01-1400", "2022-02-01-1400", "2022-03-01-1400", "2022-04-01-1400",
    "2022-05-01-1400", "2022-06-01-1400", "2022-07-01-1400", "2022-08-01-1402",
    "2022-09-01-1400", "2022-10-01-1400", "2022-11-01-1400", "2022-12-01-1400",
    "2023-01-01-1400", "2023-02-01-1600", "2023-03-01-1600", "2023-04-01-1600",
    "2023-05-01-1600", "2023-06-01-1600", "2023-08-01-1600", "2023-09-01-1600",
    "2023-10-01-1600",
]
for timestamp in tsList: convert(timestamp)
