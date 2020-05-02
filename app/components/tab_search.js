/* This file is part of Ezra Project.

   Copyright (C) 2019 - 2020 Tobias Klein <contact@ezra-project.net>

   Ezra Project is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Ezra Project is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with Ezra Project. See the file LICENSE.
   If not, see <http://www.gnu.org/licenses/>. */

const Mousetrap = require('mousetrap');
const VerseSearch = require('./verse_search.js');

class TabSearch {
  constructor() {
  }

  init(searchForm, searchInput, searchOccurancesElement, prevButton, nextButton, caseSensitiveCheckbox, onSearchResultsAvailable, onSearchReset) {
    this.searchForm = $(searchForm);
    this.inputField = $(searchInput);
    this.searchOccurancesElement = $(searchOccurancesElement);
    this.prevButton = $(prevButton);
    this.nextButton = $(nextButton);
    this.caseSensitiveCheckbox = $(caseSensitiveCheckbox);
    this.currentOccuranceIndex = 0;
    this.currentOccurancesCount = 0;
    this.allOccurances = [];
    this.previousOccuranceElement = null;
    this.currentOccuranceElement = null;
    this.onSearchResultsAvailable = onSearchResultsAvailable;
    this.onSearchReset = onSearchReset;
    this.verseSearch = new VerseSearch();

    this.initInputField();
    this.initSearchOptionControls();
    this.initNavigationButtons();
    this.initGlobalShortCuts();
  }

  initInputField() {
    this.inputField.bind('keyup', (e) => {
      if (e.key == 'Escape') {
        this.resetSearch();
        return;
      }

      if (e.key == 'Enter') {
        this.jumpToNextOccurance();
        return;
      }

      this.triggerDelayedSearch();
    });
  }

  initSearchOptionControls() {
    this.caseSensitiveCheckbox.bind('change', () => {
      this.triggerDelayedSearch();
    });
  }

  initNavigationButtons() {
    this.prevButton.bind('click', () => {
      this.jumpToNextOccurance(false);
    });

    this.nextButton.bind('click', () => {
      this.jumpToNextOccurance();
    });
  }

  initGlobalShortCuts() {
    var searchShortCut = 'ctrl+f';
    if (isMac()) {
      searchShortCut = 'command+f';
    }

    Mousetrap.bind(searchShortCut, () => {
      this.searchForm.show();
      this.inputField.focus();
      return false;
    });

    Mousetrap.bind('esc', () => {
      this.resetSearch();
      return false;
    });

    Mousetrap.bind('enter', () => {
      this.jumpToNextOccurance();
      return false;
    });
  }

  setVerseList(verseList) {
    this.verseList = verseList;
  }

  getSearchType() {
    var selectField = document.getElementById('tab-search-type');
    var selectedValue = selectField.options[selectField.selectedIndex].value;
    return selectedValue;
  }

  isCaseSensitive() {
    return this.caseSensitiveCheckbox.prop("checked");
  }

