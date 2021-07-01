/* This file is part of Ezra Bible App.

   Copyright (C) 2019 - 2021 Ezra Bible App Development Team <contact@ezrabibleapp.net>

   Ezra Bible App is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 2 of the License, or
   (at your option) any later version.

   Ezra Bible App is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Ezra Bible App. See the file LICENSE.
   If not, see <http://www.gnu.org/licenses/>. */

const assistantController = require('./assistant_controller.js');
const assistantHelper = require('./assistant_helper.js');
const i18nController = require('../../controllers/i18n_controller.js');
require('./step_modules_remove.js');
require('./step_remove.js');

/**
 * The RemoteModuleAssistant component implements the dialog that handles module removals.
 * 
 * @category Component
 */
class RemoveModuleAssistant {
  constructor() {
    this._moduleRemovalStatus = 'DONE';

    var removeButton = $('#remove-modules-button');

    removeButton.bind('click', async () => {
      var currentModuleType = app_controller.install_module_assistant._currentModuleType;

      var modules = await app_controller.translation_controller.getInstalledModules(currentModuleType);
      if (modules.length > 0) {
        this.openRemoveModuleAssistant(currentModuleType);
      }
    });

    i18nController.addLocaleChangeSubscriber(() => {
      this.resetModuleAssistantContent();
    });
  }

  init(onAllTranslationsRemoved, onTranslationRemoved) {
    this.onAllTranslationsRemoved = onAllTranslationsRemoved;
    this.onTranslationRemoved = onTranslationRemoved;
    this._stepsInitialized = false;
  }

  async openRemoveModuleAssistant(moduleType) {
    $('#module-settings-assistant-init').hide();
    this.initRemoveModuleAssistant(moduleType);
    $('#module-settings-assistant-remove').show();

    var wizardPage = $('#module-settings-assistant-remove-p-0');
    wizardPage.empty();

    /**@type {import('./step_modules_remove')} */
    const removeModuleListStep = document.createElement('step-modules-remove');
    wizardPage.append(removeModuleListStep);

    removeModuleListStep.listModules()
  }

  resetModuleAssistantContent() {
    if (this._removeModuleAssistantOriginalContent != undefined) {
      $('#module-settings-assistant-remove').steps("destroy");
      $('#module-settings-assistant-remove').html(this._removeModuleAssistantOriginalContent);
    } else {
      this._removeModuleAssistantOriginalContent = $('#module-settings-assistant-remove').html();
    }

    $('#module-settings-assistant-remove').localize();
  }

  initRemoveModuleAssistant() {
    this.resetModuleAssistantContent();

    $('.module-settings-assistant-section-header-module-type').html(app_controller.install_module_assistant._moduleTypeText);

    $('#module-settings-assistant-remove').steps({
      headerTag: "h3",
      bodyTag: "section",
      contentContainerTag: "module-settings-assistant-remove",
      autoFocus: true,
      stepsOrientation: 1,
      onStepChanging: (event, currentIndex, newIndex) => this.removeModuleAssistantStepChanging(event, currentIndex, newIndex),
      onStepChanged: (event, currentIndex, priorIndex) => this.removeModuleAssistantStepChanged(event, currentIndex, priorIndex),
      onFinishing: (event, currentIndex) => this.removeModuleAssistantFinishing(event, currentIndex),
      onFinished: async (event, currentIndex) => this.removeModuleAssistantFinished(event, currentIndex),
      labels: {
        cancel: i18n.t("general.cancel"),
        finish: i18n.t("general.finish"),
        next: i18n.t("general.next"),
        previous: i18n.t("general.previous")
      }
    });
  }

  removeModuleAssistantStepChanging(event, currentIndex, newIndex) {
    if (currentIndex == 0 && newIndex == 1) { // Changing from Translations (1) to Removal (2)
      return assistantController.get('selectedModules').size > 0;
    } else if (currentIndex == 1 && newIndex != 1) {
      return false;
    }

    return true;
  }

  async removeModuleAssistantStepChanged(event, currentIndex, priorIndex) {
    if (priorIndex == 0) {
      var removalPage = $("#module-settings-assistant-remove-p-1");
      removalPage.empty();

      /**@type {import('./step_remove')} */
      const removeStep = document.createElement('step-remove');
      removalPage.append(removeStep);

      removeStep.uninstallSelectedModules(this.onAllTranslationsRemoved, this.onTranslationRemoved);
    }
  }

  removeModuleAssistantFinishing(event, currentIndex) {
    return this._moduleRemovalStatus != 'IN_PROGRESS';
  }

  async removeModuleAssistantFinished(event, currentIndex) {
    $('#module-settings-assistant').dialog('close');
    this._installedTranslations = await app_controller.translation_controller.getInstalledModules('BIBLE');
    await app_controller.translation_controller.initTranslationsMenu();
  }
}

module.exports = RemoveModuleAssistant;