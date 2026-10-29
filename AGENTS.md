# Project workflow

- This project belongs to `https://github.com/09rakib/TOLL-EMPIRE-GAME`.
- The user explicitly requests that completed changes be committed and pushed to this repository after each task. Run appropriate checks first, review the diff, and push without asking for repeated authorization. Never force-push over remote work.
- Include all runtime source, tests and documentation. Keep secrets, device pairing codes, local saves and generated release ZIP archives out of Git.
- Preserve existing player saves when changing gameplay or storage.
- Gameplay uses dependency-free JavaScript/Canvas. `android/` packages the same game into an offline Android WebView app. Run `npm test` and `npm run check` for gameplay changes; build and smoke-test the APK for Android changes. Describe an APK as available only after a successful build.
- Android assets are generated from the root source during the build; do not edit copies in build directories. Do not commit signing keys or phone screenshots.
