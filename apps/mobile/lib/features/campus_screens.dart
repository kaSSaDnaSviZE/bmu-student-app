import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../core/l10n.dart';
import '../core/providers.dart';
import '../core/widgets.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rows = ref.watch(calendarProvider);
    return rows.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (items) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return ListTile(
            title: Text(item.title),
            subtitle: Text('${item.type} · ${shortWhen(item.startsAt)}\n${item.description}'),
            isThreeLine: true,
          );
        },
      ),
    );
  }
}

class CampusScreen extends ConsumerWidget {
  const CampusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(sessionProvider).lang;
    final rows = ref.watch(buildingsProvider);
    return rows.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (items) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(t(lang, 'mapNote')),
          const SizedBox(height: 12),
          ...items.map((item) => Card(
                elevation: 0,
                child: ListTile(
                  title: Text(item.name),
                  subtitle: Text('${item.kind} · ${item.description}'),
                  trailing: Text('${item.roomCount}'),
                ),
              )),
        ],
      ),
    );
  }
}

class EventsScreen extends ConsumerWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(sessionProvider).lang;
    final rows = ref.watch(eventsProvider);
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
              subtitle: Text('${item.location}\n${shortWhen(item.startsAt)}\n${item.description}'),
              isThreeLine: true,
              trailing: TextButton(
                onPressed: () async {
                  final repo = ref.read(repositoryProvider);
                  if (item.registered) {
                    await repo.unregisterEvent(item.id);
                  } else {
                    await repo.registerEvent(item.id);
                  }
                  ref.invalidate(eventsProvider);
                },
                child: Text(item.registered ? t(lang, 'cancel') : t(lang, 'register')),
              ),
            ),
          );
        },
      ),
    );
  }
}

class ClubsScreen extends ConsumerWidget {
  const ClubsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(sessionProvider).lang;
    final rows = ref.watch(clubsProvider);
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
              title: Text(item.name),
              subtitle: Text('${item.category} · ${item.memberCount}\n${item.description}'),
              isThreeLine: true,
              trailing: TextButton(
                onPressed: () async {
                  final repo = ref.read(repositoryProvider);
                  if (item.joined) {
                    await repo.leaveClub(item.id);
                  } else {
                    await repo.joinClub(item.id);
                  }
                  ref.invalidate(clubsProvider);
                },
                child: Text(item.joined ? t(lang, 'leave') : t(lang, 'join')),
              ),
            ),
          );
        },
      ),
    );
  }
}

class StudentIdScreen extends ConsumerWidget {
  const StudentIdScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(sessionProvider).lang;
    final card = ref.watch(cardProvider);
    return card.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (item) => ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Card(
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(radius: 36, child: Text(item.firstName.isEmpty ? '?' : item.firstName[0])),
                  const SizedBox(height: 12),
                  Text('${item.firstName} ${item.lastName}', style: Theme.of(context).textTheme.titleLarge),
                  Text(item.program),
                  const SizedBox(height: 8),
                  Text(item.studentNo, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 16),
                  QrImageView(data: item.qrPayload, size: 180, backgroundColor: Colors.white),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(t(lang, 'demoId')),
          const SizedBox(height: 4),
          Text(item.disclaimer),
        ],
      ),
    );
  }
}

class AssistantScreen extends ConsumerStatefulWidget {
  const AssistantScreen({super.key});

  @override
  ConsumerState<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends ConsumerState<AssistantScreen> {
  final input = TextEditingController();
  final messages = <(bool, String)>[];
  bool busy = false;

  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  Future<void> ask(String text) async {
    if (text.trim().isEmpty) return;
    setState(() {
      messages.add((true, text.trim()));
      busy = true;
    });
    input.clear();
    try {
      final answer = await ref.read(repositoryProvider).ask(text.trim());
      setState(() => messages.add((false, answer)));
    } catch (error) {
      setState(() => messages.add((false, error.toString())));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(sessionProvider).lang;
    const prompts = [
      'When is my next class?',
      'What classes do I have tomorrow?',
      'What deadlines do I have this week?',
      'What is my Physics attendance?',
      'Where is Room 304?',
      'What exams do I have?',
    ];
    return Column(
      children: [
        SizedBox(
          height: 46,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            children: prompts
                .map((prompt) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(label: Text(prompt), onPressed: busy ? null : () => ask(prompt)),
                    ))
                .toList(),
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: messages.length,
            itemBuilder: (context, index) {
              final message = messages[index];
              return Align(
                alignment: message.$1 ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  constraints: const BoxConstraints(maxWidth: 320),
                  decoration: BoxDecoration(
                    color: message.$1 ? Theme.of(context).colorScheme.primaryContainer : Theme.of(context).colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(message.$2),
                ),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Row(
            children: [
              Expanded(child: TextField(controller: input, decoration: InputDecoration(hintText: t(lang, 'assistant')))),
              IconButton(onPressed: busy ? null : () => ask(input.text), icon: const Icon(Icons.send)),
            ],
          ),
        ),
      ],
    );
  }
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rows = ref.watch(notificationsProvider);
    return rows.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (items) => ListView.builder(
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          return ListTile(
            title: Text(item.title, style: TextStyle(fontWeight: item.read ? FontWeight.normal : FontWeight.w700)),
            subtitle: Text(item.body),
          );
        },
      ),
    );
  }
}

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(sessionProvider).lang;
    final profile = ref.watch(profileProvider);
    final session = ref.watch(sessionProvider);
    return profile.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text(error.toString())),
      data: (item) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('${item.firstName} ${item.lastName}', style: Theme.of(context).textTheme.headlineSmall),
          Text(item.email),
          Text(item.studentNo),
          Text(item.program),
          Text(item.group),
          Text(item.faculty),
          const SizedBox(height: 16),
          Text(t(lang, 'language')),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'en', label: Text('EN')),
              ButtonSegment(value: 'az', label: Text('AZ')),
              ButtonSegment(value: 'ru', label: Text('RU')),
            ],
            selected: {session.lang},
            onSelectionChanged: (value) => ref.read(sessionProvider).setLang(value.first),
          ),
          const SizedBox(height: 16),
          Text(t(lang, 'theme')),
          SegmentedButton<ThemeMode>(
            segments: [
              ButtonSegment(value: ThemeMode.system, label: Text(t(lang, 'system'))),
              ButtonSegment(value: ThemeMode.light, label: Text(t(lang, 'light'))),
              ButtonSegment(value: ThemeMode.dark, label: Text(t(lang, 'dark'))),
            ],
            selected: {session.themeMode},
            onSelectionChanged: (value) => ref.read(sessionProvider).setTheme(value.first),
          ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () => ref.read(repositoryProvider).logout(),
            child: Text(t(lang, 'signOut')),
          ),
        ],
      ),
    );
  }
}
