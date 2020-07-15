import { IAppointment } from '../../models/IAppointment';
import * as PrintActions from '../actions';
import { FullAppointment } from '../../models/FullAppointment';

export interface IPrintState {
  printedAppointment: FullAppointment;
  loading: boolean;
  loaded: boolean;
  error: Object;
}

export const initialState: IPrintState = {
  printedAppointment: null,
  loading: false,
  loaded: false,
  error: null
};

export function reducer(
  state: IPrintState = initialState,
  action: PrintActions.AllPrintActions
): IPrintState{
  switch (action.type) {
    case PrintActions.PRINT_APPOINTMENT: {
      return {
        ...state,
        printedAppointment: null,
        loading: true,
        error: null
      };
    }
    case PrintActions.FETCH_FULL_APPOINTMENT_SUCCESS: {
      return {
        printedAppointment: action.payload,
        loading: false,
        loaded: true,
        error: null,
      };
    }

    case PrintActions.FETCH_FULL_APPOINTMENT_FAIL: {
      return {
        ...state,
        loading: false,
        loaded: true,
        error: action.payload,
      };
    }

    default: {
      return state;
    }
  }
}
