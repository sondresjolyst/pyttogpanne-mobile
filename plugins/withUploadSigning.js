const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const SIGNING_CONFIG = `
        upload {
            if (project.hasProperty('PYTTOGPANNE_UPLOAD_STORE_FILE')) {
                storeFile file(PYTTOGPANNE_UPLOAD_STORE_FILE)
                storePassword PYTTOGPANNE_UPLOAD_STORE_PASSWORD
                keyAlias PYTTOGPANNE_UPLOAD_KEY_ALIAS
                keyPassword PYTTOGPANNE_UPLOAD_KEY_PASSWORD
            }
        }
`;

/**
 * Signs release builds with the upload key when its credentials are present, and falls back to
 * the debug key when they are not, so a checkout without the keystore still builds.
 *
 * Credentials belong in the Gradle home properties file, never in this repo:
 *
 *   PYTTOGPANNE_UPLOAD_STORE_FILE, PYTTOGPANNE_UPLOAD_STORE_PASSWORD,
 *   PYTTOGPANNE_UPLOAD_KEY_ALIAS, PYTTOGPANNE_UPLOAD_KEY_PASSWORD
 */
const withUploadSigning = config => {
    config = withAppBuildGradle(config, gradleConfig => {
        let contents = gradleConfig.modResults.contents;

        if (!contents.includes('upload {')) {
            contents = contents.replace(/signingConfigs \{\n/, `signingConfigs {\n${SIGNING_CONFIG}`);
        }

        contents = contents.replace(
            /(release \{[^}]*?)signingConfig signingConfigs\.debug/s,
            "$1signingConfig project.hasProperty('PYTTOGPANNE_UPLOAD_STORE_FILE') ? signingConfigs.upload : signingConfigs.debug",
        );

        gradleConfig.modResults.contents = contents;
        return gradleConfig;
    });

    return withGradleProperties(config, gradleConfig => {
        const abis = gradleConfig.modResults.find(
            item => item.type === 'property' && item.key === 'reactNativeArchitectures',
        );
        if (abis) abis.value = 'armeabi-v7a,arm64-v8a';
        return gradleConfig;
    });
};

module.exports = withUploadSigning;
