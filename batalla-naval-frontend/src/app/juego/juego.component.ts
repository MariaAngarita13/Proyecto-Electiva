// src/app/juego/juego.component.ts

import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

type CellState = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';
interface Cell  { row: number; col: number; state: CellState; }
interface Ship  { id: number; size: number; hits: number; sunk: boolean; cells: { row: number; col: number }[]; }

@Pipe({ name: 'sunkCount', standalone: true })
export class SunkCountPipe implements PipeTransform {
  transform(ships: Ship[]): number { return ships ? ships.filter(s => s.sunk).length : 0; }
}

@Component({
  selector: 'app-juego',
  standalone: true,
  imports: [CommonModule, SunkCountPipe],
  templateUrl: './juego.component.html',
  styleUrl: './juego.component.css'
})
export class JuegoComponent implements OnInit {

  // Datos del tenant actual
  tenantName  = this.themeService.getTenantName();
  isAdmin     = this.auth.isAdmin();

  myBoard:     Cell[][] = [];
  enemyBoard:  Cell[][] = [];
  myShips:     Ship[]   = [];
  enemyShips:  Ship[]   = [];

  phase: 'placing' | 'playing' | 'finished' = 'placing';
  currentTurn:  1 | 2 = 1;
  playerNumber: 1 | 2 = 1;
  winner:       number | null = null;
  message       = '';
  gameResultSaved = false;

  shipSizes       = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
  currentShipIndex = 0;
  isHorizontal    = true;

  rows = ['A','B','C','D','E','F','G','H','I','J'];
  cols = [1,2,3,4,5,6,7,8,9,10];

  usuarioId = parseInt(this.auth.getUsuarioId() || '1');

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Aplicar tema del tenant al iniciar
    this.themeService.applyTheme();

