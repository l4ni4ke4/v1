# Fehmi Soyakça — Portfolio (V1)

Premium one-page portfolio for **Fehmi Soyakça** — SMMM (Certified Public Accountant) & Independent Auditor.
This is the **V1 design**: dark *ink-navy* background with *champagne-gold* accents.

Bilingual (TR / EN), animated, with a Three.js particle backdrop, GSAP scroll
animations, and Lenis smooth scrolling.

## Stack
Static site — plain HTML / CSS / vanilla JS, no build step. Libraries load from CDN
(Three.js, GSAP + ScrollTrigger, Lenis).

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page markup |
| `style.css` | Design system & layout |
| `scene.js` | Three.js gold particle backdrop |
| `app.js` | Interactions: language toggle, smooth scroll, reveals, counters, cursor |

## Run locally
Just open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8080
# then visit http://localhost:8080
```

## Deploy
Hosted as a static site on **AWS S3** (optionally fronted by CloudFront).
Upload the contents of this folder to the bucket root; `index.html` is the entry point.

> QA flags (no effect for normal visitors): append `?nopreload` to skip the
> preloader/animations, or `?debug` to dump layout metrics.
