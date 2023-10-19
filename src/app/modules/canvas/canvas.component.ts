import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { Line } from './models/line.model';
import { Point } from './models/point.model';
import { Coordinate } from './models/coordinate.model';

@Component({
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
  selector: 'app-canvas',
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvas')
  public canvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('weightSelector')
  public weightSelector!: ElementRef<HTMLSelectElement>;

  @ViewChild('colorSelector')
  public colorSelector!: ElementRef<HTMLInputElement>;

  private ctx!: CanvasRenderingContext2D;

  private painting = false;

  public ws!: WebSocket;

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

        let canvasData;
        const messageData = JSON.parse(event.data);
        switch (messageData.event) {
          case 'init':
            const bgImageData = messageData.data['bg'].data;
            const img = new Image(800, 600);
            const arrayBufferView = new Uint8Array(bgImageData);
            const blob = new Blob([arrayBufferView], { type: 'image/png' });
            const imageUrl = URL.createObjectURL(blob);
            img.src = imageUrl;
            if (!!bgImageData) {
              img.onload = () => {
                this.ctx.drawImage(img, 0, 0);
                const pointsData = messageData.data.data;
                canvasData = pointsData.map((i: string) => JSON.parse(i));
                this.renderCanvasData(canvasData);
              };
            } else {
              const pointsData = messageData.data.data;
              canvasData = pointsData.map((i: string) => JSON.parse(i));
              this.renderCanvasData(canvasData);
            }

            break;
          case 'p':
            canvasData = JSON.parse(messageData.data);
            this.renderCanvasData([canvasData]);
            break;
        }

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

  private renderCanvasData(canvasData: ( Point | Line )[]): void {
    canvasData.forEach(data => {
      if ('x1' in data) {
        this.paintLine(data);
      } else if ('x' in data) {
        const dataLine: Line = {
          x1: data.x,
          y1: data.y,
          x2: data.x,
          y2: data.y,
          c: data.c,
          w: data.w,
        };
        this.paintLine(dataLine);
      }
    });
  }

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

}
