import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Event, EventPayload } from './events';

@Injectable()
export class EventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  public emit<T extends Event>(event: T, payload: EventPayload<T>) {
    this.eventEmitter.emit(event, payload);
  }
}
