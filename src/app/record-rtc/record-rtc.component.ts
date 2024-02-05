import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { VideoRecordingService } from './record-service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { RecordedVideoOutput } from './record-service';
import { MenuItem } from 'primeng/api';

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
  
  hasCamera: Promise<boolean> = Promise.resolve(true);

  videoToUpload: RecordedVideoOutput | undefined;
  showUploadConfirmationDialog = false;
  showUploadProgressDialog = false;
  uploadProgress = 0;

  countdownValue: number = 3;
  isCountdownActive: boolean = false;
  countdownInterval: any;

  stepItems: MenuItem[] = [];
  activeIndex: number = 0;

  set selectedQuality(value: string) {
    if (this.videoQualities.some(q => q.value === value)) {
      this.videoRecordingService.setResolution(value as "420p" | "720p" | "1080p" | "4k");
    }
  }

  constructor(
    private http: HttpClient,
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
    this.stepItems = [
      {label: 'Record'},
      {label: 'Review'},
      {label: 'Upload'}
    ];

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

  startRecordingCountdown() {
    this.activeIndex = 0;
    if (!this.isVideoRecording && !this.isCountdownActive) {
      this.video.controls = false;
      this.isCountdownActive = true;
      this.countdownValue = 3;
      this.ref.detectChanges();

      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }

      this.countdownInterval = setInterval(() => {
        this.countdownValue--;
        this.ref.detectChanges();
        if (this.countdownValue === 0) {
          clearInterval(this.countdownInterval);
          this.isCountdownActive = false;
          this.ref.detectChanges();
          this.startVideoRecording();
        }
      }, 1000);
    }
  }

  startVideoRecording() {
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

  abortVideoRecording() {
    if (this.isVideoRecording) {
      this.isVideoRecording = false;
      this.videoRecordingService.abortRecording();
      this.video.controls = false;
      this.activeIndex = 0;
      this.ref.detectChanges();

    }
  }

  stopVideoRecording() {
    if (this.isVideoRecording) {
      this.activeIndex = 1;
      this.videoRecordingService.getRecordedBlob().subscribe((data: RecordedVideoOutput) => {
        this.videoToUpload = data;
      });
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
      this.ref.detectChanges();
      //this.video.classList.add('video-container');
    }
  }

  clearVideoRecordedData() {
    this.videoBlobUrl = '';
    this.video.srcObject = null;
    this.video.controls = false;
    this.activeIndex = 0;
    this.ref.detectChanges();

    this.previewCamera();
  }

  downloadVideoRecordedData() {
    this.downloadFile(this.videoBlob, 'video/webm', this.videoName);
  }

  ngOnDestroy(): void {
    this.abortVideoRecording();
  
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
  }

  downloadFile(data: Blob, type: string, filename: string): any {
    const blob = new Blob([data], { type: type });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  showUploadDialog() {
    this.showUploadConfirmationDialog = true;
    this.ref.detectChanges();
  }

  hideUploadDialog() {
    this.showUploadConfirmationDialog = false;
    this.ref.detectChanges();
  }

  continueRecording() {
    this.showUploadProgressDialog = false;
    this.videoToUpload = undefined;
    this.uploadProgress = 0;
  }

  uploadVideo() {
    this.activeIndex = 2;
    this.uploadProgress = 0;
    this.ref.detectChanges();
    if (this.videoToUpload) {
      console.log('uploading video');
      const formData = new FormData();
      formData.append('file', this.videoToUpload.blob, this.videoToUpload.title);

      console.log('uploading video');
      const req = new HttpRequest('POST', 'http://localhost:8080/upload', formData, {
        reportProgress: true
      });

      this.showUploadConfirmationDialog = false;
      this.showUploadProgressDialog = true;
      this.ref.detectChanges();

      this.http.request(req).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / (event.total ?? 0));
        } else if (event.type === HttpEventType.Response) {
          console.log(event.body);

          this.videoToUpload = undefined;
        }
      });
    }
  }
}