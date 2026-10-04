# Android release pipeline implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a signed Android App Bundle in CI on every release-please release, upload it to the Play alpha track, and allow promotion to production behind a GitHub approval gate.

**Architecture:** One tested Node module owns the only real logic, deriving a Play `versionCode` from the semantic version. Three thin workflows wrap it. `release.yml` gains a job gated on release-please's `releases_created` output, `android-release.yml` builds and uploads with the track as an input, and `promote-production.yml` promotes an existing build behind a required reviewer. Signing uses Android Gradle Plugin injected properties so the Expo-generated `build.gradle` is never patched.

**Tech Stack:** Expo SDK 57 prebuild, Gradle, fastlane supply, GitHub Actions, Jest.

**Spec:** `docs/superpowers/specs/2026-10-04-android-release-pipeline-design.md`

## Global Constraints

- There is no Expo account. No `eas` command may appear in any workflow.
- Package name is exactly `no.pyttogpanne.app`.
- Default Play track is `alpha`. Play's built-in tracks are `internal`, `alpha`, `beta`, `production`.
- CI uses Node `23` and JDK `17` with the `temurin` distribution.
- `versionCode` is `major*10000 + minor*100 + patch`. It stays monotonic only while minor and patch are below 100.
- Play already holds version 1.0.0 at `versionCode` 1. Every upload must exceed it.
- The repository is public. Never upload the built `.aab` as a workflow artifact.
- Secrets are passed by name. `secrets: inherit` is forbidden.
- Secret names are exactly `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`, `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.
- `EXPO_PUBLIC_API_URL` for production builds is `https://pyttogpanne-api.prod.tumogroup.com/api`.
- Every action is pinned to a commit SHA with the version in a trailing comment, matching the existing workflows.
- The four signing property names are exactly `android.injected.signing.store.file`, `android.injected.signing.store.password`, `android.injected.signing.store.key.alias`, `android.injected.signing.store.key.password`.
- Never interpolate an expression directly inside a `run:` block. Pass values through `env:` instead. This repository is public and interpolation in a shell body is a script injection vector.
- Commit messages contain no em dashes and no semicolons, per `CLAUDE.md`.
- fastlane is pinned to exactly `2.240.1`. There is no `Gemfile.lock`, so CI uses `bundler-cache: false` plus an explicit `bundle install`.
- Every `ruby/setup-ruby` step must set `ruby-version: '3.3'`. The action fails when it can find no version source, and this repository provides none.
- Local tooling available for verification is `node`, `npx`, `jq` 1.8.2 and `git`. Ruby, bundler and PyYAML are absent. Validate YAML with `npx -y js-yaml` piped to `jq`, never with `python -c "import yaml"`.

## Review Focus

- `1.0.100` and `1.1.0` both map to `versionCode` 10100, silently shipping the wrong build. The script must reject minor or patch above 99 instead of colliding. Covered in Task 1.
- A prerelease version such as `1.0.5-rc.1` in `app.json` must fail loudly rather than produce `NaN`, which Play would reject with an opaque error. Covered in Task 1.
- A missing `expo.version` key must fail with a message naming `app.json`, not a type error. Covered in Task 1.
- A `versionCode` equal to or below what Play already holds is rejected by Play after the whole build has run. Task 2 surfaces this on the deliberate dispatch run, and the Task 5 runbook records the current live value.
- A promote run given a `version_code` absent from the source track fails inside fastlane after the approval has been granted. The Task 5 runbook records this as an expected failure so it is not mistaken for a credential fault.

---

### Task 1: versionCode derivation

The only logic in the pipeline, so it is the only part with real tests. Written as CommonJS so CI can run it with plain `node` and Jest can require it without TypeScript interop.

**Files:**
- Create: `scripts/android-version-code.js`
- Create: `scripts/android-version-code.test.js`
- Modify: `package.json` jest `testMatch`

**Interfaces:**
- Consumes: nothing.
- Produces: `versionCodeFromVersion(version: string) => number`, exported as `module.exports = { versionCodeFromVersion }`. Running the file directly prints the code for `app.json` to stdout with no trailing newline. Task 2 depends on both.

