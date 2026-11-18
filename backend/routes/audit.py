import sqlite3
from flask import Blueprint, jsonify, request
from config import DATABASE_PATH

audit_bp = Blueprint("audit", __name__, url_prefix="/api/audit")

@audit_bp.route("/log", methods=["POST"])
def log_ai_usage():
    """
    Logs an AI interaction or MCP tool call into the database.
    Expects JSON: { "tool_name": "...", "action": "...", "notes": "..." }
    """
    # TODO: [Hour 3 Task] You code this!
    # 1. Parse JSON body
    # 2. Insert into sqlite3 table `ai_logs`
    # 3. Return status
    return jsonify({"todo": "Log AI usage route logic"}), 501


@audit_bp.route("/stats", methods=["GET"])
def get_stats():
    """
    Returns AI usage statistics and total manual coding time.
    """
    # TODO: [Hour 3 Task] You code this!
    # 1. Query count from `ai_logs`
    # 2. Query total duration from `coding_sessions`
    # 3. Return summary JSON
    return jsonify({"todo": "Query stats route logic"}), 501
