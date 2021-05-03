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

const i18n = require('i18next');

var picker;
var theButton;
var input;

function initPicker() {
  const { EmojiButton } = require('../../../node_modules/@joeattardi/emoji-button/dist/node');
  const isNightMode = app_controller.optionsMenu._nightModeOption && app_controller.optionsMenu._nightModeOption.isChecked();

  picker = new EmojiButton({ // https://emoji-button.js.org/docs/api
    emojiData: getLocalizedData(i18n.language),
    showPreview: false,
    showVariants: false,
    showAnimation: false,
    categories: ['smileys', 'people', 'animals', 'food', 'activities', 'travel', 'objects', 'symbols'],
    i18n: i18n.t('emoji', { returnObjects: true }),
    theme: isNightMode ? 'dark' : 'light',
    emojiSize: '1.3em',
    position: 'auto',
    zIndex: 10000,
    styleProperties: {
      '--background-color': '#f2f5f7',
      '--dark-background-color': '#1e1e1e',
    }
  });

  picker.on('emoji', selection => {
    // `selection` object has an `emoji` property
    if (input && input.nodeName === 'INPUT') {
      input.value += selection.emoji;
    } else if (input && input.getDoc()) {
      input.getDoc().replaceSelection(selection.emoji);
    } else {
      console.log('Input is not defined. Can\'t add emoji', selection.emoji);
    }

  });
  return picker;
}

function initButtonTrigger(element, codeMirror = false) {
  input = codeMirror || element;

  if (theButton === undefined) {
    theButton = document.createElement('button');
    const icon = document.createElement('i');
    icon.classList.add('fas', 'fa-grin');
    theButton.appendChild(icon);
    theButton.style.cssText = `
      position: absolute; 
      right: 0;
      font-size: 1rem;
      background: none;
      border: none;
      margin: 0;
      padding: 3px;
    `;

    theButton.addEventListener('click', () => {
      if (picker === undefined) {
        initPicker();
      }
      picker.togglePicker(theButton);
    });
  }


  if (codeMirror) {
    theButton.style.left = 'auto';
    theButton.style.bottom = '3px';
    theButton.style.marginRight = '1.1em';
    theButton.style.color = 'inherit';
  } else { // overlaying emoji button over text input
    const buttonWidth = theButton.getBoundingClientRect().width || 22; // approximate width when button is not yet attached to DOM
    theButton.style.left = `${getInputRightOffset(element) - buttonWidth}px`;
    theButton.style.bottom = 'auto';
    theButton.style.marginRight = '0';
    theButton.style.color = '#b7b7b7';
  }

  element.parentNode.style.position = 'relative'; // theButton left position relative to this parent
  theButton.style.display = 'inline-block';

  return theButton;
}

function getInputRightOffset(inputElement) {
  const inputRight = inputElement.getBoundingClientRect().right;
  const parentLeft = inputElement.parentNode.getBoundingClientRect().left;
  return inputRight - parentLeft;
}

function hideButtonTrigger() {
  if (theButton) {
    theButton.style.display = 'none';
  }
}

function setTheme(theme) {
  if (picker) {
    picker.setTheme(theme);
  }
}

var screenHeightAvaliable = null;
function saveScreenHeight() {
  screenHeightAvaliable = window.screen.availHeight;
  platformHelper.isDebug() && console.log('Screen size before focus:', screenHeightAvaliable);
}

async function isSameScreenHeight() {
  await window.sleep(600);
  platformHelper.isDebug() && console.log('Screen size after focus:', window.screen.availHeight);
  return screenHeightAvaliable ? screenHeightAvaliable === window.screen.availHeight : true;
}

function getLocalizedData(locale) {
  switch (locale) {
    case 'de':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_de.json');
    case 'en':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_en.json');
    case 'es':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_es.json');
    case 'fr':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_fr.json');
    case 'nl':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_nl.json');
    case 'ru':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_ru.json');
    case 'sk':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_sk.json');
    case 'uk':
      return require('../../../node_modules/@joeattardi/emoji-button/dist/locale/emoji_uk.json');
    default:
      console.log(`Can't upload emoji annotations for locale: ${locale}. Using default`);

  }
}

/**
 * The emojiPicker component addss posibility to insert emojis to the tag names and notes 
 * on desktop platforms (electron app). It attaches emoji picker button to the text input
 * field. 
 * Emoji Picker dialog is implemented via external library:
 * https://github.com/joeattardi/emoji-button
 * 
 * emojiPicker keeps it's state inside module variables. So it can be just imported/requested
 * where it needed (without using app_controller instance).
 * 
 * @category Component
 */

module.exports = {
  /** Prefocus check to detect if virtual keyboard is used */
  preFocusCheck: () => saveScreenHeight(),
  /** 
   * Appends emoji picker button to input field
   * @param {HTMLElement} inputElement - input element to append to
   */
  appendTo: async (inputElement) => {
    if (platformHelper.isElectron() && await isSameScreenHeight()) {
      const trigger = initButtonTrigger(inputElement);
      inputElement.parentNode.insertBefore(trigger, inputElement.nextSibling);
    }
  },
  /** 
   * Appends emoji picker button to codeMirror 
   * @param {HTMLElement} textArea - textArea used for codeMirror editor instance  
   * @param codeMirror - active codeMirror editor instance
   */
  appendToCodeMirror: async (textArea, codeMirror) => {
    if (platformHelper.isElectron() && codeMirror && await isSameScreenHeight()) {
      const trigger = initButtonTrigger(textArea, codeMirror);
      textArea.parentNode.insertBefore(trigger, null); // insert as last child
    }
  },

  /** Hides emoji picker button */
  hide: hideButtonTrigger,

  setDarkTheme: () => setTheme('dark'),
  setLightTheme: () => setTheme('light'),
}
