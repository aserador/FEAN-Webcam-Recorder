import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { UploadComponent } from './upload/upload.component';
import { RecordRtcComponent } from './record-rtc/record-rtc.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'record', component: RecordRtcComponent },
  { path: 'upload', component: UploadComponent },
  { path: '**', redirectTo: '' } // redirect to `LandingComponent` if no matching route is found
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }