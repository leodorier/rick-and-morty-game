import { GameEventMap } from './Events';

type EventHandler<T> = (data: T) => void;

/**
 * High-performance, strongly-typed central event bus.
 */
export class EventBus {
  private static instance: EventBus;
  private listeners: Map<keyof GameEventMap, Set<EventHandler<any>>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends keyof GameEventMap>(event: K, handler: EventHandler<GameEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Return unbind function for convenience
    return () => this.off(event, handler);
  }

  public off<K extends keyof GameEventMap>(event: K, handler: EventHandler<GameEventMap[K]>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public once<K extends keyof GameEventMap>(event: K, handler: EventHandler<GameEventMap[K]>): void {
    const wrapper: EventHandler<GameEventMap[K]> = (data: GameEventMap[K]) => {
      this.off(event, wrapper);
      handler(data);
    };
    this.on(event, wrapper);
  }

  public emit<K extends keyof GameEventMap>(event: K, data: GameEventMap[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      // Iterate over a shallow copy to prevent mutation issues if handlers unbind during dispatch
      for (const handler of Array.from(handlers)) {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error executing listener for event "${String(event)}":`, err);
        }
      }
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  public listenerCount<K extends keyof GameEventMap>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export const eventBus = EventBus.getInstance();
