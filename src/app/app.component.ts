import { Component, ViewChild, ElementRef } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  items: MenuItem[] = [];
  @ViewChild('menuItems') menuItems!: ElementRef;

  ngOnInit() {
    this.items = [
      {
        label: 'Record',
        routerLink: '/record'
      },
      {
        label: 'My Videos',
        routerLink: ''
      },
    ];
  }

}