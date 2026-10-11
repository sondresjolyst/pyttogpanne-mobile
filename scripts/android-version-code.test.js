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