- [ ] **Step 1: Allow Jest to see JavaScript tests**

The current `testMatch` only lists TypeScript. Add the JavaScript pattern.

```json
    "testMatch": [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.test.js"
    ]
```

- [ ] **Step 2: Write the failing test**

Create `scripts/android-version-code.test.js`:

```js
const { versionCodeFromVersion } = require('./android-version-code');

describe('versionCodeFromVersion', () => {
  it('maps the version already live in Play', () => {
    expect(versionCodeFromVersion('1.0.0')).toBe(10000);
  });

  it('maps the current repository version', () => {
    expect(versionCodeFromVersion('1.0.4')).toBe(10004);
  });

  it('increases with the patch component', () => {
    expect(versionCodeFromVersion('1.0.5')).toBe(10005);
  });

  it('increases with the minor component', () => {
    expect(versionCodeFromVersion('1.1.0')).toBe(10100);
  });

  it('increases with the major component', () => {
    expect(versionCodeFromVersion('2.0.0')).toBe(20000);
  });

  it('clears the version code already live in Play', () => {
    expect(versionCodeFromVersion('1.0.0')).toBeGreaterThan(1);
  });

  it('rejects a patch component that would collide with the next minor', () => {
    expect(() => versionCodeFromVersion('1.0.100')).toThrow(
      'minor and patch must be below 100',
    );
  });

  it('rejects a minor component that would collide with the next major', () => {
    expect(() => versionCodeFromVersion('1.100.0')).toThrow(
      'minor and patch must be below 100',
    );
  });

  it('rejects a prerelease version', () => {
    expect(() => versionCodeFromVersion('1.0.5-rc.1')).toThrow(
      'major.minor.patch',
    );
  });

  it('rejects a two component version', () => {
    expect(() => versionCodeFromVersion('1.0')).toThrow('major.minor.patch');
  });

  it('names app.json when the version is missing', () => {
    expect(() => versionCodeFromVersion(undefined)).toThrow('app.json');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest scripts/android-version-code.test.js`

Expected: FAIL, cannot find module `./android-version-code`.

- [ ] **Step 4: Write the implementation**

Create `scripts/android-version-code.js`:

```js
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

function versionCodeFromVersion(version) {
  if (typeof version !== 'string' || version === '') {
    throw new Error('expo.version is missing from app.json');
  }

  const match = VERSION_PATTERN.exec(version);
  if (match === null) {
    throw new Error(
      `expo.version must be a plain major.minor.patch version, got "${version}"`,
    );
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (minor > 99 || patch > 99) {
    throw new Error(
      `Cannot derive a version code from "${version}", minor and patch must be below 100`,
    );
  }

  return major * 10000 + minor * 100 + patch;
}

module.exports = { versionCodeFromVersion };

if (require.main === module) {
  const { expo } = require('../app.json');
  process.stdout.write(String(versionCodeFromVersion(expo && expo.version)));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest scripts/android-version-code.test.js`

Expected: PASS, 11 tests.

- [ ] **Step 6: Verify the command line entry point**

Run: `node scripts/android-version-code.js`

Expected: prints `10004` with no newline, matching `expo.version` 1.0.4 in `app.json`.

- [ ] **Step 7: Confirm the existing suite still passes**

Run: `npm test`

Expected: the three pre-existing suites plus this one, all passing.

- [ ] **Step 8: Confirm the typecheck is unaffected**

Run: `npx tsc --noEmit`

Expected: no output, exit 0.

- [ ] **Step 9: Commit**

```bash
git add scripts/android-version-code.js scripts/android-version-code.test.js package.json
git commit -m "feat: derive the Play version code from the app version"
```

---

### Task 2: build and upload workflow

**Files:**
- Create: `Gemfile`
- Create: `fastlane/Fastfile`
- Create: `.github/workflows/android-release.yml`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `node scripts/android-version-code.js` from Task 1.
- Produces: a reusable workflow callable as `./.github/workflows/android-release.yml` taking a `track` input and the five secrets by name. Task 3 calls it. The `upload` fastlane lane taking `track` and `json_key`. Task 4 adds a second lane to the same `Fastfile`.

- [ ] **Step 1: Declare the fastlane dependency**

