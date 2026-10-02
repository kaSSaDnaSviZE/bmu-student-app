import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/grade_calculator.dart';
import '../core/l10n.dart';
import '../core/models.dart';
import '../core/providers.dart';
import '../core/widgets.dart';

class ScheduleScreen extends ConsumerStatefulWidget {
  const ScheduleScreen({super.key});

  @override
  ConsumerState<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends ConsumerState<ScheduleScreen> {
  String scope = 'today';

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(sessionProvider).lang;
    final items = ref.watch(scheduleProvider(scope));
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: SegmentedButton<String>(
            segments: [
              ButtonSegment(value: 'today', label: Text(t(lang, 'today'))),
              ButtonSegment(value: 'tomorrow', label: Text(t(lang, 'tomorrow'))),
              ButtonSegment(value: 'week', label: Text(t(lang, 'week'))),
            ],
            selected: {scope},
            onSelectionChanged: (value) => setState(() => scope = value.first),
          ),
        ),
        Expanded(
          child: items.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, _) => Center(child: Text(error.toString())),
            data: (rows) => ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: rows.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = rows[index];
                return Card(
                  elevation: 0,
                  child: ListTile(
                    title: Text(item.courseTitle),
                    subtitle: Text('${item.teacherName}\n${item.startTime}–${item.endTime} · ${item.buildingName} · ${item.room}'),
                    isThreeLine: true,
                    trailing: item.status == 'SCHEDULED' ? null : Text(item.status.replaceAll('_', ' '), style: const TextStyle(fontSize: 11)),
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class CoursesScreen extends ConsumerWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final courses = ref.watch(coursesProvider);
    return courses.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (rows) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: rows.length,
        itemBuilder: (context, index) {
          final course = rows[index];
          return Card(
            elevation: 0,
            child: ListTile(
              title: Text(course.title),
              subtitle: Text('${course.code} · ${course.teacherName} · ${course.credits} ECTS'),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CourseDetailScreen(course: course))),
            ),
          );
        },
      ),
    );
  }
}

class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({super.key, required this.course});
  final CourseSummary course;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(courseDetailProvider(course.id));
    return Scaffold(
      appBar: AppBar(title: Text(course.title)),
      body: detail.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
        data: (json) {
          final schedule = (json['schedule'] as List? ?? []).whereType<Map<String, dynamic>>().map(ScheduleItem.fromJson).toList();
          final materials = (json['materials'] as List? ?? []).whereType<Map<String, dynamic>>().toList();
          final assignments = (json['assignments'] as List? ?? []).whereType<Map<String, dynamic>>().map(AssignmentItem.fromJson).toList();
          final announcements = (json['announcements'] as List? ?? []).whereType<Map<String, dynamic>>().map(AnnouncementItem.fromJson).toList();
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(json['teacherName'] as String? ?? course.teacherName),
              const SizedBox(height: 8),
              Text(json['description'] as String? ?? ''),
              const SizedBox(height: 16),
              ...schedule.map((item) => Text('${item.startTime} ${item.courseTitle} · ${item.buildingName} ${item.room} ${item.status}')),
              const Divider(),
              ...materials.map((item) => Text('${item['type']}: ${item['title']}')),
              const Divider(),
              ...assignments.map((item) => Text('${item.title} · ${shortWhen(item.deadline)} · ${item.status}')),
              const Divider(),
              ...announcements.map((item) => Text(item.title)),
            ],
          );
        },
      ),
    );
  }
}

final courseDetailProvider = FutureProvider.family<Map<String, dynamic>, String>(
  (ref, id) => ref.watch(repositoryProvider).course(id),
);

class GradesScreen extends ConsumerStatefulWidget {
  const GradesScreen({super.key});

  @override
  ConsumerState<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends ConsumerState<GradesScreen> {
  String? courseId;
  final target = TextEditingController(text: '85');
  String? message;

  @override
  void dispose() {
    target.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(sessionProvider).lang;
    final grades = ref.watch(gradesProvider);
    return grades.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (rows) {
        courseId ??= rows.isEmpty ? null : rows.first.courseId;
        final selected = rows.where((row) => row.courseId == courseId).firstOrNull;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (rows.isNotEmpty)
              DropdownButton<String>(
                isExpanded: true,
                value: courseId,
                items: rows.map((row) => DropdownMenuItem(value: row.courseId, child: Text(row.courseTitle))).toList(),
                onChanged: (value) => setState(() {
                  courseId = value;
                  message = null;
                }),
              ),
            if (selected != null) ...[
              const SizedBox(height: 8),
              Text('${t(lang, 'current')}: ${selected.currentPercent ?? '—'}'),
              Text('${t(lang, 'final')}: ${selected.finalPercent ?? '—'}'),
              const SizedBox(height: 8),
              ...selected.assessments.map((row) => Text('${row.title} · ${row.weight}% · ${row.score ?? '—'}')),
              const SizedBox(height: 16),
              TextField(controller: target, decoration: InputDecoration(labelText: t(lang, 'target')), keyboardType: TextInputType.number),
              const SizedBox(height: 8),
              FilledButton(
                onPressed: () {
                  final value = double.tryParse(target.text);
                  if (value == null) return;
                  final local = requiredScoreForTarget(
                    selected.assessments
                        .map((row) => GradePart(weight: row.weight, score: row.score, maxScore: row.maxScore, isFinal: row.isFinal))
                        .toList(),
                    value,
                  );
                  setState(() => message = local.message);
                },
                child: Text(t(lang, 'calculate')),
              ),
              if (message != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(message!)),
            ],
          ],
        );
      },
    );
  }
}

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rows = ref.watch(attendanceProvider);
    return rows.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (items) => ListView(
        padding: const EdgeInsets.all(16),
        children: items
            .map((item) => Card(
                  elevation: 0,
                  child: ListTile(title: Text(item.courseTitle), trailing: Text(item.percent == null ? '—' : '${item.percent}%')),
                ))
            .toList(),
      ),
    );
  }
}

class AssignmentsScreen extends ConsumerWidget {
  const AssignmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rows = ref.watch(assignmentsProvider);
    return rows.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (items) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return Card(
            elevation: 0,
            child: ListTile(
              title: Text(item.title),
              subtitle: Text('${item.courseTitle}\n${item.description}\n${shortWhen(item.deadline)}'),
              isThreeLine: true,
              trailing: Text(item.status, style: const TextStyle(fontSize: 11)),
            ),
          );
        },
      ),
    );
  }
}
