import argparse
import ssl
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Serve the Loon Survival web app.")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", default=8000, type=int)
    parser.add_argument("--cert", help="TLS certificate path for HTTPS testing.")
    parser.add_argument("--key", help="TLS private key path for HTTPS testing.")
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    scheme = "http"
    if args.cert and args.key:
      context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
      context.load_cert_chain(args.cert, args.key)
      server.socket = context.wrap_socket(server.socket, server_side=True)
      scheme = "https"

    print(f"Loon Survival web app: {scheme}://localhost:{args.port}/webapp/")
    print("On iPhone: open the laptop LAN address in Safari, then Share > Add to Home Screen.")
    server.serve_forever()
