import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/l10n.dart';
import '../core/providers.dart';
import '../core/repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final email = TextEditingController(text: 'demo.student@bmu.example');
  final password = TextEditingController(text: 'DemoPass123!');
  bool busy = false;
  String? error;

  @override
  void dispose() {
    email.dispose();
    password.dispose();
    super.dispose();
  }

  Future<void> submit() async {
    setState(() {
      busy = true;
      error = null;
    });
    try {
      await ref.read(repositoryProvider).login(email.text.trim(), password.text);
    } on ApiException catch (err) {
      setState(() => error = err.message);
    } catch (err) {
      setState(() => error = err.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(sessionProvider).lang;
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
          children: [
            Text(t(lang, 'appName'), style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text('Baku Engineering University', style: TextStyle(color: scheme.onSurfaceVariant)),
            const SizedBox(height: 28),
            TextField(controller: email, decoration: InputDecoration(labelText: t(lang, 'email')), keyboardType: TextInputType.emailAddress),
            const SizedBox(height: 12),
            TextField(controller: password, decoration: InputDecoration(labelText: t(lang, 'password')), obscureText: true),
            if (error != null) ...[
              const SizedBox(height: 12),
              Text(error!, style: TextStyle(color: scheme.error)),
            ],
            const SizedBox(height: 20),
            FilledButton(onPressed: busy ? null : submit, child: Text(busy ? '...' : t(lang, 'login'))),
            const SizedBox(height: 16),
            Text(t(lang, 'demoHint'), style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
