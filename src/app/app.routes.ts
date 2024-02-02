import { Routes } from '@angular/router';

import { LandingComponent } from './landing/landing.component';
import { RecordingComponent } from './recording/recording.component';
import { ReviewComponent } from './review/review.component';
import { UploadComponent } from './upload/upload.component';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'landing', component: LandingComponent },
  { path: 'record', component: RecordingComponent },
  { path: 'review', component: ReviewComponent },
  { path: 'upload', component: UploadComponent }
];