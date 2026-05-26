# Loon Survival Web App

This folder contains an installable browser version of the game for iPhone.

Run it locally:

```bash
python3 webapp/server.py
```

Or on Ubuntu/Linux:

```bash
./run_webapp.sh
```

Open on this laptop:

```text
http://localhost:8000/webapp/
```

Open on iPhone for quick testing:

1. Connect the iPhone and laptop to the same Wi-Fi.
2. Find the laptop IP address.
3. Open `http://YOUR-LAPTOP-IP:8000/webapp/` in Safari.
4. Tap Share.
5. Tap Add to Home Screen.

For full PWA behavior on iOS, host the project over HTTPS, such as GitHub Pages,
Cloudflare Pages, Netlify, or a tunnel with HTTPS. Safari can add the page to the
Home Screen from a local address, but service worker offline caching requires a
secure origin.

Optional HTTPS local server:

```bash
python3 webapp/server.py --cert path/to/cert.pem --key path/to/key.pem
```

This is a PWA. It is installable from Safari, but it is not an App Store `.ipa`.
