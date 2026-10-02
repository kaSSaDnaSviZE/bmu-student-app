class Session {
  Session({
    required this.accessToken,
    required this.refreshToken,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
  });

  final String accessToken;
  final String refreshToken;
  final String email;
  final String firstName;
  final String lastName;
  final String role;

  factory Session.fromLogin(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>;
    return Session(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      email: user['email'] as String,
      firstName: user['firstName'] as String,
      lastName: user['lastName'] as String,
      role: user['role'] as String,
    );
  }
}

class ScheduleItem {
  ScheduleItem({
    required this.courseTitle,
    required this.startTime,
    required this.endTime,
    required this.buildingName,
    required this.room,
    required this.status,
    required this.teacherName,
    this.startsInMinutes,
    this.note,
  });

  final String courseTitle;
  final String startTime;
  final String endTime;
  final String buildingName;
  final String room;
  final String status;
  final String teacherName;
  final int? startsInMinutes;
  final String? note;

  factory ScheduleItem.fromJson(Map<String, dynamic> json) {
    return ScheduleItem(
      courseTitle: json['courseTitle'] as String? ?? '',
      startTime: json['startTime'] as String? ?? '',
      endTime: json['endTime'] as String? ?? '',
      buildingName: json['buildingName'] as String? ?? '',
      room: json['room'] as String? ?? '',
      status: json['status'] as String? ?? 'SCHEDULED',
      teacherName: json['teacherName'] as String? ?? '',
      startsInMinutes: json['startsInMinutes'] as int?,
      note: json['note'] as String?,
    );
  }
}

class DeadlineItem {
  DeadlineItem({required this.title, required this.courseTitle, required this.deadline, required this.status});
  final String title;
  final String courseTitle;
  final String deadline;
  final String status;

  factory DeadlineItem.fromJson(Map<String, dynamic> json) => DeadlineItem(
        title: json['title'] as String? ?? '',
        courseTitle: json['courseTitle'] as String? ?? '',
        deadline: json['deadline'] as String? ?? '',
        status: json['status'] as String? ?? '',
      );
}

class AttendanceItem {
  AttendanceItem({required this.courseTitle, required this.percent});
  final String courseTitle;
  final int? percent;
  factory AttendanceItem.fromJson(Map<String, dynamic> json) => AttendanceItem(
        courseTitle: json['courseTitle'] as String? ?? '',
        percent: json['percent'] as int?,
      );
}

class AnnouncementItem {
  AnnouncementItem({required this.title, required this.body});
  final String title;
  final String body;
  factory AnnouncementItem.fromJson(Map<String, dynamic> json) =>
      AnnouncementItem(title: json['title'] as String? ?? '', body: json['body'] as String? ?? '');
}

class Dashboard {
  Dashboard({
    required this.period,
    required this.firstName,
    required this.nextClass,
    required this.today,
    required this.deadlines,
    required this.attendance,
    required this.announcements,
    required this.unreadNotifications,
  });

  final String period;
  final String firstName;
  final ScheduleItem? nextClass;
  final List<ScheduleItem> today;
  final List<DeadlineItem> deadlines;
  final List<AttendanceItem> attendance;
  final List<AnnouncementItem> announcements;
  final int unreadNotifications;

  factory Dashboard.fromJson(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>? ?? {};
    final next = json['nextClass'];
    return Dashboard(
      period: json['period'] as String? ?? 'morning',
      firstName: profile['firstName'] as String? ?? '',
      nextClass: next is Map<String, dynamic> ? ScheduleItem.fromJson(next) : null,
      today: _list(json['today'], ScheduleItem.fromJson),
      deadlines: _list(json['deadlines'], DeadlineItem.fromJson),
      attendance: _list(json['attendance'], AttendanceItem.fromJson),
      announcements: _list(json['announcements'], AnnouncementItem.fromJson),
      unreadNotifications: json['unreadNotifications'] as int? ?? 0,
    );
  }
}

class CourseSummary {
  CourseSummary({
    required this.id,
    required this.code,
    required this.title,
    required this.teacherName,
    required this.credits,
  });
  final String id;
  final String code;
  final String title;
  final String teacherName;
  final int credits;
  factory CourseSummary.fromJson(Map<String, dynamic> json) => CourseSummary(
        id: json['id'] as String,
        code: json['code'] as String? ?? '',
        title: (json['title'] ?? json['courseTitle'] ?? '') as String,
        teacherName: json['teacherName'] as String? ?? '',
        credits: json['credits'] as int? ?? 0,
      );
}

class AssessmentRow {
  AssessmentRow({
    required this.title,
    required this.weight,
    required this.score,
    required this.maxScore,
    required this.isFinal,
  });
  final String title;
  final int weight;
  final double? score;
  final double maxScore;
  final bool isFinal;
  factory AssessmentRow.fromJson(Map<String, dynamic> json) => AssessmentRow(
        title: json['title'] as String? ?? '',
        weight: json['weight'] as int? ?? 0,
        score: (json['score'] as num?)?.toDouble(),
        maxScore: (json['maxScore'] as num?)?.toDouble() ?? 100,
        isFinal: json['isFinal'] as bool? ?? false,
      );
}

