import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
} from '@angular/core';
import { NgControl } from '@angular/forms';

@Component({
  selector: 'app-input-text',
  imports: [],
  templateUrl: './input-text.html',
  styleUrl: './input-text.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputText {
  readonly label = input.required<string>();
  readonly type = input<string>('text');
  readonly autocomplete = input<string>('off');
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly step = input<number | undefined>(undefined);
  readonly inputId = input<string | undefined>(undefined);

  readonly errorMessages = input<Record<string, string>>({});

  private readonly ngControl = inject(NgControl, { self: true });
  private readonly cdr = inject(ChangeDetectorRef);

  protected value = '';
  protected disabled = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected resolvedId(): string {
    const explicit = this.inputId();
    if (explicit) {
      return explicit;
    }
    return inputIdFromLabel(this.label());
  }

  protected showError(): boolean {
    const c = this.ngControl.control;
    return !!c && c.invalid && c.touched && !!c.errors;
  }

  protected errorText(): string {
    const c = this.ngControl.control;
    const errors = c?.errors;
    if (!errors) {
      return '';
    }
    const key = Object.keys(errors)[0];
    const custom = this.errorMessages()[key];
    if (custom) {
      return custom;
    }
    if (key === 'required') {
      return 'This field is required';
    }
    if (key === 'maxlength') {
      const max = (errors['maxlength'] as { requiredLength: number }).requiredLength;
      return `Maximum length is ${max}`;
    }
    return 'Invalid value';
  }

  constructor() {
    this.ngControl.valueAccessor = this;
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  private isLimitedNumberField(): boolean {
    return (
      this.type() === 'number' &&
      this.min() !== undefined &&
      this.max() !== undefined
    );
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (!this.isLimitedNumberField() || this.disabled || event.isComposing) {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    const key = event.key;
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End'].includes(key)) {
      return;
    }
    if (['ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
      return;
    }
    if (key.length === 1 && key >= '0' && key <= '9') {
      return;
    }
    event.preventDefault();
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    let v = el.value;
    if (this.isLimitedNumberField()) {
      const min = this.min()!;
      const max = this.max()!;
      const next = limitDigitString(v, min, max);
      if (next !== v) {
        el.value = next;
        v = next;
      }
    }
    this.value = v;
    this.onChange(v);
    if (this.isLimitedNumberField()) {
      this.cdr.markForCheck();
    }
  }

  protected onBlur(): void {
    this.onTouched();
    this.cdr.markForCheck();
  }
}

function inputIdFromLabel(label: string): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base ? `input-${base}` : `input-${Math.random().toString(36).slice(2, 9)}`;
}

function limitDigitString(raw: string, min: number, max: number): string {
  const v = min >= 0 ? raw.replace(/[^0-9]/g, '') : raw.replace(/[^0-9-]/g, '');
  if (v === '' || v === '-') {
    return '';
  }
  const n = Number(v);
  if (!Number.isFinite(n)) {
    return '';
  }
  if (n > max) {
    return String(max);
  }
  if (n < min) {
    return String(min);
  }
  return v;
}
