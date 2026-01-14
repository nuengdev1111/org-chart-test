import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export interface PositionDialogResult {
  name: string;
  section: string;
}

@Component({
  selector: 'app-position-dialog',
  template: `
    <h2 mat-dialog-title>Create Position</h2>

    <div mat-dialog-content [formGroup]="form" class="content">
      <mat-form-field appearance="outline">
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" placeholder="e.g. IT Support" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Section</mat-label>
        <mat-select formControlName="section">
          <mat-option *ngFor="let s of sections" [value]="s">{{ s }}</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Create</button>
    </div>
  `,
  styles: [`
    .content { display: grid; gap: 12px; margin-top: 8px; width: 360px; max-width: 90vw; }
  `]
})
export class PositionDialogComponent {
  sections: string[] = ['IT', 'Finance', 'HR', 'Sales', 'Other'];

  form = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(60)]),
    section: new FormControl(this.sections[0], [Validators.required]),
  });

  constructor(
    private ref: MatDialogRef<PositionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data?.sections?.length) this.sections = data.sections;
    this.form.patchValue({ section: this.sections[0] });
  }

  close() { this.ref.close(); }

  submit() {
    const v: any = this.form.getRawValue();
    this.ref.close({ name: (v.name || '').trim(), section: (v.section || '').trim() } as PositionDialogResult);
  }
}
