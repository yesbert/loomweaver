import { PluginSession } from '@loomweaver/plugin-sdk';

class TestbedSession {
  private session: PluginSession | null = null;

  bind(session: PluginSession): void {
    this.session = session;
  }

  unbind(): void {
    this.session = null;
  }

  summary(): string {
    if (!this.session?.authenticated()) {
      return 'signed out';
    }
    const roles = this.session.roles();
    return roles.length ? roles.join(', ') : 'signed in';
  }
}

export const testbedSession = new TestbedSession();
