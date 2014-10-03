(function (root, factory) {
	var nsParts = 'DecorativeLines'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('./lagrange/drawing/Alphabet'));
  	} else {
		ns[name] = factory(lagrange.drawing.Alphabet);
	}
}(this, function (Alphabet) {
	"use strict";

	//original scale factor
	var Lines = {
		scale : 0.2,
		svgFile : 'assets/lignes.svg',
		easepoints : {"folie":[[0.2643860025806711]],"wordDecorationEnd":[[0.6140462357835195]],"decembre":[[0.5796293820295325]],"nouvelles":[[0.2520739271467172,0.6689654220432111]]}
	};


	return  Alphabet.factory(Lines);
	
}));