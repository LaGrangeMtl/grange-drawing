(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var EmilieFont = require('./lagrange/drawing/EmilieFont.js');
	var DrawPath = require('./lagrange/drawing/DrawPath');
	var VectorWord = require('./lagrange/drawing/VectorWord');
	var Alphabet = require('./lagrange/drawing/Alphabet');
	var PathEasepoints = require('./lagrange/drawing/PathEasepoints');/**/
	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1200;
	var CENTER = W / 2;
	var H = 1600;
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
	var words = [
		{
			text : 'Merci',
			size : 0.8
		},
		{
			text : 'Marie-Héllenistique',//names.pop(),
			size : 1
		}
	];

	//names = ['aksttef'];

	var emily = Alphabet.factory().init(EmilieFont);
	var emilyLoading = emily.load();

	var guidis = Alphabet.factory().init({
		scale : 1,
		svgFile : 'assets/guidis.svg',
		easepoints : {}
	});
	var guidisLoading = guidis.load();

	var loading = $.when(emilyLoading, guidisLoading);


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

	var doDraw = function(){
		var top = T;
		var tl = words.reduce(function(tl, params, lineNum){

			var word = VectorWord.getPaths(emily, params.text);

			word = word.scale(params.size);

			//center text
			var width = word.getWidth();
			var left = (W - width) / 2;

			word.setOffset(left, top);
			
			top += word.getHeight() * LINE_HEIGHT;

			//ajoute le guidi sur le dernier mot
			if(lineNum === words.length -1) {
				var curve = guidis.getSymbol('wordDecorationEnd');
				curve = curve.getPaths()[0];
				
				//trouve les points de départ et d'arrivée de la curve
				var curveStr = curve.getSVGString();
				var startPos = Raphael.getPointAtLength(curveStr, 0);
				var endPos = Raphael.getPointAtLength(curveStr, curve.getLength());

				var wordPaths = word.getPaths();
				//trouve le path le plus à droite dans les lettres
				var lastPath = wordPaths.reduce(function(last, cur){
					last = last || cur;
					var bbLast = last.getBounding();
					var bbCur = cur.getBounding();

					if(bbLast.y2 < bbCur.y2){
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
					x: CENTER - wordEndPos.x,
					y: relEndPos.y
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
				//word.addPath(curve);
				
			}

			return DrawPath.group(word.getPaths(), getStage(), {
				pxPerSecond : SPEED * params.size,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeInOut
			}, tl);
			

		}, new gsap.TimelineMax({paused:true}));

		tl.play();


	};

		
	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		loading.then(doDraw);
	});



	//parse les easepoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		PathEasepoints(getStage(), Alphabet.getAll(), $('#brp'), [W, H]);

	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		loading.then(printEasepoints);
	});


},{"./lagrange/drawing/Alphabet":2,"./lagrange/drawing/DrawPath":3,"./lagrange/drawing/EmilieFont.js":4,"./lagrange/drawing/PathEasepoints":6,"./lagrange/drawing/VectorWord":8,"gsap":"gsap","jquery":"jquery","raphael":"raphael"}],2:[function(require,module,exports){
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
			return symbols['n'].getWidth();
		};

		this.getAll = function(){
			return symbols;
		};

		return this;
	};

	Alphabet.factory = function(inst){
		return Alphabet.apply(inst || {});
	};

	return Alphabet;
	
}));



},{"./Path":5,"./PathGroup":7,"jquery":"jquery"}],3:[function(require,module,exports){
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

		single : function(path, stage, params){

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

		group : function(paths, stage, settings, tl) {
			return paths.reduce(function(tl, path){
				return tl.append(DrawPath.single(path, stage, settings));
			}, tl || new gsap.TimelineMax({paused:true}));
		}
	}

	return DrawPath;
	
}));



},{"gsap":"gsap","lodash":"lodash","raphael":"raphael"}],4:[function(require,module,exports){
(function (root, factory) {
	var nsParts = 'lagrange/drawing/EmilieFont'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory();
  	} else {
		ns[name] = factory();
	}
}(this, function () {
	"use strict";

	//original scale factor
	var EmilieFont = {
		scale : 1,
		svgFile : 'assets/emilieFont.svg',
		//PARSÉ avec le helper
		easepoints : {"Ô":[null,[16]],"Ï":[[136]],"Î":[[93],[16]],"Ë":[[159]],"Ê":[[159],[17]],"È":[[159]],"É":[[159]],"Ç":[null,[13]],"Ä":[[189]],"Â":[[189],null,[15]],"À":[[189]],"Z":[[193,340]],"Y":[[329]],"W":[[227,336]],"V":[[231]],"U":[[317]],"R":[[289]],"O":[[300]],"N":[[247,350]],"M":[[238,338,452]],"L":[[220]],"K":[[115],[122]],"J":[[132]],"H":[[142]],"G":[[321]],"E":[[159]],"D":[[370]],"B":[[453]],"A":[[189]],"ô":[[155],[16]],"ö":[[155]],"ï":[[42]],"î":[[42],[16]],"ë":[[40]],"ê":[[40],[17]],"è":[[40]],"é":[[40]],"ç":[[72],[13]],"ä":[[55,133]],"â":[[55,133],[15]],"à":[[55,133]],"z":[[110,210]],"y":[[42,116,227]],"x":[[42]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[123]],"k":[[129,244,327]],"j":[[52]],"i":[[42]],"h":[[131,248,293]],"g":[[60,145]],"f":[[134,419]],"d":[[57,234]],"c":[[72]],"b":[[126,291]],"a":[[55,133]]}
	};


	return EmilieFont;
	
}));
},{}],5:[function(require,module,exports){
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



},{"raphael":"raphael"}],6:[function(require,module,exports){
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



},{"jquery":"jquery","lodash":"lodash","raphael":"raphael"}],7:[function(require,module,exports){
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

	return PathGroup;

}));



},{}],8:[function(require,module,exports){
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



},{"./PathGroup":7}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvRXhhbXBsZS5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHRcblx0dmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblx0dmFyIFJhcGhhZWwgPSByZXF1aXJlKCdyYXBoYWVsJyk7XG5cdHZhciBFbWlsaWVGb250ID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0VtaWxpZUZvbnQuanMnKTtcblx0dmFyIERyYXdQYXRoID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0RyYXdQYXRoJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQnKTtcblx0dmFyIEFscGhhYmV0ID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0Jyk7XG5cdHZhciBQYXRoRWFzZXBvaW50cyA9IHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cycpOy8qKi9cblx0dmFyIFR3ZWVuTWF4ID0gcmVxdWlyZSgnZ3NhcCcpO1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBXID0gMTIwMDtcblx0dmFyIENFTlRFUiA9IFcgLyAyO1xuXHR2YXIgSCA9IDE2MDA7XG5cdHZhciBUID0gNTA7XG5cdHZhciBMSU5FX0hFSUdIVCA9IDEuMjsvL2VtXG5cdHZhciBTUEVFRCA9IDI1MDsvL3B4IHBlciBzZWNcblxuXG5cdHZhciBuYW1lcyA9IFtcIkplc3NpY2EgV2FubmluZ1wiLFwiSnVsaWEgUm9ja3dlbGxcIixcIkNhcm9sIEh1YmJhcmRcIixcIlJvbmFsZCBDYW5keVwiLFwiSm9obiBOZXd0b25cIixcIkVsdmlzIE5pY29sZVwiLFwiR2xvcmlhIFdlYXZlclwiLFwiSnVsaWEgQ3JvbmtpdGVcIixcIk1vdGhlciBSb2dlcnNcIixcIkNoZXZ5IElyd2luXCIsXCJFZGRpZSBBbGxlblwiLFwiTm9ybWFuIEphY2tzb25cIixcIlBldGVyIFJvZ2Vyc1wiLFwiV2VpcmQgQ2hhc2VcIixcIkNvbGluIE1heXNcIixcIk5hcG9sZW9uIE1hcnRpblwiLFwiRWRnYXIgU2ltcHNvblwiLFwiTW9oYW1tYWQgTWNDYXJ0bmV5XCIsXCJMaWJlcmFjZSBXaWxsaWFtc1wiLFwiRmllbGRzIEJ1cm5ldHRcIixcIlN0ZXZlIEFzaGVcIixcIkNhcnJpZSBDaGFybGVzXCIsXCJUb21teSBQYXN0ZXVyXCIsXCJFZGRpZSBTaWx2ZXJzdG9uZVwiLFwiT3ByYWggQXNoZVwiLFwiUmF5IEJhbGxcIixcIkppbSBEaWFuYVwiLFwiTWljaGVsYW5nZWxvIEVhc3R3b29kXCIsXCJHZW9yZ2UgU2ltcHNvblwiLFwiQWxpY2lhIEF1c3RlblwiLFwiSmVzc2ljYSBOaWNvbGVcIixcIk1hcmlseW4gRXZlcmV0dFwiLFwiS2VpdGggRWFzdHdvb2RcIixcIlBhYmxvIEVhc3R3b29kXCIsXCJQZXl0b24gTHV0aGVyXCIsXCJNb3phcnQgQXJtc3Ryb25nXCIsXCJNaWNoYWVsIEJ1cm5ldHRcIixcIktlaXRoIEdsb3ZlclwiLFwiRWxpemFiZXRoIENoaWxkXCIsXCJNaWxlcyBBc3RhaXJlXCIsXCJBbmR5IEVkaXNvblwiLFwiTWFydGluIExlbm5vblwiLFwiVG9tIFBpY2Nhc29cIixcIkJleW9uY2UgRGlzbmV5XCIsXCJQZXRlciBDbGludG9uXCIsXCJIZW5yeSBLZW5uZWR5XCIsXCJQYXVsIENoaWxkXCIsXCJMZXdpcyBTYWdhblwiLFwiTWljaGVsYW5nZWxvIExlZVwiLFwiTWFyaWx5biBGaXNoZXJcIl07XG5cdGZ1bmN0aW9uIFNodWZmbGUobykge1xuXHRcdGZvcih2YXIgaiwgeCwgaSA9IG8ubGVuZ3RoOyBpOyBqID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIGkpLCB4ID0gb1stLWldLCBvW2ldID0gb1tqXSwgb1tqXSA9IHgpO1xuXHRcdHJldHVybiBvO1xuXHR9O1xuXHRTaHVmZmxlKG5hbWVzKTtcblx0Ly9uYW1lcy5sZW5ndGggPSAxOy8qKi9cblx0dmFyIHdvcmRzID0gW1xuXHRcdHtcblx0XHRcdHRleHQgOiAnTWVyY2knLFxuXHRcdFx0c2l6ZSA6IDAuOFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0dGV4dCA6ICdNYXJpZS1Iw6lsbGVuaXN0aXF1ZScsLy9uYW1lcy5wb3AoKSxcblx0XHRcdHNpemUgOiAxXG5cdFx0fVxuXHRdO1xuXG5cdC8vbmFtZXMgPSBbJ2Frc3R0ZWYnXTtcblxuXHR2YXIgZW1pbHkgPSBBbHBoYWJldC5mYWN0b3J5KCkuaW5pdChFbWlsaWVGb250KTtcblx0dmFyIGVtaWx5TG9hZGluZyA9IGVtaWx5LmxvYWQoKTtcblxuXHR2YXIgZ3VpZGlzID0gQWxwaGFiZXQuZmFjdG9yeSgpLmluaXQoe1xuXHRcdHNjYWxlIDogMSxcblx0XHRzdmdGaWxlIDogJ2Fzc2V0cy9ndWlkaXMuc3ZnJyxcblx0XHRlYXNlcG9pbnRzIDoge31cblx0fSk7XG5cdHZhciBndWlkaXNMb2FkaW5nID0gZ3VpZGlzLmxvYWQoKTtcblxuXHR2YXIgbG9hZGluZyA9ICQud2hlbihlbWlseUxvYWRpbmcsIGd1aWRpc0xvYWRpbmcpO1xuXG5cblx0dmFyIGdldFN0YWdlID0gKGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHN0YWdlO1xuXHRcdHZhciBpbml0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBSYXBoYWVsKFwic3ZnXCIsIFcsIEgpO1xuXHRcdH07XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3RhZ2UgPSBzdGFnZSB8fCBpbml0KCk7XG5cdFx0fVxuXHR9KSgpO1xuXG5cdFx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0dmFyIGVsID0gZ2V0U3RhZ2UoKS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKTtcblx0XHRlbC5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHRcdHJldHVybiBlbDtcblx0fTtcblxuXHR2YXIgZG9EcmF3ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgdG9wID0gVDtcblx0XHR2YXIgdGwgPSB3b3Jkcy5yZWR1Y2UoZnVuY3Rpb24odGwsIHBhcmFtcywgbGluZU51bSl7XG5cblx0XHRcdHZhciB3b3JkID0gVmVjdG9yV29yZC5nZXRQYXRocyhlbWlseSwgcGFyYW1zLnRleHQpO1xuXG5cdFx0XHR3b3JkID0gd29yZC5zY2FsZShwYXJhbXMuc2l6ZSk7XG5cblx0XHRcdC8vY2VudGVyIHRleHRcblx0XHRcdHZhciB3aWR0aCA9IHdvcmQuZ2V0V2lkdGgoKTtcblx0XHRcdHZhciBsZWZ0ID0gKFcgLSB3aWR0aCkgLyAyO1xuXG5cdFx0XHR3b3JkLnNldE9mZnNldChsZWZ0LCB0b3ApO1xuXHRcdFx0XG5cdFx0XHR0b3AgKz0gd29yZC5nZXRIZWlnaHQoKSAqIExJTkVfSEVJR0hUO1xuXG5cdFx0XHQvL2Fqb3V0ZSBsZSBndWlkaSBzdXIgbGUgZGVybmllciBtb3Rcblx0XHRcdGlmKGxpbmVOdW0gPT09IHdvcmRzLmxlbmd0aCAtMSkge1xuXHRcdFx0XHR2YXIgY3VydmUgPSBndWlkaXMuZ2V0U3ltYm9sKCd3b3JkRGVjb3JhdGlvbkVuZCcpO1xuXHRcdFx0XHRjdXJ2ZSA9IGN1cnZlLmdldFBhdGhzKClbMF07XG5cdFx0XHRcdFxuXHRcdFx0XHQvL3Ryb3V2ZSBsZXMgcG9pbnRzIGRlIGTDqXBhcnQgZXQgZCdhcnJpdsOpZSBkZSBsYSBjdXJ2ZVxuXHRcdFx0XHR2YXIgY3VydmVTdHIgPSBjdXJ2ZS5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdFx0dmFyIHN0YXJ0UG9zID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGN1cnZlU3RyLCAwKTtcblx0XHRcdFx0dmFyIGVuZFBvcyA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJ2ZVN0ciwgY3VydmUuZ2V0TGVuZ3RoKCkpO1xuXG5cdFx0XHRcdHZhciB3b3JkUGF0aHMgPSB3b3JkLmdldFBhdGhzKCk7XG5cdFx0XHRcdC8vdHJvdXZlIGxlIHBhdGggbGUgcGx1cyDDoCBkcm9pdGUgZGFucyBsZXMgbGV0dHJlc1xuXHRcdFx0XHR2YXIgbGFzdFBhdGggPSB3b3JkUGF0aHMucmVkdWNlKGZ1bmN0aW9uKGxhc3QsIGN1cil7XG5cdFx0XHRcdFx0bGFzdCA9IGxhc3QgfHwgY3VyO1xuXHRcdFx0XHRcdHZhciBiYkxhc3QgPSBsYXN0LmdldEJvdW5kaW5nKCk7XG5cdFx0XHRcdFx0dmFyIGJiQ3VyID0gY3VyLmdldEJvdW5kaW5nKCk7XG5cblx0XHRcdFx0XHRpZihiYkxhc3QueTIgPCBiYkN1ci55Mil7XG5cdFx0XHRcdFx0XHRsYXN0ID0gY3VyO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBsYXN0O1xuXHRcdFx0XHR9LCBudWxsKTtcblxuXHRcdFx0XHR2YXIgd29yZEVuZFBvcyA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChsYXN0UGF0aC5nZXRTVkdTdHJpbmcoKSwgbGFzdFBhdGguZ2V0TGVuZ3RoKCkpO1xuXG5cdFx0XHRcdC8vcG9zaXRpb24gYWJzb2x1ZSBkdSBwb2ludCBkZSBkw6lwYXJ0IGR1IHBhdGhcblx0XHRcdFx0dmFyIGFic1N0YXJ0UG9zID0ge1xuXHRcdFx0XHRcdHg6IHdvcmRFbmRQb3MueCAtIHN0YXJ0UG9zLngsXG5cdFx0XHRcdFx0eTogd29yZEVuZFBvcy55IC0gc3RhcnRQb3MueVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8qc2hvd1BvaW50KHt4OndvcmRFbmRQb3MueHgsIHk6d29yZEVuZFBvcy55fSwgJyMyMmZmMDAnKTtcblx0XHRcdFx0c2hvd1BvaW50KGFic1N0YXJ0UG9zLCAnI2ZmMDAwMCcpOy8qKi9cblxuXHRcdFx0XHQvL8OgIGNvbWJpZW4gZGUgZGlzdGFuY2UgbGUgYm91dGUgZXN0IGR1IGTDqWJ1dFxuXHRcdFx0XHR2YXIgcmVsRW5kUG9zID0ge1xuXHRcdFx0XHRcdHg6IGVuZFBvcy54IC0gc3RhcnRQb3MueCxcblx0XHRcdFx0XHR5OiBlbmRQb3MueSAtIHN0YXJ0UG9zLnlcblx0XHRcdFx0fTtcblxuXHRcdFx0XHQvL8OgIHF1ZWwgZW5kcm9pdCBvbiBkb2l0IGZhaXJlIGFycml2ZXIgbGUgZW5kcG9zLCByZWxhdGlmIGF1IGTDqWJ1dCBkdSBwYXRoXG5cdFx0XHRcdHZhciB0YXJnZXRSZWxFbmRQb3MgPSB7XG5cdFx0XHRcdFx0eDogQ0VOVEVSIC0gd29yZEVuZFBvcy54LFxuXHRcdFx0XHRcdHk6IHJlbEVuZFBvcy55XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0dmFyIHJhdGlvID0ge1xuXHRcdFx0XHRcdHggOiB0YXJnZXRSZWxFbmRQb3MueCAvIHJlbEVuZFBvcy54LFxuXHRcdFx0XHRcdHkgOiB0YXJnZXRSZWxFbmRQb3MueSAvIHJlbEVuZFBvcy55LFxuXHRcdFx0XHR9O1xuXHRcdFx0XHQvKmNvbnNvbGUubG9nKCdzdGFydCBhdCcsYWJzU3RhcnRQb3MpO1xuXHRcdFx0XHRjb25zb2xlLmxvZyh0YXJnZXRSZWxFbmRQb3MpO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhyYXRpbywgY3VycmVudEVuZFBvcyk7KiovXG5cblx0XHRcdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdFx0XHRtLnNjYWxlKHJhdGlvLngsIHJhdGlvLnksIGFic1N0YXJ0UG9zLngrc3RhcnRQb3MueCwgYWJzU3RhcnRQb3MueSk7XG5cdFx0XHRcdG0udHJhbnNsYXRlKGFic1N0YXJ0UG9zLngsIGFic1N0YXJ0UG9zLnkpO1xuXHRcdFx0XHRjdXJ2ZSA9IGN1cnZlLmFwcGx5TWF0cml4KG0pO1xuXG5cdFx0XHRcdGxhc3RQYXRoLmFwcGVuZChjdXJ2ZSk7XG5cdFx0XHRcdC8vd29yZC5hZGRQYXRoKGN1cnZlKTtcblx0XHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBEcmF3UGF0aC5ncm91cCh3b3JkLmdldFBhdGhzKCksIGdldFN0YWdlKCksIHtcblx0XHRcdFx0cHhQZXJTZWNvbmQgOiBTUEVFRCAqIHBhcmFtcy5zaXplLFxuXHRcdFx0XHRjb2xvciA6ICcjNDQ0NDQ0Jyxcblx0XHRcdFx0c3Ryb2tlV2lkdGggOiAyLFxuXHRcdFx0XHRlYXNpbmcgOiBnc2FwLlNpbmUuZWFzZUluT3V0XG5cdFx0XHR9LCB0bCk7XG5cdFx0XHRcblxuXHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHtwYXVzZWQ6dHJ1ZX0pKTtcblxuXHRcdHRsLnBsYXkoKTtcblxuXG5cdH07XG5cblx0XHRcblx0dmFyIGJ0biA9ICQoJyNjdHJsJyk7XG5cblx0YnRuLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG5cblxuXHQvL3BhcnNlIGxlcyBlYXNlcG9pbnRzIGRlIGNoYXF1ZSBsZXR0cmUsIG91dHB1dCBlbiBKU09OICjDoCBzYXZlcilcblx0dmFyIHByaW50RWFzZXBvaW50cyA9IGZ1bmN0aW9uKCl7XG5cdFx0UGF0aEVhc2Vwb2ludHMoZ2V0U3RhZ2UoKSwgQWxwaGFiZXQuZ2V0QWxsKCksICQoJyNicnAnKSwgW1csIEhdKTtcblxuXHR9O1xuXG5cdHZhciBnZXRCcHIgPSAkKCcjZ2V0YnJwJyk7XG5cblx0Z2V0QnByLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKHByaW50RWFzZXBvaW50cyk7XG5cdH0pO1xuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9BbHBoYWJldCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJy4vUGF0aCcpLCByZXF1aXJlKCcuL1BhdGhHcm91cCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGgsIHJvb3QubGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXApO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoLCBQYXRoR3JvdXApIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblxuXHR2YXIgc3BlY2lhbENoYXJzID0ge1xuXHRcdCdfeDJEXycgOiAnLScsXG5cdFx0J194MkVfJyA6ICcuJ1xuXHR9O1xuXG5cdHZhciBBbHBoYWJldCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNldHRpbmdzO1xuXHRcdHZhciBzeW1ib2xzID0ge307XG5cblxuXHRcdHZhciBwYXJzZVNWRyA9IGZ1bmN0aW9uKGRhdGEpe1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdFx0dmFyIGRvYyA9ICQoZGF0YSk7XG5cdFx0XHR2YXIgbGF5ZXJzID0gZG9jLmZpbmQoJ2cnKTtcblx0XHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIGxheWVyID0gJChlbCk7XG5cdFx0XHRcdHZhciBpZCA9IGxheWVyLmF0dHIoJ2lkJyk7XG5cdFx0XHRcdGlkID0gc3BlY2lhbENoYXJzW2lkXSB8fCBpZDtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpZCk7XG5cdFx0XHRcdC8vaWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXHRcdFx0XHR2YXIgcGF0aHMgPSBsYXllci5maW5kKCdwYXRoJyk7XG5cdFx0XHRcdGlmKHBhdGhzLmxlbmd0aD09PTApIHJldHVybjtcblxuXHRcdFx0XHR2YXIgc3ltYm9sID0gc3ltYm9sc1tpZF0gPSBuZXcgUGF0aEdyb3VwKGlkKTtcblxuXHRcdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0XHR2YXIgcGF0aEVsID0gJChlbCk7XG5cdFx0XHRcdFx0dmFyIHAgPSBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpLCBudWxsLCBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXSAmJiBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXVtpXSkuc2NhbGUoc2V0dGluZ3Muc2NhbGUgfHwgMSk7XHRcdFx0XHRcblx0XHRcdFx0XHRzeW1ib2wuYWRkUGF0aCggcCApO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0fSk7XG5cblx0XHRcdC8vdHJvdXZlIGxlIHRvcCBhYnNvbHUgKHRvcCBkZSBsYSBsZXR0cmUgbGEgcGx1cyBoYXV0ZSlcblx0XHRcdHZhciB0b3AgPSBPYmplY3Qua2V5cyhzeW1ib2xzKS5yZWR1Y2UoZnVuY3Rpb24obWluLCBzeW1ib2xOYW1lKXtcblx0XHRcdFx0dmFyIHQgPSBzeW1ib2xzW3N5bWJvbE5hbWVdLmdldFRvcCgpO1xuXHRcdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZCB8fCBtaW4gPiB0KSB7XG5cdFx0XHRcdFx0bWluID0gdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWluO1xuXHRcdFx0fSwgdW5kZWZpbmVkKTtcblx0XHRcdC8vY29uc29sZS5sb2coc3ltYm9scyk7XG5cblx0XHRcdC8vYWp1c3RlIGxlIGJhc2VsaW5lIGRlIGNoYXF1ZSBsZXR0cmVcblx0XHRcdE9iamVjdC5rZXlzKHN5bWJvbHMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRcdHN5bWJvbHNba2V5XS5zZXRPZmZzZXQoLTEgKiBzeW1ib2xzW2tleV0uZ2V0TGVmdCgpLCAtMSAqIHRvcCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0fTtcblxuXHRcdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIGxvYWRpbmcgPSAkLmFqYXgoe1xuXHRcdFx0XHR1cmwgOiBzZXR0aW5ncy5zdmdGaWxlLFxuXHRcdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdFx0fSk7XG5cblx0XHRcdGxvYWRpbmcudGhlbihwYXJzZVNWRywgZnVuY3Rpb24oYSwgYiwgYyl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGIpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGMpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbG9hZGluZy5wcm9taXNlKCk7XG5cblx0XHR9O1xuXG5cdFx0XG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24ocykge1xuXHRcdFx0c2V0dGluZ3MgPSBzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fTtcblxuXHRcdHRoaXMubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGRvTG9hZCgpO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXRTeW1ib2wgPSBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBzeW1ib2xzW2xdO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXROU3BhY2UgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXS5nZXRXaWR0aCgpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3ltYm9scztcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0QWxwaGFiZXQuZmFjdG9yeSA9IGZ1bmN0aW9uKGluc3Qpe1xuXHRcdHJldHVybiBBbHBoYWJldC5hcHBseShpbnN0IHx8IHt9KTtcblx0fTtcblxuXHRyZXR1cm4gQWxwaGFiZXQ7XG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL0RyYXdQYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJyksIHJlcXVpcmUoJ2dzYXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5fLCByb290LlJhcGhhZWwsIChyb290LkdyZWVuU29ja0dsb2JhbHMgfHwgcm9vdCkpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChfLCBSYXBoYWVsLCBUd2Vlbk1heCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL2dzYXAgZXhwb3J0cyBUd2Vlbk1heFxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Y29sb3I6ICcjMDAwMDAwJyxcblx0XHRzdHJva2VXaWR0aCA6IDAuNixcblx0XHRweFBlclNlY29uZCA6IDEwMCwgLy9zcGVlZCBvZiBkcmF3aW5nXG5cdFx0ZWFzaW5nIDogZ3NhcC5RdWFkLmVhc2VJblxuXHR9O1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgc3RhZ2UsIGNvbG9yLCBzaXplKXtcblx0XHRzdGFnZS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKS5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHR9O1xuXG5cdHZhciBEcmF3UGF0aCA9IHtcblxuXHRcdHNpbmdsZSA6IGZ1bmN0aW9uKHBhdGgsIHN0YWdlLCBwYXJhbXMpe1xuXG5cdFx0XHR2YXIgc2V0dGluZ3MgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cdFx0XHR2YXIgcGF0aFN0ciA9IHBhdGguZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gcGF0aC5nZXRMZW5ndGgoKTtcblxuXHRcdFx0dmFyIHB4UGVyU2Vjb25kID0gc2V0dGluZ3MucHhQZXJTZWNvbmQ7XG5cdFx0XHR2YXIgdGltZSA9IGxlbmd0aCAvIHB4UGVyU2Vjb25kO1xuXG5cdFx0XHR2YXIgYW5pbSA9IHt0bzogMH07XG5cdFx0XHRcblx0XHRcdHZhciB1cGRhdGUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGVsO1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgYW5pbS50byk7XG5cdFx0XHRcdFx0aWYoZWwpIGVsLnJlbW92ZSgpO1xuXHRcdFx0XHRcdGVsID0gc3RhZ2UucGF0aChwYXRoUGFydCk7XG5cdFx0XHRcdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc2V0dGluZ3Muc3Ryb2tlV2lkdGgsIHN0cm9rZTogc2V0dGluZ3MuY29sb3J9KTtcblx0XHRcdFx0fTtcblx0XHRcdH0pKCk7XG5cblx0XHRcdHZhciBlYXNlUG9pbnRzID0gcGF0aC5nZXRFYXNlcG9pbnRzKCk7XG5cdFx0XHQvKmNvbnNvbGUubG9nKGVhc2VQb2ludHMubGVuZ3RoKTtcblx0XHRcdGVhc2VQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb3Mpe1xuXHRcdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwb3MpO1xuXHRcdFx0XHRzaG93UG9pbnQocCwgc3RhZ2UsICcjZmYwMDAwJywgMik7XG5cdFx0XHR9KTsvKiovXG5cdFx0XHRcblxuXHRcdFx0dmFyIGxhc3QgPSAwO1xuXHRcdFx0cmV0dXJuIGVhc2VQb2ludHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBkaXN0KSB7XG5cdFx0XHRcdHZhciB0aW1lID0gKGRpc3QtbGFzdCkgLyBweFBlclNlY29uZDtcblx0XHRcdFx0bGFzdCA9IGRpc3Q7XG5cdFx0XHRcdHJldHVybiB0bC50byhhbmltLCB0aW1lLCB7dG86IGRpc3QsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHtcblx0XHRcdFx0b25VcGRhdGUgOiB1cGRhdGVcblx0XHRcdH0pKS50byhhbmltLCAoKGxlbmd0aCAtIChlYXNlUG9pbnRzLmxlbmd0aCAmJiBlYXNlUG9pbnRzW2Vhc2VQb2ludHMubGVuZ3RoLTFdKSkgLyBweFBlclNlY29uZCksIHt0bzogbGVuZ3RoLCBlYXNlIDogc2V0dGluZ3MuZWFzaW5nfSk7XG5cdFx0XHRcblx0XHR9LFxuXG5cdFx0Z3JvdXAgOiBmdW5jdGlvbihwYXRocywgc3RhZ2UsIHNldHRpbmdzLCB0bCkge1xuXHRcdFx0cmV0dXJuIHBhdGhzLnJlZHVjZShmdW5jdGlvbih0bCwgcGF0aCl7XG5cdFx0XHRcdHJldHVybiB0bC5hcHBlbmQoRHJhd1BhdGguc2luZ2xlKHBhdGgsIHN0YWdlLCBzZXR0aW5ncykpO1xuXHRcdFx0fSwgdGwgfHwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe3BhdXNlZDp0cnVlfSkpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBEcmF3UGF0aDtcblx0XG59KSk7XG5cblxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeSgpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9vcmlnaW5hbCBzY2FsZSBmYWN0b3Jcblx0dmFyIEVtaWxpZUZvbnQgPSB7XG5cdFx0c2NhbGUgOiAxLFxuXHRcdHN2Z0ZpbGUgOiAnYXNzZXRzL2VtaWxpZUZvbnQuc3ZnJyxcblx0XHQvL1BBUlPDiSBhdmVjIGxlIGhlbHBlclxuXHRcdGVhc2Vwb2ludHMgOiB7XCLDlFwiOltudWxsLFsxNl1dLFwiw49cIjpbWzEzNl1dLFwiw45cIjpbWzkzXSxbMTZdXSxcIsOLXCI6W1sxNTldXSxcIsOKXCI6W1sxNTldLFsxN11dLFwiw4hcIjpbWzE1OV1dLFwiw4lcIjpbWzE1OV1dLFwiw4dcIjpbbnVsbCxbMTNdXSxcIsOEXCI6W1sxODldXSxcIsOCXCI6W1sxODldLG51bGwsWzE1XV0sXCLDgFwiOltbMTg5XV0sXCJaXCI6W1sxOTMsMzQwXV0sXCJZXCI6W1szMjldXSxcIldcIjpbWzIyNywzMzZdXSxcIlZcIjpbWzIzMV1dLFwiVVwiOltbMzE3XV0sXCJSXCI6W1syODldXSxcIk9cIjpbWzMwMF1dLFwiTlwiOltbMjQ3LDM1MF1dLFwiTVwiOltbMjM4LDMzOCw0NTJdXSxcIkxcIjpbWzIyMF1dLFwiS1wiOltbMTE1XSxbMTIyXV0sXCJKXCI6W1sxMzJdXSxcIkhcIjpbWzE0Ml1dLFwiR1wiOltbMzIxXV0sXCJFXCI6W1sxNTldXSxcIkRcIjpbWzM3MF1dLFwiQlwiOltbNDUzXV0sXCJBXCI6W1sxODldXSxcIsO0XCI6W1sxNTVdLFsxNl1dLFwiw7ZcIjpbWzE1NV1dLFwiw69cIjpbWzQyXV0sXCLDrlwiOltbNDJdLFsxNl1dLFwiw6tcIjpbWzQwXV0sXCLDqlwiOltbNDBdLFsxN11dLFwiw6hcIjpbWzQwXV0sXCLDqVwiOltbNDBdXSxcIsOnXCI6W1s3Ml0sWzEzXV0sXCLDpFwiOltbNTUsMTMzXV0sXCLDolwiOltbNTUsMTMzXSxbMTVdXSxcIsOgXCI6W1s1NSwxMzNdXSxcInpcIjpbWzExMCwyMTBdXSxcInlcIjpbWzQyLDExNiwyMjddXSxcInhcIjpbWzQyXV0sXCJ3XCI6W1szOCwxMDcsMTc3XV0sXCJ2XCI6W1s2Nl1dLFwidVwiOltbMzMsMTA1XV0sXCJ0XCI6W1sxMDNdXSxcInNcIjpbWzUwLDExMF1dLFwiclwiOltbNjRdXSxcInFcIjpbWzE0NCwzMjVdXSxcInBcIjpbWzU2LDMwNV1dLFwib1wiOltbMTU1XV0sXCJuXCI6W1sxMDRdXSxcIm1cIjpbWzExMF1dLFwibFwiOltbMTIzXV0sXCJrXCI6W1sxMjksMjQ0LDMyN11dLFwialwiOltbNTJdXSxcImlcIjpbWzQyXV0sXCJoXCI6W1sxMzEsMjQ4LDI5M11dLFwiZ1wiOltbNjAsMTQ1XV0sXCJmXCI6W1sxMzQsNDE5XV0sXCJkXCI6W1s1NywyMzRdXSxcImNcIjpbWzcyXV0sXCJiXCI6W1sxMjYsMjkxXV0sXCJhXCI6W1s1NSwxMzNdXX1cblx0fTtcblxuXG5cdHJldHVybiBFbWlsaWVGb250O1xuXHRcbn0pKTsiLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcmVnID0gLyhbYS16XSkoWzAtOVxcc1xcLFxcLlxcLV0rKS9naTtcblx0XHRcblx0Ly9leHBlY3RlZCBsZW5ndGggb2YgZWFjaCB0eXBlXG5cdHZhciBleHBlY3RlZExlbmd0aHMgPSB7XG5cdFx0bSA6IDIsXG5cdFx0bCA6IDIsXG5cdFx0diA6IDEsXG5cdFx0aCA6IDEsXG5cdFx0YyA6IDYsXG5cdFx0cyA6IDRcblx0fTtcblxuXHR2YXIgUGF0aCA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKSB7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHQvL2lmKHN2ZykgY29uc29sZS5sb2coc3ZnLCBwYXJzZWQpO1xuXHRcdHRoaXMuZWFzZVBvaW50cyA9IGVhc2VQb2ludHMgfHwgW107XG5cdFx0Ly9jb25zb2xlLmxvZyhuYW1lLCBlYXNlUG9pbnRzKTtcblx0XHR0aGlzLl9zZXRQYXJzZWQocGFyc2VkIHx8IHRoaXMuX3BhcnNlKHN2ZykpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLl9zZXRQYXJzZWQgPSBmdW5jdGlvbihwYXJzZWQpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnNlZCk7XG5cdFx0dGhpcy5wYXJzZWQgPSBwYXJzZWQ7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0Q3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jdWJpYyB8fCB0aGlzLl9wYXJzZUN1YmljKCk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRUb3RhbExlbmd0aCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyBhbiBTVkcgc3RyaW5nIG9mIHRoZSBwYXRoIHNlZ2VtbnRzLiBJdCBpcyBub3QgdGhlIHN2ZyBwcm9wZXJ0eSBvZiB0aGUgcGF0aCwgYXMgaXQgaXMgcG90ZW50aWFsbHkgdHJhbnNmb3JtZWRcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0U1ZHU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihzdmcsIHNlZ21lbnQpe1xuXHRcdFx0cmV0dXJuIHN2ZyArIHNlZ21lbnQudHlwZSArIHNlZ21lbnQuYW5jaG9ycy5qb2luKCcsJyk7IFxuXHRcdH0sICcnKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyB0aGUgcG9zaXRpb25zIGF0IHdoaWNoIHdlIGhhdmUgZWFzZSBwb2ludHMgKHdoaWNoIGFyZSBwcmVwYXJzZWQgYW5kIGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgcGF0aCdzIGRlZmluaXRpb25zKVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZWFzZVBvaW50cztcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRQb2ludCA9IGZ1bmN0aW9uKGlkeCkge1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5wYXJzZWQpO1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZFtpZHhdICYmIHRoaXMucGFyc2VkW2lkeF0uYW5jaG9ycztcblx0fTtcblxuXHQvKipcblx0UGFyc2VzIGFuIFNWRyBwYXRoIHN0cmluZyB0byBhIGxpc3Qgb2Ygc2VnbWVudCBkZWZpbml0aW9ucyB3aXRoIEFCU09MVVRFIHBvc2l0aW9ucyB1c2luZyBSYXBoYWVsLnBhdGgyY3VydmVcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlID0gZnVuY3Rpb24oc3ZnKSB7XG5cdFx0dmFyIGN1cnZlID0gUmFwaGFlbC5wYXRoMmN1cnZlKHN2Zyk7XG5cdFx0dmFyIHBhdGggPSBjdXJ2ZS5tYXAoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZSA6IHBvaW50LnNoaWZ0KCksXG5cdFx0XHRcdGFuY2hvcnMgOiBwb2ludFxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcGF0aDtcblx0fTtcblxuXHQvKipcblx0XHRQYXJzZXMgYSBwYXRoIGRlZmluZWQgYnkgcGFyc2VQYXRoIHRvIGEgbGlzdCBvZiBiZXppZXIgcG9pbnRzIHRvIGJlIHVzZWQgYnkgR3JlZW5zb2NrIEJlemllciBwbHVnaW4sIGZvciBleGFtcGxlXG5cdFx0VHdlZW5NYXgudG8oc3ByaXRlLCA1MDAsIHtcblx0XHRcdGJlemllcjp7dHlwZTpcImN1YmljXCIsIHZhbHVlczpjdWJpY30sXG5cdFx0XHRlYXNlOlF1YWQuZWFzZUluT3V0LFxuXHRcdFx0dXNlRnJhbWVzIDogdHJ1ZVxuXHRcdH0pO1xuXHRcdCovXG5cdFBhdGgucHJvdG90eXBlLl9wYXJzZUN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoKTtcblx0XHQvL2Fzc3VtZWQgZmlyc3QgZWxlbWVudCBpcyBhIG1vdmV0b1xuXHRcdHZhciBhbmNob3JzID0gdGhpcy5jdWJpYyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihhbmNob3JzLCBzZWdtZW50KXtcblx0XHRcdHZhciBhID0gc2VnbWVudC5hbmNob3JzO1xuXHRcdFx0aWYoc2VnbWVudC50eXBlPT09J00nKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OmFbMV19KTtcblx0XHRcdH0gZWxzZSBpZihzZWdtZW50LnR5cGU9PT0nTCcpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVsyXSwgeTogYVszXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbNF0sIHk6IGFbNV19KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBhbmNob3JzO1xuXG5cdFx0fSwgW10pO1xuXG5cdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0fTtcblxuXHQvL3Ryb3V2ZSBsZSBib3VuZGluZyBib3ggZCd1bmUgbGV0dHJlIChlbiBzZSBmaWFudCBqdXN0ZSBzdXIgbGVzIHBvaW50cy4uLiBvbiBuZSBjYWxjdWxlIHBhcyBvdSBwYXNzZSBsZSBwYXRoKVxuXHRQYXRoLnByb3RvdHlwZS5nZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLnBhdGhCQm94KHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRtLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIHRoaXMuZWFzZVBvaW50cyk7XG5cdH07XG5cblx0Ly9yZXR1cm5zIGEgbmV3IHBhdGgsIHNjYWxlZFxuXHRQYXRoLnByb3RvdHlwZS5zY2FsZSA9IFBhdGgucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24ocmF0aW8pIHtcblx0XHRyYXRpbyA9IHJhdGlvIHx8IDE7XG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0uc2NhbGUocmF0aW8pO1xuXHRcdHZhciBzdmcgPSBSYXBoYWVsLm1hcFBhdGgodGhpcy5nZXRTVkdTdHJpbmcoKSwgbSk7XG5cdFx0dmFyIGVhc2VQb2ludHMgPSB0aGlzLmVhc2VQb2ludHMubWFwKGZ1bmN0aW9uKGVwKXtcblx0XHRcdHJldHVybiBlcCAqIHJhdGlvO1xuXHRcdH0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIGVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmFwcGx5TWF0cml4ID0gZnVuY3Rpb24obSl7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHR2YXIgZWFzZVBvaW50cyA9IHRoaXMuZWFzZVBvaW50cy5tYXAoZnVuY3Rpb24oZXApe1xuXHRcdFx0cmV0dXJuIGVwIDsvLztcblx0XHR9KTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KHN2ZywgdGhpcy5uYW1lLCBudWxsLCBlYXNlUG9pbnRzKTtcblx0fTsgXG5cblx0UGF0aC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24ocGFydCwgbmFtZSnCoHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnQpO1xuXHRcdGlmKG5hbWUpIHRoaXMubmFtZSArPSBuYW1lO1xuXHRcdHRoaXMuX3NldFBhcnNlZCh0aGlzLnBhcnNlZC5jb25jYXQocGFydC5wYXJzZWQuc2xpY2UoMSkpKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hZGRFYXNlcG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5lYXNlUG9pbnRzLCBwb3MpO1xuXHRcdHRoaXMuZWFzZVBvaW50cy5wdXNoKHBvcyk7XG5cdH07XG5cblx0UGF0aC5mYWN0b3J5ID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHRyZXR1cm4gbmV3IFBhdGgoc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoO1xuXG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEVhc2Vwb2ludHMnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290Ll8sIHJvb3QuUmFwaGFlbCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIF8sIFJhcGhhZWwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIEdFVF9ERUZBVUxUUyA9IGZhbHNlO1xuXG5cdHZhciBkZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5cdHZhciByYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cdHZhciB0b1JhZGlhbnMgPSBmdW5jdGlvbihkZWdyZWVzKSB7XG5cdCAgcmV0dXJuIGRlZ3JlZXMgKiBkZWdUb1JhZDtcblx0fTtcdCBcblx0Ly8gQ29udmVydHMgZnJvbSByYWRpYW5zIHRvIGRlZ3JlZXMuXG5cdHZhciB0b0RlZ3JlZXMgPSBmdW5jdGlvbihyYWRpYW5zKSB7XG5cdCAgcmV0dXJuIHJhZGlhbnMgKiByYWRUb0RlZztcblx0fTtcblxuXG5cdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdHZhciBhbmdsZVRyZXNob2xkID0gdG9SYWRpYW5zKDEyKTtcblxuXHR2YXIgc3RhZ2U7XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0dmFyIGVsID0gc3RhZ2UuY2lyY2xlKHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMik7XG5cdFx0ZWwuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0dmFyIHNob3cgPSBmdW5jdGlvbihwYXRoRGVmKSB7XG5cdFx0dmFyIHBhdGggPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1x0XHRcdFxuXHRcdHZhciBlbCA9IHN0YWdlLnBhdGgocGF0aCk7XG5cdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogMywgc3Ryb2tlOiAnIzAwMDAwMCd9KTsvKiovXG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdHZhciBmaW5kRGVmYXVsdHMgPSBmdW5jdGlvbihwYXRoRGVmKXtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0dmFyIGxlbmd0aCA9IHBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0dmFyIHBvaW50UG9zID0gW107XG5cdFx0XG5cdFx0XG5cdFx0dmFyIHByZWNpc2lvbiA9IDE7XG5cdFx0dmFyIHByZXY7XG5cdFx0dmFyIGFsbFBvaW50cyA9IFtdO1xuXHRcdGZvcih2YXIgaT1wcmVjaXNpb247IGk8PWxlbmd0aDsgaSArPSBwcmVjaXNpb24pIHtcblx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0dmFyIHAgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgaSk7XG5cdFx0XHRcblx0XHRcdC8vaXQgc2VlbXMgdGhhdCBSYXBoYWVsJ3MgYWxwaGEgaXMgaW5jb25zaXN0ZW50Li4uIHNvbWV0aW1lcyBvdmVyIDM2MFxuXHRcdFx0dmFyIGFscGhhID0gTWF0aC5hYnMoIE1hdGguYXNpbiggTWF0aC5zaW4odG9SYWRpYW5zKHAuYWxwaGEpKSApKTtcblx0XHRcdGlmKHByZXYpIHtcblx0XHRcdFx0cC5kaWZmID0gTWF0aC5hYnMoYWxwaGEgLSBwcmV2KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHAuZGlmZiA9IDA7XG5cdFx0XHR9XG5cdFx0XHRwcmV2ID0gYWxwaGE7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHAuZGlmZik7XG5cblx0XHRcdGlmKHAuZGlmZiA+IGFuZ2xlVHJlc2hvbGQpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpKTtcblx0XHRcdFx0cG9pbnRQb3MucHVzaChpKTtcblx0XHRcdH1cblxuXHRcdFx0Ly9wLmNvbXB1dGVkQWxwaGEgPSBhbHBoYTtcblx0XHRcdC8vYWxsUG9pbnRzLnB1c2gocCk7XG5cblx0XHR9LyoqL1xuXG5cdFx0IC8qXG5cdFx0Ly9ERUJVRyBcblx0XHQvL2ZpbmQgbWF4IGN1cnZhdHVyZSB0aGF0IGlzIG5vdCBhIGN1c3AgKHRyZXNob2xkIGRldGVybWluZXMgY3VzcClcblx0XHR2YXIgY3VzcFRyZXNob2xkID0gNDA7XG5cdFx0dmFyIG1heCA9IGFsbFBvaW50cy5yZWR1Y2UoZnVuY3Rpb24obSwgcCl7XG5cdFx0XHRyZXR1cm4gcC5kaWZmID4gbSAmJiBwLmRpZmYgPCBjdXNwVHJlc2hvbGQgPyBwLmRpZmYgOiBtO1xuXHRcdH0sIDApO1xuXHRcdGNvbnNvbGUubG9nKG1heCk7XG5cblx0XHR2YXIgcHJldiA9IFswLDAsMCwwXTtcblx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdHZhciByID0gTWF0aC5yb3VuZCgocC5kaWZmIC8gbWF4KSAqIDI1NSk7XG5cdFx0XHR2YXIgZyA9IDI1NSAtIE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0dmFyIHJnYiA9ICdyZ2IoJytyKycsJytnKycsMCknO1xuXHRcdFx0aWYocj4xMDApIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJz09PT09PT09PT0nKTtcblx0XHRcdFx0cHJldi5mb3JFYWNoKGZ1bmN0aW9uKHApe2NvbnNvbGUubG9nKHAuY29tcHV0ZWRBbHBoYSwgcC5hbHBoYSk7fSk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHAuY29tcHV0ZWRBbHBoYSwgcC5hbHBoYSwgcmdiKTtcblx0XHRcdH1cblx0XHRcdHAueSArPSAxNTA7XG5cdFx0XHRzaG93UG9pbnQocCwgcmdiLCAwLjUpO1xuXHRcdFx0cHJldlszXSA9IHByZXZbMl07XG5cdFx0XHRwcmV2WzJdID0gcHJldlsxXTtcblx0XHRcdHByZXZbMV0gPSBwcmV2WzBdO1xuXHRcdFx0cHJldlswXSA9IHA7XG5cdFx0fSk7XG5cdFx0LyoqL1xuXG5cdFx0Ly9maW5kcyBncm91cHMgb2YgcG9pbnRzIGRlcGVuZGluZyBvbiB0cmVzaG9sZCwgYW5kIGZpbmQgdGhlIG1pZGRsZSBvZiBlYWNoIGdyb3VwXG5cdFx0cmV0dXJuIHBvaW50UG9zLnJlZHVjZShmdW5jdGlvbihwb2ludHMsIHBvaW50KXtcblxuXHRcdFx0dmFyIGxhc3QgPSBwb2ludHNbcG9pbnRzLmxlbmd0aC0xXTtcblx0XHRcdGlmKCFsYXN0IHx8IHBvaW50IC0gbGFzdFtsYXN0Lmxlbmd0aC0xXSA+IGRpc3RhbmNlVHJlc2hvbGQpe1xuXHRcdFx0XHRsYXN0ID0gW3BvaW50XTtcblx0XHRcdFx0cG9pbnRzLnB1c2gobGFzdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsYXN0LnB1c2gocG9pbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcG9pbnRzO1xuXHRcdH0sIFtdKS5tYXAoZnVuY3Rpb24ocG9pbnRzKXtcblx0XHRcdHJldHVybiBwb2ludHNbTWF0aC5mbG9vcihwb2ludHMubGVuZ3RoLzIpXTtcblx0XHR9KTtcblx0XHRcblx0fTtcblxuXHR2YXIgYWxsUG9pbnRzID0gW107XG5cdHZhciBlYXNlUG9pbnRzID0ge307XG5cblx0dmFyIGN1cnJlbnQ7XG5cblx0dmFyIGdldEVhc2Vwb2ludHMgPSBmdW5jdGlvbihsZXR0ZXIsIHBhdGhJZHgsIHBhdGhEZWYpe1xuXHRcdFxuXHRcdHZhciBwYXRoID0gc2hvdyhwYXRoRGVmKTtcblxuXHRcdC8vYXJlIGVhc2UgcG9pbnRzIGFscmVhZHkgc2V0IGZvciB0aGlzIHBhdGg/XG5cdFx0dmFyIHBhdGhFYXNlUG9pbnRzID0gcGF0aERlZi5nZXRFYXNlcG9pbnRzKCk7IFxuXHRcdGlmKHBhdGhFYXNlUG9pbnRzLmxlbmd0aCA9PT0gMCAmJiBHRVRfREVGQVVMVFMpIHtcblx0XHRcdHBhdGhFYXNlUG9pbnRzID0gZmluZERlZmF1bHRzKHBhdGhEZWYpO1xuXHRcdH1cblxuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdFxuXG5cdFx0dmFyIGluYWN0aXZlQ29sb3IgPSAnIzAwZmYwMCc7XG5cdFx0dmFyIGFjdGl2ZUNvbG9yID0gJyNmZjIyMDAnO1xuXG5cdFx0dmFyIGFkZFBvaW50ID0gZnVuY3Rpb24ocG9zKXtcblx0XHRcdHZhciBwT2JqID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHR2YXIgcG9pbnQgPSBzaG93UG9pbnQocE9iaiwgaW5hY3RpdmVDb2xvciwgMyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhJZHgpO1xuXHRcdFx0cG9pbnQuZGF0YSgncG9zJywgcG9zKTtcblx0XHRcdHBvaW50LmRhdGEoJ2xldHRlcicsIGxldHRlcik7XG5cdFx0XHRwb2ludC5kYXRhKCdwYXRoSWR4JywgcGF0aElkeCk7XG5cdFx0XHRwb2ludC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRcdHBvaW50LmRhdGEoJ3knLCBwT2JqLnkpO1xuXG5cdFx0XHRhbGxQb2ludHMucHVzaChwb2ludCk7XG5cblx0XHRcdHBvaW50LmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFxuXHRcdFx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0XHRwLmF0dHIoe2ZpbGw6IGluYWN0aXZlQ29sb3J9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cG9pbnQuYXR0cih7ZmlsbDogYWN0aXZlQ29sb3J9KTtcblxuXHRcdFx0XHRjdXJyZW50ID0ge1xuXHRcdFx0XHRcdHBvaW50OiBwb2ludCxcblx0XHRcdFx0XHRwYXRoOiBwYXRoLFxuXHRcdFx0XHRcdHBhdGhEZWY6IHBhdGhEZWYsXG5cdFx0XHRcdFx0c3ZnIDogcGF0aFN0cixcblx0XHRcdFx0XHRsZXR0ZXIgOiBsZXR0ZXIsXG5cdFx0XHRcdFx0cGF0aElkeCA6IHBhdGhJZHhcblx0XHRcdFx0fTtcblxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHBhdGhFYXNlUG9pbnRzLmZvckVhY2goYWRkUG9pbnQpOy8qKi9cblxuXHRcdHBhdGguY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdC8vY29uc29sZS5sb2coJ2FkZCcpO1xuXHRcdFx0YWRkUG9pbnQoMCk7XG5cdFx0fSk7XG5cdFx0XG5cblx0XHRyZXR1cm4gcGF0aEVhc2VQb2ludHM7XG5cblx0fTtcblxuXHR2YXIgbW92ZUN1cnJlbnQgPSBmdW5jdGlvbihkaXN0KSB7XG5cdFx0dmFyIHAgPSBjdXJyZW50LnBvaW50O1xuXHRcdHZhciBwb3MgPSBwLmRhdGEoJ3BvcycpO1xuXHRcdHBvcyArPSBkaXN0O1xuXHRcdHZhciBtYXggPSBjdXJyZW50LnBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0aWYocG9zIDwgMCkgcG9zID0gMDtcblx0XHRpZihwb3MgPiBtYXgpIHBvcyA9IG1heDtcblx0XHRwLmRhdGEoJ3BvcycsIHBvcyk7XG5cblx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJyZW50LnN2ZywgcG9zKTtcblxuXHRcdHZhciB4ID0gcC5kYXRhKCd4Jyk7XG5cdFx0dmFyIHkgPSBwLmRhdGEoJ3knKTtcblx0XHR2YXIgZGVsdGFYID0gcE9iai54IC0geDtcblx0XHR2YXIgZGVsdGFZID0gcE9iai55IC0geTtcblxuXHRcdC8qcC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRwLmRhdGEoJ3knLCBwT2JqLnkpOy8qKi9cblxuXHRcdHAudHJhbnNmb3JtKCd0JyArIGRlbHRhWCArICcsJyArIGRlbHRhWSk7XG5cdFx0cHJpbnRKU09OKCk7XG5cblx0fTtcblxuXG5cdCQod2luZG93KS5vbigna2V5ZG93bi5lYXNlJywgZnVuY3Rpb24oZSl7XG5cdFx0Ly9jb25zb2xlLmxvZyhlLndoaWNoLCBjdXJyZW50KTtcblx0XHR2YXIgTEVGVCA9IDM3O1xuXHRcdHZhciBVUCA9IDM4O1xuXHRcdHZhciBSSUdIVCA9IDM5O1xuXHRcdHZhciBET1dOID0gNDA7XG5cdFx0dmFyIERFTCA9IDQ2O1xuXG5cdFx0aWYoY3VycmVudCkge1xuXHRcdFx0c3dpdGNoKGUud2hpY2gpIHtcblx0XHRcdFx0Y2FzZSBMRUZUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgRE9XTjpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoLTEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBSSUdIVDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgVVA6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KDEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBERUw6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHZhciBpZHggPSBhbGxQb2ludHMuaW5kZXhPZihjdXJyZW50LnBvaW50KTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGlkeCk7XG5cdFx0XHRcdFx0Y3VycmVudC5wb2ludC5yZW1vdmUoKTtcblx0XHRcdFx0XHRhbGxQb2ludHMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhbGxQb2ludHMpO1xuXHRcdFx0XHRcdGN1cnJlbnQgPSBudWxsO1xuXHRcdFx0XHRcdHByaW50SlNPTigpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSk7XG5cblx0dmFyIHByaW50Tm9kZTtcblx0dmFyIHByaW50SlNPTiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBqc29uID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihqc29uLCBwb2ludCl7XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBwb2ludC5kYXRhKCdsZXR0ZXInKTtcblx0XHRcdHZhciBwYXRoSWR4ID0gcG9pbnQuZGF0YSgncGF0aElkeCcpO1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBqc29uW2xldHRlcl0gPSBqc29uW2xldHRlcl0gfHwgW107XG5cdFx0XHR2YXIgZWFzZXBvaW50cyA9IHBhdGhzW3BhdGhJZHhdID0gcGF0aHNbcGF0aElkeF0gfHwgW107XG5cdFx0XHRlYXNlcG9pbnRzLnB1c2gocG9pbnQuZGF0YSgncG9zJykpO1xuXHRcdFx0ZWFzZXBvaW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpe1xuXHRcdFx0XHRyZXR1cm4gYSAtIGI7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBqc29uO1xuXHRcdH0sIHt9KTtcblx0XHRwcmludE5vZGUudGV4dChKU09OLnN0cmluZ2lmeShqc29uKSk7XG5cdH07XG5cblx0cmV0dXJuIGZ1bmN0aW9uKHMsIGdyb3Vwcywgbm9kZSwgZGltKXtcblx0XHRzdGFnZSA9IHM7XG5cdFx0dmFyIHBhZCA9IDIwO1xuXHRcdHZhciBhdmFpbFcgPSBkaW1bMF0gLSBwYWQ7XG5cblx0XHR2YXIgZ3JvdXBNYXhIZWlnaHQgPSBPYmplY3Qua2V5cyhncm91cHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIGdyb3VwTmFtZSl7XG5cdFx0XHR2YXIgdCA9IGdyb3Vwc1tncm91cE5hbWVdLmdldEhlaWdodCgpO1xuXHRcdFx0aWYobWluID09PSB1bmRlZmluZWQgfHwgdCA+IG1pbikge1xuXHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFxuXHRcdHZhciB0b3BMZWZ0ID0ge3g6cGFkLCB5OnBhZH07XG5cdFx0T2JqZWN0LmtleXMoZ3JvdXBzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpe1xuXHRcdFx0dmFyIGdyb3VwID0gZ3JvdXBzW25hbWVdO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhncm91cCk7XG5cdFx0XHR2YXIgZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cblx0XHRcdGlmKGVuZExlZnQgPiBhdmFpbFcpIHtcblx0XHRcdFx0dG9wTGVmdC54ID0gcGFkO1xuXHRcdFx0XHR0b3BMZWZ0LnkgKz0gcGFkICsgZ3JvdXBNYXhIZWlnaHQ7XG5cdFx0XHRcdGVuZExlZnQgPSB0b3BMZWZ0LnggKyBncm91cC5nZXRXaWR0aCgpICsgcGFkO1xuXHRcdFx0fVxuXG5cblx0XHRcdHZhciB0aGlzRWFzZSA9IGdyb3VwLnBhdGhzLm1hcChmdW5jdGlvbihwLCBpZHgpe1xuXHRcdFx0XHRwID0gcC50cmFuc2xhdGUodG9wTGVmdC54LCB0b3BMZWZ0LnkpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0RWFzZXBvaW50cyhuYW1lLCBpZHgsIHApO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dG9wTGVmdC54ID0gZW5kTGVmdDtcdFx0XHRcblxuXHRcdH0pO1xuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cblx0XHRwcmludE5vZGUgPSBub2RlO1xuXHRcdHByaW50SlNPTigpO1xuXHR9O1xuXG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgUGF0aEdyb3VwID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNldEJvdW5kaW5nID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXRocy5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHBhdGgpe1xuXHRcdFx0dmFyIHBhdGhCb3VuZGluZyA9IHBhdGguZ2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZy54ID0gYm91bmRpbmcueCA8IHBhdGhCb3VuZGluZy54ID8gYm91bmRpbmcueCA6ICBwYXRoQm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLnkgPSBib3VuZGluZy55IDwgcGF0aEJvdW5kaW5nLnkgPyBib3VuZGluZy55IDogIHBhdGhCb3VuZGluZy55O1xuXHRcdFx0Ym91bmRpbmcueDIgPSBib3VuZGluZy54MiA+IHBhdGhCb3VuZGluZy54MiA/IGJvdW5kaW5nLngyIDogcGF0aEJvdW5kaW5nLngyO1xuXHRcdFx0Ym91bmRpbmcueTIgPSBib3VuZGluZy55MiA+IHBhdGhCb3VuZGluZy55MiA/IGJvdW5kaW5nLnkyIDogcGF0aEJvdW5kaW5nLnkyO1xuXHRcdFx0Ym91bmRpbmcud2lkdGggPSBib3VuZGluZy54MiAtIGJvdW5kaW5nLng7XG5cdFx0XHRib3VuZGluZy5oZWlnaHQgPSBib3VuZGluZy55MiAtIGJvdW5kaW5nLnk7XG5cdFx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdFx0fSwgdW5kZWZpbmVkKSB8fCB7fTtcblx0XHQvL2lmIHRoZXJlJ3MgYSBlbmRQb2ludCBwb2ludCB0aGF0IGlzIHNldCwgdXNlIGl0cyBjb29yZGluYXRlcyBhcyBib3VuZGluZ1xuXHRcdGlmKHRoaXMuZW5kUG9pbnQpIHtcblx0XHRcdHZhciBhbmNob3JzID0gdGhpcy5lbmRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueDIgPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHRcdGlmKHRoaXMuc3RhcnRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLnN0YXJ0UG9pbnQuZ2V0UG9pbnQoMCk7XG5cdFx0XHR0aGlzLmJvdW5kaW5nLnggPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuYWRkUGF0aCA9IGZ1bmN0aW9uKHApe1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzIHx8IFtdO1xuXHRcdGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignZW5kJykgPT09IDApIHtcblx0XHRcdHRoaXMuZW5kUG9pbnQgPSBwO1xuXHRcdH0gZWxzZSBpZihwLm5hbWUgJiYgcC5uYW1lLmluZGV4T2YoJ3N0YXJ0JykgPT09IDApIHtcblx0XHRcdHRoaXMuc3RhcnRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy5oZWlnaHQ7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcud2lkdGg7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0Qm90dG9uID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy55Mjtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRUb3AgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnk7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0TGVmdCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRSaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDI7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbih4LCB5KXtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocy5tYXAoZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHBhdGggPSBwYXRoLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRyZXR1cm4gcGF0aDtcblx0XHR9KTtcblx0XHR0aGlzLmVuZFBvaW50ID0gKHRoaXMuZW5kUG9pbnQgJiYgdGhpcy5lbmRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnRyYW5zbGF0ZSh4LCB5KSk7XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBQYXRoR3JvdXAsIHNjYWxlZFxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuXHRcdGlmKCF0aGlzLnBhdGhzKSByZXR1cm4gdGhpcztcblx0XHR2YXIgc2NhbGVkID0gbmV3IFBhdGhHcm91cCh0aGlzLm5hbWUpO1xuXHRcdHRoaXMucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKXtcblx0XHRcdHNjYWxlZC5hZGRQYXRoKHBhdGguc2NhbGUoc2NhbGUpKTtcblx0XHR9KTtcblxuXHRcdHNjYWxlZC5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQuc2NhbGUoc2NhbGUpKTtcblx0XHRzY2FsZWQuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnNldEJvdW5kaW5nKCk7XG5cdFx0cmV0dXJuIHNjYWxlZDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFBhdGhzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5wYXRocztcblx0fTtcblxuXHRyZXR1cm4gUGF0aEdyb3VwO1xuXG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi9QYXRoR3JvdXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXApO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChQYXRoR3JvdXApIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXG5cdFx0Z2V0UGF0aHMgOiBmdW5jdGlvbihhbHBoYWJldCwgdGV4dCkge1xuXHRcdFx0dmFyIHJpZ2h0ID0gMDtcblx0XHRcdHZhciBsaW5lcyA9IG5ldyBQYXRoR3JvdXAodGV4dCk7XG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXG5cdFx0XHQvL2xvb3AgZm9yIGV2ZXJ5IGNoYXJhY3RlciBpbiBuYW1lIChzdHJpbmcpXG5cdFx0XHRmb3IodmFyIGk9MDsgaTx0ZXh0Lmxlbmd0aDsgaSsrKcKge1xuXHRcdFx0XHR2YXIgbGV0dGVyID0gdGV4dFtpXTtcblx0XHRcdFx0aWYobGV0dGVyID09PSAnICcpIHtcblx0XHRcdFx0XHRyaWdodCArPSBhbHBoYWJldC5nZXROU3BhY2UoKTtcblx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGxldHRlckRlZiA9IGFscGhhYmV0LmdldFN5bWJvbChsZXR0ZXIpIHx8IGFscGhhYmV0LmdldFN5bWJvbCgnLScpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgbGV0dGVyRGVmKTtcblxuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGxldHRlckpvaW5lZEVuZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXR0ZXJEZWYucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHRcdFx0dmFyIGRlZiA9IHBhdGgudHJhbnNsYXRlKHJpZ2h0LCAwKTtcblx0XHRcdFx0XHR2YXIgam9pbmVkU3RhcnQgPSBkZWYubmFtZSAmJiBkZWYubmFtZS5pbmRleE9mKCdqb2luYScpID4gLTE7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZEVuZCA9IC9qb2luKGE/KWIvLnRlc3QoZGVmLm5hbWUpO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyLCBqb2luZWRTdGFydCwgam9pbmVkRW5kKTtcblx0XHRcdFx0XHRsZXR0ZXJKb2luZWRFbmQgPSBsZXR0ZXJKb2luZWRFbmQgfHwgam9pbmVkRW5kO1xuXHRcdFx0XHRcdGlmKGpvaW5lZFN0YXJ0ICYmIGNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vYXBwZW5kIGF1IGNvbnRpbnVvdXNcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYXBwZW5kKGRlZiwgbGV0dGVyKTtcblxuXHRcdFx0XHRcdFx0Ly9ham91dGUgbGVzIGVhc2Vwb2ludHMgZGUgY2UgcGF0aFxuXHRcdFx0XHRcdFx0dmFyIHBhdGhTdGFydFBvcyA9IGNvbnRpbnVvdXMuZ2V0TGVuZ3RoKCkgLSBkZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHRkZWYuZ2V0RWFzZXBvaW50cygpLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0XHRcdFx0Y29udGludW91cy5hZGRFYXNlcG9pbnQocGF0aFN0YXJ0UG9zICsgcG9zKTtcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmKGpvaW5lZEVuZCAmJiAhY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9zdGFydCB1biBub3V2ZWF1IGxpbmUgKGNsb25lIGVuIHNjYWxhbnQgZGUgMSlcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBkZWYuY2xvbmUoKTtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMubmFtZSA9IGxldHRlcjtcblx0XHRcdFx0XHRcdGxpbmVzLmFkZFBhdGgoY29udGludW91cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxpbmVzLmFkZFBhdGgoZGVmKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZighbGV0dGVySm9pbmVkRW5kKSB7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0cmlnaHQgKz0gbGV0dGVyRGVmLmdldFdpZHRoKCk7XG5cdFx0XHRcdC8vY29uc29sZS50YWJsZShbe2xldHRlcjpuYW1lW2ldLCBsZXR0ZXJXaWR0aDogbGV0dGVyLmdldFdpZHRoKCksIHRvdGFsOnJpZ2h0fV0pO1x0XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbGluZXM7XG5cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFZlY3RvcldvcmQ7XG5cdFxufSkpO1xuXG5cbiJdfQ==
