import 'package:flutter/material.dart';

class AsyncBody<T> extends StatelessWidget {
  const AsyncBody({super.key, required this.value, required this.builder, required this.empty});

  final AsyncValueLike<T> value;
  final Widget Function(T data) builder;
  final String empty;

  @override
  Widget build(BuildContext context) {
    if (value.isLoading && !value.hasData) {
      return const Center(child: CircularProgressIndicator());
    }
    if (value.hasError) {
      return Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(value.error.toString())));
    }
    if (!value.hasData) return Center(child: Text(empty));
    return builder(value.data as T);
  }
}

class AsyncValueLike<T> {
  AsyncValueLike({required this.isLoading, required this.hasData, required this.hasError, this.data, this.error});
  final bool isLoading;
  final bool hasData;
  final bool hasError;
  final T? data;
  final Object? error;
}

class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      color: Theme.of(context).colorScheme.surfaceContainerLowest,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title.toUpperCase(), style: Theme.of(context).textTheme.labelMedium?.copyWith(letterSpacing: 1.1)),
            const SizedBox(height: 12),
            child,
          ],
        ),
      ),
    );
  }
}

class PageScaffold extends StatelessWidget {
  const PageScaffold({super.key, required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: child,
    );
  }
}

String shortWhen(String iso) {
  if (iso.length < 16) return iso;
  return '${iso.substring(0, 10)} ${iso.substring(11, 16)}';
}
