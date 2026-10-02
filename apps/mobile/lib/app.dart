import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/providers.dart';
import 'features/login_screen.dart';
import 'features/shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final session = ref.read(sessionProvider);
  final router = GoRouter(
    initialLocation: '/login',
    refreshListenable: session,
    redirect: (context, state) {
      final loggedIn = session.session != null;
      final loggingIn = state.matchedLocation == '/login';
      if (!loggedIn) return loggingIn ? null : '/login';
      if (loggingIn) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/', builder: (context, state) => const AppShell()),
    ],
  );
  ref.onDispose(router.dispose);
  return router;
});

class BmuStudentApp extends ConsumerWidget {
  const BmuStudentApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final router = ref.watch(routerProvider);
    final light = ColorScheme.fromSeed(seedColor: const Color(0xFF0E3A5D), brightness: Brightness.light);
    final dark = ColorScheme.fromSeed(seedColor: const Color(0xFF8FB4D6), brightness: Brightness.dark);
    return MaterialApp.router(
      title: 'BMU Student',
      debugShowCheckedModeBanner: false,
      routerConfig: router,
      themeMode: session.themeMode,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: light,
        scaffoldBackgroundColor: const Color(0xFFF4F1EA),
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: dark,
        inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
      ),
    );
  }
}
