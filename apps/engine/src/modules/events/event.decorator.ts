import { OnEvent as OnEventInternal } from '@nestjs/event-emitter';
import type { Event } from './events';

export function OnEvent<T extends Event>(event: T) {
  return OnEventInternal(event);
}
