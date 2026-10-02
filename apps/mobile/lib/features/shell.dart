import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/l10n.dart';
import '../core/providers.dart';
import 'campus_screens.dart';
import 'home_screen.dart';
import 'study_screens.dart';

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(sessionProvider).lang;
    final pages = const [HomeScreen(), ScheduleScreen(), CoursesScreen(), MoreScreen()];
    return Scaffold(
      body: SafeArea(child: pages[index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), label: t(lang, 'home')),
          NavigationDestination(icon: const Icon(Icons.calendar_view_week), label: t(lang, 'schedule')),
          NavigationDestination(icon: const Icon(Icons.menu_book_outlined), label: t(lang, 'courses')),
          NavigationDestination(icon: const Icon(Icons.grid_view), label: t(lang, 'more')),
        ],
      ),
    );
  }
}

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(sessionProvider).lang;
    final items = <(String, Widget)>[
      (t(lang, 'grades'), const GradesScreen()),
      (t(lang, 'attendance'), const AttendanceScreen()),
      (t(lang, 'assignments'), const AssignmentsScreen()),
      (t(lang, 'calendar'), const CalendarScreen()),
      (t(lang, 'campus'), const CampusScreen()),
      (t(lang, 'events'), const EventsScreen()),
      (t(lang, 'clubs'), const ClubsScreen()),
      (t(lang, 'studentId'), const StudentIdScreen()),
      (t(lang, 'assistant'), const AssistantScreen()),
      (t(lang, 'notifications'), const NotificationsScreen()),
      (t(lang, 'profile'), const ProfileScreen()),
    ];
    return ListView.separated(
      itemCount: items.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, i) => ListTile(
        title: Text(items[i].$1),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => Scaffold(appBar: AppBar(title: Text(items[i].$1)), body: items[i].$2))),
      ),
    );
  }
}
