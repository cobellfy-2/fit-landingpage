import json
import re

EXACT = { "080", "0801", "0802", "080", "0804",  "0805", "0806",   "085"}

PATTERNS = [
    re.compile(r"^200[A-Za-z]{2}$"),
    re.compile(r"^200[A-Za-z]{3}$"),
    re.compile(r"^20[A-Za-z]{2}\d{2}$"),
    re.compile(r"^\d{3}$"),
    re.compile(r"^\d{3}[A-Za-z]+$"),
    re.compile(r"^9FL.*$"),
]


def allowed(code) -> bool:
    # robust normalisieren (UTF-16 Nullbytes, Spaces, NBSP etc.)
    c = str(code)
    c = c.replace("\x00", "")
    c = c.replace("\ufeff", "")          # BOM
    c = c.replace("\u00a0", " ")         # NBSP
    c = c.strip()

    cu = c.upper()

    # ✅ 1) 9FL immer rein (egal welche Groß/Kleinschreibung)
    if cu.startswith("9FL"):
        return True

    # ✅ 2) EXACT immer rein
    if c in EXACT or cu in {x.upper() for x in EXACT}:
        return True

    # führende Zahl extrahieren
    m = re.match(r"^(\d+)", c)
    if m:
        n = int(m.group(1))

        # ❌ < 100 raus
        if n < 100:
            return False

        # ❌ 251–299 raus
        if 251 <= n <= 299:
            return False

        # ❌ > 900 raus
        if n > 900:
            return False

    # ✅ erlaubte Muster (auch hier case-insensitive)
    return any(p.match(c) for p in PATTERNS) or any(p.match(cu) for p in PATTERNS)

with open("abteilungen.json", "r", encoding="utf-16") as f:
    data = json.load(f)

# data["data"] ist eine Liste von Zeilen wie: [code, name, ...]
data["data"] = [row for row in data["data"] if row and allowed(row[0])]

with open("gebaeudeschluessel_filtered.json", "w", encoding="utf-16") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Fertig. Gefilterte Datei gespeichert.")