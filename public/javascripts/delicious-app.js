//  this fie iswere webpack mix everything

import '../sass/style.scss';

import { $, $$ } from './modules/bling';

/**
* $$ select all
* $ select single
*/

import autocomplete from './modules/autocomplete';

import typeAhead from './modules/typeAhead';

import makeMap from './modules/map';

import ajaxHeart from './modules/heart';


autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

makeMap($('#map'));

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);
