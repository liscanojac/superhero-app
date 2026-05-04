import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputText } from './input-text';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, InputText],
  template: `
    <form [formGroup]="form">
      <app-input-text
        formControlName="name"
        label="Name"
        [errorMessages]="{ required: 'Name is required' }"
      />
    </form>
  `,
})
class Host {
  readonly form = new FormGroup({
    name: new FormControl('', { validators: [Validators.required] }),
  });
}

describe('InputText', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.nativeElement.querySelector('app-input-text')).toBeTruthy();
  });

  it('should show custom required message when invalid and touched', async () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await fixture.whenStable();

    const err = fixture.nativeElement.querySelector('.input-text-error');
    expect(err?.textContent?.trim()).toBe('Name is required');
  });
});
