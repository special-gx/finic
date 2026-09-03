## Project background

AksaraDub is a Khmer-first AI video dubbing studio for creators who need to translate Chinese or English videos into Khmer. The product should make uploading, configuring, reviewing, and exporting dubbed video feel approachable on both phones and desktop browsers.

## Product shape

- Static React/Vite single-page application prepared for GitHub Pages-compatible hosting.
- Core flow: upload a video, choose Chinese or English as source, select Khmer voice and subtitle styling, run a transparent demo processing sequence, edit Khmer subtitle segments, and export subtitle/project files.
- The browser provides local video preview and device-local project state only. No uploaded media leaves the browser in this prototype.
- Real speech recognition, translation, Khmer text-to-speech, lip sync, and final MP4 rendering require a separately hosted secure backend API; private API keys must never be embedded in the static client.
- Visual direction: cinematic night studio, deep navy surfaces, violet signal accents, compact Khmer typography, and an orbital waveform motif inspired by the supplied reference video.
- Interface copy is primarily Khmer with concise English utility labels where helpful.
- Khmer font files are bundled with the client so text renders consistently without a third-party font request.
- Vite uses relative production asset paths and the repository includes a GitHub Actions workflow for GitHub Pages deployment.
