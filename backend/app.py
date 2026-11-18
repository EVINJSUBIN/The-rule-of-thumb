from flask import Flask, jsonify
from config import BASE_DIR, DATABASE_PATH
from database import init_db
from routes.files import files_bp
from routes.docs_manager import docs_bp
from routes.audit import audit_bp

def create_app():
    """
    Application factory for The Rule of Thumb backend.
    """
    app = Flask(__name__)

    # Initialize SQLite database on startup
    init_db()

    # Register blueprints
    app.register_blueprint(files_bp)
    app.register_blueprint(docs_bp)
    app.register_blueprint(audit_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        """
        Quick ping to verify backend is up and running.
        """
        return jsonify({
            "status": "online",
            "app": "The Rule of Thumb",
            "db_path": DATABASE_PATH
        }), 200

    return app

if __name__ == "__main__":
    app = create_app()
    print("🚀 Starting The Rule of Thumb Backend on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
