/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/Alphabet'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('jquery'), require('lagrange/drawing/Path.js'), require('lagrange/drawing/PathGroup.js'), require('app/rose/drawing/PathEasepoints.js'));
  	} else {
		ns[name] = factory(root.jQuery, root.lagrange.drawing.Path, root.lagrange.drawing.PathGroup, root.lagrange.drawing.PathEasepoints);
	}
}(this, function ($, Path, PathGroup, PathEasepoints) {
	"use strict";

	//original scale factor
	var SCALE = 1;
	var svgFile = 'assets/alphabet.svg';

	//PARSÉ avec le helper au bas
	var EASEPOINTS = {"Ö":[[5],[5],[]],"Ô":[[]],"Ï":[[93],[5],[5]],"Î":[[93]],"Ë":[[159],[5],[5]],"Ê":[[159]],"È":[[159],[]],"É":[[159],[]],"Ç":[[],[13]],"Ä":[[189],[],[5],[5]],"Â":[[189],[]],"À":[[189],[],[]],"Z":[[193,340]],"Y":[[329]],"X":[[],[]],"W":[[227,336]],"V":[[231]],"U":[[317]],"T":[[],[]],"S":[[]],"R":[[289],[]],"Q":[[]],"P":[[],[]],"O":[[]],"N":[[247,350]],"M":[[238,338,452]],"L":[[]],"K":[[115],[122]],"J":[[132]],"I":[[93]],"H":[[142],[],[]],"G":[[321]],"F":[[],[]],"E":[[159]],"D":[[]],"C":[[]],"B":[[453]],"A":[[189],[]],"ô":[[155]],"ö":[[155],[5],[5]],"ï":[[42],[5],[5]],"î":[[42]],"ë":[[],[5],[5]],"ê":[[]],"è":[[],[]],"é":[[],[]],"ç":[[72],[13]],"ä":[[55,133],[5],[5]],"â":[[55,133]],"à":[[55,133],[]],"z":[[110]],"y":[[42,116,227]],"x":[[42],[]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103],[]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[124]],"k":[[131,244,327]],"j":[[52],[18]],"i":[[42],[18]],"h":[[133,248,293]],"g":[[60,145]],"f":[[419]],"e":[[]],"d":[[236]],"c":[[72]],"b":[[291]],"a":[[55,133]]};

	var letters = {};

	

	var parseSVG = function(data){

		//console.log(data);
		var doc = $(data);
		var layers = doc.find('g');
		layers.each(function(i, el){
			var layer = $(el);
			var id = layer.attr('id');

			if(id == '_x2D_') {
				id = '-';
			}
			
			if(id.length > 1) return;

			var letter = letters[id] = new PathGroup(id);

			var paths = layer.find('path');
			//if(paths.length==0) console.log(layer);
			//console.log(id);
			paths.each(function(i, el){
				var pathEl = $(el);
				var p = Path.factory( pathEl.attr('d'), pathEl.attr('id'), null, EASEPOINTS[id] && EASEPOINTS[id][i]).scale(SCALE);				
				letter.addPath( p );
			});

		});

		//console.log(boundings);
		//trouve le top absolu (top de la lettre la plus haute)
		var top = Object.keys(letters).reduce(function(min, letterName){
			var t = letters[letterName].getTop();
			if(min === undefined || min > t) {
				min = t;
			}
			return min;
		}, undefined);
		//console.log(top);
		//console.log(letters);

		//ajuste le baseline de chaque lettre
		Object.keys(letters).forEach(function(key) {
			letters[key].setOffset(-1 * letters[key].getLeft(), -1 * top);
		});


	};

	var doLoad = function(){
		var loading = $.ajax({
			url : svgFile,
			dataType : 'text'
		});

		loading.then(parseSVG, function(a, b, c){
			console.log('error load');
			console.log(b);
			//console.log(c);
			//console.log(a.responseText);
		});

		return loading.promise();

	};

	

	var Alphabet = {
		init : function() {
			return doLoad();
		},
		getLetter : function(l){
			return letters[l];
		},
		getNSpace : function(){
			return letters['n'].getWidth();
		},
		//setup des breakpoints (points où on fait un easing) de chacune des lettres. Sera outputté et savé en JSON, pour être loadé en même temps que l'alphabet. Le parse en realtime est trop lent, donc cette fonction doit etre callée pour refaire les breakpoints chaque fois que le SVG change.
		parseEasepoints : function(stage, node, dim){

			PathEasepoints(stage, letters, node, dim);
		}
	};

	return Alphabet;
	
}));


