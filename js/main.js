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
	var H = 1600;
	var T = 50;
	var LINE_HEIGHT = 1.2;//em
	var availableWidth = W / 2;
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
			text : 'T',
			size : 0.8
		},
		{
			text : 'Rldt',//names.pop(),
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
				var end = guidis.getSymbol('endNom');
				end = end && end.getPaths()[0];
				
				var endStr = end.getSVGString();
				var length = end.getLength();

				var startPos = Raphael.getPointAtLength(endStr, 0);
				var endPos = Raphael.getPointAtLength(endStr, length);

				var wordPaths = word.getPaths();
				//trouve le path le plus à droite
				var lastPath = wordPaths.reduce(function(last, cur){
					last = last || cur;
					var bbLast = last.getBounding();
					var bbCur = cur.getBounding();
					if(bbLast.x2 < bbCur.x2) last = cur;
					return last;
				}, null);
				console.log(word.name);

				var bb = lastPath.getBounding();
				end = end.translate(bb.x2 - startPos.x, bb.y2 - startPos.y);

				//var lastPath = wordPaths[wordPaths.length-1];
				console.log(lastPath.name);

				lastPath.append(end);
				
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvRXhhbXBsZS5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHRcblx0dmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblx0dmFyIFJhcGhhZWwgPSByZXF1aXJlKCdyYXBoYWVsJyk7XG5cdHZhciBFbWlsaWVGb250ID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0VtaWxpZUZvbnQuanMnKTtcblx0dmFyIERyYXdQYXRoID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0RyYXdQYXRoJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQnKTtcblx0dmFyIEFscGhhYmV0ID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0Jyk7XG5cdHZhciBQYXRoRWFzZXBvaW50cyA9IHJlcXVpcmUoJy4vbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cycpOy8qKi9cblx0dmFyIFR3ZWVuTWF4ID0gcmVxdWlyZSgnZ3NhcCcpO1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBXID0gMTIwMDtcblx0dmFyIEggPSAxNjAwO1xuXHR2YXIgVCA9IDUwO1xuXHR2YXIgTElORV9IRUlHSFQgPSAxLjI7Ly9lbVxuXHR2YXIgYXZhaWxhYmxlV2lkdGggPSBXIC8gMjtcblx0dmFyIFNQRUVEID0gMjUwOy8vcHggcGVyIHNlY1xuXG5cblx0dmFyIG5hbWVzID0gW1wiSmVzc2ljYSBXYW5uaW5nXCIsXCJKdWxpYSBSb2Nrd2VsbFwiLFwiQ2Fyb2wgSHViYmFyZFwiLFwiUm9uYWxkIENhbmR5XCIsXCJKb2huIE5ld3RvblwiLFwiRWx2aXMgTmljb2xlXCIsXCJHbG9yaWEgV2VhdmVyXCIsXCJKdWxpYSBDcm9ua2l0ZVwiLFwiTW90aGVyIFJvZ2Vyc1wiLFwiQ2hldnkgSXJ3aW5cIixcIkVkZGllIEFsbGVuXCIsXCJOb3JtYW4gSmFja3NvblwiLFwiUGV0ZXIgUm9nZXJzXCIsXCJXZWlyZCBDaGFzZVwiLFwiQ29saW4gTWF5c1wiLFwiTmFwb2xlb24gTWFydGluXCIsXCJFZGdhciBTaW1wc29uXCIsXCJNb2hhbW1hZCBNY0NhcnRuZXlcIixcIkxpYmVyYWNlIFdpbGxpYW1zXCIsXCJGaWVsZHMgQnVybmV0dFwiLFwiU3RldmUgQXNoZVwiLFwiQ2FycmllIENoYXJsZXNcIixcIlRvbW15IFBhc3RldXJcIixcIkVkZGllIFNpbHZlcnN0b25lXCIsXCJPcHJhaCBBc2hlXCIsXCJSYXkgQmFsbFwiLFwiSmltIERpYW5hXCIsXCJNaWNoZWxhbmdlbG8gRWFzdHdvb2RcIixcIkdlb3JnZSBTaW1wc29uXCIsXCJBbGljaWEgQXVzdGVuXCIsXCJKZXNzaWNhIE5pY29sZVwiLFwiTWFyaWx5biBFdmVyZXR0XCIsXCJLZWl0aCBFYXN0d29vZFwiLFwiUGFibG8gRWFzdHdvb2RcIixcIlBleXRvbiBMdXRoZXJcIixcIk1vemFydCBBcm1zdHJvbmdcIixcIk1pY2hhZWwgQnVybmV0dFwiLFwiS2VpdGggR2xvdmVyXCIsXCJFbGl6YWJldGggQ2hpbGRcIixcIk1pbGVzIEFzdGFpcmVcIixcIkFuZHkgRWRpc29uXCIsXCJNYXJ0aW4gTGVubm9uXCIsXCJUb20gUGljY2Fzb1wiLFwiQmV5b25jZSBEaXNuZXlcIixcIlBldGVyIENsaW50b25cIixcIkhlbnJ5IEtlbm5lZHlcIixcIlBhdWwgQ2hpbGRcIixcIkxld2lzIFNhZ2FuXCIsXCJNaWNoZWxhbmdlbG8gTGVlXCIsXCJNYXJpbHluIEZpc2hlclwiXTtcblx0ZnVuY3Rpb24gU2h1ZmZsZShvKSB7XG5cdFx0Zm9yKHZhciBqLCB4LCBpID0gby5sZW5ndGg7IGk7IGogPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogaSksIHggPSBvWy0taV0sIG9baV0gPSBvW2pdLCBvW2pdID0geCk7XG5cdFx0cmV0dXJuIG87XG5cdH07XG5cdFNodWZmbGUobmFtZXMpO1xuXHQvL25hbWVzLmxlbmd0aCA9IDE7LyoqL1xuXHR2YXIgd29yZHMgPSBbXG5cdFx0e1xuXHRcdFx0dGV4dCA6ICdUJyxcblx0XHRcdHNpemUgOiAwLjhcblx0XHR9LFxuXHRcdHtcblx0XHRcdHRleHQgOiAnUmxkdCcsLy9uYW1lcy5wb3AoKSxcblx0XHRcdHNpemUgOiAxXG5cdFx0fVxuXHRdO1xuXG5cdC8vbmFtZXMgPSBbJ2Frc3R0ZWYnXTtcblxuXHR2YXIgZW1pbHkgPSBBbHBoYWJldC5mYWN0b3J5KCkuaW5pdChFbWlsaWVGb250KTtcblx0dmFyIGVtaWx5TG9hZGluZyA9IGVtaWx5LmxvYWQoKTtcblxuXHR2YXIgZ3VpZGlzID0gQWxwaGFiZXQuZmFjdG9yeSgpLmluaXQoe1xuXHRcdHNjYWxlIDogMSxcblx0XHRzdmdGaWxlIDogJ2Fzc2V0cy9ndWlkaXMuc3ZnJyxcblx0XHRlYXNlcG9pbnRzIDoge31cblx0fSk7XG5cdHZhciBndWlkaXNMb2FkaW5nID0gZ3VpZGlzLmxvYWQoKTtcblxuXHR2YXIgbG9hZGluZyA9ICQud2hlbihlbWlseUxvYWRpbmcsIGd1aWRpc0xvYWRpbmcpO1xuXG5cblx0dmFyIGdldFN0YWdlID0gKGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHN0YWdlO1xuXHRcdHZhciBpbml0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBSYXBoYWVsKFwic3ZnXCIsIFcsIEgpO1xuXHRcdH07XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3RhZ2UgPSBzdGFnZSB8fCBpbml0KCk7XG5cdFx0fVxuXHR9KSgpO1xuXG5cdHZhciBkb0RyYXcgPSBmdW5jdGlvbigpe1xuXHRcdHZhciB0b3AgPSBUO1xuXHRcdHZhciB0bCA9IHdvcmRzLnJlZHVjZShmdW5jdGlvbih0bCwgcGFyYW1zLCBsaW5lTnVtKXtcblxuXHRcdFx0dmFyIHdvcmQgPSBWZWN0b3JXb3JkLmdldFBhdGhzKGVtaWx5LCBwYXJhbXMudGV4dCk7XG5cblx0XHRcdHdvcmQgPSB3b3JkLnNjYWxlKHBhcmFtcy5zaXplKTtcblxuXHRcdFx0Ly9jZW50ZXIgdGV4dFxuXHRcdFx0dmFyIHdpZHRoID0gd29yZC5nZXRXaWR0aCgpO1xuXHRcdFx0dmFyIGxlZnQgPSAoVyAtIHdpZHRoKSAvIDI7XG5cblx0XHRcdHdvcmQuc2V0T2Zmc2V0KGxlZnQsIHRvcCk7XG5cdFx0XHRcblx0XHRcdHRvcCArPSB3b3JkLmdldEhlaWdodCgpICogTElORV9IRUlHSFQ7XG5cblx0XHRcdC8vYWpvdXRlIGxlIGd1aWRpIHN1ciBsZSBkZXJuaWVyIG1vdFxuXHRcdFx0aWYobGluZU51bSA9PT0gd29yZHMubGVuZ3RoIC0xKSB7XG5cdFx0XHRcdHZhciBlbmQgPSBndWlkaXMuZ2V0U3ltYm9sKCdlbmROb20nKTtcblx0XHRcdFx0ZW5kID0gZW5kICYmIGVuZC5nZXRQYXRocygpWzBdO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGVuZFN0ciA9IGVuZC5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdFx0dmFyIGxlbmd0aCA9IGVuZC5nZXRMZW5ndGgoKTtcblxuXHRcdFx0XHR2YXIgc3RhcnRQb3MgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgoZW5kU3RyLCAwKTtcblx0XHRcdFx0dmFyIGVuZFBvcyA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChlbmRTdHIsIGxlbmd0aCk7XG5cblx0XHRcdFx0dmFyIHdvcmRQYXRocyA9IHdvcmQuZ2V0UGF0aHMoKTtcblx0XHRcdFx0Ly90cm91dmUgbGUgcGF0aCBsZSBwbHVzIMOgIGRyb2l0ZVxuXHRcdFx0XHR2YXIgbGFzdFBhdGggPSB3b3JkUGF0aHMucmVkdWNlKGZ1bmN0aW9uKGxhc3QsIGN1cil7XG5cdFx0XHRcdFx0bGFzdCA9IGxhc3QgfHwgY3VyO1xuXHRcdFx0XHRcdHZhciBiYkxhc3QgPSBsYXN0LmdldEJvdW5kaW5nKCk7XG5cdFx0XHRcdFx0dmFyIGJiQ3VyID0gY3VyLmdldEJvdW5kaW5nKCk7XG5cdFx0XHRcdFx0aWYoYmJMYXN0LngyIDwgYmJDdXIueDIpIGxhc3QgPSBjdXI7XG5cdFx0XHRcdFx0cmV0dXJuIGxhc3Q7XG5cdFx0XHRcdH0sIG51bGwpO1xuXHRcdFx0XHRjb25zb2xlLmxvZyh3b3JkLm5hbWUpO1xuXG5cdFx0XHRcdHZhciBiYiA9IGxhc3RQYXRoLmdldEJvdW5kaW5nKCk7XG5cdFx0XHRcdGVuZCA9IGVuZC50cmFuc2xhdGUoYmIueDIgLSBzdGFydFBvcy54LCBiYi55MiAtIHN0YXJ0UG9zLnkpO1xuXG5cdFx0XHRcdC8vdmFyIGxhc3RQYXRoID0gd29yZFBhdGhzW3dvcmRQYXRocy5sZW5ndGgtMV07XG5cdFx0XHRcdGNvbnNvbGUubG9nKGxhc3RQYXRoLm5hbWUpO1xuXG5cdFx0XHRcdGxhc3RQYXRoLmFwcGVuZChlbmQpO1xuXHRcdFx0XHRcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIERyYXdQYXRoLmdyb3VwKHdvcmQuZ2V0UGF0aHMoKSwgZ2V0U3RhZ2UoKSwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IFNQRUVEICogcGFyYW1zLnNpemUsXG5cdFx0XHRcdGNvbG9yIDogJyM0NDQ0NDQnLFxuXHRcdFx0XHRzdHJva2VXaWR0aCA6IDIsXG5cdFx0XHRcdGVhc2luZyA6IGdzYXAuU2luZS5lYXNlSW5PdXRcblx0XHRcdH0sIHRsKTtcblx0XHRcdFxuXG5cdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe3BhdXNlZDp0cnVlfSkpO1xuXG5cdFx0dGwucGxheSgpO1xuXG5cblx0fTtcblxuXHRcdFxuXHR2YXIgYnRuID0gJCgnI2N0cmwnKTtcblxuXHRidG4ub24oJ2NsaWNrLmFscGhhYmV0JywgZnVuY3Rpb24oKXtcblx0XHRsb2FkaW5nLnRoZW4oZG9EcmF3KTtcblx0fSk7XG5cblxuXG5cdC8vcGFyc2UgbGVzIGVhc2Vwb2ludHMgZGUgY2hhcXVlIGxldHRyZSwgb3V0cHV0IGVuIEpTT04gKMOgIHNhdmVyKVxuXHR2YXIgcHJpbnRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKXtcblx0XHRQYXRoRWFzZXBvaW50cyhnZXRTdGFnZSgpLCBBbHBoYWJldC5nZXRBbGwoKSwgJCgnI2JycCcpLCBbVywgSF0pO1xuXG5cdH07XG5cblx0dmFyIGdldEJwciA9ICQoJyNnZXRicnAnKTtcblxuXHRnZXRCcHIub24oJ2NsaWNrLmFscGhhYmV0JywgZnVuY3Rpb24oKXtcblx0XHRsb2FkaW5nLnRoZW4ocHJpbnRFYXNlcG9pbnRzKTtcblx0fSk7XG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnLi9QYXRoJyksIHJlcXVpcmUoJy4vUGF0aEdyb3VwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aCwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGhHcm91cCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIFBhdGgsIFBhdGhHcm91cCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXG5cdHZhciBzcGVjaWFsQ2hhcnMgPSB7XG5cdFx0J194MkRfJyA6ICctJyxcblx0XHQnX3gyRV8nIDogJy4nXG5cdH07XG5cblx0dmFyIEFscGhhYmV0ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgc2V0dGluZ3M7XG5cdFx0dmFyIHN5bWJvbHMgPSB7fTtcblxuXG5cdFx0dmFyIHBhcnNlU1ZHID0gZnVuY3Rpb24oZGF0YSl7XG5cblx0XHRcdC8vY29uc29sZS5sb2coZGF0YSk7XG5cdFx0XHR2YXIgZG9jID0gJChkYXRhKTtcblx0XHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdFx0bGF5ZXJzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0XHR2YXIgbGF5ZXIgPSAkKGVsKTtcblx0XHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblx0XHRcdFx0aWQgPSBzcGVjaWFsQ2hhcnNbaWRdIHx8IGlkO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGlkKTtcblx0XHRcdFx0Ly9pZihpZC5sZW5ndGggPiAxKSByZXR1cm47XG5cdFx0XHRcdHZhciBwYXRocyA9IGxheWVyLmZpbmQoJ3BhdGgnKTtcblx0XHRcdFx0aWYocGF0aHMubGVuZ3RoPT09MCkgcmV0dXJuO1xuXG5cdFx0XHRcdHZhciBzeW1ib2wgPSBzeW1ib2xzW2lkXSA9IG5ldyBQYXRoR3JvdXAoaWQpO1xuXG5cdFx0XHRcdHBhdGhzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0XHRcdHZhciBwYXRoRWwgPSAkKGVsKTtcblx0XHRcdFx0XHR2YXIgcCA9IFBhdGguZmFjdG9yeSggcGF0aEVsLmF0dHIoJ2QnKSwgcGF0aEVsLmF0dHIoJ2lkJyksIG51bGwsIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdICYmIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdW2ldKS5zY2FsZShzZXR0aW5ncy5zY2FsZSB8fCAxKTtcdFx0XHRcdFxuXHRcdFx0XHRcdHN5bWJvbC5hZGRQYXRoKCBwICk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly90cm91dmUgbGUgdG9wIGFic29sdSAodG9wIGRlIGxhIGxldHRyZSBsYSBwbHVzIGhhdXRlKVxuXHRcdFx0dmFyIHRvcCA9IE9iamVjdC5rZXlzKHN5bWJvbHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIHN5bWJvbE5hbWUpe1xuXHRcdFx0XHR2YXIgdCA9IHN5bWJvbHNbc3ltYm9sTmFtZV0uZ2V0VG9wKCk7XG5cdFx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IHQpIHtcblx0XHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBtaW47XG5cdFx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhzeW1ib2xzKTtcblxuXHRcdFx0Ly9hanVzdGUgbGUgYmFzZWxpbmUgZGUgY2hhcXVlIGxldHRyZVxuXHRcdFx0T2JqZWN0LmtleXMoc3ltYm9scykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcblx0XHRcdFx0c3ltYm9sc1trZXldLnNldE9mZnNldCgtMSAqIHN5bWJvbHNba2V5XS5nZXRMZWZ0KCksIC0xICogdG9wKTtcblx0XHRcdH0pO1xuXG5cblx0XHR9O1xuXG5cdFx0dmFyIGRvTG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgbG9hZGluZyA9ICQuYWpheCh7XG5cdFx0XHRcdHVybCA6IHNldHRpbmdzLnN2Z0ZpbGUsXG5cdFx0XHRcdGRhdGFUeXBlIDogJ3RleHQnXG5cdFx0XHR9KTtcblxuXHRcdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2Vycm9yIGxvYWQnKTtcblx0XHRcdFx0Y29uc29sZS5sb2coYik7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coYS5yZXNwb25zZVRleHQpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHRcdH07XG5cblx0XHRcblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbihzKSB7XG5cdFx0XHRzZXR0aW5ncyA9IHM7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXG5cdFx0dGhpcy5sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZG9Mb2FkKCk7XG5cdFx0fTtcblx0XHRcblx0XHR0aGlzLmdldFN5bWJvbCA9IGZ1bmN0aW9uKGwpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbbF07XG5cdFx0fTtcblx0XHRcblx0XHR0aGlzLmdldE5TcGFjZSA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3ltYm9sc1snbiddLmdldFdpZHRoKCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0QWxsID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzeW1ib2xzO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHRBbHBoYWJldC5mYWN0b3J5ID0gZnVuY3Rpb24oaW5zdCl7XG5cdFx0cmV0dXJuIEFscGhhYmV0LmFwcGx5KGluc3QgfHwge30pO1xuXHR9O1xuXG5cdHJldHVybiBBbHBoYWJldDtcblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSwgcmVxdWlyZSgnZ3NhcCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290Ll8sIHJvb3QuUmFwaGFlbCwgKHJvb3QuR3JlZW5Tb2NrR2xvYmFscyB8fCByb290KSk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKF8sIFJhcGhhZWwsIFR3ZWVuTWF4KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vZ3NhcCBleHBvcnRzIFR3ZWVuTWF4XG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBkZWZhdWx0cyA9IHtcblx0XHRjb2xvcjogJyMwMDAwMDAnLFxuXHRcdHN0cm9rZVdpZHRoIDogMC42LFxuXHRcdHB4UGVyU2Vjb25kIDogMTAwLCAvL3NwZWVkIG9mIGRyYXdpbmdcblx0XHRlYXNpbmcgOiBnc2FwLlF1YWQuZWFzZUluXG5cdH07XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBzdGFnZSwgY29sb3IsIHNpemUpe1xuXHRcdHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdH07XG5cblx0dmFyIERyYXdQYXRoID0ge1xuXG5cdFx0c2luZ2xlIDogZnVuY3Rpb24ocGF0aCwgc3RhZ2UsIHBhcmFtcyl7XG5cblx0XHRcdHZhciBzZXR0aW5ncyA9IF8uZXh0ZW5kKHt9LCBkZWZhdWx0cywgcGFyYW1zKTtcblx0XHRcdHZhciBwYXRoU3RyID0gcGF0aC5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdHZhciBsZW5ndGggPSBwYXRoLmdldExlbmd0aCgpO1xuXG5cdFx0XHR2YXIgcHhQZXJTZWNvbmQgPSBzZXR0aW5ncy5weFBlclNlY29uZDtcblx0XHRcdHZhciB0aW1lID0gbGVuZ3RoIC8gcHhQZXJTZWNvbmQ7XG5cblx0XHRcdHZhciBhbmltID0ge3RvOiAwfTtcblx0XHRcdFxuXHRcdFx0dmFyIHVwZGF0ZSA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgZWw7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBhbmltLnRvKTtcblx0XHRcdFx0XHRpZihlbCkgZWwucmVtb3ZlKCk7XG5cdFx0XHRcdFx0ZWwgPSBzdGFnZS5wYXRoKHBhdGhQYXJ0KTtcblx0XHRcdFx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzZXR0aW5ncy5zdHJva2VXaWR0aCwgc3Ryb2tlOiBzZXR0aW5ncy5jb2xvcn0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSkoKTtcblxuXHRcdFx0dmFyIGVhc2VQb2ludHMgPSBwYXRoLmdldEVhc2Vwb2ludHMoKTtcblx0XHRcdC8qY29uc29sZS5sb2coZWFzZVBvaW50cy5sZW5ndGgpO1xuXHRcdFx0ZWFzZVBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHRcdHNob3dQb2ludChwLCBzdGFnZSwgJyNmZjAwMDAnLCAyKTtcblx0XHRcdH0pOy8qKi9cblx0XHRcdFxuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHRyZXR1cm4gZWFzZVBvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIHB4UGVyU2Vjb25kO1xuXHRcdFx0XHRsYXN0ID0gZGlzdDtcblx0XHRcdFx0cmV0dXJuIHRsLnRvKGFuaW0sIHRpbWUsIHt0bzogZGlzdCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe1xuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZVxuXHRcdFx0fSkpLnRvKGFuaW0sICgobGVuZ3RoIC0gKGVhc2VQb2ludHMubGVuZ3RoICYmIGVhc2VQb2ludHNbZWFzZVBvaW50cy5sZW5ndGgtMV0pKSAvIHB4UGVyU2Vjb25kKSwge3RvOiBsZW5ndGgsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdFxuXHRcdH0sXG5cblx0XHRncm91cCA6IGZ1bmN0aW9uKHBhdGhzLCBzdGFnZSwgc2V0dGluZ3MsIHRsKSB7XG5cdFx0XHRyZXR1cm4gcGF0aHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBwYXRoKXtcblx0XHRcdFx0cmV0dXJuIHRsLmFwcGVuZChEcmF3UGF0aC5zaW5nbGUocGF0aCwgc3RhZ2UsIHNldHRpbmdzKSk7XG5cdFx0XHR9LCB0bCB8fCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7cGF1c2VkOnRydWV9KSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIERyYXdQYXRoO1xuXHRcbn0pKTtcblxuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL29yaWdpbmFsIHNjYWxlIGZhY3RvclxuXHR2YXIgRW1pbGllRm9udCA9IHtcblx0XHRzY2FsZSA6IDEsXG5cdFx0c3ZnRmlsZSA6ICdhc3NldHMvZW1pbGllRm9udC5zdmcnLFxuXHRcdC8vUEFSU8OJIGF2ZWMgbGUgaGVscGVyXG5cdFx0ZWFzZXBvaW50cyA6IHtcIsOUXCI6W251bGwsWzE2XV0sXCLDj1wiOltbMTM2XV0sXCLDjlwiOltbOTNdLFsxNl1dLFwiw4tcIjpbWzE1OV1dLFwiw4pcIjpbWzE1OV0sWzE3XV0sXCLDiFwiOltbMTU5XV0sXCLDiVwiOltbMTU5XV0sXCLDh1wiOltudWxsLFsxM11dLFwiw4RcIjpbWzE4OV1dLFwiw4JcIjpbWzE4OV0sbnVsbCxbMTVdXSxcIsOAXCI6W1sxODldXSxcIlpcIjpbWzE5MywzNDBdXSxcIllcIjpbWzMyOV1dLFwiV1wiOltbMjI3LDMzNl1dLFwiVlwiOltbMjMxXV0sXCJVXCI6W1szMTddXSxcIlJcIjpbWzI4OV1dLFwiT1wiOltbMzAwXV0sXCJOXCI6W1syNDcsMzUwXV0sXCJNXCI6W1syMzgsMzM4LDQ1Ml1dLFwiTFwiOltbMjIwXV0sXCJLXCI6W1sxMTVdLFsxMjJdXSxcIkpcIjpbWzEzMl1dLFwiSFwiOltbMTQyXV0sXCJHXCI6W1szMjFdXSxcIkVcIjpbWzE1OV1dLFwiRFwiOltbMzcwXV0sXCJCXCI6W1s0NTNdXSxcIkFcIjpbWzE4OV1dLFwiw7RcIjpbWzE1NV0sWzE2XV0sXCLDtlwiOltbMTU1XV0sXCLDr1wiOltbNDJdXSxcIsOuXCI6W1s0Ml0sWzE2XV0sXCLDq1wiOltbNDBdXSxcIsOqXCI6W1s0MF0sWzE3XV0sXCLDqFwiOltbNDBdXSxcIsOpXCI6W1s0MF1dLFwiw6dcIjpbWzcyXSxbMTNdXSxcIsOkXCI6W1s1NSwxMzNdXSxcIsOiXCI6W1s1NSwxMzNdLFsxNV1dLFwiw6BcIjpbWzU1LDEzM11dLFwielwiOltbMTEwLDIxMF1dLFwieVwiOltbNDIsMTE2LDIyN11dLFwieFwiOltbNDJdXSxcIndcIjpbWzM4LDEwNywxNzddXSxcInZcIjpbWzY2XV0sXCJ1XCI6W1szMywxMDVdXSxcInRcIjpbWzEwM11dLFwic1wiOltbNTAsMTEwXV0sXCJyXCI6W1s2NF1dLFwicVwiOltbMTQ0LDMyNV1dLFwicFwiOltbNTYsMzA1XV0sXCJvXCI6W1sxNTVdXSxcIm5cIjpbWzEwNF1dLFwibVwiOltbMTEwXV0sXCJsXCI6W1sxMjNdXSxcImtcIjpbWzEyOSwyNDQsMzI3XV0sXCJqXCI6W1s1Ml1dLFwiaVwiOltbNDJdXSxcImhcIjpbWzEzMSwyNDgsMjkzXV0sXCJnXCI6W1s2MCwxNDVdXSxcImZcIjpbWzEzNCw0MTldXSxcImRcIjpbWzU3LDIzNF1dLFwiY1wiOltbNzJdXSxcImJcIjpbWzEyNiwyOTFdXSxcImFcIjpbWzU1LDEzM11dfVxuXHR9O1xuXG5cblx0cmV0dXJuIEVtaWxpZUZvbnQ7XG5cdFxufSkpOyIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByZWcgPSAvKFthLXpdKShbMC05XFxzXFwsXFwuXFwtXSspL2dpO1xuXHRcdFxuXHQvL2V4cGVjdGVkIGxlbmd0aCBvZiBlYWNoIHR5cGVcblx0dmFyIGV4cGVjdGVkTGVuZ3RocyA9IHtcblx0XHRtIDogMixcblx0XHRsIDogMixcblx0XHR2IDogMSxcblx0XHRoIDogMSxcblx0XHRjIDogNixcblx0XHRzIDogNFxuXHR9O1xuXG5cdHZhciBQYXRoID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdC8vaWYoc3ZnKSBjb25zb2xlLmxvZyhzdmcsIHBhcnNlZCk7XG5cdFx0dGhpcy5lYXNlUG9pbnRzID0gZWFzZVBvaW50cyB8fCBbXTtcblx0XHQvL2NvbnNvbGUubG9nKG5hbWUsIGVhc2VQb2ludHMpO1xuXHRcdHRoaXMuX3NldFBhcnNlZChwYXJzZWQgfHwgdGhpcy5fcGFyc2Uoc3ZnKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuX3NldFBhcnNlZCA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuXHRcdC8vY29uc29sZS5sb2cocGFyc2VkKTtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmN1YmljIHx8IHRoaXMuX3BhcnNlQ3ViaWMoKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLmdldFRvdGFsTGVuZ3RoKHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIGFuIFNWRyBzdHJpbmcgb2YgdGhlIHBhdGggc2VnZW1udHMuIEl0IGlzIG5vdCB0aGUgc3ZnIHByb3BlcnR5IG9mIHRoZSBwYXRoLCBhcyBpdCBpcyBwb3RlbnRpYWxseSB0cmFuc2Zvcm1lZFxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKHN2Zywgc2VnbWVudCl7XG5cdFx0XHRyZXR1cm4gc3ZnICsgc2VnbWVudC50eXBlICsgc2VnbWVudC5hbmNob3JzLmpvaW4oJywnKTsgXG5cdFx0fSwgJycpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIHRoZSBwb3NpdGlvbnMgYXQgd2hpY2ggd2UgaGF2ZSBlYXNlIHBvaW50cyAod2hpY2ggYXJlIHByZXBhcnNlZCBhbmQgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBwYXRoJ3MgZGVmaW5pdGlvbnMpXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLmdldEVhc2Vwb2ludHMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5lYXNlUG9pbnRzO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldFBvaW50ID0gZnVuY3Rpb24oaWR4KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzLnBhcnNlZCk7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkW2lkeF0gJiYgdGhpcy5wYXJzZWRbaWR4XS5hbmNob3JzO1xuXHR9O1xuXG5cdC8qKlxuXHRQYXJzZXMgYW4gU1ZHIHBhdGggc3RyaW5nIHRvIGEgbGlzdCBvZiBzZWdtZW50IGRlZmluaXRpb25zIHdpdGggQUJTT0xVVEUgcG9zaXRpb25zIHVzaW5nIFJhcGhhZWwucGF0aDJjdXJ2ZVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5fcGFyc2UgPSBmdW5jdGlvbihzdmcpIHtcblx0XHR2YXIgY3VydmUgPSBSYXBoYWVsLnBhdGgyY3VydmUoc3ZnKTtcblx0XHR2YXIgcGF0aCA9IGN1cnZlLm1hcChmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlIDogcG9pbnQuc2hpZnQoKSxcblx0XHRcdFx0YW5jaG9ycyA6IHBvaW50XG5cdFx0XHR9O1xuXHRcdH0pO1xuXHRcdHJldHVybiBwYXRoO1xuXHR9O1xuXG5cdC8qKlxuXHRcdFBhcnNlcyBhIHBhdGggZGVmaW5lZCBieSBwYXJzZVBhdGggdG8gYSBsaXN0IG9mIGJlemllciBwb2ludHMgdG8gYmUgdXNlZCBieSBHcmVlbnNvY2sgQmV6aWVyIHBsdWdpbiwgZm9yIGV4YW1wbGVcblx0XHRUd2Vlbk1heC50byhzcHJpdGUsIDUwMCwge1xuXHRcdFx0YmV6aWVyOnt0eXBlOlwiY3ViaWNcIiwgdmFsdWVzOmN1YmljfSxcblx0XHRcdGVhc2U6UXVhZC5lYXNlSW5PdXQsXG5cdFx0XHR1c2VGcmFtZXMgOiB0cnVlXG5cdFx0fSk7XG5cdFx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlQ3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhdGgpO1xuXHRcdC8vYXNzdW1lZCBmaXJzdCBlbGVtZW50IGlzIGEgbW92ZXRvXG5cdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmN1YmljID0gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKGFuY2hvcnMsIHNlZ21lbnQpe1xuXHRcdFx0dmFyIGEgPSBzZWdtZW50LmFuY2hvcnM7XG5cdFx0XHRpZihzZWdtZW50LnR5cGU9PT0nTScpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6YVsxXX0pO1xuXHRcdFx0fSBlbHNlIGlmKHNlZ21lbnQudHlwZT09PSdMJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzJdLCB5OiBhWzNdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVs0XSwgeTogYVs1XX0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0XHR9LCBbXSk7XG5cblx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHR9O1xuXG5cdC8vdHJvdXZlIGxlIGJvdW5kaW5nIGJveCBkJ3VuZSBsZXR0cmUgKGVuIHNlIGZpYW50IGp1c3RlIHN1ciBsZXMgcG9pbnRzLi4uIG9uIG5lIGNhbGN1bGUgcGFzIG91IHBhc3NlIGxlIHBhdGgpXG5cdFBhdGgucHJvdG90eXBlLmdldEJvdW5kaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJhcGhhZWwucGF0aEJCb3godGhpcy5nZXRTVkdTdHJpbmcoKSk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0udHJhbnNsYXRlKHgsIHkpO1xuXHRcdHZhciBzdmcgPSBSYXBoYWVsLm1hcFBhdGgodGhpcy5nZXRTVkdTdHJpbmcoKSwgbSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShzdmcsIHRoaXMubmFtZSwgbnVsbCwgdGhpcy5lYXNlUG9pbnRzKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgcGF0aCwgc2NhbGVkXG5cdFBhdGgucHJvdG90eXBlLnNjYWxlID0gUGF0aC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbihyYXRpbykge1xuXHRcdHJhdGlvID0gcmF0aW8gfHwgMTtcblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS5zY2FsZShyYXRpbyk7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHR2YXIgZWFzZVBvaW50cyA9IHRoaXMuZWFzZVBvaW50cy5tYXAoZnVuY3Rpb24oZXApe1xuXHRcdFx0cmV0dXJuIGVwICogcmF0aW87XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShzdmcsIHRoaXMubmFtZSwgbnVsbCwgZWFzZVBvaW50cyk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24ocGFydCwgbmFtZSnCoHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnQpO1xuXHRcdGlmKG5hbWUpIHRoaXMubmFtZSArPSBuYW1lO1xuXHRcdHRoaXMuX3NldFBhcnNlZCh0aGlzLnBhcnNlZC5jb25jYXQocGFydC5wYXJzZWQuc2xpY2UoMSkpKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hZGRFYXNlcG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5lYXNlUG9pbnRzLCBwb3MpO1xuXHRcdHRoaXMuZWFzZVBvaW50cy5wdXNoKHBvcyk7XG5cdH07XG5cblx0UGF0aC5mYWN0b3J5ID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHRyZXR1cm4gbmV3IFBhdGgoc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoO1xuXG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEVhc2Vwb2ludHMnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290Ll8sIHJvb3QuUmFwaGFlbCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIF8sIFJhcGhhZWwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIEdFVF9ERUZBVUxUUyA9IGZhbHNlO1xuXG5cdHZhciBkZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5cdHZhciByYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cdHZhciB0b1JhZGlhbnMgPSBmdW5jdGlvbihkZWdyZWVzKSB7XG5cdCAgcmV0dXJuIGRlZ3JlZXMgKiBkZWdUb1JhZDtcblx0fTtcdCBcblx0Ly8gQ29udmVydHMgZnJvbSByYWRpYW5zIHRvIGRlZ3JlZXMuXG5cdHZhciB0b0RlZ3JlZXMgPSBmdW5jdGlvbihyYWRpYW5zKSB7XG5cdCAgcmV0dXJuIHJhZGlhbnMgKiByYWRUb0RlZztcblx0fTtcblxuXG5cdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdHZhciBhbmdsZVRyZXNob2xkID0gdG9SYWRpYW5zKDEyKTtcblxuXHR2YXIgc3RhZ2U7XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0dmFyIGVsID0gc3RhZ2UuY2lyY2xlKHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMik7XG5cdFx0ZWwuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0dmFyIHNob3cgPSBmdW5jdGlvbihwYXRoRGVmKSB7XG5cdFx0dmFyIHBhdGggPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1x0XHRcdFxuXHRcdHZhciBlbCA9IHN0YWdlLnBhdGgocGF0aCk7XG5cdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogMywgc3Ryb2tlOiAnIzAwMDAwMCd9KTsvKiovXG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdHZhciBmaW5kRGVmYXVsdHMgPSBmdW5jdGlvbihwYXRoRGVmKXtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0dmFyIGxlbmd0aCA9IHBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0dmFyIHBvaW50UG9zID0gW107XG5cdFx0XG5cdFx0XG5cdFx0dmFyIHByZWNpc2lvbiA9IDE7XG5cdFx0dmFyIHByZXY7XG5cdFx0dmFyIGFsbFBvaW50cyA9IFtdO1xuXHRcdGZvcih2YXIgaT1wcmVjaXNpb247IGk8PWxlbmd0aDsgaSArPSBwcmVjaXNpb24pIHtcblx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0dmFyIHAgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgaSk7XG5cdFx0XHRcblx0XHRcdC8vaXQgc2VlbXMgdGhhdCBSYXBoYWVsJ3MgYWxwaGEgaXMgaW5jb25zaXN0ZW50Li4uIHNvbWV0aW1lcyBvdmVyIDM2MFxuXHRcdFx0dmFyIGFscGhhID0gTWF0aC5hYnMoIE1hdGguYXNpbiggTWF0aC5zaW4odG9SYWRpYW5zKHAuYWxwaGEpKSApKTtcblx0XHRcdGlmKHByZXYpIHtcblx0XHRcdFx0cC5kaWZmID0gTWF0aC5hYnMoYWxwaGEgLSBwcmV2KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHAuZGlmZiA9IDA7XG5cdFx0XHR9XG5cdFx0XHRwcmV2ID0gYWxwaGE7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHAuZGlmZik7XG5cblx0XHRcdGlmKHAuZGlmZiA+IGFuZ2xlVHJlc2hvbGQpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpKTtcblx0XHRcdFx0cG9pbnRQb3MucHVzaChpKTtcblx0XHRcdH1cblxuXHRcdFx0Ly9wLmNvbXB1dGVkQWxwaGEgPSBhbHBoYTtcblx0XHRcdC8vYWxsUG9pbnRzLnB1c2gocCk7XG5cblx0XHR9LyoqL1xuXG5cdFx0IC8qXG5cdFx0Ly9ERUJVRyBcblx0XHQvL2ZpbmQgbWF4IGN1cnZhdHVyZSB0aGF0IGlzIG5vdCBhIGN1c3AgKHRyZXNob2xkIGRldGVybWluZXMgY3VzcClcblx0XHR2YXIgY3VzcFRyZXNob2xkID0gNDA7XG5cdFx0dmFyIG1heCA9IGFsbFBvaW50cy5yZWR1Y2UoZnVuY3Rpb24obSwgcCl7XG5cdFx0XHRyZXR1cm4gcC5kaWZmID4gbSAmJiBwLmRpZmYgPCBjdXNwVHJlc2hvbGQgPyBwLmRpZmYgOiBtO1xuXHRcdH0sIDApO1xuXHRcdGNvbnNvbGUubG9nKG1heCk7XG5cblx0XHR2YXIgcHJldiA9IFswLDAsMCwwXTtcblx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdHZhciByID0gTWF0aC5yb3VuZCgocC5kaWZmIC8gbWF4KSAqIDI1NSk7XG5cdFx0XHR2YXIgZyA9IDI1NSAtIE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0dmFyIHJnYiA9ICdyZ2IoJytyKycsJytnKycsMCknO1xuXHRcdFx0aWYocj4xMDApIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJz09PT09PT09PT0nKTtcblx0XHRcdFx0cHJldi5mb3JFYWNoKGZ1bmN0aW9uKHApe2NvbnNvbGUubG9nKHAuY29tcHV0ZWRBbHBoYSwgcC5hbHBoYSk7fSk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHAuY29tcHV0ZWRBbHBoYSwgcC5hbHBoYSwgcmdiKTtcblx0XHRcdH1cblx0XHRcdHAueSArPSAxNTA7XG5cdFx0XHRzaG93UG9pbnQocCwgcmdiLCAwLjUpO1xuXHRcdFx0cHJldlszXSA9IHByZXZbMl07XG5cdFx0XHRwcmV2WzJdID0gcHJldlsxXTtcblx0XHRcdHByZXZbMV0gPSBwcmV2WzBdO1xuXHRcdFx0cHJldlswXSA9IHA7XG5cdFx0fSk7XG5cdFx0LyoqL1xuXG5cdFx0Ly9maW5kcyBncm91cHMgb2YgcG9pbnRzIGRlcGVuZGluZyBvbiB0cmVzaG9sZCwgYW5kIGZpbmQgdGhlIG1pZGRsZSBvZiBlYWNoIGdyb3VwXG5cdFx0cmV0dXJuIHBvaW50UG9zLnJlZHVjZShmdW5jdGlvbihwb2ludHMsIHBvaW50KXtcblxuXHRcdFx0dmFyIGxhc3QgPSBwb2ludHNbcG9pbnRzLmxlbmd0aC0xXTtcblx0XHRcdGlmKCFsYXN0IHx8IHBvaW50IC0gbGFzdFtsYXN0Lmxlbmd0aC0xXSA+IGRpc3RhbmNlVHJlc2hvbGQpe1xuXHRcdFx0XHRsYXN0ID0gW3BvaW50XTtcblx0XHRcdFx0cG9pbnRzLnB1c2gobGFzdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsYXN0LnB1c2gocG9pbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcG9pbnRzO1xuXHRcdH0sIFtdKS5tYXAoZnVuY3Rpb24ocG9pbnRzKXtcblx0XHRcdHJldHVybiBwb2ludHNbTWF0aC5mbG9vcihwb2ludHMubGVuZ3RoLzIpXTtcblx0XHR9KTtcblx0XHRcblx0fTtcblxuXHR2YXIgYWxsUG9pbnRzID0gW107XG5cdHZhciBlYXNlUG9pbnRzID0ge307XG5cblx0dmFyIGN1cnJlbnQ7XG5cblx0dmFyIGdldEVhc2Vwb2ludHMgPSBmdW5jdGlvbihsZXR0ZXIsIHBhdGhJZHgsIHBhdGhEZWYpe1xuXHRcdFxuXHRcdHZhciBwYXRoID0gc2hvdyhwYXRoRGVmKTtcblxuXHRcdC8vYXJlIGVhc2UgcG9pbnRzIGFscmVhZHkgc2V0IGZvciB0aGlzIHBhdGg/XG5cdFx0dmFyIHBhdGhFYXNlUG9pbnRzID0gcGF0aERlZi5nZXRFYXNlcG9pbnRzKCk7IFxuXHRcdGlmKHBhdGhFYXNlUG9pbnRzLmxlbmd0aCA9PT0gMCAmJiBHRVRfREVGQVVMVFMpIHtcblx0XHRcdHBhdGhFYXNlUG9pbnRzID0gZmluZERlZmF1bHRzKHBhdGhEZWYpO1xuXHRcdH1cblxuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdFxuXG5cdFx0dmFyIGluYWN0aXZlQ29sb3IgPSAnIzAwZmYwMCc7XG5cdFx0dmFyIGFjdGl2ZUNvbG9yID0gJyNmZjIyMDAnO1xuXG5cdFx0dmFyIGFkZFBvaW50ID0gZnVuY3Rpb24ocG9zKXtcblx0XHRcdHZhciBwT2JqID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHR2YXIgcG9pbnQgPSBzaG93UG9pbnQocE9iaiwgaW5hY3RpdmVDb2xvciwgMyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGhJZHgpO1xuXHRcdFx0cG9pbnQuZGF0YSgncG9zJywgcG9zKTtcblx0XHRcdHBvaW50LmRhdGEoJ2xldHRlcicsIGxldHRlcik7XG5cdFx0XHRwb2ludC5kYXRhKCdwYXRoSWR4JywgcGF0aElkeCk7XG5cdFx0XHRwb2ludC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRcdHBvaW50LmRhdGEoJ3knLCBwT2JqLnkpO1xuXG5cdFx0XHRhbGxQb2ludHMucHVzaChwb2ludCk7XG5cblx0XHRcdHBvaW50LmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFxuXHRcdFx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0XHRwLmF0dHIoe2ZpbGw6IGluYWN0aXZlQ29sb3J9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cG9pbnQuYXR0cih7ZmlsbDogYWN0aXZlQ29sb3J9KTtcblxuXHRcdFx0XHRjdXJyZW50ID0ge1xuXHRcdFx0XHRcdHBvaW50OiBwb2ludCxcblx0XHRcdFx0XHRwYXRoOiBwYXRoLFxuXHRcdFx0XHRcdHBhdGhEZWY6IHBhdGhEZWYsXG5cdFx0XHRcdFx0c3ZnIDogcGF0aFN0cixcblx0XHRcdFx0XHRsZXR0ZXIgOiBsZXR0ZXIsXG5cdFx0XHRcdFx0cGF0aElkeCA6IHBhdGhJZHhcblx0XHRcdFx0fTtcblxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHBhdGhFYXNlUG9pbnRzLmZvckVhY2goYWRkUG9pbnQpOy8qKi9cblxuXHRcdHBhdGguY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdC8vY29uc29sZS5sb2coJ2FkZCcpO1xuXHRcdFx0YWRkUG9pbnQoMCk7XG5cdFx0fSk7XG5cdFx0XG5cblx0XHRyZXR1cm4gcGF0aEVhc2VQb2ludHM7XG5cblx0fTtcblxuXHR2YXIgbW92ZUN1cnJlbnQgPSBmdW5jdGlvbihkaXN0KSB7XG5cdFx0dmFyIHAgPSBjdXJyZW50LnBvaW50O1xuXHRcdHZhciBwb3MgPSBwLmRhdGEoJ3BvcycpO1xuXHRcdHBvcyArPSBkaXN0O1xuXHRcdHZhciBtYXggPSBjdXJyZW50LnBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0aWYocG9zIDwgMCkgcG9zID0gMDtcblx0XHRpZihwb3MgPiBtYXgpIHBvcyA9IG1heDtcblx0XHRwLmRhdGEoJ3BvcycsIHBvcyk7XG5cblx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJyZW50LnN2ZywgcG9zKTtcblxuXHRcdHZhciB4ID0gcC5kYXRhKCd4Jyk7XG5cdFx0dmFyIHkgPSBwLmRhdGEoJ3knKTtcblx0XHR2YXIgZGVsdGFYID0gcE9iai54IC0geDtcblx0XHR2YXIgZGVsdGFZID0gcE9iai55IC0geTtcblxuXHRcdC8qcC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRwLmRhdGEoJ3knLCBwT2JqLnkpOy8qKi9cblxuXHRcdHAudHJhbnNmb3JtKCd0JyArIGRlbHRhWCArICcsJyArIGRlbHRhWSk7XG5cdFx0cHJpbnRKU09OKCk7XG5cblx0fTtcblxuXG5cdCQod2luZG93KS5vbigna2V5ZG93bi5lYXNlJywgZnVuY3Rpb24oZSl7XG5cdFx0Ly9jb25zb2xlLmxvZyhlLndoaWNoLCBjdXJyZW50KTtcblx0XHR2YXIgTEVGVCA9IDM3O1xuXHRcdHZhciBVUCA9IDM4O1xuXHRcdHZhciBSSUdIVCA9IDM5O1xuXHRcdHZhciBET1dOID0gNDA7XG5cdFx0dmFyIERFTCA9IDQ2O1xuXG5cdFx0aWYoY3VycmVudCkge1xuXHRcdFx0c3dpdGNoKGUud2hpY2gpIHtcblx0XHRcdFx0Y2FzZSBMRUZUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgRE9XTjpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoLTEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBSSUdIVDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgVVA6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KDEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBERUw6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHZhciBpZHggPSBhbGxQb2ludHMuaW5kZXhPZihjdXJyZW50LnBvaW50KTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGlkeCk7XG5cdFx0XHRcdFx0Y3VycmVudC5wb2ludC5yZW1vdmUoKTtcblx0XHRcdFx0XHRhbGxQb2ludHMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhbGxQb2ludHMpO1xuXHRcdFx0XHRcdGN1cnJlbnQgPSBudWxsO1xuXHRcdFx0XHRcdHByaW50SlNPTigpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSk7XG5cblx0dmFyIHByaW50Tm9kZTtcblx0dmFyIHByaW50SlNPTiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBqc29uID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihqc29uLCBwb2ludCl7XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBwb2ludC5kYXRhKCdsZXR0ZXInKTtcblx0XHRcdHZhciBwYXRoSWR4ID0gcG9pbnQuZGF0YSgncGF0aElkeCcpO1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBqc29uW2xldHRlcl0gPSBqc29uW2xldHRlcl0gfHwgW107XG5cdFx0XHR2YXIgZWFzZXBvaW50cyA9IHBhdGhzW3BhdGhJZHhdID0gcGF0aHNbcGF0aElkeF0gfHwgW107XG5cdFx0XHRlYXNlcG9pbnRzLnB1c2gocG9pbnQuZGF0YSgncG9zJykpO1xuXHRcdFx0ZWFzZXBvaW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpe1xuXHRcdFx0XHRyZXR1cm4gYSAtIGI7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBqc29uO1xuXHRcdH0sIHt9KTtcblx0XHRwcmludE5vZGUudGV4dChKU09OLnN0cmluZ2lmeShqc29uKSk7XG5cdH07XG5cblx0cmV0dXJuIGZ1bmN0aW9uKHMsIGdyb3Vwcywgbm9kZSwgZGltKXtcblx0XHRzdGFnZSA9IHM7XG5cdFx0dmFyIHBhZCA9IDIwO1xuXHRcdHZhciBhdmFpbFcgPSBkaW1bMF0gLSBwYWQ7XG5cblx0XHR2YXIgZ3JvdXBNYXhIZWlnaHQgPSBPYmplY3Qua2V5cyhncm91cHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIGdyb3VwTmFtZSl7XG5cdFx0XHR2YXIgdCA9IGdyb3Vwc1tncm91cE5hbWVdLmdldEhlaWdodCgpO1xuXHRcdFx0aWYobWluID09PSB1bmRlZmluZWQgfHwgdCA+IG1pbikge1xuXHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFxuXHRcdHZhciB0b3BMZWZ0ID0ge3g6cGFkLCB5OnBhZH07XG5cdFx0T2JqZWN0LmtleXMoZ3JvdXBzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpe1xuXHRcdFx0dmFyIGdyb3VwID0gZ3JvdXBzW25hbWVdO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhncm91cCk7XG5cdFx0XHR2YXIgZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cblx0XHRcdGlmKGVuZExlZnQgPiBhdmFpbFcpIHtcblx0XHRcdFx0dG9wTGVmdC54ID0gcGFkO1xuXHRcdFx0XHR0b3BMZWZ0LnkgKz0gcGFkICsgZ3JvdXBNYXhIZWlnaHQ7XG5cdFx0XHRcdGVuZExlZnQgPSB0b3BMZWZ0LnggKyBncm91cC5nZXRXaWR0aCgpICsgcGFkO1xuXHRcdFx0fVxuXG5cblx0XHRcdHZhciB0aGlzRWFzZSA9IGdyb3VwLnBhdGhzLm1hcChmdW5jdGlvbihwLCBpZHgpe1xuXHRcdFx0XHRwID0gcC50cmFuc2xhdGUodG9wTGVmdC54LCB0b3BMZWZ0LnkpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0RWFzZXBvaW50cyhuYW1lLCBpZHgsIHApO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dG9wTGVmdC54ID0gZW5kTGVmdDtcdFx0XHRcblxuXHRcdH0pO1xuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cblx0XHRwcmludE5vZGUgPSBub2RlO1xuXHRcdHByaW50SlNPTigpO1xuXHR9O1xuXG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgUGF0aEdyb3VwID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNldEJvdW5kaW5nID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXRocy5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHBhdGgpe1xuXHRcdFx0dmFyIHBhdGhCb3VuZGluZyA9IHBhdGguZ2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZy54ID0gYm91bmRpbmcueCA8IHBhdGhCb3VuZGluZy54ID8gYm91bmRpbmcueCA6ICBwYXRoQm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLnkgPSBib3VuZGluZy55IDwgcGF0aEJvdW5kaW5nLnkgPyBib3VuZGluZy55IDogIHBhdGhCb3VuZGluZy55O1xuXHRcdFx0Ym91bmRpbmcueDIgPSBib3VuZGluZy54MiA+IHBhdGhCb3VuZGluZy54MiA/IGJvdW5kaW5nLngyIDogcGF0aEJvdW5kaW5nLngyO1xuXHRcdFx0Ym91bmRpbmcueTIgPSBib3VuZGluZy55MiA+IHBhdGhCb3VuZGluZy55MiA/IGJvdW5kaW5nLnkyIDogcGF0aEJvdW5kaW5nLnkyO1xuXHRcdFx0Ym91bmRpbmcud2lkdGggPSBib3VuZGluZy54MiAtIGJvdW5kaW5nLng7XG5cdFx0XHRib3VuZGluZy5oZWlnaHQgPSBib3VuZGluZy55MiAtIGJvdW5kaW5nLnk7XG5cdFx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdFx0fSwgdW5kZWZpbmVkKSB8fCB7fTtcblx0XHQvL2lmIHRoZXJlJ3MgYSBlbmRQb2ludCBwb2ludCB0aGF0IGlzIHNldCwgdXNlIGl0cyBjb29yZGluYXRlcyBhcyBib3VuZGluZ1xuXHRcdGlmKHRoaXMuZW5kUG9pbnQpIHtcblx0XHRcdHZhciBhbmNob3JzID0gdGhpcy5lbmRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueDIgPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHRcdGlmKHRoaXMuc3RhcnRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLnN0YXJ0UG9pbnQuZ2V0UG9pbnQoMCk7XG5cdFx0XHR0aGlzLmJvdW5kaW5nLnggPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuYWRkUGF0aCA9IGZ1bmN0aW9uKHApe1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzIHx8IFtdO1xuXHRcdGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignZW5kJykgPT09IDApIHtcblx0XHRcdHRoaXMuZW5kUG9pbnQgPSBwO1xuXHRcdH0gZWxzZSBpZihwLm5hbWUgJiYgcC5uYW1lLmluZGV4T2YoJ3N0YXJ0JykgPT09IDApIHtcblx0XHRcdHRoaXMuc3RhcnRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy5oZWlnaHQ7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcud2lkdGg7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0Qm90dG9uID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy55Mjtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRUb3AgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnk7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0TGVmdCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRSaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDI7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbih4LCB5KXtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocy5tYXAoZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHBhdGggPSBwYXRoLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRyZXR1cm4gcGF0aDtcblx0XHR9KTtcblx0XHR0aGlzLmVuZFBvaW50ID0gKHRoaXMuZW5kUG9pbnQgJiYgdGhpcy5lbmRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnRyYW5zbGF0ZSh4LCB5KSk7XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBQYXRoR3JvdXAsIHNjYWxlZFxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuXHRcdGlmKCF0aGlzLnBhdGhzKSByZXR1cm4gdGhpcztcblx0XHR2YXIgc2NhbGVkID0gbmV3IFBhdGhHcm91cCh0aGlzLm5hbWUpO1xuXHRcdHRoaXMucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKXtcblx0XHRcdHNjYWxlZC5hZGRQYXRoKHBhdGguc2NhbGUoc2NhbGUpKTtcblx0XHR9KTtcblxuXHRcdHNjYWxlZC5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQuc2NhbGUoc2NhbGUpKTtcblx0XHRzY2FsZWQuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnNldEJvdW5kaW5nKCk7XG5cdFx0cmV0dXJuIHNjYWxlZDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFBhdGhzID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5wYXRocztcblx0fTtcblxuXHRyZXR1cm4gUGF0aEdyb3VwO1xuXG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnLi9QYXRoR3JvdXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXApO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChQYXRoR3JvdXApIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXG5cdFx0Z2V0UGF0aHMgOiBmdW5jdGlvbihhbHBoYWJldCwgdGV4dCkge1xuXHRcdFx0dmFyIHJpZ2h0ID0gMDtcblx0XHRcdHZhciBsaW5lcyA9IG5ldyBQYXRoR3JvdXAodGV4dCk7XG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXG5cdFx0XHQvL2xvb3AgZm9yIGV2ZXJ5IGNoYXJhY3RlciBpbiBuYW1lIChzdHJpbmcpXG5cdFx0XHRmb3IodmFyIGk9MDsgaTx0ZXh0Lmxlbmd0aDsgaSsrKcKge1xuXHRcdFx0XHR2YXIgbGV0dGVyID0gdGV4dFtpXTtcblx0XHRcdFx0aWYobGV0dGVyID09PSAnICcpIHtcblx0XHRcdFx0XHRyaWdodCArPSBhbHBoYWJldC5nZXROU3BhY2UoKTtcblx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGxldHRlckRlZiA9IGFscGhhYmV0LmdldFN5bWJvbChsZXR0ZXIpIHx8IGFscGhhYmV0LmdldFN5bWJvbCgnLScpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgbGV0dGVyRGVmKTtcblxuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGxldHRlckpvaW5lZEVuZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXR0ZXJEZWYucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHRcdFx0dmFyIGRlZiA9IHBhdGgudHJhbnNsYXRlKHJpZ2h0LCAwKTtcblx0XHRcdFx0XHR2YXIgam9pbmVkU3RhcnQgPSBkZWYubmFtZSAmJiBkZWYubmFtZS5pbmRleE9mKCdqb2luYScpID4gLTE7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZEVuZCA9IC9qb2luKGE/KWIvLnRlc3QoZGVmLm5hbWUpO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyLCBqb2luZWRTdGFydCwgam9pbmVkRW5kKTtcblx0XHRcdFx0XHRsZXR0ZXJKb2luZWRFbmQgPSBsZXR0ZXJKb2luZWRFbmQgfHwgam9pbmVkRW5kO1xuXHRcdFx0XHRcdGlmKGpvaW5lZFN0YXJ0ICYmIGNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vYXBwZW5kIGF1IGNvbnRpbnVvdXNcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYXBwZW5kKGRlZiwgbGV0dGVyKTtcblxuXHRcdFx0XHRcdFx0Ly9ham91dGUgbGVzIGVhc2Vwb2ludHMgZGUgY2UgcGF0aFxuXHRcdFx0XHRcdFx0dmFyIHBhdGhTdGFydFBvcyA9IGNvbnRpbnVvdXMuZ2V0TGVuZ3RoKCkgLSBkZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHRkZWYuZ2V0RWFzZXBvaW50cygpLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0XHRcdFx0Y29udGludW91cy5hZGRFYXNlcG9pbnQocGF0aFN0YXJ0UG9zICsgcG9zKTtcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmKGpvaW5lZEVuZCAmJiAhY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9zdGFydCB1biBub3V2ZWF1IGxpbmUgKGNsb25lIGVuIHNjYWxhbnQgZGUgMSlcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBkZWYuY2xvbmUoKTtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMubmFtZSA9IGxldHRlcjtcblx0XHRcdFx0XHRcdGxpbmVzLmFkZFBhdGgoY29udGludW91cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxpbmVzLmFkZFBhdGgoZGVmKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZighbGV0dGVySm9pbmVkRW5kKSB7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0cmlnaHQgKz0gbGV0dGVyRGVmLmdldFdpZHRoKCk7XG5cdFx0XHRcdC8vY29uc29sZS50YWJsZShbe2xldHRlcjpuYW1lW2ldLCBsZXR0ZXJXaWR0aDogbGV0dGVyLmdldFdpZHRoKCksIHRvdGFsOnJpZ2h0fV0pO1x0XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbGluZXM7XG5cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFZlY3RvcldvcmQ7XG5cdFxufSkpO1xuXG5cbiJdfQ==
