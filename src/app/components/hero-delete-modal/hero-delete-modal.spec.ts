import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { HeroDeleteModal } from './hero-delete-modal';

describe('HeroDeleteModal', () => {
  let component: HeroDeleteModal;
  let fixture: ComponentFixture<HeroDeleteModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroDeleteModal],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { heroName: 'Test Hero' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroDeleteModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
