import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store/src/models';
import { Effect, Actions } from '@ngrx/effects';
import { Observable } from 'rxjs/Observable';
import { Router } from '@angular/router';
import { of } from 'rxjs/observable/of';
import { switchMap, mergeMap, catchError, tap, withLatestFrom, take } from 'rxjs/operators';
import * as AppointmentActions from './../actions';
import * as CustomerActions from './../actions';
import { AppointmentDataService, DataServiceError } from '../services';
import { ToastService } from '../../services/util/toast.service';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { GlobalErrorHandler } from '../../services/util/global-error-handler.service';
import { IAppointment } from '../../models/IAppointment';
import { IService } from '../../models/IService';
import { Store } from '@ngrx/store';
import { IAppState } from '../index';
import { Setting } from '../../models/Setting';
import { AppUtils } from '../../services/util/appUtils.service';
import { IBranch } from '../../models/IBranch';
import { IAppointmentState } from '../reducers/appointment.reducer';

const toAction = AppointmentActions.toAction();

@Injectable()
export class AppointmentEffects {
  constructor(
    private store$: Store<IAppState>,
    private actions$: Actions,
    private appointmentDataService: AppointmentDataService,
    private toastService: ToastService,
    private translateService: TranslateService,
    private router: Router,
    private errorHandler: GlobalErrorHandler,
    private appUtils: AppUtils
  ) { }

  @Effect()
  getAppointments$: Observable<Action> = this.actions$
    .ofType(AppointmentActions.FETCH_APPOINTMENTS)
    .pipe(
    switchMap((action: AppointmentActions.FetchAppointments) =>
      toAction(
        this.appointmentDataService.getAppointments(action.payload),
        AppointmentActions.FetchAppointmentsSuccess,
        AppointmentActions.FetchAppointmentsFail
      )
    )
    );

  @Effect()
  deleteAppointment$: Observable<Action> = this.actions$
    .ofType(AppointmentActions.DELETE_APPOINTMENT)
    .pipe(
      switchMap((action: AppointmentActions.DeleteAppointment) =>
        this.appointmentDataService.deleteAppointment(action.payload).pipe(
          mergeMap(() => [new AppointmentActions.DeleteAppointmentSuccess(action.payload)]),
          catchError((err: DataServiceError<any>) => of(new AppointmentActions.DeleteAppointmentFail(err))),
        )
      )
    );

  @Effect()
  deleteAppointmentSuccess$: Observable<Action> = this.actions$
    .ofType(AppointmentActions.DELETE_APPOINTMENT_SUCCESS)
    .pipe(
      withLatestFrom(this.store$.select((state: IAppState) => state.appointments)),
      tap((data: any) => {
        const [ action, state ]: [AppointmentActions.DeleteAppointment, IAppointmentState] = data;
        if (state.selectedAppointment === null) {
          this.translateService.get('toast.cancel.booking.success',
            {
              name: action.payload.customers[0].name,
              date: moment(action.payload.start).format('DD MMM YYYY')
            }).subscribe(
              (label: string) => this.toastService.htmlSuccessToast(`<span dir="auto">${label}</span>`)
          ).unsubscribe();
        }
      }),
      switchMap((data: any) => {
        const [ action, state ]: [AppointmentActions.DeleteAppointment, IAppointmentState] = data;
        // If reschedule reset appointment
        const resetActions = state.selectedAppointment ? [new CustomerActions.ResetAppointment] : [];
        return [
          new CustomerActions.AddToBookingHistory({ appointment: action.payload, deleted: true }),
          new CustomerActions.ResetCurrentCustomer,
          ...resetActions
        ];
      })
    );

  @Effect({ dispatch: false })
  deleteAppointmentFailed$: Observable<Action> = this.actions$
    .ofType(AppointmentActions.DELETE_APPOINTMENT_FAIL)
    .pipe(
    tap((action: AppointmentActions.DeleteAppointmentFail) => {
      this.errorHandler
      .showError('toast.cancel.booking.error', action.payload);
    }));


  @Effect()
  selectAppointmentForEdit$: Observable<Action> = this.actions$
    .ofType(AppointmentActions.SELECT_APPOINTMENT)
    .pipe(
      withLatestFrom(this.store$.select((state: IAppState) => state)),
      switchMap((data: any) => {
        const [ action, state ]: [AppointmentActions.SelectAppointment, IAppState] = data;
        const appointmentToLoad: IAppointment = action.payload;
        const settingsMap = this.appUtils.getSettingsAsMap(state.settings.settings);
        const selectAppointmentActions = this.getSelectAppointmentActions(state, settingsMap, appointmentToLoad);

        return [
          ...selectAppointmentActions
        ];
      })
    );

  getSelectAppointmentActions(
    state: IAppState,
    settingsMap: { [name: string]: Setting },
    appointment: IAppointment
  ) {
    const isValid = this.validateAppointment(state, settingsMap, appointment);

    if (isValid === true) {
      const appointmentMetaActions = this.getAppointmentMetaActions(appointment, settingsMap);
      const customerAction = state.customers.currentCustomer !== null
              ? [] : [new AppointmentActions.SelectCustomer(appointment.customers[0])];
      return [
          ...customerAction,
          new AppointmentActions.LoadSelectedServices(appointment.services),
          new AppointmentActions.LoadSelectedBranch(appointment.branch),
          ...appointmentMetaActions
      ];
    } else {
      this.translateService.get('label.select.appointment.error').pipe(take(1)).subscribe(
        (label) => {
          this.toastService.errorToast(label);
        }
      );

      return [
        new AppointmentActions.ResetAppointment
      ];
    }
  }

