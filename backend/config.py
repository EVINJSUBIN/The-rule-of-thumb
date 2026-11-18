import os

# Dynamic root path of the project (no hardcoded Windows paths!)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Data directory for SQLite DB and cached offline docs
DATA_DIR = os.path.join(BASE_DIR, "data")
DOCS_DIR = os.path.join(DATA_DIR, "docs")
DATABASE_PATH = os.path.join(DATA_DIR, "ruleofthumb.db")

# DevDocs public CDN URLs for fetching docs on-demand
DEVDOCS_MANIFEST_URL = "https://devdocs.io/docs.json"
DEVDOCS_CDN_BASE = "https://documents.devdocs.io"

# Ensure runtime directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)
