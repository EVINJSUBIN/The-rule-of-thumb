import os
from flask import Blueprint, request, jsonify
from config import BASE_DIR

files_bp = Blueprint("files", __name__, url_prefix="/api/files")

@files_bp.route("/read/<path:filename>", methods=["GET"])
def read_file(filename):
    """
    Reads and returns the contents of a project file.
    """
    file_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": f"'{filename}' not found"}), 404
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        return jsonify({
            "filename": filename,
            "content": content
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/write/<path:filepath>", methods=["POST"])
def write_file(filepath):
    """
    Writes content to a project file.
    Expects JSON body: { "content": "..." }
    """
    # TODO: [Hour 1 Task] You code this!
    # 1. Get the json body using `request.get_json()`
    # 2. Check if "content" is in the json, return 400 if missing
    # 3. Resolve the full destination path with os.path.join(BASE_DIR, filepath)
    # 4. Use os.makedirs(os.path.dirname(full_path), exist_ok=True) to ensure parent folders exist
    # 5. Open in "w" mode with utf-8 encoding and write data["content"]
    # 6. Return jsonify({"success": True, "file": filepath}), 200
    return jsonify({"todo": "Write route logic here"}), 501


@files_bp.route("/list", methods=["GET"])
def list_files():
    """
    Lists files in the project workspace, excluding noise like .git or __pycache__.
    """
    # TODO: [Hour 1 Task] You code this!
    # 1. Walk or list items in BASE_DIR using os.walk() or os.listdir()
    # 2. Filter out items containing '.git', '__pycache__', '.venv', or 'node_modules'
    # 3. Return jsonify({"files": file_list}), 200
    return jsonify({"todo": "List route logic here"}), 501
