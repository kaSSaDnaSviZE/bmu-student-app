import 'package:bmu_student_app/core/models.dart';
import 'package:bmu_student_app/core/providers.dart';
import 'package:bmu_student_app/core/repository.dart';
import 'package:bmu_student_app/features/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

class FakeRepository implements BmuRepository {
  @override
  Future<Dashboard> dashboard() async {
    return Dashboard(
      period: 'morning',
      firstName: 'Alex',
      nextClass: ScheduleItem(
        courseTitle: 'Programming',
        startTime: '10:00',
        endTime: '11:30',
        buildingName: 'Building B',
        room: '304',
        status: 'SCHEDULED',
        teacherName: 'Dr. Leyla Demo',
        startsInMinutes: 35,
      ),
      today: [
        ScheduleItem(courseTitle: 'Mathematics', startTime: '09:00', endTime: '10:20', buildingName: 'Building B', room: '201', status: 'SCHEDULED', teacherName: 'Dr. Rashad Demo'),
        ScheduleItem(courseTitle: 'Programming', startTime: '10:00', endTime: '11:30', buildingName: 'Building B', room: '304', status: 'SCHEDULED', teacherName: 'Dr. Leyla Demo'),
      ],
      deadlines: [
        DeadlineItem(title: 'Programming Assignment', courseTitle: 'Programming', deadline: '2026-10-02T19:59:00.000Z', status: 'NOT_SUBMITTED'),
      ],
      attendance: [
        AttendanceItem(courseTitle: 'Programming', percent: 92),
        AttendanceItem(courseTitle: 'Physics', percent: 76),
      ],
      announcements: [AnnouncementItem(title: 'Midterm week', body: 'Check the calendar.')],
      unreadNotifications: 2,
    );
  }

  @override
  Future<void> login(String email, String password) async {}
  @override
  Future<void> logout() async {}
  @override
  Future<List<ScheduleItem>> schedule(String scope) async => [];
  @override
  Future<List<CourseSummary>> courses() async => [];
  @override
  Future<Map<String, dynamic>> course(String id) async => {};
  @override
  Future<List<CourseGrade>> grades() async => [];
  @override
  Future<String> calculateGrade(String courseId, double target) async => '';
  @override
  Future<List<AttendanceItem>> attendance() async => [];
  @override
  Future<List<AssignmentItem>> assignments() async => [];
  @override
  Future<List<CalendarItem>> calendar() async => [];
  @override
  Future<List<BuildingItem>> buildings() async => [];
  @override
  Future<List<EventItem>> events() async => [];
  @override
  Future<EventItem> registerEvent(String id) => throw UnimplementedError();
  @override
  Future<EventItem> unregisterEvent(String id) => throw UnimplementedError();
  @override
  Future<List<ClubItem>> clubs() async => [];
  @override
  Future<ClubItem> joinClub(String id) => throw UnimplementedError();
  @override
  Future<ClubItem> leaveClub(String id) => throw UnimplementedError();
  @override
  Future<StudentCard> studentCard() => throw UnimplementedError();
  @override
  Future<List<AppNotification>> notifications() async => [];
  @override
  Future<Profile> profile() => throw UnimplementedError();
  @override
  Future<String> ask(String message) async => '';
}

void main() {
  testWidgets('home shows the next class, deadline and attendance', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [repositoryProvider.overrideWithValue(FakeRepository())],
        child: const MaterialApp(home: HomeScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Good morning, Alex'), findsOneWidget);
    expect(find.text('Programming'), findsWidgets);
    expect(find.textContaining('304'), findsWidgets);
    expect(find.textContaining('92%'), findsOneWidget);
    expect(find.textContaining('Programming Assignment'), findsOneWidget);
  });
}
