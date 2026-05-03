import { Routes } from '@angular/router';

import { HeroCreator } from './components/hero-creator/hero-creator';
import { HeroDetails } from './components/hero-details/hero-details';
import { Heroes } from './components/heroes/heroes';
import { Home } from './components/home/home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'heroes/create', component: HeroCreator },
  { path: 'heroes/:id', component: HeroDetails },
  { path: 'heroes', component: Heroes },
];
