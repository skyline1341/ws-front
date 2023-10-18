import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('canvas')
  public canvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('weightSelector')
  public weightSelector!: ElementRef<HTMLSelectElement>;

  @ViewChild('colorSelector')
  public colorSelector!: ElementRef<HTMLInputElement>;

  private ctx!: CanvasRenderingContext2D;

  private painting = false;

  public ws!: WebSocket;

  // public color = this.getRandomColor();
  public color = '#000';

  private startPaintCoordinate: Coordinate | undefined;

  public ngAfterViewInit() {
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      this.ctx = ctx;
    }
    if (!this.ctx) {
      return;
    }

    this.ws = new WebSocket(`ws://${window.location.hostname}:3000`);
    this.ws.onopen = () => {
      this.ws.send(JSON.stringify({ event: 'init' }));

      this.ws.onmessage = (event) => {
        const paintData = JSON.parse(event.data);
        const canvasData = Array.isArray(paintData)
          ? paintData.map(pd => JSON.parse(pd))
          : [JSON.parse(paintData.data)];

        canvasData.forEach(data => {
          if (data.x1) {
            this.paintLine(data);
          } else {
            // this.paintDot(data);
            const dataLine: Line = {
              ...data,
              x1: data.x,
              y1: data.y,
              x2: data.x,
              y2: data.y,
            };
            this.paintLine(dataLine);
          }
        });

      };

    };
  }

  public changeColor(data: any): void {
    this.color = data.target.value;
  }

  public mouseDown(event: MouseEvent): void {
    const x = event.clientX - 10;
    const y = event.clientY - 10;

    this.placeDot(x, y);
  }

  public mouseMove(canvas: HTMLCanvasElement, event: MouseEvent): void {
    if (!this.painting || !this.ctx) {
      return;
    }

    const x2 = event.clientX - 10;
    const y2 = event.clientY - 10;

    this.placeLine(x2, y2);
  }

  public mouseUp(): void {
    this.painting = false;
    this.startPaintCoordinate = undefined;
  }

  // private paintDot(point: Point): void {
  //   this.ctx.fillStyle = point.c;
  //   // this.ctx.fillRect(point.x, point.y, point.w, point.w);
  //   this.ctx.beginPath();
  //   this.ctx.lineCap = 'round';
  //   this.ctx.moveTo(point.x, point.y);
  //   this.ctx.lineTo(point.x, point.y);
  //   this.ctx.lineWidth = point.w;
  //   this.ctx.strokeStyle = point.c;
  //   this.ctx.stroke();
  // }

  private paintLine(line: Line): void {
    this.ctx.fillStyle = line.c;
    this.ctx.beginPath();
    this.ctx.lineCap = 'round';
    this.ctx.moveTo(line.x1, line.y1);
    this.ctx.lineTo(line.x2, line.y2);
    this.ctx.lineWidth = line.w;
    this.ctx.strokeStyle = line.c;
    this.ctx.stroke();
  }

  private placeDot(x: number, y: number): void {
    this.painting = true;

    this.startPaintCoordinate = {
      x,
      y,
    };
    const w = parseInt(this.weightSelector.nativeElement.value, 10);
    const pointData: Point = {
      x,
      y,
      w,
      c: this.color,
    };
    this.ws.send(JSON.stringify({
      event: 'p', data: JSON.stringify(pointData),
    }));
  }

  private placeLine(x2: number, y2: number): void {
    if (!this.startPaintCoordinate) {
      return;
    }

    const x1 = this.startPaintCoordinate.x;
    const y1 = this.startPaintCoordinate.y;
    const w = parseInt(this.weightSelector.nativeElement.value, 10);

    const lineData: Line = {
      x1,
      x2,
      y1,
      y2,
      w,
      c: this.color,
    };
    this.ws.send(JSON.stringify({
      event: 'p', data: JSON.stringify(lineData),
    }));

    this.startPaintCoordinate = {
      x: x2,
      y: y2,
    };
  }

  private getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 3; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
}

interface Point {
  x: number;
  y: number;
  c: string;
  w: number;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  c: string;
  w: number;
}

interface Coordinate {
  x: number;
  y: number;
}
