import { Routes } from '@angular/router';
import { MiddlewareComponent } from './bin/stages/program/auth/middleware/middleware.component';

export const routes: Routes = [
    {path: '', component: MiddlewareComponent}
];
