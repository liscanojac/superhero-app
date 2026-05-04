import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { routes } from '../../app.routes';
import { Superhero } from '../../services/superhero';
import { HeroCreator } from './hero-creator';

describe('HeroCreator', () => {
  let addSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addSpy = vi.fn();
  });

  async function createFixture(): Promise<ComponentFixture<HeroCreator>> {
    await TestBed.configureTestingModule({
      imports: [HeroCreator],
      providers: [
        provideRouter(routes),
        {
          provide: Superhero,
          useValue: {
            addCreatedHero: addSpy,
            consumeHeroCreatorPrefill: () => null,
            setHeroCreatorPrefill: vi.fn(),
          },
        },
      ],
    }).compileComponents();
    return TestBed.createComponent(HeroCreator);
  }

  it('should create', async () => {
    const fixture = await createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call addCreatedHero and navigate when the form is valid', async () => {
    const fixture = await createFixture();
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.form.patchValue({ name: 'Robin' });
    await fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Robin' }),
    );
    expect(navSpy).toHaveBeenCalledWith(['/heroes']);
  });

  it('should not call addCreatedHero when name is only whitespace', async () => {
    const fixture = await createFixture();
    const router = TestBed.inject(Router);
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.patchValue({ name: '   ' });
    await fixture.componentInstance.submit();
    expect(addSpy).not.toHaveBeenCalled();
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('prefills the form when setHeroCreatorPrefill was used before creating the component', async () => {
    await TestBed.configureTestingModule({
      imports: [HeroCreator],
      providers: [provideRouter(routes), Superhero, provideHttpClient()],
    }).compileComponents();
    const superhero = TestBed.inject(Superhero);
    superhero.setHeroCreatorPrefill({
      name: 'Copy of Test',
      publisher: 'Pub',
      intelligence: '42',
    });
    const fixture = TestBed.createComponent(HeroCreator);
    expect(fixture.componentInstance.form.get('name')?.value).toBe('Copy of Test');
    expect(fixture.componentInstance.form.get('publisher')?.value).toBe('Pub');
    expect(fixture.componentInstance.form.get('intelligence')?.value).toBe('42');
  });
});
