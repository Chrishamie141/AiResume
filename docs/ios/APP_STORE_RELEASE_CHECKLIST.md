# App Store Release-Readiness Checklist

- [ ] Production API base URL configured (`VITE_API_BASE_URL`) and no localhost references in production build.
- [ ] OpenAI + Adzuna environment variables verified in deployment environment.
- [ ] App icons and launch/splash assets generated and set in Xcode asset catalogs.
- [ ] Bundle identifier, app display name, version, and build number set.
- [ ] Mobile responsiveness verified on iPhone viewport for dashboard, resume builder, resume preview, job search, and tracker.
- [ ] All endpoint tests passing (`npm run test:api`).
- [ ] Pre-release verification passing (`npm run verify:release`).
- [ ] No dev-only banners or debug tools enabled in production.
- [ ] Privacy text/config reviewed (`Info.plist` usage descriptions + App Store privacy questionnaire).
- [ ] Crash/console logs checked to ensure no secret tokens are logged.
