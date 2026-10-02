import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/l10n.dart';
import '../core/models.dart';
import '../core/providers.dart';
import '../core/widgets.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(sessionProvider).lang;
    final asyncDash = ref.watch(dashboardProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.refresh(dashboardProvider.future),
      child: asyncDash.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => ListView(children: [Padding(padding: const EdgeInsets.all(24), child: Text(error.toString()))]),
        data: (dash) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Text(greeting(lang, dash.period, dash.firstName), style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 16),
            SectionCard(title: t(lang, 'nextClass'), child: _NextClass(item: dash.nextClass, lang: lang)),
            const SizedBox(height: 12),
            SectionCard(
              title: t(lang, 'today'),
              child: dash.today.isEmpty
                  ? Text(t(lang, 'empty'))
                  : Column(
                      children: dash.today.map((item) => _ScheduleRow(item: item)).toList(),
                    ),
            ),
            const SizedBox(height: 12),
            SectionCard(
              title: t(lang, 'deadlines'),
              child: dash.deadlines.isEmpty
                  ? Text(t(lang, 'empty'))
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: dash.deadlines
                          .map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Text('${item.title}\n${item.courseTitle} · ${shortWhen(item.deadline)} · ${item.status}'),
                              ))
                          .toList(),
                    ),
            ),
            const SizedBox(height: 12),
            SectionCard(
              title: t(lang, 'attendance'),
              child: Column(
                children: dash.attendance
                    .map((item) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              Expanded(child: Text(item.courseTitle)),
                              Text(item.percent == null ? '—' : '${item.percent}%', style: Theme.of(context).textTheme.titleMedium),
                            ],
                          ),
                        ))
                    .toList(),
              ),
            ),
            const SizedBox(height: 12),
            SectionCard(
              title: t(lang, 'announcements'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: dash.announcements
                    .map((item) => Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Text('${item.title}\n${item.body}'),
                        ))
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NextClass extends StatelessWidget {
  const _NextClass({required this.item, required this.lang});
  final ScheduleItem? item;
  final String lang;

  @override
  Widget build(BuildContext context) {
    if (item == null) return Text(t(lang, 'noClass'));
    final soon = item!.startsInMinutes;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(item!.courseTitle, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 4),
        Text('${item!.startTime} – ${item!.endTime}'),
        Text('${item!.buildingName} · Room ${item!.room}'),
        if (soon != null && soon >= 0) Text('${t(lang, 'startsIn')} $soon ${t(lang, 'minutes')}'),
        if (item!.status != 'SCHEDULED') Text(item!.status.replaceAll('_', ' ')),
      ],
    );
  }
}

class _ScheduleRow extends StatelessWidget {
  const _ScheduleRow({required this.item});
  final ScheduleItem item;

  @override
  Widget build(BuildContext context) {
    final muted = item.status == 'CANCELLED';
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 56, child: Text(item.startTime)),
          Expanded(
            child: Text(
              '${item.courseTitle}${muted ? ' · cancelled' : ''}',
              style: muted ? const TextStyle(decoration: TextDecoration.lineThrough) : null,
            ),
          ),
          Text(item.room),
        ],
      ),
    );
  }
}
