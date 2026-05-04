import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

export interface PaymentModalData {
  expenseName: string;
  amountRemaining: number;
  amountTotal: number;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './payment-modal.component.html',
  styleUrls: ['./payment-modal.component.scss']
})
export class PaymentModalComponent {
  customAmount: number | null = null;
  errorMessage: string = '';

  constructor(
    public dialogRef: MatDialogRef<PaymentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentModalData
  ) {
    this.customAmount = data.amountRemaining;
  }

  payTotalRemaining() {
    this.dialogRef.close(this.data.amountRemaining);
  }

  confirmCustomAmount() {
    if (!this.customAmount || this.customAmount <= 0) {
      this.errorMessage = 'Ingresa un monto válido';
      return;
    }
    if (this.customAmount > this.data.amountRemaining) {
      this.errorMessage = `No puedes pagar más del restante (S/ ${this.data.amountRemaining})`;
      return;
    }
    this.dialogRef.close(this.customAmount);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
