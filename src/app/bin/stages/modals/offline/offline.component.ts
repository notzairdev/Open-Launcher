import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IpcService } from '../../../shared/services/electron/ipc.service';
import { Notyf } from 'notyf';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [InputTextModule, FormsModule],
  templateUrl: './offline.component.html',
  styleUrl: './offline.component.css'
})
export class OfflineComponent {

  constructor(
    private _ipc: IpcService,
    private _dynamic: DynamicDialogRef
  ){}

  protected spinnerBtn: boolean = false;
  protected username: string = '';

  createAccountAndClose(): void{
    this.spinnerBtn = true;

    const notyf = new Notyf({
      duration: 5000,
      position: {
        x: 'right',
        y: 'center',
      },
      dismissible: true,
    });

    if(this.username == ''){
      notyf.error('El nombre de usuario no puede estar vacío.')
      this.spinnerBtn = false;

      return;
    }
    
    this.username = this.username.trim();

    this._ipc.send('auth:offline', { username: this.username });
    this._ipc.once('auth:offline:reply', (event, arg) => {
      // console.log(arg)
      this.spinnerBtn = false;

      if(arg.success == true){
        this._dynamic.close({ success: true, name: this.username });
      }
      else{
        notyf.error('Error al crear la cuenta. Intenta nuevamente.')
        this._dynamic.close({ success: false });
      }
    });
  }
}
