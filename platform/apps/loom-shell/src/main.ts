import { bootstrapApplication } from '@angular/platform-browser';
import { Shell, provideShell, provideShellRouter } from '@loomweaver/shell';

bootstrapApplication(Shell, {
  providers: [provideShellRouter(), provideShell()],
}).catch((err) => console.error(err));
