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
require('./assistant_steps_add.js');
require('./assistant_steps_remove.js');

/**
 * The InstallModuleAssistant component implements the dialog that handles module installations.
 * 
 * @category Component
 */

class InstallModuleAssistant {
  constructor() {
    this._addModuleAssistantOriginalContent = undefined;

    const addButton = document.querySelector('#add-modules-button');
    addButton.addEventListener('click', async () => this._startAddModuleAssistant());

    const removeButton = document.querySelector('#remove-modules-button');
    removeButton.addEventListener('click', async () => this._startRemoveModuleAssistant());

    /** @type {import('./assistant_steps_add')} */
    this.assistantAdd = document.querySelector('assistant-steps-add');

    /** @type {import('./assistant_steps_remove')} */
    this.assistantRemove = document.querySelector('assistant-steps-remove');
  }

  initCallbacks(onAllTranslationsRemoved, onTranslationRemoved) {
    this.assistantRemove.initCallbacks(onAllTranslationsRemoved, onTranslationRemoved);
  }

  async openAssistant(moduleType) {
    await assistantController.initState(moduleType);

    var appContainerWidth = $(window).width() - 10;
    var wizardWidth = null;

    if (appContainerWidth < 1100) {
      wizardWidth = appContainerWidth;
    } else {
      wizardWidth = 1100;
    }

    var offsetLeft = appContainerWidth - wizardWidth - 100;
    var offsetTop = 20;

    this.assistantAdd.hide();
    $('#module-settings-assistant-remove').hide();
    $('#module-settings-assistant-init').show();

    const modules = await assistantController.get('installedModules');

    $('#add-modules-button').removeClass('ui-state-disabled');

    if (modules.length > 0) {
      $('#remove-modules-button').removeClass('ui-state-disabled');
    } else {
      $('#remove-modules-button').addClass('ui-state-disabled');
    }

    uiHelper.configureButtonStyles('#module-settings-assistant-init');

    var title = "";
    var moduleTypeText = "";
    var addModuleText = "";
    var removeModuleText = "";

    if (moduleType == "BIBLE") {
      title = i18n.t("module-assistant.bible-header");
      moduleTypeText = i18n.t("module-assistant.module-type-bible");
      addModuleText = i18n.t("module-assistant.add-translations");
      removeModuleText = i18n.t("module-assistant.remove-translations");
    } else if (moduleType == "DICT") {
      title = i18n.t("module-assistant.dict-header");
      moduleTypeText = i18n.t("module-assistant.module-type-dict");
      addModuleText = i18n.t("module-assistant.add-dicts");
      removeModuleText = i18n.t("module-assistant.remove-dicts");
    } else {
      console.error("InstallModuleAssistant: Unknown module type!");
    }

    var internetUsageNote = i18n.t("module-assistant.internet-usage-note", { module_type: moduleTypeText });
    $('#module-settings-assistant-internet-usage').html(internetUsageNote);
    $('#add-modules-button').html(addModuleText);
    $('#remove-modules-button').html(removeModuleText);

    $('#module-settings-assistant').dialog({
      position: [offsetLeft, offsetTop],
      modal: true,
      title: title,
      dialogClass: 'ezra-dialog module-assistant-dialog',
      width: wizardWidth,
      minHeight: 280
    });

    assistantHelper.unlockDialog();
  }

  async _startAddModuleAssistant() {
    $('#module-settings-assistant-init').hide();
    await this.assistantAdd.startModuleAssistantSteps();
  }

  async _startRemoveModuleAssistant() {
    $('#module-settings-assistant-init').hide();

    const modules = await assistantController.get('installedModules');
    if (modules.length > 0) {
      this.assistantRemove.startModuleAssistantSteps();
    }
  }

  // This is only for testing!!
  /** @deprecated */
  resetInstalledModules() {
    this._installedModules = [];
  }
}

module.exports = InstallModuleAssistant;
