import { Injectable, Logger } from "@nestjs/common";
import { DomainException } from "../errors/domain.exception";
import type { Requests } from "./contracts";
import { NoResponderException } from "./exceptions/no-responder.exception";
import { RequestFailedException } from "./exceptions/request-failed.exception";

type Name = keyof Requests;
type Payload<K extends Name> = Requests[K]["payload"];
type Reply<K extends Name> = Requests[K]["reply"];
type Responder<K extends Name> = (
  payload: Payload<K>,
) => Reply<K> | Promise<Reply<K>>;

/** Request/reply between slices: every request has exactly one responder. */
@Injectable()
export class Bus {
  private readonly logger = new Logger(Bus.name);
  private readonly responders = new Map<Name, (payload: never) => unknown>();

  respond<K extends Name>(name: K, responder: Responder<K>): void {
    if (this.responders.has(name)) {
      throw new Error(`${name} already has a responder`);
    }
    this.responders.set(name, responder);
  }

  async request<K extends Name>(
    name: K,
    payload: Payload<K>,
  ): Promise<Reply<K>> {
    const responder = this.responders.get(name) as Responder<K> | undefined;
    if (!responder) throw new NoResponderException(name);
    try {
      return await responder(payload);
    } catch (error) {
      if (error instanceof DomainException) throw error;
      this.logger.warn(`${name} failed: ${String(error)}`);
      throw new RequestFailedException(name);
    }
  }
}
