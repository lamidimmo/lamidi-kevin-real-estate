#!/usr/bin/env python3
# =============================================================================
# fetch_biens.py — Recupere les biens de Kevin Lamidi depuis l'API middleware
# et produit data/biens.json, propre et discret, pour la vitrine du portail.
#
# Source : GET https://middleware.switzerland-sothebysrealty.ch/api/agents/{uuid}/properties
#   -> { forSaleProperties, soldProperties, totalForSale, totalSold }
#
# Stdlib uniquement (urllib). Lance chaque jour par GitHub Actions.
# Ne conserve que les champs utiles ; adresse reduite a la commune + region
# (jamais le numero de rue) ; coordonnees arrondies (~1 km) pour la discretion.
# =============================================================================
import json
import os
import re
import sys
import datetime
import html as htmllib
import time
import urllib.request
import urllib.error

MIN_FORSALE = 1     # en dessous -> suspect (API vide / schema change), on refuse d'ecrire
DROP_RATIO = 0.5    # refus si chute de plus de 50% du nombre de biens vs fichier precedent

AGENT_UUID = "9bcd416c-d496-ef11-8a6a-000d3ab2939c"  # Kevin Lamidi
API = f"https://middleware.switzerland-sothebysrealty.ch/api/agents/{AGENT_UUID}/properties"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "biens.json")
OVERRIDES = os.path.join(os.path.dirname(__file__), "..", "overrides.json")
LANGS = ("fr", "en", "de")
MAX_IMAGES = 16

_TAG = re.compile(r"<[^>]+>")
_BLOCK = re.compile(r"<\s*(br|/p|/div|/li|/h[1-6])\s*>", re.I)
_WS = re.compile(r"[ \t ]+")


def pick_langs(obj):
    out = {}
    if isinstance(obj, dict):
        for l in LANGS:
            if obj.get(l):
                out[l] = obj[l]
    return out


def html_to_paras(s):
    if not isinstance(s, str) or not s:
        return []
    s = _BLOCK.sub("\n", s)
    s = _TAG.sub(" ", s)
    s = htmllib.unescape(s)
    paras = []
    for line in s.split("\n"):
        line = _WS.sub(" ", line).strip()
        if len(line) > 1:
            paras.append(line)
    return paras[:12]


def desc_paras(obj):
    out = {}
    if isinstance(obj, dict):
        for l in LANGS:
            if obj.get(l):
                out[l] = html_to_paras(obj[l])
    return out


def round_coord(n):
    return round(n, 2) if isinstance(n, (int, float)) else None  # ~1 km


# Canton derive du NPA (Suisse romande couverte ; sinon vide -> commune seule).
# Heuristique par plages, suffisante et discrete (niveau commune/canton).
_CANTONS = [
    (1000, 1199, "Vaud"), (1200, 1299, "Genève"), (1300, 1599, "Vaud"),
    (1600, 1799, "Fribourg"), (1800, 1899, "Vaud"), (1900, 1999, "Valais"),
    (2000, 2099, "Neuchâtel"), (2300, 2499, "Neuchâtel"), (2500, 2599, "Berne"),
    (2800, 2999, "Jura"), (3900, 3999, "Valais"),
]


def canton_from_npa(npa):
    try:
        n = int(str(npa)[:4])
    except (TypeError, ValueError):
        return ""
    for lo, hi, name in _CANTONS:
        if lo <= n <= hi:
            return name
    return ""


def images(arr):
    arr = arr if isinstance(arr, list) else []
    keep = [im for im in arr if im and im.get("url") and im.get("displayInClientSpace") is not False]
    keep.sort(key=lambda im: im.get("order", 0))
    return [im["url"] for im in keep[:MAX_IMAGES]]


def surfaces(s):
    out = {}
    if isinstance(s, dict):
        mapping = {"computed": "living", "balanced": "balanced", "land": "land",
                   "usable": "usable", "terrace": "terrace", "balcony": "balcony", "garden": "garden"}
        for src, dst in mapping.items():
            if s.get(src):
                out[dst] = s[src]
    return out


