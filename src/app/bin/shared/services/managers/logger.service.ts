import { Injectable } from '@angular/core';
import { Logger, LoggerItem } from '../../providers/logger.provider';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private loggerSubject = new BehaviorSubject<Logger | null>(null);
  
  public log(packet: LoggerItem){
    const logger = this.loggerSubject.getValue();
    if (logger) {
      logger.items.push(packet);
      this.loggerSubject.next(logger);
    }
    else{
      const newLogger: Logger = {
        items: [packet]
      }
      this.loggerSubject.next(newLogger);
    }
  }

  public getLoggerData(): Observable<Logger | null>{
    return this.loggerSubject.asObservable();
  }
}
