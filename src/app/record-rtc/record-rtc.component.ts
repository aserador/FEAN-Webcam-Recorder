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

  videoConf = { 
    video: { 
      facingMode: "environment", 
      width: window.innerWidth * 0.65
    }, 
    audio: true
  };
  videoQualities = [
    { label: '420p', value: '420p' },
    { label: '720p', value: '720p' },
    { label: '1080p', value: '1080p' },
    { label: '4k', value: '4k' },
  ];
  private _selectedQuality = '1080p';
  
  hasCamera: Promise<boolean> = Promise.resolve(true);

  set selectedQuality(value: string) {
    if (this.videoQualities.some(q => q.value === value)) {
      this._selectedQuality = value;
      this.videoRecordingService.setResolution(value as "420p" | "720p" | "1080p" | "4k");
    }
  }

  constructor(
    private ref: ChangeDetectorRef,
    private videoRecordingService: VideoRecordingService,
    private sanitizer: DomSanitizer
  ) {
    console.log('RecordRtcComponent constructor called');

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
    this.previewCamera();

    this.hasCamera = navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        return true;
      })
      .catch(error => {
        return false;
      });
  }

  ngAfterViewInit() {
    this.video = this.videoElement.nativeElement;
  }

  previewCamera() {
    navigator.mediaDevices.getUserMedia(this.videoConf)
    .then(stream => {
      this.videoStream = stream;
      this.video.srcObject = this.videoStream;
      this.video.muted = true;
      this.video.play();
    })
    .catch(function (err) {
      console.log(err.name + ": " + err.message);
    });
  }

  startVideoRecording() {
    console.log('startVideoRecording called');
    if (!this.isVideoRecording) {
      this.video.controls = false;
      this.isVideoRecording = true;
      this.videoRecordingService.startRecording(this.videoConf)
      .then(stream => {
        if (this.videoStream) {
          let tracks = this.videoStream.getTracks();
          tracks.forEach(track => track.stop());
        }
        this.videoStream = stream;
        this.video.srcObject = this.videoStream;
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
      this.videoRecordingService.abortRecording();
      this.video.controls = false;
    }
  }

  stopVideoRecording() {
    if (this.isVideoRecording) {
      this.videoRecordingService.stopRecording();
      if (this.video.srcObject) {
        let stream = this.video.srcObject as MediaStream;
        let tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      this.video.srcObject = null;
      this.isVideoRecording = false;
      this.video.controls = true;
      this.video.muted = false;
      this.video.classList.add('video-container');
    }
  }

  clearVideoRecordedData() {
    this.videoBlobUrl = '';
    this.video.srcObject = null;
    this.video.controls = false;
    this.ref.detectChanges();

    this.previewCamera();
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