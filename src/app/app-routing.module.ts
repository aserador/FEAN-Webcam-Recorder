import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { RecordRtcComponent } from './record-rtc/record-rtc.component';
import { MyVideosComponent } from './my-videos/my-videos.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'record', component: RecordRtcComponent },
  { path: 'my-videos', component: MyVideosComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }