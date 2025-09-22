import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-callback',
  imports: [],
  standalone: true,
  templateUrl: './callback.html',
  styleUrl: './callback.css'
})
export class Callback implements OnInit {

  constructor(private router: ActivatedRoute) { }

  ngOnInit(): void {
      this.router.queryParams.subscribe((params)=>{
        console.log(params['token'])
      })
      /* this.http.get('http://localhost:8000/api/protected', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      */
  }

}
