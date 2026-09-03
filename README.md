# AksaraDub

Khmer-first AI video dubbing interface for Chinese or English source videos. The static prototype supports local video upload, dubbing configuration, a processing demo, Khmer subtitle editing, SRT download, and project JSON export.

## Run locally

```bash
npm ci
npm run dev
```

## Deploy to GitHub Pages

1. Push this project to a GitHub repository on the `main` branch.
2. Open **Settings → Pages** in the repository.
3. Set **Source** to **GitHub Actions**.
4. Run the included **Deploy to GitHub Pages** workflow or push a new commit.

The Vite build uses relative asset paths, so it works under a GitHub Pages repository subpath.

## AI backend boundary

GitHub Pages can host the interface only. Real speech recognition, Chinese/English-to-Khmer translation, Khmer text-to-speech, voice cloning, and MP4 rendering must run on a secure backend service. Do not put private AI provider keys in the browser code.
