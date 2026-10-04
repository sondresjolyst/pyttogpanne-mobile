# Android release pipeline

Date: 2026-10-04

## Goal

Build a signed Android App Bundle in CI and upload it to Google Play when
release-please publishes a release. Promotion to production stays a human
decision behind an approval gate.

## Constraints

These come from the current state of the project and were each verified
rather than assumed.

There is no Expo account. `~/.expo/state.json` holds only an anonymous
`uuid` with no `auth` block. This rules out `eas build` and `eas submit`,
because both authenticate against Expo even when the build runs locally.

There is no release keystore. No `.jks` or `.keystore` exists under the
home directory or `Documents`, there is no `~/.android`, and
`credentials.json` was never committed. `.gitignore` ignores both `/android`
and `*.jks`, so a keystore generated inside the prebuilt `android/app`
directory would have been lost when that directory was regenerated.

Play App Signing is enabled. The Play Console reports releases signed by
Play, so Google holds the app signing key and the upload key can be reset.

Version 1.0.0 is live on the closed testing track. The repository is at
1.0.4, and v1.0.2 through v1.0.4 were tagged without ever being uploaded.
Those versions will not appear in the Console, which is accepted.

The repository is public. GitHub hosted runners are therefore free, and
environments with protection rules are available without a paid plan.

## Non-goals

iOS builds. Store listing, screenshot and release note management. Any
automated promotion to production. Counting or storing how long a build has
been in a testing track.

## Tooling decisions

`fastlane supply` handles both upload and promotion. `r0adkll/upload-google-play`
was evaluated first and rejected because its inputs include no `versionCode`
and no promotion option, so it cannot move an existing build between tracks.
Play rejects re-uploading an existing `versionCode`, so promotion cannot be
emulated by uploading the same bundle twice.

Release signing uses the Android Gradle Plugin injected signing properties
rather than a patched `build.gradle`. AGP applies these to whatever variant
is being built and overrides any `signingConfig` in the build file, so the
Expo template can be regenerated freely.

```
android.injected.signing.store.file
android.injected.signing.store.password
android.injected.signing.store.key.alias
android.injected.signing.store.key.password
```

The `expo-signed` config plugin was rejected because it expects keystore
passwords as literal values in `app.json`. Gradle Play Publisher was
rejected because it is configured inside `build.gradle`, which
`expo prebuild` regenerates from a template.

`eas.json` becomes dead configuration, because nothing invokes EAS any more.
It stays in the repository in case an Expo account is added later. Its
production `EXPO_PUBLIC_API_URL` value remains the source for the workflow
environment variable.

## Workflows

### release.yml

Keeps its existing `push` trigger on `main`. A merge of the release pull
request is a human push, so the restriction on `GITHUB_TOKEN` not starting
new workflow runs does not apply. A `release: published` trigger would never
fire, because release-please publishes as `github-actions[bot]`.

A second job is gated on the reusable workflow's output so it runs only when
a release was actually created, not on every Dependabot merge.

```yaml
  android:
    needs: release-please
    if: needs.release-please.outputs.releases_created == 'true'
    uses: ./.github/workflows/android-release.yml
    with:
      track: alpha
    secrets:
      ANDROID_KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
      ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
      ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
      ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
      GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
```

Secrets are passed by name. `secrets: inherit` is not used, because it would
expose every repository secret to the called workflow.

### android-release.yml

Triggered by `workflow_call` and `workflow_dispatch`, with `track` as an
input defaulting to `alpha`. Moving to open testing later is a change to that
input rather than a redesign.

Steps run on `ubuntu-latest`:

1. Checkout with `persist-credentials: false`.
2. Node 23 with npm cache, then `npm ci`.
3. JDK 17 Temurin, pinned rather than relying on the runner default.
4. Compute `versionCode` from `expo.version` as `major*10000 + minor*100 + patch`
   and write it into `app.json` with `jq`. This happens on the runner only and
   is never committed.
5. `npx expo prebuild --platform android --no-install`.
6. Decode `ANDROID_KEYSTORE_BASE64` into `android/app/upload.jks`.
7. Write the four injected signing properties into `android/gradle.properties`.
8. `./gradlew :app:bundleRelease`.
9. `fastlane supply` with the service account key, the package name
   `no.pyttogpanne.app`, the computed `version_code`, and the `track` input.

`EXPO_PUBLIC_API_URL` is set to the production value currently held in
`eas.json`, because `prebuild` does not read EAS build profiles.

The built bundle is not uploaded as a workflow artifact, since the repository
is public.

### promote-production.yml

Triggered by `workflow_dispatch` with a `version_code` input. Bound to a
`google-play-production` environment carrying a required reviewer, which is
the approval gate. Runs `fastlane supply` with `--track_promote_to production`
and `--skip_upload_aab`.

Nothing needs to persist between the release run and this one, because
promotion references a `versionCode` that Play already holds.

Leave prevent self-review unchecked on that environment. With a single
maintainer it would otherwise be impossible to approve a deployment.

## Versioning

release-please continues to own `expo.version` in `app.json` through its
existing `extra-files` entry. `android.versionCode` is absent from `app.json`
and stays absent, since CI derives it. The 1.0.0 build in Play carries
`versionCode` 1, so the derived values clear it:

```
1.0.0 -> 10000
1.0.4 -> 10004
1.0.5 -> 10005
```

The scheme stays monotonic while minor and patch remain below 100.

## Secrets

`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
`ANDROID_KEY_PASSWORD` and `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.

Scope the Play service account to releasing to testing tracks for this app
only, not account administration. The worst case for a compromised release
path is then an unwanted alpha upload, which can be halted in the Console.

## Manual bootstrap

These need Google and Expo credentials and cannot run in CI.

1. Generate an upload keystore with `keytool`.
2. Request an upload key reset in the Play Console and register the new
   certificate.
3. Create a Google Cloud service account, enable the Play Developer API, and
   grant it release permission for this app in the Play Console.
4. Add the five repository secrets.
5. Create the `google-play-production` environment with a required reviewer.

## Verification

There is no dry run for a Play upload. `android-release.yml` carries
`workflow_dispatch` so the first run can be fired deliberately against the
alpha track before any release depends on it. That run also puts 1.0.4 into
alpha, which is otherwise skipped.

## Open risk

The injected signing properties are documented as `-P` command line
arguments. Writing the same keys into `gradle.properties` follows from Gradle
treating any entry there as a project property, but is not documented for
these specific keys. If the first run does not pick them up, the fallback is
to pass them as `-P` arguments, which is safe in logs because Actions masks
registered secrets.
