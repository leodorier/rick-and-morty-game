import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';
import { Vector2 } from '../../src/utils/Vector2';

describe('EventBus Pub/Sub', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = EventBus.getInstance();
    bus.clear();
  });

  it('should subscribe and receive emitted events', () => {
    const handler = vi.fn();
    bus.on('combat:hit', handler);

    bus.emit('combat:hit', {
      attackerId: 'rick',
      targetId: 'moth',
      damage: 30,
      damageType: 'PLASMA',
      position: new Vector2(100, 100),
      knockback: new Vector2(50, 0)
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      attackerId: 'rick',
      damage: 30
    }));
  });

  it('should unsubscribe using returned unbind function or off()', () => {
    const handler = vi.fn();
    const unbind = bus.on('timing:judged', handler);

    expect(bus.listenerCount('timing:judged')).toBe(1);
    unbind();
    expect(bus.listenerCount('timing:judged')).toBe(0);

    bus.emit('timing:judged', {
      rating: 'PERFECT',
      deltaMs: 5,
      action: 'BLASTER_BURST',
      character: 'RICK',
      position: new Vector2(0, 0),
      multiplier: 1.5
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should trigger once() listeners only once', () => {
    const handler = vi.fn();
    bus.once('game:status', handler);

    bus.emit('game:status', { status: 'START' });
    bus.emit('game:status', { status: 'PAUSE' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ status: 'START' });
  });
});
