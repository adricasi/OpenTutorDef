#!/usr/bin/env python3
"""Ink Recorder collector.

Serves tools/recorder/ink-recorder.html on the LAN and saves recordings that the
page POSTs to /api/recordings into fixtures/recordings/<filename>.json.

Run:   python3 tools/recorder/collector.py            (port 8765 by default, PORT=... to change)
Open:  http://<your-mac>.local:8765  on the iPad (Safari) or the Mac.
No dependencies beyond the Python standard library.
"""
import json
import os
import re
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(REPO, "fixtures", "recordings")
PORT = int(os.environ.get("PORT", "8765"))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=HERE, **k)

    def log_message(self, fmt, *args):  # quieter log
        if "/api/" in (args[0] if args else ""):
            super().log_message(fmt, *args)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path in ("", "/"):
            self.path = "/ink-recorder.html"
        if self.path == "/api/recordings":
            files = sorted(f for f in os.listdir(OUT) if f.endswith(".json")) if os.path.isdir(OUT) else []
            return self._json({"ok": True, "count": len(files), "files": files})
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/recordings":
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(n))
        except Exception as e:  # noqa: BLE001
            return self._json({"ok": False, "error": f"bad json: {e}"}, 400)
        rec = body.get("recording", body)
        name = re.sub(r"[^a-zA-Z0-9._-]", "-", str(body.get("filename") or "recording.json"))
        if not name.endswith(".json"):
            name += ".json"
        os.makedirs(OUT, exist_ok=True)
        path = os.path.join(OUT, name)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(rec, f, ensure_ascii=False)
        rel = os.path.relpath(path, REPO)
        print(f"saved {rel}  ({os.path.getsize(path)//1024} KB)")
        return self._json({"ok": True, "path": rel})

    def _json(self, obj, status=200):
        data = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:  # noqa: BLE001
        return "127.0.0.1"


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    host = socket.gethostname().split(".")[0]
    print(f"Ink Recorder  →  http://{host}.local:{PORT}   or   http://{lan_ip()}:{PORT}")
    print(f"Recordings land in {os.path.relpath(OUT, os.getcwd())}/")
    print("Ctrl-C to stop.")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
