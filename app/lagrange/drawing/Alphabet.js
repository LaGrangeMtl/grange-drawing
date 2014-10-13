/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/Alphabet'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('jquery'), require('./Path'), require('./PathGroup'));
  	} else {
		ns[name] = factory(root.jQuery, root.lagrange.drawing.Path, root.lagrange.drawing.PathGroup);
	}
}(this, function ($, Path, PathGroup) {
	"use strict";


	var specialChars = {
		'_x2D_' : '-',
		'_x2E_' : '.'
	};

	var Alphabet = function(){
		var settings;
		var symbols = {};


		var parseSVG = function(data){

			//console.log(data);
			var doc = $(data);
			var layers = doc.find('g');
			layers.each(function(i, el){
				var layer = $(el);
				var id = layer.attr('id');
				id = specialChars[id] || id;
				//console.log(id);
				//if(id.length > 1) return;
				var paths = layer.find('path');
				if(paths.length===0) return;

				var symbol = symbols[id] = new PathGroup(id);

				paths.each(function(i, el){
					var pathEl = $(el);
					var p = Path.factory( pathEl.attr('d'), pathEl.attr('id'), null, settings.easepoints[id] && settings.easepoints[id][i]).scale(settings.scale || 1);				
					symbol.addPath( p );
				});

			});

			//trouve le top absolu (top de la lettre la plus haute)
			var top = Object.keys(symbols).reduce(function(min, symbolName){
				var t = symbols[symbolName].getTop();
				if(min === undefined || min > t) {
					min = t;
				}
				return min;
			}, undefined);
			//console.log(symbols);

			//ajuste le baseline de chaque lettre
			Object.keys(symbols).forEach(function(key) {
				symbols[key].setOffset(-1 * symbols[key].getLeft(), -1 * top);
			});


		};

		var doLoad = function(basePath){
			var loading = $.ajax({
				url : ((basePath && basePath+'/') || '') + settings.svgFile,
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

		
		this.init = function(s) {
			settings = s;
			return this;
		};

		this.load = function(basePath) {
			return doLoad(basePath);
		};
		
		this.getSymbol = function(l){
			return symbols[l];
		};
		
		this.getNSpace = function(){
			return symbols['n'] && symbols['n'].getWidth();
		};

		this.getLowerLineHeight = function(){
			return symbols['n'] && symbols['n'].getHeight();
		};

		this.getUpperLineHeight = function(){
			return symbols['N'] && symbols['N'].getHeight();
		};

		this.getAll = function(){
			return symbols;
		};

		return this;
	};

	var instances = {};
	Alphabet.factory = function(settings){
		var svg = settings.svgFile;
		instances[svg] = instances[svg] || (new Alphabet()).init(settings);
		return instances[svg];
	};

	return Alphabet;
	
}));


