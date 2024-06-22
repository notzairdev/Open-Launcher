import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IpcService } from '../../../../shared/services/electron/ipc.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Notyf } from 'notyf';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{ 

  protected spinnerBtn: boolean = false;
  protected spinnerBtn2: boolean = false;
  protected isActiveAction: boolean = true;

  constructor(
    private _ipc: IpcService,
    private _loader: NgxUiLoaderService,
    private _rt: Router
  ){}

  createNewMicrosoftToken(): void {
    this.spinnerBtn = true;
    this.isActiveAction = true;
    this._loader.start();
    
    this._ipc.send('auth:microsoft', { new: true })

    this._ipc.on('auth:microsoft:reply', (event, arg) => {
      // console.log(arg)
      this._loader.stop();
      this.spinnerBtn = false;

      const notyf = new Notyf({
        duration: 5000,
        position: {
          x: 'right',
          y: 'center',
        },
        dismissible: true,
      });

      if(arg.isCancelled == true){
        notyf.error('Operación cancelada por el usuario o debido a un error. Intenta nuevamente.')
        this.isActiveAction = false;
        return;
      }
      else{
        notyf.success('Bienvenido ' + arg.authData[0].account.profile.name + '!')
        
        setTimeout(() => {
          this._rt.navigate(['/init'])
        }, 2000)
      }
      
      console.log(arg)
    })
  }

  protected offlineAccount(): void{
    
  }

  ngOnInit(): void {

  }
}
