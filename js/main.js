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
		easepoints : {}
	};


	return  Alphabet.factory(Lines);
	
}));
},{"./lagrange/drawing/Alphabet":3}],2:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var EmilieFont = require('./lagrange/drawing/EmilieFont.js');
	var DecorativeLines = require('./DecorativeLines');
	var DrawPath = require('./lagrange/drawing/DrawPath');
	var VectorWord = require('./lagrange/drawing/VectorWord');
	var PathEasepoints = require('./lagrange/drawing/PathEasepoints');/**/
	var PathGroup = require('./lagrange/drawing/PathGroup');/**/
	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1600;
	var H = 1200;
	var CENTER = W / 2;
	var T = 50;
	var LINE_HEIGHT = 1.2;//em
	var SPEED = 250;//px per sec


	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	
	function Shuffle(o) {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	
	Shuffle(names);
	//names.length = 1;/**/



	var getStage = (function(){
		var stage;
		var init = function(){
			return Raphael("svg", W, H);
		};
		return function(){
			return stage = stage || init();
		}
	})();
	//helper
	var showPoint = function(point, color, size){
		var el = getStage().circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	var loading = $.when(EmilieFont.load(), DecorativeLines.load());

	var words = [
		{
			text : 'Merci',
			size : 0.8
		},
		{
			text : 'Jean-Paul',//names.pop(),
			size : 1,
			append : function(){
				return {
					symbol: DecorativeLines.getSymbol('wordDecorationEnd').getPaths()[0],
					size: 1 //height in em
				};
			}
		}
	];




	var doDraw = function(){
		var top = 0;
		words = words.map(function(word, lineNum){

			var paths = VectorWord.getPaths(EmilieFont, word.text);
			paths = paths.scale(word.size);

			//center text
			var width = paths.getWidth();
			var left = - width / 2;

			paths.setOffset(left, top);
			
			top += EmilieFont.getUpperLineHeight() * LINE_HEIGHT;

			//ajoute le guidi sur le dernier mot
			if(word.append) {
				var append = word.append();
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
				//paths.addPath(curve);
				
			}

			word.paths = paths;

			return word;

		});

		//trouve le bounding box de l'ensemble des paths, s'en servira pour s'assurer que ça entre toujours dans le stage
		var bounding = words.reduce(function(g, w){
			w.paths.getPaths().forEach(function(p){
				g.addPath(p);
			});
			return g;
		}, PathGroup.factory()).getBounding();

		var elementSet = getStage().set();

		var resizeSet = function(){
			var scale = W / bounding.width;
			var targetH = bounding.height * scale;
			if(targetH > H){
				scale = H / bounding.height;
			}
			//console.log(scale);
			
			var targetLeft = ((W - bounding.width) / 2) - bounding.x;
			elementSet.transform('t'+targetLeft+',0s'+scale+','+scale+',0,0');
		};

		var tl = words.reduce(function(tl, word, lineNum){
			return DrawPath.group(word.paths.getPaths(), getStage(), elementSet, {
				pxPerSecond : SPEED * word.size,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeInOut
			}, tl);
		}, new gsap.TimelineMax({paused:true, onUpdate: resizeSet}));

		tl.play();
	};

		
	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		loading.then(doDraw);
	});



	//parse les easepoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		PathEasepoints(getStage(), EmilieFont.getAll(), $('#brp'), [W, H]);
	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		loading.then(printEasepoints);
	});


},{"./DecorativeLines":1,"./lagrange/drawing/DrawPath":4,"./lagrange/drawing/EmilieFont.js":5,"./lagrange/drawing/PathEasepoints":7,"./lagrange/drawing/PathGroup":8,"./lagrange/drawing/VectorWord":9,"gsap":"gsap","jquery":"jquery","raphael":"raphael"}],3:[function(require,module,exports){
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

		var doLoad = function(){
			var loading = $.ajax({
				url : settings.svgFile,
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

		this.load = function() {
			return doLoad();
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



},{"./Path":6,"./PathGroup":8,"jquery":"jquery"}],4:[function(require,module,exports){
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
	var showPoint = function(point, stage, color, size){
		stage.circle(point.x, point.y, size || 2).attr({fill: color || '#ff0000', "stroke-width":0});
	};

	var DrawPath = {

		single : function(path, stage, elSet, params){
			
			var settings = _.extend({}, defaults, params);
			var pathStr = path.getSVGString();
			var length = path.getLength();

			var pxPerSecond = settings.pxPerSecond;
			var time = length / pxPerSecond;

			var anim = {to: 0};
			
			var update = (function(){
				var el;
				return function(){
					var pathPart = Raphael.getSubpath(pathStr, 0, anim.to);
					if(el) el.remove();
					el = stage.path(pathPart);
					if(elSet) {
						elSet.push(el);
					}
					el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});
				};
			})();

			var easePoints = path.getEasepoints();
			/*console.log(easePoints.length);
			easePoints.forEach(function(pos){
				var p = Raphael.getPointAtLength(pathStr, pos);
				showPoint(p, stage, '#ff0000', 2);
			});/**/
			

			var last = 0;
			return easePoints.reduce(function(tl, dist) {
				var time = (dist-last) / pxPerSecond;
				last = dist;
				return tl.to(anim, time, {to: dist, ease : settings.easing});
			}, new gsap.TimelineMax({
				onUpdate : update
			})).to(anim, ((length - (easePoints.length && easePoints[easePoints.length-1])) / pxPerSecond), {to: length, ease : settings.easing});
			
		},

		group : function(paths, stage, elSet, settings, tl) {
			return paths.reduce(function(tl, path){
				return tl.append(DrawPath.single(path, stage, elSet, settings));
			}, tl || new gsap.TimelineMax({paused:true}));
		}
	}

	return DrawPath;
	
}));



},{"gsap":"gsap","lodash":"lodash","raphael":"raphael"}],5:[function(require,module,exports){
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
		easepoints : {"Ô":[null,[16]],"Ï":[[136]],"Î":[[93],[16]],"Ë":[[159]],"Ê":[[159],[17]],"È":[[159]],"É":[[159]],"Ç":[null,[13]],"Ä":[[189]],"Â":[[189],null,[15]],"À":[[189]],"Z":[[193,340]],"Y":[[329]],"W":[[227,336]],"V":[[231]],"U":[[317]],"R":[[289]],"O":[[300]],"N":[[247,350]],"M":[[238,338,452]],"L":[[220]],"K":[[115],[122]],"J":[[132]],"H":[[142]],"G":[[321]],"E":[[159]],"D":[[370]],"B":[[453]],"A":[[189]],"ô":[[155],[16]],"ö":[[155]],"ï":[[42]],"î":[[42],[16]],"ë":[[40]],"ê":[[40],[17]],"è":[[40]],"é":[[40]],"ç":[[72],[13]],"ä":[[55,133]],"â":[[55,133],[15]],"à":[[55,133]],"z":[[110,210]],"y":[[42,116,227]],"x":[[42]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[123]],"k":[[129,244,327]],"j":[[52]],"i":[[42]],"h":[[131,248,293]],"g":[[60,145]],"f":[[134,419]],"d":[[57,234]],"c":[[72]],"b":[[126,291]],"a":[[55,133]]}
	};


	return  Alphabet.factory(EmilieFont);;
	
}));
},{"./Alphabet":3}],6:[function(require,module,exports){
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
	Gets the positions at which we have ease points (which are preparsed and considered part of the path's definitions)
	*/
	Path.prototype.getEasepoints = function() {
		return this.easePoints;
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
		return Path.factory(svg, this.name, null, this.easePoints);
	};

	//returns a new path, scaled
	Path.prototype.scale = Path.prototype.clone = function(ratio) {
		ratio = ratio || 1;
		var m = Raphael.matrix();
		m.scale(ratio);
		var svg = Raphael.mapPath(this.getSVGString(), m);
		var easePoints = this.easePoints.map(function(ep){
			return ep * ratio;
		});
		return Path.factory(svg, this.name, null, easePoints);
	};

	Path.prototype.applyMatrix = function(m){
		var svg = Raphael.mapPath(this.getSVGString(), m);
		var easePoints = this.easePoints.map(function(ep){
			return ep ;//;
		});
		return Path.factory(svg, this.name, null, easePoints);
	}; 

	Path.prototype.append = function(part, name) {
		//console.log(part);
		if(name) this.name += name;
		this._setParsed(this.parsed.concat(part.parsed.slice(1)));
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



},{"raphael":"raphael"}],7:[function(require,module,exports){
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

	var stage;

	//helper
	var showPoint = function(point, color, size){
		var el = stage.circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	var show = function(pathDef) {
		var path = pathDef.getSVGString();			
		var el = stage.path(path);
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
		var pathStr = pathDef.getSVGString();
		

		var inactiveColor = '#00ff00';
		var activeColor = '#ff2200';

		var addPoint = function(pos){
			var pObj = Raphael.getPointAtLength(pathStr, pos);
			var point = showPoint(pObj, inactiveColor, 3);
			//console.log(pathIdx);
			point.data('pos', pos);
			point.data('letter', letter);
			point.data('pathIdx', pathIdx);
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

			var paths = json[letter] = json[letter] || [];
			var easepoints = paths[pathIdx] = paths[pathIdx] || [];
			easepoints.push(point.data('pos'));
			easepoints.sort(function(a, b){
				return a - b;
			});
			return json;
		}, {});
		printNode.text(JSON.stringify(json));
	};

	return function(s, groups, node, dim){
		stage = s;
		var pad = 20;
		var availW = dim[0] - pad;

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



},{"jquery":"jquery","lodash":"lodash","raphael":"raphael"}],8:[function(require,module,exports){
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



},{}],9:[function(require,module,exports){
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
						var pathStartPos = continuous.getLength() - def.getLength();
						def.getEasepoints().forEach(function(pos){
							continuous.addEasepoint(pathStartPos + pos);
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
			return lines;

		}
	};

	return VectorWord;
	
}));



},{"./PathGroup":8}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvRGVjb3JhdGl2ZUxpbmVzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL0V4YW1wbGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9BbHBoYWJldC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL0RyYXdQYXRoLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cy5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdEZWNvcmF0aXZlTGluZXMnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9BbHBoYWJldCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShsYWdyYW5nZS5kcmF3aW5nLkFscGhhYmV0KTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQWxwaGFiZXQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9vcmlnaW5hbCBzY2FsZSBmYWN0b3Jcblx0dmFyIExpbmVzID0ge1xuXHRcdHNjYWxlIDogMSxcblx0XHRzdmdGaWxlIDogJ2Fzc2V0cy9saWduZXMuc3ZnJyxcblx0XHRlYXNlcG9pbnRzIDoge31cblx0fTtcblxuXG5cdHJldHVybiAgQWxwaGFiZXQuZmFjdG9yeShMaW5lcyk7XG5cdFxufSkpOyIsIlx0XG5cdHZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XG5cdHZhciBSYXBoYWVsID0gcmVxdWlyZSgncmFwaGFlbCcpO1xuXHR2YXIgRW1pbGllRm9udCA9IHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzJyk7XG5cdHZhciBEZWNvcmF0aXZlTGluZXMgPSByZXF1aXJlKCcuL0RlY29yYXRpdmVMaW5lcycpO1xuXHR2YXIgRHJhd1BhdGggPSByZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGgnKTtcblx0dmFyIFZlY3RvcldvcmQgPSByZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZCcpO1xuXHR2YXIgUGF0aEVhc2Vwb2ludHMgPSByZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEVhc2Vwb2ludHMnKTsvKiovXG5cdHZhciBQYXRoR3JvdXAgPSByZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwJyk7LyoqL1xuXHR2YXIgVHdlZW5NYXggPSByZXF1aXJlKCdnc2FwJyk7XG5cblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIFcgPSAxNjAwO1xuXHR2YXIgSCA9IDEyMDA7XG5cdHZhciBDRU5URVIgPSBXIC8gMjtcblx0dmFyIFQgPSA1MDtcblx0dmFyIExJTkVfSEVJR0hUID0gMS4yOy8vZW1cblx0dmFyIFNQRUVEID0gMjUwOy8vcHggcGVyIHNlY1xuXG5cblx0dmFyIG5hbWVzID0gW1wiSmVzc2ljYSBXYW5uaW5nXCIsXCJKdWxpYSBSb2Nrd2VsbFwiLFwiQ2Fyb2wgSHViYmFyZFwiLFwiUm9uYWxkIENhbmR5XCIsXCJKb2huIE5ld3RvblwiLFwiRWx2aXMgTmljb2xlXCIsXCJHbG9yaWEgV2VhdmVyXCIsXCJKdWxpYSBDcm9ua2l0ZVwiLFwiTW90aGVyIFJvZ2Vyc1wiLFwiQ2hldnkgSXJ3aW5cIixcIkVkZGllIEFsbGVuXCIsXCJOb3JtYW4gSmFja3NvblwiLFwiUGV0ZXIgUm9nZXJzXCIsXCJXZWlyZCBDaGFzZVwiLFwiQ29saW4gTWF5c1wiLFwiTmFwb2xlb24gTWFydGluXCIsXCJFZGdhciBTaW1wc29uXCIsXCJNb2hhbW1hZCBNY0NhcnRuZXlcIixcIkxpYmVyYWNlIFdpbGxpYW1zXCIsXCJGaWVsZHMgQnVybmV0dFwiLFwiU3RldmUgQXNoZVwiLFwiQ2FycmllIENoYXJsZXNcIixcIlRvbW15IFBhc3RldXJcIixcIkVkZGllIFNpbHZlcnN0b25lXCIsXCJPcHJhaCBBc2hlXCIsXCJSYXkgQmFsbFwiLFwiSmltIERpYW5hXCIsXCJNaWNoZWxhbmdlbG8gRWFzdHdvb2RcIixcIkdlb3JnZSBTaW1wc29uXCIsXCJBbGljaWEgQXVzdGVuXCIsXCJKZXNzaWNhIE5pY29sZVwiLFwiTWFyaWx5biBFdmVyZXR0XCIsXCJLZWl0aCBFYXN0d29vZFwiLFwiUGFibG8gRWFzdHdvb2RcIixcIlBleXRvbiBMdXRoZXJcIixcIk1vemFydCBBcm1zdHJvbmdcIixcIk1pY2hhZWwgQnVybmV0dFwiLFwiS2VpdGggR2xvdmVyXCIsXCJFbGl6YWJldGggQ2hpbGRcIixcIk1pbGVzIEFzdGFpcmVcIixcIkFuZHkgRWRpc29uXCIsXCJNYXJ0aW4gTGVubm9uXCIsXCJUb20gUGljY2Fzb1wiLFwiQmV5b25jZSBEaXNuZXlcIixcIlBldGVyIENsaW50b25cIixcIkhlbnJ5IEtlbm5lZHlcIixcIlBhdWwgQ2hpbGRcIixcIkxld2lzIFNhZ2FuXCIsXCJNaWNoZWxhbmdlbG8gTGVlXCIsXCJNYXJpbHluIEZpc2hlclwiXTtcblx0XG5cdGZ1bmN0aW9uIFNodWZmbGUobykge1xuXHRcdGZvcih2YXIgaiwgeCwgaSA9IG8ubGVuZ3RoOyBpOyBqID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIGkpLCB4ID0gb1stLWldLCBvW2ldID0gb1tqXSwgb1tqXSA9IHgpO1xuXHRcdHJldHVybiBvO1xuXHR9O1xuXHRcblx0U2h1ZmZsZShuYW1lcyk7XG5cdC8vbmFtZXMubGVuZ3RoID0gMTsvKiovXG5cblxuXG5cdHZhciBnZXRTdGFnZSA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBzdGFnZTtcblx0XHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gUmFwaGFlbChcInN2Z1wiLCBXLCBIKTtcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN0YWdlID0gc3RhZ2UgfHwgaW5pdCgpO1xuXHRcdH1cblx0fSkoKTtcblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0dmFyIGVsID0gZ2V0U3RhZ2UoKS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKTtcblx0XHRlbC5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHRcdHJldHVybiBlbDtcblx0fTtcblxuXHR2YXIgbG9hZGluZyA9ICQud2hlbihFbWlsaWVGb250LmxvYWQoKSwgRGVjb3JhdGl2ZUxpbmVzLmxvYWQoKSk7XG5cblx0dmFyIHdvcmRzID0gW1xuXHRcdHtcblx0XHRcdHRleHQgOiAnTWVyY2knLFxuXHRcdFx0c2l6ZSA6IDAuOFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dGV4dCA6ICdKZWFuLVBhdWwnLC8vbmFtZXMucG9wKCksXG5cdFx0XHRzaXplIDogMSxcblx0XHRcdGFwcGVuZCA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0c3ltYm9sOiBEZWNvcmF0aXZlTGluZXMuZ2V0U3ltYm9sKCd3b3JkRGVjb3JhdGlvbkVuZCcpLmdldFBhdGhzKClbMF0sXG5cdFx0XHRcdFx0c2l6ZTogMSAvL2hlaWdodCBpbiBlbVxuXHRcdFx0XHR9O1xuXHRcdFx0fVxuXHRcdH1cblx0XTtcblxuXG5cblxuXHR2YXIgZG9EcmF3ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgdG9wID0gMDtcblx0XHR3b3JkcyA9IHdvcmRzLm1hcChmdW5jdGlvbih3b3JkLCBsaW5lTnVtKXtcblxuXHRcdFx0dmFyIHBhdGhzID0gVmVjdG9yV29yZC5nZXRQYXRocyhFbWlsaWVGb250LCB3b3JkLnRleHQpO1xuXHRcdFx0cGF0aHMgPSBwYXRocy5zY2FsZSh3b3JkLnNpemUpO1xuXG5cdFx0XHQvL2NlbnRlciB0ZXh0XG5cdFx0XHR2YXIgd2lkdGggPSBwYXRocy5nZXRXaWR0aCgpO1xuXHRcdFx0dmFyIGxlZnQgPSAtIHdpZHRoIC8gMjtcblxuXHRcdFx0cGF0aHMuc2V0T2Zmc2V0KGxlZnQsIHRvcCk7XG5cdFx0XHRcblx0XHRcdHRvcCArPSBFbWlsaWVGb250LmdldFVwcGVyTGluZUhlaWdodCgpICogTElORV9IRUlHSFQ7XG5cblx0XHRcdC8vYWpvdXRlIGxlIGd1aWRpIHN1ciBsZSBkZXJuaWVyIG1vdFxuXHRcdFx0aWYod29yZC5hcHBlbmQpIHtcblx0XHRcdFx0dmFyIGFwcGVuZCA9IHdvcmQuYXBwZW5kKCk7XG5cdFx0XHRcdHZhciBjdXJ2ZSA9IGFwcGVuZC5zeW1ib2w7XG5cdFx0XHRcdFxuXHRcdFx0XHQvL3Ryb3V2ZSBsZXMgcG9pbnRzIGRlIGTDqXBhcnQgZXQgZCdhcnJpdsOpZSBkZSBsYSBjdXJ2ZVxuXHRcdFx0XHR2YXIgY3VydmVTdHIgPSBjdXJ2ZS5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdFx0dmFyIHN0YXJ0UG9zID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGN1cnZlU3RyLCAwKTtcblx0XHRcdFx0dmFyIGVuZFBvcyA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJ2ZVN0ciwgY3VydmUuZ2V0TGVuZ3RoKCkpO1xuXG5cdFx0XHRcdHZhciB3b3JkUGF0aHMgPSBwYXRocy5nZXRQYXRocygpO1xuXHRcdFx0XHQvL3Ryb3V2ZSBsZSBwYXRoIHF1aSBmaW5pdCBsZSBwbHVzIMOgIGRyb2l0ZSBkYW5zIGxlcyBsZXR0cmVzXG5cdFx0XHRcdHZhciBsYXN0UGF0aCA9IHdvcmRQYXRocy5yZWR1Y2UoZnVuY3Rpb24obGFzdCwgY3VyKXtcblx0XHRcdFx0XHRpZighbGFzdCkgcmV0dXJuIGN1cjtcblx0XHRcdFx0XHQvL3NpIGxlIHBhdGggc2UgZmluaXQgcGx1cyDDoCBkcm9pdGUgRVQgcXUnaWwgYSB1biBub20gKGxlcyBkw6l0YWlscyBnZW5yZSBiYXJyZSBkdSB0IGV0IHBvaW50IGRlIGkgbidvbnQgcGFzIGRlIG5vbSlcblx0XHRcdFx0XHRpZihjdXIubmFtZSAmJiBsYXN0LmdldEJvdW5kaW5nKCkueDIgPCBjdXIuZ2V0Qm91bmRpbmcoKS54Mil7XG5cdFx0XHRcdFx0XHRsYXN0ID0gY3VyO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRyZXR1cm4gbGFzdDtcblx0XHRcdFx0fSwgbnVsbCk7XG5cblx0XHRcdFx0dmFyIHdvcmRFbmRQb3MgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgobGFzdFBhdGguZ2V0U1ZHU3RyaW5nKCksIGxhc3RQYXRoLmdldExlbmd0aCgpKTtcblxuXHRcdFx0XHQvL3Bvc2l0aW9uIGFic29sdWUgZHUgcG9pbnQgZGUgZMOpcGFydCBkdSBwYXRoXG5cdFx0XHRcdHZhciBhYnNTdGFydFBvcyA9IHtcblx0XHRcdFx0XHR4OiB3b3JkRW5kUG9zLnggLSBzdGFydFBvcy54LFxuXHRcdFx0XHRcdHk6IHdvcmRFbmRQb3MueSAtIHN0YXJ0UG9zLnlcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvKnNob3dQb2ludCh7eDp3b3JkRW5kUG9zLnh4LCB5OndvcmRFbmRQb3MueX0sICcjMjJmZjAwJyk7XG5cdFx0XHRcdHNob3dQb2ludChhYnNTdGFydFBvcywgJyNmZjAwMDAnKTsvKiovXG5cblx0XHRcdFx0Ly/DoCBjb21iaWVuIGRlIGRpc3RhbmNlIGxlIGJvdXRlIGVzdCBkdSBkw6lidXRcblx0XHRcdFx0dmFyIHJlbEVuZFBvcyA9IHtcblx0XHRcdFx0XHR4OiBlbmRQb3MueCAtIHN0YXJ0UG9zLngsXG5cdFx0XHRcdFx0eTogZW5kUG9zLnkgLSBzdGFydFBvcy55XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Ly/DoCBxdWVsIGVuZHJvaXQgb24gZG9pdCBmYWlyZSBhcnJpdmVyIGxlIGVuZHBvcywgcmVsYXRpZiBhdSBkw6lidXQgZHUgcGF0aFxuXHRcdFx0XHR2YXIgdGFyZ2V0UmVsRW5kUG9zID0ge1xuXHRcdFx0XHRcdHg6IC0gd29yZEVuZFBvcy54LFxuXHRcdFx0XHRcdHk6IGFwcGVuZC5zaXplICogRW1pbGllRm9udC5nZXRVcHBlckxpbmVIZWlnaHQoKVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHZhciByYXRpbyA9IHtcblx0XHRcdFx0XHR4IDogdGFyZ2V0UmVsRW5kUG9zLnggLyByZWxFbmRQb3MueCxcblx0XHRcdFx0XHR5IDogdGFyZ2V0UmVsRW5kUG9zLnkgLyByZWxFbmRQb3MueSxcblx0XHRcdFx0fTtcblx0XHRcdFx0Lypjb25zb2xlLmxvZygnc3RhcnQgYXQnLGFic1N0YXJ0UG9zKTtcblx0XHRcdFx0Y29uc29sZS5sb2codGFyZ2V0UmVsRW5kUG9zKTtcblx0XHRcdFx0Y29uc29sZS5sb2cocmF0aW8sIGN1cnJlbnRFbmRQb3MpOyoqL1xuXG5cdFx0XHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRcdFx0bS5zY2FsZShyYXRpby54LCByYXRpby55LCBhYnNTdGFydFBvcy54K3N0YXJ0UG9zLngsIGFic1N0YXJ0UG9zLnkpO1xuXHRcdFx0XHRtLnRyYW5zbGF0ZShhYnNTdGFydFBvcy54LCBhYnNTdGFydFBvcy55KTtcblx0XHRcdFx0Y3VydmUgPSBjdXJ2ZS5hcHBseU1hdHJpeChtKTtcblxuXHRcdFx0XHRsYXN0UGF0aC5hcHBlbmQoY3VydmUpO1xuXHRcdFx0XHQvL3BhdGhzLmFkZFBhdGgoY3VydmUpO1xuXHRcdFx0XHRcblx0XHRcdH1cblxuXHRcdFx0d29yZC5wYXRocyA9IHBhdGhzO1xuXG5cdFx0XHRyZXR1cm4gd29yZDtcblxuXHRcdH0pO1xuXG5cdFx0Ly90cm91dmUgbGUgYm91bmRpbmcgYm94IGRlIGwnZW5zZW1ibGUgZGVzIHBhdGhzLCBzJ2VuIHNlcnZpcmEgcG91ciBzJ2Fzc3VyZXIgcXVlIMOnYSBlbnRyZSB0b3Vqb3VycyBkYW5zIGxlIHN0YWdlXG5cdFx0dmFyIGJvdW5kaW5nID0gd29yZHMucmVkdWNlKGZ1bmN0aW9uKGcsIHcpe1xuXHRcdFx0dy5wYXRocy5nZXRQYXRocygpLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHRcdGcuYWRkUGF0aChwKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGc7XG5cdFx0fSwgUGF0aEdyb3VwLmZhY3RvcnkoKSkuZ2V0Qm91bmRpbmcoKTtcblxuXHRcdHZhciBlbGVtZW50U2V0ID0gZ2V0U3RhZ2UoKS5zZXQoKTtcblxuXHRcdHZhciByZXNpemVTZXQgPSBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIHNjYWxlID0gVyAvIGJvdW5kaW5nLndpZHRoO1xuXHRcdFx0dmFyIHRhcmdldEggPSBib3VuZGluZy5oZWlnaHQgKiBzY2FsZTtcblx0XHRcdGlmKHRhcmdldEggPiBIKXtcblx0XHRcdFx0c2NhbGUgPSBIIC8gYm91bmRpbmcuaGVpZ2h0O1xuXHRcdFx0fVxuXHRcdFx0Ly9jb25zb2xlLmxvZyhzY2FsZSk7XG5cdFx0XHRcblx0XHRcdHZhciB0YXJnZXRMZWZ0ID0gKChXIC0gYm91bmRpbmcud2lkdGgpIC8gMikgLSBib3VuZGluZy54O1xuXHRcdFx0ZWxlbWVudFNldC50cmFuc2Zvcm0oJ3QnK3RhcmdldExlZnQrJywwcycrc2NhbGUrJywnK3NjYWxlKycsMCwwJyk7XG5cdFx0fTtcblxuXHRcdHZhciB0bCA9IHdvcmRzLnJlZHVjZShmdW5jdGlvbih0bCwgd29yZCwgbGluZU51bSl7XG5cdFx0XHRyZXR1cm4gRHJhd1BhdGguZ3JvdXAod29yZC5wYXRocy5nZXRQYXRocygpLCBnZXRTdGFnZSgpLCBlbGVtZW50U2V0LCB7XG5cdFx0XHRcdHB4UGVyU2Vjb25kIDogU1BFRUQgKiB3b3JkLnNpemUsXG5cdFx0XHRcdGNvbG9yIDogJyM0NDQ0NDQnLFxuXHRcdFx0XHRzdHJva2VXaWR0aCA6IDIsXG5cdFx0XHRcdGVhc2luZyA6IGdzYXAuU2luZS5lYXNlSW5PdXRcblx0XHRcdH0sIHRsKTtcblx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7cGF1c2VkOnRydWUsIG9uVXBkYXRlOiByZXNpemVTZXR9KSk7XG5cblx0XHR0bC5wbGF5KCk7XG5cdH07XG5cblx0XHRcblx0dmFyIGJ0biA9ICQoJyNjdHJsJyk7XG5cblx0YnRuLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG5cblxuXHQvL3BhcnNlIGxlcyBlYXNlcG9pbnRzIGRlIGNoYXF1ZSBsZXR0cmUsIG91dHB1dCBlbiBKU09OICjDoCBzYXZlcilcblx0dmFyIHByaW50RWFzZXBvaW50cyA9IGZ1bmN0aW9uKCl7XG5cdFx0UGF0aEVhc2Vwb2ludHMoZ2V0U3RhZ2UoKSwgRW1pbGllRm9udC5nZXRBbGwoKSwgJCgnI2JycCcpLCBbVywgSF0pO1xuXHR9O1xuXG5cdHZhciBnZXRCcHIgPSAkKCcjZ2V0YnJwJyk7XG5cblx0Z2V0QnByLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKHByaW50RWFzZXBvaW50cyk7XG5cdH0pO1xuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9BbHBoYWJldCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJy4vUGF0aCcpLCByZXF1aXJlKCcuL1BhdGhHcm91cCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGgsIHJvb3QubGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXApO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoLCBQYXRoR3JvdXApIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblxuXHR2YXIgc3BlY2lhbENoYXJzID0ge1xuXHRcdCdfeDJEXycgOiAnLScsXG5cdFx0J194MkVfJyA6ICcuJ1xuXHR9O1xuXG5cdHZhciBBbHBoYWJldCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNldHRpbmdzO1xuXHRcdHZhciBzeW1ib2xzID0ge307XG5cblxuXHRcdHZhciBwYXJzZVNWRyA9IGZ1bmN0aW9uKGRhdGEpe1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdFx0dmFyIGRvYyA9ICQoZGF0YSk7XG5cdFx0XHR2YXIgbGF5ZXJzID0gZG9jLmZpbmQoJ2cnKTtcblx0XHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIGxheWVyID0gJChlbCk7XG5cdFx0XHRcdHZhciBpZCA9IGxheWVyLmF0dHIoJ2lkJyk7XG5cdFx0XHRcdGlkID0gc3BlY2lhbENoYXJzW2lkXSB8fCBpZDtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpZCk7XG5cdFx0XHRcdC8vaWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXHRcdFx0XHR2YXIgcGF0aHMgPSBsYXllci5maW5kKCdwYXRoJyk7XG5cdFx0XHRcdGlmKHBhdGhzLmxlbmd0aD09PTApIHJldHVybjtcblxuXHRcdFx0XHR2YXIgc3ltYm9sID0gc3ltYm9sc1tpZF0gPSBuZXcgUGF0aEdyb3VwKGlkKTtcblxuXHRcdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0XHR2YXIgcGF0aEVsID0gJChlbCk7XG5cdFx0XHRcdFx0dmFyIHAgPSBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpLCBudWxsLCBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXSAmJiBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXVtpXSkuc2NhbGUoc2V0dGluZ3Muc2NhbGUgfHwgMSk7XHRcdFx0XHRcblx0XHRcdFx0XHRzeW1ib2wuYWRkUGF0aCggcCApO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0fSk7XG5cblx0XHRcdC8vdHJvdXZlIGxlIHRvcCBhYnNvbHUgKHRvcCBkZSBsYSBsZXR0cmUgbGEgcGx1cyBoYXV0ZSlcblx0XHRcdHZhciB0b3AgPSBPYmplY3Qua2V5cyhzeW1ib2xzKS5yZWR1Y2UoZnVuY3Rpb24obWluLCBzeW1ib2xOYW1lKXtcblx0XHRcdFx0dmFyIHQgPSBzeW1ib2xzW3N5bWJvbE5hbWVdLmdldFRvcCgpO1xuXHRcdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZCB8fCBtaW4gPiB0KSB7XG5cdFx0XHRcdFx0bWluID0gdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWluO1xuXHRcdFx0fSwgdW5kZWZpbmVkKTtcblx0XHRcdC8vY29uc29sZS5sb2coc3ltYm9scyk7XG5cblx0XHRcdC8vYWp1c3RlIGxlIGJhc2VsaW5lIGRlIGNoYXF1ZSBsZXR0cmVcblx0XHRcdE9iamVjdC5rZXlzKHN5bWJvbHMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRcdHN5bWJvbHNba2V5XS5zZXRPZmZzZXQoLTEgKiBzeW1ib2xzW2tleV0uZ2V0TGVmdCgpLCAtMSAqIHRvcCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0fTtcblxuXHRcdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIGxvYWRpbmcgPSAkLmFqYXgoe1xuXHRcdFx0XHR1cmwgOiBzZXR0aW5ncy5zdmdGaWxlLFxuXHRcdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdFx0fSk7XG5cblx0XHRcdGxvYWRpbmcudGhlbihwYXJzZVNWRywgZnVuY3Rpb24oYSwgYiwgYyl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGIpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGMpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbG9hZGluZy5wcm9taXNlKCk7XG5cblx0XHR9O1xuXG5cdFx0XG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24ocykge1xuXHRcdFx0c2V0dGluZ3MgPSBzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fTtcblxuXHRcdHRoaXMubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGRvTG9hZCgpO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXRTeW1ib2wgPSBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBzeW1ib2xzW2xdO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXROU3BhY2UgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRMb3dlckxpbmVIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0SGVpZ2h0KCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0VXBwZXJMaW5lSGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzeW1ib2xzWydOJ10gJiYgc3ltYm9sc1snTiddLmdldEhlaWdodCgpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3ltYm9scztcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0dmFyIGluc3RhbmNlcyA9IHt9O1xuXHRBbHBoYWJldC5mYWN0b3J5ID0gZnVuY3Rpb24oc2V0dGluZ3Mpe1xuXHRcdHZhciBzdmcgPSBzZXR0aW5ncy5zdmdGaWxlO1xuXHRcdGluc3RhbmNlc1tzdmddID0gaW5zdGFuY2VzW3N2Z10gfHwgKG5ldyBBbHBoYWJldCgpKS5pbml0KHNldHRpbmdzKTtcblx0XHRyZXR1cm4gaW5zdGFuY2VzW3N2Z107XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9EcmF3UGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpLCByZXF1aXJlKCdnc2FwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuXywgcm9vdC5SYXBoYWVsLCAocm9vdC5HcmVlblNvY2tHbG9iYWxzIHx8IHJvb3QpKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoXywgUmFwaGFlbCwgVHdlZW5NYXgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9nc2FwIGV4cG9ydHMgVHdlZW5NYXhcblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdGNvbG9yOiAnIzAwMDAwMCcsXG5cdFx0c3Ryb2tlV2lkdGggOiAwLjYsXG5cdFx0cHhQZXJTZWNvbmQgOiAxMDAsIC8vc3BlZWQgb2YgZHJhd2luZ1xuXHRcdGVhc2luZyA6IGdzYXAuUXVhZC5lYXNlSW5cblx0fTtcblxuXHQvL2hlbHBlclxuXHR2YXIgc2hvd1BvaW50ID0gZnVuY3Rpb24ocG9pbnQsIHN0YWdlLCBjb2xvciwgc2l6ZSl7XG5cdFx0c3RhZ2UuY2lyY2xlKHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMikuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0fTtcblxuXHR2YXIgRHJhd1BhdGggPSB7XG5cblx0XHRzaW5nbGUgOiBmdW5jdGlvbihwYXRoLCBzdGFnZSwgZWxTZXQsIHBhcmFtcyl7XG5cdFx0XHRcblx0XHRcdHZhciBzZXR0aW5ncyA9IF8uZXh0ZW5kKHt9LCBkZWZhdWx0cywgcGFyYW1zKTtcblx0XHRcdHZhciBwYXRoU3RyID0gcGF0aC5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdHZhciBsZW5ndGggPSBwYXRoLmdldExlbmd0aCgpO1xuXG5cdFx0XHR2YXIgcHhQZXJTZWNvbmQgPSBzZXR0aW5ncy5weFBlclNlY29uZDtcblx0XHRcdHZhciB0aW1lID0gbGVuZ3RoIC8gcHhQZXJTZWNvbmQ7XG5cblx0XHRcdHZhciBhbmltID0ge3RvOiAwfTtcblx0XHRcdFxuXHRcdFx0dmFyIHVwZGF0ZSA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgZWw7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBhbmltLnRvKTtcblx0XHRcdFx0XHRpZihlbCkgZWwucmVtb3ZlKCk7XG5cdFx0XHRcdFx0ZWwgPSBzdGFnZS5wYXRoKHBhdGhQYXJ0KTtcblx0XHRcdFx0XHRpZihlbFNldCkge1xuXHRcdFx0XHRcdFx0ZWxTZXQucHVzaChlbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IHNldHRpbmdzLnN0cm9rZVdpZHRoLCBzdHJva2U6IHNldHRpbmdzLmNvbG9yfSk7XG5cdFx0XHRcdH07XG5cdFx0XHR9KSgpO1xuXG5cdFx0XHR2YXIgZWFzZVBvaW50cyA9IHBhdGguZ2V0RWFzZXBvaW50cygpO1xuXHRcdFx0Lypjb25zb2xlLmxvZyhlYXNlUG9pbnRzLmxlbmd0aCk7XG5cdFx0XHRlYXNlUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0dmFyIHAgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcG9zKTtcblx0XHRcdFx0c2hvd1BvaW50KHAsIHN0YWdlLCAnI2ZmMDAwMCcsIDIpO1xuXHRcdFx0fSk7LyoqL1xuXHRcdFx0XG5cblx0XHRcdHZhciBsYXN0ID0gMDtcblx0XHRcdHJldHVybiBlYXNlUG9pbnRzLnJlZHVjZShmdW5jdGlvbih0bCwgZGlzdCkge1xuXHRcdFx0XHR2YXIgdGltZSA9IChkaXN0LWxhc3QpIC8gcHhQZXJTZWNvbmQ7XG5cdFx0XHRcdGxhc3QgPSBkaXN0O1xuXHRcdFx0XHRyZXR1cm4gdGwudG8oYW5pbSwgdGltZSwge3RvOiBkaXN0LCBlYXNlIDogc2V0dGluZ3MuZWFzaW5nfSk7XG5cdFx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7XG5cdFx0XHRcdG9uVXBkYXRlIDogdXBkYXRlXG5cdFx0XHR9KSkudG8oYW5pbSwgKChsZW5ndGggLSAoZWFzZVBvaW50cy5sZW5ndGggJiYgZWFzZVBvaW50c1tlYXNlUG9pbnRzLmxlbmd0aC0xXSkpIC8gcHhQZXJTZWNvbmQpLCB7dG86IGxlbmd0aCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0XG5cdFx0fSxcblxuXHRcdGdyb3VwIDogZnVuY3Rpb24ocGF0aHMsIHN0YWdlLCBlbFNldCwgc2V0dGluZ3MsIHRsKSB7XG5cdFx0XHRyZXR1cm4gcGF0aHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBwYXRoKXtcblx0XHRcdFx0cmV0dXJuIHRsLmFwcGVuZChEcmF3UGF0aC5zaW5nbGUocGF0aCwgc3RhZ2UsIGVsU2V0LCBzZXR0aW5ncykpO1xuXHRcdFx0fSwgdGwgfHwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe3BhdXNlZDp0cnVlfSkpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBEcmF3UGF0aDtcblx0XG59KSk7XG5cblxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi9BbHBoYWJldCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShsYWdyYW5nZS5kcmF3aW5nLkFscGhhYmV0KTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQWxwaGFiZXQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9vcmlnaW5hbCBzY2FsZSBmYWN0b3Jcblx0dmFyIEVtaWxpZUZvbnQgPSB7XG5cdFx0c2NhbGUgOiAxLFxuXHRcdHN2Z0ZpbGUgOiAnYXNzZXRzL2VtaWxpZUZvbnQuc3ZnJyxcblx0XHQvL1BBUlPDiSBhdmVjIGxlIGhlbHBlclxuXHRcdGVhc2Vwb2ludHMgOiB7XCLDlFwiOltudWxsLFsxNl1dLFwiw49cIjpbWzEzNl1dLFwiw45cIjpbWzkzXSxbMTZdXSxcIsOLXCI6W1sxNTldXSxcIsOKXCI6W1sxNTldLFsxN11dLFwiw4hcIjpbWzE1OV1dLFwiw4lcIjpbWzE1OV1dLFwiw4dcIjpbbnVsbCxbMTNdXSxcIsOEXCI6W1sxODldXSxcIsOCXCI6W1sxODldLG51bGwsWzE1XV0sXCLDgFwiOltbMTg5XV0sXCJaXCI6W1sxOTMsMzQwXV0sXCJZXCI6W1szMjldXSxcIldcIjpbWzIyNywzMzZdXSxcIlZcIjpbWzIzMV1dLFwiVVwiOltbMzE3XV0sXCJSXCI6W1syODldXSxcIk9cIjpbWzMwMF1dLFwiTlwiOltbMjQ3LDM1MF1dLFwiTVwiOltbMjM4LDMzOCw0NTJdXSxcIkxcIjpbWzIyMF1dLFwiS1wiOltbMTE1XSxbMTIyXV0sXCJKXCI6W1sxMzJdXSxcIkhcIjpbWzE0Ml1dLFwiR1wiOltbMzIxXV0sXCJFXCI6W1sxNTldXSxcIkRcIjpbWzM3MF1dLFwiQlwiOltbNDUzXV0sXCJBXCI6W1sxODldXSxcIsO0XCI6W1sxNTVdLFsxNl1dLFwiw7ZcIjpbWzE1NV1dLFwiw69cIjpbWzQyXV0sXCLDrlwiOltbNDJdLFsxNl1dLFwiw6tcIjpbWzQwXV0sXCLDqlwiOltbNDBdLFsxN11dLFwiw6hcIjpbWzQwXV0sXCLDqVwiOltbNDBdXSxcIsOnXCI6W1s3Ml0sWzEzXV0sXCLDpFwiOltbNTUsMTMzXV0sXCLDolwiOltbNTUsMTMzXSxbMTVdXSxcIsOgXCI6W1s1NSwxMzNdXSxcInpcIjpbWzExMCwyMTBdXSxcInlcIjpbWzQyLDExNiwyMjddXSxcInhcIjpbWzQyXV0sXCJ3XCI6W1szOCwxMDcsMTc3XV0sXCJ2XCI6W1s2Nl1dLFwidVwiOltbMzMsMTA1XV0sXCJ0XCI6W1sxMDNdXSxcInNcIjpbWzUwLDExMF1dLFwiclwiOltbNjRdXSxcInFcIjpbWzE0NCwzMjVdXSxcInBcIjpbWzU2LDMwNV1dLFwib1wiOltbMTU1XV0sXCJuXCI6W1sxMDRdXSxcIm1cIjpbWzExMF1dLFwibFwiOltbMTIzXV0sXCJrXCI6W1sxMjksMjQ0LDMyN11dLFwialwiOltbNTJdXSxcImlcIjpbWzQyXV0sXCJoXCI6W1sxMzEsMjQ4LDI5M11dLFwiZ1wiOltbNjAsMTQ1XV0sXCJmXCI6W1sxMzQsNDE5XV0sXCJkXCI6W1s1NywyMzRdXSxcImNcIjpbWzcyXV0sXCJiXCI6W1sxMjYsMjkxXV0sXCJhXCI6W1s1NSwxMzNdXX1cblx0fTtcblxuXG5cdHJldHVybiAgQWxwaGFiZXQuZmFjdG9yeShFbWlsaWVGb250KTs7XG5cdFxufSkpOyIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByZWcgPSAvKFthLXpdKShbMC05XFxzXFwsXFwuXFwtXSspL2dpO1xuXHRcdFxuXHQvL2V4cGVjdGVkIGxlbmd0aCBvZiBlYWNoIHR5cGVcblx0dmFyIGV4cGVjdGVkTGVuZ3RocyA9IHtcblx0XHRtIDogMixcblx0XHRsIDogMixcblx0XHR2IDogMSxcblx0XHRoIDogMSxcblx0XHRjIDogNixcblx0XHRzIDogNFxuXHR9O1xuXG5cdHZhciBQYXRoID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdC8vaWYoc3ZnKSBjb25zb2xlLmxvZyhzdmcsIHBhcnNlZCk7XG5cdFx0dGhpcy5lYXNlUG9pbnRzID0gZWFzZVBvaW50cyB8fCBbXTtcblx0XHQvL2NvbnNvbGUubG9nKG5hbWUsIGVhc2VQb2ludHMpO1xuXHRcdHRoaXMuX3NldFBhcnNlZChwYXJzZWQgfHwgdGhpcy5fcGFyc2Uoc3ZnKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuX3NldFBhcnNlZCA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuXHRcdC8vY29uc29sZS5sb2cocGFyc2VkKTtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmN1YmljIHx8IHRoaXMuX3BhcnNlQ3ViaWMoKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLmdldFRvdGFsTGVuZ3RoKHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIGFuIFNWRyBzdHJpbmcgb2YgdGhlIHBhdGggc2VnZW1udHMuIEl0IGlzIG5vdCB0aGUgc3ZnIHByb3BlcnR5IG9mIHRoZSBwYXRoLCBhcyBpdCBpcyBwb3RlbnRpYWxseSB0cmFuc2Zvcm1lZFxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKHN2Zywgc2VnbWVudCl7XG5cdFx0XHRyZXR1cm4gc3ZnICsgc2VnbWVudC50eXBlICsgc2VnbWVudC5hbmNob3JzLmpvaW4oJywnKTsgXG5cdFx0fSwgJycpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIHRoZSBwb3NpdGlvbnMgYXQgd2hpY2ggd2UgaGF2ZSBlYXNlIHBvaW50cyAod2hpY2ggYXJlIHByZXBhcnNlZCBhbmQgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBwYXRoJ3MgZGVmaW5pdGlvbnMpXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLmdldEVhc2Vwb2ludHMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5lYXNlUG9pbnRzO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldFBvaW50ID0gZnVuY3Rpb24oaWR4KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzLnBhcnNlZCk7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkW2lkeF0gJiYgdGhpcy5wYXJzZWRbaWR4XS5hbmNob3JzO1xuXHR9O1xuXG5cdC8qKlxuXHRQYXJzZXMgYW4gU1ZHIHBhdGggc3RyaW5nIHRvIGEgbGlzdCBvZiBzZWdtZW50IGRlZmluaXRpb25zIHdpdGggQUJTT0xVVEUgcG9zaXRpb25zIHVzaW5nIFJhcGhhZWwucGF0aDJjdXJ2ZVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5fcGFyc2UgPSBmdW5jdGlvbihzdmcpIHtcblx0XHR2YXIgY3VydmUgPSBSYXBoYWVsLnBhdGgyY3VydmUoc3ZnKTtcblx0XHR2YXIgcGF0aCA9IGN1cnZlLm1hcChmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlIDogcG9pbnQuc2hpZnQoKSxcblx0XHRcdFx0YW5jaG9ycyA6IHBvaW50XG5cdFx0XHR9O1xuXHRcdH0pO1xuXHRcdHJldHVybiBwYXRoO1xuXHR9O1xuXG5cdC8qKlxuXHRcdFBhcnNlcyBhIHBhdGggZGVmaW5lZCBieSBwYXJzZVBhdGggdG8gYSBsaXN0IG9mIGJlemllciBwb2ludHMgdG8gYmUgdXNlZCBieSBHcmVlbnNvY2sgQmV6aWVyIHBsdWdpbiwgZm9yIGV4YW1wbGVcblx0XHRUd2Vlbk1heC50byhzcHJpdGUsIDUwMCwge1xuXHRcdFx0YmV6aWVyOnt0eXBlOlwiY3ViaWNcIiwgdmFsdWVzOmN1YmljfSxcblx0XHRcdGVhc2U6UXVhZC5lYXNlSW5PdXQsXG5cdFx0XHR1c2VGcmFtZXMgOiB0cnVlXG5cdFx0fSk7XG5cdFx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlQ3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhdGgpO1xuXHRcdC8vYXNzdW1lZCBmaXJzdCBlbGVtZW50IGlzIGEgbW92ZXRvXG5cdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmN1YmljID0gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKGFuY2hvcnMsIHNlZ21lbnQpe1xuXHRcdFx0dmFyIGEgPSBzZWdtZW50LmFuY2hvcnM7XG5cdFx0XHRpZihzZWdtZW50LnR5cGU9PT0nTScpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6YVsxXX0pO1xuXHRcdFx0fSBlbHNlIGlmKHNlZ21lbnQudHlwZT09PSdMJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzJdLCB5OiBhWzNdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVs0XSwgeTogYVs1XX0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0XHR9LCBbXSk7XG5cblx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHR9O1xuXG5cdC8vdHJvdXZlIGxlIGJvdW5kaW5nIGJveCBkJ3VuZSBsZXR0cmUgKGVuIHNlIGZpYW50IGp1c3RlIHN1ciBsZXMgcG9pbnRzLi4uIG9uIG5lIGNhbGN1bGUgcGFzIG91IHBhc3NlIGxlIHBhdGgpXG5cdFBhdGgucHJvdG90eXBlLmdldEJvdW5kaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJhcGhhZWwucGF0aEJCb3godGhpcy5nZXRTVkdTdHJpbmcoKSk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0udHJhbnNsYXRlKHgsIHkpO1xuXHRcdHZhciBzdmcgPSBSYXBoYWVsLm1hcFBhdGgodGhpcy5nZXRTVkdTdHJpbmcoKSwgbSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShzdmcsIHRoaXMubmFtZSwgbnVsbCwgdGhpcy5lYXNlUG9pbnRzKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgcGF0aCwgc2NhbGVkXG5cdFBhdGgucHJvdG90eXBlLnNjYWxlID0gUGF0aC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbihyYXRpbykge1xuXHRcdHJhdGlvID0gcmF0aW8gfHwgMTtcblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS5zY2FsZShyYXRpbyk7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHR2YXIgZWFzZVBvaW50cyA9IHRoaXMuZWFzZVBvaW50cy5tYXAoZnVuY3Rpb24oZXApe1xuXHRcdFx0cmV0dXJuIGVwICogcmF0aW87XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShzdmcsIHRoaXMubmFtZSwgbnVsbCwgZWFzZVBvaW50cyk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYXBwbHlNYXRyaXggPSBmdW5jdGlvbihtKXtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHZhciBlYXNlUG9pbnRzID0gdGhpcy5lYXNlUG9pbnRzLm1hcChmdW5jdGlvbihlcCl7XG5cdFx0XHRyZXR1cm4gZXAgOy8vO1xuXHRcdH0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIGVhc2VQb2ludHMpO1xuXHR9OyBcblxuXHRQYXRoLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihwYXJ0LCBuYW1lKcKge1xuXHRcdC8vY29uc29sZS5sb2cocGFydCk7XG5cdFx0aWYobmFtZSkgdGhpcy5uYW1lICs9IG5hbWU7XG5cdFx0dGhpcy5fc2V0UGFyc2VkKHRoaXMucGFyc2VkLmNvbmNhdChwYXJ0LnBhcnNlZC5zbGljZSgxKSkpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmFkZEVhc2Vwb2ludCA9IGZ1bmN0aW9uKHBvcyl7XG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzLmVhc2VQb2ludHMsIHBvcyk7XG5cdFx0dGhpcy5lYXNlUG9pbnRzLnB1c2gocG9zKTtcblx0fTtcblxuXHRQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cykge1xuXHRcdHJldHVybiBuZXcgUGF0aChzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cyk7XG5cdH07XG5cblx0cmV0dXJuIFBhdGg7XG5cbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5qUXVlcnksIHJvb3QuXywgcm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoJCwgXywgUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgR0VUX0RFRkFVTFRTID0gZmFsc2U7XG5cblx0dmFyIGRlZ1RvUmFkID0gTWF0aC5QSSAvIDE4MDtcblx0dmFyIHJhZFRvRGVnID0gMTgwIC8gTWF0aC5QSTtcblx0dmFyIHRvUmFkaWFucyA9IGZ1bmN0aW9uKGRlZ3JlZXMpIHtcblx0ICByZXR1cm4gZGVncmVlcyAqIGRlZ1RvUmFkO1xuXHR9O1x0IFxuXHQvLyBDb252ZXJ0cyBmcm9tIHJhZGlhbnMgdG8gZGVncmVlcy5cblx0dmFyIHRvRGVncmVlcyA9IGZ1bmN0aW9uKHJhZGlhbnMpIHtcblx0ICByZXR1cm4gcmFkaWFucyAqIHJhZFRvRGVnO1xuXHR9O1xuXG5cblx0dmFyIGRpc3RhbmNlVHJlc2hvbGQgPSA0MDtcblx0dmFyIGFuZ2xlVHJlc2hvbGQgPSB0b1JhZGlhbnMoMTIpO1xuXG5cdHZhciBzdGFnZTtcblxuXHQvL2hlbHBlclxuXHR2YXIgc2hvd1BvaW50ID0gZnVuY3Rpb24ocG9pbnQsIGNvbG9yLCBzaXplKXtcblx0XHR2YXIgZWwgPSBzdGFnZS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKTtcblx0XHRlbC5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHRcdHJldHVybiBlbDtcblx0fTtcblxuXHR2YXIgc2hvdyA9IGZ1bmN0aW9uKHBhdGhEZWYpIHtcblx0XHR2YXIgcGF0aCA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XHRcdFx0XG5cdFx0dmFyIGVsID0gc3RhZ2UucGF0aChwYXRoKTtcblx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiAzLCBzdHJva2U6ICcjMDAwMDAwJ30pOy8qKi9cblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0dmFyIGZpbmREZWZhdWx0cyA9IGZ1bmN0aW9uKHBhdGhEZWYpe1xuXHRcdHZhciBwYXRoU3RyID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcblx0XHR2YXIgbGVuZ3RoID0gcGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHR2YXIgcG9pbnRQb3MgPSBbXTtcblx0XHRcblx0XHRcblx0XHR2YXIgcHJlY2lzaW9uID0gMTtcblx0XHR2YXIgcHJldjtcblx0XHR2YXIgYWxsUG9pbnRzID0gW107XG5cdFx0Zm9yKHZhciBpPXByZWNpc2lvbjsgaTw9bGVuZ3RoOyBpICs9IHByZWNpc2lvbikge1xuXHRcdFx0Ly92YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgaSk7XG5cdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBpKTtcblx0XHRcdFxuXHRcdFx0Ly9pdCBzZWVtcyB0aGF0IFJhcGhhZWwncyBhbHBoYSBpcyBpbmNvbnNpc3RlbnQuLi4gc29tZXRpbWVzIG92ZXIgMzYwXG5cdFx0XHR2YXIgYWxwaGEgPSBNYXRoLmFicyggTWF0aC5hc2luKCBNYXRoLnNpbih0b1JhZGlhbnMocC5hbHBoYSkpICkpO1xuXHRcdFx0aWYocHJldikge1xuXHRcdFx0XHRwLmRpZmYgPSBNYXRoLmFicyhhbHBoYSAtIHByZXYpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cC5kaWZmID0gMDtcblx0XHRcdH1cblx0XHRcdHByZXYgPSBhbHBoYTtcblx0XHRcdC8vY29uc29sZS5sb2cocC5kaWZmKTtcblxuXHRcdFx0aWYocC5kaWZmID4gYW5nbGVUcmVzaG9sZCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGkpO1xuXHRcdFx0XHRwb2ludFBvcy5wdXNoKGkpO1xuXHRcdFx0fVxuXG5cdFx0XHQvL3AuY29tcHV0ZWRBbHBoYSA9IGFscGhhO1xuXHRcdFx0Ly9hbGxQb2ludHMucHVzaChwKTtcblxuXHRcdH0vKiovXG5cblx0XHQgLypcblx0XHQvL0RFQlVHIFxuXHRcdC8vZmluZCBtYXggY3VydmF0dXJlIHRoYXQgaXMgbm90IGEgY3VzcCAodHJlc2hvbGQgZGV0ZXJtaW5lcyBjdXNwKVxuXHRcdHZhciBjdXNwVHJlc2hvbGQgPSA0MDtcblx0XHR2YXIgbWF4ID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihtLCBwKXtcblx0XHRcdHJldHVybiBwLmRpZmYgPiBtICYmIHAuZGlmZiA8IGN1c3BUcmVzaG9sZCA/IHAuZGlmZiA6IG07XG5cdFx0fSwgMCk7XG5cdFx0Y29uc29sZS5sb2cobWF4KTtcblxuXHRcdHZhciBwcmV2ID0gWzAsMCwwLDBdO1xuXHRcdGFsbFBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0dmFyIHIgPSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdHZhciBnID0gMjU1IC0gTWF0aC5yb3VuZCgocC5kaWZmIC8gbWF4KSAqIDI1NSk7XG5cdFx0XHR2YXIgcmdiID0gJ3JnYignK3IrJywnK2crJywwKSc7XG5cdFx0XHRpZihyPjEwMCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PScpO1xuXHRcdFx0XHRwcmV2LmZvckVhY2goZnVuY3Rpb24ocCl7Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhKTt9KTtcblx0XHRcdFx0Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhLCByZ2IpO1xuXHRcdFx0fVxuXHRcdFx0cC55ICs9IDE1MDtcblx0XHRcdHNob3dQb2ludChwLCByZ2IsIDAuNSk7XG5cdFx0XHRwcmV2WzNdID0gcHJldlsyXTtcblx0XHRcdHByZXZbMl0gPSBwcmV2WzFdO1xuXHRcdFx0cHJldlsxXSA9IHByZXZbMF07XG5cdFx0XHRwcmV2WzBdID0gcDtcblx0XHR9KTtcblx0XHQvKiovXG5cblx0XHQvL2ZpbmRzIGdyb3VwcyBvZiBwb2ludHMgZGVwZW5kaW5nIG9uIHRyZXNob2xkLCBhbmQgZmluZCB0aGUgbWlkZGxlIG9mIGVhY2ggZ3JvdXBcblx0XHRyZXR1cm4gcG9pbnRQb3MucmVkdWNlKGZ1bmN0aW9uKHBvaW50cywgcG9pbnQpe1xuXG5cdFx0XHR2YXIgbGFzdCA9IHBvaW50c1twb2ludHMubGVuZ3RoLTFdO1xuXHRcdFx0aWYoIWxhc3QgfHwgcG9pbnQgLSBsYXN0W2xhc3QubGVuZ3RoLTFdID4gZGlzdGFuY2VUcmVzaG9sZCl7XG5cdFx0XHRcdGxhc3QgPSBbcG9pbnRdO1xuXHRcdFx0XHRwb2ludHMucHVzaChsYXN0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxhc3QucHVzaChwb2ludCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwb2ludHM7XG5cdFx0fSwgW10pLm1hcChmdW5jdGlvbihwb2ludHMpe1xuXHRcdFx0cmV0dXJuIHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGgvMildO1xuXHRcdH0pO1xuXHRcdFxuXHR9O1xuXG5cdHZhciBhbGxQb2ludHMgPSBbXTtcblx0dmFyIGVhc2VQb2ludHMgPSB7fTtcblxuXHR2YXIgY3VycmVudDtcblxuXHR2YXIgZ2V0RWFzZXBvaW50cyA9IGZ1bmN0aW9uKGxldHRlciwgcGF0aElkeCwgcGF0aERlZil7XG5cdFx0XG5cdFx0dmFyIHBhdGggPSBzaG93KHBhdGhEZWYpO1xuXG5cdFx0Ly9hcmUgZWFzZSBwb2ludHMgYWxyZWFkeSBzZXQgZm9yIHRoaXMgcGF0aD9cblx0XHR2YXIgcGF0aEVhc2VQb2ludHMgPSBwYXRoRGVmLmdldEVhc2Vwb2ludHMoKTsgXG5cdFx0aWYocGF0aEVhc2VQb2ludHMubGVuZ3RoID09PSAwICYmIEdFVF9ERUZBVUxUUykge1xuXHRcdFx0cGF0aEVhc2VQb2ludHMgPSBmaW5kRGVmYXVsdHMocGF0aERlZik7XG5cdFx0fVxuXG5cdFx0Ly9jb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XG5cblx0XHR2YXIgaW5hY3RpdmVDb2xvciA9ICcjMDBmZjAwJztcblx0XHR2YXIgYWN0aXZlQ29sb3IgPSAnI2ZmMjIwMCc7XG5cblx0XHR2YXIgYWRkUG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdFx0dmFyIHBPYmogPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcG9zKTtcblx0XHRcdHZhciBwb2ludCA9IHNob3dQb2ludChwT2JqLCBpbmFjdGl2ZUNvbG9yLCAzKTtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aElkeCk7XG5cdFx0XHRwb2ludC5kYXRhKCdwb3MnLCBwb3MpO1xuXHRcdFx0cG9pbnQuZGF0YSgnbGV0dGVyJywgbGV0dGVyKTtcblx0XHRcdHBvaW50LmRhdGEoJ3BhdGhJZHgnLCBwYXRoSWR4KTtcblx0XHRcdHBvaW50LmRhdGEoJ3gnLCBwT2JqLngpO1xuXHRcdFx0cG9pbnQuZGF0YSgneScsIHBPYmoueSk7XG5cblx0XHRcdGFsbFBvaW50cy5wdXNoKHBvaW50KTtcblxuXHRcdFx0cG9pbnQuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdFx0XG5cdFx0XHRcdGFsbFBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0XHRcdHAuYXR0cih7ZmlsbDogaW5hY3RpdmVDb2xvcn0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRwb2ludC5hdHRyKHtmaWxsOiBhY3RpdmVDb2xvcn0pO1xuXG5cdFx0XHRcdGN1cnJlbnQgPSB7XG5cdFx0XHRcdFx0cG9pbnQ6IHBvaW50LFxuXHRcdFx0XHRcdHBhdGg6IHBhdGgsXG5cdFx0XHRcdFx0cGF0aERlZjogcGF0aERlZixcblx0XHRcdFx0XHRzdmcgOiBwYXRoU3RyLFxuXHRcdFx0XHRcdGxldHRlciA6IGxldHRlcixcblx0XHRcdFx0XHRwYXRoSWR4IDogcGF0aElkeFxuXHRcdFx0XHR9O1xuXG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0cGF0aEVhc2VQb2ludHMuZm9yRWFjaChhZGRQb2ludCk7LyoqL1xuXG5cdFx0cGF0aC5jbGljayhmdW5jdGlvbigpe1xuXHRcdFx0Ly9jb25zb2xlLmxvZygnYWRkJyk7XG5cdFx0XHRhZGRQb2ludCgwKTtcblx0XHR9KTtcblx0XHRcblxuXHRcdHJldHVybiBwYXRoRWFzZVBvaW50cztcblxuXHR9O1xuXG5cdHZhciBtb3ZlQ3VycmVudCA9IGZ1bmN0aW9uKGRpc3QpIHtcblx0XHR2YXIgcCA9IGN1cnJlbnQucG9pbnQ7XG5cdFx0dmFyIHBvcyA9IHAuZGF0YSgncG9zJyk7XG5cdFx0cG9zICs9IGRpc3Q7XG5cdFx0dmFyIG1heCA9IGN1cnJlbnQucGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHRpZihwb3MgPCAwKSBwb3MgPSAwO1xuXHRcdGlmKHBvcyA+IG1heCkgcG9zID0gbWF4O1xuXHRcdHAuZGF0YSgncG9zJywgcG9zKTtcblxuXHRcdHZhciBwT2JqID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGN1cnJlbnQuc3ZnLCBwb3MpO1xuXG5cdFx0dmFyIHggPSBwLmRhdGEoJ3gnKTtcblx0XHR2YXIgeSA9IHAuZGF0YSgneScpO1xuXHRcdHZhciBkZWx0YVggPSBwT2JqLnggLSB4O1xuXHRcdHZhciBkZWx0YVkgPSBwT2JqLnkgLSB5O1xuXG5cdFx0LypwLmRhdGEoJ3gnLCBwT2JqLngpO1xuXHRcdHAuZGF0YSgneScsIHBPYmoueSk7LyoqL1xuXG5cdFx0cC50cmFuc2Zvcm0oJ3QnICsgZGVsdGFYICsgJywnICsgZGVsdGFZKTtcblx0XHRwcmludEpTT04oKTtcblxuXHR9O1xuXG5cblx0JCh3aW5kb3cpLm9uKCdrZXlkb3duLmVhc2UnLCBmdW5jdGlvbihlKXtcblx0XHQvL2NvbnNvbGUubG9nKGUud2hpY2gsIGN1cnJlbnQpO1xuXHRcdHZhciBMRUZUID0gMzc7XG5cdFx0dmFyIFVQID0gMzg7XG5cdFx0dmFyIFJJR0hUID0gMzk7XG5cdFx0dmFyIERPV04gPSA0MDtcblx0XHR2YXIgREVMID0gNDY7XG5cblx0XHRpZihjdXJyZW50KSB7XG5cdFx0XHRzd2l0Y2goZS53aGljaCkge1xuXHRcdFx0XHRjYXNlIExFRlQ6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KC0xKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBET1dOOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMTApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFJJR0hUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgxKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBVUDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMTApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIERFTDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0dmFyIGlkeCA9IGFsbFBvaW50cy5pbmRleE9mKGN1cnJlbnQucG9pbnQpO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coaWR4KTtcblx0XHRcdFx0XHRjdXJyZW50LnBvaW50LnJlbW92ZSgpO1xuXHRcdFx0XHRcdGFsbFBvaW50cy5zcGxpY2UoaWR4LCAxKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGFsbFBvaW50cyk7XG5cdFx0XHRcdFx0Y3VycmVudCA9IG51bGw7XG5cdFx0XHRcdFx0cHJpbnRKU09OKCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHR9KTtcblxuXHR2YXIgcHJpbnROb2RlO1xuXHR2YXIgcHJpbnRKU09OID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGpzb24gPSBhbGxQb2ludHMucmVkdWNlKGZ1bmN0aW9uKGpzb24sIHBvaW50KXtcblxuXHRcdFx0dmFyIGxldHRlciA9IHBvaW50LmRhdGEoJ2xldHRlcicpO1xuXHRcdFx0dmFyIHBhdGhJZHggPSBwb2ludC5kYXRhKCdwYXRoSWR4Jyk7XG5cblx0XHRcdHZhciBwYXRocyA9IGpzb25bbGV0dGVyXSA9IGpzb25bbGV0dGVyXSB8fCBbXTtcblx0XHRcdHZhciBlYXNlcG9pbnRzID0gcGF0aHNbcGF0aElkeF0gPSBwYXRoc1twYXRoSWR4XSB8fCBbXTtcblx0XHRcdGVhc2Vwb2ludHMucHVzaChwb2ludC5kYXRhKCdwb3MnKSk7XG5cdFx0XHRlYXNlcG9pbnRzLnNvcnQoZnVuY3Rpb24oYSwgYil7XG5cdFx0XHRcdHJldHVybiBhIC0gYjtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGpzb247XG5cdFx0fSwge30pO1xuXHRcdHByaW50Tm9kZS50ZXh0KEpTT04uc3RyaW5naWZ5KGpzb24pKTtcblx0fTtcblxuXHRyZXR1cm4gZnVuY3Rpb24ocywgZ3JvdXBzLCBub2RlLCBkaW0pe1xuXHRcdHN0YWdlID0gcztcblx0XHR2YXIgcGFkID0gMjA7XG5cdFx0dmFyIGF2YWlsVyA9IGRpbVswXSAtIHBhZDtcblxuXHRcdHZhciBncm91cE1heEhlaWdodCA9IE9iamVjdC5rZXlzKGdyb3VwcykucmVkdWNlKGZ1bmN0aW9uKG1pbiwgZ3JvdXBOYW1lKXtcblx0XHRcdHZhciB0ID0gZ3JvdXBzW2dyb3VwTmFtZV0uZ2V0SGVpZ2h0KCk7XG5cdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZCB8fCB0ID4gbWluKSB7XG5cdFx0XHRcdG1pbiA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWluO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0XG5cdFx0dmFyIHRvcExlZnQgPSB7eDpwYWQsIHk6cGFkfTtcblx0XHRPYmplY3Qua2V5cyhncm91cHMpLmZvckVhY2goZnVuY3Rpb24obmFtZSl7XG5cdFx0XHR2YXIgZ3JvdXAgPSBncm91cHNbbmFtZV07XG5cdFx0XHQvL2NvbnNvbGUubG9nKGdyb3VwKTtcblx0XHRcdHZhciBlbmRMZWZ0ID0gdG9wTGVmdC54ICsgZ3JvdXAuZ2V0V2lkdGgoKSArIHBhZDtcblxuXHRcdFx0aWYoZW5kTGVmdCA+IGF2YWlsVykge1xuXHRcdFx0XHR0b3BMZWZ0LnggPSBwYWQ7XG5cdFx0XHRcdHRvcExlZnQueSArPSBwYWQgKyBncm91cE1heEhlaWdodDtcblx0XHRcdFx0ZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cdFx0XHR9XG5cblxuXHRcdFx0dmFyIHRoaXNFYXNlID0gZ3JvdXAucGF0aHMubWFwKGZ1bmN0aW9uKHAsIGlkeCl7XG5cdFx0XHRcdHAgPSBwLnRyYW5zbGF0ZSh0b3BMZWZ0LngsIHRvcExlZnQueSk7XG5cdFx0XHRcdHJldHVybiBnZXRFYXNlcG9pbnRzKG5hbWUsIGlkeCwgcCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0XHR0b3BMZWZ0LnggPSBlbmRMZWZ0O1x0XHRcdFxuXG5cdFx0fSk7XG5cdFx0Ly9jb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblxuXHRcdHByaW50Tm9kZSA9IG5vZGU7XG5cdFx0cHJpbnRKU09OKCk7XG5cdH07XG5cblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBQYXRoR3JvdXAgPSBmdW5jdGlvbihuYW1lKXtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMuYm91bmRpbmcgPSB0aGlzLnBhdGhzLnJlZHVjZShmdW5jdGlvbihib3VuZGluZywgcGF0aCl7XG5cdFx0XHR2YXIgcGF0aEJvdW5kaW5nID0gcGF0aC5nZXRCb3VuZGluZygpO1xuXG5cdFx0XHRib3VuZGluZyA9IGJvdW5kaW5nIHx8IHBhdGhCb3VuZGluZztcblx0XHRcdGJvdW5kaW5nLnggPSBib3VuZGluZy54IDwgcGF0aEJvdW5kaW5nLnggPyBib3VuZGluZy54IDogIHBhdGhCb3VuZGluZy54O1xuXHRcdFx0Ym91bmRpbmcueSA9IGJvdW5kaW5nLnkgPCBwYXRoQm91bmRpbmcueSA/IGJvdW5kaW5nLnkgOiAgcGF0aEJvdW5kaW5nLnk7XG5cdFx0XHRib3VuZGluZy54MiA9IGJvdW5kaW5nLngyID4gcGF0aEJvdW5kaW5nLngyID8gYm91bmRpbmcueDIgOiBwYXRoQm91bmRpbmcueDI7XG5cdFx0XHRib3VuZGluZy55MiA9IGJvdW5kaW5nLnkyID4gcGF0aEJvdW5kaW5nLnkyID8gYm91bmRpbmcueTIgOiBwYXRoQm91bmRpbmcueTI7XG5cdFx0XHRib3VuZGluZy53aWR0aCA9IGJvdW5kaW5nLngyIC0gYm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLmhlaWdodCA9IGJvdW5kaW5nLnkyIC0gYm91bmRpbmcueTtcblx0XHRcdHJldHVybiBib3VuZGluZztcblx0XHR9LCB1bmRlZmluZWQpIHx8IHt9O1xuXHRcdC8vaWYgdGhlcmUncyBhIGVuZFBvaW50IHBvaW50IHRoYXQgaXMgc2V0LCB1c2UgaXRzIGNvb3JkaW5hdGVzIGFzIGJvdW5kaW5nXG5cdFx0aWYodGhpcy5lbmRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmVuZFBvaW50LmdldFBvaW50KDApO1xuXHRcdFx0dGhpcy5ib3VuZGluZy54MiA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdFx0aWYodGhpcy5zdGFydFBvaW50KSB7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuc3RhcnRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueCA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5lbmRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignc3RhcnQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5zdGFydFBvaW50ID0gcDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wYXRocy5wdXNoKHApO1xuXHRcdH1cblx0XHR0aGlzLnNldEJvdW5kaW5nKCk7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLmhlaWdodDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy53aWR0aDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRCb3R0b24gPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnkyO1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFRvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueTtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54O1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFJpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54Mjtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmc7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbih4LCB5KXtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocy5tYXAoZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHBhdGggPSBwYXRoLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRyZXR1cm4gcGF0aDtcblx0XHR9KTtcblx0XHR0aGlzLmVuZFBvaW50ID0gKHRoaXMuZW5kUG9pbnQgJiYgdGhpcy5lbmRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnRyYW5zbGF0ZSh4LCB5KSk7XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBQYXRoR3JvdXAsIHNjYWxlZFxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuXHRcdGlmKCF0aGlzLnBhdGhzKSByZXR1cm4gdGhpcztcblx0XHR2YXIgc2NhbGVkID0gbmV3IFBhdGhHcm91cCh0aGlzLm5hbWUpO1xuXHRcdHRoaXMucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKXtcblx0XHRcdHNjYWxlZC5hZGRQYXRoKHBhdGguc2NhbGUoc2NhbGUpKTtcblx0XHR9KTtcblxuXHRcdHNjYWxlZC5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQuc2NhbGUoc2NhbGUpKTtcblx0XHRzY2FsZWQuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnNldEJvdW5kaW5nKCk7XG5cdFx0cmV0dXJuIHNjYWxlZDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFBhdGhzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5wYXRocztcblx0fTtcblxuXHRQYXRoR3JvdXAuZmFjdG9yeSA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIG5ldyBQYXRoR3JvdXAoKTtcblx0fTtcblxuXHRyZXR1cm4gUGF0aEdyb3VwO1xuXG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi9QYXRoR3JvdXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXApO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChQYXRoR3JvdXApIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXG5cdFx0Z2V0UGF0aHMgOiBmdW5jdGlvbihhbHBoYWJldCwgdGV4dCkge1xuXHRcdFx0dmFyIHJpZ2h0ID0gMDtcblx0XHRcdHZhciBsaW5lcyA9IG5ldyBQYXRoR3JvdXAodGV4dCk7XG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXG5cdFx0XHQvL2xvb3AgZm9yIGV2ZXJ5IGNoYXJhY3RlciBpbiBuYW1lIChzdHJpbmcpXG5cdFx0XHRmb3IodmFyIGk9MDsgaTx0ZXh0Lmxlbmd0aDsgaSsrKcKge1xuXHRcdFx0XHR2YXIgbGV0dGVyID0gdGV4dFtpXTtcblx0XHRcdFx0aWYobGV0dGVyID09PSAnICcpIHtcblx0XHRcdFx0XHRyaWdodCArPSBhbHBoYWJldC5nZXROU3BhY2UoKTtcblx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGxldHRlckRlZiA9IGFscGhhYmV0LmdldFN5bWJvbChsZXR0ZXIpIHx8IGFscGhhYmV0LmdldFN5bWJvbCgnLScpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgbGV0dGVyRGVmKTtcblxuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGxldHRlckpvaW5lZEVuZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXR0ZXJEZWYucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHRcdFx0dmFyIGRlZiA9IHBhdGgudHJhbnNsYXRlKHJpZ2h0LCAwKTtcblx0XHRcdFx0XHR2YXIgam9pbmVkU3RhcnQgPSBkZWYubmFtZSAmJiBkZWYubmFtZS5pbmRleE9mKCdqb2luYScpID4gLTE7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZEVuZCA9IC9qb2luKGE/KWIvLnRlc3QoZGVmLm5hbWUpO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyLCBqb2luZWRTdGFydCwgam9pbmVkRW5kKTtcblx0XHRcdFx0XHRsZXR0ZXJKb2luZWRFbmQgPSBsZXR0ZXJKb2luZWRFbmQgfHwgam9pbmVkRW5kO1xuXHRcdFx0XHRcdGlmKGpvaW5lZFN0YXJ0ICYmIGNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vYXBwZW5kIGF1IGNvbnRpbnVvdXNcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYXBwZW5kKGRlZiwgbGV0dGVyKTtcblxuXHRcdFx0XHRcdFx0Ly9ham91dGUgbGVzIGVhc2Vwb2ludHMgZGUgY2UgcGF0aFxuXHRcdFx0XHRcdFx0dmFyIHBhdGhTdGFydFBvcyA9IGNvbnRpbnVvdXMuZ2V0TGVuZ3RoKCkgLSBkZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHRkZWYuZ2V0RWFzZXBvaW50cygpLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0XHRcdFx0Y29udGludW91cy5hZGRFYXNlcG9pbnQocGF0aFN0YXJ0UG9zICsgcG9zKTtcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmKGpvaW5lZEVuZCAmJiAhY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9zdGFydCB1biBub3V2ZWF1IGxpbmUgKGNsb25lIGVuIHNjYWxhbnQgZGUgMSlcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBkZWYuY2xvbmUoKTtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMubmFtZSA9IGxldHRlcjtcblx0XHRcdFx0XHRcdGxpbmVzLmFkZFBhdGgoY29udGludW91cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxpbmVzLmFkZFBhdGgoZGVmKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZighbGV0dGVySm9pbmVkRW5kKSB7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0cmlnaHQgKz0gbGV0dGVyRGVmLmdldFdpZHRoKCk7XG5cdFx0XHRcdC8vY29uc29sZS50YWJsZShbe2xldHRlcjpuYW1lW2ldLCBsZXR0ZXJXaWR0aDogbGV0dGVyLmdldFdpZHRoKCksIHRvdGFsOnJpZ2h0fV0pO1x0XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbGluZXM7XG5cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFZlY3RvcldvcmQ7XG5cdFxufSkpO1xuXG5cbiJdfQ==