def transform(p, status):
    addr = p.get("address") or {}
    city = addr.get("city") or ""
    region = canton_from_npa(addr.get("postalCode"))
    price = None
    dp = p.get("displayPrice") or {}
    if status == "sale" and p.get("isPriceDisplayed") and dp.get("amount"):
        price = {"amount": dp["amount"], "currency": dp.get("currency") or "CHF"}
    loc = p.get("location") or {}
    return {
        "id": p.get("id"),
        "ref": p.get("reference") or "",
        "status": status,  # 'sale' | 'sold'
        "type": p.get("type") or "",
        "subtype": p.get("subtype") or "",
        "title": pick_langs(p.get("title")),
        "desc": desc_paras(p.get("description")),
        "price": price,
        "rooms": p.get("rooms"),
        "bedrooms": p.get("bedrooms"),
        "bathrooms": p.get("bathrooms"),
        "surfaces": surfaces(p.get("surfaces")),
        "buildingYear": p.get("buildingYear"),
        "renovationYear": p.get("renovationYear"),
        "commune": city,
        "region": region,  # ex. "Vaud" (jamais le numero de rue)
        "country": addr.get("countryCode") or addr.get("country") or "CH",
        "lat": round_coord(loc.get("lat")),  # arrondi ~1 km
        "lon": round_coord(loc.get("lon")),
        "images": images(p.get("images")),
    }


def apply_overrides(items):
    """Applique des corrections manuelles (overrides.json) APRES le scraping,
    pour les fiches incompletes cote API. Cle = id du bien."""
    try:
        with open(OVERRIDES, encoding="utf-8") as f:
            by_id = json.load(f).get("byId", {})
    except (FileNotFoundError, ValueError):
        return
    for b in items:
        o = by_id.get(b.get("id"))
        if not o:
            continue
        for k, v in o.items():
            if k.startswith("_"):
                continue
            if k in ("surfaces", "title", "desc") and isinstance(v, dict):
                b.setdefault(k, {}).update(v)
            else:
                b[k] = v


def fetch_json(url, attempts=3):
    """Recupere le JSON avec retries (erreurs transitoires)."""
    last = None
    for i in range(attempts):
        try:
            req = urllib.request.Request(url, headers={
                "Accept": "application/json", "User-Agent": "lamidi-portail/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:  # noqa
            last = e
            if i < attempts - 1:
                time.sleep(2 ** i * 3)  # 3s puis 6s
    raise last


def load_previous():
    try:
        with open(OUT, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return None


def validate(out, previous):
    """Leve ValueError si le JSON produit est suspect -> on n'ecrase pas l'existant."""
    fs = out.get("forSale") or []
    if len(fs) < MIN_FORSALE:
        raise ValueError("0/peu de biens a vendre (%d) : API vide ou schema change ?" % len(fs))
    for b in fs:
        if not b.get("id") or not b.get("title"):
            raise ValueError("bien sans id/title: %s" % (b.get("ref") or b.get("id")))
    if previous:
        old = len(previous.get("forSale") or [])
        if old and len(fs) < old * DROP_RATIO:
            raise ValueError("chute suspecte %d -> %d biens : refus d'ecraser" % (old, len(fs)))


def main():
    data = fetch_json(API)
    for_sale = [transform(p, "sale") for p in (data.get("forSaleProperties") or [])]
    sold = [transform(p, "sold") for p in (data.get("soldProperties") or [])]
    apply_overrides(for_sale)
    apply_overrides(sold)

    out = {
        "updatedAt": datetime.date.today().isoformat(),
        "totalForSale": data.get("totalForSale", len(for_sale)),
        "totalSold": data.get("totalSold", len(sold)),
        "forSale": for_sale,
        "sold": sold,
    }

    previous = load_previous()
    validate(out, previous)  # leve -> exit 1, ancien biens.json conserve

    # Evite un commit quotidien inutile : si seul updatedAt change, on ne reecrit pas.
    if previous:
        a = {k: v for k, v in out.items() if k != "updatedAt"}
        b = {k: v for k, v in previous.items() if k != "updatedAt"}
        if a == b:
            print("Aucun changement de contenu : pas de reecriture.")
            return

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + ".tmp"  # ecriture atomique (pas de fichier tronque)
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, OUT)
    print(f"OK : {len(for_sale)} a vendre, {len(sold)} vendus -> data/biens.json")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # noqa
        print("ECHEC fetch_biens:", e, file=sys.stderr)
        sys.exit(1)
