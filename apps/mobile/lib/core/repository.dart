import 'dart:convert';

import 'package:http/http.dart' as http;

import 'models.dart';

abstract class BmuRepository {
  Future<void> login(String email, String password);
  Future<void> logout();
  Future<Dashboard> dashboard();
  Future<List<ScheduleItem>> schedule(String scope);
  Future<List<CourseSummary>> courses();
  Future<Map<String, dynamic>> course(String id);
  Future<List<CourseGrade>> grades();
  Future<String> calculateGrade(String courseId, double target);
  Future<List<AttendanceItem>> attendance();
  Future<List<AssignmentItem>> assignments();
  Future<List<CalendarItem>> calendar();
  Future<List<BuildingItem>> buildings();
  Future<List<EventItem>> events();
  Future<EventItem> registerEvent(String id);
  Future<EventItem> unregisterEvent(String id);
  Future<List<ClubItem>> clubs();
  Future<ClubItem> joinClub(String id);
  Future<ClubItem> leaveClub(String id);
  Future<StudentCard> studentCard();
  Future<List<AppNotification>> notifications();
  Future<Profile> profile();
  Future<String> ask(String message);
}

class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

class ApiRepository implements BmuRepository {
  ApiRepository({required this.baseUrl, required this.readSession, required this.writeSession});

  final String baseUrl;
  final Session? Function() readSession;
  final void Function(Session? session) writeSession;

  @override
  Future<void> login(String email, String password) async {
    final json = await _request('POST', '/auth/login', body: {'email': email, 'password': password}, auth: false);
    writeSession(Session.fromLogin(json as Map<String, dynamic>));
  }

  @override
  Future<void> logout() async {
    final session = readSession();
    if (session != null) {
      try {
        await _request('POST', '/auth/logout', body: {'refreshToken': session.refreshToken});
      } catch (_) {}
    }
    writeSession(null);
  }

  @override
  Future<Dashboard> dashboard() async => Dashboard.fromJson(await _map('GET', '/me/dashboard'));

  @override
  Future<List<ScheduleItem>> schedule(String scope) async =>
      _list(await _request('GET', '/me/schedule?scope=$scope'), ScheduleItem.fromJson);

  @override
  Future<List<CourseSummary>> courses() async => _list(await _request('GET', '/me/courses'), CourseSummary.fromJson);

  @override
  Future<Map<String, dynamic>> course(String id) async => _map('GET', '/courses/$id');

  @override
  Future<List<CourseGrade>> grades() async => _list(await _request('GET', '/me/grades'), CourseGrade.fromJson);

  @override
  Future<String> calculateGrade(String courseId, double target) async {
    final json = await _map('POST', '/me/grades/calculate', body: {'courseId': courseId, 'target': target});
    return json['message'] as String? ?? '';
  }

  @override
  Future<List<AttendanceItem>> attendance() async =>
      _list(await _request('GET', '/me/attendance'), AttendanceItem.fromJson);

  @override
  Future<List<AssignmentItem>> assignments() async =>
      _list(await _request('GET', '/me/assignments'), AssignmentItem.fromJson);

  @override
  Future<List<CalendarItem>> calendar() async => _list(await _request('GET', '/calendar'), CalendarItem.fromJson);

  @override
  Future<List<BuildingItem>> buildings() async => _list(await _request('GET', '/campus/buildings'), BuildingItem.fromJson);

  @override
  Future<List<EventItem>> events() async => _list(await _request('GET', '/events'), EventItem.fromJson);

  @override
  Future<EventItem> registerEvent(String id) async => EventItem.fromJson(await _map('POST', '/events/$id/register'));

  @override
  Future<EventItem> unregisterEvent(String id) async =>
      EventItem.fromJson(await _map('DELETE', '/events/$id/register'));

  @override
  Future<List<ClubItem>> clubs() async => _list(await _request('GET', '/clubs'), ClubItem.fromJson);

  @override
  Future<ClubItem> joinClub(String id) async => ClubItem.fromJson(await _map('POST', '/clubs/$id/join'));

  @override
  Future<ClubItem> leaveClub(String id) async => ClubItem.fromJson(await _map('POST', '/clubs/$id/leave'));

  @override
  Future<StudentCard> studentCard() async => StudentCard.fromJson(await _map('GET', '/me/student-id'));

  @override
  Future<List<AppNotification>> notifications() async =>
      _list(await _request('GET', '/me/notifications'), AppNotification.fromJson);

  @override
  Future<Profile> profile() async => Profile.fromMe(await _map('GET', '/me'));

  @override
  Future<String> ask(String message) async {
    final json = await _map('POST', '/ai/chat', body: {'message': message});
    return json['answer'] as String? ?? '';
  }

  Future<Map<String, dynamic>> _map(String method, String path, {Object? body}) async {
    final json = await _request(method, path, body: body);
    return json as Map<String, dynamic>;
  }

  Future<Object?> _request(String method, String path, {Object? body, bool auth = true, bool retried = false}) async {
    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) headers['Content-Type'] = 'application/json';
    final session = readSession();
    if (auth && session != null) headers['Authorization'] = 'Bearer ${session.accessToken}';
    final uri = Uri.parse('$baseUrl$path');
    final response = await _send(method, uri, headers, body);
    if (response.statusCode == 401 && auth && !retried && session != null) {
      final refreshed = await _refresh(session);
      if (refreshed) return _request(method, path, body: body, auth: auth, retried: true);
    }
    final decoded = response.body.isEmpty ? null : jsonDecode(response.body);
    if (response.statusCode >= 400) {
      final message = decoded is Map && decoded['message'] != null ? decoded['message'].toString() : 'Request failed';
      throw ApiException(message);
    }
    return decoded;
  }

  Future<http.Response> _send(String method, Uri uri, Map<String, String> headers, Object? body) {
    final encoded = body == null ? null : jsonEncode(body);
    switch (method) {
      case 'POST':
        return http.post(uri, headers: headers, body: encoded);
      case 'DELETE':
        return http.delete(uri, headers: headers, body: encoded);
      case 'PATCH':
        return http.patch(uri, headers: headers, body: encoded);
      default:
        return http.get(uri, headers: headers);
    }
  }

  Future<bool> _refresh(Session session) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': session.refreshToken}),
      );
      if (response.statusCode >= 400) return false;
      writeSession(Session.fromLogin(jsonDecode(response.body) as Map<String, dynamic>));
      return true;
    } catch (_) {
      return false;
    }
  }
}

List<T> _list<T>(Object? raw, T Function(Map<String, dynamic>) map) {
  if (raw is! List) return [];
  return raw.whereType<Map<String, dynamic>>().map(map).toList();
}
