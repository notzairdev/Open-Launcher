import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Notyf } from 'notyf';
import { ProgressBarModule } from 'primeng/progressbar';

import { IpcService } from '../../../../shared/services/electron/ipc.service';

@Component({
  selector: 'app-middleware',
  standalone: true,
  imports: [ProgressBarModule],
  templateUrl: './middleware.component.html',
  styleUrl: './middleware.component.css'
})
export class MiddlewareComponent implements OnInit{
  protected currentStatus: string = "";
  
  constructor(
    private _rt: Router,
    private _ipc: IpcService
  ){}

  private checkElectronIntegrity(): void{
    
    // const notyf = new Notyf({
    //   duration: 0,
    //   position: {
    //     x: 'right',
    //     y: 'bottom',
    //   }
    // });

    this._ipc.send('configuration:verify');
    this._ipc.on('configuration:reply', (event, data) => {
      // console.log(data)
      if(data){
        if(data.account.active){
          
        }
        else{
          this._rt.navigate(['/auth']);
        }
      } else {
      //   this._rt.navigate(['/auth/launcher']);
      }
    });
  }

  ngOnInit(): void {
    this.checkElectronIntegrity();
  }

}
