import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrgNode } from '../models';

export interface ParentDialogData {
  level: number;
  parents: OrgNode[];
}

@Component({
  selector: 'app-parent-dialog',
  template: `
    <h2 mat-dialog-title>Select Parent</h2>

    <div mat-dialog-content class="content">
      <div class="hint">
        New node will be placed in <b>Level {{ data.level }}</b>.
        Choose a parent from Level {{ data.level - 1 }}.
      </div>

      <mat-radio-group [(ngModel)]="selectedId" class="radio">
        <mat-radio-button *ngFor="let p of data.parents" [value]="p.id">
          {{ p.name }} <span class="sec">({{ p.section }})</span>
        </mat-radio-button>
      </mat-radio-group>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!selectedId" (click)="ok()">OK</button>
    </div>
  `,
  styles: [`
    .content { width: 420px; max-width: 92vw; }
    .hint { margin: 6px 0 12px; opacity: .85; }
    .radio { display: grid; gap: 10px; }
    .sec { opacity: .7; }
  `]
})
export class ParentDialogComponent {
  selectedId: string | null = null;

  constructor(
    private ref: MatDialogRef<ParentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ParentDialogData
  ) {}

  cancel() { this.ref.close(null); }
  ok() { this.ref.close(this.selectedId); }
}
