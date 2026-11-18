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


@files_bp.route("/write", methods=["POST"])
def write_file():
    body = request.get_json(silent=True)
    if not body or not isinstance(body, dict):
        return jsonify({"error": "Invalid or missing JSON body"}), 400
    
    file_path = body.get("file_path")
    content = body.get("content")

    if not file_path:
        return jsonify({"error": "Missing 'file_path' in JSON body"}), 400
    if content is None:
        return jsonify({"error": "Missing 'content' in JSON body"}), 400

    file_path_write = os.path.join(BASE_DIR, file_path)
    
    try:
        os.makedirs(os.path.dirname(file_path_write), exist_ok=True)
        with open(file_path_write, "w", encoding="utf-8") as file:
            file.write(content)
        return jsonify({
            "status": f"Data successfully written into file '{file_path}'"
        }), 200
    except Exception as e:
        return jsonify({
            "error": f"Could not write data into file '{file_path}': {str(e)}"
        }), 500


@files_bp.route("/list", defaults={"list_path": ""}, methods=["GET"])
@files_bp.route("/list/<path:list_path>", methods=["GET"])
def list_files(list_path=""):
    list_path_full = os.path.join(BASE_DIR, list_path)
    if not os.path.isdir(list_path_full):
        return jsonify({
            "error": f"Path '{list_path_full}' does not exist or is not a directory"
        }), 404
    try:
        file_list = []
        for root, dirs, files in os.walk(list_path_full):
            for name in files:
                full_path = os.path.join(root, name)
                # Keep paths relative to BASE_DIR for clean readability
                rel_path = os.path.relpath(full_path, BASE_DIR)
                file_list.append(rel_path)
        return jsonify({"filepaths": file_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