Create `Gemfile`, pinning the version exactly:

```ruby
source "https://rubygems.org"

gem "fastlane", "2.240.1"
```

- [ ] **Step 2: Do not generate a lockfile**

There is deliberately no `Gemfile.lock`. Ruby and bundler are absent from the development machine, so no lockfile can be generated locally, and `bundler-cache` keys on one. The exact version pin in Step 1 is what provides determinism instead. CI installs with an explicit `bundle install` step and `bundler-cache: false`.

Do not run `bundle lock`. It will fail with `bundle: command not found`.

- [ ] **Step 3: Keep fastlane's generated noise out of git**

Append to `.gitignore`:

```
fastlane/report.xml
fastlane/Preview.html
fastlane/test_output
```

- [ ] **Step 4: Write the upload lane**

Create `fastlane/Fastfile`:

```ruby
default_platform(:android)

platform :android do
  desc "Upload the release app bundle to a Play track"
  lane :upload do |options|
    upload_to_play_store(
      package_name: "no.pyttogpanne.app",
      track: options[:track],
      aab: "android/app/build/outputs/bundle/release/app-release.aab",
      json_key: options[:json_key],
      release_status: "completed",
      skip_upload_metadata: true,
      skip_upload_changelogs: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
end
```

`version_code` is deliberately not passed here. When uploading an app bundle, fastlane reads it from the bundle itself, and supplying it as well can conflict.

- [ ] **Step 5: Write the workflow**

Create `.github/workflows/android-release.yml`:

```yaml
name: 📦 Android release

on:
  workflow_call:
    inputs:
      track:
        description: Play track to upload to
        type: string
        required: false
        default: alpha
    secrets:
      ANDROID_KEYSTORE_BASE64:
        required: true
      ANDROID_KEYSTORE_PASSWORD:
        required: true
      ANDROID_KEY_ALIAS:
        required: true
      ANDROID_KEY_PASSWORD:
        required: true
      GOOGLE_PLAY_SERVICE_ACCOUNT_JSON:
        required: true
  workflow_dispatch:
    inputs:
      track:
        description: Play track to upload to
        type: choice
        required: false
        default: alpha
        options:
          - internal
          - alpha
          - beta

permissions: {}

jobs:
  build:
    name: Build and upload
    runs-on: ubuntu-latest
    permissions:
      contents: read
    env:
      EXPO_PUBLIC_API_URL: https://pyttogpanne-api.prod.tumogroup.com/api
    steps:
      - name: Reject a direct production upload
        env:
          TRACK: ${{ inputs.track }}
        run: |
          if [ "$TRACK" = "production" ]; then
            echo "::error::This workflow cannot upload to production. Use promote-production.yml, which is gated by the google-play-production environment."
            exit 1
          fi

      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: '23'
          cache: 'npm'

      - uses: actions/setup-java@b6effb05e454b25005698d916606bdc6ffcbf961 # v5
        with:
          distribution: temurin
          java-version: '17'

      - uses: ruby/setup-ruby@14594264cd68ce8a2345dd349bc3d138a4ef85c8 # v1.327.0
        with:
          ruby-version: '3.3'
          bundler-cache: false

      - name: Install fastlane
        run: bundle install --jobs 4 --retry 3

      - name: Install dependencies
        run: npm ci

      - name: Derive the version code
        id: version
        run: echo "code=$(node scripts/android-version-code.js)" >> "$GITHUB_OUTPUT"

      - name: Write the version code into app.json
        env:
          VERSION_CODE: ${{ steps.version.outputs.code }}
        run: |
          tmp="$(mktemp)"
          jq --argjson code "$VERSION_CODE" '.expo.android.versionCode = $code' app.json > "$tmp"
          mv "$tmp" app.json

      - name: Generate the native project
        run: npx expo prebuild --platform android --no-install

      - name: Restore the upload keystore
        env:
          KEYSTORE_BASE64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
        run: printf '%s' "$KEYSTORE_BASE64" | base64 -d > android/app/upload.jks

      - name: Configure release signing
        env:
          STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          {
            echo "android.injected.signing.store.file=$PWD/android/app/upload.jks"
            echo "android.injected.signing.store.password=$STORE_PASSWORD"
            echo "android.injected.signing.store.key.alias=$KEY_ALIAS"
            echo "android.injected.signing.store.key.password=$KEY_PASSWORD"
          } >> android/gradle.properties

      - name: Build the app bundle
        working-directory: android
        run: |
          chmod +x gradlew
          ./gradlew :app:bundleRelease

      - name: Upload to Play
        env:
          PLAY_JSON: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          TRACK: ${{ inputs.track }}
        run: |
          key="$(mktemp)"
          trap 'rm -f "$key"' EXIT
          printf '%s' "$PLAY_JSON" > "$key"
          bundle exec fastlane android upload track:"$TRACK" json_key:"$key"
```

