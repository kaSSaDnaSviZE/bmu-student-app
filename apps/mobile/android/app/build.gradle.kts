plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

// Release signing:
// - Never commit a keystore or store password.
// - Release builds do NOT use the debug keystore unless the local-only flag
//   BMU_ALLOW_DEBUG_SIGNING=true is set (Gradle property or environment variable).
//   Example (local only): ./gradlew assembleRelease -PBMU_ALLOW_DEBUG_SIGNING=true
// - Provide an upload key via Gradle properties or the same-named environment variables:
//     BMU_UPLOAD_STORE_FILE
//     BMU_UPLOAD_STORE_PASSWORD
//     BMU_UPLOAD_KEY_ALIAS
//     BMU_UPLOAD_KEY_PASSWORD
//   Example: ./gradlew assembleRelease -PBMU_UPLOAD_STORE_FILE=/secure/upload.jks \
//     -PBMU_UPLOAD_STORE_PASSWORD=... -PBMU_UPLOAD_KEY_ALIAS=upload -PBMU_UPLOAD_KEY_PASSWORD=...
// - Play submissions in 2026 must verify target API 36. Do not hard-code compileSdk.
//   Override only when the installed Flutter compileSdk supports it:
//     -Pbmu.targetSdk=36
//   Otherwise targetSdk stays flutter.targetSdkVersion. See gradle.properties and RELEASE.md.

val bmuAllowDebugSigning =
    ((findProperty("BMU_ALLOW_DEBUG_SIGNING") as? String)?.equals("true", ignoreCase = true) == true) ||
        (System.getenv("BMU_ALLOW_DEBUG_SIGNING")?.equals("true", ignoreCase = true) == true)

val bmuUploadStoreFile =
    (findProperty("BMU_UPLOAD_STORE_FILE") as? String)?.takeIf { it.isNotBlank() }
        ?: System.getenv("BMU_UPLOAD_STORE_FILE")?.takeIf { it.isNotBlank() }

val bmuUploadStorePassword =
    (findProperty("BMU_UPLOAD_STORE_PASSWORD") as? String)?.takeIf { it.isNotBlank() }
        ?: System.getenv("BMU_UPLOAD_STORE_PASSWORD")?.takeIf { it.isNotBlank() }

val bmuUploadKeyAlias =
    (findProperty("BMU_UPLOAD_KEY_ALIAS") as? String)?.takeIf { it.isNotBlank() }
        ?: System.getenv("BMU_UPLOAD_KEY_ALIAS")?.takeIf { it.isNotBlank() }

val bmuUploadKeyPassword =
    (findProperty("BMU_UPLOAD_KEY_PASSWORD") as? String)?.takeIf { it.isNotBlank() }
        ?: System.getenv("BMU_UPLOAD_KEY_PASSWORD")?.takeIf { it.isNotBlank() }

android {
    namespace = "az.edu.bmu.bmu_student_app"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "az.edu.bmu.bmu_student_app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = (findProperty("bmu.targetSdk") as? String)?.toInt() ?: flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (!bmuUploadStoreFile.isNullOrBlank()) {
            create("release") {
                storeFile = file(bmuUploadStoreFile)
                storePassword = bmuUploadStorePassword
                keyAlias = bmuUploadKeyAlias
                keyPassword = bmuUploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            // Unsigned unless an upload keystore is provided. Debug signing is local-only.
            if (!bmuUploadStoreFile.isNullOrBlank()) {
                signingConfig = signingConfigs.getByName("release")
            } else if (bmuAllowDebugSigning) {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
