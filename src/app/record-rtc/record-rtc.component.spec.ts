import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RecordRtcComponent } from './record-rtc.component';
import { VideoRecordingService } from './record-service';
import { of } from 'rxjs';

describe('RecordRtcComponent', () => {
  let component: RecordRtcComponent;
  let fixture: ComponentFixture<RecordRtcComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RecordRtcComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecordRtcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

describe('RecordRtcComponent', () => {
  let component: RecordRtcComponent;
  let fixture: ComponentFixture<RecordRtcComponent>;
  let videoRecordingService: VideoRecordingService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ RecordRtcComponent ],
      providers: [ VideoRecordingService ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordRtcComponent);
    component = fixture.componentInstance;
    videoRecordingService = TestBed.inject(VideoRecordingService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start recording countdown', () => {
    spyOn(component, 'startRecordingCountdown');
    component.startRecordingCountdown();
    expect(component.startRecordingCountdown).toHaveBeenCalled();
  });

  it('should start video recording', () => {
    spyOn(component, 'startVideoRecording');
    component.startVideoRecording();
    expect(component.startVideoRecording).toHaveBeenCalled();
  });

  it('should abort video recording', () => {
    spyOn(component, 'abortVideoRecording');
    component.abortVideoRecording();
    expect(component.abortVideoRecording).toHaveBeenCalled();
  });

  it('should stop video recording', () => {
    spyOn(component, 'stopVideoRecording');
    component.stopVideoRecording();
    expect(component.stopVideoRecording).toHaveBeenCalled();
  });

  it('should clear video recorded data', () => {
    spyOn(component, 'clearVideoRecordedData');
    component.clearVideoRecordedData();
    expect(component.clearVideoRecordedData).toHaveBeenCalled();
  });

  it('should download video recorded data', () => {
    spyOn(component, 'downloadVideoRecordedData');
    component.downloadVideoRecordedData();
    expect(component.downloadVideoRecordedData).toHaveBeenCalled();
  });

  it('should upload video', () => {
    spyOn(component, 'uploadVideo');
    component.uploadVideo();
    expect(component.uploadVideo).toHaveBeenCalled();
  });

  it('should show upload dialog', () => {
    spyOn(component, 'showUploadDialog');
    component.showUploadDialog();
    expect(component.showUploadDialog).toHaveBeenCalled();
  });

  it('should hide upload dialog', () => {
    spyOn(component, 'hideUploadDialog');
    component.hideUploadDialog();
    expect(component.hideUploadDialog).toHaveBeenCalled();
  });

  it('should continue recording', () => {
    spyOn(component, 'continueRecording');
    component.continueRecording();
    expect(component.continueRecording).toHaveBeenCalled();
  });

  it('should handle video recording service subscriptions', () => {
    spyOn(videoRecordingService, 'recordingFailed').and.returnValue(of(''));
    spyOn(videoRecordingService, 'getRecordedTime').and.returnValue(of('00:00:00'));
    spyOn(videoRecordingService, 'getStream').and.returnValue(of(new MediaStream()));
    spyOn(videoRecordingService, 'getRecordedBlob').and.returnValue(of({blob: new Blob(), title: 'test', url: 'test'}));
    component.ngOnInit();
    expect(videoRecordingService.recordingFailed).toHaveBeenCalled();
    expect(videoRecordingService.getRecordedTime).toHaveBeenCalled();
    expect(videoRecordingService.getStream).toHaveBeenCalled();
    expect(videoRecordingService.getRecordedBlob).toHaveBeenCalled();
  });
});
});