class CourseGrade {
  CourseGrade({
    required this.courseId,
    required this.courseTitle,
    required this.currentPercent,
    required this.finalPercent,
    required this.assessments,
  });
  final String courseId;
  final String courseTitle;
  final double? currentPercent;
  final double? finalPercent;
  final List<AssessmentRow> assessments;
  factory CourseGrade.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] as Map<String, dynamic>? ?? {};
    return CourseGrade(
      courseId: json['courseId'] as String,
      courseTitle: json['courseTitle'] as String? ?? '',
      currentPercent: (summary['currentPercent'] as num?)?.toDouble(),
      finalPercent: (summary['finalPercent'] as num?)?.toDouble(),
      assessments: _list(json['assessments'], AssessmentRow.fromJson),
    );
  }
}

class AssignmentItem {
  AssignmentItem({
    required this.id,
    required this.title,
    required this.courseTitle,
    required this.description,
    required this.deadline,
    required this.status,
  });
  final String id;
  final String title;
  final String courseTitle;
  final String description;
  final String deadline;
  final String status;
  factory AssignmentItem.fromJson(Map<String, dynamic> json) => AssignmentItem(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        courseTitle: json['courseTitle'] as String? ?? '',
        description: json['description'] as String? ?? '',
        deadline: json['deadline'] as String? ?? '',
        status: json['status'] as String? ?? '',
      );
}

class CalendarItem {
  CalendarItem({required this.title, required this.type, required this.startsAt, required this.description});
  final String title;
  final String type;
  final String startsAt;
  final String description;
  factory CalendarItem.fromJson(Map<String, dynamic> json) => CalendarItem(
        title: json['title'] as String? ?? '',
        type: json['type'] as String? ?? '',
        startsAt: json['startsAt'] as String? ?? '',
        description: json['description'] as String? ?? '',
      );
}

class BuildingItem {
  BuildingItem({required this.name, required this.kind, required this.description, required this.roomCount});
  final String name;
  final String kind;
  final String description;
  final int roomCount;
  factory BuildingItem.fromJson(Map<String, dynamic> json) => BuildingItem(
        name: json['name'] as String? ?? '',
        kind: json['kind'] as String? ?? '',
        description: json['description'] as String? ?? '',
        roomCount: (json['classrooms'] as List?)?.length ?? 0,
      );
}

class EventItem {
  EventItem({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.startsAt,
    required this.registered,
  });
  final String id;
  final String title;
  final String description;
  final String location;
  final String startsAt;
  final bool registered;
  factory EventItem.fromJson(Map<String, dynamic> json) => EventItem(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        description: json['description'] as String? ?? '',
        location: json['location'] as String? ?? '',
        startsAt: json['startsAt'] as String? ?? '',
        registered: json['registered'] as bool? ?? false,
      );
}

class ClubItem {
  ClubItem({
    required this.id,
    required this.name,
    required this.description,
    required this.category,
    required this.joined,
    required this.memberCount,
  });
  final String id;
  final String name;
  final String description;
  final String category;
  final bool joined;
  final int memberCount;
  factory ClubItem.fromJson(Map<String, dynamic> json) => ClubItem(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        description: json['description'] as String? ?? '',
        category: json['category'] as String? ?? '',
        joined: json['joined'] as bool? ?? false,
        memberCount: json['memberCount'] as int? ?? 0,
      );
}

class StudentCard {
  StudentCard({
    required this.firstName,
    required this.lastName,
    required this.program,
    required this.studentNo,
    required this.qrPayload,
    required this.disclaimer,
  });
  final String firstName;
  final String lastName;
  final String program;
  final String studentNo;
  final String qrPayload;
  final String disclaimer;
  factory StudentCard.fromJson(Map<String, dynamic> json) => StudentCard(
        firstName: json['firstName'] as String? ?? '',
        lastName: json['lastName'] as String? ?? '',
        program: json['program'] as String? ?? '',
        studentNo: json['studentNo'] as String? ?? '',
        qrPayload: json['qrPayload'] as String? ?? '',
        disclaimer: json['disclaimer'] as String? ?? '',
      );
}

class AppNotification {
  AppNotification({required this.id, required this.title, required this.body, required this.read});
  final String id;
  final String title;
  final String body;
  final bool read;
  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String,
        title: json['title'] as String? ?? '',
        body: json['body'] as String? ?? '',
        read: json['read'] as bool? ?? false,
      );
}

class Profile {
  Profile({
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.studentNo,
    required this.program,
    required this.group,
    required this.faculty,
  });
  final String firstName;
  final String lastName;
  final String email;
  final String studentNo;
  final String program;
  final String group;
  final String faculty;
  factory Profile.fromMe(Map<String, dynamic> json) {
    final profile = json['profile'] as Map<String, dynamic>? ?? json;
    return Profile(
      firstName: profile['firstName'] as String? ?? json['firstName'] as String? ?? '',
      lastName: profile['lastName'] as String? ?? json['lastName'] as String? ?? '',
      email: profile['email'] as String? ?? json['email'] as String? ?? '',
      studentNo: profile['studentNo'] as String? ?? '',
      program: profile['program'] as String? ?? '',
      group: profile['group'] as String? ?? '',
      faculty: profile['faculty'] as String? ?? '',
    );
  }
}

List<T> _list<T>(Object? raw, T Function(Map<String, dynamic>) map) {
  if (raw is! List) return [];
  return raw.whereType<Map<String, dynamic>>().map(map).toList();
}
