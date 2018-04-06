import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError } from 'rxjs/operators';

import { calendarEndpoint, DataServiceError } from './data.service';

import { IServiceResponse } from '../../models/IServiceResponse';

@Injectable()
export class ServiceDataService {
  constructor(private http: HttpClient) {}

  getServices(): Observable<IServiceResponse> {
    return this.http
      .get<IServiceResponse>(`${calendarEndpoint}services/`)
      .pipe(catchError(this.handleError()));
  }

  private handleError<T>(requestData?: T) {
    return (res: HttpErrorResponse) => {
      const error = new DataServiceError(res.error, requestData);
      console.error(error);
      return new ErrorObservable(error);
    };
  }
}
