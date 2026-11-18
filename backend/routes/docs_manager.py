import os
import requests
from flask import Blueprint, jsonify, request
from config import DOCS_DIR, DEVDOCS_MANIFEST_URL, DEVDOCS_CDN_BASE

docs_bp = Blueprint("docs", __name__, url_prefix="/api/docs")

@docs_bp.route("/available", methods=["GET"])
def get_available_docs():
    """
    Fetches the catalog of available language docsets from DevDocs.
    """
    # TODO: [Future Task]
    # Fetch DEVDOCS_MANIFEST_URL using requests.get() and return the catalog of languages
    return jsonify({"todo": "Fetch available languages from DevDocs"}), 501


@docs_bp.route("/installed", methods=["GET"])
def get_installed_docs():
    """
    Lists which docsets have already been downloaded offline in `data/docs/`.
    """
    # TODO: [Future Task]
    # Check what subdirectories exist in DOCS_DIR and return them as installed languages
    try:
        installed = os.listdir(DOCS_DIR)
        return jsonify({"installed": installed}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@docs_bp.route("/download/<doc_slug>", methods=["POST"])
def download_docset(doc_slug):
    """
    Downloads `index.json` and `db.json` for a specific language (e.g. 'python~3.12')
    and saves it into `data/docs/<doc_slug>/`.
    """
    # TODO: [Future Task]
    # 1. Target directory: os.path.join(DOCS_DIR, doc_slug)
    # 2. Fetch index: f"{DEVDOCS_CDN_BASE}/{doc_slug}/index.json"
    # 3. Fetch db: f"{DEVDOCS_CDN_BASE}/{doc_slug}/db.json"
    # 4. Save both locally so they work with zero internet!
    return jsonify({"todo": f"Download docset for {doc_slug}"}), 501