The keystore and the service account key are written to the runner filesystem rather than passed as arguments, so neither appears in a process listing. The service account key is removed by a `trap` so it goes even if fastlane fails.

The first step is a security gate, not boilerplate. Without it, anyone with write access could dispatch this workflow with `track: production` and ship straight to users, bypassing the `google-play-production` environment and the required reviewer that Task 4 exists to provide. The `choice` type closes the dispatch path, and the guard closes the `workflow_call` path, where `choice` is not a valid input type. It must stay the first step so it fails before any secret is decoded.

The spec records an open risk here. The `-P` command line form of the injected signing properties is documented, while writing the same keys into `gradle.properties` is inferred from Gradle treating any entry there as a project property. If the first run produces an unsigned or debug-signed bundle, or Gradle reports no signing config for the release variant, switch the build step to pass them as arguments instead:

```yaml
      - name: Build the app bundle
        working-directory: android
        env:
          STORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
        run: |
          chmod +x gradlew
          ./gradlew :app:bundleRelease \
            -Pandroid.injected.signing.store.file="$PWD/app/upload.jks" \
            -Pandroid.injected.signing.store.password="$STORE_PASSWORD" \
            -Pandroid.injected.signing.store.key.alias="$KEY_ALIAS" \
            -Pandroid.injected.signing.store.key.password="$KEY_PASSWORD"
```

That form is safe in logs because Actions masks registered secrets. If you take it, drop the "Configure release signing" step so the properties are not set twice.

- [ ] **Step 6: Verify the workflow parses as YAML**

Run:

```bash
npx -y js-yaml .github/workflows/android-release.yml > /dev/null && echo ok
```

Expected: `ok`. PyYAML is not available on this machine, because the system Python is externally managed under PEP 668. `js-yaml` via `npx` and `jq` cover every YAML check in this plan and need no install.

`ruby-version` is mandatory on the `ruby/setup-ruby` step. The action fails when it can find no version from `ruby-version`, `.ruby-version`, `.tool-versions`, or a `ruby` directive in the `Gemfile`, and this repository has none of those.

- [ ] **Step 7: Verify no shell body interpolates a value**

Run:

```bash
npx -y js-yaml .github/workflows/android-release.yml \
  | jq -r '[.jobs[].steps[] | select(.run != null) | select(.run | test("\\$\\{\\{")) | (.name // "<unnamed>")] | if length == 0 then "clean" else "BAD: " + join(", ") end'
```

Expected: `clean`. Every expression must sit under `env:`, `with:` or `if:`, never inside a `run:` body. If a step is listed, move the value into `env:` and reference the shell variable instead. Run the same check against the other two workflows as they are created.

- [ ] **Step 8: Commit**

```bash
git add Gemfile fastlane/Fastfile .github/workflows/android-release.yml .gitignore
git commit -m "feat: add the Android build and Play upload workflow"
```

---

### Task 3: gate the workflow on an actual release

**Files:**
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: the reusable workflow from Task 2, and `releases_created` from the existing `equinor/ops-actions` release-please job.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Add the gated job**

Append to the `jobs:` block of `.github/workflows/release.yml`, as a sibling of `release-please`:

