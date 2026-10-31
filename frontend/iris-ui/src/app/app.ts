import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatbotComponent } from './shared/chatbot/chatbot';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatbotComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}