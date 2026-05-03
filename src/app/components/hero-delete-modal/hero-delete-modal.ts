import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export type HeroDeleteModalData = {
  heroName: string;
};

@Component({
  selector: 'app-hero-delete-modal',
  imports: [MatDialogModule],
  templateUrl: './hero-delete-modal.html',
  styleUrl: './hero-delete-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDeleteModal {
  readonly data = inject<HeroDeleteModalData>(MAT_DIALOG_DATA);
}
