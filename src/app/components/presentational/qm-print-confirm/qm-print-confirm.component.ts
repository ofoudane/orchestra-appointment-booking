import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { IBranch } from './../../../../models/IBranch';
import { Setting } from './../../../../models/Setting';
import { NavigationService } from './../../../util/navigation.service';
import { IAppointment } from './../../../../models/IAppointment';
import { ICustomer } from './../../../../models/ICustomer';
import { UserSelectors, SettingsAdminSelectors, SystemInfoSelectors } from '../../../../store/index';
import { PrintSelectors, PrintDispatchers } from '../../../../store/services/print/index';
import { BOOKING_HOME_URL } from '../../containers/qm-page-header/header-navigation';
import { FullAppointment } from '../../../../models/FullAppointment';

@Component({
  selector: 'qm-qm-print-confirm',
  templateUrl: './qm-print-confirm.component.html',
  styleUrls: ['./qm-print-confirm.component.scss']
})
export class QmPrintConfirmComponent implements OnInit, OnDestroy {

  private subscriptions: Subscription = new Subscription();
  currentCustomer: ICustomer;
  bookedAppointment: FullAppointment;
  userDirection$: Observable<string>;
  private timeConvention$: Observable<string>;
  private timeConvention: string;
  printedAppointment$: Observable<FullAppointment>;
  private settingsMap$: Observable<{ [name: string]: Setting }>;
  phoneEnabled = true;
  emailEnabled = true;

  constructor(
    private router: Router,
    private navigationService: NavigationService,
    private userSelectors: UserSelectors,
    private settingsMapSelectors: SettingsAdminSelectors,
    private printSelectors: PrintSelectors,
    private printDispatchers: PrintDispatchers,
    private systemInfoSelectors: SystemInfoSelectors
    ) {
      this.userDirection$ = this.userSelectors.userDirection$;
      this.settingsMap$ = this.settingsMapSelectors.settingsAsMap$;
      this.printedAppointment$ = this.printSelectors.printedAppointment$;
      this.timeConvention$ = this.systemInfoSelectors.systemInfoTimeConvention$;
    }

  ngOnInit() {
    const printAppointmentSubscription = this.printedAppointment$.subscribe((bapp : FullAppointment) => {
      
      if(bapp != null){
        if(bapp.qpId || !this.bookedAppointment)
          this.bookedAppointment = bapp;
      }

      if (bapp && bapp.customers && bapp.customers.length > 0) {
        this.currentCustomer = bapp.customers[0];
      }  
      if(bapp && !bapp.qpId){
        // Make sure to delete this key, otherwise, you will run into an infinite loop.
        delete bapp.qpId;
        // Sometimes the qpId is not returned from the first request to the server. Therefore, a retry is required.
        this.printDispatchers.setPrintedAppointment(bapp);
      }
    });

    const timeConventionSubscription = this.timeConvention$.subscribe(
      timeConvention => this.timeConvention = timeConvention
    );


    const settingsSubscription = this.settingsMap$.subscribe(
      (settingsMap: { [name: string]: Setting }) => {

        this.printedAppointment$.subscribe(() => {
          this.phoneEnabled = settingsMap.CustomerIncludePhone.value && (
            (settingsMap.CustomerPhoneDefaultCountry.value || '').trim() !== (this.currentCustomer ?
              (this.currentCustomer.phone || '').trim() : '')) ;
        }).unsubscribe();

        this.emailEnabled = settingsMap.CustomerIncludeEmail.value;
      }
    );

    this.subscriptions.add(printAppointmentSubscription);
    this.subscriptions.add(timeConventionSubscription);
    this.subscriptions.add(settingsSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  getTimeFormat(): string {
    if (this.timeConvention === 'AMPM') {
      return 'hh:mm A';
    } else {
      return 'HH:mm';
    }
  }

  cancelEdit() {
    this.navigationService.goToHome();
  }

  getBranchAddressText(branch: IBranch) {
    let completeAddress = '';
    if (branch) {
      const fieldsToLookFor = [
        'addressLine1',
        'addressLine2',
        'addressZip',
        'addressCity',
        'addressCountry'
      ];

      completeAddress = fieldsToLookFor.reduce((acc, curr) => {
        if (curr in branch) {
          const value = branch[curr];
          if (value !== null && value !== '') {
            if (acc === '') {
              return value;
            } else {
              return (acc += ', ' + value);
            }
          }
        }
        return acc;
      }, '');
    }

    return completeAddress;
  }

  printAppointment() {

    window['onafterprint'] = () => {
      setTimeout(() => {
        this.router.navigateByUrl(BOOKING_HOME_URL);
        window['onafterprint'] = null;
      }, 3000);
    };

    window.print();
  }
}
