import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { RecordComponent } from './record/record.component';
import { ReviewComponent } from './review/review.component';
import { UploadComponent } from './upload/upload.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'record', component: RecordComponent },
  { path: 'review', component: ReviewComponent },
  { path: 'upload', component: UploadComponent },
  { path: '**', redirectTo: '' } // redirect to `LandingComponent` if no matching route is found
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }