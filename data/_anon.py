anon = {
    "current": {},
    "alias": {},
    "unset": {},
}

def processAnons(data):
    data["players"]["anon"] = {letter: name for name, letter in anon["current"].items()}
    anon["set"] = anon["current"] | anon["alias"]
    data["players"]["names"] = [  anon["set"][x] if x in   anon["set"] else x for x in data["players"]["names"]]
    data["players"]["names"] = [anon["unset"][x] if x in anon["unset"] else x for x in data["players"]["names"]]
