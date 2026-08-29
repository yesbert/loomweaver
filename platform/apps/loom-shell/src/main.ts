import { bootstrapApplication } from '@angular/platform-browser';
import { Shell, provideShell, provideShellRouter } from '@loomweaver/shell';

try {
  await bootstrapApplication(Shell, {
    providers: [provideShellRouter(), provideShell()],
  });
} catch (error) {
  console.error(error);
}
