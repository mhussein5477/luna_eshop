import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  templateUrl: './welcome-modal.html',
  styleUrls: ['./welcome-modal.scss']
})
export class WelcomeModal {
  @Output() closeModal = new EventEmitter<void>();

  close() {
    this.closeModal.emit();
  }
}