  getServicesQueryStringFromServices(services: IService[]): string {
    return services.reduce((queryString, service: IService) => {
      return queryString + `;servicePublicId=${service.publicId}`;
    }, '');
  }

  getAppointmentMetaActions(appointment: IAppointment, settingsMap: { [name: string]: Setting }) {
    const notifyAction = this.getNotifyAction(appointment, settingsMap);
    const titleAction = this.getTitleAction(appointment);
    const notesAction = this.getNotesAction(appointment);

    return [
      ...notifyAction,
      ...titleAction,
      ...notesAction
    ];
  }

  getNotifyAction(appointment: IAppointment, settingsMap: { [name: string]: Setting }) {

    if (appointment.custom && appointment.custom !== '') {
      const parsedCustom = JSON.parse(appointment.custom);
      if (parsedCustom && parsedCustom.notificationType) {
        if (this.notificationTypeIsValid(parsedCustom.notificationType, settingsMap)) {
          return [new AppointmentActions.SetAppointmentNotificationType(parsedCustom.notificationType)];
        } else {
          const notificationType = this.getNofificationTypeFromSettings(settingsMap);
          return [new AppointmentActions.SetAppointmentNotificationType(notificationType)];
        }

      }
    }
    return [];
  }

  getNofificationTypeFromSettings(settingsMap: { [name: string]: Setting }): string {
    if (settingsMap.OptionPreselect.value !== 'PreSelectNoOption'
    && settingsMap.OptionPreselect.value !== 'unavailable'
    && settingsMap.OptionPreselect.value !== 'NoOption' ) {
      return settingsMap.OptionPreselect.value;
    } else {
      return '';
    }
  }

  notificationTypeIsValid(notificationType: string, settingsMap: { [name: string]: Setting }): boolean {

    switch (notificationType) {
      case 'sms': {
        return settingsMap.IncludeSms.value === true;
      }
      case 'email': {
        return settingsMap.IncludeEmail.value === true;
      }
      case 'both': {
        return settingsMap.IncludeEmailAndSms.value === true;
      }
      case 'none': {
        return settingsMap.NoNotification.value === true;
      }
      default: {
        return false;
      }
    }
  }

  getTitleAction(appointment: IAppointment) {
    if (appointment.title && appointment.title !== '') {
      return [new AppointmentActions.SetAppointmentTitle(appointment.title)];
    } else {
      return [];
    }
  }

  getNotesAction(appointment: IAppointment) {
    if (appointment.notes && appointment.notes !== '') {
      return [new AppointmentActions.SetAppointmentNote(appointment.notes)];
    } else {
      return [];
    }
  }

  validateAppointment(
    state: IAppState,
    settingsMap: {[name: string]: Setting},
    appointment: IAppointment
  ): boolean {
    const isValid = this.canLoadAppointment(state, settingsMap, appointment.services, appointment.branch);
    return isValid;
  }

  servicesAreAvailable(state: IAppState, servicesToCheck: IService[]): boolean {
    const serviceMap = state.services.services.reduce(
      (allServices: { [publicId: string]: IService }, service: IService) => {
        return {
          ...allServices,
          [service.publicId]: service
        };
      },
      {}
    );

    return servicesToCheck.reduce(
      (servicesArePresent: boolean, service: IService) => {
        return servicesArePresent ? (serviceMap[service.publicId] !== undefined ? true : false) : servicesArePresent;
      },
      true
    );
  }

  branchAreAvailable(state: IAppState, branchToCheck: IBranch): boolean {

    return state.branches.branches.reduce(
      (branchesArePresent: boolean, branch: IBranch) => {
        return !branchesArePresent ? (branch.publicId === branchToCheck.publicId ? true : false) : branchesArePresent;
      },
      false
    );
  }

  checkServices(state: IAppState, settingsMap: { [name: string]: Setting }, servicesToCheck: IService[]): boolean {
    const settingsAreValid = this.hasValidSettings(settingsMap, servicesToCheck);
    const servicesAvailable = this.servicesAreAvailable(state, servicesToCheck);
    return settingsAreValid && servicesAvailable;
  }

  hasValidSettings(settingsMap: { [name: string]: Setting }, servicesToCheck: IService[]): boolean {
    if (servicesToCheck.length > 1) {
      const multiServiceEnabled = settingsMap.AllowMultiService.value;
      if (multiServiceEnabled) {
        return true;
      } else {
        return false;
      }
    }

    return true;
  }

  canLoadAppointment(
    state: IAppState,
    settingsMap: { [name: string]: Setting},
    servicesToCheck: IService[],
    branchToCheck: IBranch
  ): boolean {
    const servicesAreValid = this.checkServices(state, settingsMap, servicesToCheck);
    if (servicesAreValid) {
      const branchAvailable = this.branchAreAvailable(state, branchToCheck);

      return branchAvailable ? true : false;
    } else {
      return false;
    }
  }
}
