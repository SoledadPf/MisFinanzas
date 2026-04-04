import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/components/loading/loading.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingComponent],
  template: `
    <app-loading />
    <router-outlet />
  `,
  styleUrl: './app.scss'
})
export class App {}
