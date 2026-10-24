# 0010. Pair the iPad through a token-gated Cloudflare quick tunnel; LAN stays open

- Status: Accepted
- Date: 2026-10-24
- Deciders: Open Tutor maintainers
- Source: DECISIONS #11, #22, #26 (and ARCHITECTURE §8)

## Context
Safari only allows the microphone on HTTPS. The owner works on Wi-Fi that is not theirs, where
devices may not reach each other, so LAN pairing cannot be assumed.

## Options considered
1. **LAN http only** — Pros: nothing leaves the network. Cons: no microphone; fails on isolated
   Wi-Fi.
2. **mkcert local certificates** — Cons: installing a root certificate on each iPad.
3. **Named Cloudflare tunnel or ngrok** — Cons: needs an account (and a domain), limits.
4. **A Cloudflare quick tunnel (no account), gated by a pairing token** — Pros: HTTPS anywhere with
   a QR code. Cons: traffic passes Cloudflare's edge, where TLS ends.

## Decision
We use option 4 as the iPad's default way in (`make ipad`, or `make pair` next to a running
server), and keep LAN http open where the network allows it (no token needed there). The QR code
carries the token as `?k=…`; the first request trades it for an HttpOnly, Secure, SameSite=Lax
cookie ([`pairing.py`](../../tutor-app/apps/server/src/inktutor_server/pairing.py)). Old codes can be
revoked (`pair --new-token`). The teacher view and the screen-tutor socket are refused through the
tunnel (ADR-0012, ADR-0013).

## Consequences
- Positive: the microphone works; pairing is one QR scan.
- Negative: through the tunnel, ink and audio pass Cloudflare's edge. There is no per-request rate
  limit: the token gate is the only protection on the public URL.
- The tunnel URL changes per run, so browser storage tied to it does not persist.
