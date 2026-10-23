export interface AssembledCall {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly json: string;
}

interface OpenCall {
  readonly toolCallId: string;
  readonly toolName: string;
  json: string;
}

export class ToolCallAssembly {
  private readonly openCalls = new Map<string, OpenCall>();
  private chunkedCallId: string | null = null;

  start(toolCallId: string, toolName: string, json = ''): void {
    this.openCalls.set(toolCallId, { toolCallId, toolName, json });
  }

  append(toolCallId: string, delta: string): void {
    const call = this.openCalls.get(toolCallId);
    if (call) {
      call.json += delta;
    }
  }

  take(toolCallId: string): AssembledCall | undefined {
    const call = this.openCalls.get(toolCallId);
    this.openCalls.delete(toolCallId);
    if (this.chunkedCallId === toolCallId) {
      this.chunkedCallId = null;
    }
    return call;
  }

  chunk(
    toolCallId: string | undefined,
    toolName: string,
    delta: string,
  ): AssembledCall | undefined {
    if (toolCallId === undefined || toolCallId === this.chunkedCallId) {
      if (this.chunkedCallId !== null) {
        this.append(this.chunkedCallId, delta);
      }
      return undefined;
    }
    const previous = this.takeChunked();
    this.start(toolCallId, toolName, delta);
    this.chunkedCallId = toolCallId;
    return previous;
  }

  takeChunked(): AssembledCall | undefined {
    return this.chunkedCallId === null
      ? undefined
      : this.take(this.chunkedCallId);
  }

  takeFirst(): AssembledCall | undefined {
    const [first] = this.openCalls.keys();
    return first === undefined ? undefined : this.take(first);
  }
}
