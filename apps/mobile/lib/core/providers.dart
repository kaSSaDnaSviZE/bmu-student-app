import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'models.dart';
import 'repository.dart';
import 'token_store.dart';

class SessionController extends ChangeNotifier {
  SessionController({TokenStore? store}) : _store = store;

  Session? session;
  String lang = 'en';
  ThemeMode themeMode = ThemeMode.system;

  TokenStore? _store;
  bool _hydrated = false;

  TokenStore get _tokenStore => _store ??= TokenStore();

  /// Restores tokens, language, and theme. The constructor does not touch plugins.
  Future<void> hydrate() async {
    if (_hydrated) return;
    _hydrated = true;
    try {
      final store = _tokenStore;
      final raw = await store.readSessionJson();
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw);
        if (decoded is Map) {
          session = Session.fromJson(Map<String, dynamic>.from(decoded));
        }
      }
      final storedLang = await store.readLang();
      if (storedLang != null &&
          (storedLang == 'en' || storedLang == 'az' || storedLang == 'ru')) {
        lang = storedLang;
      }
      themeMode = switch (await store.readTheme()) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      };
      notifyListeners();
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    } catch (_) {
      return;
    }
  }

  void setSession(Session? value) {
    session = value;
    notifyListeners();
    unawaited(_persistSession(value));
  }

  void setLang(String value) {
    lang = value;
    notifyListeners();
    unawaited(_persistLang(value));
  }

  void setTheme(ThemeMode value) {
    themeMode = value;
    notifyListeners();
    unawaited(_persistTheme(value));
  }

  Future<void> _persistSession(Session? value) async {
    try {
      await _tokenStore.writeSessionJson(value == null ? null : jsonEncode(value.toJson()));
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    }
  }

  Future<void> _persistLang(String value) async {
    try {
      await _tokenStore.writeLang(value);
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    }
  }

  Future<void> _persistTheme(ThemeMode value) async {
    try {
      await _tokenStore.writeTheme(value.name);
    } on MissingPluginException {
      return;
    } on PlatformException {
      return;
    }
  }
}

final sessionProvider = ChangeNotifierProvider<SessionController>((ref) => SessionController());

const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://127.0.0.1:3000');

final repositoryProvider = Provider<BmuRepository>((ref) {
  final session = ref.watch(sessionProvider);
  return ApiRepository(
    baseUrl: apiBaseUrl,
    readSession: () => session.session,
    writeSession: session.setSession,
  );
});

final dashboardProvider = FutureProvider<Dashboard>((ref) => ref.watch(repositoryProvider).dashboard());
final scheduleProvider = FutureProvider.family<List<ScheduleItem>, String>(
  (ref, scope) => ref.watch(repositoryProvider).schedule(scope),
);
final coursesProvider = FutureProvider<List<CourseSummary>>((ref) => ref.watch(repositoryProvider).courses());
final gradesProvider = FutureProvider<List<CourseGrade>>((ref) => ref.watch(repositoryProvider).grades());
final attendanceProvider = FutureProvider<List<AttendanceItem>>((ref) => ref.watch(repositoryProvider).attendance());
final assignmentsProvider = FutureProvider<List<AssignmentItem>>((ref) => ref.watch(repositoryProvider).assignments());
final calendarProvider = FutureProvider<List<CalendarItem>>((ref) => ref.watch(repositoryProvider).calendar());
final buildingsProvider = FutureProvider<List<BuildingItem>>((ref) => ref.watch(repositoryProvider).buildings());
final eventsProvider = FutureProvider<List<EventItem>>((ref) => ref.watch(repositoryProvider).events());
final clubsProvider = FutureProvider<List<ClubItem>>((ref) => ref.watch(repositoryProvider).clubs());
final cardProvider = FutureProvider<StudentCard>((ref) => ref.watch(repositoryProvider).studentCard());
final notificationsProvider = FutureProvider<List<AppNotification>>((ref) => ref.watch(repositoryProvider).notifications());
final profileProvider = FutureProvider<Profile>((ref) => ref.watch(repositoryProvider).profile());