  triggerDelayedSearch() {
    clearTimeout(this.searchTimeout);

    var searchString = this.inputField.val();
    if (searchString.length < 3) {
      this.resetOccurances();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      bible_browser_controller.verse_selection.clear_verse_selection(false);
      this.onSearchReset();
      this.doSearch(searchString, this.isCaseSensitive());
      this.inputField.focus();
    }, 800);
  }

  resetOccurances() {
    if (this.currentOccurancesCount > 0) {
      this.removeAllHighlighting();
    }
    
    this.currentOccurancesCount = 0;
    this.updateOccurancesLabel();
    this.onSearchReset();
  }

  resetSearch() {
    this.resetOccurances();
    this.searchForm.hide();
    this.inputField[0].value = '';
  }

  jumpToNextOccurance(forward=true) {
    if (this.currentOccurancesCount == 0) {
      return;
    }

    this.previousOccuranceElement = $(this.allOccurances[this.currentOccuranceIndex]);

    var increment = 1;
    if (!forward) {
      increment = -1;
    }

    var inBounds = false;
    if (forward && (this.currentOccuranceIndex < (this.allOccurances.length - 1))) {
      inBounds = true;
    }

    if (!forward && (this.currentOccuranceIndex > 0)) {
      inBounds = true;
    }

    if (inBounds) {
      this.currentOccuranceIndex += increment;
    } else {
      if (forward) { // jump to the beginning when going forward at the end
        this.currentOccuranceIndex = 0;
      } else { // jump to the end when going backwards in the beginning
        this.currentOccuranceIndex = this.allOccurances.length - 1;
      }
    }

    this.jumpToCurrentOccurance();
    this.highlightCurrentOccurance();
  }

  jumpToCurrentOccurance() {
    // Jump to occurance in window
    this.currentOccuranceElement = $(this.allOccurances[this.currentOccuranceIndex]);
    var currentOccuranceVerseBox = this.currentOccuranceElement.closest('.verse-box');
    var currentOccuranceAnchor = '#' + $(currentOccuranceVerseBox.find('a')[0]).attr('name');
    window.location = currentOccuranceAnchor;
  }

  highlightCurrentOccurance() {
    // Update highlighting
    if (this.previousOccuranceElement != null) {
      this.previousOccuranceElement.removeClass('current-hl');
      this.previousOccuranceElement.closest('.verse-box').find('.verse-text').removeClass('ui-selected');
      bible_browser_controller.verse_selection.clear_verse_selection(false);
    }

    if (this.currentOccuranceElement != null) {
      this.currentOccuranceElement.addClass('current-hl');
      this.currentOccuranceElement.closest('.verse-box').find('.verse-text').addClass('ui-selected');
      bible_browser_controller.verse_selection.addVerseToSelected(this.currentOccuranceElement.closest('.verse-box'));
      bible_browser_controller.verse_selection.updateViewsAfterVerseSelection();
    }

    // Update occurances label
    this.updateOccurancesLabel();
  }

  updateOccurancesLabel() {
    var occurancesString = "";

    if (this.currentOccurancesCount > 0) {
      var currentOccuranceNumber = this.currentOccuranceIndex + 1;
      var occurancesString = currentOccuranceNumber + '/' + this.currentOccurancesCount;
    }

    this.searchOccurancesElement.html(occurancesString);
  }

  doSearch(searchString, caseSensitive=false) {
    if (this.verseList == null) {
      return;
    }
    
    var allVerses = this.verseList[0].querySelectorAll('.verse-text');

    this.currentOccuranceIndex = 0;
    this.currentOccurancesCount = 0;
    this.allOccurances = [];

    //console.log("Found " + allVerses.length + " verses to search in.");

    for (var i = 0; i < allVerses.length; i++) {
      var currentVerse = allVerses[i];
      this.removeHighlightingFromVerse(currentVerse);
      this.currentOccurancesCount += this.verseSearch.doVerseSearch(currentVerse, searchString, caseSensitive);
    }

    this.allOccurances = this.verseList[0].querySelectorAll('.search-hl');
    this.currentOccuranceElement = $(this.allOccurances[this.currentOccuranceIndex]);

    if (this.allOccurances.length > 0) {
      this.jumpToCurrentOccurance();
      this.highlightCurrentOccurance();
    } else {
      this.resetOccurances();
    }

    this.onSearchResultsAvailable(this.allOccurances);
  }

  removeAllHighlighting() {
    if (this.verseList != null) {
      for (var i = 0; i < this.allOccurances.length; i++) {
        var currentOccuranceVerseBox = $(this.allOccurances[i]).closest('.verse-text')[0];
        this.removeHighlightingFromVerse(currentOccuranceVerseBox);
      }
    }
  }

  removeHighlightingFromVerse(verseElement) {
    if (verseElement == null) {
      return;
    }
    
    var searchHl = $(verseElement).find('.search-hl, .current-hl');
    for (var i = 0; i < searchHl.length; i++) {
      var highlightedText = $(searchHl[i]);
      var text = highlightedText.text();
      highlightedText.replaceWith(text);
    }

    var verseElementHtml = verseElement.innerHTML;

    /* Remove line breaks between strings, that resulted from inserting the 
       search-hl / current-hl elements before. If these linebreaks are not removed
       the search function would afterwards not work anymore.

    State with highlighting:
    <span class="search-hl">Christ</span>us

    State after highlighting element was removed (see code above)
    "Christ"
    "us"

    State after line break was removed: (intention of code below)
    "Christus"

     */
    verseElementHtml = verseElementHtml.replace("\"\n\"", "");
    verseElement.innerHTML = verseElementHtml;

    var strongsElements = verseElement.querySelectorAll('w');
    for (var i = 0; i < strongsElements.length; i++) {
      var strongsHtml = strongsElements[i].innerHTML;
      strongsHtml = strongsHtml.replace(/ /g, '&nbsp;');
      strongsElements[i].innerHTML = strongsHtml;
    }
  }
}

module.exports = TabSearch;