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
		scale : 0.1,
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
		PathEasepoints(Stage.getStage('svg'), DecorativeLines.getAll(), $('#brp'));
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
					var targetTop = -(stage.height() * padding * 0.5) + (stage.height() - ( bounding.y + (bounding.height*scale)));
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
			//tl.timeScale(0.2);
			return tl;

		},

		load : function(){
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
					var pathPart = path.getSvgSub(0, anim.distance, true);
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
		this.svg = null;
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
		return this.svg = this.svg || this.parsed.reduce(function(svg, segment){
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

	Path.prototype.getSvgSub = function(start, end, absolute) {
		start = start || 0;
		end = end || 1;
		var subL = end - start;
		var l = this.getLength();
		if(!absolute) {
			start *=l;
			end *= l;
		}
		return Raphael.getSubpath(this.getSVGString(), start, end);
	};

	Path.prototype.getSub = function(start, end, absolute) {
		var prcStart = absolute ? start / this.getLength() : start;
		var ease = this.easePoints.map(function(e){
			return (e - prcStart) / subL;
		}).filter(function(e){
			return e > 0 && e < 1;
		});
		return Path.factory(this.getSvgSub(start, end, absolute), this.name, null, ease);
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
		return this.applyMatrix(m);
	};

	Path.prototype.rotate = function(deg) {
		var m = Raphael.matrix();
		m.rotate(deg);
		return this.applyMatrix(m);
	};

	//returns a new path, scaled
	Path.prototype.scale = Path.prototype.clone = function(ratiox, ratioy) {
		ratiox = ratiox || 1;
		var m = Raphael.matrix();
		m.scale(ratiox, ratioy || ratiox);
		return this.applyMatrix(m);
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


	Path.prototype.reverse = function(){
		var svg = this.getSVGString();
		var pathPieces = svg.match(/[MLHVCSQTA][-0-9.,]*/gi);
	    var reversed = '';
	    var skip = true;
	    var previousPathType;
	    for (var i = pathPieces.length - 1; i >= 0; i--) {
	        var pathType = pathPieces[i].substr(0, 1);
	        var pathValues = pathPieces[i].substr(1);
	        switch (pathType) {
	            case 'M':
	            case 'L':
	                reversed += (skip ? '' : pathType) + pathValues;
	                skip = false;
	                break;
	            case 'C':
	                var curvePieces = pathValues.match(/^([-0-9.]*,[-0-9.]*),([-0-9.]*,[-0-9.]*),([-0-9.]*,[-0-9.]*)$/);
	                reversed += curvePieces[3] + pathType + curvePieces[2] + ',' + curvePieces[1] + ',';
	                skip = true;
	                break;
	            default:
	                alert('Not implemented: ' + pathType);
	                break;
	        }
	    }
	    var ease = this.easePoints.map(function(e){
			return 1 - e;
		});
		//console.log(reversed);
	    return Path.factory('M'+reversed, this.name, null, ease);
	
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvRGVjb3JhdGl2ZUxpbmVzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL0V4YW1wbGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvV3JpdGVOYW1lcy5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvU3RhZ2UuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ0RlY29yYXRpdmVMaW5lcycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0JykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KGxhZ3JhbmdlLmRyYXdpbmcuQWxwaGFiZXQpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChBbHBoYWJldCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL29yaWdpbmFsIHNjYWxlIGZhY3RvclxuXHR2YXIgTGluZXMgPSB7XG5cdFx0c2NhbGUgOiAwLjEsXG5cdFx0c3ZnRmlsZSA6ICdhc3NldHMvbGlnbmVzLnN2ZycsXG5cdFx0ZWFzZXBvaW50cyA6IHtcImZvbGllXCI6W1swLjI2NDM4NjAwMjU4MDY3MTFdXSxcIndvcmREZWNvcmF0aW9uRW5kXCI6W1swLjYxNDA0NjIzNTc4MzUxOTVdXSxcImRlY2VtYnJlXCI6W1swLjU3OTYyOTM4MjAyOTUzMjVdXSxcIm5vdXZlbGxlc1wiOltbMC4yNTIwNzM5MjcxNDY3MTcyLDAuNjY4OTY1NDIyMDQzMjExMV1dfVxuXHR9O1xuXG5cdHJldHVybiBBbHBoYWJldC5mYWN0b3J5KExpbmVzKTtcblx0XG59KSk7IiwiXHRcblx0dmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblx0dmFyIFBhdGhFYXNlcG9pbnRzID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzJyk7LyoqL1xuXHRcblx0dmFyIFdyaXRlTmFtZXMgPSByZXF1aXJlKCcuL1dyaXRlTmFtZXMnKTtcblx0dmFyIFN0YWdlID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1N0YWdlJyk7XG5cblxuXG5cdHZhciBkb2NSZWFkeSA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBkID0gJC5EZWZlcnJlZCgpO1xuXG5cdFx0JChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKXtcblx0XHRcdGQucmVzb2x2ZSgpXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gZC5wcm9taXNlKCk7XG5cblx0fSkoKTtcblxuXHR2YXIgcmVhZHkgPSAkLndoZW4oZG9jUmVhZHksIFdyaXRlTmFtZXMubG9hZCgpKTtcblxuXHR2YXIgZG9EcmF3ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgY29udGFpbmVyID0gJCgnI3N2ZycpO1xuXG5cdFx0dmFyIHdvcmRzID0gW1xuXHRcdFx0e1xuXHRcdFx0XHR0ZXh0IDogJ0hlbGxvJyxcblx0XHRcdFx0c2l6ZSA6IDFcblx0XHRcdH0sXG5cdFx0XHR7XG5cdFx0XHRcdHRleHQgOiAnTW9udHLDqWFsJyxcblx0XHRcdFx0c2l6ZSA6IDEuMixcblx0XHRcdFx0YXBwZW5kIDogZnVuY3Rpb24oRGVjb3JhdGl2ZUxpbmVzKXtcblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0c3ltYm9sOiBEZWNvcmF0aXZlTGluZXMuZ2V0U3ltYm9sKCd3b3JkRGVjb3JhdGlvbkVuZCcpLmdldFBhdGhzKClbMF0sXG5cdFx0XHRcdFx0XHRzaXplOiAxIC8vaGVpZ2h0IGluIGVtXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdF07XG5cblxuXHRcdHZhciBzdGFnZSA9IFN0YWdlLmdldFN0YWdlKCdzdmcnKTtcblx0XHR2YXIgdGwgPSBXcml0ZU5hbWVzLmdldFRpbWVsaW5lKHdvcmRzLCBzdGFnZSk7XG5cdFx0dGwucGxheSgpO1xuXHR9O1xuXG5cblxuXHR2YXIgYnRuID0gJCgnI2N0cmwnKTtcblxuXHRidG4ub24oJ2NsaWNrLmFscGhhYmV0JywgZnVuY3Rpb24oKXtcblx0XHRyZWFkeS50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG5cblx0Ly9wYXJzZSBsZXMgZWFzZXBvaW50cyBkZSBjaGFxdWUgbGV0dHJlLCBvdXRwdXQgZW4gSlNPTiAow6Agc2F2ZXIpXG5cdHZhciBwcmludEVhc2Vwb2ludHMgPSBmdW5jdGlvbigpe1xuXHRcdC8vRW1pbGllRm9udFxuXHRcdC8vRGVjb3JhdGl2ZUxpbmVzXG5cblx0XHR2YXIgRW1pbGllRm9udCA9IHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzJyk7XG5cdFx0dmFyIERlY29yYXRpdmVMaW5lcyA9IHJlcXVpcmUoJy4vRGVjb3JhdGl2ZUxpbmVzJyk7XG5cdFx0UGF0aEVhc2Vwb2ludHMoU3RhZ2UuZ2V0U3RhZ2UoJ3N2ZycpLCBEZWNvcmF0aXZlTGluZXMuZ2V0QWxsKCksICQoJyNicnAnKSk7XG5cdH07XG5cblx0dmFyIGdldEJwciA9ICQoJyNnZXRicnAnKTtcblxuXHRnZXRCcHIub24oJ2NsaWNrLmFscGhhYmV0JywgZnVuY3Rpb24oKXtcblx0XHRyZWFkeS50aGVuKHByaW50RWFzZXBvaW50cyk7XG5cdH0pO1xuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9hbmltYXRpb25zL1dyaXRlTmFtZXMnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KFxuXHQgICAgXHRyZXF1aXJlKCdqcXVlcnknKSxcblx0ICAgIFx0cmVxdWlyZSgnbG9kYXNoJyksXG5cdCAgICBcdHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzJyksXG5cdCAgICBcdHJlcXVpcmUoJy4vRGVjb3JhdGl2ZUxpbmVzJyksXG5cdCAgICBcdHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9EcmF3UGF0aCcpLFxuXHQgICAgXHRyZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZCcpLFxuXHQgICAgXHRyZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwJyksXG5cdCAgICBcdHJlcXVpcmUoJ3JhcGhhZWwnKSxcblx0ICAgIFx0cmVxdWlyZSgnZ3NhcCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5fKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoJCwgXywgRW1pbGllRm9udCwgRGVjb3JhdGl2ZUxpbmVzLCBEcmF3UGF0aCwgVmVjdG9yV29yZCwgUGF0aEdyb3VwLCBSYXBoYWVsLCBUd2Vlbk1heCkge1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBkZWZhdWx0U2V0dGluZ3MgPSB7XG5cdFx0Y29sb3I6ICcjNDQ0NDQ0Jyxcblx0XHRzdHJva2U6IDIsXG5cdFx0bGluZUhlaWdodDogMS4yLFxuXHRcdHNwZWVkOiAyNTAgLy9weCBwZXIgc2Vjb25kXG5cdH07XG5cblx0dmFyIGdldEFwcGVuZCA9IGZ1bmN0aW9uKHBhdGhzLCBhcHBlbmQpe1xuXHRcdHZhciBjdXJ2ZSA9IGFwcGVuZC5zeW1ib2w7XG5cdFx0XG5cdFx0Ly90cm91dmUgbGVzIHBvaW50cyBkZSBkw6lwYXJ0IGV0IGQnYXJyaXbDqWUgZGUgbGEgY3VydmVcblx0XHR2YXIgY3VydmVTdHIgPSBjdXJ2ZS5nZXRTVkdTdHJpbmcoKTtcblx0XHR2YXIgc3RhcnRQb3MgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgoY3VydmVTdHIsIDApO1xuXHRcdHZhciBlbmRQb3MgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgoY3VydmVTdHIsIGN1cnZlLmdldExlbmd0aCgpKTtcblxuXHRcdHZhciB3b3JkUGF0aHMgPSBwYXRocy5nZXRQYXRocygpO1xuXHRcdC8vdHJvdXZlIGxlIHBhdGggcXVpIGZpbml0IGxlIHBsdXMgw6AgZHJvaXRlIGRhbnMgbGVzIGxldHRyZXNcblx0XHR2YXIgbGFzdFBhdGggPSB3b3JkUGF0aHMucmVkdWNlKGZ1bmN0aW9uKGxhc3QsIGN1cil7XG5cdFx0XHRpZighbGFzdCkgcmV0dXJuIGN1cjtcblx0XHRcdC8vc2kgbGUgcGF0aCBzZSBmaW5pdCBwbHVzIMOgIGRyb2l0ZSBFVCBxdSdpbCBhIHVuIG5vbSAobGVzIGTDqXRhaWxzIGdlbnJlIGJhcnJlIGR1IHQgZXQgcG9pbnQgZGUgaSBuJ29udCBwYXMgZGUgbm9tKVxuXHRcdFx0aWYoY3VyLm5hbWUgJiYgbGFzdC5nZXRCb3VuZGluZygpLngyIDwgY3VyLmdldEJvdW5kaW5nKCkueDIpe1xuXHRcdFx0XHRsYXN0ID0gY3VyO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGxhc3Q7XG5cdFx0fSwgbnVsbCk7XG5cblx0XHR2YXIgd29yZEVuZFBvcyA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChsYXN0UGF0aC5nZXRTVkdTdHJpbmcoKSwgbGFzdFBhdGguZ2V0TGVuZ3RoKCkpO1xuXG5cdFx0Ly9wb3NpdGlvbiBhYnNvbHVlIGR1IHBvaW50IGRlIGTDqXBhcnQgZHUgcGF0aFxuXHRcdHZhciBhYnNTdGFydFBvcyA9IHtcblx0XHRcdHg6IHdvcmRFbmRQb3MueCAtIHN0YXJ0UG9zLngsXG5cdFx0XHR5OiB3b3JkRW5kUG9zLnkgLSBzdGFydFBvcy55XG5cdFx0fTtcblxuXHRcdC8qc2hvd1BvaW50KHt4OndvcmRFbmRQb3MueHgsIHk6d29yZEVuZFBvcy55fSwgJyMyMmZmMDAnKTtcblx0XHRzaG93UG9pbnQoYWJzU3RhcnRQb3MsICcjZmYwMDAwJyk7LyoqL1xuXG5cdFx0Ly/DoCBjb21iaWVuIGRlIGRpc3RhbmNlIGxlIGJvdXRlIGVzdCBkdSBkw6lidXRcblx0XHR2YXIgcmVsRW5kUG9zID0ge1xuXHRcdFx0eDogZW5kUG9zLnggLSBzdGFydFBvcy54LFxuXHRcdFx0eTogZW5kUG9zLnkgLSBzdGFydFBvcy55XG5cdFx0fTtcblxuXHRcdC8vw6AgcXVlbCBlbmRyb2l0IG9uIGRvaXQgZmFpcmUgYXJyaXZlciBsZSBlbmRwb3MsIHJlbGF0aWYgYXUgZMOpYnV0IGR1IHBhdGhcblx0XHR2YXIgdGFyZ2V0UmVsRW5kUG9zID0ge1xuXHRcdFx0eDogLSB3b3JkRW5kUG9zLngsXG5cdFx0XHR5OiBhcHBlbmQuc2l6ZSAqIEVtaWxpZUZvbnQuZ2V0VXBwZXJMaW5lSGVpZ2h0KClcblx0XHR9O1xuXG5cdFx0dmFyIHJhdGlvID0ge1xuXHRcdFx0eCA6IHRhcmdldFJlbEVuZFBvcy54IC8gcmVsRW5kUG9zLngsXG5cdFx0XHR5IDogdGFyZ2V0UmVsRW5kUG9zLnkgLyByZWxFbmRQb3MueSxcblx0XHR9O1xuXHRcdC8qY29uc29sZS5sb2coJ3N0YXJ0IGF0JyxhYnNTdGFydFBvcyk7XG5cdFx0Y29uc29sZS5sb2codGFyZ2V0UmVsRW5kUG9zKTtcblx0XHRjb25zb2xlLmxvZyhyYXRpbywgY3VycmVudEVuZFBvcyk7KiovXG5cblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS5zY2FsZShyYXRpby54LCByYXRpby55LCBhYnNTdGFydFBvcy54K3N0YXJ0UG9zLngsIGFic1N0YXJ0UG9zLnkpO1xuXHRcdG0udHJhbnNsYXRlKGFic1N0YXJ0UG9zLngsIGFic1N0YXJ0UG9zLnkpO1xuXHRcdGN1cnZlID0gY3VydmUuYXBwbHlNYXRyaXgobSk7XG5cblx0XHRsYXN0UGF0aC5hcHBlbmQoY3VydmUpO1xuXG5cdFx0cmV0dXJuIHBhdGhzO1xuXG5cdH07XG5cdFxuXHR2YXIgZ2V0V29yZHMgPSBmdW5jdGlvbih3b3JkcywgbGluZUhlaWdodCkge1xuXHRcdHZhciB0b3AgPSAwO1xuXHRcdHJldHVybiB3b3Jkcy5tYXAoZnVuY3Rpb24od29yZCwgbGluZU51bSl7XG5cblx0XHRcdHZhciBwYXRocyA9IFZlY3RvcldvcmQuZ2V0UGF0aHMoRW1pbGllRm9udCwgd29yZC50ZXh0KTtcblx0XHRcdHBhdGhzID0gcGF0aHMuc2NhbGUod29yZC5zaXplKTtcblxuXHRcdFx0Ly9jZW50ZXIgdGV4dFxuXHRcdFx0dmFyIHdpZHRoID0gcGF0aHMuZ2V0V2lkdGgoKTtcblx0XHRcdHZhciBsZWZ0ID0gLSB3aWR0aCAvIDI7XG5cblx0XHRcdHBhdGhzLnNldE9mZnNldChsZWZ0LCB0b3ApO1xuXHRcdFx0XG5cdFx0XHR0b3AgKz0gRW1pbGllRm9udC5nZXRVcHBlckxpbmVIZWlnaHQoKSAqIGxpbmVIZWlnaHQ7XG5cblx0XHRcdC8vYWpvdXRlIGxlIGd1aWRpIHN1ciBsZSBkZXJuaWVyIG1vdFxuXHRcdFx0aWYod29yZC5hcHBlbmQpIHtcblx0XHRcdFx0cGF0aHMgPSBnZXRBcHBlbmQocGF0aHMsIHdvcmQuYXBwZW5kKERlY29yYXRpdmVMaW5lcykpO1xuXHRcdFx0fVxuXG5cdFx0XHR3b3JkLnBhdGhzID0gcGF0aHM7XG5cblx0XHRcdHJldHVybiB3b3JkO1xuXG5cdFx0fSk7XG5cdH07XG5cblxuXHQvL3Ryb3V2ZSBsZSBib3VuZGluZyBib3ggZGUgbCdlbnNlbWJsZSBkZXMgcGF0aHMsIHMnZW4gc2VydmlyYSBwb3VyIHMnYXNzdXJlciBxdWUgw6dhIGVudHJlIHRvdWpvdXJzIGRhbnMgbGUgc3RhZ2Vcblx0dmFyIGdldEJvdW5kaW5nID0gZnVuY3Rpb24od29yZHMpe1xuXHRcdHJldHVybiB3b3Jkcy5yZWR1Y2UoZnVuY3Rpb24oZywgdyl7XG5cdFx0XHR3LnBhdGhzLmdldFBhdGhzKCkuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0Zy5hZGRQYXRoKHApO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gZztcblx0XHR9LCBQYXRoR3JvdXAuZmFjdG9yeSgpKS5nZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdHJldHVybiB7XG5cdFx0Z2V0VGltZWxpbmUgOiBmdW5jdGlvbih3b3Jkcywgc3RhZ2UsIHNldHRpbmdzKSB7XG5cdFx0XHRzZXR0aW5ncyA9IF8uZXh0ZW5kKHt9LCBkZWZhdWx0U2V0dGluZ3MsIHNldHRpbmdzKTtcblx0XHRcdHdvcmRzID0gZ2V0V29yZHMod29yZHMsIHNldHRpbmdzLmxpbmVIZWlnaHQpO1xuXHRcdFx0dmFyIGJvdW5kaW5nID0gZ2V0Qm91bmRpbmcod29yZHMpO1xuXG5cdFx0XHR2YXIgbGF5ZXIgPSBzdGFnZS5nZXROZXdMYXllcigpO1xuXG5cdFx0XHQvKmxheWVyLnNob3dQb2ludCh7eDpib3VuZGluZy54LCB5OmJvdW5kaW5nLnl9KTtcblx0XHRcdGxheWVyLnNob3dQb2ludCh7eDpib3VuZGluZy54MiwgeTpib3VuZGluZy55Mn0pOy8qKi9cblx0XHRcdC8vY29uc29sZS5sb2coYm91bmRpbmcpO1xuXG5cdFx0XHR2YXIgcmVzaXplU2V0ID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciBwYWRkaW5nID0gMC4xOy8vJVxuXHRcdFx0XHR2YXIgVyA9IDAsIEggPSAwO1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHQvL2lmKHN0YWdlLndpZHRoID09PSBXICYmIHN0YWdlLmhlaWdodCA9PT0gSCkgIHJldHVybjtcblxuXHRcdFx0XHRcdFcgPSBzdGFnZS53aWR0aCgpICogKDEtcGFkZGluZyk7XG5cdFx0XHRcdFx0SCA9IHN0YWdlLmhlaWdodCgpICogKDEtcGFkZGluZyk7XG5cblx0XHRcdFx0XHR2YXIgc2NhbGUgPSBXIC8gYm91bmRpbmcud2lkdGg7XG5cdFx0XHRcdFx0dmFyIHRhcmdldEggPSBib3VuZGluZy5oZWlnaHQgKiBzY2FsZTtcblx0XHRcdFx0XHRpZih0YXJnZXRIID4gSCl7XG5cdFx0XHRcdFx0XHRzY2FsZSA9IEggLyBib3VuZGluZy5oZWlnaHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdHZhciB0YXJnZXRMZWZ0ID0gKHN0YWdlLndpZHRoKCkgKiBwYWRkaW5nICogMC41KSArICgoVyAtIGJvdW5kaW5nLndpZHRoKSAvIDIpIC0gYm91bmRpbmcueDtcblx0XHRcdFx0XHR2YXIgdGFyZ2V0VG9wID0gLShzdGFnZS5oZWlnaHQoKSAqIHBhZGRpbmcgKiAwLjUpICsgKHN0YWdlLmhlaWdodCgpIC0gKCBib3VuZGluZy55ICsgKGJvdW5kaW5nLmhlaWdodCpzY2FsZSkpKTtcblx0XHRcdFx0XHRsYXllci50cmFuc2Zvcm0oJ3QnK3RhcmdldExlZnQrJywnK3RhcmdldFRvcCsncycrc2NhbGUrJywnK3NjYWxlKycsMCwwJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pKCk7XG5cblx0XHRcdHN0YWdlLm9uUmVzaXplLnByb2dyZXNzKHJlc2l6ZVNldCk7XG5cblx0XHRcdHZhciB0bCA9IHdvcmRzLnJlZHVjZShmdW5jdGlvbih0bCwgd29yZCwgbGluZU51bSl7XG5cdFx0XHRcdHJldHVybiBEcmF3UGF0aC5ncm91cCh3b3JkLnBhdGhzLmdldFBhdGhzKCksIGxheWVyLCB7XG5cdFx0XHRcdFx0cHhQZXJTZWNvbmQgOiBzZXR0aW5ncy5zcGVlZCAqIHdvcmQuc2l6ZSxcblx0XHRcdFx0XHRjb2xvciA6IHNldHRpbmdzLmNvbG9yLFxuXHRcdFx0XHRcdHN0cm9rZVdpZHRoIDogc2V0dGluZ3Muc3Ryb2tlLFxuXHRcdFx0XHRcdGVhc2luZyA6IGdzYXAuU2luZS5lYXNlSW5PdXRcblx0XHRcdFx0fSwgdGwpO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe3BhdXNlZDp0cnVlLCBvblVwZGF0ZTogcmVzaXplU2V0fSkpO1xuXHRcdFx0Ly90bC50aW1lU2NhbGUoMC4yKTtcblx0XHRcdHJldHVybiB0bDtcblxuXHRcdH0sXG5cblx0XHRsb2FkIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAkLndoZW4oRW1pbGllRm9udC5sb2FkKCksIERlY29yYXRpdmVMaW5lcy5sb2FkKCkpO1xuXHRcdH1cblx0fTtcblxufSkpOyIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnLi9QYXRoJyksIHJlcXVpcmUoJy4vUGF0aEdyb3VwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aCwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGhHcm91cCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIFBhdGgsIFBhdGhHcm91cCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXG5cdHZhciBzcGVjaWFsQ2hhcnMgPSB7XG5cdFx0J194MkRfJyA6ICctJyxcblx0XHQnX3gyRV8nIDogJy4nXG5cdH07XG5cblx0dmFyIEFscGhhYmV0ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgc2V0dGluZ3M7XG5cdFx0dmFyIHN5bWJvbHMgPSB7fTtcblxuXG5cdFx0dmFyIHBhcnNlU1ZHID0gZnVuY3Rpb24oZGF0YSl7XG5cblx0XHRcdC8vY29uc29sZS5sb2coZGF0YSk7XG5cdFx0XHR2YXIgZG9jID0gJChkYXRhKTtcblx0XHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdFx0bGF5ZXJzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0XHR2YXIgbGF5ZXIgPSAkKGVsKTtcblx0XHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblx0XHRcdFx0aWQgPSBzcGVjaWFsQ2hhcnNbaWRdIHx8IGlkO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGlkKTtcblx0XHRcdFx0Ly9pZihpZC5sZW5ndGggPiAxKSByZXR1cm47XG5cdFx0XHRcdHZhciBwYXRocyA9IGxheWVyLmZpbmQoJ3BhdGgnKTtcblx0XHRcdFx0aWYocGF0aHMubGVuZ3RoPT09MCkgcmV0dXJuO1xuXG5cdFx0XHRcdHZhciBzeW1ib2wgPSBzeW1ib2xzW2lkXSA9IG5ldyBQYXRoR3JvdXAoaWQpO1xuXG5cdFx0XHRcdHBhdGhzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0XHRcdHZhciBwYXRoRWwgPSAkKGVsKTtcblx0XHRcdFx0XHR2YXIgcCA9IFBhdGguZmFjdG9yeSggcGF0aEVsLmF0dHIoJ2QnKSwgcGF0aEVsLmF0dHIoJ2lkJyksIG51bGwsIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdICYmIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdW2ldKS5zY2FsZShzZXR0aW5ncy5zY2FsZSB8fCAxKTtcdFx0XHRcdFxuXHRcdFx0XHRcdHN5bWJvbC5hZGRQYXRoKCBwICk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly90cm91dmUgbGUgdG9wIGFic29sdSAodG9wIGRlIGxhIGxldHRyZSBsYSBwbHVzIGhhdXRlKVxuXHRcdFx0dmFyIHRvcCA9IE9iamVjdC5rZXlzKHN5bWJvbHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIHN5bWJvbE5hbWUpe1xuXHRcdFx0XHR2YXIgdCA9IHN5bWJvbHNbc3ltYm9sTmFtZV0uZ2V0VG9wKCk7XG5cdFx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IHQpIHtcblx0XHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtaW47XG5cdFx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhzeW1ib2xzKTtcblxuXHRcdFx0Ly9hanVzdGUgbGUgYmFzZWxpbmUgZGUgY2hhcXVlIGxldHRyZVxuXHRcdFx0T2JqZWN0LmtleXMoc3ltYm9scykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0c3ltYm9sc1trZXldLnNldE9mZnNldCgtMSAqIHN5bWJvbHNba2V5XS5nZXRMZWZ0KCksIC0xICogdG9wKTtcblx0XHRcdH0pO1xuXG5cblx0XHR9O1xuXG5cdFx0dmFyIGRvTG9hZCA9IGZ1bmN0aW9uKGJhc2VQYXRoKXtcblx0XHRcdHZhciBsb2FkaW5nID0gJC5hamF4KHtcblx0XHRcdFx0dXJsIDogKChiYXNlUGF0aCAmJiBiYXNlUGF0aCsnLycpIHx8ICcnKSArIHNldHRpbmdzLnN2Z0ZpbGUsXG5cdFx0XHRcdGRhdGFUeXBlIDogJ3RleHQnXG5cdFx0XHR9KTtcblxuXHRcdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2Vycm9yIGxvYWQnKTtcblx0XHRcdFx0Y29uc29sZS5sb2coYik7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYS5yZXNwb25zZVRleHQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHRcdH07XG5cblx0XHRcblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbihzKSB7XG5cdFx0XHRzZXR0aW5ncyA9IHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXG5cdFx0dGhpcy5sb2FkID0gZnVuY3Rpb24oYmFzZVBhdGgpIHtcblx0XHRcdHJldHVybiBkb0xvYWQoYmFzZVBhdGgpO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXRTeW1ib2wgPSBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBzeW1ib2xzW2xdO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXROU3BhY2UgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRMb3dlckxpbmVIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0SGVpZ2h0KCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0VXBwZXJMaW5lSGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzeW1ib2xzWydOJ10gJiYgc3ltYm9sc1snTiddLmdldEhlaWdodCgpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3ltYm9scztcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0dmFyIGluc3RhbmNlcyA9IHt9O1xuXHRBbHBoYWJldC5mYWN0b3J5ID0gZnVuY3Rpb24oc2V0dGluZ3Mpe1xuXHRcdHZhciBzdmcgPSBzZXR0aW5ncy5zdmdGaWxlO1xuXHRcdGluc3RhbmNlc1tzdmddID0gaW5zdGFuY2VzW3N2Z10gfHwgKG5ldyBBbHBoYWJldCgpKS5pbml0KHNldHRpbmdzKTtcblx0XHRyZXR1cm4gaW5zdGFuY2VzW3N2Z107XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9EcmF3UGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpLCByZXF1aXJlKCdnc2FwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuXywgcm9vdC5SYXBoYWVsLCAocm9vdC5HcmVlblNvY2tHbG9iYWxzIHx8IHJvb3QpKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoXywgUmFwaGFlbCwgVHdlZW5NYXgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9nc2FwIGV4cG9ydHMgVHdlZW5NYXhcblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdGNvbG9yOiAnIzAwMDAwMCcsXG5cdFx0c3Ryb2tlV2lkdGggOiAwLjYsXG5cdFx0cHhQZXJTZWNvbmQgOiAxMDAsIC8vc3BlZWQgb2YgZHJhd2luZ1xuXHRcdGVhc2luZyA6IGdzYXAuUXVhZC5lYXNlSW5cblx0fTtcblxuXHQvL2hlbHBlclxuXG5cdHZhciBEcmF3UGF0aCA9IHtcblxuXHRcdHNpbmdsZSA6IGZ1bmN0aW9uKHBhdGgsIGxheWVyLCBwYXJhbXMpe1xuXHRcdFx0XG5cdFx0XHR2YXIgc2V0dGluZ3MgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cdFx0XHR2YXIgcGF0aFN0ciA9IHBhdGguZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gcGF0aC5nZXRMZW5ndGgoKTtcblxuXHRcdFx0dmFyIHB4UGVyU2Vjb25kID0gc2V0dGluZ3MucHhQZXJTZWNvbmQ7XG5cdFx0XHR2YXIgdGltZSA9IGxlbmd0aCAvIHB4UGVyU2Vjb25kO1xuXG5cdFx0XHR2YXIgYW5pbSA9IHtkaXN0YW5jZTogMH07XG5cdFx0XHRcblx0XHRcdHZhciB1cGRhdGUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZygndXBkYXRlJyk7XG5cdFx0XHRcdHZhciBlbDtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0dmFyIHBhdGhQYXJ0ID0gcGF0aC5nZXRTdmdTdWIoMCwgYW5pbS5kaXN0YW5jZSwgdHJ1ZSk7XG5cdFx0XHRcdFx0bGF5ZXIucmVtb3ZlKGVsKTtcblx0XHRcdFx0XHRlbCA9IGxheWVyLmFkZCgncGF0aCcsIHBhdGhQYXJ0KTtcblx0XHRcdFx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzZXR0aW5ncy5zdHJva2VXaWR0aCwgc3Ryb2tlOiBzZXR0aW5ncy5jb2xvcn0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSkoKTtcblxuXHRcdFx0dmFyIGVhc2VQb2ludHMgPSBwYXRoLmdldEVhc2Vwb2ludHMoKTtcblx0XHRcdC8qY29uc29sZS5sb2coZWFzZVBvaW50cy5sZW5ndGgpO1xuXHRcdFx0ZWFzZVBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHRcdGxheWVyLnNob3dQb2ludChwLCAnI2ZmMDAwMCcsIDIpO1xuXHRcdFx0fSk7LyoqL1xuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHRyZXR1cm4gZWFzZVBvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIHB4UGVyU2Vjb25kO1xuXHRcdFx0XHRsYXN0ID0gZGlzdDtcblx0XHRcdFx0cmV0dXJuIHRsLnRvKGFuaW0sIHRpbWUsIHtkaXN0YW5jZTogZGlzdCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe1xuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZVxuXHRcdFx0fSkpLnRvKGFuaW0sICgobGVuZ3RoIC0gKGVhc2VQb2ludHMubGVuZ3RoICYmIGVhc2VQb2ludHNbZWFzZVBvaW50cy5sZW5ndGgtMV0pKSAvIHB4UGVyU2Vjb25kKSwge2Rpc3RhbmNlOiBsZW5ndGgsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdFxuXHRcdH0sXG5cblx0XHRncm91cCA6IGZ1bmN0aW9uKHBhdGhzLCBsYXllciwgc2V0dGluZ3MsIHRsKSB7XG5cdFx0XHRyZXR1cm4gcGF0aHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBwYXRoKXtcblx0XHRcdFx0cmV0dXJuIHRsLmFwcGVuZChEcmF3UGF0aC5zaW5nbGUocGF0aCwgbGF5ZXIsIHNldHRpbmdzKSk7XG5cdFx0XHR9LCB0bCB8fCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7cGF1c2VkOnRydWV9KSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIERyYXdQYXRoO1xuXHRcbn0pKTtcblxuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCcuL0FscGhhYmV0JykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KGxhZ3JhbmdlLmRyYXdpbmcuQWxwaGFiZXQpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChBbHBoYWJldCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL29yaWdpbmFsIHNjYWxlIGZhY3RvclxuXHR2YXIgRW1pbGllRm9udCA9IHtcblx0XHRzY2FsZSA6IDEsXG5cdFx0c3ZnRmlsZSA6ICdhc3NldHMvZW1pbGllRm9udC5zdmcnLFxuXHRcdC8vUEFSU8OJIGF2ZWMgbGUgaGVscGVyXG5cdFx0ZWFzZXBvaW50cyA6IHtcIsOUXCI6W251bGwsWzAuNTU4NDkxNDkxOTc2MTgyNF1dLFwiw49cIjpbWzAuMjkwMTYzNTQ5NjM2MTM4NTVdXSxcIsOOXCI6W1swLjI5NjU0MDc3MDUwNzI2MjVdLFswLjU0Njc4MTUwNDU2MDk4NzddXSxcIsOLXCI6W1swLjUwNzcwOTY3ODg2MDQ1NDldXSxcIsOKXCI6W1swLjUwNzcwOTY3ODg2MDQ1NDldLFswLjU3NzI5NzYwNzcxMDk5MTRdXSxcIsOIXCI6W1swLjUwNzcwOTY3ODg2MDQ1NDhdXSxcIsOJXCI6W1swLjUwNzcwOTY3ODg2MDQ1NDldXSxcIsOHXCI6W251bGwsWzAuMjU5ODQxMTU1NDkwMzcyOF1dLFwiw4RcIjpbWzAuNjMzNjgxNDcyNDk3MTU2M11dLFwiw4JcIjpbWzAuNjMzNjgxNDcyNDk3MTUzOV0sbnVsbCxbMC41MDkwODg2ODA3OTcyNjUzXV0sXCLDgFwiOltbMC42MzM2ODE0NzI0OTcxNTE1XV0sXCJaXCI6W1swLjQzMzk3MjUxNjYxNDg2ODc0LDAuNzY0NTExMTY5MTY2MDkwMV1dLFwiWVwiOltbMC41NzIxMjg4NzY1NTgyMTU4XV0sXCJXXCI6W1swLjM5MDU5MDE5MTU2NzMwMTk2LDAuNTc4MTQyMzA5OTg1MDgxM11dLFwiVlwiOltbMC42MDg0MTA1OTAyNzMwMzczXV0sXCJVXCI6W1swLjcwMTk5NzA0MTY4NDMxNTJdXSxcIlJcIjpbWzAuNzIwOTIyMzUxNjI1MjUzM11dLFwiT1wiOltbMC43NDM4ODM1ODE4NDc2NDc2XV0sXCJOXCI6W1swLjUyMjAxNDIxMzE3ODMxOTUsMC43Mzk2OTYyNTM0OTE1NDZdXSxcIk1cIjpbWzAuNDIzMDI2NzU2NTc0OTQ0NywwLjYwMDc2OTA5MTI3MDI5OTYsMC44MDMzOTUzNTI4MjMwMDQyXV0sXCJMXCI6W1swLjY3NTc5MTE5NzA5NDYyMl1dLFwiS1wiOltbMC40MTc2MTg0MTc2NTkzNDc0XSxbMC40OTc0Njc1ODk1OTY2NjkyXV0sXCJKXCI6W1swLjMwNTI2MjAyODYwOTUwMDk3XV0sXCJIXCI6W1swLjQ0NDEyMzEwMDkwNjc4Njk3XV0sXCJHXCI6W1swLjU2NTk4OTg3NTQ1NTczMV1dLFwiRVwiOltbMC41MDc3MTQyMzk0MTkwOTNdXSxcIkRcIjpbWzAuNzQzNzg3NjA5MzQ1OTkwM11dLFwiQlwiOltbMC43NDcyNTgxMzkzOTQ4Mjg1XV0sXCJBXCI6W1swLjYzMzY4MTQ3MjQ5NzE1NTNdXSxcIsO0XCI6W1swLjg3MzM5NDI3NTA3MDczMjRdLFswLjU0Njc4MTUwNDU2MTAxNDhdXSxcIsO2XCI6W1swLjg3MzM5NDI3NTA3MDcyNzZdXSxcIsOvXCI6W1swLjUzOTY0OTcwMTkwNDI4NDJdXSxcIsOuXCI6W1swLjUzOTY0OTcwMTkwNDI4NDddLFswLjU0NDY2OTg0Mjk0NzAyODldXSxcIsOrXCI6W1swLjQwMTkzMzIyNTgwMTQ1NThdXSxcIsOqXCI6W1swLjQwMTkzMzIyNTgwMTQ1NThdLFswLjU3MzA4ODIzMjEwNTM2NTNdXSxcIsOoXCI6W1swLjQwMTkzMzIyNTgwMTQ1Nl1dLFwiw6lcIjpbWzAuNDAxOTMzMjI1ODAxNDU4NF1dLFwiw6dcIjpbWzAuNTMzMDU5MTEyMjY4NTM5M10sWzAuMjU5ODQxMTU1NDkwMzcxNDZdXSxcIsOkXCI6W1swLjM0OTQwNDMwOTgyODE5ODI2LDAuODQ0OTIzMTQ5MjIwOTE1N11dLFwiw6JcIjpbWzAuMzQ5NDA0MzA5ODI4MjAwMTQsMC44NDQ5MjMxNDkyMjA5MjAzXSxbMC41MTQyMTIzNzYxMTIwMjAxXV0sXCLDoFwiOltbMC4zNDk0MDQzMDk4MjgyMDMwMywwLjg0NDkyMzE0OTIyMDkyNzRdXSxcInpcIjpbWzAuMzY1OTIyMjc3MTk0MTY2LDAuNjk4NTc4ODkyODI1MjI1OV1dLFwieVwiOltbMC4xMjY4MjIxNTkzMzUwODE0LDAuMzUwMjcwNzI1NzgyNjA1NzYsMC42ODU0NDM1NzU0NTM4OTIzXV0sXCJ4XCI6W1swLjQxOTE5ODA4MTA3OTAxODRdXSxcIndcIjpbWzAuMTc4MDEzMjk5MjEzMzIyNzMsMC41MDEyNDc5NzQxMDA2NzE5LDAuODI5MTY3MjA5NDkzNjM0OF1dLFwidlwiOltbMC41NTM2MDkyNDk4NTIwODM3XV0sXCJ1XCI6W1swLjIyNzU2ODEzMjAwOTg5OTUzLDAuNzI0MDgwNDIwMDMxNDk4NV1dLFwidFwiOltbMC40OTM3MjkwMzMwNTUxNzIxM11dLFwic1wiOltbMC4zNTEzOTkzODE1OTU0OTEzMywwLjc3MzA3ODYzOTUxMDA4MDldXSxcInJcIjpbWzAuNTQ2MTI0NjUxNjA0ODkzN11dLFwicVwiOltbMC40MjAyNzgxMTA5NDUwNjE4LDAuOTQ4NTQ0MzQ3NjE5MDYzXV0sXCJwXCI6W1swLjEzOTI5NDg3NjU5ODE0OTM1LDAuNzU4NjU5NTk1NzU3Nzc3N11dLFwib1wiOltbMC44NzE5MDc5MDA5Mjg3NDg1XV0sXCJuXCI6W1swLjc2NzAxNzM2OTY0ODgxNTddXSxcIm1cIjpbWzAuNTI1MzYwMjU2MTI5ODgwNl1dLFwibFwiOltbMC40OTI4MjIwNDY3NDU2MjA3XV0sXCJrXCI6W1swLjM1ODkyMjkxMDkzODMyNTEsMC42Nzg4OTI5NDc4MjEzMjgxLDAuOTA5ODI3ODQ0MDA2NDUyMV1dLFwialwiOltbMC4xOTEwMTIxNzEzNDM4NzUxXV0sXCJpXCI6W1swLjUzOTY0OTcwMTkwNDI4NjJdXSxcImhcIjpbWzAuMzk0ODM2NzgzNzcyMDI1NiwwLjc0NzQ3NzI3MDA0MTY5NzMsMC44ODMxMDgyMjYyOTkyNjMzXV0sXCJnXCI6W1swLjE3MTUzOTU4ODc3MjY1MSwwLjQxNDU1NDAwNjIwMDU3MzI2XV0sXCJmXCI6W1swLjI5NDAyMTg0Njg3NzcwNTIsMC45MTkzNjY4MTk3MTQ2MTU1XV0sXCJkXCI6W1swLjE1OTM1Njk1NDI3Mjk3NDM2LDAuNjU0MjAyMjMzMzMxMTU3OV1dLFwiY1wiOltbMC41MzMwNTkxMTIyNjg1Mzk0XV0sXCJiXCI6W1swLjQwMzkyMjA1ODIwMTQzMDg0LDAuOTMyODY3NjEwNjA4MDY2Nl1dLFwiYVwiOltbMC4zNDk0MDQzMDk4MjgxOTk3LDAuODQ0OTIzMTQ5MjIwOTE5M11dfVxuXHR9O1xuXG5cblx0cmV0dXJuICBBbHBoYWJldC5mYWN0b3J5KEVtaWxpZUZvbnQpOztcblx0XG59KSk7IiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdyYXBoYWVsJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuUmFwaGFlbCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKFJhcGhhZWwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHJlZyA9IC8oW2Etel0pKFswLTlcXHNcXCxcXC5cXC1dKykvZ2k7XG5cdFx0XG5cdC8vZXhwZWN0ZWQgbGVuZ3RoIG9mIGVhY2ggdHlwZVxuXHR2YXIgZXhwZWN0ZWRMZW5ndGhzID0ge1xuXHRcdG0gOiAyLFxuXHRcdGwgOiAyLFxuXHRcdHYgOiAxLFxuXHRcdGggOiAxLFxuXHRcdGMgOiA2LFxuXHRcdHMgOiA0XG5cdH07XG5cblx0dmFyIFBhdGggPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cykge1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0Ly9pZihzdmcpIGNvbnNvbGUubG9nKHN2ZywgcGFyc2VkKTtcblx0XHR0aGlzLmVhc2VQb2ludHMgPSBlYXNlUG9pbnRzIHx8IFtdO1xuXHRcdC8vY29uc29sZS5sb2cobmFtZSwgZWFzZVBvaW50cyk7XG5cdFx0dGhpcy5fc2V0UGFyc2VkKHBhcnNlZCB8fCB0aGlzLl9wYXJzZShzdmcpKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5fc2V0UGFyc2VkID0gZnVuY3Rpb24ocGFyc2VkKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJzZWQpO1xuXHRcdHRoaXMuc3ZnID0gbnVsbDtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmN1YmljIHx8IHRoaXMuX3BhcnNlQ3ViaWMoKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLmdldFRvdGFsTGVuZ3RoKHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIGFuIFNWRyBzdHJpbmcgb2YgdGhlIHBhdGggc2VnZW1udHMuIEl0IGlzIG5vdCB0aGUgc3ZnIHByb3BlcnR5IG9mIHRoZSBwYXRoLCBhcyBpdCBpcyBwb3RlbnRpYWxseSB0cmFuc2Zvcm1lZFxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5zdmcgPSB0aGlzLnN2ZyB8fCB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oc3ZnLCBzZWdtZW50KXtcblx0XHRcdHJldHVybiBzdmcgKyBzZWdtZW50LnR5cGUgKyBzZWdtZW50LmFuY2hvcnMuam9pbignLCcpOyBcblx0XHR9LCAnJyk7XG5cdH07XG5cblx0LyoqXG5cdEdldHMgdGhlIGFic29sdXRlIHBvc2l0aW9ucyBhdCB3aGljaCB3ZSBoYXZlIGVhc2UgcG9pbnRzICh3aGljaCBhcmUgcHJlcGFyc2VkIGFuZCBjb25zaWRlcmVkIHBhcnQgb2YgdGhlIHBhdGgncyBkZWZpbml0aW9ucylcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0RWFzZXBvaW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsID0gdGhpcy5nZXRMZW5ndGgoKTtcblx0XHRyZXR1cm4gdGhpcy5lYXNlUG9pbnRzLm1hcChmdW5jdGlvbihlKXtcblx0XHRcdHJldHVybiBlICogbDtcblx0XHR9KTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRQb2ludCA9IGZ1bmN0aW9uKGlkeCkge1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5wYXJzZWQpO1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZFtpZHhdICYmIHRoaXMucGFyc2VkW2lkeF0uYW5jaG9ycztcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRTdmdTdWIgPSBmdW5jdGlvbihzdGFydCwgZW5kLCBhYnNvbHV0ZSkge1xuXHRcdHN0YXJ0ID0gc3RhcnQgfHwgMDtcblx0XHRlbmQgPSBlbmQgfHwgMTtcblx0XHR2YXIgc3ViTCA9IGVuZCAtIHN0YXJ0O1xuXHRcdHZhciBsID0gdGhpcy5nZXRMZW5ndGgoKTtcblx0XHRpZighYWJzb2x1dGUpIHtcblx0XHRcdHN0YXJ0ICo9bDtcblx0XHRcdGVuZCAqPSBsO1xuXHRcdH1cblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRTdWJwYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIHN0YXJ0LCBlbmQpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldFN1YiA9IGZ1bmN0aW9uKHN0YXJ0LCBlbmQsIGFic29sdXRlKSB7XG5cdFx0dmFyIHByY1N0YXJ0ID0gYWJzb2x1dGUgPyBzdGFydCAvIHRoaXMuZ2V0TGVuZ3RoKCkgOiBzdGFydDtcblx0XHR2YXIgZWFzZSA9IHRoaXMuZWFzZVBvaW50cy5tYXAoZnVuY3Rpb24oZSl7XG5cdFx0XHRyZXR1cm4gKGUgLSBwcmNTdGFydCkgLyBzdWJMO1xuXHRcdH0pLmZpbHRlcihmdW5jdGlvbihlKXtcblx0XHRcdHJldHVybiBlID4gMCAmJiBlIDwgMTtcblx0XHR9KTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KHRoaXMuZ2V0U3ZnU3ViKHN0YXJ0LCBlbmQsIGFic29sdXRlKSwgdGhpcy5uYW1lLCBudWxsLCBlYXNlKTtcblx0fTtcblxuXHQvKipcblx0UGFyc2VzIGFuIFNWRyBwYXRoIHN0cmluZyB0byBhIGxpc3Qgb2Ygc2VnbWVudCBkZWZpbml0aW9ucyB3aXRoIEFCU09MVVRFIHBvc2l0aW9ucyB1c2luZyBSYXBoYWVsLnBhdGgyY3VydmVcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlID0gZnVuY3Rpb24oc3ZnKSB7XG5cdFx0dmFyIGN1cnZlID0gUmFwaGFlbC5wYXRoMmN1cnZlKHN2Zyk7XG5cdFx0dmFyIHBhdGggPSBjdXJ2ZS5tYXAoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZSA6IHBvaW50LnNoaWZ0KCksXG5cdFx0XHRcdGFuY2hvcnMgOiBwb2ludFxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcGF0aDtcblx0fTtcblxuXHQvKipcblx0XHRQYXJzZXMgYSBwYXRoIGRlZmluZWQgYnkgcGFyc2VQYXRoIHRvIGEgbGlzdCBvZiBiZXppZXIgcG9pbnRzIHRvIGJlIHVzZWQgYnkgR3JlZW5zb2NrIEJlemllciBwbHVnaW4sIGZvciBleGFtcGxlXG5cdFx0VHdlZW5NYXgudG8oc3ByaXRlLCA1MDAsIHtcblx0XHRcdGJlemllcjp7dHlwZTpcImN1YmljXCIsIHZhbHVlczpjdWJpY30sXG5cdFx0XHRlYXNlOlF1YWQuZWFzZUluT3V0LFxuXHRcdFx0dXNlRnJhbWVzIDogdHJ1ZVxuXHRcdH0pO1xuXHRcdCovXG5cdFBhdGgucHJvdG90eXBlLl9wYXJzZUN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoKTtcblx0XHQvL2Fzc3VtZWQgZmlyc3QgZWxlbWVudCBpcyBhIG1vdmV0b1xuXHRcdHZhciBhbmNob3JzID0gdGhpcy5jdWJpYyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihhbmNob3JzLCBzZWdtZW50KXtcblx0XHRcdHZhciBhID0gc2VnbWVudC5hbmNob3JzO1xuXHRcdFx0aWYoc2VnbWVudC50eXBlPT09J00nKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OmFbMV19KTtcblx0XHRcdH0gZWxzZSBpZihzZWdtZW50LnR5cGU9PT0nTCcpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVsyXSwgeTogYVszXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbNF0sIHk6IGFbNV19KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBhbmNob3JzO1xuXG5cdFx0fSwgW10pO1xuXG5cdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0fTtcblxuXHQvL3Ryb3V2ZSBsZSBib3VuZGluZyBib3ggZCd1bmUgbGV0dHJlIChlbiBzZSBmaWFudCBqdXN0ZSBzdXIgbGVzIHBvaW50cy4uLiBvbiBuZSBjYWxjdWxlIHBhcyBvdSBwYXNzZSBsZSBwYXRoKVxuXHRQYXRoLnByb3RvdHlwZS5nZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLnBhdGhCQm94KHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRtLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHRyZXR1cm4gdGhpcy5hcHBseU1hdHJpeChtKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbihkZWcpIHtcblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS5yb3RhdGUoZGVnKTtcblx0XHRyZXR1cm4gdGhpcy5hcHBseU1hdHJpeChtKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgcGF0aCwgc2NhbGVkXG5cdFBhdGgucHJvdG90eXBlLnNjYWxlID0gUGF0aC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbihyYXRpb3gsIHJhdGlveSkge1xuXHRcdHJhdGlveCA9IHJhdGlveCB8fCAxO1xuXHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRtLnNjYWxlKHJhdGlveCwgcmF0aW95IHx8IHJhdGlveCk7XG5cdFx0cmV0dXJuIHRoaXMuYXBwbHlNYXRyaXgobSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYXBwbHlNYXRyaXggPSBmdW5jdGlvbihtKXtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIHRoaXMuZWFzZVBvaW50cy5zbGljZSgwKSk7XG5cdH07IFxuXG5cdFBhdGgucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKHBhcnQsIG5hbWUpwqB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJ0KTtcblx0XHRpZihuYW1lKSB0aGlzLm5hbWUgKz0gbmFtZTtcblx0XHR2YXIgb3JpZ0xlbmd0aCA9IHRoaXMuZ2V0TGVuZ3RoKCk7XG5cdFx0dGhpcy5fc2V0UGFyc2VkKHRoaXMucGFyc2VkLmNvbmNhdChwYXJ0LnBhcnNlZC5zbGljZSgxKSkpO1xuXHRcdHZhciBmaW5hbExlbmd0aCA9IHRoaXMuZ2V0TGVuZ3RoKCk7XG5cdFx0Ly9yZW1hcCBlYXNlcG9pbnRzLCBhcyBsZW5ndGggb2YgcGF0aCBoYXMgY2hhbmdlZFxuXHRcdHZhciBsZW5ndGhSYXRpbyA9IGZpbmFsTGVuZ3RoIC8gb3JpZ0xlbmd0aDtcblx0XHR0aGlzLmVhc2VQb2ludHMgPSB0aGlzLmVhc2VQb2ludHMubWFwKGZ1bmN0aW9uKGUpe1xuXHRcdFx0cmV0dXJuIGUgLyBsZW5ndGhSYXRpbztcblx0XHR9KTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hZGRFYXNlcG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5lYXNlUG9pbnRzLCBwb3MpO1xuXHRcdHRoaXMuZWFzZVBvaW50cy5wdXNoKHBvcyk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5yZXZlcnNlID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgc3ZnID0gdGhpcy5nZXRTVkdTdHJpbmcoKTtcblx0XHR2YXIgcGF0aFBpZWNlcyA9IHN2Zy5tYXRjaCgvW01MSFZDU1FUQV1bLTAtOS4sXSovZ2kpO1xuXHQgICAgdmFyIHJldmVyc2VkID0gJyc7XG5cdCAgICB2YXIgc2tpcCA9IHRydWU7XG5cdCAgICB2YXIgcHJldmlvdXNQYXRoVHlwZTtcblx0ICAgIGZvciAodmFyIGkgPSBwYXRoUGllY2VzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdCAgICAgICAgdmFyIHBhdGhUeXBlID0gcGF0aFBpZWNlc1tpXS5zdWJzdHIoMCwgMSk7XG5cdCAgICAgICAgdmFyIHBhdGhWYWx1ZXMgPSBwYXRoUGllY2VzW2ldLnN1YnN0cigxKTtcblx0ICAgICAgICBzd2l0Y2ggKHBhdGhUeXBlKSB7XG5cdCAgICAgICAgICAgIGNhc2UgJ00nOlxuXHQgICAgICAgICAgICBjYXNlICdMJzpcblx0ICAgICAgICAgICAgICAgIHJldmVyc2VkICs9IChza2lwID8gJycgOiBwYXRoVHlwZSkgKyBwYXRoVmFsdWVzO1xuXHQgICAgICAgICAgICAgICAgc2tpcCA9IGZhbHNlO1xuXHQgICAgICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICAgIGNhc2UgJ0MnOlxuXHQgICAgICAgICAgICAgICAgdmFyIGN1cnZlUGllY2VzID0gcGF0aFZhbHVlcy5tYXRjaCgvXihbLTAtOS5dKixbLTAtOS5dKiksKFstMC05Ll0qLFstMC05Ll0qKSwoWy0wLTkuXSosWy0wLTkuXSopJC8pO1xuXHQgICAgICAgICAgICAgICAgcmV2ZXJzZWQgKz0gY3VydmVQaWVjZXNbM10gKyBwYXRoVHlwZSArIGN1cnZlUGllY2VzWzJdICsgJywnICsgY3VydmVQaWVjZXNbMV0gKyAnLCc7XG5cdCAgICAgICAgICAgICAgICBza2lwID0gdHJ1ZTtcblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICBkZWZhdWx0OlxuXHQgICAgICAgICAgICAgICAgYWxlcnQoJ05vdCBpbXBsZW1lbnRlZDogJyArIHBhdGhUeXBlKTtcblx0ICAgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgIH1cblx0ICAgIH1cblx0ICAgIHZhciBlYXNlID0gdGhpcy5lYXNlUG9pbnRzLm1hcChmdW5jdGlvbihlKXtcblx0XHRcdHJldHVybiAxIC0gZTtcblx0XHR9KTtcblx0XHQvL2NvbnNvbGUubG9nKHJldmVyc2VkKTtcblx0ICAgIHJldHVybiBQYXRoLmZhY3RvcnkoJ00nK3JldmVyc2VkLCB0aGlzLm5hbWUsIG51bGwsIGVhc2UpO1xuXHRcblx0fTtcblxuXHRQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cykge1xuXHRcdHJldHVybiBuZXcgUGF0aChzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cyk7XG5cdH07XG5cblx0cmV0dXJuIFBhdGg7XG5cbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5qUXVlcnksIHJvb3QuXywgcm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoJCwgXywgUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgR0VUX0RFRkFVTFRTID0gZmFsc2U7XG5cblx0dmFyIGRlZ1RvUmFkID0gTWF0aC5QSSAvIDE4MDtcblx0dmFyIHJhZFRvRGVnID0gMTgwIC8gTWF0aC5QSTtcblx0dmFyIHRvUmFkaWFucyA9IGZ1bmN0aW9uKGRlZ3JlZXMpIHtcblx0ICByZXR1cm4gZGVncmVlcyAqIGRlZ1RvUmFkO1xuXHR9O1x0IFxuXHQvLyBDb252ZXJ0cyBmcm9tIHJhZGlhbnMgdG8gZGVncmVlcy5cblx0dmFyIHRvRGVncmVlcyA9IGZ1bmN0aW9uKHJhZGlhbnMpIHtcblx0ICByZXR1cm4gcmFkaWFucyAqIHJhZFRvRGVnO1xuXHR9O1xuXG5cblx0dmFyIGRpc3RhbmNlVHJlc2hvbGQgPSA0MDtcblx0dmFyIGFuZ2xlVHJlc2hvbGQgPSB0b1JhZGlhbnMoMTIpO1xuXG5cdHZhciBsYXllcjtcblxuXHQvL2hlbHBlclxuXHR2YXIgc2hvd1BvaW50ID0gZnVuY3Rpb24ocG9pbnQsIGNvbG9yLCBzaXplKXtcblx0XHR2YXIgZWwgPSBsYXllci5hZGQoJ2NpcmNsZScsIHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMik7XG5cdFx0ZWwuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0dmFyIHNob3cgPSBmdW5jdGlvbihwYXRoRGVmKSB7XG5cdFx0dmFyIHBhdGggPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1x0XHRcdFxuXHRcdHZhciBlbCA9IGxheWVyLmFkZCgncGF0aCcsIHBhdGgpO1xuXHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IDMsIHN0cm9rZTogJyMwMDAwMDAnfSk7LyoqL1xuXHRcdHJldHVybiBlbDtcblx0fTtcblxuXHR2YXIgZmluZERlZmF1bHRzID0gZnVuY3Rpb24ocGF0aERlZil7XG5cdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdHZhciBsZW5ndGggPSBwYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdHZhciBwb2ludFBvcyA9IFtdO1xuXHRcdFxuXHRcdFxuXHRcdHZhciBwcmVjaXNpb24gPSAxO1xuXHRcdHZhciBwcmV2O1xuXHRcdHZhciBhbGxQb2ludHMgPSBbXTtcblx0XHRmb3IodmFyIGk9cHJlY2lzaW9uOyBpPD1sZW5ndGg7IGkgKz0gcHJlY2lzaW9uKSB7XG5cdFx0XHQvL3ZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBpKTtcblx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XG5cdFx0XHQvL2l0IHNlZW1zIHRoYXQgUmFwaGFlbCdzIGFscGhhIGlzIGluY29uc2lzdGVudC4uLiBzb21ldGltZXMgb3ZlciAzNjBcblx0XHRcdHZhciBhbHBoYSA9IE1hdGguYWJzKCBNYXRoLmFzaW4oIE1hdGguc2luKHRvUmFkaWFucyhwLmFscGhhKSkgKSk7XG5cdFx0XHRpZihwcmV2KSB7XG5cdFx0XHRcdHAuZGlmZiA9IE1hdGguYWJzKGFscGhhIC0gcHJldik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwLmRpZmYgPSAwO1xuXHRcdFx0fVxuXHRcdFx0cHJldiA9IGFscGhhO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwLmRpZmYpO1xuXG5cdFx0XHRpZihwLmRpZmYgPiBhbmdsZVRyZXNob2xkKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coaSk7XG5cdFx0XHRcdHBvaW50UG9zLnB1c2goaSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vcC5jb21wdXRlZEFscGhhID0gYWxwaGE7XG5cdFx0XHQvL2FsbFBvaW50cy5wdXNoKHApO1xuXG5cdFx0fS8qKi9cblxuXHRcdCAvKlxuXHRcdC8vREVCVUcgXG5cdFx0Ly9maW5kIG1heCBjdXJ2YXR1cmUgdGhhdCBpcyBub3QgYSBjdXNwICh0cmVzaG9sZCBkZXRlcm1pbmVzIGN1c3ApXG5cdFx0dmFyIGN1c3BUcmVzaG9sZCA9IDQwO1xuXHRcdHZhciBtYXggPSBhbGxQb2ludHMucmVkdWNlKGZ1bmN0aW9uKG0sIHApe1xuXHRcdFx0cmV0dXJuIHAuZGlmZiA+IG0gJiYgcC5kaWZmIDwgY3VzcFRyZXNob2xkID8gcC5kaWZmIDogbTtcblx0XHR9LCAwKTtcblx0XHRjb25zb2xlLmxvZyhtYXgpO1xuXG5cdFx0dmFyIHByZXYgPSBbMCwwLDAsMF07XG5cdFx0YWxsUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHR2YXIgciA9IE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0dmFyIGcgPSAyNTUgLSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdHZhciByZ2IgPSAncmdiKCcrcisnLCcrZysnLDApJztcblx0XHRcdGlmKHI+MTAwKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09Jyk7XG5cdFx0XHRcdHByZXYuZm9yRWFjaChmdW5jdGlvbihwKXtjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEpO30pO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEsIHJnYik7XG5cdFx0XHR9XG5cdFx0XHRwLnkgKz0gMTUwO1xuXHRcdFx0c2hvd1BvaW50KHAsIHJnYiwgMC41KTtcblx0XHRcdHByZXZbM10gPSBwcmV2WzJdO1xuXHRcdFx0cHJldlsyXSA9IHByZXZbMV07XG5cdFx0XHRwcmV2WzFdID0gcHJldlswXTtcblx0XHRcdHByZXZbMF0gPSBwO1xuXHRcdH0pO1xuXHRcdC8qKi9cblxuXHRcdC8vZmluZHMgZ3JvdXBzIG9mIHBvaW50cyBkZXBlbmRpbmcgb24gdHJlc2hvbGQsIGFuZCBmaW5kIHRoZSBtaWRkbGUgb2YgZWFjaCBncm91cFxuXHRcdHJldHVybiBwb2ludFBvcy5yZWR1Y2UoZnVuY3Rpb24ocG9pbnRzLCBwb2ludCl7XG5cblx0XHRcdHZhciBsYXN0ID0gcG9pbnRzW3BvaW50cy5sZW5ndGgtMV07XG5cdFx0XHRpZighbGFzdCB8fCBwb2ludCAtIGxhc3RbbGFzdC5sZW5ndGgtMV0gPiBkaXN0YW5jZVRyZXNob2xkKXtcblx0XHRcdFx0bGFzdCA9IFtwb2ludF07XG5cdFx0XHRcdHBvaW50cy5wdXNoKGxhc3QpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGFzdC5wdXNoKHBvaW50KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHBvaW50cztcblx0XHR9LCBbXSkubWFwKGZ1bmN0aW9uKHBvaW50cyl7XG5cdFx0XHRyZXR1cm4gcG9pbnRzW01hdGguZmxvb3IocG9pbnRzLmxlbmd0aC8yKV07XG5cdFx0fSk7XG5cdFx0XG5cdH07XG5cblx0dmFyIGFsbFBvaW50cyA9IFtdO1xuXHR2YXIgZWFzZVBvaW50cyA9IHt9O1xuXG5cdHZhciBjdXJyZW50O1xuXG5cdHZhciBnZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24obGV0dGVyLCBwYXRoSWR4LCBwYXRoRGVmKXtcblx0XHRcblx0XHR2YXIgcGF0aCA9IHNob3cocGF0aERlZik7XG5cblx0XHQvL2FyZSBlYXNlIHBvaW50cyBhbHJlYWR5IHNldCBmb3IgdGhpcyBwYXRoP1xuXHRcdHZhciBwYXRoRWFzZVBvaW50cyA9IHBhdGhEZWYuZ2V0RWFzZXBvaW50cygpOyBcblx0XHRpZihwYXRoRWFzZVBvaW50cy5sZW5ndGggPT09IDAgJiYgR0VUX0RFRkFVTFRTKSB7XG5cdFx0XHRwYXRoRWFzZVBvaW50cyA9IGZpbmREZWZhdWx0cyhwYXRoRGVmKTtcblx0XHR9XG5cblx0XHQvL2NvbnNvbGUubG9nKGVhc2VQb2ludHMpO1xuXHRcdHZhciBsZW5ndGggPSBwYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdHZhciBwYXRoU3RyID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcblx0XHRcblxuXHRcdHZhciBpbmFjdGl2ZUNvbG9yID0gJyMwMGZmMDAnO1xuXHRcdHZhciBhY3RpdmVDb2xvciA9ICcjZmYyMjAwJztcblxuXHRcdHZhciBhZGRQb2ludCA9IGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRpZihwb3MgPCAxKSBwb3MgPSBwb3MgKiBsZW5ndGg7Ly9zaSBlbiBwcmNcblx0XHRcdHZhciBwT2JqID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHR2YXIgcG9pbnQgPSBzaG93UG9pbnQocE9iaiwgaW5hY3RpdmVDb2xvciwgMyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhJZHgpO1xuXHRcdFx0cG9pbnQuZGF0YSgncG9zJywgcG9zKTtcblx0XHRcdHBvaW50LmRhdGEoJ2xldHRlcicsIGxldHRlcik7XG5cdFx0XHRwb2ludC5kYXRhKCdwYXRoSWR4JywgcGF0aElkeCk7XG5cdFx0XHRwb2ludC5kYXRhKCdwYXRoTGVuZ3RoJywgbGVuZ3RoKTtcblx0XHRcdHBvaW50LmRhdGEoJ3gnLCBwT2JqLngpO1xuXHRcdFx0cG9pbnQuZGF0YSgneScsIHBPYmoueSk7XG5cblx0XHRcdGFsbFBvaW50cy5wdXNoKHBvaW50KTtcblxuXHRcdFx0cG9pbnQuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdFx0XG5cdFx0XHRcdGFsbFBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0XHRcdHAuYXR0cih7ZmlsbDogaW5hY3RpdmVDb2xvcn0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRwb2ludC5hdHRyKHtmaWxsOiBhY3RpdmVDb2xvcn0pO1xuXG5cdFx0XHRcdGN1cnJlbnQgPSB7XG5cdFx0XHRcdFx0cG9pbnQ6IHBvaW50LFxuXHRcdFx0XHRcdHBhdGg6IHBhdGgsXG5cdFx0XHRcdFx0cGF0aERlZjogcGF0aERlZixcblx0XHRcdFx0XHRzdmcgOiBwYXRoU3RyLFxuXHRcdFx0XHRcdGxldHRlciA6IGxldHRlcixcblx0XHRcdFx0XHRwYXRoSWR4IDogcGF0aElkeFxuXHRcdFx0XHR9O1xuXG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0cGF0aEVhc2VQb2ludHMuZm9yRWFjaChhZGRQb2ludCk7LyoqL1xuXG5cdFx0cGF0aC5jbGljayhmdW5jdGlvbigpe1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnYWRkJyk7XG5cdFx0XHRhZGRQb2ludCgwKTtcblx0XHR9KTtcblx0XHRcblxuXHRcdHJldHVybiBwYXRoRWFzZVBvaW50cztcblxuXHR9O1xuXG5cdHZhciBtb3ZlQ3VycmVudCA9IGZ1bmN0aW9uKGRpc3QpIHtcblx0XHR2YXIgcCA9IGN1cnJlbnQucG9pbnQ7XG5cdFx0dmFyIHBvcyA9IHAuZGF0YSgncG9zJyk7XG5cdFx0cG9zICs9IGRpc3Q7XG5cdFx0dmFyIG1heCA9IGN1cnJlbnQucGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHRpZihwb3MgPCAwKSBwb3MgPSAwO1xuXHRcdGlmKHBvcyA+IG1heCkgcG9zID0gbWF4O1xuXHRcdHAuZGF0YSgncG9zJywgcG9zKTtcblxuXHRcdHZhciBwT2JqID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGN1cnJlbnQuc3ZnLCBwb3MpO1xuXG5cdFx0dmFyIHggPSBwLmRhdGEoJ3gnKTtcblx0XHR2YXIgeSA9IHAuZGF0YSgneScpO1xuXHRcdHZhciBkZWx0YVggPSBwT2JqLnggLSB4O1xuXHRcdHZhciBkZWx0YVkgPSBwT2JqLnkgLSB5O1xuXG5cdFx0LypwLmRhdGEoJ3gnLCBwT2JqLngpO1xuXHRcdHAuZGF0YSgneScsIHBPYmoueSk7LyoqL1xuXG5cdFx0cC50cmFuc2Zvcm0oJ3QnICsgZGVsdGFYICsgJywnICsgZGVsdGFZKTtcblx0XHRwcmludEpTT04oKTtcblxuXHR9O1xuXG5cblx0JCh3aW5kb3cpLm9uKCdrZXlkb3duLmVhc2UnLCBmdW5jdGlvbihlKXtcblx0XHQvL2NvbnNvbGUubG9nKGUud2hpY2gsIGN1cnJlbnQpO1xuXHRcdHZhciBMRUZUID0gMzc7XG5cdFx0dmFyIFVQID0gMzg7XG5cdFx0dmFyIFJJR0hUID0gMzk7XG5cdFx0dmFyIERPV04gPSA0MDtcblx0XHR2YXIgREVMID0gNDY7XG5cblx0XHRpZihjdXJyZW50KSB7XG5cdFx0XHRzd2l0Y2goZS53aGljaCkge1xuXHRcdFx0XHRjYXNlIExFRlQ6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KC0xKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBET1dOOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMTApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFJJR0hUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgxKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBVUDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMTApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIERFTDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0dmFyIGlkeCA9IGFsbFBvaW50cy5pbmRleE9mKGN1cnJlbnQucG9pbnQpO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coaWR4KTtcblx0XHRcdFx0XHRjdXJyZW50LnBvaW50LnJlbW92ZSgpO1xuXHRcdFx0XHRcdGFsbFBvaW50cy5zcGxpY2UoaWR4LCAxKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGFsbFBvaW50cyk7XG5cdFx0XHRcdFx0Y3VycmVudCA9IG51bGw7XG5cdFx0XHRcdFx0cHJpbnRKU09OKCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHR9KTtcblxuXHR2YXIgcHJpbnROb2RlO1xuXHR2YXIgcHJpbnRKU09OID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGpzb24gPSBhbGxQb2ludHMucmVkdWNlKGZ1bmN0aW9uKGpzb24sIHBvaW50KXtcblxuXHRcdFx0dmFyIGxldHRlciA9IHBvaW50LmRhdGEoJ2xldHRlcicpO1xuXHRcdFx0dmFyIHBhdGhJZHggPSBwb2ludC5kYXRhKCdwYXRoSWR4Jyk7XG5cdFx0XHR2YXIgbCA9IHBvaW50LmRhdGEoJ3BhdGhMZW5ndGgnKTtcblxuXHRcdFx0dmFyIHBhdGhzID0ganNvbltsZXR0ZXJdID0ganNvbltsZXR0ZXJdIHx8IFtdO1xuXHRcdFx0dmFyIGVhc2Vwb2ludHMgPSBwYXRoc1twYXRoSWR4XSA9IHBhdGhzW3BhdGhJZHhdIHx8IFtdO1xuXHRcdFx0ZWFzZXBvaW50cy5wdXNoKHBvaW50LmRhdGEoJ3BvcycpIC8gbCk7XG5cdFx0XHRlYXNlcG9pbnRzLnNvcnQoZnVuY3Rpb24oYSwgYil7XG5cdFx0XHRcdHJldHVybiBhIC0gYjtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGpzb247XG5cdFx0fSwge30pO1xuXHRcdHByaW50Tm9kZS50ZXh0KEpTT04uc3RyaW5naWZ5KGpzb24pKTtcblx0fTtcblxuXHRyZXR1cm4gZnVuY3Rpb24oc3RhZ2UsIGdyb3Vwcywgbm9kZSl7XG5cdFx0bGF5ZXIgPSBzdGFnZS5nZXROZXdMYXllcigpO1xuXHRcdHZhciBwYWQgPSAyMDtcblx0XHR2YXIgYXZhaWxXID0gc3RhZ2Uud2lkdGgoKSAtIHBhZDtcblxuXHRcdHZhciBncm91cE1heEhlaWdodCA9IE9iamVjdC5rZXlzKGdyb3VwcykucmVkdWNlKGZ1bmN0aW9uKG1pbiwgZ3JvdXBOYW1lKXtcblx0XHRcdHZhciB0ID0gZ3JvdXBzW2dyb3VwTmFtZV0uZ2V0SGVpZ2h0KCk7XG5cdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZCB8fCB0ID4gbWluKSB7XG5cdFx0XHRcdG1pbiA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWluO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0XG5cdFx0dmFyIHRvcExlZnQgPSB7eDpwYWQsIHk6cGFkfTtcblx0XHRPYmplY3Qua2V5cyhncm91cHMpLmZvckVhY2goZnVuY3Rpb24obmFtZSl7XG5cdFx0XHR2YXIgZ3JvdXAgPSBncm91cHNbbmFtZV07XG5cdFx0XHQvL2NvbnNvbGUubG9nKGdyb3VwKTtcblx0XHRcdHZhciBlbmRMZWZ0ID0gdG9wTGVmdC54ICsgZ3JvdXAuZ2V0V2lkdGgoKSArIHBhZDtcblxuXHRcdFx0aWYoZW5kTGVmdCA+IGF2YWlsVykge1xuXHRcdFx0XHR0b3BMZWZ0LnggPSBwYWQ7XG5cdFx0XHRcdHRvcExlZnQueSArPSBwYWQgKyBncm91cE1heEhlaWdodDtcblx0XHRcdFx0ZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cdFx0XHR9XG5cblxuXHRcdFx0dmFyIHRoaXNFYXNlID0gZ3JvdXAucGF0aHMubWFwKGZ1bmN0aW9uKHAsIGlkeCl7XG5cdFx0XHRcdHAgPSBwLnRyYW5zbGF0ZSh0b3BMZWZ0LngsIHRvcExlZnQueSk7XG5cdFx0XHRcdHJldHVybiBnZXRFYXNlcG9pbnRzKG5hbWUsIGlkeCwgcCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0XHR0b3BMZWZ0LnggPSBlbmRMZWZ0O1x0XHRcdFxuXG5cdFx0fSk7XG5cdFx0Ly9jb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblxuXHRcdHByaW50Tm9kZSA9IG5vZGU7XG5cdFx0cHJpbnRKU09OKCk7XG5cdH07XG5cblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBQYXRoR3JvdXAgPSBmdW5jdGlvbihuYW1lKXtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMuYm91bmRpbmcgPSB0aGlzLnBhdGhzLnJlZHVjZShmdW5jdGlvbihib3VuZGluZywgcGF0aCl7XG5cdFx0XHR2YXIgcGF0aEJvdW5kaW5nID0gcGF0aC5nZXRCb3VuZGluZygpO1xuXG5cdFx0XHRib3VuZGluZyA9IGJvdW5kaW5nIHx8IHBhdGhCb3VuZGluZztcblx0XHRcdGJvdW5kaW5nLnggPSBib3VuZGluZy54IDwgcGF0aEJvdW5kaW5nLnggPyBib3VuZGluZy54IDogIHBhdGhCb3VuZGluZy54O1xuXHRcdFx0Ym91bmRpbmcueSA9IGJvdW5kaW5nLnkgPCBwYXRoQm91bmRpbmcueSA/IGJvdW5kaW5nLnkgOiAgcGF0aEJvdW5kaW5nLnk7XG5cdFx0XHRib3VuZGluZy54MiA9IGJvdW5kaW5nLngyID4gcGF0aEJvdW5kaW5nLngyID8gYm91bmRpbmcueDIgOiBwYXRoQm91bmRpbmcueDI7XG5cdFx0XHRib3VuZGluZy55MiA9IGJvdW5kaW5nLnkyID4gcGF0aEJvdW5kaW5nLnkyID8gYm91bmRpbmcueTIgOiBwYXRoQm91bmRpbmcueTI7XG5cdFx0XHRib3VuZGluZy53aWR0aCA9IGJvdW5kaW5nLngyIC0gYm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLmhlaWdodCA9IGJvdW5kaW5nLnkyIC0gYm91bmRpbmcueTtcblx0XHRcdHJldHVybiBib3VuZGluZztcblx0XHR9LCB1bmRlZmluZWQpIHx8IHt9O1xuXHRcdC8vaWYgdGhlcmUncyBhIGVuZFBvaW50IHBvaW50IHRoYXQgaXMgc2V0LCB1c2UgaXRzIGNvb3JkaW5hdGVzIGFzIGJvdW5kaW5nXG5cdFx0aWYodGhpcy5lbmRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmVuZFBvaW50LmdldFBvaW50KDApO1xuXHRcdFx0dGhpcy5ib3VuZGluZy54MiA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdFx0aWYodGhpcy5zdGFydFBvaW50KSB7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuc3RhcnRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueCA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5lbmRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignc3RhcnQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5zdGFydFBvaW50ID0gcDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wYXRocy5wdXNoKHApO1xuXHRcdH1cblx0XHR0aGlzLnNldEJvdW5kaW5nKCk7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLmhlaWdodDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy53aWR0aDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRCb3R0b24gPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnkyO1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFRvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueTtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54O1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFJpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54Mjtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmc7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbih4LCB5KXtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocy5tYXAoZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHBhdGggPSBwYXRoLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRyZXR1cm4gcGF0aDtcblx0XHR9KTtcblx0XHR0aGlzLmVuZFBvaW50ID0gKHRoaXMuZW5kUG9pbnQgJiYgdGhpcy5lbmRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnRyYW5zbGF0ZSh4LCB5KSk7XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBQYXRoR3JvdXAsIHNjYWxlZFxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuXHRcdGlmKCF0aGlzLnBhdGhzKSByZXR1cm4gdGhpcztcblx0XHR2YXIgc2NhbGVkID0gbmV3IFBhdGhHcm91cCh0aGlzLm5hbWUpO1xuXHRcdHRoaXMucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKXtcblx0XHRcdHNjYWxlZC5hZGRQYXRoKHBhdGguc2NhbGUoc2NhbGUpKTtcblx0XHR9KTtcblxuXHRcdHNjYWxlZC5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQuc2NhbGUoc2NhbGUpKTtcblx0XHRzY2FsZWQuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnNldEJvdW5kaW5nKCk7XG5cdFx0cmV0dXJuIHNjYWxlZDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFBhdGhzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5wYXRocztcblx0fTtcblxuXHRQYXRoR3JvdXAuZmFjdG9yeSA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIG5ldyBQYXRoR3JvdXAoKTtcblx0fTtcblxuXHRyZXR1cm4gUGF0aEdyb3VwO1xuXG59KSk7XG5cblxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvRHJhd2luZycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290Ll8sIHJvb3QuUmFwaGFlbCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIF8sIFJhcGhhZWwpIHtcblxuXHQvL2hlbHBlclxuXHR2YXIgc2hvd1BvaW50ID0gZnVuY3Rpb24oc3RhZ2UsIHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0dmFyIGVsID0gc3RhZ2UuY2lyY2xlKHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMik7XG5cdFx0ZWwuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0Ly9sYXllciBpcyBhbiBleHRlbnNpb24gb2YgUmFwaGFlbCdzIHNldCB0aGF0IGlzIGxpbmtlZCB0byBhIHN0YWdlLCBzbyB0aGF0IHlvdSBjYW4gYWRkIGRpcmVjdGx5IHRvIGl0IGluc3RlYWQgb2YgaGF2b25nIHRvIGhhdmUgYWNjZXMgdG8gYm90aCB0aGUgc3RhZ2UgYW5kIHRoZSBzZXQuXG5cdHZhciBMYXllciA9IGZ1bmN0aW9uKHBhcGVyKSB7XG5cblx0XHR0aGlzLmFkZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGFyZ3MgPSBhcmd1bWVudHM7XG5cdFx0XHR2YXIgZmNuID0gQXJyYXkucHJvdG90eXBlLnNoaWZ0LmNhbGwoYXJncyk7XG5cdFx0XHRpZighcGFwZXJbZmNuXSkgdGhyb3cgbmV3IEVycm9yKGZjbiArICcgZG9lcyBub3QgZXhpc3Qgb24gUmFwaGFlbCcpO1xuXHRcdFx0XG5cdFx0XHR2YXIgZWwgPSBwYXBlcltmY25dLmFwcGx5KHBhcGVyLCBhcmdzKTtcblx0XHRcdHRoaXMucHVzaChlbCk7XG5cdFx0XHRyZXR1cm4gZWw7XG5cdFx0fTtcblxuXHRcdHRoaXMucmVtb3ZlID0gZnVuY3Rpb24oZWwpIHtcblx0XHRcdGlmKCFlbCkgcmV0dXJuO1xuXHRcdFx0ZWwucmVtb3ZlKCk7XG5cdFx0XHR0aGlzLmV4Y2x1ZGUoZWwpO1xuXHRcdH07XG5cblx0XHR0aGlzLnNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0XHR2YXIgZWwgPSBzaG93UG9pbnQocGFwZXIsIHBvaW50LCBjb2xvciwgc2l6ZSk7XG5cdFx0XHR0aGlzLnB1c2goZWwpO1xuXHRcdH07XG5cblx0XHR0aGlzLmNsZWFyQW5kUmVtb3ZlQWxsID0gZnVuY3Rpb24oKXtcblx0XHRcdHZhciBlO1xuXHRcdFx0d2hpbGUoZSA9IHRoaXMucG9wKCkpe1xuXHRcdFx0XHRlLnJlbW92ZSgpO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0fTtcblxuXHR2YXIgU3RhZ2UgPSBmdW5jdGlvbihuYW1lKXtcblxuXHRcdC8vbGUgc3RhZ2UgZXN0IHVuIGVsZW1lbnQgY29udGVudSBkYW5zIGxlIGNvbnRhaW5lciwgcG91ciBwb3V2b2lyIGxlIHJlc2l6ZXIgcmVzcG9uc2l2ZVxuXHRcdHZhciBjb250YWluZXIgPSAkKCcjJytuYW1lKTtcblx0XHR2YXIgcGFwZXJOYW1lID0gbmFtZSsnUGFwZXInO1xuXHRcdGNvbnRhaW5lci5hcHBlbmQoJzxkaXYgaWQ9XCInK3BhcGVyTmFtZSsnXCI+PC9kaXY+Jyk7XG5cblx0XHR2YXIgd2lkdGggPSBjb250YWluZXIud2lkdGgoKTtcblx0XHR2YXIgaGVpZ2h0ID0gY29udGFpbmVyLmhlaWdodCgpO1xuXHRcdHZhciBwYXBlciA9IFJhcGhhZWwocGFwZXJOYW1lLCB3aWR0aCwgaGVpZ2h0KTtcblxuXHRcdHZhciByZXNpemVOb3RpZmllciA9ICQuRGVmZXJyZWQoKTtcblx0XHR0aGlzLm9uUmVzaXplID0gcmVzaXplTm90aWZpZXIucHJvbWlzZSgpO1xuXG5cdFx0dmFyIG9uUmVzaXplID0gZnVuY3Rpb24oKXtcblx0XHRcdHdpZHRoID0gY29udGFpbmVyLndpZHRoKCk7XG5cdFx0XHRoZWlnaHQgPSBjb250YWluZXIuaGVpZ2h0KCk7XG5cdFx0XHRwYXBlci5zZXRTaXplKHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0cmVzaXplTm90aWZpZXIubm90aWZ5KHt3OndpZHRoLCBoOmhlaWdodH0pO1xuXHRcdH07XG5cblx0XHQkKHdpbmRvdykub24oJ3Jlc2l6ZS5zdGFnZScsIG9uUmVzaXplKTtcblxuXG5cdFx0dGhpcy53aWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gd2lkdGg7XG5cdFx0fTtcblx0XHR0aGlzLmhlaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gaGVpZ2h0O1xuXHRcdH07XG5cblx0XHR0aGlzLnNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0XHRyZXR1cm4gc2hvd1BvaW50KHBhcGVyLCBwb2ludCwgY29sb3IsIHNpemUpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldE5ld0xheWVyID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgbGF5ZXIgPSBwYXBlci5zZXQoKTtcblx0XHRcdGxheWVyID0gXy5leHRlbmQobGF5ZXIsIG5ldyBMYXllcihwYXBlcikpO1xuXHRcdFx0cmV0dXJuIGxheWVyO1xuXHRcdH07XG5cblx0fTtcblxuXHR2YXIgZ2V0U3RhZ2UgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgc3RhZ2VzID0ge307XG5cdFx0dmFyIGluaXQgPSBmdW5jdGlvbihuYW1lKXtcblx0XHRcdHJldHVybiBuZXcgU3RhZ2UobmFtZSk7XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24obmFtZSl7XG5cdFx0XHRyZXR1cm4gc3RhZ2VzW25hbWVdID0gc3RhZ2VzW25hbWVdIHx8IGluaXQobmFtZSk7XG5cdFx0fVxuXHR9KSgpO1xuXHRcblxuXHRyZXR1cm4ge1xuXHRcdGdldFN0YWdlIDogZ2V0U3RhZ2UsXG5cdFx0c2hvd1BvaW50IDogc2hvd1BvaW50XG5cdH07XG59KSk7IiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi9QYXRoR3JvdXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXApO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChQYXRoR3JvdXApIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXG5cdFx0Z2V0UGF0aHMgOiBmdW5jdGlvbihhbHBoYWJldCwgdGV4dCkge1xuXHRcdFx0dmFyIHJpZ2h0ID0gMDtcblx0XHRcdHZhciBsaW5lcyA9IG5ldyBQYXRoR3JvdXAodGV4dCk7XG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXG5cdFx0XHQvL2xvb3AgZm9yIGV2ZXJ5IGNoYXJhY3RlciBpbiBuYW1lIChzdHJpbmcpXG5cdFx0XHRmb3IodmFyIGk9MDsgaTx0ZXh0Lmxlbmd0aDsgaSsrKcKge1xuXHRcdFx0XHR2YXIgbGV0dGVyID0gdGV4dFtpXTtcblxuXHRcdFx0XHRpZihsZXR0ZXIgPT09ICcgJykge1xuXHRcdFx0XHRcdHJpZ2h0ICs9IGFscGhhYmV0LmdldE5TcGFjZSgpO1xuXHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgbGV0dGVyRGVmID0gYWxwaGFiZXQuZ2V0U3ltYm9sKGxldHRlcikgfHwgYWxwaGFiZXQuZ2V0U3ltYm9sKCctJyk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyLCBsZXR0ZXJEZWYpO1xuXG5cblx0XHRcdFx0XG5cdFx0XHRcdHZhciBsZXR0ZXJKb2luZWRFbmQgPSBmYWxzZTtcblx0XHRcdFx0bGV0dGVyRGVmLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0XHRcdHZhciBkZWYgPSBwYXRoLnRyYW5zbGF0ZShyaWdodCwgMCk7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZFN0YXJ0ID0gZGVmLm5hbWUgJiYgZGVmLm5hbWUuaW5kZXhPZignam9pbmEnKSA+IC0xO1xuXHRcdFx0XHRcdHZhciBqb2luZWRFbmQgPSAvam9pbihhPyliLy50ZXN0KGRlZi5uYW1lKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgam9pbmVkU3RhcnQsIGpvaW5lZEVuZCk7XG5cdFx0XHRcdFx0bGV0dGVySm9pbmVkRW5kID0gbGV0dGVySm9pbmVkRW5kIHx8IGpvaW5lZEVuZDtcblx0XHRcdFx0XHRpZihqb2luZWRTdGFydCAmJiBjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL2FwcGVuZCBhdSBjb250aW51b3VzXG5cdFx0XHRcdFx0XHRjb250aW51b3VzLmFwcGVuZChkZWYsIGxldHRlcik7XG5cblx0XHRcdFx0XHRcdC8vYWpvdXRlIGxlcyBlYXNlcG9pbnRzIGRlIGNlIHBhdGhcblx0XHRcdFx0XHRcdHZhciB0b3RhbExlbmd0aCA9IGNvbnRpbnVvdXMuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHR2YXIgcGF0aFN0YXJ0UG9zID0gdG90YWxMZW5ndGggLSBkZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHRkZWYuZ2V0RWFzZXBvaW50cygpLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0XHRcdFx0Y29udGludW91cy5hZGRFYXNlcG9pbnQoKHBhdGhTdGFydFBvcyArIHBvcykgLyB0b3RhbExlbmd0aCk7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZihqb2luZWRFbmQgJiYgIWNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vc3RhcnQgdW4gbm91dmVhdSBsaW5lIChjbG9uZSBlbiBzY2FsYW50IGRlIDEpXG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZGVmLmNsb25lKCk7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzLm5hbWUgPSBsZXR0ZXI7XG5cdFx0XHRcdFx0XHRsaW5lcy5hZGRQYXRoKGNvbnRpbnVvdXMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRsaW5lcy5hZGRQYXRoKGRlZik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoIWxldHRlckpvaW5lZEVuZCkge1xuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdHJpZ2h0ICs9IGxldHRlckRlZi5nZXRXaWR0aCgpO1xuXHRcdFx0XHQvL2NvbnNvbGUudGFibGUoW3tsZXR0ZXI6bmFtZVtpXSwgbGV0dGVyV2lkdGg6IGxldHRlci5nZXRXaWR0aCgpLCB0b3RhbDpyaWdodH1dKTtcdFxuXHRcdFx0fVxuXHRcdFx0Ly9jb25zb2xlLmxvZyhsaW5lcy5nZXRCb3VuZGluZygpKTtcblxuXHRcdFx0dmFyIGIgPSBsaW5lcy5nZXRCb3VuZGluZygpO1xuXHRcdFx0bGluZXMuc2V0T2Zmc2V0KC1iLngsIC1iLnkpO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gbGluZXM7XG5cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFZlY3RvcldvcmQ7XG5cdFxufSkpO1xuXG5cbiJdfQ==
