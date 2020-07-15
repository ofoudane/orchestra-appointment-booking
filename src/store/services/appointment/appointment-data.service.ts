import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError } from 'rxjs/operators';

import { calendarPublicEndpoint, DataServiceError, calendarEndpoint } from '../data.service';
import { IAppointmentResponse } from '../../../models/IAppointmentResponse';
import { IAppointment } from '../../../models/IAppointment';
import { GlobalErrorHandler } from '../../../services/util/global-error-handler.service';
import { FullAppointment } from '../../../models/FullAppointment';
import { FullAppointmentResponse } from '../../../models/FullAppointmentResponse';


@Injectable()
export class AppointmentDataService {
  constructor(private http: HttpClient, private errorHandler: GlobalErrorHandler) {}

  getAppointments(publicId: string): Observable<IAppointmentResponse> {
    return this.http
      .get<IAppointmentResponse>(`${calendarPublicEndpoint}/customers/${publicId}/appointments`)
      .pipe(catchError(this.errorHandler.handleError()));
  }

  deleteAppointment(appointment: IAppointment) {
    return this.http
      .delete(`${calendarPublicEndpoint}/appointments/${appointment.publicId}`)
      .pipe(catchError(this.errorHandler.handleError()));
  }

  getFullAppointment(publicId: string): Observable<FullAppointmentResponse> {
    return this.http
      .get<FullAppointmentResponse>(`${calendarEndpoint}/appointments/publicid/${publicId}`)
      .pipe(catchError(this.errorHandler.handleError()));
  }
}
