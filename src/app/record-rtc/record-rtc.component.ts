import { AfterViewInit, Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { VideoRecordingService } from './record-service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient, HttpEventType, HttpRequest } from '@angular/common/http';
import { RecordedVideoOutput } from './record-service';
import { MenuItem } from 'primeng/api';

/**
 * Allows recording videos using the RecordRTC library.
 * It provides functionalities such as previewing the camera, starting and stopping video recording, 
 * and uploading recorded videos. It also handles various video recording states and updates the UI accordingly.
 */
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

  /**
   * Constructs a new instance of the RecordRtcComponent class.
   * 
   * @constructor
   * @param {HttpClient} http - The HttpClient for making HTTP requests.
   * @param {ChangeDetectorRef} ref - The ChangeDetectorRef for triggering change detection.
   * @param {VideoRecordingService} videoRecordingService - The VideoRecordingService for handling video recording.
   * @param {DomSanitizer} sanitizer - The DomSanitizer for sanitizing URLs.
   * 
   * Subscribes to various observables from the VideoRecordingService:
   * - When recording fails, it sets isVideoRecording to false and triggers change detection.
   * - When the recorded time changes, it updates videoRecordedTime and triggers change detection.
   * - When the stream changes, it updates videoStream and triggers change detection.
   * - When the recorded blob changes, it updates videoBlob, videoName, and videoBlobUrl, and triggers change detection.
   */
  constructor(
    private http: HttpClient,
    private ref: ChangeDetectorRef,
    private videoRecordingService: VideoRecordingService,
    private sanitizer: DomSanitizer
  ) {
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

  /**
   * Initializes the component.
   * - Sets up the step items.
   * - Previews the camera.
   * - Checks if the camera is available.
   */
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
    this.ref.detectChanges();
  }

  /**
   * Called after Angular has fully initialized the component's view.
   * It is called only once after the first ngAfterContentChecked.
   */
  ngAfterViewInit() {
    this.video = this.videoElement.nativeElement;
  }

  /**
   * Sets the selected video quality.
   * 
   * @param value - The selected video quality value.
   */
  set selectedQuality(value: string) {
    if (this.videoQualities.some(q => q.value === value)) {
      this.videoRecordingService.setResolution(value as "420p" | "720p" | "1080p" | "4k");
    }
  }

  /**
   * Starts the preview of the camera by accessing the user's media devices and displaying the video stream.
   */
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

  /**
   * Starts the countdown for video recording.
   * If video recording is not active and countdown is not already active,
   * it sets the countdown value to 3 and starts the countdown interval.
   * When the countdown reaches 0, it stops the countdown interval and starts video recording.
   */
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

  /**
   * Starts the video recording process.
   * Begins recording with the current video configuration, handles any existing video streams, 
   * and logs any errors that occur during the process.
   */
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

  /**
   * Aborts the video recording process.
   * If a video is currently being recorded, it stops the recording, hides the video controls, 
   * resets the active index to 0, and triggers change detection.
   */
  abortVideoRecording() {
    if (this.isVideoRecording) {
      this.isVideoRecording = false;
      this.videoRecordingService.abortRecording();
      this.video.controls = false;
      this.activeIndex = 0;
      this.ref.detectChanges();

    }
  }

  /**
   * Stops the video recording process.
   * If a video is currently being recorded, it stops the recording, retrieves the recorded blob, 
   * stops all tracks on the video stream, resets the video source, and updates the UI.
   */
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
    }
  }

  /**
   * Clears the recorded video data and resets the component state.
   */
  clearVideoRecordedData() {
    this.videoBlobUrl = '';
    this.video.srcObject = null;
    this.video.controls = false;
    this.activeIndex = 0;
    this.ref.detectChanges();

    this.previewCamera();
  }

  /**
   * Downloads the recorded video data (webm format)
   */
  downloadVideoRecordedData() {
    this.downloadFile(this.videoBlob, 'video/webm', this.videoName);
  }

  /**
   * Called when the component is about to be destroyed.
   * It aborts the video recording and stops all tracks of the video stream.
   */
  ngOnDestroy(): void {
    this.abortVideoRecording();
  
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
  }
  
  /**
   * Creates a downloadable file from a Blob object and triggers the download.
   * 
   * @param {Blob} data - The data to be downloaded.
   * @param {string} type - The MIME type of the data.
   * @param {string} filename - The name of the file to be downloaded.
   */
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

  /**
   * Shows the upload dialog and triggers change detection.
   */
  showUploadDialog() {
    this.showUploadConfirmationDialog = true;
    this.ref.detectChanges();
  }

  /**
   * Hides the upload confirmation dialog.
   */
  hideUploadDialog() {
    this.showUploadConfirmationDialog = false;
    this.ref.detectChanges();
  }

  /**
   * Continues the recording process by resetting the upload progress and clearing the video to upload.
   */
  continueRecording() {
    this.showUploadProgressDialog = false;
    this.videoToUpload = undefined;
    this.uploadProgress = 0;
  }

  /**
   * Uploads the recorded video to a server.
   * 
   * If a video is ready to be uploaded, it creates a new FormData object, appends the video blob and title to it, 
   * and sends a POST request to the server with the FormData object. It also updates the UI to reflect the upload progress.
   * 
   * If the upload is successful, it resets `videoToUpload`.
   */
  uploadVideo() {
    this.activeIndex = 2;
    this.uploadProgress = 0;
    this.ref.detectChanges();
    if (this.videoToUpload) {
      const formData = new FormData();
      formData.append('file', this.videoToUpload.blob, this.videoToUpload.title);

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
          this.videoToUpload = undefined;
        }
      });
    }
  }
}