```yaml
  android:
    name: Android release
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

The existing `push` trigger on `main` is kept. A merge of the release pull request is a human push, so the rule that `GITHUB_TOKEN` events do not start new workflow runs does not apply. A `release: published` trigger would never fire, because release-please publishes as `github-actions[bot]`.

- [ ] **Step 2: Verify the workflow parses and both jobs exist**

Run:

```bash
npx -y js-yaml .github/workflows/release.yml | jq -r '.jobs | keys | sort | join(",")'
```

Expected: `android,release-please`.

- [ ] **Step 3: Confirm the gate condition is present**

Run: `grep -n "releases_created == 'true'" .github/workflows/release.yml`

Expected: one match. Without it the Android job runs on every Dependabot merge.

- [ ] **Step 4: Confirm secrets inherit is absent**

Run: `grep -rn 'secrets: inherit' .github/workflows/ || echo clean`

Expected: `clean`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "feat: upload to Play when release-please creates a release"
```

---

### Task 4: production promotion behind an approval gate

**Files:**
- Modify: `fastlane/Fastfile`
- Create: `.github/workflows/promote-production.yml`

**Interfaces:**
- Consumes: the `Fastfile` from Task 2.
- Produces: a `promote_production` lane taking `version_code`, `from_track` and `json_key`.

- [ ] **Step 1: Add the promotion lane**

Append inside the `platform :android do` block of `fastlane/Fastfile`:

```ruby
  desc "Promote a version code that is already on a testing track to production"
  lane :promote_production do |options|
    upload_to_play_store(
      package_name: "no.pyttogpanne.app",
      version_code: options[:version_code].to_i,
      track: options[:from_track],
      track_promote_to: "production",
      track_promote_release_status: "completed",
      json_key: options[:json_key],
      skip_upload_aab: true,
      skip_upload_apk: true,
      skip_upload_metadata: true,
      skip_upload_changelogs: true,
      skip_upload_images: true,
      skip_upload_screenshots: true
    )
  end
```

No artifact is needed, because promotion references a `versionCode` Play already holds. Play automatically deactivates the release from its previous track on promote.

- [ ] **Step 2: Write the promotion workflow**

Create `.github/workflows/promote-production.yml`:

```yaml
name: 🚀 Promote to production

on:
  workflow_dispatch:
    inputs:
      version_code:
        description: Version code already live on the source track
        type: string
        required: true
      from_track:
        description: Track to promote from
        type: string
        required: false
        default: beta

permissions: {}

jobs:
  promote:
    name: Promote
    runs-on: ubuntu-latest
    environment: google-play-production
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - uses: ruby/setup-ruby@14594264cd68ce8a2345dd349bc3d138a4ef85c8 # v1.327.0
        with:
          ruby-version: '3.3'
          bundler-cache: false

      - name: Install fastlane
        run: bundle install --jobs 4 --retry 3

      - name: Promote
        env:
          PLAY_JSON: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          VERSION_CODE: ${{ inputs.version_code }}
          FROM_TRACK: ${{ inputs.from_track }}
        run: |
          key="$(mktemp)"
          trap 'rm -f "$key"' EXIT
          printf '%s' "$PLAY_JSON" > "$key"
          bundle exec fastlane android promote_production \
            version_code:"$VERSION_CODE" \
            from_track:"$FROM_TRACK" \
            json_key:"$key"
```

The `environment: google-play-production` line is the approval gate. The required reviewer is configured in repository settings, not here. Nothing counts days. The wait is however long it takes a human to approve.

- [ ] **Step 3: Verify the workflow parses and the environment is bound**

Run:

```bash
npx -y js-yaml .github/workflows/promote-production.yml | jq -r '.jobs.promote.environment'
```

Expected: `google-play-production`.

Also run the interpolation check from Task 2 Step 7 against this file, substituting its path.

- [ ] **Step 4: Verify the Fastfile structure**

Ruby is absent from the development machine, so `ruby -c` and `bundle exec fastlane lanes` are both unavailable. Use a structural check:

```bash
grep -q 'platform :android do' fastlane/Fastfile \
  && grep -q 'lane :upload do' fastlane/Fastfile \
  && grep -q 'lane :promote_production do' fastlane/Fastfile \
  && [ "$(grep -c '^  lane :' fastlane/Fastfile)" = "2" ] \
  && [ "$(grep -vE '^[[:space:]]*$' fastlane/Fastfile | tail -1)" = "end" ] \
  && echo "structure ok"
```

