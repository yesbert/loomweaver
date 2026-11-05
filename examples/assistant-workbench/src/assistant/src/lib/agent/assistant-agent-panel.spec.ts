import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { EventType, type ToolMessage } from '@ag-ui/core';
import type { CommandTools } from '@loomweaver/ag-ui';
import { AssistantAgentPanel } from './assistant-agent-panel';
import { assistantTools } from './assistant-connection';
import { openRouterKey } from './openrouter-key';

const WORDING = { assistant: { error: { noMessage: 'nothing came back' } } };

function completion(message: unknown): Response {
  return new Response(JSON.stringify({ choices: message ? [{ message }] : [] }), { status: 200 });
}

function render(): ComponentFixture<AssistantAgentPanel> {
  TestBed.configureTestingModule({
    imports: [
      AssistantAgentPanel,
      TranslocoTestingModule.forRoot({
        langs: { en: WORDING },
        translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
      }),
    ],
  });
  const fixture = TestBed.createComponent(AssistantAgentPanel);
  fixture.detectChanges();
  return fixture;
}

function ask(fixture: ComponentFixture<AssistantAgentPanel>, prompt: string): HTMLTextAreaElement {
  const panel = fixture.nativeElement as HTMLElement;
  const field = panel.querySelector('textarea')!;
  field.focus();
  field.value = prompt;
  field.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  panel.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  fixture.detectChanges();
  return field;
}

async function untilIdle(fixture: ComponentFixture<AssistantAgentPanel>): Promise<void> {
  const send = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type=submit]')!;
  await vi.waitFor(() => {
    fixture.detectChanges();
    expect(send.disabled).toBe(false);
  });
}

describe('AssistantAgentPanel', () => {
  beforeEach(() => {
    openRouterKey.use('sk-or-v1-abc');
    assistantTools.set({
      list: () => [],
      receive: () => Promise.resolve(null),
      flush: () => Promise.resolve(null),
    });
  });

  afterEach(() => {
    openRouterKey.forget();
    assistantTools.set(null);
    vi.unstubAllGlobals();
  });

  it('says a failure of the run in the wording of the workbench', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(completion(null)));
    const fixture = render();

    ask(fixture, 'open the ticket');
    await untilIdle(fixture);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('nothing came back');
  });

  it('keeps the focus on the prompt across a run', async () => {
    let answer: ((response: Response) => void) | undefined;
    vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => (answer = resolve)));
    const fixture = render();

    const field = ask(fixture, 'open the ticket');
    await vi.waitFor(() => expect(answer).toBeDefined());
    fixture.detectChanges();

    expect(field.disabled).toBe(false);
    expect(field.readOnly).toBe(true);
    expect(document.activeElement).toBe(field);

    answer?.(completion({ role: 'assistant', content: 'Done.' }));
    await untilIdle(fixture);

    expect(field.readOnly).toBe(false);
    expect(document.activeElement).toBe(field);
  });

  it('keeps a prompt in the field when the connection to the workbench is not ready', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(completion({ role: 'assistant', content: 'Done.' })));
    assistantTools.set(null);
    const fixture = render();

    const field = ask(fixture, 'open the ticket');

    expect(field.value).toBe('open the ticket');
  });

  it('keeps a prompt in the field when it is submitted while a run is under way', async () => {
    let answer: ((response: Response) => void) | undefined;
    vi.stubGlobal('fetch', () => new Promise<Response>((resolve) => (answer = resolve)));
    const fixture = render();
    ask(fixture, 'open the ticket');
    await vi.waitFor(() => expect(answer).toBeDefined());
    fixture.detectChanges();

    const field = ask(fixture, 'and assign it to Dana');

    expect(field.value).toBe('and assign it to Dana');
    answer?.(completion({ role: 'assistant', content: 'Done.' }));
    await untilIdle(fixture);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('and assign it to Dana');
    expect(field.value).toBe('and assign it to Dana');
  });

  it('answers the calls a run left open when the run breaks off, and tells the agent what it answered', async () => {
    const call = { id: 'c1', type: 'function', function: { name: 'tickets__open', arguments: '{}' } };
    const sent: { messages: Record<string, unknown>[] }[] = [];
    vi.stubGlobal('fetch', (_input: unknown, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)) as { messages: Record<string, unknown>[] });
      return Promise.resolve(
        completion(
          sent.length === 1
            ? { role: 'assistant', content: null, tool_calls: [call] }
            : { role: 'assistant', content: 'Done.' },
        ),
      );
    });
    const left: (ToolMessage | null)[] = [
      { id: 'c1.result', role: 'tool', toolCallId: 'c1', content: '', error: 'this call was left open' },
    ];
    const tools: CommandTools = {
      list: () => [],
      receive: (event) =>
        event.type === EventType.TOOL_CALL_END
          ? Promise.reject(new Error('the connection broke off'))
          : Promise.resolve(null),
      flush: () => Promise.resolve(left.shift() ?? null),
    };
    assistantTools.set(tools);
    const fixture = render();

    ask(fixture, 'open the ticket');
    await untilIdle(fixture);

    const said = (fixture.nativeElement as HTMLElement).textContent;
    expect(said).toContain('the connection broke off');
    expect(said).toContain('this call was left open');
    expect(left).toHaveLength(0);

    ask(fixture, 'and now?');
    await vi.waitFor(() => expect(sent).toHaveLength(2));
    await untilIdle(fixture);

    expect(sent[1].messages).toContainEqual({
      role: 'tool',
      tool_call_id: 'c1',
      content: 'this call was left open',
    });
  });
});
