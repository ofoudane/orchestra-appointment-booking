import { Setting, SettingCategory } from './../../../models/Setting';
import { ISettingsAdminState } from './../../reducers/settings-admin.reducer';
import { Injectable } from '@angular/core';
import { Store, createSelector, createFeatureSelector } from '@ngrx/store';

import { IAppState } from '../../reducers';

// selectors
const getSettingsAdminState = createFeatureSelector<ISettingsAdminState>('settings');

const getAllSettings = createSelector(
  getSettingsAdminState,
  (state: ISettingsAdminState) => state.settings
);

const getSettingsByCategory = createSelector(getSettingsAdminState, (state: ISettingsAdminState) => {
  const settingsByCategory = new Map<string, SettingCategory>();

  state.settings.forEach((s: Setting) => {
    if (!settingsByCategory.has(s.category.name)) {
      settingsByCategory.set(s.category.name, s.category);
    }

    const foundCat = settingsByCategory.get(s.category.name);
    foundCat.settings.set(s.name, s);
    settingsByCategory.set(s.category.name, foundCat);
  });

  console.log(settingsByCategory.values());

  return Array.from(settingsByCategory.values());
});

const getSettingsAsMap = createSelector(
  getSettingsAdminState,
  (state: ISettingsAdminState) => {
    const settingsList = state.settings;

    const settings = settingsList.reduce(
      (allSettings: { [name: string]: Setting }, setting: Setting) => {
        return {
          ...allSettings,
          [setting.name]: setting,
        };
      },
      {}
    );
    return settings;
  }
);

@Injectable()
export class SettingsAdminSelectors {
  constructor(private store: Store<IAppState>) {}
  // selectors$
  settings$ = this.store.select(getAllSettings);
  settingsByCategory$ = this.store.select(getSettingsByCategory);
  settingsAsMap$ = this.store.select(getSettingsAsMap);
}
