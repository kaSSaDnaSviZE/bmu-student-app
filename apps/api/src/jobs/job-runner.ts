import { Injectable } from '@nestjs/common';

export type JobHandler = (payload: unknown) => Promise<void>;

interface QueuedJob {
  name: string;
  payload: unknown;
}

/**
 * In-process queue for reminders and cleanup. Work is not tied to the
 * lifetime of the HTTP request that enqueued it.
 */
@Injectable()
export class JobRunner {
  private readonly handlers = new Map<string, JobHandler>();
  private readonly queue: QueuedJob[] = [];
  private draining = false;

  constructor() {
    this.register('reminders', async () => undefined);
    this.register('cleanup', async () => undefined);
  }

  register(name: string, handler: JobHandler) {
    this.handlers.set(name, handler);
  }

  enqueue(name: string, payload: unknown = null) {
    if (!this.handlers.has(name)) {
      throw new Error(`No handler registered for job "${name}"`);
    }
    this.queue.push({ name, payload });
    void this.drain();
  }

  async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        if (!job) break;
        const handler = this.handlers.get(job.name);
        if (!handler) throw new Error(`No handler registered for job "${job.name}"`);
        await handler(job.payload);
      }
    } finally {
      this.draining = false;
      if (this.queue.length > 0) {
        void this.drain();
      }
    }
  }
}
