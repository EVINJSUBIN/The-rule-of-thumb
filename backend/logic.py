"""
The Rule of Thumb — your logic.

The sidecar stores rows and asks this file what they mean.
typing_seconds_from_keystrokes and rule_of_thumb_decision stay yours.
match_error_to_docs points a pasted error at an installed doc page.
"""

import json
import os


def typing_seconds_from_keystrokes(keystroke_count):
    """
    Turn a keystroke total into seconds of hands-on coding time.

    keystroke_count: int, every stored key from typing telemetry.
    Return an int number of seconds, or raise NotImplementedError.
    """
    raise NotImplementedError


def match_error_to_docs(error_text, installed_slugs):
    """
    Read a pasted error and point at an offline doc page.

    error_text: str, exactly what the user pasted.
    installed_slugs: list of docset folder names under data/docs/.
    Return a dict:
        {"slug": "...", "doc_path": "...", "reason": "..."}
    or raise NotImplementedError.
    """
    import re

    text = "" if error_text is None else str(error_text)
    slugs = [slug for slug in (installed_slugs or []) if slug and slug != ".gitkeep"]
    tokens = []
    tokens += re.findall(r"\b([A-Z][A-Za-z0-9]+(?:Error|Exception|Warning))\b", text)
    tokens += re.findall(r"\b(E\d{4})\b", text)
    tokens += re.findall(r"['\"`]([A-Za-z_][\w.]{1,80})['\"`]", text)
    tokens += re.findall(r"\b(SELECT|INSERT|UPDATE|DELETE|PRAGMA|CREATE|ALTER|DROP|JOIN|WHERE|FROM)\b", text, re.I)
    tokens += re.findall(r"\b([A-Za-z_][\w.]{2,60})\s*\(", text)
    cleaned = []
    skip = {"self", "print", "len", "str", "int", "list", "dict", "type", "open", "range", "super"}
    for token in tokens:
        piece = token.strip(" .")
        if piece.lower() in skip or len(piece) < 2:
            continue
        if piece not in cleaned:
            cleaned.append(piece)
        if len(cleaned) >= 24:
            break

    low = text.lower()
    preferred = []
    if "traceback" in low or ".py" in low or "python" in low or re.search(
        r"\b(NameError|AttributeError|ImportError|IndentationError|ModuleNotFoundError|UnboundLocalError)\b",
        text,
    ):
        preferred.append("python")
    if "sqlite" in low or "operationalerror" in low or re.search(r"\bselect\b|\bpragma\b", low):
        preferred.append("sqlite")
    if "rustc" in low or "error[e" in low or ".rs" in low:
        preferred.append("rust")
    if "typescript" in low or ".ts" in low or ".tsx" in low:
        preferred.append("typescript")
    if "javascript" in low or "typeerror" in low or ".js" in low:
        preferred.append("javascript")
    if "<html" in low or "domexception" in low:
        preferred.append("html")
    if "css" in low or "stylesheet" in low:
        preferred.append("css")
    suggest = {
        "python": "python~3.13",
        "javascript": "javascript",
        "typescript": "typescript",
        "rust": "rust",
        "sqlite": "sqlite",
        "html": "html",
        "css": "css",
    }

    docs_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "docs")
    best = None
    best_score = 0
    for slug in slugs:
        index_path = os.path.join(docs_root, slug, "index.json")
        if not os.path.exists(index_path):
            continue
        try:
            with open(index_path, "r", encoding="utf-8") as handle:
                entries = json.load(handle).get("entries", [])
        except (OSError, json.JSONDecodeError):
            continue
        bonus = 12 if any(hint in slug for hint in preferred) else 0
        for entry in entries:
            name = entry.get("name") or ""
            path = entry.get("path") or ""
            lname = name.lower()
            lpath = path.lower()
            score = bonus
            for token in cleaned:
                needle = token.lower()
                if lname == needle or lname == needle.split(".")[-1]:
                    score += 60
                elif needle in lname:
                    score += 24
                elif needle in lpath:
                    score += 10
            if score > best_score and path:
                best_score = score
                best = (slug, path, name, score)

    if not best or best_score < 20:
        missing = [suggest[hint] for hint in preferred if not any(hint in slug for slug in slugs)]
        hint = f" Download {missing[0]} first." if missing else " Try another installed set."
        return {
            "slug": "",
            "doc_path": "",
            "title": "",
            "reason": "No installed page matched that error." + hint,
        }

    slug, path, name, score = best
    return {
        "slug": slug,
        "doc_path": path,
        "title": name,
        "reason": f"{name} in {slug} scored {score}.",
    }


def rule_of_thumb_decision(ai_count, coding_seconds, keystroke_count):
    """
    Decide if AI help is still inside the one-third rule.

    ai_count: number of rows in ai_logs.
    coding_seconds: sum of coding_sessions.duration_seconds.
    keystroke_count: sum of typing telemetry.
    Return a dict:
        {"ai_share": 0.0, "limit": 0.333, "allowed": True, "note": "..."}
    or raise NotImplementedError.
    """
    raise NotImplementedError