Expected: `structure ok`. This is weaker than a syntax check. A genuine Ruby syntax error will surface on the first CI run rather than locally. That gap is accepted.

- [ ] **Step 5: Commit**

```bash
git add fastlane/Fastfile .github/workflows/promote-production.yml
git commit -m "feat: add a gated production promotion workflow"
```

---

### Task 5: bootstrap runbook

The pipeline cannot run until these are done, and none of them can run in CI because they need Google credentials. Writing them down is part of the deliverable, not an afterthought.

**Files:**
- Create: `docs/android-release-runbook.md`

**Interfaces:**
- Consumes: the secret names and environment name from Tasks 2, 3 and 4.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the runbook**

Create `docs/android-release-runbook.md` with the following content.

Section one, generate the upload keystore:

    keytool -genkeypair -v -storetype PKCS12 \
      -keystore upload.jks \
      -alias pyttogpanne-upload \
      -keyalg RSA -keysize 2048 -validity 10000

Keep the file out of the repository. `.gitignore` already ignores `*.jks`. Record the store password, the alias and the key password.

Section two, register the key with Play. Play App Signing is already enabled, so Google holds the app signing key and the upload key can be replaced. In the Play Console, open App integrity and request an upload key reset, then upload the certificate exported from the keystore:

    keytool -export -rfc \
      -keystore upload.jks \
      -alias pyttogpanne-upload \
      -file upload-certificate.pem

Google has to authorise the reset, so file this request first. It is the longest lead time in the whole setup.

Section three, create the Play service account. In Google Cloud Console, create a service account and enable the Google Play Android Developer API. Create a JSON key for it. In the Play Console, invite the service account address and grant it release permission for this app only. Do not grant account administration. The worst case for a leaked key is then an unwanted testing track upload, which can be halted in the Console.

Section four, add the repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | output of `base64 -w0 upload.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | `pyttogpanne-upload` |
| `ANDROID_KEY_PASSWORD` | key password |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | the whole service account JSON |

Section five, create the production environment. Create an environment named `google-play-production` and add yourself as a required reviewer. Leave prevent self-review unchecked. With a single maintainer it would otherwise be impossible to approve a deployment.

Section six, first run. There is no dry run for a Play upload. Run the Android release workflow manually with `workflow_dispatch` and `track` set to `alpha` before any release depends on it. That run also puts the current version into alpha, which is otherwise skipped.

Section six point five, pin the gem tree. There is no `Gemfile.lock`, because Ruby and bundler are not installed on the development machine. Until one exists, `bundle install` re-resolves fastlane's transitive dependencies on every run with no integrity pinning, inside the job that holds the upload keystore and the Play service account key. Close that window on the first successful run: open the run's `Install fastlane` step log, which ends with the resolved versions, or rerun that job with debug logging to capture the generated lockfile, then commit a `Gemfile.lock` matching it and flip the two `ruby/setup-ruby` steps to `bundler-cache: true`. The exposure in the meantime is narrow but real: the `bundle install` step carries no secrets in its environment, so a malicious gem would have to survive to the `bundle exec fastlane` step to reach the Play key.

Section seven, current state. Play holds version 1.0.0 at version code 1. Versions 1.0.1 through 1.0.4 were tagged but never uploaded and will not appear in the Console.

Section eight, expected failures. A version code equal to or below one Play already holds is rejected after the build completes, so derive it only with `node scripts/android-version-code.js`. A promotion naming a version code that is not on the source track fails inside fastlane after the approval is granted, which is a wrong input rather than a credential problem.

- [ ] **Step 2: Verify the secret names match the workflows exactly**

Run:

```bash
for s in ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD GOOGLE_PLAY_SERVICE_ACCOUNT_JSON; do
  if grep -q "$s" docs/android-release-runbook.md && grep -rq "$s" .github/workflows/; then echo "$s ok"; else echo "$s MISMATCH"; fi
done
```

Expected: five `ok` lines. A typo here costs a failed release run to discover.

- [ ] **Step 3: Commit**

```bash
git add docs/android-release-runbook.md
git commit -m "docs: add the Android release bootstrap runbook"
```
