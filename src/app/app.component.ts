import { BranchDispatchers } from './../store/services/branch.dispatchers';
import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { IBranch } from './../models/IBranch';
import { IAppState } from '../store/reducers';
import { UserSelectors, BranchSelectors } from '../store';

@Component({
  selector: 'qm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  userDirection$: Observable<string>;
  branches$: Observable<IBranch[]>;

  constructor(
    private userSelectors: UserSelectors,
    private branchSelectors: BranchSelectors,
    private branchDispatchers: BranchDispatchers
  ) {
    this.userDirection$ = this.userSelectors.userDirection$;
    this.branches$ = this.branchSelectors.filteredBranches$;
  }

  branchSearch(searchText) {
    this.branchDispatchers.filter(searchText);
  }

  serviceSearch(searchText) {
    // tslint:disable-next-line:no-trailing-whitespace

  }
}
