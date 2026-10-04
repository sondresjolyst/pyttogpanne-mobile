# Android release bootstrap runbook

This runbook covers the one-time setup for the Android release pipeline. None of these steps can run in CI because they need Google credentials. Do them once, in order, before the pipeline can be used.

## 1. Generate the upload keystore

Run:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore upload.jks \
  -alias pyttogpanne-upload \
  -keyalg RSA -keysize 2048 -validity 10000
```

Keep the file out of the repository. `.gitignore` already ignores `*.jks`. Record the store password, the alias and the key password.

## 2. Register the key with Play

Play App Signing is already enabled, so Google holds the app signing key and the upload key can be replaced. In the Play Console, open App integrity and request an upload key reset, then upload the certificate exported from the keystore:

```bash
keytool -export -rfc \
  -keystore upload.jks \
  -alias pyttogpanne-upload \
  -file upload-certificate.pem
```

Google has to authorise the reset, so file this request first. It is the longest lead time in the whole setup.

## 3. Create the Play service account

In Google Cloud Console, create a service account and enable the Google Play Android Developer API. Create a JSON key for it. In the Play Console, invite the service account address and grant it release permission for this app only. Do not grant account administration. The worst case for a leaked key is then an unwanted testing track upload, which can be halted in the Console.

## 4. Add the repository secrets

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | output of `base64 -w0 upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `pyttogpanne-upload` |
| `ANDROID_KEY_PASSWORD` | key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | the whole service account JSON |

## 5. Create the production environment

Create an environment named `google-play-production` and add yourself as a required reviewer. Leave prevent self-review unchecked. With a single maintainer it would otherwise be impossible to approve a deployment.

## 6. First run

There is no dry run for a Play upload. Run the Android release workflow manually with `workflow_dispatch` and `track` set to `alpha` before any release depends on it. That run also puts the current version into alpha, which is otherwise skipped.

## 6.5. Pin the gem tree

There is no `Gemfile.lock`, because Ruby and bundler are not installed on the development machine. Until one exists, `bundle install` re-resolves fastlane's transitive dependencies on every run with no integrity pinning, inside the job that holds the upload keystore and the Play service account key. Close that window on the first successful run: open the run's `Install fastlane` step log, which ends with the resolved versions, or rerun that job with debug logging to capture the generated lockfile, then commit a `Gemfile.lock` matching it and flip the two `ruby/setup-ruby` steps to `bundler-cache: true`. The exposure in the meantime is narrow but real. The `bundle install` step carries no secrets in its environment, so a malicious gem would have to survive to the `bundle exec fastlane` step to reach the Play key.

## 7. Current state

Play holds version 1.0.0 at version code 1. Versions 1.0.1 through 1.0.4 were tagged but never uploaded and will not appear in the Console.

## 7.5. How production is reached

The build workflow cannot upload to production. Its first step fails the job if the resolved track is `production`, and its dispatch input offers only `internal`, `alpha` and `beta`. Production is reached only by running `promote-production.yml`, which is gated by the `google-play-production` environment and its required reviewer. Its `from_track` input defaults to `alpha`, which is correct while the build is on closed testing. Change that default to `beta` when open testing starts.

## 8. Expected failures

A version code equal to or below one Play already holds is rejected after the build completes, so derive it only with `node scripts/android-version-code.js`. A promotion naming a version code that is not on the source track fails inside fastlane after the approval is granted, which is a wrong input rather than a credential problem. A promotion with a non-numeric or zero version code fails immediately, before checkout, with an explicit error, because that input selects which build every user receives.
