import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { markLookOnDocument } from './looks/look-choice';

markLookOnDocument();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
