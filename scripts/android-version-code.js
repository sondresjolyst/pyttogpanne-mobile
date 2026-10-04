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
