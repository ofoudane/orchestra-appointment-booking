import { IAppointment } from './../../models/IAppointment';
import { Action } from '@ngrx/store';
import { FullAppointment } from '../../models/FullAppointment';

// appointment to be printed
export const PRINT_APPOINTMENT = '[Print] PRINT_APPOINTMENT';
export const FETCH_FULL_APPOINTMENT_SUCCESS = '[Print] FETCH_FULL_APPOINTMENT_SUCCESS';
export const FETCH_FULL_APPOINTMENT_FAIL = '[Print] FETCH_APPOINTMENTS_FAIL';


export class PrintAppointment implements Action {
  readonly type = PRINT_APPOINTMENT;
  constructor(public payload: IAppointment) { }
}

export class FetchFullAppointmentSuccess implements Action {
  readonly type = FETCH_FULL_APPOINTMENT_SUCCESS;
  constructor(public payload: FullAppointment,) { }
}

export class FetchFullAppointmentFailure implements Action {
  readonly type = FETCH_FULL_APPOINTMENT_FAIL;
  constructor(public payload: Object) { }
}

// Action types
export type AllPrintActions = PrintAppointment |
  FetchFullAppointmentSuccess |
  FetchFullAppointmentFailure;
