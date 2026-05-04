import { type ValidatorFn } from '@angular/forms';

export function nameRequiredTrimmed(): ValidatorFn {
  return (control) => {
    const v = (control.value ?? '').trim();
    return v.length > 0 ? null : { required: true };
  };
}

export function optionalPowerstat(): ValidatorFn {
  return (control) => {
    const raw = control.value;
    let v: string;
    if (raw == null || raw === '') {
      v = '';
    } else if (typeof raw === 'number') {
      v = Number.isFinite(raw) ? String(Math.trunc(raw)) : '';
    } else {
      v = String(raw).trim();
    }
    if (v === '') {
      return null;
    }
    if (!/^-?\d+$/.test(v)) {
      return { powerstatDigits: true };
    }
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      return { powerstatDigits: true };
    }
    if (n < 0) {
      return { powerstatBelowMin: true };
    }
    if (n > 100) {
      return { powerstatAboveMax: true };
    }
    return null;
  };
}

export function normalizeStatString(s: string | undefined): string | undefined {
  if (s == null || s === '') {
    return undefined;
  }
  return String(Number(s));
}

export function trimOrUndefined(s: string | number | null | undefined): string | undefined {
  if (s == null || s === '') {
    return undefined;
  }
  const t = String(s).trim();
  return t.length > 0 ? t : undefined;
}