import { NgModule } from '@angular/core';
import { CanvasService } from './canvas.service';
import { CanvasWebsocketService } from './canvas-websocket.service';
import { CanvasComponent } from './canvas.component';

@NgModule({
  providers: [
    CanvasService,
    CanvasWebsocketService,
  ],
  exports: [
    CanvasComponent,
  ],
  declarations: [
    CanvasComponent,
  ]
})
export class CanvasModule {

}