    this.playerNumber = 1;
    this.currentTurn  = 1;
    this.initBoards();
    this.autoPlaceEnemyShips();
    this.message = `Coloca tus barcos. Barco actual: tamaño ${this.shipSizes[0]}`;
  }

  getArray(n: number): any[] { return Array(n); }

  initBoards() {
    this.myBoard    = [];
    this.enemyBoard = [];
    for (let r = 0; r < 10; r++) {
      this.myBoard.push([]);
      this.enemyBoard.push([]);
      for (let c = 0; c < 10; c++) {
        this.myBoard[r].push({ row: r, col: c, state: 'empty' });
        this.enemyBoard[r].push({ row: r, col: c, state: 'empty' });
      }
    }
  }

  previewShip(row: number, col: number) {
    if (this.phase !== 'placing') return;
    this.clearPreview();
    const size  = this.shipSizes[this.currentShipIndex];
    const cells = this.getShipCells(row, col, size, this.isHorizontal);
    if (this.isValidPlacement(cells))
      cells.forEach(c => { if (this.myBoard[c.row]?.[c.col]) (this.myBoard[c.row][c.col] as any).preview = true; });
  }

  clearPreview() {
    for (let r = 0; r < 10; r++)
      for (let c = 0; c < 10; c++)
        (this.myBoard[r][c] as any).preview = false;
  }

  placeShip(row: number, col: number) {
    if (this.phase !== 'placing') return;
    const size  = this.shipSizes[this.currentShipIndex];
    const cells = this.getShipCells(row, col, size, this.isHorizontal);
    if (!this.isValidPlacement(cells)) return;
    const ship: Ship = { id: this.currentShipIndex, size, hits: 0, sunk: false, cells };
    this.myShips.push(ship);
    cells.forEach(c => { this.myBoard[c.row][c.col].state = 'ship'; });
    this.clearPreview();
    this.currentShipIndex++;
    if (this.currentShipIndex >= this.shipSizes.length) {
      this.phase   = 'playing';
      this.message = '¡Tu turno! Dispara al tablero enemigo.';
    } else {
      this.message = `Coloca el barco de tamaño ${this.shipSizes[this.currentShipIndex]}`;
    }
  }

  toggleOrientation() { this.isHorizontal = !this.isHorizontal; this.clearPreview(); }

  getShipCells(row: number, col: number, size: number, horizontal: boolean) {
    const cells = [];
    for (let i = 0; i < size; i++)
      cells.push({ row: horizontal ? row : row + i, col: horizontal ? col + i : col });
    return cells;
  }

  isValidPlacement(cells: { row: number; col: number }[]): boolean {
    for (const c of cells) {
      if (c.row < 0 || c.row >= 10 || c.col < 0 || c.col >= 10) return false;
      if (this.myBoard[c.row][c.col].state === 'ship') return false;
    }
    return true;
  }

  autoPlaceEnemyShips() {
    this.enemyShips = [];
    const tempBoard: boolean[][] = Array.from({ length: 10 }, () => Array(10).fill(false));
    for (const size of this.shipSizes) {
      let placed = false, attempts = 0;
      while (!placed && attempts < 1000) {
        attempts++;
        const h   = Math.random() > 0.5;
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const cells = this.getShipCells(row, col, size, h);
        const valid = cells.every(c => c.row >= 0 && c.row < 10 && c.col >= 0 && c.col < 10 && !tempBoard[c.row][c.col]);
        if (valid) {
          cells.forEach(c => { tempBoard[c.row][c.col] = true; });
          this.enemyShips.push({ id: this.enemyShips.length, size, hits: 0, sunk: false, cells });
          placed = true;
        }
      }
    }
  }

  fireAt(row: number, col: number) {
    if (this.phase !== 'playing' || this.currentTurn !== this.playerNumber) return;
    const cell = this.enemyBoard[row][col];
    if (cell.state === 'hit' || cell.state === 'miss' || cell.state === 'sunk') return;
    const hitShip = this.enemyShips.find(s => s.cells.some(c => c.row === row && c.col === col));
    if (hitShip) {
      cell.state = 'hit'; hitShip.hits++;
      if (hitShip.hits >= hitShip.size) {
        hitShip.sunk = true;
        hitShip.cells.forEach(c => { this.enemyBoard[c.row][c.col].state = 'sunk'; });
        this.message = '💥 ¡Hundiste un barco!';
      } else { this.message = '🎯 ¡Impacto!'; }
      if (this.enemyShips.every(s => s.sunk)) { this.endGame(this.playerNumber); return; }
    } else { cell.state = 'miss'; this.message = '💨 Agua...'; }
    this.currentTurn = 2;
    this.message = 'Turno del enemigo...';
    setTimeout(() => this.aiTurn(), 1200);
  }

  aiTurn() {
    if (this.phase !== 'playing' || this.currentTurn !== 2) return;
    let row: number, col: number, attempts = 0;
    do {
      row = Math.floor(Math.random() * 10);
      col = Math.floor(Math.random() * 10);
      attempts++;
    } while (
      (this.myBoard[row][col].state === 'hit' || this.myBoard[row][col].state === 'miss' || this.myBoard[row][col].state === 'sunk') && attempts < 200
    );
    const hitShip = this.myShips.find(s => s.cells.some(c => c.row === row && c.col === col));
    if (hitShip) {
      this.myBoard[row][col].state = 'hit'; hitShip.hits++;
      if (hitShip.hits >= hitShip.size) {
        hitShip.sunk = true;
        hitShip.cells.forEach(c => { this.myBoard[c.row][c.col].state = 'sunk'; });
      }
      if (this.myShips.every(s => s.sunk)) { this.endGame(2); return; }
    } else { this.myBoard[row][col].state = 'miss'; }
    this.currentTurn = 1;
    this.message = '¡Tu turno! Dispara al tablero enemigo.';
  }

  endGame(winnerPlayer: number) {
    this.phase  = 'finished';
    this.winner = winnerPlayer;
    const ganaste = winnerPlayer === this.playerNumber;
    this.message  = ganaste ? '🏆 ¡Ganaste la partida!' : '💀 Perdiste la partida';
    if (!this.gameResultSaved) {
      this.gameResultSaved = true;
      this.api.crearPartida({ usuario_id: this.usuarioId, resultado: ganaste ? 'ganada' : 'perdida' })
        .subscribe({ next: () => console.log('Partida guardada'), error: e => console.error(e) });
    }
  }

  reiniciar() {
    this.myShips = []; this.enemyShips = []; this.currentShipIndex = 0;
    this.isHorizontal = true; this.phase = 'placing'; this.currentTurn = 1;
    this.playerNumber = 1; this.winner = null; this.gameResultSaved = false;
    this.initBoards(); this.autoPlaceEnemyShips();
    this.message = `Coloca tus barcos. Barco actual: tamaño ${this.shipSizes[0]}`;
  }

  getCellClass(cell: Cell, board: 'my' | 'enemy'): string {
    const preview = (cell as any).preview;
    if (preview) return 'cell-preview';
    switch (cell.state) {
      case 'ship':  return board === 'my' ? 'cell-ship' : 'cell-empty';
      case 'hit':   return 'cell-hit';
      case 'miss':  return 'cell-miss';
      case 'sunk':  return 'cell-sunk';
      default:      return 'cell-empty';
    }
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
  irA(ruta: string) { this.router.navigate([ruta]); }

  get myRows()    { return this.myBoard; }
  get enemyRows() { return this.enemyBoard; }
  get isMyTurn()  { return this.currentTurn === this.playerNumber; }
}