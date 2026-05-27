import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.css',
  encapsulation: ViewEncapsulation.None
})
export class RankingComponent implements OnInit {
  ranking:    any[] = [];
  loading     = false;
  isAdmin     = this.auth.isAdmin();
  tenantName  = this.themeService.getTenantName();

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.themeService.applyTheme();
    this.cargarRanking();
  }

  cargarRanking() {
    this.loading = true;
    this.api.getRanking().subscribe({
      next:  data => { this.ranking = data; this.loading = false; },
      error: ()   => { this.loading = false; }
    });
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
  irA(ruta: string) { this.router.navigate([ruta]); }
}