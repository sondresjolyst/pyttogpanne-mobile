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

These are environment secrets, not repository secrets. Create them inside the environments from section 5, never at repository level. A repository secret is readable by a workflow on any branch, which would let a pushed branch read the upload keystore without passing any gate.

Add all five to `google-play-testing`:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | output of `base64 -w0 upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `pyttogpanne-upload` |
| `ANDROID_KEY_PASSWORD` | key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | the whole service account JSON |

Add one to `google-play-production`:

| Secret | Value |
| --- | --- |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | the same service account JSON |

Promotion moves a build that Play already holds, so it signs nothing and needs no keystore. The service account key is deliberately duplicated, because environment secrets do not cross environments.

## 5. Create the two environments

Both already exist. This section records what they are for and how they are configured, so the settings can be checked or rebuilt.

`google-play-testing` holds the five secrets the build needs. It has no required reviewer, because an alpha release on every release-please release is meant to be automatic. Its deployment branch rule allows `main` only.

`google-play-production` gates promotion. It has you as a required reviewer, with prevent self-review left off, because with a single maintainer it would otherwise be impossible to approve a deployment. Its deployment branch rule also allows `main` only.

The branch rules are what make the secrets unreachable from a pushed branch. A workflow on another branch cannot deploy to either environment, so it cannot read the keystore or the Play key, and a branch that deletes the `environment:` line gets no secrets at all rather than falling back to repository scope.

Both environments were created with `can_admins_bypass` at its default of true, so a repository admin can skip the production approval. Set it to false if you want the gate to bind you as well.

Branch protection on `main` is still worth enabling, so the workflow files themselves cannot be changed without review, but it is no longer what keeps the credentials out of reach.

## 6. First run

There is no dry run for a Play upload. Run the Android release workflow manually with `workflow_dispatch` and `track` set to `alpha` before any release depends on it. That run also puts the current version into alpha, which is otherwise skipped.

## 6.5. Pin the gem tree

There is no `Gemfile.lock`, because Ruby and bundler are not installed on the development machine. Until one exists, `bundle install` re-resolves fastlane's transitive dependencies on every run with no integrity pinning, inside the job that holds the upload keystore and the Play service account key. Close that window on the first successful run: open the run's `Install fastlane` step log, which ends with the resolved versions, or rerun that job with debug logging to capture the generated lockfile, then commit a `Gemfile.lock` matching it and flip the two `ruby/setup-ruby` steps to `bundler-cache: true`. The exposure in the meantime is narrow but real. The `bundle install` step carries no secrets in its environment, so a malicious gem would have to survive to the `bundle exec fastlane` step to reach the Play key.

## 7. Current state

Play holds version 1.0.0 at version code 1. Versions 1.0.1 through 1.0.4 were tagged but never uploaded and will not appear in the Console.

## 7.5. How production is reached

The build workflow cannot upload to production. Three independent things stop it. Its first step fails the job if the resolved track is `production`. Its dispatch input offers only `internal`, `alpha` and `beta`. And the `upload` lane in `fastlane/Fastfile` refuses any track outside that same list, which also closes the default, because `upload_to_play_store` would otherwise fall back to `production` if the track argument went missing.

Production is reached only by running `promote-production.yml`, which is gated by the `google-play-production` environment and its required reviewer. A workflow pushed to another branch cannot route around this, because both environments restrict deployments to `main` and the secrets live only inside them. Deleting the `environment:` line on a branch does not help, it just means no credentials at all.

Its `from_track` input defaults to `alpha`, which is correct while the build is on closed testing. Change that default to `beta` when open testing starts.

## 8. Expected failures

A version code equal to or below one Play already holds is rejected after the build completes, so derive it only with `node scripts/android-version-code.js`. A promotion naming a version code that is not on the source track fails inside fastlane after the approval is granted, which is a wrong input rather than a credential problem. A promotion with a non-numeric or zero version code fails immediately, before checkout, with an explicit error, because that input selects which build every user receives.

A failed upload is the one failure that re-running the job cannot fix. The version code is derived from `expo.version`, so a retry rebuilds the identical version code, and Play rejects it as a duplicate of whatever it already has. Before retrying, check the Play Console to see whether the bundle actually landed on the track. If it did, do not retry at all, cut a new patch release instead, because the version code for the failed run is now spent and can never be uploaded again.
