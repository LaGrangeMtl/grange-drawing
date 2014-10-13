(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
		scale : 1,
		svgFile : 'assets/lignes.svg',
		easepoints : {"folie":[[0.2643860025806711]],"wordDecorationEnd":[[0.6140462357835195]],"decembre":[[0.5796293820295325]],"nouvelles":[[0.2520739271467172,0.6689654220432111]]}
	};

	return Alphabet.factory(Lines);
	
}));
},{"./lagrange/drawing/Alphabet":4}],2:[function(require,module,exports){
	
	var $ = require('jquery');
	var PathEasepoints = require('./lagrange/drawing/PathEasepoints');/**/
	
	var WriteNames = require('./WriteNames');
	var Stage = require('./lagrange/drawing/Stage');



	var docReady = (function(){
		var d = $.Deferred();

		$(document).ready(function(){
			d.resolve()
		});

		return d.promise();

	})();

	var ready = $.when(docReady, WriteNames.load());

	var doDraw = function(){
		var container = $('#svg');

		var words = [
			{
				text : 'Hello',
				size : 1
			},
			{
				text : 'Montréal',
				size : 1.2,
				append : function(DecorativeLines){
					return {
						symbol: DecorativeLines.getSymbol('wordDecorationEnd').getPaths()[0],
						size: 1 //height in em
					};
				}
			}
		];


		var stage = Stage.getStage('svg');
		var tl = WriteNames.getTimeline(words, stage);
		tl.play();
	};



	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		ready.then(doDraw);
	});


	//parse les easepoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		//EmilieFont
		//DecorativeLines

		var EmilieFont = require('./lagrange/drawing/EmilieFont.js');
		var DecorativeLines = require('./DecorativeLines');
		PathEasepoints(Stage.getStage('svg'), EmilieFont.getAll(), $('#brp'));
	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		ready.then(printEasepoints);
	});


},{"./DecorativeLines":1,"./WriteNames":3,"./lagrange/drawing/EmilieFont.js":6,"./lagrange/drawing/PathEasepoints":8,"./lagrange/drawing/Stage":10,"jquery":"jquery"}],3:[function(require,module,exports){
(function (root, factory) {
	var nsParts = 'rose/animations/WriteNames'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(
	    	require('jquery'),
	    	require('lodash'),
	    	require('./lagrange/drawing/EmilieFont.js'),
	    	require('./DecorativeLines'),
	    	require('./lagrange/drawing/DrawPath'),
	    	require('./lagrange/drawing/VectorWord'),
	    	require('./lagrange/drawing/PathGroup'),
	    	require('raphael'),
	    	require('gsap'));
  	} else {
		ns[name] = factory(root.jQuery, root._);
	}
}(this, function ($, _, EmilieFont, DecorativeLines, DrawPath, VectorWord, PathGroup, Raphael, TweenMax) {

	var gsap = window.GreenSockGlobals || window;

	var defaultSettings = {
		color: '#444444',
		stroke: 2,
		lineHeight: 1.2,
		speed: 250 //px per second
	};

	var getAppend = function(paths, append){
		var curve = append.symbol;
		
		//trouve les points de départ et d'arrivée de la curve
		var curveStr = curve.getSVGString();
		var startPos = Raphael.getPointAtLength(curveStr, 0);
		var endPos = Raphael.getPointAtLength(curveStr, curve.getLength());

		var wordPaths = paths.getPaths();
		//trouve le path qui finit le plus à droite dans les lettres
		var lastPath = wordPaths.reduce(function(last, cur){
			if(!last) return cur;
			//si le path se finit plus à droite ET qu'il a un nom (les détails genre barre du t et point de i n'ont pas de nom)
			if(cur.name && last.getBounding().x2 < cur.getBounding().x2){
				last = cur;
			}
			return last;
		}, null);

		var wordEndPos = Raphael.getPointAtLength(lastPath.getSVGString(), lastPath.getLength());

		//position absolue du point de départ du path
		var absStartPos = {
			x: wordEndPos.x - startPos.x,
			y: wordEndPos.y - startPos.y
		};

		/*showPoint({x:wordEndPos.xx, y:wordEndPos.y}, '#22ff00');
		showPoint(absStartPos, '#ff0000');/**/

		//à combien de distance le boute est du début
		var relEndPos = {
			x: endPos.x - startPos.x,
			y: endPos.y - startPos.y
		};

		//à quel endroit on doit faire arriver le endpos, relatif au début du path
		var targetRelEndPos = {
			x: - wordEndPos.x,
			y: append.size * EmilieFont.getUpperLineHeight()
		};

		var ratio = {
			x : targetRelEndPos.x / relEndPos.x,
			y : targetRelEndPos.y / relEndPos.y,
		};
		/*console.log('start at',absStartPos);
		console.log(targetRelEndPos);
		console.log(ratio, currentEndPos);**/

		var m = Raphael.matrix();
		m.scale(ratio.x, ratio.y, absStartPos.x+startPos.x, absStartPos.y);
		m.translate(absStartPos.x, absStartPos.y);
		curve = curve.applyMatrix(m);

		lastPath.append(curve);

		return paths;

	};
	
	var getWords = function(words, lineHeight) {
		var top = 0;
		return words.map(function(word, lineNum){

			var paths = VectorWord.getPaths(EmilieFont, word.text);
			paths = paths.scale(word.size);

			//center text
			var width = paths.getWidth();
			var left = - width / 2;

			paths.setOffset(left, top);
			
			top += EmilieFont.getUpperLineHeight() * lineHeight;

			//ajoute le guidi sur le dernier mot
			if(word.append) {
				paths = getAppend(paths, word.append(DecorativeLines));
			}

			word.paths = paths;

			return word;

		});
	};


	//trouve le bounding box de l'ensemble des paths, s'en servira pour s'assurer que ça entre toujours dans le stage
	var getBounding = function(words){
		return words.reduce(function(g, w){
			w.paths.getPaths().forEach(function(p){
				g.addPath(p);
			});
			return g;
		}, PathGroup.factory()).getBounding();
	};

	return {
		getTimeline : function(words, stage, settings) {
			settings = _.extend({}, defaultSettings, settings);
			words = getWords(words, settings.lineHeight);
			var bounding = getBounding(words);

			var layer = stage.getNewLayer();

			/*layer.showPoint({x:bounding.x, y:bounding.y});
			layer.showPoint({x:bounding.x2, y:bounding.y2});/**/
			//console.log(bounding);

			var resizeSet = (function(){
				var padding = 0.1;//%
				var W = 0, H = 0;
				return function(){
					
					//if(stage.width === W && stage.height === H)  return;

					W = stage.width() * (1-padding);
					H = stage.height() * (1-padding);

					var scale = W / bounding.width;
					var targetH = bounding.height * scale;
					if(targetH > H){
						scale = H / bounding.height;
					}
					
					var targetLeft = (stage.width() * padding * 0.5) + ((W - bounding.width) / 2) - bounding.x;
					var targetTop = -(stage.height() * padding * 0.5) + (stage.height() - ( bounding.y + (bounding.height*scale/**/)));
					layer.transform('t'+targetLeft+','+targetTop+'s'+scale+','+scale+',0,0');
				}
			})();

			stage.onResize.progress(resizeSet);

			var tl = words.reduce(function(tl, word, lineNum){
				return DrawPath.group(word.paths.getPaths(), layer, {
					pxPerSecond : settings.speed * word.size,
					color : settings.color,
					strokeWidth : settings.stroke,
					easing : gsap.Sine.easeInOut
				}, tl);
			}, new gsap.TimelineMax({paused:true, onUpdate: resizeSet}));
			
			return tl;

		},

		load : function(){
			console.log(DecorativeLines);
			console.log(EmilieFont);
			return $.when(EmilieFont.load(), DecorativeLines.load());
		}
	};

}));
},{"./DecorativeLines":1,"./lagrange/drawing/DrawPath":5,"./lagrange/drawing/EmilieFont.js":6,"./lagrange/drawing/PathGroup":9,"./lagrange/drawing/VectorWord":11,"gsap":"gsap","jquery":"jquery","lodash":"lodash","raphael":"raphael"}],4:[function(require,module,exports){
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



},{"./Path":7,"./PathGroup":9,"jquery":"jquery"}],5:[function(require,module,exports){
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/DrawPath'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    ns[name] = module.exports = factory(require('lodash'), require('raphael'), require('gsap'));
  	} else {
		ns[name] = factory(root._, root.Raphael, (root.GreenSockGlobals || root));
	}
}(this, function (_, Raphael, TweenMax) {
	"use strict";

	//gsap exports TweenMax
	var gsap = window.GreenSockGlobals || window;

	var defaults = {
		color: '#000000',
		strokeWidth : 0.6,
		pxPerSecond : 100, //speed of drawing
		easing : gsap.Quad.easeIn
	};

	//helper

	var DrawPath = {

		single : function(path, layer, params){
			
			var settings = _.extend({}, defaults, params);
			var pathStr = path.getSVGString();
			var length = path.getLength();

			var pxPerSecond = settings.pxPerSecond;
			var time = length / pxPerSecond;

			var anim = {distance: 0};
			
			var update = (function(){
				//console.log('update');
				var el;
				return function(){
					var pathPart = Raphael.getSubpath(pathStr, 0, anim.distance);
					layer.remove(el);
					el = layer.add('path', pathPart);
					el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});
				};
			})();

			var easePoints = path.getEasepoints();
			/*console.log(easePoints.length);
			easePoints.forEach(function(pos){
				var p = Raphael.getPointAtLength(pathStr, pos);
				layer.showPoint(p, '#ff0000', 2);
			});/**/

			var last = 0;
			return easePoints.reduce(function(tl, dist) {
				var time = (dist-last) / pxPerSecond;
				last = dist;
				return tl.to(anim, time, {distance: dist, ease : settings.easing});
			}, new gsap.TimelineMax({
				onUpdate : update
			})).to(anim, ((length - (easePoints.length && easePoints[easePoints.length-1])) / pxPerSecond), {distance: length, ease : settings.easing});
			
		},

		group : function(paths, layer, settings, tl) {
			return paths.reduce(function(tl, path){
				return tl.append(DrawPath.single(path, layer, settings));
			}, tl || new gsap.TimelineMax({paused:true}));
		}
	}

	return DrawPath;
	
}));



},{"gsap":"gsap","lodash":"lodash","raphael":"raphael"}],6:[function(require,module,exports){
(function (root, factory) {
	var nsParts = 'lagrange/drawing/EmilieFont'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('./Alphabet'));
  	} else {
		ns[name] = factory(lagrange.drawing.Alphabet);
	}
}(this, function (Alphabet) {
	"use strict";

	//original scale factor
	var EmilieFont = {
		scale : 1,
		svgFile : 'assets/emilieFont.svg',
		//PARSÉ avec le helper
		easepoints : {"Ô":[null,[0.5584914919761824]],"Ï":[[0.29016354963613855]],"Î":[[0.2965407705072625],[0.5467815045609877]],"Ë":[[0.5077096788604549]],"Ê":[[0.5077096788604549],[0.5772976077109914]],"È":[[0.5077096788604548]],"É":[[0.5077096788604549]],"Ç":[null,[0.2598411554903728]],"Ä":[[0.6336814724971563]],"Â":[[0.6336814724971539],null,[0.5090886807972653]],"À":[[0.6336814724971515]],"Z":[[0.43397251661486874,0.7645111691660901]],"Y":[[0.5721288765582158]],"W":[[0.39059019156730196,0.5781423099850813]],"V":[[0.6084105902730373]],"U":[[0.7019970416843152]],"R":[[0.7209223516252533]],"O":[[0.7438835818476476]],"N":[[0.5220142131783195,0.739696253491546]],"M":[[0.4230267565749447,0.6007690912702996,0.8033953528230042]],"L":[[0.675791197094622]],"K":[[0.4176184176593474],[0.4974675895966692]],"J":[[0.30526202860950097]],"H":[[0.44412310090678697]],"G":[[0.565989875455731]],"E":[[0.507714239419093]],"D":[[0.7437876093459903]],"B":[[0.7472581393948285]],"A":[[0.6336814724971553]],"ô":[[0.8733942750707324],[0.5467815045610148]],"ö":[[0.8733942750707276]],"ï":[[0.5396497019042842]],"î":[[0.5396497019042847],[0.5446698429470289]],"ë":[[0.4019332258014558]],"ê":[[0.4019332258014558],[0.5730882321053653]],"è":[[0.401933225801456]],"é":[[0.4019332258014584]],"ç":[[0.5330591122685393],[0.25984115549037146]],"ä":[[0.34940430982819826,0.8449231492209157]],"â":[[0.34940430982820014,0.8449231492209203],[0.5142123761120201]],"à":[[0.34940430982820303,0.8449231492209274]],"z":[[0.365922277194166,0.6985788928252259]],"y":[[0.1268221593350814,0.35027072578260576,0.6854435754538923]],"x":[[0.4191980810790184]],"w":[[0.17801329921332273,0.5012479741006719,0.8291672094936348]],"v":[[0.5536092498520837]],"u":[[0.22756813200989953,0.7240804200314985]],"t":[[0.49372903305517213]],"s":[[0.35139938159549133,0.7730786395100809]],"r":[[0.5461246516048937]],"q":[[0.4202781109450618,0.948544347619063]],"p":[[0.13929487659814935,0.7586595957577777]],"o":[[0.8719079009287485]],"n":[[0.7670173696488157]],"m":[[0.5253602561298806]],"l":[[0.4928220467456207]],"k":[[0.3589229109383251,0.6788929478213281,0.9098278440064521]],"j":[[0.1910121713438751]],"i":[[0.5396497019042862]],"h":[[0.3948367837720256,0.7474772700416973,0.8831082262992633]],"g":[[0.171539588772651,0.41455400620057326]],"f":[[0.2940218468777052,0.9193668197146155]],"d":[[0.15935695427297436,0.6542022333311579]],"c":[[0.5330591122685394]],"b":[[0.40392205820143084,0.9328676106080666]],"a":[[0.3494043098281997,0.8449231492209193]]}
	};


	return  Alphabet.factory(EmilieFont);;
	
}));
},{"./Alphabet":4}],7:[function(require,module,exports){
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/Path'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    ns[name] = module.exports = factory(require('raphael'));
  	} else {
		ns[name] = factory(root.Raphael);
	}
}(this, function (Raphael) {
	"use strict";

	var reg = /([a-z])([0-9\s\,\.\-]+)/gi;
		
	//expected length of each type
	var expectedLengths = {
		m : 2,
		l : 2,
		v : 1,
		h : 1,
		c : 6,
		s : 4
	};

	var Path = function(svg, name, parsed, easePoints) {
		this.name = name;
		//if(svg) console.log(svg, parsed);
		this.easePoints = easePoints || [];
		//console.log(name, easePoints);
		this._setParsed(parsed || this._parse(svg));
	};

	Path.prototype._setParsed = function(parsed) {
		//console.log(parsed);
		this.parsed = parsed;
	};

	Path.prototype.getCubic = function() {
		return this.cubic || this._parseCubic();
	};


	Path.prototype.getLength = function() {
		return Raphael.getTotalLength(this.getSVGString());
	};

	/**
	Gets an SVG string of the path segemnts. It is not the svg property of the path, as it is potentially transformed
	*/
	Path.prototype.getSVGString = function() {
		return this.parsed.reduce(function(svg, segment){
			return svg + segment.type + segment.anchors.join(','); 
		}, '');
	};

	/**
	Gets the absolute positions at which we have ease points (which are preparsed and considered part of the path's definitions)
	*/
	Path.prototype.getEasepoints = function() {
		var l = this.getLength();
		return this.easePoints.map(function(e){
			return e * l;
		});
	};

	Path.prototype.getPoint = function(idx) {
		//console.log(this.parsed);
		return this.parsed[idx] && this.parsed[idx].anchors;
	};

	/**
	Parses an SVG path string to a list of segment definitions with ABSOLUTE positions using Raphael.path2curve
	*/
	Path.prototype._parse = function(svg) {
		var curve = Raphael.path2curve(svg);
		var path = curve.map(function(point){
			return {
				type : point.shift(),
				anchors : point
			};
		});
		return path;
	};

	/**
		Parses a path defined by parsePath to a list of bezier points to be used by Greensock Bezier plugin, for example
		TweenMax.to(sprite, 500, {
			bezier:{type:"cubic", values:cubic},
			ease:Quad.easeInOut,
			useFrames : true
		});
		*/
	Path.prototype._parseCubic = function() {
		//console.log(path);
		//assumed first element is a moveto
		var anchors = this.cubic = this.parsed.reduce(function(anchors, segment){
			var a = segment.anchors;
			if(segment.type==='M'){
				anchors.push({x: a[0], y:a[1]});
			} else if(segment.type==='L'){
				anchors.push({x: anchors[anchors.length-1].x, y: anchors[anchors.length-1].y})
				anchors.push({x: a[0], y: a[1]});
				anchors.push({x: anchors[anchors.length-1].x, y: anchors[anchors.length-1].y})
			} else {
				anchors.push({x: a[0], y: a[1]});
				anchors.push({x: a[2], y: a[3]});
				anchors.push({x: a[4], y: a[5]});
			}
			return anchors;

		}, []);

		return anchors;

	};

	//trouve le bounding box d'une lettre (en se fiant juste sur les points... on ne calcule pas ou passe le path)
	Path.prototype.getBounding = function() {
		return Raphael.pathBBox(this.getSVGString());
	};


	Path.prototype.translate = function(x, y) {
		var m = Raphael.matrix();
		m.translate(x, y);
		var svg = Raphael.mapPath(this.getSVGString(), m);
		return Path.factory(svg, this.name, null, this.easePoints.slice(0));
	};

	//returns a new path, scaled
	Path.prototype.scale = Path.prototype.clone = function(ratio) {
		ratio = ratio || 1;
		var m = Raphael.matrix();
		m.scale(ratio);
		var svg = Raphael.mapPath(this.getSVGString(), m);
		return Path.factory(svg, this.name, null, this.easePoints.slice(0));
	};

	Path.prototype.applyMatrix = function(m){
		var svg = Raphael.mapPath(this.getSVGString(), m);
		return Path.factory(svg, this.name, null, this.easePoints.slice(0));
	}; 

	Path.prototype.append = function(part, name) {
		//console.log(part);
		if(name) this.name += name;
		var origLength = this.getLength();
		this._setParsed(this.parsed.concat(part.parsed.slice(1)));
		var finalLength = this.getLength();
		//remap easepoints, as length of path has changed
		var lengthRatio = finalLength / origLength;
		this.easePoints = this.easePoints.map(function(e){
			return e / lengthRatio;
		});
	};

	Path.prototype.addEasepoint = function(pos){
		//console.log(this.easePoints, pos);
		this.easePoints.push(pos);
	};

	Path.factory = function(svg, name, parsed, easePoints) {
		return new Path(svg, name, parsed, easePoints);
	};

	return Path;

}));



},{"raphael":"raphael"}],8:[function(require,module,exports){
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/PathEasepoints'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    ns[name] = module.exports = factory(require('jquery'), require('lodash'), require('raphael'));
  	} else {
		ns[name] = factory(root.jQuery, root._, root.Raphael);
	}
}(this, function ($, _, Raphael) {
	"use strict";

	var GET_DEFAULTS = false;

	var degToRad = Math.PI / 180;
	var radToDeg = 180 / Math.PI;
	var toRadians = function(degrees) {
	  return degrees * degToRad;
	};	 
	// Converts from radians to degrees.
	var toDegrees = function(radians) {
	  return radians * radToDeg;
	};


	var distanceTreshold = 40;
	var angleTreshold = toRadians(12);

	var layer;

	//helper
	var showPoint = function(point, color, size){
		var el = layer.add('circle', point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	var show = function(pathDef) {
		var path = pathDef.getSVGString();			
		var el = layer.add('path', path);
		el.attr({"stroke-width": 3, stroke: '#000000'});/**/
		return el;
	};

	var findDefaults = function(pathDef){
		var pathStr = pathDef.getSVGString();
		var length = pathDef.getLength();
		var pointPos = [];
		
		
		var precision = 1;
		var prev;
		var allPoints = [];
		for(var i=precision; i<=length; i += precision) {
			//var pathPart = Raphael.getSubpath(pathStr, 0, i);
			var p = Raphael.getPointAtLength(pathStr, i);
			
			//it seems that Raphael's alpha is inconsistent... sometimes over 360
			var alpha = Math.abs( Math.asin( Math.sin(toRadians(p.alpha)) ));
			if(prev) {
				p.diff = Math.abs(alpha - prev);
			} else {
				p.diff = 0;
			}
			prev = alpha;
			//console.log(p.diff);

			if(p.diff > angleTreshold) {
				//console.log(i);
				pointPos.push(i);
			}

			//p.computedAlpha = alpha;
			//allPoints.push(p);

		}/**/

		 /*
		//DEBUG 
		//find max curvature that is not a cusp (treshold determines cusp)
		var cuspTreshold = 40;
		var max = allPoints.reduce(function(m, p){
			return p.diff > m && p.diff < cuspTreshold ? p.diff : m;
		}, 0);
		console.log(max);

		var prev = [0,0,0,0];
		allPoints.forEach(function(p){
			var r = Math.round((p.diff / max) * 255);
			var g = 255 - Math.round((p.diff / max) * 255);
			var rgb = 'rgb('+r+','+g+',0)';
			if(r>100) {
				console.log('==========');
				prev.forEach(function(p){console.log(p.computedAlpha, p.alpha);});
				console.log(p.computedAlpha, p.alpha, rgb);
			}
			p.y += 150;
			showPoint(p, rgb, 0.5);
			prev[3] = prev[2];
			prev[2] = prev[1];
			prev[1] = prev[0];
			prev[0] = p;
		});
		/**/

		//finds groups of points depending on treshold, and find the middle of each group
		return pointPos.reduce(function(points, point){

			var last = points[points.length-1];
			if(!last || point - last[last.length-1] > distanceTreshold){
				last = [point];
				points.push(last);
			} else {
				last.push(point);
			}

			return points;
		}, []).map(function(points){
			return points[Math.floor(points.length/2)];
		});
		
	};

	var allPoints = [];
	var easePoints = {};

	var current;

	var getEasepoints = function(letter, pathIdx, pathDef){
		
		var path = show(pathDef);

		//are ease points already set for this path?
		var pathEasePoints = pathDef.getEasepoints(); 
		if(pathEasePoints.length === 0 && GET_DEFAULTS) {
			pathEasePoints = findDefaults(pathDef);
		}

		//console.log(easePoints);
		var length = pathDef.getLength();
		var pathStr = pathDef.getSVGString();
		

		var inactiveColor = '#00ff00';
		var activeColor = '#ff2200';

		var addPoint = function(pos){
			if(pos < 1) pos = pos * length;//si en prc
			var pObj = Raphael.getPointAtLength(pathStr, pos);
			var point = showPoint(pObj, inactiveColor, 3);
			//console.log(pathIdx);
			point.data('pos', pos);
			point.data('letter', letter);
			point.data('pathIdx', pathIdx);
			point.data('pathLength', length);
			point.data('x', pObj.x);
			point.data('y', pObj.y);

			allPoints.push(point);

			point.click(function(){
				
				allPoints.forEach(function(p){
					p.attr({fill: inactiveColor});
				});

				point.attr({fill: activeColor});

				current = {
					point: point,
					path: path,
					pathDef: pathDef,
					svg : pathStr,
					letter : letter,
					pathIdx : pathIdx
				};

			});
		};

		pathEasePoints.forEach(addPoint);/**/

		path.click(function(){
			//console.log('add');
			addPoint(0);
		});
		

		return pathEasePoints;

	};

	var moveCurrent = function(dist) {
		var p = current.point;
		var pos = p.data('pos');
		pos += dist;
		var max = current.pathDef.getLength();
		if(pos < 0) pos = 0;
		if(pos > max) pos = max;
		p.data('pos', pos);

		var pObj = Raphael.getPointAtLength(current.svg, pos);

		var x = p.data('x');
		var y = p.data('y');
		var deltaX = pObj.x - x;
		var deltaY = pObj.y - y;

		/*p.data('x', pObj.x);
		p.data('y', pObj.y);/**/

		p.transform('t' + deltaX + ',' + deltaY);
		printJSON();

	};


	$(window).on('keydown.ease', function(e){
		//console.log(e.which, current);
		var LEFT = 37;
		var UP = 38;
		var RIGHT = 39;
		var DOWN = 40;
		var DEL = 46;

		if(current) {
			switch(e.which) {
				case LEFT:
					e.preventDefault();
					moveCurrent(-1);
					break;
				case DOWN:
					e.preventDefault();
					moveCurrent(-10);
					break;
				case RIGHT:
					e.preventDefault();
					moveCurrent(1);
					break;
				case UP:
					e.preventDefault();
					moveCurrent(10);
					break;
				case DEL:
					e.preventDefault();
					var idx = allPoints.indexOf(current.point);
					//console.log(idx);
					current.point.remove();
					allPoints.splice(idx, 1);
					//console.log(allPoints);
					current = null;
					printJSON();
					break;

			}

		}

	});

	var printNode;
	var printJSON = function() {
		var json = allPoints.reduce(function(json, point){

			var letter = point.data('letter');
			var pathIdx = point.data('pathIdx');
			var l = point.data('pathLength');

			var paths = json[letter] = json[letter] || [];
			var easepoints = paths[pathIdx] = paths[pathIdx] || [];
			easepoints.push(point.data('pos') / l);
			easepoints.sort(function(a, b){
				return a - b;
			});
			return json;
		}, {});
		printNode.text(JSON.stringify(json));
	};

	return function(stage, groups, node){
		layer = stage.getNewLayer();
		var pad = 20;
		var availW = stage.width() - pad;

		var groupMaxHeight = Object.keys(groups).reduce(function(min, groupName){
			var t = groups[groupName].getHeight();
			if(min === undefined || t > min) {
				min = t;
			}
			return min;
		}, undefined);
		
		var topLeft = {x:pad, y:pad};
		Object.keys(groups).forEach(function(name){
			var group = groups[name];
			//console.log(group);
			var endLeft = topLeft.x + group.getWidth() + pad;

			if(endLeft > availW) {
				topLeft.x = pad;
				topLeft.y += pad + groupMaxHeight;
				endLeft = topLeft.x + group.getWidth() + pad;
			}


			var thisEase = group.paths.map(function(p, idx){
				p = p.translate(topLeft.x, topLeft.y);
				return getEasepoints(name, idx, p);
			});


			topLeft.x = endLeft;			

		});
		//console.log(easePoints);

		printNode = node;
		printJSON();
	};

	
}));



},{"jquery":"jquery","lodash":"lodash","raphael":"raphael"}],9:[function(require,module,exports){
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/PathGroup'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    ns[name] = module.exports = factory();
  	} else {
		ns[name] = factory();
	}
}(this, function () {
	"use strict";

	var PathGroup = function(name){
		this.name = name;
	};

	PathGroup.prototype.setBounding = function(){
		this.bounding = this.paths.reduce(function(bounding, path){
			var pathBounding = path.getBounding();

			bounding = bounding || pathBounding;
			bounding.x = bounding.x < pathBounding.x ? bounding.x :  pathBounding.x;
			bounding.y = bounding.y < pathBounding.y ? bounding.y :  pathBounding.y;
			bounding.x2 = bounding.x2 > pathBounding.x2 ? bounding.x2 : pathBounding.x2;
			bounding.y2 = bounding.y2 > pathBounding.y2 ? bounding.y2 : pathBounding.y2;
			bounding.width = bounding.x2 - bounding.x;
			bounding.height = bounding.y2 - bounding.y;
			return bounding;
		}, undefined) || {};
		//if there's a endPoint point that is set, use its coordinates as bounding
		if(this.endPoint) {
			var anchors = this.endPoint.getPoint(0);
			this.bounding.x2 = anchors[0];
			this.bounding.width = this.bounding.x2 - this.bounding.x;
		}
		if(this.startPoint) {
			var anchors = this.startPoint.getPoint(0);
			this.bounding.x = anchors[0];
			this.bounding.width = this.bounding.x2 - this.bounding.x;
		}
	};

	PathGroup.prototype.addPath = function(p){
		this.paths = this.paths || [];
		if(p.name && p.name.indexOf('end') === 0) {
			this.endPoint = p;
		} else if(p.name && p.name.indexOf('start') === 0) {
			this.startPoint = p;
		} else {
			this.paths.push(p);
		}
		this.setBounding();
	};

	PathGroup.prototype.getHeight = function(){
		return this.bounding.height;
	};

	PathGroup.prototype.getWidth = function(){
		return this.bounding.width;
	};
	PathGroup.prototype.getBotton = function(){
		return this.bounding.y2;
	};
	PathGroup.prototype.getTop = function(){
		return this.bounding.y;
	};
	PathGroup.prototype.getLeft = function(){
		return this.bounding.x;
	};
	PathGroup.prototype.getRight = function(){
		return this.bounding.x2;
	};
	PathGroup.prototype.getBounding = function(){
		return this.bounding;
	};

	PathGroup.prototype.setOffset = function(x, y){
		this.paths = this.paths.map(function(path) {
			//console.log(path.parsed[0].anchors[1]);
			path = path.translate(x, y);
			//console.log(path.parsed[0].anchors[1]);
			return path;
		});
		this.endPoint = (this.endPoint && this.endPoint.translate(x, y));
		this.startPoint = (this.startPoint && this.startPoint.translate(x, y));
		this.setBounding();
	};

	//returns a new PathGroup, scaled
	PathGroup.prototype.scale = function(scale){
		if(!this.paths) return this;
		var scaled = new PathGroup(this.name);
		this.paths.forEach(function(path){
			scaled.addPath(path.scale(scale));
		});

		scaled.endPoint = (this.endPoint && this.endPoint.scale(scale));
		scaled.startPoint = (this.startPoint && this.startPoint.scale(scale));
		scaled.setBounding();
		return scaled;
	};

	PathGroup.prototype.getPaths = function(){
		return this.paths;
	};

	PathGroup.factory = function(){
		return new PathGroup();
	};

	return PathGroup;

}));



},{}],10:[function(require,module,exports){
(function (root, factory) {
	var nsParts = 'lagrange/drawing/Drawing'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('jquery'), require('lodash'), require('raphael'));
  	} else {
		ns[name] = factory(root.jQuery, root._, root.Raphael);
	}
}(this, function ($, _, Raphael) {

	//helper
	var showPoint = function(stage, point, color, size){
		var el = stage.circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	//layer is an extension of Raphael's set that is linked to a stage, so that you can add directly to it instead of havong to have acces to both the stage and the set.
	var Layer = function(paper) {

		this.add = function() {
			var args = arguments;
			var fcn = Array.prototype.shift.call(args);
			if(!paper[fcn]) throw new Error(fcn + ' does not exist on Raphael');
			
			var el = paper[fcn].apply(paper, args);
			this.push(el);
			return el;
		};

		this.remove = function(el) {
			if(!el) return;
			el.remove();
			this.exclude(el);
		};

		this.showPoint = function(point, color, size){
			var el = showPoint(paper, point, color, size);
			this.push(el);
		};

		this.clearAndRemoveAll = function(){
			var e;
			while(e = this.pop()){
				e.remove();
			}
		};

	};

	var Stage = function(name){

		//le stage est un element contenu dans le container, pour pouvoir le resizer responsive
		var container = $('#'+name);
		var paperName = name+'Paper';
		container.append('<div id="'+paperName+'"></div>');

		var width = container.width();
		var height = container.height();
		var paper = Raphael(paperName, width, height);

		var resizeNotifier = $.Deferred();
		this.onResize = resizeNotifier.promise();

		var onResize = function(){
			width = container.width();
			height = container.height();
			paper.setSize(width, height);
			resizeNotifier.notify({w:width, h:height});
		};

		$(window).on('resize.stage', onResize);


		this.width = function(){
			return width;
		};
		this.height = function(){
			return height;
		};

		this.showPoint = function(point, color, size){
			return showPoint(paper, point, color, size);
		};

		this.getNewLayer = function() {
			var layer = paper.set();
			layer = _.extend(layer, new Layer(paper));
			return layer;
		};

	};

	var getStage = (function(){
		var stages = {};
		var init = function(name){
			return new Stage(name);
		};
		return function(name){
			return stages[name] = stages[name] || init(name);
		}
	})();
	

	return {
		getStage : getStage,
		showPoint : showPoint
	};
}));
},{"jquery":"jquery","lodash":"lodash","raphael":"raphael"}],11:[function(require,module,exports){
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/VectorWord'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('./PathGroup'));
  	} else {
		ns[name] = factory(lagrange.drawing.PathGroup);
	}
}(this, function (PathGroup) {
	"use strict";

	
	var VectorWord = {

		getPaths : function(alphabet, text) {
			var right = 0;
			var lines = new PathGroup(text);
			var continuous = false;

			//loop for every character in name (string)
			for(var i=0; i<text.length; i++) {
				var letter = text[i];

				if(letter === ' ') {
					right += alphabet.getNSpace();
					continuous = false;
					continue;
				}
				var letterDef = alphabet.getSymbol(letter) || alphabet.getSymbol('-');
				//console.log(letter, letterDef);


				
				var letterJoinedEnd = false;
				letterDef.paths.forEach(function(path) {
					var def = path.translate(right, 0);
					var joinedStart = def.name && def.name.indexOf('joina') > -1;
					var joinedEnd = /join(a?)b/.test(def.name);
					//console.log(letter, joinedStart, joinedEnd);
					letterJoinedEnd = letterJoinedEnd || joinedEnd;
					if(joinedStart && continuous) {
						//append au continuous
						continuous.append(def, letter);

						//ajoute les easepoints de ce path
						var totalLength = continuous.getLength();
						var pathStartPos = totalLength - def.getLength();
						def.getEasepoints().forEach(function(pos){
							continuous.addEasepoint((pathStartPos + pos) / totalLength);
						});

					} else if(joinedEnd && !continuous) {
						//start un nouveau line (clone en scalant de 1)
						continuous = def.clone();
						continuous.name = letter;
						lines.addPath(continuous);
					} else {
						lines.addPath(def);
					}

					if(!letterJoinedEnd) {
						continuous = false;
					}

				});
				
				right += letterDef.getWidth();
				//console.table([{letter:name[i], letterWidth: letter.getWidth(), total:right}]);	
			}
			//console.log(lines.getBounding());

			var b = lines.getBounding();
			lines.setOffset(-b.x, -b.y);
			
			return lines;

		}
	};

	return VectorWord;
	
}));



},{"./PathGroup":9}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvRGVjb3JhdGl2ZUxpbmVzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL0V4YW1wbGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvV3JpdGVOYW1lcy5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvU3RhZ2UuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnRGVjb3JhdGl2ZUxpbmVzJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvQWxwaGFiZXQnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5BbHBoYWJldCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKEFscGhhYmV0KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBMaW5lcyA9IHtcblx0XHRzY2FsZSA6IDEsXG5cdFx0c3ZnRmlsZSA6ICdhc3NldHMvbGlnbmVzLnN2ZycsXG5cdFx0ZWFzZXBvaW50cyA6IHtcImZvbGllXCI6W1swLjI2NDM4NjAwMjU4MDY3MTFdXSxcIndvcmREZWNvcmF0aW9uRW5kXCI6W1swLjYxNDA0NjIzNTc4MzUxOTVdXSxcImRlY2VtYnJlXCI6W1swLjU3OTYyOTM4MjAyOTUzMjVdXSxcIm5vdXZlbGxlc1wiOltbMC4yNTIwNzM5MjcxNDY3MTcyLDAuNjY4OTY1NDIyMDQzMjExMV1dfVxuXHR9O1xuXG5cdHJldHVybiBBbHBoYWJldC5mYWN0b3J5KExpbmVzKTtcblx0XG59KSk7IiwiXHRcblx0dmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblx0dmFyIFBhdGhFYXNlcG9pbnRzID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzJyk7LyoqL1xuXHRcblx0dmFyIFdyaXRlTmFtZXMgPSByZXF1aXJlKCcuL1dyaXRlTmFtZXMnKTtcblx0dmFyIFN0YWdlID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1N0YWdlJyk7XG5cblxuXG5cdHZhciBkb2NSZWFkeSA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBkID0gJC5EZWZlcnJlZCgpO1xuXG5cdFx0JChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcblx0XHRcdGQucmVzb2x2ZSgpXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZC5wcm9taXNlKCk7XG5cblx0fSkoKTtcblxuXHR2YXIgcmVhZHkgPSAkLndoZW4oZG9jUmVhZHksIFdyaXRlTmFtZXMubG9hZCgpKTtcblxuXHR2YXIgZG9EcmF3ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgY29udGFpbmVyID0gJCgnI3N2ZycpO1xuXG5cdFx0dmFyIHdvcmRzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHR0ZXh0IDogJ0hlbGxvJyxcblx0XHRcdFx0c2l6ZSA6IDFcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHRleHQgOiAnTW9udHLDqWFsJyxcblx0XHRcdFx0c2l6ZSA6IDEuMixcblx0XHRcdFx0YXBwZW5kIDogZnVuY3Rpb24oRGVjb3JhdGl2ZUxpbmVzKXtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0c3ltYm9sOiBEZWNvcmF0aXZlTGluZXMuZ2V0U3ltYm9sKCd3b3JkRGVjb3JhdGlvbkVuZCcpLmdldFBhdGhzKClbMF0sXG5cdFx0XHRcdFx0XHRzaXplOiAxIC8vaGVpZ2h0IGluIGVtXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdF07XG5cblxuXHRcdHZhciBzdGFnZSA9IFN0YWdlLmdldFN0YWdlKCdzdmcnKTtcblx0XHR2YXIgdGwgPSBXcml0ZU5hbWVzLmdldFRpbWVsaW5lKHdvcmRzLCBzdGFnZSk7XG5cdFx0dGwucGxheSgpO1xuXHR9O1xuXG5cblxuXHR2YXIgYnRuID0gJCgnI2N0cmwnKTtcblxuXHRidG4ub24oJ2NsaWNrLmFscGhhYmV0JywgZnVuY3Rpb24oKXtcblx0XHRyZWFkeS50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG5cblx0Ly9wYXJzZSBsZXMgZWFzZXBvaW50cyBkZSBjaGFxdWUgbGV0dHJlLCBvdXRwdXQgZW4gSlNPTiAow6Agc2F2ZXIpXG5cdHZhciBwcmludEVhc2Vwb2ludHMgPSBmdW5jdGlvbigpe1xuXHRcdC8vRW1pbGllRm9udFxuXHRcdC8vRGVjb3JhdGl2ZUxpbmVzXG5cblx0XHR2YXIgRW1pbGllRm9udCA9IHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzJyk7XG5cdFx0dmFyIERlY29yYXRpdmVMaW5lcyA9IHJlcXVpcmUoJy4vRGVjb3JhdGl2ZUxpbmVzJyk7XG5cdFx0UGF0aEVhc2Vwb2ludHMoU3RhZ2UuZ2V0U3RhZ2UoJ3N2ZycpLCBFbWlsaWVGb250LmdldEFsbCgpLCAkKCcjYnJwJykpO1xuXHR9O1xuXG5cdHZhciBnZXRCcHIgPSAkKCcjZ2V0YnJwJyk7XG5cblx0Z2V0QnByLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0cmVhZHkudGhlbihwcmludEVhc2Vwb2ludHMpO1xuXHR9KTtcblxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvYW5pbWF0aW9ucy9Xcml0ZU5hbWVzJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShcblx0ICAgIFx0cmVxdWlyZSgnanF1ZXJ5JyksXG5cdCAgICBcdHJlcXVpcmUoJ2xvZGFzaCcpLFxuXHQgICAgXHRyZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udC5qcycpLFxuXHQgICAgXHRyZXF1aXJlKCcuL0RlY29yYXRpdmVMaW5lcycpLFxuXHQgICAgXHRyZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGgnKSxcblx0ICAgIFx0cmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQnKSxcblx0ICAgIFx0cmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cCcpLFxuXHQgICAgXHRyZXF1aXJlKCdyYXBoYWVsJyksXG5cdCAgICBcdHJlcXVpcmUoJ2dzYXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5qUXVlcnksIHJvb3QuXyk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIF8sIEVtaWxpZUZvbnQsIERlY29yYXRpdmVMaW5lcywgRHJhd1BhdGgsIFZlY3RvcldvcmQsIFBhdGhHcm91cCwgUmFwaGFlbCwgVHdlZW5NYXgpIHtcblxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgZGVmYXVsdFNldHRpbmdzID0ge1xuXHRcdGNvbG9yOiAnIzQ0NDQ0NCcsXG5cdFx0c3Ryb2tlOiAyLFxuXHRcdGxpbmVIZWlnaHQ6IDEuMixcblx0XHRzcGVlZDogMjUwIC8vcHggcGVyIHNlY29uZFxuXHR9O1xuXG5cdHZhciBnZXRBcHBlbmQgPSBmdW5jdGlvbihwYXRocywgYXBwZW5kKXtcblx0XHR2YXIgY3VydmUgPSBhcHBlbmQuc3ltYm9sO1xuXHRcdFxuXHRcdC8vdHJvdXZlIGxlcyBwb2ludHMgZGUgZMOpcGFydCBldCBkJ2Fycml2w6llIGRlIGxhIGN1cnZlXG5cdFx0dmFyIGN1cnZlU3RyID0gY3VydmUuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0dmFyIHN0YXJ0UG9zID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGN1cnZlU3RyLCAwKTtcblx0XHR2YXIgZW5kUG9zID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGN1cnZlU3RyLCBjdXJ2ZS5nZXRMZW5ndGgoKSk7XG5cblx0XHR2YXIgd29yZFBhdGhzID0gcGF0aHMuZ2V0UGF0aHMoKTtcblx0XHQvL3Ryb3V2ZSBsZSBwYXRoIHF1aSBmaW5pdCBsZSBwbHVzIMOgIGRyb2l0ZSBkYW5zIGxlcyBsZXR0cmVzXG5cdFx0dmFyIGxhc3RQYXRoID0gd29yZFBhdGhzLnJlZHVjZShmdW5jdGlvbihsYXN0LCBjdXIpe1xuXHRcdFx0aWYoIWxhc3QpIHJldHVybiBjdXI7XG5cdFx0XHQvL3NpIGxlIHBhdGggc2UgZmluaXQgcGx1cyDDoCBkcm9pdGUgRVQgcXUnaWwgYSB1biBub20gKGxlcyBkw6l0YWlscyBnZW5yZSBiYXJyZSBkdSB0IGV0IHBvaW50IGRlIGkgbidvbnQgcGFzIGRlIG5vbSlcblx0XHRcdGlmKGN1ci5uYW1lICYmIGxhc3QuZ2V0Qm91bmRpbmcoKS54MiA8IGN1ci5nZXRCb3VuZGluZygpLngyKXtcblx0XHRcdFx0bGFzdCA9IGN1cjtcblx0XHRcdH1cblx0XHRcdHJldHVybiBsYXN0O1xuXHRcdH0sIG51bGwpO1xuXG5cdFx0dmFyIHdvcmRFbmRQb3MgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgobGFzdFBhdGguZ2V0U1ZHU3RyaW5nKCksIGxhc3RQYXRoLmdldExlbmd0aCgpKTtcblxuXHRcdC8vcG9zaXRpb24gYWJzb2x1ZSBkdSBwb2ludCBkZSBkw6lwYXJ0IGR1IHBhdGhcblx0XHR2YXIgYWJzU3RhcnRQb3MgPSB7XG5cdFx0XHR4OiB3b3JkRW5kUG9zLnggLSBzdGFydFBvcy54LFxuXHRcdFx0eTogd29yZEVuZFBvcy55IC0gc3RhcnRQb3MueVxuXHRcdH07XG5cblx0XHQvKnNob3dQb2ludCh7eDp3b3JkRW5kUG9zLnh4LCB5OndvcmRFbmRQb3MueX0sICcjMjJmZjAwJyk7XG5cdFx0c2hvd1BvaW50KGFic1N0YXJ0UG9zLCAnI2ZmMDAwMCcpOy8qKi9cblxuXHRcdC8vw6AgY29tYmllbiBkZSBkaXN0YW5jZSBsZSBib3V0ZSBlc3QgZHUgZMOpYnV0XG5cdFx0dmFyIHJlbEVuZFBvcyA9IHtcblx0XHRcdHg6IGVuZFBvcy54IC0gc3RhcnRQb3MueCxcblx0XHRcdHk6IGVuZFBvcy55IC0gc3RhcnRQb3MueVxuXHRcdH07XG5cblx0XHQvL8OgIHF1ZWwgZW5kcm9pdCBvbiBkb2l0IGZhaXJlIGFycml2ZXIgbGUgZW5kcG9zLCByZWxhdGlmIGF1IGTDqWJ1dCBkdSBwYXRoXG5cdFx0dmFyIHRhcmdldFJlbEVuZFBvcyA9IHtcblx0XHRcdHg6IC0gd29yZEVuZFBvcy54LFxuXHRcdFx0eTogYXBwZW5kLnNpemUgKiBFbWlsaWVGb250LmdldFVwcGVyTGluZUhlaWdodCgpXG5cdFx0fTtcblxuXHRcdHZhciByYXRpbyA9IHtcblx0XHRcdHggOiB0YXJnZXRSZWxFbmRQb3MueCAvIHJlbEVuZFBvcy54LFxuXHRcdFx0eSA6IHRhcmdldFJlbEVuZFBvcy55IC8gcmVsRW5kUG9zLnksXG5cdFx0fTtcblx0XHQvKmNvbnNvbGUubG9nKCdzdGFydCBhdCcsYWJzU3RhcnRQb3MpO1xuXHRcdGNvbnNvbGUubG9nKHRhcmdldFJlbEVuZFBvcyk7XG5cdFx0Y29uc29sZS5sb2cocmF0aW8sIGN1cnJlbnRFbmRQb3MpOyoqL1xuXG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0uc2NhbGUocmF0aW8ueCwgcmF0aW8ueSwgYWJzU3RhcnRQb3MueCtzdGFydFBvcy54LCBhYnNTdGFydFBvcy55KTtcblx0XHRtLnRyYW5zbGF0ZShhYnNTdGFydFBvcy54LCBhYnNTdGFydFBvcy55KTtcblx0XHRjdXJ2ZSA9IGN1cnZlLmFwcGx5TWF0cml4KG0pO1xuXG5cdFx0bGFzdFBhdGguYXBwZW5kKGN1cnZlKTtcblxuXHRcdHJldHVybiBwYXRocztcblxuXHR9O1xuXHRcblx0dmFyIGdldFdvcmRzID0gZnVuY3Rpb24od29yZHMsIGxpbmVIZWlnaHQpIHtcblx0XHR2YXIgdG9wID0gMDtcblx0XHRyZXR1cm4gd29yZHMubWFwKGZ1bmN0aW9uKHdvcmQsIGxpbmVOdW0pe1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBWZWN0b3JXb3JkLmdldFBhdGhzKEVtaWxpZUZvbnQsIHdvcmQudGV4dCk7XG5cdFx0XHRwYXRocyA9IHBhdGhzLnNjYWxlKHdvcmQuc2l6ZSk7XG5cblx0XHRcdC8vY2VudGVyIHRleHRcblx0XHRcdHZhciB3aWR0aCA9IHBhdGhzLmdldFdpZHRoKCk7XG5cdFx0XHR2YXIgbGVmdCA9IC0gd2lkdGggLyAyO1xuXG5cdFx0XHRwYXRocy5zZXRPZmZzZXQobGVmdCwgdG9wKTtcblx0XHRcdFxuXHRcdFx0dG9wICs9IEVtaWxpZUZvbnQuZ2V0VXBwZXJMaW5lSGVpZ2h0KCkgKiBsaW5lSGVpZ2h0O1xuXG5cdFx0XHQvL2Fqb3V0ZSBsZSBndWlkaSBzdXIgbGUgZGVybmllciBtb3Rcblx0XHRcdGlmKHdvcmQuYXBwZW5kKSB7XG5cdFx0XHRcdHBhdGhzID0gZ2V0QXBwZW5kKHBhdGhzLCB3b3JkLmFwcGVuZChEZWNvcmF0aXZlTGluZXMpKTtcblx0XHRcdH1cblxuXHRcdFx0d29yZC5wYXRocyA9IHBhdGhzO1xuXG5cdFx0XHRyZXR1cm4gd29yZDtcblxuXHRcdH0pO1xuXHR9O1xuXG5cblx0Ly90cm91dmUgbGUgYm91bmRpbmcgYm94IGRlIGwnZW5zZW1ibGUgZGVzIHBhdGhzLCBzJ2VuIHNlcnZpcmEgcG91ciBzJ2Fzc3VyZXIgcXVlIMOnYSBlbnRyZSB0b3Vqb3VycyBkYW5zIGxlIHN0YWdlXG5cdHZhciBnZXRCb3VuZGluZyA9IGZ1bmN0aW9uKHdvcmRzKXtcblx0XHRyZXR1cm4gd29yZHMucmVkdWNlKGZ1bmN0aW9uKGcsIHcpe1xuXHRcdFx0dy5wYXRocy5nZXRQYXRocygpLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHRcdGcuYWRkUGF0aChwKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGc7XG5cdFx0fSwgUGF0aEdyb3VwLmZhY3RvcnkoKSkuZ2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHRyZXR1cm4ge1xuXHRcdGdldFRpbWVsaW5lIDogZnVuY3Rpb24od29yZHMsIHN0YWdlLCBzZXR0aW5ncykge1xuXHRcdFx0c2V0dGluZ3MgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdFNldHRpbmdzLCBzZXR0aW5ncyk7XG5cdFx0XHR3b3JkcyA9IGdldFdvcmRzKHdvcmRzLCBzZXR0aW5ncy5saW5lSGVpZ2h0KTtcblx0XHRcdHZhciBib3VuZGluZyA9IGdldEJvdW5kaW5nKHdvcmRzKTtcblxuXHRcdFx0dmFyIGxheWVyID0gc3RhZ2UuZ2V0TmV3TGF5ZXIoKTtcblxuXHRcdFx0LypsYXllci5zaG93UG9pbnQoe3g6Ym91bmRpbmcueCwgeTpib3VuZGluZy55fSk7XG5cdFx0XHRsYXllci5zaG93UG9pbnQoe3g6Ym91bmRpbmcueDIsIHk6Ym91bmRpbmcueTJ9KTsvKiovXG5cdFx0XHQvL2NvbnNvbGUubG9nKGJvdW5kaW5nKTtcblxuXHRcdFx0dmFyIHJlc2l6ZVNldCA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgcGFkZGluZyA9IDAuMTsvLyVcblx0XHRcdFx0dmFyIFcgPSAwLCBIID0gMDtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Ly9pZihzdGFnZS53aWR0aCA9PT0gVyAmJiBzdGFnZS5oZWlnaHQgPT09IEgpICByZXR1cm47XG5cblx0XHRcdFx0XHRXID0gc3RhZ2Uud2lkdGgoKSAqICgxLXBhZGRpbmcpO1xuXHRcdFx0XHRcdEggPSBzdGFnZS5oZWlnaHQoKSAqICgxLXBhZGRpbmcpO1xuXG5cdFx0XHRcdFx0dmFyIHNjYWxlID0gVyAvIGJvdW5kaW5nLndpZHRoO1xuXHRcdFx0XHRcdHZhciB0YXJnZXRIID0gYm91bmRpbmcuaGVpZ2h0ICogc2NhbGU7XG5cdFx0XHRcdFx0aWYodGFyZ2V0SCA+IEgpe1xuXHRcdFx0XHRcdFx0c2NhbGUgPSBIIC8gYm91bmRpbmcuaGVpZ2h0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHR2YXIgdGFyZ2V0TGVmdCA9IChzdGFnZS53aWR0aCgpICogcGFkZGluZyAqIDAuNSkgKyAoKFcgLSBib3VuZGluZy53aWR0aCkgLyAyKSAtIGJvdW5kaW5nLng7XG5cdFx0XHRcdFx0dmFyIHRhcmdldFRvcCA9IC0oc3RhZ2UuaGVpZ2h0KCkgKiBwYWRkaW5nICogMC41KSArIChzdGFnZS5oZWlnaHQoKSAtICggYm91bmRpbmcueSArIChib3VuZGluZy5oZWlnaHQqc2NhbGUvKiovKSkpO1xuXHRcdFx0XHRcdGxheWVyLnRyYW5zZm9ybSgndCcrdGFyZ2V0TGVmdCsnLCcrdGFyZ2V0VG9wKydzJytzY2FsZSsnLCcrc2NhbGUrJywwLDAnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSkoKTtcblxuXHRcdFx0c3RhZ2Uub25SZXNpemUucHJvZ3Jlc3MocmVzaXplU2V0KTtcblxuXHRcdFx0dmFyIHRsID0gd29yZHMucmVkdWNlKGZ1bmN0aW9uKHRsLCB3b3JkLCBsaW5lTnVtKXtcblx0XHRcdFx0cmV0dXJuIERyYXdQYXRoLmdyb3VwKHdvcmQucGF0aHMuZ2V0UGF0aHMoKSwgbGF5ZXIsIHtcblx0XHRcdFx0XHRweFBlclNlY29uZCA6IHNldHRpbmdzLnNwZWVkICogd29yZC5zaXplLFxuXHRcdFx0XHRcdGNvbG9yIDogc2V0dGluZ3MuY29sb3IsXG5cdFx0XHRcdFx0c3Ryb2tlV2lkdGggOiBzZXR0aW5ncy5zdHJva2UsXG5cdFx0XHRcdFx0ZWFzaW5nIDogZ3NhcC5TaW5lLmVhc2VJbk91dFxuXHRcdFx0XHR9LCB0bCk7XG5cdFx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7cGF1c2VkOnRydWUsIG9uVXBkYXRlOiByZXNpemVTZXR9KSk7XG5cdFx0XHRcblx0XHRcdHJldHVybiB0bDtcblxuXHRcdH0sXG5cblx0XHRsb2FkIDogZnVuY3Rpb24oKXtcblx0XHRcdGNvbnNvbGUubG9nKERlY29yYXRpdmVMaW5lcyk7XG5cdFx0XHRjb25zb2xlLmxvZyhFbWlsaWVGb250KTtcblx0XHRcdHJldHVybiAkLndoZW4oRW1pbGllRm9udC5sb2FkKCksIERlY29yYXRpdmVMaW5lcy5sb2FkKCkpO1xuXHRcdH1cblx0fTtcblxufSkpOyIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnLi9QYXRoJyksIHJlcXVpcmUoJy4vUGF0aEdyb3VwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aCwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGhHcm91cCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIFBhdGgsIFBhdGhHcm91cCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXG5cdHZhciBzcGVjaWFsQ2hhcnMgPSB7XG5cdFx0J194MkRfJyA6ICctJyxcblx0XHQnX3gyRV8nIDogJy4nXG5cdH07XG5cblx0dmFyIEFscGhhYmV0ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgc2V0dGluZ3M7XG5cdFx0dmFyIHN5bWJvbHMgPSB7fTtcblxuXG5cdFx0dmFyIHBhcnNlU1ZHID0gZnVuY3Rpb24oZGF0YSl7XG5cblx0XHRcdC8vY29uc29sZS5sb2coZGF0YSk7XG5cdFx0XHR2YXIgZG9jID0gJChkYXRhKTtcblx0XHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdFx0bGF5ZXJzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0XHR2YXIgbGF5ZXIgPSAkKGVsKTtcblx0XHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblx0XHRcdFx0aWQgPSBzcGVjaWFsQ2hhcnNbaWRdIHx8IGlkO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGlkKTtcblx0XHRcdFx0Ly9pZihpZC5sZW5ndGggPiAxKSByZXR1cm47XG5cdFx0XHRcdHZhciBwYXRocyA9IGxheWVyLmZpbmQoJ3BhdGgnKTtcblx0XHRcdFx0aWYocGF0aHMubGVuZ3RoPT09MCkgcmV0dXJuO1xuXG5cdFx0XHRcdHZhciBzeW1ib2wgPSBzeW1ib2xzW2lkXSA9IG5ldyBQYXRoR3JvdXAoaWQpO1xuXG5cdFx0XHRcdHBhdGhzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0XHRcdHZhciBwYXRoRWwgPSAkKGVsKTtcblx0XHRcdFx0XHR2YXIgcCA9IFBhdGguZmFjdG9yeSggcGF0aEVsLmF0dHIoJ2QnKSwgcGF0aEVsLmF0dHIoJ2lkJyksIG51bGwsIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdICYmIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdW2ldKS5zY2FsZShzZXR0aW5ncy5zY2FsZSB8fCAxKTtcdFx0XHRcdFxuXHRcdFx0XHRcdHN5bWJvbC5hZGRQYXRoKCBwICk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly90cm91dmUgbGUgdG9wIGFic29sdSAodG9wIGRlIGxhIGxldHRyZSBsYSBwbHVzIGhhdXRlKVxuXHRcdFx0dmFyIHRvcCA9IE9iamVjdC5rZXlzKHN5bWJvbHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIHN5bWJvbE5hbWUpe1xuXHRcdFx0XHR2YXIgdCA9IHN5bWJvbHNbc3ltYm9sTmFtZV0uZ2V0VG9wKCk7XG5cdFx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IHQpIHtcblx0XHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtaW47XG5cdFx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhzeW1ib2xzKTtcblxuXHRcdFx0Ly9hanVzdGUgbGUgYmFzZWxpbmUgZGUgY2hhcXVlIGxldHRyZVxuXHRcdFx0T2JqZWN0LmtleXMoc3ltYm9scykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0c3ltYm9sc1trZXldLnNldE9mZnNldCgtMSAqIHN5bWJvbHNba2V5XS5nZXRMZWZ0KCksIC0xICogdG9wKTtcblx0XHRcdH0pO1xuXG5cblx0XHR9O1xuXG5cdFx0dmFyIGRvTG9hZCA9IGZ1bmN0aW9uKGJhc2VQYXRoKXtcblx0XHRcdHZhciBsb2FkaW5nID0gJC5hamF4KHtcblx0XHRcdFx0dXJsIDogKChiYXNlUGF0aCAmJiBiYXNlUGF0aCsnLycpIHx8ICcnKSArIHNldHRpbmdzLnN2Z0ZpbGUsXG5cdFx0XHRcdGRhdGFUeXBlIDogJ3RleHQnXG5cdFx0XHR9KTtcblxuXHRcdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2Vycm9yIGxvYWQnKTtcblx0XHRcdFx0Y29uc29sZS5sb2coYik7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYS5yZXNwb25zZVRleHQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHRcdH07XG5cblx0XHRcblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbihzKSB7XG5cdFx0XHRzZXR0aW5ncyA9IHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXG5cdFx0dGhpcy5sb2FkID0gZnVuY3Rpb24oYmFzZVBhdGgpIHtcblx0XHRcdHJldHVybiBkb0xvYWQoYmFzZVBhdGgpO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXRTeW1ib2wgPSBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBzeW1ib2xzW2xdO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXROU3BhY2UgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRMb3dlckxpbmVIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0SGVpZ2h0KCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0VXBwZXJMaW5lSGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzeW1ib2xzWydOJ10gJiYgc3ltYm9sc1snTiddLmdldEhlaWdodCgpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3ltYm9scztcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0dmFyIGluc3RhbmNlcyA9IHt9O1xuXHRBbHBoYWJldC5mYWN0b3J5ID0gZnVuY3Rpb24oc2V0dGluZ3Mpe1xuXHRcdHZhciBzdmcgPSBzZXR0aW5ncy5zdmdGaWxlO1xuXHRcdGluc3RhbmNlc1tzdmddID0gaW5zdGFuY2VzW3N2Z10gfHwgKG5ldyBBbHBoYWJldCgpKS5pbml0KHNldHRpbmdzKTtcblx0XHRyZXR1cm4gaW5zdGFuY2VzW3N2Z107XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9EcmF3UGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpLCByZXF1aXJlKCdnc2FwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuXywgcm9vdC5SYXBoYWVsLCAocm9vdC5HcmVlblNvY2tHbG9iYWxzIHx8IHJvb3QpKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoXywgUmFwaGFlbCwgVHdlZW5NYXgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9nc2FwIGV4cG9ydHMgVHdlZW5NYXhcblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdGNvbG9yOiAnIzAwMDAwMCcsXG5cdFx0c3Ryb2tlV2lkdGggOiAwLjYsXG5cdFx0cHhQZXJTZWNvbmQgOiAxMDAsIC8vc3BlZWQgb2YgZHJhd2luZ1xuXHRcdGVhc2luZyA6IGdzYXAuUXVhZC5lYXNlSW5cblx0fTtcblxuXHQvL2hlbHBlclxuXG5cdHZhciBEcmF3UGF0aCA9IHtcblxuXHRcdHNpbmdsZSA6IGZ1bmN0aW9uKHBhdGgsIGxheWVyLCBwYXJhbXMpe1xuXHRcdFx0XG5cdFx0XHR2YXIgc2V0dGluZ3MgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cdFx0XHR2YXIgcGF0aFN0ciA9IHBhdGguZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gcGF0aC5nZXRMZW5ndGgoKTtcblxuXHRcdFx0dmFyIHB4UGVyU2Vjb25kID0gc2V0dGluZ3MucHhQZXJTZWNvbmQ7XG5cdFx0XHR2YXIgdGltZSA9IGxlbmd0aCAvIHB4UGVyU2Vjb25kO1xuXG5cdFx0XHR2YXIgYW5pbSA9IHtkaXN0YW5jZTogMH07XG5cdFx0XHRcblx0XHRcdHZhciB1cGRhdGUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygndXBkYXRlJyk7XG5cdFx0XHRcdHZhciBlbDtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0dmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGFuaW0uZGlzdGFuY2UpO1xuXHRcdFx0XHRcdGxheWVyLnJlbW92ZShlbCk7XG5cdFx0XHRcdFx0ZWwgPSBsYXllci5hZGQoJ3BhdGgnLCBwYXRoUGFydCk7XG5cdFx0XHRcdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc2V0dGluZ3Muc3Ryb2tlV2lkdGgsIHN0cm9rZTogc2V0dGluZ3MuY29sb3J9KTtcblx0XHRcdFx0fTtcblx0XHRcdH0pKCk7XG5cblx0XHRcdHZhciBlYXNlUG9pbnRzID0gcGF0aC5nZXRFYXNlcG9pbnRzKCk7XG5cdFx0XHQvKmNvbnNvbGUubG9nKGVhc2VQb2ludHMubGVuZ3RoKTtcblx0XHRcdGVhc2VQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb3Mpe1xuXHRcdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwb3MpO1xuXHRcdFx0XHRsYXllci5zaG93UG9pbnQocCwgJyNmZjAwMDAnLCAyKTtcblx0XHRcdH0pOy8qKi9cblxuXHRcdFx0dmFyIGxhc3QgPSAwO1xuXHRcdFx0cmV0dXJuIGVhc2VQb2ludHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBkaXN0KSB7XG5cdFx0XHRcdHZhciB0aW1lID0gKGRpc3QtbGFzdCkgLyBweFBlclNlY29uZDtcblx0XHRcdFx0bGFzdCA9IGRpc3Q7XG5cdFx0XHRcdHJldHVybiB0bC50byhhbmltLCB0aW1lLCB7ZGlzdGFuY2U6IGRpc3QsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHtcblx0XHRcdFx0b25VcGRhdGUgOiB1cGRhdGVcblx0XHRcdH0pKS50byhhbmltLCAoKGxlbmd0aCAtIChlYXNlUG9pbnRzLmxlbmd0aCAmJiBlYXNlUG9pbnRzW2Vhc2VQb2ludHMubGVuZ3RoLTFdKSkgLyBweFBlclNlY29uZCksIHtkaXN0YW5jZTogbGVuZ3RoLCBlYXNlIDogc2V0dGluZ3MuZWFzaW5nfSk7XG5cdFx0XHRcblx0XHR9LFxuXG5cdFx0Z3JvdXAgOiBmdW5jdGlvbihwYXRocywgbGF5ZXIsIHNldHRpbmdzLCB0bCkge1xuXHRcdFx0cmV0dXJuIHBhdGhzLnJlZHVjZShmdW5jdGlvbih0bCwgcGF0aCl7XG5cdFx0XHRcdHJldHVybiB0bC5hcHBlbmQoRHJhd1BhdGguc2luZ2xlKHBhdGgsIGxheWVyLCBzZXR0aW5ncykpO1xuXHRcdFx0fSwgdGwgfHwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe3BhdXNlZDp0cnVlfSkpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBEcmF3UGF0aDtcblx0XG59KSk7XG5cblxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi9BbHBoYWJldCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShsYWdyYW5nZS5kcmF3aW5nLkFscGhhYmV0KTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQWxwaGFiZXQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9vcmlnaW5hbCBzY2FsZSBmYWN0b3Jcblx0dmFyIEVtaWxpZUZvbnQgPSB7XG5cdFx0c2NhbGUgOiAxLFxuXHRcdHN2Z0ZpbGUgOiAnYXNzZXRzL2VtaWxpZUZvbnQuc3ZnJyxcblx0XHQvL1BBUlPDiSBhdmVjIGxlIGhlbHBlclxuXHRcdGVhc2Vwb2ludHMgOiB7XCLDlFwiOltudWxsLFswLjU1ODQ5MTQ5MTk3NjE4MjRdXSxcIsOPXCI6W1swLjI5MDE2MzU0OTYzNjEzODU1XV0sXCLDjlwiOltbMC4yOTY1NDA3NzA1MDcyNjI1XSxbMC41NDY3ODE1MDQ1NjA5ODc3XV0sXCLDi1wiOltbMC41MDc3MDk2Nzg4NjA0NTQ5XV0sXCLDilwiOltbMC41MDc3MDk2Nzg4NjA0NTQ5XSxbMC41NzcyOTc2MDc3MTA5OTE0XV0sXCLDiFwiOltbMC41MDc3MDk2Nzg4NjA0NTQ4XV0sXCLDiVwiOltbMC41MDc3MDk2Nzg4NjA0NTQ5XV0sXCLDh1wiOltudWxsLFswLjI1OTg0MTE1NTQ5MDM3MjhdXSxcIsOEXCI6W1swLjYzMzY4MTQ3MjQ5NzE1NjNdXSxcIsOCXCI6W1swLjYzMzY4MTQ3MjQ5NzE1MzldLG51bGwsWzAuNTA5MDg4NjgwNzk3MjY1M11dLFwiw4BcIjpbWzAuNjMzNjgxNDcyNDk3MTUxNV1dLFwiWlwiOltbMC40MzM5NzI1MTY2MTQ4Njg3NCwwLjc2NDUxMTE2OTE2NjA5MDFdXSxcIllcIjpbWzAuNTcyMTI4ODc2NTU4MjE1OF1dLFwiV1wiOltbMC4zOTA1OTAxOTE1NjczMDE5NiwwLjU3ODE0MjMwOTk4NTA4MTNdXSxcIlZcIjpbWzAuNjA4NDEwNTkwMjczMDM3M11dLFwiVVwiOltbMC43MDE5OTcwNDE2ODQzMTUyXV0sXCJSXCI6W1swLjcyMDkyMjM1MTYyNTI1MzNdXSxcIk9cIjpbWzAuNzQzODgzNTgxODQ3NjQ3Nl1dLFwiTlwiOltbMC41MjIwMTQyMTMxNzgzMTk1LDAuNzM5Njk2MjUzNDkxNTQ2XV0sXCJNXCI6W1swLjQyMzAyNjc1NjU3NDk0NDcsMC42MDA3NjkwOTEyNzAyOTk2LDAuODAzMzk1MzUyODIzMDA0Ml1dLFwiTFwiOltbMC42NzU3OTExOTcwOTQ2MjJdXSxcIktcIjpbWzAuNDE3NjE4NDE3NjU5MzQ3NF0sWzAuNDk3NDY3NTg5NTk2NjY5Ml1dLFwiSlwiOltbMC4zMDUyNjIwMjg2MDk1MDA5N11dLFwiSFwiOltbMC40NDQxMjMxMDA5MDY3ODY5N11dLFwiR1wiOltbMC41NjU5ODk4NzU0NTU3MzFdXSxcIkVcIjpbWzAuNTA3NzE0MjM5NDE5MDkzXV0sXCJEXCI6W1swLjc0Mzc4NzYwOTM0NTk5MDNdXSxcIkJcIjpbWzAuNzQ3MjU4MTM5Mzk0ODI4NV1dLFwiQVwiOltbMC42MzM2ODE0NzI0OTcxNTUzXV0sXCLDtFwiOltbMC44NzMzOTQyNzUwNzA3MzI0XSxbMC41NDY3ODE1MDQ1NjEwMTQ4XV0sXCLDtlwiOltbMC44NzMzOTQyNzUwNzA3Mjc2XV0sXCLDr1wiOltbMC41Mzk2NDk3MDE5MDQyODQyXV0sXCLDrlwiOltbMC41Mzk2NDk3MDE5MDQyODQ3XSxbMC41NDQ2Njk4NDI5NDcwMjg5XV0sXCLDq1wiOltbMC40MDE5MzMyMjU4MDE0NTU4XV0sXCLDqlwiOltbMC40MDE5MzMyMjU4MDE0NTU4XSxbMC41NzMwODgyMzIxMDUzNjUzXV0sXCLDqFwiOltbMC40MDE5MzMyMjU4MDE0NTZdXSxcIsOpXCI6W1swLjQwMTkzMzIyNTgwMTQ1ODRdXSxcIsOnXCI6W1swLjUzMzA1OTExMjI2ODUzOTNdLFswLjI1OTg0MTE1NTQ5MDM3MTQ2XV0sXCLDpFwiOltbMC4zNDk0MDQzMDk4MjgxOTgyNiwwLjg0NDkyMzE0OTIyMDkxNTddXSxcIsOiXCI6W1swLjM0OTQwNDMwOTgyODIwMDE0LDAuODQ0OTIzMTQ5MjIwOTIwM10sWzAuNTE0MjEyMzc2MTEyMDIwMV1dLFwiw6BcIjpbWzAuMzQ5NDA0MzA5ODI4MjAzMDMsMC44NDQ5MjMxNDkyMjA5Mjc0XV0sXCJ6XCI6W1swLjM2NTkyMjI3NzE5NDE2NiwwLjY5ODU3ODg5MjgyNTIyNTldXSxcInlcIjpbWzAuMTI2ODIyMTU5MzM1MDgxNCwwLjM1MDI3MDcyNTc4MjYwNTc2LDAuNjg1NDQzNTc1NDUzODkyM11dLFwieFwiOltbMC40MTkxOTgwODEwNzkwMTg0XV0sXCJ3XCI6W1swLjE3ODAxMzI5OTIxMzMyMjczLDAuNTAxMjQ3OTc0MTAwNjcxOSwwLjgyOTE2NzIwOTQ5MzYzNDhdXSxcInZcIjpbWzAuNTUzNjA5MjQ5ODUyMDgzN11dLFwidVwiOltbMC4yMjc1NjgxMzIwMDk4OTk1MywwLjcyNDA4MDQyMDAzMTQ5ODVdXSxcInRcIjpbWzAuNDkzNzI5MDMzMDU1MTcyMTNdXSxcInNcIjpbWzAuMzUxMzk5MzgxNTk1NDkxMzMsMC43NzMwNzg2Mzk1MTAwODA5XV0sXCJyXCI6W1swLjU0NjEyNDY1MTYwNDg5MzddXSxcInFcIjpbWzAuNDIwMjc4MTEwOTQ1MDYxOCwwLjk0ODU0NDM0NzYxOTA2M11dLFwicFwiOltbMC4xMzkyOTQ4NzY1OTgxNDkzNSwwLjc1ODY1OTU5NTc1Nzc3NzddXSxcIm9cIjpbWzAuODcxOTA3OTAwOTI4NzQ4NV1dLFwiblwiOltbMC43NjcwMTczNjk2NDg4MTU3XV0sXCJtXCI6W1swLjUyNTM2MDI1NjEyOTg4MDZdXSxcImxcIjpbWzAuNDkyODIyMDQ2NzQ1NjIwN11dLFwia1wiOltbMC4zNTg5MjI5MTA5MzgzMjUxLDAuNjc4ODkyOTQ3ODIxMzI4MSwwLjkwOTgyNzg0NDAwNjQ1MjFdXSxcImpcIjpbWzAuMTkxMDEyMTcxMzQzODc1MV1dLFwiaVwiOltbMC41Mzk2NDk3MDE5MDQyODYyXV0sXCJoXCI6W1swLjM5NDgzNjc4Mzc3MjAyNTYsMC43NDc0NzcyNzAwNDE2OTczLDAuODgzMTA4MjI2Mjk5MjYzM11dLFwiZ1wiOltbMC4xNzE1Mzk1ODg3NzI2NTEsMC40MTQ1NTQwMDYyMDA1NzMyNl1dLFwiZlwiOltbMC4yOTQwMjE4NDY4Nzc3MDUyLDAuOTE5MzY2ODE5NzE0NjE1NV1dLFwiZFwiOltbMC4xNTkzNTY5NTQyNzI5NzQzNiwwLjY1NDIwMjIzMzMzMTE1NzldXSxcImNcIjpbWzAuNTMzMDU5MTEyMjY4NTM5NF1dLFwiYlwiOltbMC40MDM5MjIwNTgyMDE0MzA4NCwwLjkzMjg2NzYxMDYwODA2NjZdXSxcImFcIjpbWzAuMzQ5NDA0MzA5ODI4MTk5NywwLjg0NDkyMzE0OTIyMDkxOTNdXX1cblx0fTtcblxuXG5cdHJldHVybiAgQWxwaGFiZXQuZmFjdG9yeShFbWlsaWVGb250KTs7XG5cdFxufSkpOyIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByZWcgPSAvKFthLXpdKShbMC05XFxzXFwsXFwuXFwtXSspL2dpO1xuXHRcdFxuXHQvL2V4cGVjdGVkIGxlbmd0aCBvZiBlYWNoIHR5cGVcblx0dmFyIGV4cGVjdGVkTGVuZ3RocyA9IHtcblx0XHRtIDogMixcblx0XHRsIDogMixcblx0XHR2IDogMSxcblx0XHRoIDogMSxcblx0XHRjIDogNixcblx0XHRzIDogNFxuXHR9O1xuXG5cdHZhciBQYXRoID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdC8vaWYoc3ZnKSBjb25zb2xlLmxvZyhzdmcsIHBhcnNlZCk7XG5cdFx0dGhpcy5lYXNlUG9pbnRzID0gZWFzZVBvaW50cyB8fCBbXTtcblx0XHQvL2NvbnNvbGUubG9nKG5hbWUsIGVhc2VQb2ludHMpO1xuXHRcdHRoaXMuX3NldFBhcnNlZChwYXJzZWQgfHwgdGhpcy5fcGFyc2Uoc3ZnKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuX3NldFBhcnNlZCA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuXHRcdC8vY29uc29sZS5sb2cocGFyc2VkKTtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmN1YmljIHx8IHRoaXMuX3BhcnNlQ3ViaWMoKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLmdldFRvdGFsTGVuZ3RoKHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIGFuIFNWRyBzdHJpbmcgb2YgdGhlIHBhdGggc2VnZW1udHMuIEl0IGlzIG5vdCB0aGUgc3ZnIHByb3BlcnR5IG9mIHRoZSBwYXRoLCBhcyBpdCBpcyBwb3RlbnRpYWxseSB0cmFuc2Zvcm1lZFxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKHN2Zywgc2VnbWVudCl7XG5cdFx0XHRyZXR1cm4gc3ZnICsgc2VnbWVudC50eXBlICsgc2VnbWVudC5hbmNob3JzLmpvaW4oJywnKTsgXG5cdFx0fSwgJycpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIHRoZSBhYnNvbHV0ZSBwb3NpdGlvbnMgYXQgd2hpY2ggd2UgaGF2ZSBlYXNlIHBvaW50cyAod2hpY2ggYXJlIHByZXBhcnNlZCBhbmQgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBwYXRoJ3MgZGVmaW5pdGlvbnMpXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLmdldEVhc2Vwb2ludHMgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbCA9IHRoaXMuZ2V0TGVuZ3RoKCk7XG5cdFx0cmV0dXJuIHRoaXMuZWFzZVBvaW50cy5tYXAoZnVuY3Rpb24oZSl7XG5cdFx0XHRyZXR1cm4gZSAqIGw7XG5cdFx0fSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0UG9pbnQgPSBmdW5jdGlvbihpZHgpIHtcblx0XHQvL2NvbnNvbGUubG9nKHRoaXMucGFyc2VkKTtcblx0XHRyZXR1cm4gdGhpcy5wYXJzZWRbaWR4XSAmJiB0aGlzLnBhcnNlZFtpZHhdLmFuY2hvcnM7XG5cdH07XG5cblx0LyoqXG5cdFBhcnNlcyBhbiBTVkcgcGF0aCBzdHJpbmcgdG8gYSBsaXN0IG9mIHNlZ21lbnQgZGVmaW5pdGlvbnMgd2l0aCBBQlNPTFVURSBwb3NpdGlvbnMgdXNpbmcgUmFwaGFlbC5wYXRoMmN1cnZlXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLl9wYXJzZSA9IGZ1bmN0aW9uKHN2Zykge1xuXHRcdHZhciBjdXJ2ZSA9IFJhcGhhZWwucGF0aDJjdXJ2ZShzdmcpO1xuXHRcdHZhciBwYXRoID0gY3VydmUubWFwKGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHR5cGUgOiBwb2ludC5zaGlmdCgpLFxuXHRcdFx0XHRhbmNob3JzIDogcG9pbnRcblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHBhdGg7XG5cdH07XG5cblx0LyoqXG5cdFx0UGFyc2VzIGEgcGF0aCBkZWZpbmVkIGJ5IHBhcnNlUGF0aCB0byBhIGxpc3Qgb2YgYmV6aWVyIHBvaW50cyB0byBiZSB1c2VkIGJ5IEdyZWVuc29jayBCZXppZXIgcGx1Z2luLCBmb3IgZXhhbXBsZVxuXHRcdFR3ZWVuTWF4LnRvKHNwcml0ZSwgNTAwLCB7XG5cdFx0XHRiZXppZXI6e3R5cGU6XCJjdWJpY1wiLCB2YWx1ZXM6Y3ViaWN9LFxuXHRcdFx0ZWFzZTpRdWFkLmVhc2VJbk91dCxcblx0XHRcdHVzZUZyYW1lcyA6IHRydWVcblx0XHR9KTtcblx0XHQqL1xuXHRQYXRoLnByb3RvdHlwZS5fcGFyc2VDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vY29uc29sZS5sb2cocGF0aCk7XG5cdFx0Ly9hc3N1bWVkIGZpcnN0IGVsZW1lbnQgaXMgYSBtb3ZldG9cblx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuY3ViaWMgPSB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oYW5jaG9ycywgc2VnbWVudCl7XG5cdFx0XHR2YXIgYSA9IHNlZ21lbnQuYW5jaG9ycztcblx0XHRcdGlmKHNlZ21lbnQudHlwZT09PSdNJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTphWzFdfSk7XG5cdFx0XHR9IGVsc2UgaWYoc2VnbWVudC50eXBlPT09J0wnKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMl0sIHk6IGFbM119KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzRdLCB5OiBhWzVdfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHRcdH0sIFtdKTtcblxuXHRcdHJldHVybiBhbmNob3JzO1xuXG5cdH07XG5cblx0Ly90cm91dmUgbGUgYm91bmRpbmcgYm94IGQndW5lIGxldHRyZSAoZW4gc2UgZmlhbnQganVzdGUgc3VyIGxlcyBwb2ludHMuLi4gb24gbmUgY2FsY3VsZSBwYXMgb3UgcGFzc2UgbGUgcGF0aClcblx0UGF0aC5wcm90b3R5cGUuZ2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5wYXRoQkJveCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS50cmFuc2xhdGUoeCwgeSk7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KHN2ZywgdGhpcy5uYW1lLCBudWxsLCB0aGlzLmVhc2VQb2ludHMuc2xpY2UoMCkpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBwYXRoLCBzY2FsZWRcblx0UGF0aC5wcm90b3R5cGUuc2NhbGUgPSBQYXRoLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKHJhdGlvKSB7XG5cdFx0cmF0aW8gPSByYXRpbyB8fCAxO1xuXHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRtLnNjYWxlKHJhdGlvKTtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIHRoaXMuZWFzZVBvaW50cy5zbGljZSgwKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYXBwbHlNYXRyaXggPSBmdW5jdGlvbihtKXtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIHRoaXMuZWFzZVBvaW50cy5zbGljZSgwKSk7XG5cdH07IFxuXG5cdFBhdGgucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKHBhcnQsIG5hbWUpwqB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJ0KTtcblx0XHRpZihuYW1lKSB0aGlzLm5hbWUgKz0gbmFtZTtcblx0XHR2YXIgb3JpZ0xlbmd0aCA9IHRoaXMuZ2V0TGVuZ3RoKCk7XG5cdFx0dGhpcy5fc2V0UGFyc2VkKHRoaXMucGFyc2VkLmNvbmNhdChwYXJ0LnBhcnNlZC5zbGljZSgxKSkpO1xuXHRcdHZhciBmaW5hbExlbmd0aCA9IHRoaXMuZ2V0TGVuZ3RoKCk7XG5cdFx0Ly9yZW1hcCBlYXNlcG9pbnRzLCBhcyBsZW5ndGggb2YgcGF0aCBoYXMgY2hhbmdlZFxuXHRcdHZhciBsZW5ndGhSYXRpbyA9IGZpbmFsTGVuZ3RoIC8gb3JpZ0xlbmd0aDtcblx0XHR0aGlzLmVhc2VQb2ludHMgPSB0aGlzLmVhc2VQb2ludHMubWFwKGZ1bmN0aW9uKGUpe1xuXHRcdFx0cmV0dXJuIGUgLyBsZW5ndGhSYXRpbztcblx0XHR9KTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hZGRFYXNlcG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5lYXNlUG9pbnRzLCBwb3MpO1xuXHRcdHRoaXMuZWFzZVBvaW50cy5wdXNoKHBvcyk7XG5cdH07XG5cblx0UGF0aC5mYWN0b3J5ID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHRyZXR1cm4gbmV3IFBhdGgoc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoO1xuXG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEVhc2Vwb2ludHMnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290Ll8sIHJvb3QuUmFwaGFlbCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIF8sIFJhcGhhZWwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIEdFVF9ERUZBVUxUUyA9IGZhbHNlO1xuXG5cdHZhciBkZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5cdHZhciByYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cdHZhciB0b1JhZGlhbnMgPSBmdW5jdGlvbihkZWdyZWVzKSB7XG5cdCAgcmV0dXJuIGRlZ3JlZXMgKiBkZWdUb1JhZDtcblx0fTtcdCBcblx0Ly8gQ29udmVydHMgZnJvbSByYWRpYW5zIHRvIGRlZ3JlZXMuXG5cdHZhciB0b0RlZ3JlZXMgPSBmdW5jdGlvbihyYWRpYW5zKSB7XG5cdCAgcmV0dXJuIHJhZGlhbnMgKiByYWRUb0RlZztcblx0fTtcblxuXG5cdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdHZhciBhbmdsZVRyZXNob2xkID0gdG9SYWRpYW5zKDEyKTtcblxuXHR2YXIgbGF5ZXI7XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0dmFyIGVsID0gbGF5ZXIuYWRkKCdjaXJjbGUnLCBwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpO1xuXHRcdGVsLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdHZhciBzaG93ID0gZnVuY3Rpb24ocGF0aERlZikge1xuXHRcdHZhciBwYXRoID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcdFx0XHRcblx0XHR2YXIgZWwgPSBsYXllci5hZGQoJ3BhdGgnLCBwYXRoKTtcblx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiAzLCBzdHJva2U6ICcjMDAwMDAwJ30pOy8qKi9cblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0dmFyIGZpbmREZWZhdWx0cyA9IGZ1bmN0aW9uKHBhdGhEZWYpe1xuXHRcdHZhciBwYXRoU3RyID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcblx0XHR2YXIgbGVuZ3RoID0gcGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHR2YXIgcG9pbnRQb3MgPSBbXTtcblx0XHRcblx0XHRcblx0XHR2YXIgcHJlY2lzaW9uID0gMTtcblx0XHR2YXIgcHJldjtcblx0XHR2YXIgYWxsUG9pbnRzID0gW107XG5cdFx0Zm9yKHZhciBpPXByZWNpc2lvbjsgaTw9bGVuZ3RoOyBpICs9IHByZWNpc2lvbikge1xuXHRcdFx0Ly92YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgaSk7XG5cdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBpKTtcblx0XHRcdFxuXHRcdFx0Ly9pdCBzZWVtcyB0aGF0IFJhcGhhZWwncyBhbHBoYSBpcyBpbmNvbnNpc3RlbnQuLi4gc29tZXRpbWVzIG92ZXIgMzYwXG5cdFx0XHR2YXIgYWxwaGEgPSBNYXRoLmFicyggTWF0aC5hc2luKCBNYXRoLnNpbih0b1JhZGlhbnMocC5hbHBoYSkpICkpO1xuXHRcdFx0aWYocHJldikge1xuXHRcdFx0XHRwLmRpZmYgPSBNYXRoLmFicyhhbHBoYSAtIHByZXYpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cC5kaWZmID0gMDtcblx0XHRcdH1cblx0XHRcdHByZXYgPSBhbHBoYTtcblx0XHRcdC8vY29uc29sZS5sb2cocC5kaWZmKTtcblxuXHRcdFx0aWYocC5kaWZmID4gYW5nbGVUcmVzaG9sZCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGkpO1xuXHRcdFx0XHRwb2ludFBvcy5wdXNoKGkpO1xuXHRcdFx0fVxuXG5cdFx0XHQvL3AuY29tcHV0ZWRBbHBoYSA9IGFscGhhO1xuXHRcdFx0Ly9hbGxQb2ludHMucHVzaChwKTtcblxuXHRcdH0vKiovXG5cblx0XHQgLypcblx0XHQvL0RFQlVHIFxuXHRcdC8vZmluZCBtYXggY3VydmF0dXJlIHRoYXQgaXMgbm90IGEgY3VzcCAodHJlc2hvbGQgZGV0ZXJtaW5lcyBjdXNwKVxuXHRcdHZhciBjdXNwVHJlc2hvbGQgPSA0MDtcblx0XHR2YXIgbWF4ID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihtLCBwKXtcblx0XHRcdHJldHVybiBwLmRpZmYgPiBtICYmIHAuZGlmZiA8IGN1c3BUcmVzaG9sZCA/IHAuZGlmZiA6IG07XG5cdFx0fSwgMCk7XG5cdFx0Y29uc29sZS5sb2cobWF4KTtcblxuXHRcdHZhciBwcmV2ID0gWzAsMCwwLDBdO1xuXHRcdGFsbFBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0dmFyIHIgPSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdHZhciBnID0gMjU1IC0gTWF0aC5yb3VuZCgocC5kaWZmIC8gbWF4KSAqIDI1NSk7XG5cdFx0XHR2YXIgcmdiID0gJ3JnYignK3IrJywnK2crJywwKSc7XG5cdFx0XHRpZihyPjEwMCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PScpO1xuXHRcdFx0XHRwcmV2LmZvckVhY2goZnVuY3Rpb24ocCl7Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhKTt9KTtcblx0XHRcdFx0Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhLCByZ2IpO1xuXHRcdFx0fVxuXHRcdFx0cC55ICs9IDE1MDtcblx0XHRcdHNob3dQb2ludChwLCByZ2IsIDAuNSk7XG5cdFx0XHRwcmV2WzNdID0gcHJldlsyXTtcblx0XHRcdHByZXZbMl0gPSBwcmV2WzFdO1xuXHRcdFx0cHJldlsxXSA9IHByZXZbMF07XG5cdFx0XHRwcmV2WzBdID0gcDtcblx0XHR9KTtcblx0XHQvKiovXG5cblx0XHQvL2ZpbmRzIGdyb3VwcyBvZiBwb2ludHMgZGVwZW5kaW5nIG9uIHRyZXNob2xkLCBhbmQgZmluZCB0aGUgbWlkZGxlIG9mIGVhY2ggZ3JvdXBcblx0XHRyZXR1cm4gcG9pbnRQb3MucmVkdWNlKGZ1bmN0aW9uKHBvaW50cywgcG9pbnQpe1xuXG5cdFx0XHR2YXIgbGFzdCA9IHBvaW50c1twb2ludHMubGVuZ3RoLTFdO1xuXHRcdFx0aWYoIWxhc3QgfHwgcG9pbnQgLSBsYXN0W2xhc3QubGVuZ3RoLTFdID4gZGlzdGFuY2VUcmVzaG9sZCl7XG5cdFx0XHRcdGxhc3QgPSBbcG9pbnRdO1xuXHRcdFx0XHRwb2ludHMucHVzaChsYXN0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxhc3QucHVzaChwb2ludCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwb2ludHM7XG5cdFx0fSwgW10pLm1hcChmdW5jdGlvbihwb2ludHMpe1xuXHRcdFx0cmV0dXJuIHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGgvMildO1xuXHRcdH0pO1xuXHRcdFxuXHR9O1xuXG5cdHZhciBhbGxQb2ludHMgPSBbXTtcblx0dmFyIGVhc2VQb2ludHMgPSB7fTtcblxuXHR2YXIgY3VycmVudDtcblxuXHR2YXIgZ2V0RWFzZXBvaW50cyA9IGZ1bmN0aW9uKGxldHRlciwgcGF0aElkeCwgcGF0aERlZil7XG5cdFx0XG5cdFx0dmFyIHBhdGggPSBzaG93KHBhdGhEZWYpO1xuXG5cdFx0Ly9hcmUgZWFzZSBwb2ludHMgYWxyZWFkeSBzZXQgZm9yIHRoaXMgcGF0aD9cblx0XHR2YXIgcGF0aEVhc2VQb2ludHMgPSBwYXRoRGVmLmdldEVhc2Vwb2ludHMoKTsgXG5cdFx0aWYocGF0aEVhc2VQb2ludHMubGVuZ3RoID09PSAwICYmIEdFVF9ERUZBVUxUUykge1xuXHRcdFx0cGF0aEVhc2VQb2ludHMgPSBmaW5kRGVmYXVsdHMocGF0aERlZik7XG5cdFx0fVxuXG5cdFx0Ly9jb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblx0XHR2YXIgbGVuZ3RoID0gcGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XG5cblx0XHR2YXIgaW5hY3RpdmVDb2xvciA9ICcjMDBmZjAwJztcblx0XHR2YXIgYWN0aXZlQ29sb3IgPSAnI2ZmMjIwMCc7XG5cblx0XHR2YXIgYWRkUG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdFx0aWYocG9zIDwgMSkgcG9zID0gcG9zICogbGVuZ3RoOy8vc2kgZW4gcHJjXG5cdFx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwb3MpO1xuXHRcdFx0dmFyIHBvaW50ID0gc2hvd1BvaW50KHBPYmosIGluYWN0aXZlQ29sb3IsIDMpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoSWR4KTtcblx0XHRcdHBvaW50LmRhdGEoJ3BvcycsIHBvcyk7XG5cdFx0XHRwb2ludC5kYXRhKCdsZXR0ZXInLCBsZXR0ZXIpO1xuXHRcdFx0cG9pbnQuZGF0YSgncGF0aElkeCcsIHBhdGhJZHgpO1xuXHRcdFx0cG9pbnQuZGF0YSgncGF0aExlbmd0aCcsIGxlbmd0aCk7XG5cdFx0XHRwb2ludC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRcdHBvaW50LmRhdGEoJ3knLCBwT2JqLnkpO1xuXG5cdFx0XHRhbGxQb2ludHMucHVzaChwb2ludCk7XG5cblx0XHRcdHBvaW50LmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFxuXHRcdFx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0XHRwLmF0dHIoe2ZpbGw6IGluYWN0aXZlQ29sb3J9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cG9pbnQuYXR0cih7ZmlsbDogYWN0aXZlQ29sb3J9KTtcblxuXHRcdFx0XHRjdXJyZW50ID0ge1xuXHRcdFx0XHRcdHBvaW50OiBwb2ludCxcblx0XHRcdFx0XHRwYXRoOiBwYXRoLFxuXHRcdFx0XHRcdHBhdGhEZWY6IHBhdGhEZWYsXG5cdFx0XHRcdFx0c3ZnIDogcGF0aFN0cixcblx0XHRcdFx0XHRsZXR0ZXIgOiBsZXR0ZXIsXG5cdFx0XHRcdFx0cGF0aElkeCA6IHBhdGhJZHhcblx0XHRcdFx0fTtcblxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHBhdGhFYXNlUG9pbnRzLmZvckVhY2goYWRkUG9pbnQpOy8qKi9cblxuXHRcdHBhdGguY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdC8vY29uc29sZS5sb2coJ2FkZCcpO1xuXHRcdFx0YWRkUG9pbnQoMCk7XG5cdFx0fSk7XG5cdFx0XG5cblx0XHRyZXR1cm4gcGF0aEVhc2VQb2ludHM7XG5cblx0fTtcblxuXHR2YXIgbW92ZUN1cnJlbnQgPSBmdW5jdGlvbihkaXN0KSB7XG5cdFx0dmFyIHAgPSBjdXJyZW50LnBvaW50O1xuXHRcdHZhciBwb3MgPSBwLmRhdGEoJ3BvcycpO1xuXHRcdHBvcyArPSBkaXN0O1xuXHRcdHZhciBtYXggPSBjdXJyZW50LnBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0aWYocG9zIDwgMCkgcG9zID0gMDtcblx0XHRpZihwb3MgPiBtYXgpIHBvcyA9IG1heDtcblx0XHRwLmRhdGEoJ3BvcycsIHBvcyk7XG5cblx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJyZW50LnN2ZywgcG9zKTtcblxuXHRcdHZhciB4ID0gcC5kYXRhKCd4Jyk7XG5cdFx0dmFyIHkgPSBwLmRhdGEoJ3knKTtcblx0XHR2YXIgZGVsdGFYID0gcE9iai54IC0geDtcblx0XHR2YXIgZGVsdGFZID0gcE9iai55IC0geTtcblxuXHRcdC8qcC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRwLmRhdGEoJ3knLCBwT2JqLnkpOy8qKi9cblxuXHRcdHAudHJhbnNmb3JtKCd0JyArIGRlbHRhWCArICcsJyArIGRlbHRhWSk7XG5cdFx0cHJpbnRKU09OKCk7XG5cblx0fTtcblxuXG5cdCQod2luZG93KS5vbigna2V5ZG93bi5lYXNlJywgZnVuY3Rpb24oZSl7XG5cdFx0Ly9jb25zb2xlLmxvZyhlLndoaWNoLCBjdXJyZW50KTtcblx0XHR2YXIgTEVGVCA9IDM3O1xuXHRcdHZhciBVUCA9IDM4O1xuXHRcdHZhciBSSUdIVCA9IDM5O1xuXHRcdHZhciBET1dOID0gNDA7XG5cdFx0dmFyIERFTCA9IDQ2O1xuXG5cdFx0aWYoY3VycmVudCkge1xuXHRcdFx0c3dpdGNoKGUud2hpY2gpIHtcblx0XHRcdFx0Y2FzZSBMRUZUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgRE9XTjpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoLTEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBSSUdIVDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgVVA6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KDEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBERUw6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHZhciBpZHggPSBhbGxQb2ludHMuaW5kZXhPZihjdXJyZW50LnBvaW50KTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGlkeCk7XG5cdFx0XHRcdFx0Y3VycmVudC5wb2ludC5yZW1vdmUoKTtcblx0XHRcdFx0XHRhbGxQb2ludHMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhbGxQb2ludHMpO1xuXHRcdFx0XHRcdGN1cnJlbnQgPSBudWxsO1xuXHRcdFx0XHRcdHByaW50SlNPTigpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSk7XG5cblx0dmFyIHByaW50Tm9kZTtcblx0dmFyIHByaW50SlNPTiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBqc29uID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihqc29uLCBwb2ludCl7XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBwb2ludC5kYXRhKCdsZXR0ZXInKTtcblx0XHRcdHZhciBwYXRoSWR4ID0gcG9pbnQuZGF0YSgncGF0aElkeCcpO1xuXHRcdFx0dmFyIGwgPSBwb2ludC5kYXRhKCdwYXRoTGVuZ3RoJyk7XG5cblx0XHRcdHZhciBwYXRocyA9IGpzb25bbGV0dGVyXSA9IGpzb25bbGV0dGVyXSB8fCBbXTtcblx0XHRcdHZhciBlYXNlcG9pbnRzID0gcGF0aHNbcGF0aElkeF0gPSBwYXRoc1twYXRoSWR4XSB8fCBbXTtcblx0XHRcdGVhc2Vwb2ludHMucHVzaChwb2ludC5kYXRhKCdwb3MnKSAvIGwpO1xuXHRcdFx0ZWFzZXBvaW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpe1xuXHRcdFx0XHRyZXR1cm4gYSAtIGI7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBqc29uO1xuXHRcdH0sIHt9KTtcblx0XHRwcmludE5vZGUudGV4dChKU09OLnN0cmluZ2lmeShqc29uKSk7XG5cdH07XG5cblx0cmV0dXJuIGZ1bmN0aW9uKHN0YWdlLCBncm91cHMsIG5vZGUpe1xuXHRcdGxheWVyID0gc3RhZ2UuZ2V0TmV3TGF5ZXIoKTtcblx0XHR2YXIgcGFkID0gMjA7XG5cdFx0dmFyIGF2YWlsVyA9IHN0YWdlLndpZHRoKCkgLSBwYWQ7XG5cblx0XHR2YXIgZ3JvdXBNYXhIZWlnaHQgPSBPYmplY3Qua2V5cyhncm91cHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIGdyb3VwTmFtZSl7XG5cdFx0XHR2YXIgdCA9IGdyb3Vwc1tncm91cE5hbWVdLmdldEhlaWdodCgpO1xuXHRcdFx0aWYobWluID09PSB1bmRlZmluZWQgfHwgdCA+IG1pbikge1xuXHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFxuXHRcdHZhciB0b3BMZWZ0ID0ge3g6cGFkLCB5OnBhZH07XG5cdFx0T2JqZWN0LmtleXMoZ3JvdXBzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpe1xuXHRcdFx0dmFyIGdyb3VwID0gZ3JvdXBzW25hbWVdO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhncm91cCk7XG5cdFx0XHR2YXIgZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cblx0XHRcdGlmKGVuZExlZnQgPiBhdmFpbFcpIHtcblx0XHRcdFx0dG9wTGVmdC54ID0gcGFkO1xuXHRcdFx0XHR0b3BMZWZ0LnkgKz0gcGFkICsgZ3JvdXBNYXhIZWlnaHQ7XG5cdFx0XHRcdGVuZExlZnQgPSB0b3BMZWZ0LnggKyBncm91cC5nZXRXaWR0aCgpICsgcGFkO1xuXHRcdFx0fVxuXG5cblx0XHRcdHZhciB0aGlzRWFzZSA9IGdyb3VwLnBhdGhzLm1hcChmdW5jdGlvbihwLCBpZHgpe1xuXHRcdFx0XHRwID0gcC50cmFuc2xhdGUodG9wTGVmdC54LCB0b3BMZWZ0LnkpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0RWFzZXBvaW50cyhuYW1lLCBpZHgsIHApO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dG9wTGVmdC54ID0gZW5kTGVmdDtcdFx0XHRcblxuXHRcdH0pO1xuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cblx0XHRwcmludE5vZGUgPSBub2RlO1xuXHRcdHByaW50SlNPTigpO1xuXHR9O1xuXG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgUGF0aEdyb3VwID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNldEJvdW5kaW5nID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXRocy5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHBhdGgpe1xuXHRcdFx0dmFyIHBhdGhCb3VuZGluZyA9IHBhdGguZ2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZy54ID0gYm91bmRpbmcueCA8IHBhdGhCb3VuZGluZy54ID8gYm91bmRpbmcueCA6ICBwYXRoQm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLnkgPSBib3VuZGluZy55IDwgcGF0aEJvdW5kaW5nLnkgPyBib3VuZGluZy55IDogIHBhdGhCb3VuZGluZy55O1xuXHRcdFx0Ym91bmRpbmcueDIgPSBib3VuZGluZy54MiA+IHBhdGhCb3VuZGluZy54MiA/IGJvdW5kaW5nLngyIDogcGF0aEJvdW5kaW5nLngyO1xuXHRcdFx0Ym91bmRpbmcueTIgPSBib3VuZGluZy55MiA+IHBhdGhCb3VuZGluZy55MiA/IGJvdW5kaW5nLnkyIDogcGF0aEJvdW5kaW5nLnkyO1xuXHRcdFx0Ym91bmRpbmcud2lkdGggPSBib3VuZGluZy54MiAtIGJvdW5kaW5nLng7XG5cdFx0XHRib3VuZGluZy5oZWlnaHQgPSBib3VuZGluZy55MiAtIGJvdW5kaW5nLnk7XG5cdFx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdFx0fSwgdW5kZWZpbmVkKSB8fCB7fTtcblx0XHQvL2lmIHRoZXJlJ3MgYSBlbmRQb2ludCBwb2ludCB0aGF0IGlzIHNldCwgdXNlIGl0cyBjb29yZGluYXRlcyBhcyBib3VuZGluZ1xuXHRcdGlmKHRoaXMuZW5kUG9pbnQpIHtcblx0XHRcdHZhciBhbmNob3JzID0gdGhpcy5lbmRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueDIgPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHRcdGlmKHRoaXMuc3RhcnRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLnN0YXJ0UG9pbnQuZ2V0UG9pbnQoMCk7XG5cdFx0XHR0aGlzLmJvdW5kaW5nLnggPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuYWRkUGF0aCA9IGZ1bmN0aW9uKHApe1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzIHx8IFtdO1xuXHRcdGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignZW5kJykgPT09IDApIHtcblx0XHRcdHRoaXMuZW5kUG9pbnQgPSBwO1xuXHRcdH0gZWxzZSBpZihwLm5hbWUgJiYgcC5uYW1lLmluZGV4T2YoJ3N0YXJ0JykgPT09IDApIHtcblx0XHRcdHRoaXMuc3RhcnRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy5oZWlnaHQ7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcud2lkdGg7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0Qm90dG9uID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy55Mjtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRUb3AgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnk7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0TGVmdCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRSaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDI7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2V0T2Zmc2V0ID0gZnVuY3Rpb24oeCwgeSl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMubWFwKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRwYXRoID0gcGF0aC50cmFuc2xhdGUoeCwgeSk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0fSk7XG5cdFx0dGhpcy5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQudHJhbnNsYXRlKHgsIHkpKTtcblx0XHR0aGlzLnN0YXJ0UG9pbnQgPSAodGhpcy5zdGFydFBvaW50ICYmIHRoaXMuc3RhcnRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgUGF0aEdyb3VwLCBzY2FsZWRcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcblx0XHRpZighdGhpcy5wYXRocykgcmV0dXJuIHRoaXM7XG5cdFx0dmFyIHNjYWxlZCA9IG5ldyBQYXRoR3JvdXAodGhpcy5uYW1lKTtcblx0XHR0aGlzLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCl7XG5cdFx0XHRzY2FsZWQuYWRkUGF0aChwYXRoLnNjYWxlKHNjYWxlKSk7XG5cdFx0fSk7XG5cblx0XHRzY2FsZWQuZW5kUG9pbnQgPSAodGhpcy5lbmRQb2ludCAmJiB0aGlzLmVuZFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnN0YXJ0UG9pbnQgPSAodGhpcy5zdGFydFBvaW50ICYmIHRoaXMuc3RhcnRQb2ludC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zZXRCb3VuZGluZygpO1xuXHRcdHJldHVybiBzY2FsZWQ7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRQYXRocyA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMucGF0aHM7XG5cdH07XG5cblx0UGF0aEdyb3VwLmZhY3RvcnkgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBuZXcgUGF0aEdyb3VwKCk7XG5cdH07XG5cblx0cmV0dXJuIFBhdGhHcm91cDtcblxufSkpO1xuXG5cbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL0RyYXdpbmcnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpLCByZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5fLCByb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBfLCBSYXBoYWVsKSB7XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHN0YWdlLCBwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpO1xuXHRcdGVsLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdC8vbGF5ZXIgaXMgYW4gZXh0ZW5zaW9uIG9mIFJhcGhhZWwncyBzZXQgdGhhdCBpcyBsaW5rZWQgdG8gYSBzdGFnZSwgc28gdGhhdCB5b3UgY2FuIGFkZCBkaXJlY3RseSB0byBpdCBpbnN0ZWFkIG9mIGhhdm9uZyB0byBoYXZlIGFjY2VzIHRvIGJvdGggdGhlIHN0YWdlIGFuZCB0aGUgc2V0LlxuXHR2YXIgTGF5ZXIgPSBmdW5jdGlvbihwYXBlcikge1xuXG5cdFx0dGhpcy5hZGQgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBhcmdzID0gYXJndW1lbnRzO1xuXHRcdFx0dmFyIGZjbiA9IEFycmF5LnByb3RvdHlwZS5zaGlmdC5jYWxsKGFyZ3MpO1xuXHRcdFx0aWYoIXBhcGVyW2Zjbl0pIHRocm93IG5ldyBFcnJvcihmY24gKyAnIGRvZXMgbm90IGV4aXN0IG9uIFJhcGhhZWwnKTtcblx0XHRcdFxuXHRcdFx0dmFyIGVsID0gcGFwZXJbZmNuXS5hcHBseShwYXBlciwgYXJncyk7XG5cdFx0XHR0aGlzLnB1c2goZWwpO1xuXHRcdFx0cmV0dXJuIGVsO1xuXHRcdH07XG5cblx0XHR0aGlzLnJlbW92ZSA9IGZ1bmN0aW9uKGVsKSB7XG5cdFx0XHRpZighZWwpIHJldHVybjtcblx0XHRcdGVsLnJlbW92ZSgpO1xuXHRcdFx0dGhpcy5leGNsdWRlKGVsKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdFx0dmFyIGVsID0gc2hvd1BvaW50KHBhcGVyLCBwb2ludCwgY29sb3IsIHNpemUpO1xuXHRcdFx0dGhpcy5wdXNoKGVsKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5jbGVhckFuZFJlbW92ZUFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgZTtcblx0XHRcdHdoaWxlKGUgPSB0aGlzLnBvcCgpKXtcblx0XHRcdFx0ZS5yZW1vdmUoKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdH07XG5cblx0dmFyIFN0YWdlID0gZnVuY3Rpb24obmFtZSl7XG5cblx0XHQvL2xlIHN0YWdlIGVzdCB1biBlbGVtZW50IGNvbnRlbnUgZGFucyBsZSBjb250YWluZXIsIHBvdXIgcG91dm9pciBsZSByZXNpemVyIHJlc3BvbnNpdmVcblx0XHR2YXIgY29udGFpbmVyID0gJCgnIycrbmFtZSk7XG5cdFx0dmFyIHBhcGVyTmFtZSA9IG5hbWUrJ1BhcGVyJztcblx0XHRjb250YWluZXIuYXBwZW5kKCc8ZGl2IGlkPVwiJytwYXBlck5hbWUrJ1wiPjwvZGl2PicpO1xuXG5cdFx0dmFyIHdpZHRoID0gY29udGFpbmVyLndpZHRoKCk7XG5cdFx0dmFyIGhlaWdodCA9IGNvbnRhaW5lci5oZWlnaHQoKTtcblx0XHR2YXIgcGFwZXIgPSBSYXBoYWVsKHBhcGVyTmFtZSwgd2lkdGgsIGhlaWdodCk7XG5cblx0XHR2YXIgcmVzaXplTm90aWZpZXIgPSAkLkRlZmVycmVkKCk7XG5cdFx0dGhpcy5vblJlc2l6ZSA9IHJlc2l6ZU5vdGlmaWVyLnByb21pc2UoKTtcblxuXHRcdHZhciBvblJlc2l6ZSA9IGZ1bmN0aW9uKCl7XG5cdFx0XHR3aWR0aCA9IGNvbnRhaW5lci53aWR0aCgpO1xuXHRcdFx0aGVpZ2h0ID0gY29udGFpbmVyLmhlaWdodCgpO1xuXHRcdFx0cGFwZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcblx0XHRcdHJlc2l6ZU5vdGlmaWVyLm5vdGlmeSh7dzp3aWR0aCwgaDpoZWlnaHR9KTtcblx0XHR9O1xuXG5cdFx0JCh3aW5kb3cpLm9uKCdyZXNpemUuc3RhZ2UnLCBvblJlc2l6ZSk7XG5cblxuXHRcdHRoaXMud2lkdGggPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHdpZHRoO1xuXHRcdH07XG5cdFx0dGhpcy5oZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIGhlaWdodDtcblx0XHR9O1xuXG5cdFx0dGhpcy5zaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdFx0cmV0dXJuIHNob3dQb2ludChwYXBlciwgcG9pbnQsIGNvbG9yLCBzaXplKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXROZXdMYXllciA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGxheWVyID0gcGFwZXIuc2V0KCk7XG5cdFx0XHRsYXllciA9IF8uZXh0ZW5kKGxheWVyLCBuZXcgTGF5ZXIocGFwZXIpKTtcblx0XHRcdHJldHVybiBsYXllcjtcblx0XHR9O1xuXG5cdH07XG5cblx0dmFyIGdldFN0YWdlID0gKGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHN0YWdlcyA9IHt9O1xuXHRcdHZhciBpbml0ID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0XHRyZXR1cm4gbmV3IFN0YWdlKG5hbWUpO1xuXHRcdH07XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKG5hbWUpe1xuXHRcdFx0cmV0dXJuIHN0YWdlc1tuYW1lXSA9IHN0YWdlc1tuYW1lXSB8fCBpbml0KG5hbWUpO1xuXHRcdH1cblx0fSkoKTtcblx0XG5cblx0cmV0dXJuIHtcblx0XHRnZXRTdGFnZSA6IGdldFN0YWdlLFxuXHRcdHNob3dQb2ludCA6IHNob3dQb2ludFxuXHR9O1xufSkpOyIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJy4vUGF0aEdyb3VwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KGxhZ3JhbmdlLmRyYXdpbmcuUGF0aEdyb3VwKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUGF0aEdyb3VwKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdFxuXHR2YXIgVmVjdG9yV29yZCA9IHtcblxuXHRcdGdldFBhdGhzIDogZnVuY3Rpb24oYWxwaGFiZXQsIHRleHQpIHtcblx0XHRcdHZhciByaWdodCA9IDA7XG5cdFx0XHR2YXIgbGluZXMgPSBuZXcgUGF0aEdyb3VwKHRleHQpO1xuXHRcdFx0dmFyIGNvbnRpbnVvdXMgPSBmYWxzZTtcblxuXHRcdFx0Ly9sb29wIGZvciBldmVyeSBjaGFyYWN0ZXIgaW4gbmFtZSAoc3RyaW5nKVxuXHRcdFx0Zm9yKHZhciBpPTA7IGk8dGV4dC5sZW5ndGg7IGkrKynCoHtcblx0XHRcdFx0dmFyIGxldHRlciA9IHRleHRbaV07XG5cblx0XHRcdFx0aWYobGV0dGVyID09PSAnICcpIHtcblx0XHRcdFx0XHRyaWdodCArPSBhbHBoYWJldC5nZXROU3BhY2UoKTtcblx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGxldHRlckRlZiA9IGFscGhhYmV0LmdldFN5bWJvbChsZXR0ZXIpIHx8IGFscGhhYmV0LmdldFN5bWJvbCgnLScpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgbGV0dGVyRGVmKTtcblxuXG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgbGV0dGVySm9pbmVkRW5kID0gZmFsc2U7XG5cdFx0XHRcdGxldHRlckRlZi5wYXRocy5mb3JFYWNoKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdFx0XHR2YXIgZGVmID0gcGF0aC50cmFuc2xhdGUocmlnaHQsIDApO1xuXHRcdFx0XHRcdHZhciBqb2luZWRTdGFydCA9IGRlZi5uYW1lICYmIGRlZi5uYW1lLmluZGV4T2YoJ2pvaW5hJykgPiAtMTtcblx0XHRcdFx0XHR2YXIgam9pbmVkRW5kID0gL2pvaW4oYT8pYi8udGVzdChkZWYubmFtZSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXIsIGpvaW5lZFN0YXJ0LCBqb2luZWRFbmQpO1xuXHRcdFx0XHRcdGxldHRlckpvaW5lZEVuZCA9IGxldHRlckpvaW5lZEVuZCB8fCBqb2luZWRFbmQ7XG5cdFx0XHRcdFx0aWYoam9pbmVkU3RhcnQgJiYgY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9hcHBlbmQgYXUgY29udGludW91c1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5hcHBlbmQoZGVmLCBsZXR0ZXIpO1xuXG5cdFx0XHRcdFx0XHQvL2Fqb3V0ZSBsZXMgZWFzZXBvaW50cyBkZSBjZSBwYXRoXG5cdFx0XHRcdFx0XHR2YXIgdG90YWxMZW5ndGggPSBjb250aW51b3VzLmdldExlbmd0aCgpO1xuXHRcdFx0XHRcdFx0dmFyIHBhdGhTdGFydFBvcyA9IHRvdGFsTGVuZ3RoIC0gZGVmLmdldExlbmd0aCgpO1xuXHRcdFx0XHRcdFx0ZGVmLmdldEVhc2Vwb2ludHMoKS5mb3JFYWNoKGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYWRkRWFzZXBvaW50KChwYXRoU3RhcnRQb3MgKyBwb3MpIC8gdG90YWxMZW5ndGgpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYoam9pbmVkRW5kICYmICFjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL3N0YXJ0IHVuIG5vdXZlYXUgbGluZSAoY2xvbmUgZW4gc2NhbGFudCBkZSAxKVxuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGRlZi5jbG9uZSgpO1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5uYW1lID0gbGV0dGVyO1xuXHRcdFx0XHRcdFx0bGluZXMuYWRkUGF0aChjb250aW51b3VzKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bGluZXMuYWRkUGF0aChkZWYpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKCFsZXR0ZXJKb2luZWRFbmQpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRyaWdodCArPSBsZXR0ZXJEZWYuZ2V0V2lkdGgoKTtcblx0XHRcdFx0Ly9jb25zb2xlLnRhYmxlKFt7bGV0dGVyOm5hbWVbaV0sIGxldHRlcldpZHRoOiBsZXR0ZXIuZ2V0V2lkdGgoKSwgdG90YWw6cmlnaHR9XSk7XHRcblx0XHRcdH1cblx0XHRcdC8vY29uc29sZS5sb2cobGluZXMuZ2V0Qm91bmRpbmcoKSk7XG5cblx0XHRcdHZhciBiID0gbGluZXMuZ2V0Qm91bmRpbmcoKTtcblx0XHRcdGxpbmVzLnNldE9mZnNldCgtYi54LCAtYi55KTtcblx0XHRcdFxuXHRcdFx0cmV0dXJuIGxpbmVzO1xuXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBWZWN0b3JXb3JkO1xuXHRcbn0pKTtcblxuXG4iXX0=
