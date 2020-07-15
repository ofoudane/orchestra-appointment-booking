import { Injectable } from "@angular/core"
import { Effect, Actions } from "@ngrx/effects";
import { Observable } from "rxjs";
import { AppointmentDataService } from "../services";
import *  as PrintActions from "./../actions";
import { switchMap, mergeMap, tap } from "rxjs/operators";
import { Action } from "@ngrx/store";
import { GlobalErrorHandler } from "../../services/util/global-error-handler.service";


const toAction = PrintActions.toAction();


const a = {"omar" : 5};
const b = {"omar": 2};
@Injectable()
export class PrintEffects {
  constructor(
    private actions$: Actions,
    private appointmentDataService: AppointmentDataService,
    private errorHandler: GlobalErrorHandler,
  ) { }

  @Effect()
  getFullAppointment$: Observable<Action> = this.actions$
    .ofType(PrintActions.PRINT_APPOINTMENT)
    .pipe(
      switchMap((action: PrintActions.PrintAppointment) =>
        toAction(
          this.appointmentDataService.getFullAppointment(action.payload.publicId)
            .map(v => {return {...v.appointment, ...action.payload}}),
          PrintActions.FetchFullAppointmentSuccess,
          PrintActions.FetchFullAppointmentFailure,
        ),
      )
    );

  @Effect()
  getFullAppointmentFailure$: Observable<Action> = this.actions$
    .ofType(PrintActions.FETCH_FULL_APPOINTMENT_FAIL)
    .pipe(
      tap((action: PrintActions.FetchFullAppointmentFailure) => {
        this.errorHandler.showError('toast.print.error', action.payload);
      })
    );


}