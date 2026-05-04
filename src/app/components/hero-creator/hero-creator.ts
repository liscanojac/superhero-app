import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LocalHeroInput } from '../../models/superhero-creator.model';
import { Superhero } from '../../services/superhero';
import { InputText } from '../input-text/input-text';
import { nameRequiredTrimmed, optionalPowerstat, normalizeStatString, trimOrUndefined } from '../../models/superhero-creator-form';

@Component({
  selector: 'app-hero-creator',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputText,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './hero-creator.html',
  styleUrl: './hero-creator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCreator {
  private readonly fb = inject(FormBuilder);
  private readonly superhero = inject(Superhero);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.applyHeroCreatorPrefill();
    merge(this.form.statusChanges, this.form.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.cdr.markForCheck());
  }

  private applyHeroCreatorPrefill(): void {
    const p = this.superhero.consumeHeroCreatorPrefill();
    if (!p) {
      return;
    }
    this.form.patchValue({
      name: p.name,
      imageUrl: p.imageUrl ?? '',
      intelligence: p.intelligence ?? '',
      strength: p.strength ?? '',
      speed: p.speed ?? '',
      durability: p.durability ?? '',
      power: p.power ?? '',
      combat: p.combat ?? '',
      fullName: p.fullName ?? '',
      alterEgos: p.alterEgos ?? '',
      aliasesCsv: p.aliasesCsv ?? '',
      placeOfBirth: p.placeOfBirth ?? '',
      firstAppearance: p.firstAppearance ?? '',
      publisher: p.publisher ?? '',
      alignment: p.alignment ?? 'good',
      gender: p.gender ?? 'Unknown',
      race: p.race ?? '',
      height0: p.height0 ?? '',
      height1: p.height1 ?? '',
      weight0: p.weight0 ?? '',
      weight1: p.weight1 ?? '',
      eyeColor: p.eyeColor ?? '',
      hairColor: p.hairColor ?? '',
      occupation: p.occupation ?? '',
      base: p.base ?? '',
      groupAffiliation: p.groupAffiliation ?? '',
      relatives: p.relatives ?? '',
    });
  }

  /** Passed to `app-input-text` for the name control (custom validator uses `required`). */
  readonly nameErrorMessages: Record<string, string> = {
    required: 'Name is required',
  };

  /** Powerstats: optional; when set, whole numbers 0–100 only (API numeric strings). */
  readonly statErrorMessages: Record<string, string> = {
    powerstatDigits: 'Use a whole number (no decimals or letters)',
    powerstatBelowMin: 'Cannot be below 0',
    powerstatAboveMax: 'Cannot be greater than 100',
  };

  readonly form = this.fb.group({
    name: ['', [nameRequiredTrimmed(), Validators.maxLength(200)]],
    imageUrl: ['', [Validators.maxLength(2000)]],
    intelligence: ['', [optionalPowerstat()]],
    strength: ['', [optionalPowerstat()]],
    speed: ['', [optionalPowerstat()]],
    durability: ['', [optionalPowerstat()]],
    power: ['', [optionalPowerstat()]],
    combat: ['', [optionalPowerstat()]],
    fullName: ['', [Validators.maxLength(200)]],
    alterEgos: ['', [Validators.maxLength(200)]],
    aliasesCsv: ['', [Validators.maxLength(2000)]],
    placeOfBirth: ['', [Validators.maxLength(200)]],
    firstAppearance: ['', [Validators.maxLength(200)]],
    publisher: ['', [Validators.maxLength(200)]],
    alignment: ['good'],
    gender: ['Unknown'],
    race: ['', [Validators.maxLength(100)]],
    height0: ['', [Validators.maxLength(100)]],
    height1: ['', [Validators.maxLength(100)]],
    weight0: ['', [Validators.maxLength(100)]],
    weight1: ['', [Validators.maxLength(100)]],
    eyeColor: ['', [Validators.maxLength(100)]],
    hairColor: ['', [Validators.maxLength(100)]],
    occupation: ['', [Validators.maxLength(500)]],
    base: ['', [Validators.maxLength(500)]],
    groupAffiliation: ['', [Validators.maxLength(2000)]],
    relatives: ['', [Validators.maxLength(4000)]],
  });

  submit(): void {
    this.form.markAllAsTouched();
    this.cdr.markForCheck();
    if (this.form.invalid) {
      return;
    }
    const v = this.form.getRawValue();
    const payload: LocalHeroInput = {
      name: v.name!.trim(),
      imageUrl: trimOrUndefined(v.imageUrl),
      intelligence: normalizeStatString(trimOrUndefined(v.intelligence)),
      strength: normalizeStatString(trimOrUndefined(v.strength)),
      speed: normalizeStatString(trimOrUndefined(v.speed)),
      durability: normalizeStatString(trimOrUndefined(v.durability)),
      power: normalizeStatString(trimOrUndefined(v.power)),
      combat: normalizeStatString(trimOrUndefined(v.combat)),
      fullName: trimOrUndefined(v.fullName),
      alterEgos: trimOrUndefined(v.alterEgos),
      aliasesCsv: trimOrUndefined(v.aliasesCsv),
      placeOfBirth: trimOrUndefined(v.placeOfBirth),
      firstAppearance: trimOrUndefined(v.firstAppearance),
      publisher: trimOrUndefined(v.publisher),
      alignment: (v.alignment ?? 'good').trim() || 'good',
      gender: trimOrUndefined(v.gender),
      race: trimOrUndefined(v.race),
      height0: trimOrUndefined(v.height0),
      height1: trimOrUndefined(v.height1),
      weight0: trimOrUndefined(v.weight0),
      weight1: trimOrUndefined(v.weight1),
      eyeColor: trimOrUndefined(v.eyeColor),
      hairColor: trimOrUndefined(v.hairColor),
      occupation: trimOrUndefined(v.occupation),
      base: trimOrUndefined(v.base),
      groupAffiliation: trimOrUndefined(v.groupAffiliation),
      relatives: trimOrUndefined(v.relatives),
    };
    this.superhero.addCreatedHero(payload);
    void this.router.navigate(['/heroes']);
  }
}


