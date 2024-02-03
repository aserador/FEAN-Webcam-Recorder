import { Injectable, NgZone } from '@angular/core';
import RecordRTC from 'recordrtc';
import moment from "moment";
import { Observable, Subject, BehaviorSubject } from 'rxjs';

interface RecordedVideoOutput {
  blob: Blob;
  url: string;
  title: string;
}

@Injectable()
export class VideoRecordingService {

  private stream!: MediaStream | undefined;
  private recorder!: RecordRTC | undefined;
  private interval!: any;
  private startTime!: any;
  private _stream = new Subject<MediaStream>();
  private _recorded = new Subject<RecordedVideoOutput>();
  private _recordedUrl = new Subject<string>();
  private _recordingTime = new Subject<string>();
  private _recordingFailed = new Subject<string>();

  private resolutions = {
    '420p': { width: 640, height: 480, bitsPerSecond: 1000000 },
    '720p': { width: 1280, height: 720, bitsPerSecond: 3000000 },
    '1080p': { width: 1920, height: 1080, bitsPerSecond: 5000000 },
    '4k': { width: 3840, height: 2160, bitsPerSecond: 25000000 },
  };
  
  private options: RecordRTC.Options = {
    type: 'video',
    mimeType: 'video/mp4',
    bitsPerSecond: 128000
  };
  
  private selectedResolution = new BehaviorSubject<'420p' | '720p' | '1080p' | '4k'>('720p');

  constructor() {
    this.selectedResolution.subscribe(resolution => {
      const selectedResolution = this.resolutions[resolution];
      this.options.bitsPerSecond = selectedResolution.bitsPerSecond;
    });
  }
  
  public setResolution(resolution: '420p' | '720p' | '1080p' | '4k'): void {
    this.selectedResolution.next(resolution);
  }

  getRecordedUrl(): Observable<string> {
    return this._recordedUrl.asObservable();
  }
  
  getRecordedBlob(): Observable<RecordedVideoOutput> {
    return this._recorded.asObservable();
  }

  getRecordedTime(): Observable<string> {
    return this._recordingTime.asObservable();
  }

  recordingFailed(): Observable<string> {
    return this._recordingFailed.asObservable();
  }

  getStream(): Observable<MediaStream> {
    return this._stream.asObservable();
  }

  startRecording( conf: any ): Promise<any> {
    console.log('startRecording called');

    var browser = <any>navigator;
    if (this.recorder) {
      console.log('Already recording');
      return Promise.resolve();
    }

    this._recordingTime.next('00:00');
    return new Promise((resolve, reject) => {
      browser.mediaDevices.getUserMedia(conf).then((stream: MediaStream) => {
        this.stream = stream;
        this.record();
        resolve(this.stream);
      }).catch((error: any) => {
        this._recordingFailed.next('Recording failed');
        reject();
      });
    });
  }

  abortRecording() {
    this.stopMedia();
  }

  private record() {
    if (this.stream) {
      this.recorder = new RecordRTC(this.stream, this.options);
      this.recorder.startRecording();
      this.startTime = moment();
    } else {
      console.log('No media stream found to record');
    }

    this.interval = setInterval(
      () => {
        const currentTime = moment();
        const diffTime = moment.duration(currentTime.diff(this.startTime));
        const time = this.toString(diffTime.minutes()) + ':' + this.toString(diffTime.seconds());
        this._recordingTime.next(time);
        if (this.stream) {
          this._stream.next(this.stream);
        }
      },
      500
    );
  }

  private toString(value: any) {
    let val = value;
    if (!value) {
      val = '00';
    }
    if (value < 10) {
      val = '0' + value;
    }
    return val;
  }

  stopRecording() {
    if (this.recorder) {
      this.recorder.stopRecording(() => {
        if (this.recorder) {
          this.processVideo();
        }
      });
      //this.stopMedia();
    }
  }
  
  private processVideo() {
    if (this.recorder) {
      const recordedBlob = this.recorder.getBlob();
      const blobUrl = URL.createObjectURL(recordedBlob); // Create a URL from the Blob
      const recordedName = encodeURIComponent('video_' + new Date().getTime() + '.webm');
      this._recorded.next({ blob: recordedBlob, url: blobUrl, title: recordedName }); // Pass the URL instead of the Blob
      this.stopMedia();
    }
  }
  
  private stopMedia() {
    if (this.recorder) {
      this.recorder = undefined;
      clearInterval(this.interval);
      this.startTime = undefined;
      if (this.stream) {
        this.stream.getAudioTracks().forEach(track => track.stop());
        this.stream.getVideoTracks().forEach(track => track.stop());
        this.stream = undefined;
      }
    }
  }
}
