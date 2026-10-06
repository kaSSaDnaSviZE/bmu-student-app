import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Access and refresh tokens live in secure storage.
/// Language and theme live in shared preferences only.
class TokenStore {
  TokenStore({FlutterSecureStorage? secureStorage, SharedPreferences? preferences})
      : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _preferences = preferences;

  final FlutterSecureStorage _secureStorage;
  SharedPreferences? _preferences;

  static const sessionKey = 'bmu_session_json';
  static const langKey = 'bmu_lang';
  static const themeKey = 'bmu_theme';

  Future<SharedPreferences> _prefs() async => _preferences ??= await SharedPreferences.getInstance();

  Future<String?> readSessionJson() => _secureStorage.read(key: sessionKey);

  Future<void> writeSessionJson(String? value) async {
    if (value == null || value.isEmpty) {
      await _secureStorage.delete(key: sessionKey);
      return;
    }
    await _secureStorage.write(key: sessionKey, value: value);
  }

  Future<String?> readLang() async => (await _prefs()).getString(langKey);

  Future<void> writeLang(String value) async {
    await (await _prefs()).setString(langKey, value);
  }

  Future<String?> readTheme() async => (await _prefs()).getString(themeKey);

  Future<void> writeTheme(String value) async {
    await (await _prefs()).setString(themeKey, value);
  }
}
