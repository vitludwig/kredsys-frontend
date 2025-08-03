import {CanDeactivateFn} from "@angular/router";
import {CanComponentDeactivate} from "../types/CanComponentDeactivate";

export const UNSAVED_CHANGES_MSG  = 'Máte neuložená data, opravdu chcete stránku opustit?';
{}
export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (
  component: CanComponentDeactivate
) => {
  return component.canDeactivate();
};
