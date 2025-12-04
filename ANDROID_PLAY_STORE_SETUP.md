# Android Play Store Setup Guide

This guide will help you prepare and upload your Bookstore app to the Google Play Store.

## Prerequisites

1. **Google Play Console Account**: You need a Google Play Developer account ($25 one-time fee)
2. **EAS Account**: Sign up at https://expo.dev (free tier available)
3. **Production API URL**: Update the API URL in `app.json` to your production backend

## Step 1: Update Production API URL

Before building for production, update the API URL in `app.json`:

```json
"extra": {
  "apiUrl": "https://your-production-api.com/api",
  "stripePublishableKey": "pk_live_YOUR_LIVE_KEY"
}
```

**Important**: Replace the local IP address (`192.168.1.190:3001`) with your production API URL and use your live Stripe publishable key.

## Step 2: Prepare App Icons

The app currently uses placeholder icons. For Play Store submission, you need:

1. **App Icon**: `assets/icon.png` (1024x1024px)
2. **Adaptive Icon**: `assets/adaptive-icon.png` (1024x1024px, with safe area)
3. **Splash Screen**: `assets/splash.png` (recommended: 1242x2436px)

Replace the placeholder files in the `assets/` folder with your actual app icons.

## Step 3: Set Up EAS Build

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to EAS**:
   ```bash
   eas login
   ```

3. **Configure your project**:
   ```bash
   eas build:configure
   ```

## Step 4: Set Up Android Signing

EAS can automatically manage your signing keys, or you can provide your own.

### Option A: Let EAS Manage Keys (Recommended)
EAS will automatically generate and manage your signing keys. No additional setup needed.

### Option B: Use Your Own Keystore
1. Generate a keystore:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore bookstore-release.keystore -alias bookstore-key -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Store the keystore securely and update `eas.json`:
   ```json
   {
     "build": {
       "production": {
         "android": {
           "buildType": "app-bundle",
           "credentials": {
             "keystore": {
               "keystorePath": "./bookstore-release.keystore",
               "keystorePassword": "YOUR_KEYSTORE_PASSWORD",
               "keyAlias": "bookstore-key",
               "keyPassword": "YOUR_KEY_PASSWORD"
             }
           }
         }
       }
     }
   }
   ```

## Step 5: Build Production App Bundle

Build the Android App Bundle (AAB) for production:

```bash
cd frontend
eas build --platform android --profile production
```

This will:
- Build your app with production optimizations
- Generate an Android App Bundle (AAB) file
- Upload it to EAS servers

The build process takes about 15-30 minutes. You'll get a download link when it's complete.

## Step 6: Create Google Play Console Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in the required information:
   - **App name**: Bookstore
   - **Default language**: English (or your preferred language)
   - **App type**: App
   - **Free or Paid**: Choose based on your monetization strategy

## Step 7: Prepare Store Listing

You'll need to provide:

1. **App Description** (up to 4000 characters)
2. **Short Description** (up to 80 characters)
3. **Screenshots**:
   - Phone: At least 2 screenshots (required)
   - Tablet: Optional but recommended
   - Minimum resolution: 320px
   - Maximum resolution: 3840px
4. **Feature Graphic**: 1024x500px
5. **App Icon**: 512x512px (high-res icon)
6. **Privacy Policy URL**: Required if your app handles user data
7. **Content Rating**: Complete the questionnaire

## Step 8: Upload App Bundle

1. In Google Play Console, go to **Production** → **Create new release**
2. Upload the AAB file you downloaded from EAS
3. Add release notes
4. Review and roll out to production

## Step 9: Complete Store Listing

Before your app can be published, you must complete:

1. **Store listing** (all required fields)
2. **Content rating** (complete questionnaire)
3. **Privacy policy** (if required)
4. **Target audience and content** (age restrictions)
5. **Data safety** (declare what data you collect)

## Step 10: Submit for Review

Once all sections are complete:

1. Review all information
2. Click **Submit for review**
3. Google will review your app (usually 1-3 days)
4. You'll receive an email when approved or if changes are needed

## Important Notes

### API URL Configuration
- **Development**: Uses local IP (`192.168.1.190:3001`)
- **Production**: Must use HTTPS URL to your production backend
- Update `app.json` before building for production

### Stripe Keys
- **Test Mode**: Currently using test publishable key
- **Production**: Switch to live publishable key in `app.json`
- Update backend to use live Stripe secret key

### Version Management
- `version` in `app.json`: User-facing version (e.g., "1.0.0")
- `versionCode` in `app.json`: Internal version number (must increment for each release)
- EAS can auto-increment `versionCode` (configured in `eas.json`)

### Permissions
The app currently requests minimal permissions:
- `INTERNET`: Required for API calls
- `ACCESS_NETWORK_STATE`: Check network connectivity
- `VIBRATE`: For haptic feedback

If you need additional permissions (e.g., for downloading books), add them to `app.json` and `AndroidManifest.xml`.

## Troubleshooting

### Build Fails
- Check that all dependencies are compatible
- Ensure `app.json` is valid JSON
- Verify icon files exist in `assets/` folder

### App Rejected
- Review Google Play policies
- Ensure privacy policy is accessible
- Complete all required store listing sections
- Check content rating requirements

### Signing Issues
- Let EAS manage keys (easiest option)
- If using custom keystore, ensure paths are correct
- Keep keystore backup secure (you'll need it for updates)

## Next Steps After Publishing

1. **Monitor Analytics**: Use Google Play Console analytics
2. **Handle Reviews**: Respond to user feedback
3. **Update Regularly**: Use EAS to build and submit updates
4. **Track Crashes**: Set up crash reporting (consider Sentry or similar)

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Expo Deployment Guide](https://docs.expo.dev/distribution/introduction/)

