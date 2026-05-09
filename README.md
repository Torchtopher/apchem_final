# AP Chemistry Acid-Base Visual Reasoning

A guided React app for AP Chemistry Unit 8 acid-base reasoning. The first
implemented module walks through a pyridine/pyridinium buffer problem and links
prediction, particle-level animation, Henderson-Hasselbalch reasoning, and a
final pH-change answer.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

The sync script builds the Vite app and uploads the generated `dist/` files to
the server with `rsync`:

```bash
./scripts/sync.sh
```

Defaults:

```bash
REMOTE_HOST=root@104.236.37.133
REMOTE_PATH=/var/www/html/apchem
```

To publish into a specific web root, override `REMOTE_PATH`:

```bash
REMOTE_PATH=/var/www/html/some-other-path ./scripts/sync.sh
```


## Useful acid base reference for making diagram
https://www.iq.usp.br/gutz/Curtipot_.html