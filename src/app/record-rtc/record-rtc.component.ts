import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { VideoRecordingService } from './record-service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-record-rtc',
  templateUrl: './record-rtc.component.html',
  styleUrls: ['./record-rtc.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class RecordRtcComponent implements OnDestroy, OnInit {

  @ViewChild('videoElement') videoElement!: ElementRef;
  video!: HTMLVideoElement;
  isVideoRecording = false;
  videoRecordedTime!: string
  videoBlobUrl!: SafeUrl
  videoBlob!: Blob
  videoName!: string
  videoStream!: MediaStream;
  videoConf = { video: { facingMode:"user", width: 320 }, audio: true}

  constructor(
    private ref: ChangeDetectorRef,
    private videoRecordingService: VideoRecordingService,
    private sanitizer: DomSanitizer
  ) {
    console.log('RecordRtcComponent constructor called');
    // Make sure these methods are implemented in your VideoRecordingService
    this.videoRecordingService.recordingFailed().subscribe(() => {
      this.isVideoRecording = false;
      this.ref.detectChanges();
    });

    this.videoRecordingService.getRecordedTime().subscribe((time: string) => {
      this.videoRecordedTime = time;
      this.ref.detectChanges();
    });

    this.videoRecordingService.getStream().subscribe((stream: MediaStream) => {
      this.videoStream = stream;
      this.ref.detectChanges();
    });

    this.videoRecordingService.getRecordedBlob().subscribe((data: {blob: Blob, title: string, url: string}) => {
      this.videoBlob = data.blob;
      this.videoName = data.title;
      this.videoBlobUrl = this.sanitizer.bypassSecurityTrustUrl(data.url);
      this.ref.detectChanges();
    });
  }

  ngOnInit() {
    console.log('RecordRtcComponent ngOnInit called');
  }

  ngAfterViewInit() {
    this.video = this.videoElement.nativeElement;
  }

  startVideoRecording() {
    console.log('startVideoRecording called');
    if (!this.isVideoRecording) {
      this.video.controls = false;
      this.isVideoRecording = true;
      this.videoRecordingService.startRecording(this.videoConf)
      .then(stream => {
        this.video.srcObject = stream;
        this.video.play();
      })
      .catch(function (err) {
        console.log(err.name + ": " + err.message);
      });
    }
  }

  abortVideoRecording() {
    if (this.isVideoRecording) {
      this.isVideoRecording = false;
      // Make sure this method is implemented in your VideoRecordingService
      this.videoRecordingService.abortRecording();
      this.video.controls = false;
    }
  }

  stopVideoRecording() {
    if (this.isVideoRecording) {
      // Make sure this method is implemented in your VideoRecordingService
      this.videoRecordingService.stopRecording();
      if (this.video.srcObject) {
        let stream = this.video.srcObject as MediaStream;
        let tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      this.video.srcObject = null;
      this.isVideoRecording = false;
      this.video.controls = true;
    }
  }

  clearVideoRecordedData() {
    this.videoBlobUrl = '';
    this.video.srcObject = null;
    this.video.controls = false;
    this.ref.detectChanges();
  }

  downloadVideoRecordedData() {
    this._downloadFile(this.videoBlob, 'video/mp4', this.videoName);
  }

  ngOnDestroy(): void {
    this.abortVideoRecording();
  }

  _downloadFile(data: Blob, type: string, filename: string): any {
    const blob = new Blob([data], { type: type });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}