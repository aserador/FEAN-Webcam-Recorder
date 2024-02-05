import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * Represents the component for displaying and navigating through a list of videos.
 */
@Component({
  selector: 'app-my-videos',
  templateUrl: './my-videos.component.html',
  styleUrls: ['./my-videos.component.css']
})
export class MyVideosComponent implements OnInit {
  videos: any[] = [];
  currentIndex = 0;

  constructor(private http: HttpClient) { }

  /**
   * Initializes the component by fetching the list of videos from the server.
   * Sorts the video list in reverse order to display the most recent videos first.
   */
  ngOnInit() {
    this.http.get<any[]>('http://localhost:8080/videos').subscribe(videos => { 
      this.videos = videos.reverse();
    });
  }

  /**
   * Moves to the previous video in the list.
   */
  previousVideo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  /**
   * Moves to the next video in the list.
   */
  nextVideo() {
    if (this.currentIndex < this.videos.length - 1) {
      this.currentIndex++;
    }
  }
}