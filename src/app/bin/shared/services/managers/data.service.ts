import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SessionConfig, UserData } from '../../providers/user.provider';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  //Stage 1
  private dataSubject = new BehaviorSubject<UserData | null>(null);

  setFormData(packet: UserData) {
    this.dataSubject.next(packet);
  }

  getFormData(): Observable<UserData | null>{
    return this.dataSubject.asObservable();
  }

  //Storage Session
  private sessionConfiguration = new BehaviorSubject<SessionConfig | null>(null);

  setSessionConfig(packet: SessionConfig){
    this.sessionConfiguration.next(packet);
  }

  getSessionConfig(): Observable<SessionConfig | null>{
    return this.sessionConfiguration.asObservable()
  }
}
