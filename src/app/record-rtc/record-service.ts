import { Injectable, NgZone } from '@angular/core';
import RecordRTC from 'recordrtc';
import moment from "moment";
import { Observable, Subject, BehaviorSubject } from 'rxjs';

export interface RecordedVideoOutput {
  blob: Blob;
  url: string;
  title: string;
}

/**
 * Service for recording video using RecordRTC library.
 * Provides methods for starting and stopping video recording, and for setting the video resolution.
 */
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
    mimeType: 'video/webm',
    bitsPerSecond: 128000
  };
  
  private selectedResolution = new BehaviorSubject<'420p' | '720p' | '1080p' | '4k'>('720p');

  /**
   * Constructs a new instance of the RecordService class.
   * 
   * @constructor
   * Subscribes to the selectedResolution BehaviorSubject. When the resolution changes, 
   * it updates the bitsPerSecond option in the options object to match the bitsPerSecond 
   * of the selected resolution.
   */
  constructor() {
    this.selectedResolution.subscribe(resolution => {
      const selectedResolution = this.resolutions[resolution];
      this.options.bitsPerSecond = selectedResolution.bitsPerSecond;
    });
  }
  
  /**
   * Sets the resolution for the video recording.
   * @param resolution - The resolution for the video recording. Can be '420p', '720p', '1080p', or '4k'.
   */
  public setResolution(resolution: '420p' | '720p' | '1080p' | '4k'): void {
    this.selectedResolution.next(resolution);
  }

  /**
   * Returns an Observable that emits the URL of the recorded video.
   * @returns An Observable<string> that emits the URL of the recorded video.
   */
  getRecordedUrl(): Observable<string> {
    return this._recordedUrl.asObservable();
  }
  
  /**
   * Returns an Observable that emits the recorded video output.
   * @returns An Observable<RecordedVideoOutput> that emits the recorded video output.
   */
  getRecordedBlob(): Observable<RecordedVideoOutput> {
    return this._recorded.asObservable();
  }

  /**
   * Returns an Observable that emits the recorded time.
   * @returns An Observable<string> that emits the recorded time.
   */
  getRecordedTime(): Observable<string> {
    return this._recordingTime.asObservable();
  }

  /**
   * Returns an Observable that emits when the recording fails.
   * @returns An Observable<string> that emits when the recording fails.
   */
  recordingFailed(): Observable<string> {
    return this._recordingFailed.asObservable();
  }

  /**
   * Returns an Observable that emits the MediaStream used for recording.
   * @returns An Observable<MediaStream> that emits the MediaStream used for recording.
   */
  getStream(): Observable<MediaStream> {
    return this._stream.asObservable();
  }

  /**
   * Starts the recording process.
   * 
   * @param conf - The configuration for recording.
   * @returns A promise that resolves with the recorded stream.
   */
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

  /**
   * Aborts the recording process.
   */
  abortRecording() {
    this.stopMedia();
  }

  /**
   * Starts recording the media stream.
   * If a media stream is available, it creates a new RecordRTC instance, starts recording,
   * and updates the recording time every 500 milliseconds.
   * If no media stream is available, it logs a message indicating the absence of a media stream.
   */
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

  /**
   * Converts a value to a string representation for minutes and seconds.
   * If the value is falsy, it returns '00'.
   * If the value is less than 10, it prepends a '0' to the value.
   * @param value - The value to convert.
   * @returns The string representation of the value.
   */
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

  /**
   * Stops the recording process.
   * If a recorder instance exists, it stops the recording and processes the video.
   */
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
  
  /**
   * Processes the recorded video by getting the Blob, creating a URL from the Blob,
   * and passing the URL instead of the Blob to the subscribers.
   * Also stops the media after processing.
   */
  private processVideo() {
    if (this.recorder) {
      const recordedBlob = this.recorder.getBlob();
      const blobUrl = URL.createObjectURL(recordedBlob); // Create a URL from the Blob
      const recordedName = encodeURIComponent('video_' + new Date().getTime() + '.webm');
      this._recorded.next({ blob: recordedBlob, url: blobUrl, title: recordedName }); // Pass the URL instead of the Blob
      this.stopMedia();
    }
  }
  
  /**
   * Stops the media recording and releases the resources.
   */
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
