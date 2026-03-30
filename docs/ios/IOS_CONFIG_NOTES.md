# iOS Config Notes (Placeholders to fill before submission)

## App identity
- App name: `AI Resume Coach`
- Bundle ID: `com.example.airesume` (update to your own reverse-DNS)
- Version: align with `package.json` + Xcode Marketing Version
- Build number: increment per upload in Xcode

## Required assets
- App icon set (1024x1024 source + all generated sizes)
- Launch/splash screen artwork

## Privacy descriptions (`Info.plist`)
Add keys if features use these capabilities:
- `NSCameraUsageDescription` (if camera/photo scan is used)
- `NSPhotoLibraryUsageDescription` (if importing resume files/images)
- `NSPhotoLibraryAddUsageDescription` (if saving files/images)

## Networking
- Ensure production API URL uses HTTPS.
- If using ATS exceptions, keep them minimal and documented.
