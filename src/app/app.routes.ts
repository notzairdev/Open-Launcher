import { Routes } from '@angular/router';
import { MiddlewareComponent } from './bin/stages/program/auth/middleware/middleware.component';
import { LoginComponent } from './bin/stages/program/auth/login/login.component';
import { InitComponent } from './bin/stages/program/inside/init/init.component';

export const routes: Routes = [
    {path: '', component: MiddlewareComponent},
    {path: 'auth', component: LoginComponent},
    {path: 'init', component: InitComponent}
];
