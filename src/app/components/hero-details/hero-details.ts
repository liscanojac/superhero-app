import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, firstValueFrom, map, of, switchMap, tap } from 'rxjs';

import { HeroDeleteModal } from '../hero-delete-modal/hero-delete-modal';

import type { SuperheroListRow } from '../../models/superhero-api.model';
import { createLocalHeroInputsFromApi } from '../../models/superhero-list.mappers';
import { ApiService } from '../../services/api-service';
import { Superhero } from '../../services/superhero';

type LoadOutcome =
  | { kind: 'ok'; hero: SuperheroListRow }
  | { kind: 'err' };

@Component({
  selector: 'app-hero-details',
  imports: [MatProgressSpinnerModule, RouterLink],
  templateUrl: './hero-details.html',
  styleUrl: './hero-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly api = inject(ApiService);
  private readonly superhero = inject(Superhero);
  private readonly destroyRef = inject(DestroyRef);

  readonly hero = signal<SuperheroListRow | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  private readonly photoFailed = signal(false);

  constructor() {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(false);
          this.hero.set(null);
          this.photoFailed.set(false);
        }),
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            return of<LoadOutcome>({ kind: 'err' });
          }
          const fromList = this.superhero.superheroList().find((h) => h.id === id);
          if (fromList?.created) {
            return of<LoadOutcome>({ kind: 'ok', hero: fromList });
          }
          try {
            return this.api.getCharacterById(id).pipe(
              map((res): LoadOutcome =>
                res.response === 'success'
                  ? { kind: 'ok', hero: { ...res, created: false } }
                  : { kind: 'err' },
              ),
              catchError(() => of<LoadOutcome>({ kind: 'err' })),
            );
          } catch {
            return of<LoadOutcome>({ kind: 'err' });
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((out) => {
        this.loading.set(false);
        if (out.kind === 'ok') {
          this.hero.set(out.hero);
        } else {
          this.error.set(true);
          this.hero.set(null);
        }
      });
  }

  shouldShowPhoto(): boolean {
    const h = this.hero();
    if (!h) {
      return false;
    }
    const url = h.image.url?.trim();
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

  presentString(value: string | undefined | null): boolean {
    return isPresentScalar(value);
  }

  textString(value: string | undefined | null): string {
    return displayScalar(value);
  }

  presentArray(values: string[] | undefined | null): boolean {
    return isPresentArray(values);
  }

  textArrayJoined(values: string[] | undefined | null, separator: string): string {
    return displayArrayJoined(values, separator);
  }

  powerstatClasses(value: string | undefined | null): string {
    if (!this.presentString(value)) {
      return 'details-value--empty';
    }
    const band = powerstatBand(value);
    return band != null ? `details-powerstat--${band}` : '';
  }

  async confirmRemoveHero(hero: SuperheroListRow): Promise<void> {
    const ref = this.dialog.open(HeroDeleteModal, {
      data: { heroName: hero.name },
      width: 'min(100vw - 32px, 360px)',
      autoFocus: 'first-tabbable',
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (confirmed === true) {
      this.superhero.deleteHero(hero.id);
      void this.router.navigate(['/heroes']);
    }
  }

  duplicateHero(hero: SuperheroListRow): void {
    const copyName = `Copy of ${hero.name}`.trim();
    const payload = createLocalHeroInputsFromApi(hero, { name: copyName });
    this.superhero.setHeroCreatorPrefill(payload);
    void this.router.navigate(['/heroes/create']);
  }
}

type PowerstatBand = 'red' | 'orange' | 'yellow' | 'green' | 'gold';

function powerstatBand(value: string | undefined | null): PowerstatBand | null {
  if (!isPresentScalar(value)) {
    return null;
  }
  const n = Number(String(value).trim());
  if (!Number.isFinite(n)) {
    return null;
  }
  if (n > 100) {
    return 'gold';
  }
  if (n > 75) {
    return 'green';
  }
  if (n >= 51) {
    return 'yellow';
  }
  if (n >= 26) {
    return 'orange';
  }
  return 'red';
}

function isPresentScalar(value: string | undefined | null): boolean {
  if (value == null) {
    return false;
  }
  const t = String(value).trim();
  if (t === '' || t === '-') {
    return false;
  }
  if (t.toLowerCase() === 'null') {
    return false;
  }
  return true;
}

function isPresentArray(values: string[] | undefined | null): boolean {
  if (!values || values.length === 0) {
    return false;
  }
  return values.some((v) => isPresentScalar(v));
}

function displayScalar(value: string | undefined | null): string {
  return isPresentScalar(value) ? String(value).trim() : '—';
}

function displayArrayJoined(
  values: string[] | undefined | null,
  separator: string,
): string {
  if (!isPresentArray(values)) {
    return '—';
  }
  return (values ?? [])
    .map((v) => String(v).trim())
    .filter((v) => isPresentScalar(v))
    .join(separator);
}
