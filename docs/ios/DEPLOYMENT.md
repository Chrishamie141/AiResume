# iOS Deployment Path (Practical)

This project is currently a Vite + React web app with an Express backend. The most practical App Store path is:

1. Keep the existing web app + backend architecture.
2. Package the web frontend with **Capacitor** as an iOS shell.
3. Point app API calls to production backend URL with `VITE_API_BASE_URL`.

## Why this path
- Lowest rewrite risk for a student demo.
- Preserves existing React code and feature set.
- App Store-submittable once iOS assets, privacy text, and signing are configured.

## Required App Store metadata/config
- App Name: set in Xcode target and `capacitor.config.ts`.
- Bundle Identifier: update `appId` in `capacitor.config.ts`.
- Version/Build number: update `package.json` + Xcode build number.
- Icons/Splash: generate and import into iOS asset catalogs.
- Privacy descriptions (`Info.plist`): camera/photos/files if upload features require them.

## Blockers to resolve before submission
- Replace localhost API with production API URL (`VITE_API_BASE_URL`).
- Verify all endpoint tests pass (`npm run verify:release`).
- Ensure no debug/dev banners or devtools are exposed in production builds.
- Complete App Store privacy questionnaire based on Supabase + API usage.
