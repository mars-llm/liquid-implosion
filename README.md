# Liquid Implosion

An evidence-led explanation of the September 2026 Liquid security incident.

The page keeps public transactions, Blockstream’s statement and the code-based explanation separate. Its five-step example uses two made-up records whose fields differ but become the same byte string when their boundaries are removed. The browser hashes both with SHA-256. The example does not replay the incident, validate a real range proof, create a transaction or provide exploit material.

The research cut-off shown on the page is 7 September 2026 at 17:21 CEST.

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run check
```

The production build is a static export in `out/` and is configured for the `/liquid-implosion/` GitHub Pages path.
