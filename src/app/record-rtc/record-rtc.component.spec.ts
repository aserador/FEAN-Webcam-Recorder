import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordRtcComponent } from './record-rtc.component';

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
});
