"""
Filter script for department codes.

Reads a JSON file containing department entries and filters them
based on predefined exact codes and regex patterns.
"""

import json
import re

EXACT = {"080", "0801", "0802", "0804", "0805", "0806", "085"}
EXACT_UPPER = {x.upper() for x in EXACT}

PATTERNS = [
    re.compile(r"^200[A-Za-z]{2}$"),
    re.compile(r"^200[A-Za-z]{3}$"),
    re.compile(r"^20[A-Za-z]{2}\d{2}$"),
    re.compile(r"^\d{3}$"),
    re.compile(r"^\d{3}[A-Za-z]+$"),
    re.compile(r"^9FL.*$"),
]


def allowed(code) -> bool:
    """
    Check whether a department code is allowed.

    Normalizes the code and applies rules based on:
    - allowed prefixes
    - explicit allow list
    - numeric ranges
    - regex patterns
    """
    c = str(code)
    c = c.replace("\x00", "")
    c = c.replace("\ufeff", "")   # BOM
    c = c.replace("\u00a0", " ")  # NBSP
    c = c.strip()

    cu = c.upper()

    # 1) 9FL always allowed
    if cu.startswith("9FL"):
        return True

    # 2) exact matches always allowed
    if c in EXACT or cu in EXACT_UPPER:
        return True

    # extract leading number
    match = re.match(r"^(\d+)", c)
    if match:
        number = int(match.group(1))

        if number < 100:
            return False
        if 251 <= number <= 299:
            return False
        if number > 900:
            return False

    # allowed patterns
    return any(p.match(c) for p in PATTERNS) or any(p.match(cu) for p in PATTERNS)


def main():
    """Run the filtering process."""
    with open("abteilungen.json", "r", encoding="utf-16") as file:
        data = json.load(file)

    data["data"] = [row for row in data["data"] if row and allowed(row[0])]

    with open("gebaeudeschluessel_filtered.json", "w", encoding="utf-16") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

    print("Fertig. Gefilterte Datei gespeichert.")


if __name__ == "__main__":
    main()
