# Android release runbook

One-time setup for the Play release pipeline. None of it runs in CI.

Play holds 1.0.0 at version code 1. Tags v1.0.1 through v1.0.4 were never uploaded and will not appear in the Console.

## 1. Generate the upload keystore

Needs a JDK on PATH for `keytool`.

    keytool -genkeypair -v -storetype PKCS12 \
      -keystore upload.jks \
      -alias pyttogpanne-upload \
      -keyalg RSA -keysize 2048 -validity 10000

Record the store password and the key password. Keep the file out of the repository.

## 2. Register the key with Play

Play App Signing is enabled, so the upload key can be replaced. Export the certificate, then request an upload key reset in the Play Console under App integrity and upload it.

    keytool -export -rfc \
      -keystore upload.jks \
      -alias pyttogpanne-upload \
      -file upload-certificate.pem

Google has to authorise the reset. File it first, it is the longest lead time here.

## 3. Create the Play service account

Create a service account in Google Cloud Console, enable the Google Play Android Developer API, and download its JSON key. In the Play Console, invite the service account and grant it release permission for this app only, not account administration.

## 4. Set the secrets

Environment secrets, never repository secrets. A repository secret is readable from any branch.

    base64 -w0 upload.jks | gh secret set ANDROID_KEYSTORE_BASE64 --env google-play-testing
    gh secret set ANDROID_KEYSTORE_PASSWORD --env google-play-testing
    gh secret set ANDROID_KEY_ALIAS --env google-play-testing --body "pyttogpanne-upload"
    gh secret set ANDROID_KEY_PASSWORD --env google-play-testing
    gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON --env google-play-testing < play-service-account.json
    gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON --env google-play-production < play-service-account.json

The service account key goes in both environments because environment secrets do not cross environments. Promotion signs nothing, so it needs no keystore.

## 5. Environments

Both already exist. `google-play-testing` holds the build secrets, no reviewer, branch rule `main` only. `google-play-production` holds the service account key, requires you as reviewer, branch rule `main` only.

Both have `can_admins_bypass` true by default, so an admin can skip the approval. Set it false to make the gate bind you too.

## 6. First run

No dry run exists for a Play upload. Dispatch the Android release workflow manually from `main` with `track` set to `alpha`. The branch rules block a run from any other branch. That run also puts the current version into alpha.

## Production

The build workflow cannot reach production. Its first step rejects it, its dispatch input excludes it, and the `upload` lane refuses any track outside `internal`, `alpha` and `beta`. Production is reached only by `promote-production.yml`, gated by the `google-play-production` environment.

`from_track` defaults to `alpha`. Change it to `beta` when open testing starts.

## Known gaps

A failed upload cannot be retried. The version code is derived from the version, so a rerun builds the same one and Play rejects the duplicate. Check the Console for whether the bundle landed, and cut a new patch release if it did.

There is no `Gemfile.lock`, so `bundle install` re-resolves fastlane's dependencies each run. After the first successful run, commit a lockfile matching the resolved versions and flip both `ruby/setup-ruby` steps to `bundler-cache: true`.
