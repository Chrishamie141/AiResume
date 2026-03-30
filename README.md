<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Resume App

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template and fill keys:
   ```bash
   cp .env.example .env.local
   ```
3. Start app + API server:
   ```bash
   npm run dev
   ```

## API Endpoint Testing

Run full backend endpoint checks:
```bash
npm run test:api
```

Run pre-release verification:
```bash
npm run verify:release
```

## iOS Packaging Path (Capacitor wrapper)

1. Build web assets:
   ```bash
   npm run build
   ```
2. Add iOS platform once:
   ```bash
   npx cap add ios
   ```
3. Sync web build into native shell:
   ```bash
   npm run ios:sync
   ```
4. Open Xcode project:
   ```bash
   npm run ios:open
   ```

See `docs/ios/DEPLOYMENT.md` for App Store readiness details.
