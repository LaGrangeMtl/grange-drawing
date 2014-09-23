/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/VectorWord'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('rose/drawing/Alphabet.js'));
  	} else {
		ns[name] = factory(rose.drawing.Alphabet);
	}
}(this, function (Alphabet) {
	"use strict";

	
	var VectorWord = {
		getPaths : function(name, right, top, scale) {
			right = right || 0;
			top = top || 0;

			var continuous = false;
			var lines = [];

			//loop for every character in name (string)
			for(var i=0; i<name.length; i++) {
				var letter = name[i];
				if(letter === ' ') {
					right += Alphabet.getNSpace() * scale;
					continuous = false;
					continue;
				}
				var letterDef = Alphabet.getLetter(letter).scale(scale);
				//console.log(letterDef);
				
				var letterJoinedEnd = false;
				letterDef.paths.forEach(function(path) {
					var def = path.translate(right, top);
					var joinedStart = def.name && def.name.indexOf('joina') > -1;
					var joinedEnd = /join(a?)b/.test(def.name);
					//console.log(letter, joinedStart, joinedEnd);
					letterJoinedEnd = letterJoinedEnd || joinedEnd;
					if(joinedStart && continuous) {
						//append au continuous
						continuous.append(def, letter);

						//ajoute les easepoints de ce path
						var pathStartPos = continuous.getLength() - def.getLength();
						def.getEasepoints().forEach(function(pos){
							continuous.addEasepoint(pathStartPos + pos);
						});

					} else if(joinedEnd && !continuous) {
						//start un nouveau line
						continuous = def;
						continuous.name = letter;
						lines.push(continuous);
					} else {
						lines.push(def);
					}

					if(!letterJoinedEnd) {
						continuous = false;
					}

				});
				
				right += letterDef.getWidth();
				//console.table([{letter:name[i], letterWidth: letter.getWidth(), total:right}]);	
			}

			return lines;

		}
	};

	return VectorWord;
	
}));


