import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeleteMode } from '../org-chart.service';

export interface DeleteDialogData {
  nodeName: string;
  hasChildren: boolean;
}

export interface DeleteDialogResult {
  confirm: boolean;
  mode: DeleteMode;
}

@Component({
  selector: 'app-delete-dialog',
  template: `
    <h2 mat-dialog-title>Delete node?</h2>

    <div mat-dialog-content class="content">
      <div>Delete <b>{{ data.nodeName }}</b> ?</div>

      <ng-container *ngIf="data.hasChildren">
        <div class="sub">This node has children. Choose behavior:</div>
        <mat-radio-group [(ngModel)]="mode" class="radio">
          <mat-radio-button value="cascade">Delete children too (cascade)</mat-radio-button>
          <mat-radio-button value="reattach">Move children to this node’s parent (reattach)</mat-radio-button>
        </mat-radio-group>
      </ng-container>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">No</button>
      <button mat-flat-button color="warn" (click)="close(true)">Yes</button>
    </div>
  `,
  styles: [`
    .content { width: 420px; max-width: 92vw; display: grid; gap: 10px; }
    .sub { margin-top: 6px; opacity: .85; }
    .radio { display: grid; gap: 10px; }
  `]
})
export class DeleteDialogComponent {
  mode: DeleteMode = 'cascade';

  constructor(
    private ref: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteDialogData
  ) {}

  close(confirm: boolean) {
    this.ref.close({ confirm, mode: this.mode } as DeleteDialogResult);
  }
}
