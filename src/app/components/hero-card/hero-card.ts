import {
  Component,
  inject,
  input,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { SuperheroListRow } from '../../models/superhero-api.model';
import { Superhero } from '../../services/superhero';

import { HeroDeleteModal } from '../hero-delete-modal/hero-delete-modal';

@Component({
  selector: 'app-hero-card',
  imports: [MatCardModule, MatIconModule, RouterLink],
  templateUrl: './hero-card.html',
  styleUrl: './hero-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCard {
  readonly hero = input.required<SuperheroListRow>();

  private readonly superhero = inject(Superhero);
  private readonly dialog = inject(MatDialog);
  private readonly photoFailed = signal(false);

  shouldShowPhoto(): boolean {
    const url = this.hero().image.url?.trim();
    if (!url) {
      return false;
    }
    return !this.photoFailed();
  }

  onPhotoError(): void {
    this.photoFailed.set(true);
  }

  nameInitial(name: string): string {
    const t = name.trim();
    if (!t) {
      return '?';
    }
    return t.charAt(0).toUpperCase();
  }

  async confirmRemove(): Promise<void> {
    const ref = this.dialog.open(HeroDeleteModal, {
      data: { heroName: this.hero().name },
      width: 'min(100vw - 32px, 360px)',
      autoFocus: 'first-tabbable',
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed === true) {
      this.superhero.deleteHero(this.hero().id);
    }
  }
}
