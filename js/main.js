(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var DrawPath = require('lagrange/drawing/DrawPath.js');
	var VectorWord = require('lagrange/drawing/VectorWord.js');
	var Alphabet = require('lagrange/drawing/Alphabet.js');

	var EmilieFont = require('lagrange/drawing/EmilieFont.js');



	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1200;
	var H = 1600;

	var scaleFactor = 1;

	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	function Shuffle(o) {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	Shuffle(names);
	names.length = 1;/**/

	//names = ['aksttef'];


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
		var incr = H / names.length;
		names.forEach(function(name, k){
			//traceName(name, 0, k * incr);

			var paths = VectorWord.getPaths(name, 0, k * incr, scaleFactor);
			var start = new Date();
			DrawPath.group(paths, getStage(), {
				pxPerSecond : 200,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeInOut
			});

			var end = new Date();
			console.log(end-start);

		});

	};

	var loading = Alphabet.init(EmilieFont);	
	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		loading.then(doDraw);
	});


	//parse les breakpoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		Alphabet.parseEasepoints(getStage(), $('#brp'), [W, H]);
	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		loading.then(printEasepoints);
	});


},{"gsap":"gsap","jquery":"jquery","lagrange/drawing/Alphabet.js":2,"lagrange/drawing/DrawPath.js":3,"lagrange/drawing/EmilieFont.js":4,"lagrange/drawing/VectorWord.js":8,"raphael":"raphael"}],2:[function(require,module,exports){
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/Alphabet'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('jquery'), require('lagrange/drawing/Path.js'), require('lagrange/drawing/PathGroup.js'), require('lagrange/drawing/PathEasepoints.js'));
  	} else {
		ns[name] = factory(root.jQuery, root.lagrange.drawing.Path, root.lagrange.drawing.PathGroup, root.lagrange.drawing.PathEasepoints);
	}
}(this, function ($, Path, PathGroup, PathEasepoints) {
	"use strict";

	var settings;

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
				var p = Path.factory( pathEl.attr('d'), pathEl.attr('id'), null, settings.easepoints[id] && settings.easepoints[id][i]).scale(settings.scale || 1);				
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

	

	var Alphabet = {
		init : function(fontSettings) {
			settings = fontSettings;
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



},{"jquery":"jquery","lagrange/drawing/Path.js":5,"lagrange/drawing/PathEasepoints.js":6,"lagrange/drawing/PathGroup.js":7}],3:[function(require,module,exports){
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
			/*console.log(easePoints);
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

		group : function(paths, stage, settings, onComplete) {
			return paths.reduce(function(tl, path){
				return tl.append(DrawPath.single(path, stage, settings));
			}, new gsap.TimelineMax({ onComplete: (onComplete || function(){}) }));
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
		easepoints : {"Ö":[[5],[5]],"Ô":[null,[16]],"Ï":[[136],[5],[5]],"Î":[[93],[16]],"Ë":[[159],[5],[5]],"Ê":[[159],[17]],"È":[[159]],"É":[[159]],"Ç":[null,[13]],"Ä":[[189],null,[5],[5]],"Â":[[189],null,[15]],"À":[[189]],"Z":[[193,340]],"Y":[[329]],"W":[[227,336]],"V":[[231]],"U":[[317]],"R":[[289]],"N":[[247,350]],"M":[[238,338,452]],"K":[[115],[122]],"J":[[132]],"I":[[93]],"H":[[142]],"G":[[321]],"E":[[159]],"B":[[453]],"A":[[189]],"ô":[[155],[16]],"ö":[[155],[5],[5]],"ï":[[42],[5],[5]],"î":[[42],[16]],"ë":[null,[5],[5]],"ê":[null,[17]],"ç":[[72],[13]],"ä":[[55,133],[5],[5]],"â":[[55,133],[15]],"à":[[55,133]],"z":[[110]],"y":[[42,116,227]],"x":[[42]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[24]],"k":[[131,244,327]],"j":[[52],[18]],"i":[[42],[18]],"h":[[133,248,293]],"g":[[60,145]],"f":[[419]],"d":[[236]],"c":[[72]],"b":[[291]],"a":[[55,133]],"O":[[300]],"L":[[220]],"F":[[220]],"D":[[370]]}
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
	Path.prototype.scale = function(ratio) {
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
		if(pathEasePoints.length === 0) {
			pathEasePoints = findDefaults(pathDef);
		}

		//console.log(easePoints);
		var pathStr = pathDef.getSVGString();
		

		var inactiveColor = '#00ff00';
		var activeColor = '#ff2200';

		var addPoint = function(pos){
			var pObj = Raphael.getPointAtLength(pathStr, pos);
			var point = showPoint(pObj, inactiveColor, 3);

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
			console.log('add');
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
				case UP:
					e.preventDefault();
					moveCurrent(-10);
					break;
				case RIGHT:
					e.preventDefault();
					moveCurrent(1);
					break;
				case DOWN:
					e.preventDefault();
					moveCurrent(10);
					break;
				case DEL:
					e.preventDefault();
					var idx = allPoints.indexOf(current.point);
					current.point.remove();
					allPoints.splice(idx, 1);
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
	    module.exports = factory(require('lagrange/drawing/Alphabet.js'));
  	} else {
		ns[name] = factory(lagrange.drawing.Alphabet);
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



},{"lagrange/drawing/Alphabet.js":2}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0XG5cdHZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XG5cdHZhciBSYXBoYWVsID0gcmVxdWlyZSgncmFwaGFlbCcpO1xuXHR2YXIgRHJhd1BhdGggPSByZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL0RyYXdQYXRoLmpzJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnbGFncmFuZ2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzJyk7XG5cdHZhciBBbHBoYWJldCA9IHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvQWxwaGFiZXQuanMnKTtcblxuXHR2YXIgRW1pbGllRm9udCA9IHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udC5qcycpO1xuXG5cblxuXHR2YXIgVHdlZW5NYXggPSByZXF1aXJlKCdnc2FwJyk7XG5cblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIFcgPSAxMjAwO1xuXHR2YXIgSCA9IDE2MDA7XG5cblx0dmFyIHNjYWxlRmFjdG9yID0gMTtcblxuXHR2YXIgbmFtZXMgPSBbXCJKZXNzaWNhIFdhbm5pbmdcIixcIkp1bGlhIFJvY2t3ZWxsXCIsXCJDYXJvbCBIdWJiYXJkXCIsXCJSb25hbGQgQ2FuZHlcIixcIkpvaG4gTmV3dG9uXCIsXCJFbHZpcyBOaWNvbGVcIixcIkdsb3JpYSBXZWF2ZXJcIixcIkp1bGlhIENyb25raXRlXCIsXCJNb3RoZXIgUm9nZXJzXCIsXCJDaGV2eSBJcndpblwiLFwiRWRkaWUgQWxsZW5cIixcIk5vcm1hbiBKYWNrc29uXCIsXCJQZXRlciBSb2dlcnNcIixcIldlaXJkIENoYXNlXCIsXCJDb2xpbiBNYXlzXCIsXCJOYXBvbGVvbiBNYXJ0aW5cIixcIkVkZ2FyIFNpbXBzb25cIixcIk1vaGFtbWFkIE1jQ2FydG5leVwiLFwiTGliZXJhY2UgV2lsbGlhbXNcIixcIkZpZWxkcyBCdXJuZXR0XCIsXCJTdGV2ZSBBc2hlXCIsXCJDYXJyaWUgQ2hhcmxlc1wiLFwiVG9tbXkgUGFzdGV1clwiLFwiRWRkaWUgU2lsdmVyc3RvbmVcIixcIk9wcmFoIEFzaGVcIixcIlJheSBCYWxsXCIsXCJKaW0gRGlhbmFcIixcIk1pY2hlbGFuZ2VsbyBFYXN0d29vZFwiLFwiR2VvcmdlIFNpbXBzb25cIixcIkFsaWNpYSBBdXN0ZW5cIixcIkplc3NpY2EgTmljb2xlXCIsXCJNYXJpbHluIEV2ZXJldHRcIixcIktlaXRoIEVhc3R3b29kXCIsXCJQYWJsbyBFYXN0d29vZFwiLFwiUGV5dG9uIEx1dGhlclwiLFwiTW96YXJ0IEFybXN0cm9uZ1wiLFwiTWljaGFlbCBCdXJuZXR0XCIsXCJLZWl0aCBHbG92ZXJcIixcIkVsaXphYmV0aCBDaGlsZFwiLFwiTWlsZXMgQXN0YWlyZVwiLFwiQW5keSBFZGlzb25cIixcIk1hcnRpbiBMZW5ub25cIixcIlRvbSBQaWNjYXNvXCIsXCJCZXlvbmNlIERpc25leVwiLFwiUGV0ZXIgQ2xpbnRvblwiLFwiSGVucnkgS2VubmVkeVwiLFwiUGF1bCBDaGlsZFwiLFwiTGV3aXMgU2FnYW5cIixcIk1pY2hlbGFuZ2VsbyBMZWVcIixcIk1hcmlseW4gRmlzaGVyXCJdO1xuXHRmdW5jdGlvbiBTaHVmZmxlKG8pIHtcblx0XHRmb3IodmFyIGosIHgsIGkgPSBvLmxlbmd0aDsgaTsgaiA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiBpKSwgeCA9IG9bLS1pXSwgb1tpXSA9IG9bal0sIG9bal0gPSB4KTtcblx0XHRyZXR1cm4gbztcblx0fTtcblx0U2h1ZmZsZShuYW1lcyk7XG5cdG5hbWVzLmxlbmd0aCA9IDE7LyoqL1xuXG5cdC8vbmFtZXMgPSBbJ2Frc3R0ZWYnXTtcblxuXG5cdHZhciBnZXRTdGFnZSA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBzdGFnZTtcblx0XHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gUmFwaGFlbChcInN2Z1wiLCBXLCBIKTtcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN0YWdlID0gc3RhZ2UgfHwgaW5pdCgpO1xuXHRcdH1cblx0fSkoKTtcblxuXHR2YXIgZG9EcmF3ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgaW5jciA9IEggLyBuYW1lcy5sZW5ndGg7XG5cdFx0bmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBrKXtcblx0XHRcdC8vdHJhY2VOYW1lKG5hbWUsIDAsIGsgKiBpbmNyKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gVmVjdG9yV29yZC5nZXRQYXRocyhuYW1lLCAwLCBrICogaW5jciwgc2NhbGVGYWN0b3IpO1xuXHRcdFx0dmFyIHN0YXJ0ID0gbmV3IERhdGUoKTtcblx0XHRcdERyYXdQYXRoLmdyb3VwKHBhdGhzLCBnZXRTdGFnZSgpLCB7XG5cdFx0XHRcdHB4UGVyU2Vjb25kIDogMjAwLFxuXHRcdFx0XHRjb2xvciA6ICcjNDQ0NDQ0Jyxcblx0XHRcdFx0c3Ryb2tlV2lkdGggOiAyLFxuXHRcdFx0XHRlYXNpbmcgOiBnc2FwLlNpbmUuZWFzZUluT3V0XG5cdFx0XHR9KTtcblxuXHRcdFx0dmFyIGVuZCA9IG5ldyBEYXRlKCk7XG5cdFx0XHRjb25zb2xlLmxvZyhlbmQtc3RhcnQpO1xuXG5cdFx0fSk7XG5cblx0fTtcblxuXHR2YXIgbG9hZGluZyA9IEFscGhhYmV0LmluaXQoRW1pbGllRm9udCk7XHRcblx0dmFyIGJ0biA9ICQoJyNjdHJsJyk7XG5cblx0YnRuLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG5cblx0Ly9wYXJzZSBsZXMgYnJlYWtwb2ludHMgZGUgY2hhcXVlIGxldHRyZSwgb3V0cHV0IGVuIEpTT04gKMOgIHNhdmVyKVxuXHR2YXIgcHJpbnRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKXtcblx0XHRBbHBoYWJldC5wYXJzZUVhc2Vwb2ludHMoZ2V0U3RhZ2UoKSwgJCgnI2JycCcpLCBbVywgSF0pO1xuXHR9O1xuXG5cdHZhciBnZXRCcHIgPSAkKCcjZ2V0YnJwJyk7XG5cblx0Z2V0QnByLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKHByaW50RWFzZXBvaW50cyk7XG5cdH0pO1xuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9BbHBoYWJldCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcycpLCByZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cC5qcycpLCByZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aCwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGhHcm91cCwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGhFYXNlcG9pbnRzKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoJCwgUGF0aCwgUGF0aEdyb3VwLCBQYXRoRWFzZXBvaW50cykge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgc2V0dGluZ3M7XG5cblx0dmFyIGxldHRlcnMgPSB7fTtcblxuXHR2YXIgcGFyc2VTVkcgPSBmdW5jdGlvbihkYXRhKXtcblxuXHRcdC8vY29uc29sZS5sb2coZGF0YSk7XG5cdFx0dmFyIGRvYyA9ICQoZGF0YSk7XG5cdFx0dmFyIGxheWVycyA9IGRvYy5maW5kKCdnJyk7XG5cdFx0bGF5ZXJzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0dmFyIGxheWVyID0gJChlbCk7XG5cdFx0XHR2YXIgaWQgPSBsYXllci5hdHRyKCdpZCcpO1xuXG5cdFx0XHRpZihpZCA9PSAnX3gyRF8nKSB7XG5cdFx0XHRcdGlkID0gJy0nO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZihpZC5sZW5ndGggPiAxKSByZXR1cm47XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBsZXR0ZXJzW2lkXSA9IG5ldyBQYXRoR3JvdXAoaWQpO1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBsYXllci5maW5kKCdwYXRoJyk7XG5cdFx0XHQvL2lmKHBhdGhzLmxlbmd0aD09MCkgY29uc29sZS5sb2cobGF5ZXIpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhpZCk7XG5cdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIHBhdGhFbCA9ICQoZWwpO1xuXHRcdFx0XHR2YXIgcCA9IFBhdGguZmFjdG9yeSggcGF0aEVsLmF0dHIoJ2QnKSwgcGF0aEVsLmF0dHIoJ2lkJyksIG51bGwsIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdICYmIHNldHRpbmdzLmVhc2Vwb2ludHNbaWRdW2ldKS5zY2FsZShzZXR0aW5ncy5zY2FsZSB8fCAxKTtcdFx0XHRcdFxuXHRcdFx0XHRsZXR0ZXIuYWRkUGF0aCggcCApO1xuXHRcdFx0fSk7XG5cblx0XHR9KTtcblxuXHRcdC8vY29uc29sZS5sb2coYm91bmRpbmdzKTtcblx0XHQvL3Ryb3V2ZSBsZSB0b3AgYWJzb2x1ICh0b3AgZGUgbGEgbGV0dHJlIGxhIHBsdXMgaGF1dGUpXG5cdFx0dmFyIHRvcCA9IE9iamVjdC5rZXlzKGxldHRlcnMpLnJlZHVjZShmdW5jdGlvbihtaW4sIGxldHRlck5hbWUpe1xuXHRcdFx0dmFyIHQgPSBsZXR0ZXJzW2xldHRlck5hbWVdLmdldFRvcCgpO1xuXHRcdFx0aWYobWluID09PSB1bmRlZmluZWQgfHwgbWluID4gdCkge1xuXHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdC8vY29uc29sZS5sb2codG9wKTtcblx0XHQvL2NvbnNvbGUubG9nKGxldHRlcnMpO1xuXG5cdFx0Ly9hanVzdGUgbGUgYmFzZWxpbmUgZGUgY2hhcXVlIGxldHRyZVxuXHRcdE9iamVjdC5rZXlzKGxldHRlcnMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRsZXR0ZXJzW2tleV0uc2V0T2Zmc2V0KC0xICogbGV0dGVyc1trZXldLmdldExlZnQoKSwgLTEgKiB0b3ApO1xuXHRcdH0pO1xuXG5cblx0fTtcblxuXHR2YXIgZG9Mb2FkID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgbG9hZGluZyA9ICQuYWpheCh7XG5cdFx0XHR1cmwgOiBzZXR0aW5ncy5zdmdGaWxlLFxuXHRcdFx0ZGF0YVR5cGUgOiAndGV4dCdcblx0XHR9KTtcblxuXHRcdGxvYWRpbmcudGhlbihwYXJzZVNWRywgZnVuY3Rpb24oYSwgYiwgYyl7XG5cdFx0XHRjb25zb2xlLmxvZygnZXJyb3IgbG9hZCcpO1xuXHRcdFx0Y29uc29sZS5sb2coYik7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGMpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhhLnJlc3BvbnNlVGV4dCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gbG9hZGluZy5wcm9taXNlKCk7XG5cblx0fTtcblxuXHRcblxuXHR2YXIgQWxwaGFiZXQgPSB7XG5cdFx0aW5pdCA6IGZ1bmN0aW9uKGZvbnRTZXR0aW5ncykge1xuXHRcdFx0c2V0dGluZ3MgPSBmb250U2V0dGluZ3M7XG5cdFx0XHRyZXR1cm4gZG9Mb2FkKCk7XG5cdFx0fSxcblx0XHRnZXRMZXR0ZXIgOiBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzW2xdO1xuXHRcdH0sXG5cdFx0Z2V0TlNwYWNlIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9LFxuXHRcdC8vc2V0dXAgZGVzIGJyZWFrcG9pbnRzIChwb2ludHMgb8O5IG9uIGZhaXQgdW4gZWFzaW5nKSBkZSBjaGFjdW5lIGRlcyBsZXR0cmVzLiBTZXJhIG91dHB1dHTDqSBldCBzYXbDqSBlbiBKU09OLCBwb3VyIMOqdHJlIGxvYWTDqSBlbiBtw6ptZSB0ZW1wcyBxdWUgbCdhbHBoYWJldC4gTGUgcGFyc2UgZW4gcmVhbHRpbWUgZXN0IHRyb3AgbGVudCwgZG9uYyBjZXR0ZSBmb25jdGlvbiBkb2l0IGV0cmUgY2FsbMOpZSBwb3VyIHJlZmFpcmUgbGVzIGJyZWFrcG9pbnRzIGNoYXF1ZSBmb2lzIHF1ZSBsZSBTVkcgY2hhbmdlLlxuXHRcdHBhcnNlRWFzZXBvaW50cyA6IGZ1bmN0aW9uKHN0YWdlLCBub2RlLCBkaW0pe1xuXG5cdFx0XHRQYXRoRWFzZXBvaW50cyhzdGFnZSwgbGV0dGVycywgbm9kZSwgZGltKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9EcmF3UGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpLCByZXF1aXJlKCdnc2FwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuXywgcm9vdC5SYXBoYWVsLCAocm9vdC5HcmVlblNvY2tHbG9iYWxzIHx8IHJvb3QpKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoXywgUmFwaGFlbCwgVHdlZW5NYXgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9nc2FwIGV4cG9ydHMgVHdlZW5NYXhcblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdGNvbG9yOiAnIzAwMDAwMCcsXG5cdFx0c3Ryb2tlV2lkdGggOiAwLjYsXG5cdFx0cHhQZXJTZWNvbmQgOiAxMDAsIC8vc3BlZWQgb2YgZHJhd2luZ1xuXHRcdGVhc2luZyA6IGdzYXAuUXVhZC5lYXNlSW5cblx0fTtcblxuXHQvL2hlbHBlclxuXHR2YXIgc2hvd1BvaW50ID0gZnVuY3Rpb24ocG9pbnQsIHN0YWdlLCBjb2xvciwgc2l6ZSl7XG5cdFx0c3RhZ2UuY2lyY2xlKHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMikuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0fTtcblxuXHR2YXIgRHJhd1BhdGggPSB7XG5cblx0XHRzaW5nbGUgOiBmdW5jdGlvbihwYXRoLCBzdGFnZSwgcGFyYW1zKXtcblxuXHRcdFx0dmFyIHNldHRpbmdzID0gXy5leHRlbmQoe30sIGRlZmF1bHRzLCBwYXJhbXMpO1xuXHRcdFx0dmFyIHBhdGhTdHIgPSBwYXRoLmdldFNWR1N0cmluZygpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IHBhdGguZ2V0TGVuZ3RoKCk7XG5cdFx0XHR2YXIgcHhQZXJTZWNvbmQgPSBzZXR0aW5ncy5weFBlclNlY29uZDtcblx0XHRcdHZhciB0aW1lID0gbGVuZ3RoIC8gcHhQZXJTZWNvbmQ7XG5cblx0XHRcdHZhciBhbmltID0ge3RvOiAwfTtcblx0XHRcdFxuXHRcdFx0dmFyIHVwZGF0ZSA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgZWw7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBhbmltLnRvKTtcblx0XHRcdFx0XHRpZihlbCkgZWwucmVtb3ZlKCk7XG5cdFx0XHRcdFx0ZWwgPSBzdGFnZS5wYXRoKHBhdGhQYXJ0KTtcblx0XHRcdFx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzZXR0aW5ncy5zdHJva2VXaWR0aCwgc3Ryb2tlOiBzZXR0aW5ncy5jb2xvcn0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSkoKTtcblxuXHRcdFx0dmFyIGVhc2VQb2ludHMgPSBwYXRoLmdldEVhc2Vwb2ludHMoKTtcblx0XHRcdC8qY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cdFx0XHRlYXNlUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0dmFyIHAgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcG9zKTtcblx0XHRcdFx0c2hvd1BvaW50KHAsIHN0YWdlLCAnI2ZmMDAwMCcsIDIpO1xuXHRcdFx0fSk7LyoqL1xuXHRcdFx0XG5cblx0XHRcdHZhciBsYXN0ID0gMDtcblx0XHRcdHJldHVybiBlYXNlUG9pbnRzLnJlZHVjZShmdW5jdGlvbih0bCwgZGlzdCkge1xuXHRcdFx0XHR2YXIgdGltZSA9IChkaXN0LWxhc3QpIC8gcHhQZXJTZWNvbmQ7XG5cdFx0XHRcdGxhc3QgPSBkaXN0O1xuXHRcdFx0XHRyZXR1cm4gdGwudG8oYW5pbSwgdGltZSwge3RvOiBkaXN0LCBlYXNlIDogc2V0dGluZ3MuZWFzaW5nfSk7XG5cdFx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7XG5cdFx0XHRcdG9uVXBkYXRlIDogdXBkYXRlXG5cdFx0XHR9KSkudG8oYW5pbSwgKChsZW5ndGggLSAoZWFzZVBvaW50cy5sZW5ndGggJiYgZWFzZVBvaW50c1tlYXNlUG9pbnRzLmxlbmd0aC0xXSkpIC8gcHhQZXJTZWNvbmQpLCB7dG86IGxlbmd0aCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0XG5cdFx0fSxcblxuXHRcdGdyb3VwIDogZnVuY3Rpb24ocGF0aHMsIHN0YWdlLCBzZXR0aW5ncywgb25Db21wbGV0ZSkge1xuXHRcdFx0cmV0dXJuIHBhdGhzLnJlZHVjZShmdW5jdGlvbih0bCwgcGF0aCl7XG5cdFx0XHRcdHJldHVybiB0bC5hcHBlbmQoRHJhd1BhdGguc2luZ2xlKHBhdGgsIHN0YWdlLCBzZXR0aW5ncykpO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoeyBvbkNvbXBsZXRlOiAob25Db21wbGV0ZSB8fCBmdW5jdGlvbigpe30pIH0pKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gRHJhd1BhdGg7XG5cdFxufSkpO1xuXG5cbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL0VtaWxpZUZvbnQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBFbWlsaWVGb250ID0ge1xuXHRcdHNjYWxlIDogMSxcblx0XHRzdmdGaWxlIDogJ2Fzc2V0cy9lbWlsaWVGb250LnN2ZycsXG5cdFx0Ly9QQVJTw4kgYXZlYyBsZSBoZWxwZXJcblx0XHRlYXNlcG9pbnRzIDoge1wiw5ZcIjpbWzVdLFs1XV0sXCLDlFwiOltudWxsLFsxNl1dLFwiw49cIjpbWzEzNl0sWzVdLFs1XV0sXCLDjlwiOltbOTNdLFsxNl1dLFwiw4tcIjpbWzE1OV0sWzVdLFs1XV0sXCLDilwiOltbMTU5XSxbMTddXSxcIsOIXCI6W1sxNTldXSxcIsOJXCI6W1sxNTldXSxcIsOHXCI6W251bGwsWzEzXV0sXCLDhFwiOltbMTg5XSxudWxsLFs1XSxbNV1dLFwiw4JcIjpbWzE4OV0sbnVsbCxbMTVdXSxcIsOAXCI6W1sxODldXSxcIlpcIjpbWzE5MywzNDBdXSxcIllcIjpbWzMyOV1dLFwiV1wiOltbMjI3LDMzNl1dLFwiVlwiOltbMjMxXV0sXCJVXCI6W1szMTddXSxcIlJcIjpbWzI4OV1dLFwiTlwiOltbMjQ3LDM1MF1dLFwiTVwiOltbMjM4LDMzOCw0NTJdXSxcIktcIjpbWzExNV0sWzEyMl1dLFwiSlwiOltbMTMyXV0sXCJJXCI6W1s5M11dLFwiSFwiOltbMTQyXV0sXCJHXCI6W1szMjFdXSxcIkVcIjpbWzE1OV1dLFwiQlwiOltbNDUzXV0sXCJBXCI6W1sxODldXSxcIsO0XCI6W1sxNTVdLFsxNl1dLFwiw7ZcIjpbWzE1NV0sWzVdLFs1XV0sXCLDr1wiOltbNDJdLFs1XSxbNV1dLFwiw65cIjpbWzQyXSxbMTZdXSxcIsOrXCI6W251bGwsWzVdLFs1XV0sXCLDqlwiOltudWxsLFsxN11dLFwiw6dcIjpbWzcyXSxbMTNdXSxcIsOkXCI6W1s1NSwxMzNdLFs1XSxbNV1dLFwiw6JcIjpbWzU1LDEzM10sWzE1XV0sXCLDoFwiOltbNTUsMTMzXV0sXCJ6XCI6W1sxMTBdXSxcInlcIjpbWzQyLDExNiwyMjddXSxcInhcIjpbWzQyXV0sXCJ3XCI6W1szOCwxMDcsMTc3XV0sXCJ2XCI6W1s2Nl1dLFwidVwiOltbMzMsMTA1XV0sXCJ0XCI6W1sxMDNdXSxcInNcIjpbWzUwLDExMF1dLFwiclwiOltbNjRdXSxcInFcIjpbWzE0NCwzMjVdXSxcInBcIjpbWzU2LDMwNV1dLFwib1wiOltbMTU1XV0sXCJuXCI6W1sxMDRdXSxcIm1cIjpbWzExMF1dLFwibFwiOltbMjRdXSxcImtcIjpbWzEzMSwyNDQsMzI3XV0sXCJqXCI6W1s1Ml0sWzE4XV0sXCJpXCI6W1s0Ml0sWzE4XV0sXCJoXCI6W1sxMzMsMjQ4LDI5M11dLFwiZ1wiOltbNjAsMTQ1XV0sXCJmXCI6W1s0MTldXSxcImRcIjpbWzIzNl1dLFwiY1wiOltbNzJdXSxcImJcIjpbWzI5MV1dLFwiYVwiOltbNTUsMTMzXV0sXCJPXCI6W1szMDBdXSxcIkxcIjpbWzIyMF1dLFwiRlwiOltbMjIwXV0sXCJEXCI6W1szNzBdXX1cblx0fTtcblxuXG5cdHJldHVybiBFbWlsaWVGb250O1xuXHRcbn0pKTsiLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcmVnID0gLyhbYS16XSkoWzAtOVxcc1xcLFxcLlxcLV0rKS9naTtcblx0XHRcblx0Ly9leHBlY3RlZCBsZW5ndGggb2YgZWFjaCB0eXBlXG5cdHZhciBleHBlY3RlZExlbmd0aHMgPSB7XG5cdFx0bSA6IDIsXG5cdFx0bCA6IDIsXG5cdFx0diA6IDEsXG5cdFx0aCA6IDEsXG5cdFx0YyA6IDYsXG5cdFx0cyA6IDRcblx0fTtcblxuXHR2YXIgUGF0aCA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKSB7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHQvL2lmKHN2ZykgY29uc29sZS5sb2coc3ZnLCBwYXJzZWQpO1xuXHRcdHRoaXMuZWFzZVBvaW50cyA9IGVhc2VQb2ludHMgfHwgW107XG5cdFx0Ly9jb25zb2xlLmxvZyhuYW1lLCBlYXNlUG9pbnRzKTtcblx0XHR0aGlzLl9zZXRQYXJzZWQocGFyc2VkIHx8IHRoaXMuX3BhcnNlKHN2ZykpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLl9zZXRQYXJzZWQgPSBmdW5jdGlvbihwYXJzZWQpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnNlZCk7XG5cdFx0dGhpcy5wYXJzZWQgPSBwYXJzZWQ7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0Q3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jdWJpYyB8fCB0aGlzLl9wYXJzZUN1YmljKCk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRUb3RhbExlbmd0aCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyBhbiBTVkcgc3RyaW5nIG9mIHRoZSBwYXRoIHNlZ2VtbnRzLiBJdCBpcyBub3QgdGhlIHN2ZyBwcm9wZXJ0eSBvZiB0aGUgcGF0aCwgYXMgaXQgaXMgcG90ZW50aWFsbHkgdHJhbnNmb3JtZWRcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0U1ZHU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihzdmcsIHNlZ21lbnQpe1xuXHRcdFx0cmV0dXJuIHN2ZyArIHNlZ21lbnQudHlwZSArIHNlZ21lbnQuYW5jaG9ycy5qb2luKCcsJyk7IFxuXHRcdH0sICcnKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyB0aGUgcG9zaXRpb25zIGF0IHdoaWNoIHdlIGhhdmUgZWFzZSBwb2ludHMgKHdoaWNoIGFyZSBwcmVwYXJzZWQgYW5kIGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgcGF0aCdzIGRlZmluaXRpb25zKVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZWFzZVBvaW50cztcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRQb2ludCA9IGZ1bmN0aW9uKGlkeCkge1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5wYXJzZWQpO1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZFtpZHhdICYmIHRoaXMucGFyc2VkW2lkeF0uYW5jaG9ycztcblx0fTtcblxuXHQvKipcblx0UGFyc2VzIGFuIFNWRyBwYXRoIHN0cmluZyB0byBhIGxpc3Qgb2Ygc2VnbWVudCBkZWZpbml0aW9ucyB3aXRoIEFCU09MVVRFIHBvc2l0aW9ucyB1c2luZyBSYXBoYWVsLnBhdGgyY3VydmVcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlID0gZnVuY3Rpb24oc3ZnKSB7XG5cdFx0dmFyIGN1cnZlID0gUmFwaGFlbC5wYXRoMmN1cnZlKHN2Zyk7XG5cdFx0dmFyIHBhdGggPSBjdXJ2ZS5tYXAoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZSA6IHBvaW50LnNoaWZ0KCksXG5cdFx0XHRcdGFuY2hvcnMgOiBwb2ludFxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcGF0aDtcblx0fTtcblxuXHQvKipcblx0XHRQYXJzZXMgYSBwYXRoIGRlZmluZWQgYnkgcGFyc2VQYXRoIHRvIGEgbGlzdCBvZiBiZXppZXIgcG9pbnRzIHRvIGJlIHVzZWQgYnkgR3JlZW5zb2NrIEJlemllciBwbHVnaW4sIGZvciBleGFtcGxlXG5cdFx0VHdlZW5NYXgudG8oc3ByaXRlLCA1MDAsIHtcblx0XHRcdGJlemllcjp7dHlwZTpcImN1YmljXCIsIHZhbHVlczpjdWJpY30sXG5cdFx0XHRlYXNlOlF1YWQuZWFzZUluT3V0LFxuXHRcdFx0dXNlRnJhbWVzIDogdHJ1ZVxuXHRcdH0pO1xuXHRcdCovXG5cdFBhdGgucHJvdG90eXBlLl9wYXJzZUN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoKTtcblx0XHQvL2Fzc3VtZWQgZmlyc3QgZWxlbWVudCBpcyBhIG1vdmV0b1xuXHRcdHZhciBhbmNob3JzID0gdGhpcy5jdWJpYyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihhbmNob3JzLCBzZWdtZW50KXtcblx0XHRcdHZhciBhID0gc2VnbWVudC5hbmNob3JzO1xuXHRcdFx0aWYoc2VnbWVudC50eXBlPT09J00nKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OmFbMV19KTtcblx0XHRcdH0gZWxzZSBpZihzZWdtZW50LnR5cGU9PT0nTCcpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVsyXSwgeTogYVszXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbNF0sIHk6IGFbNV19KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBhbmNob3JzO1xuXG5cdFx0fSwgW10pO1xuXG5cdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0fTtcblxuXHQvL3Ryb3V2ZSBsZSBib3VuZGluZyBib3ggZCd1bmUgbGV0dHJlIChlbiBzZSBmaWFudCBqdXN0ZSBzdXIgbGVzIHBvaW50cy4uLiBvbiBuZSBjYWxjdWxlIHBhcyBvdSBwYXNzZSBsZSBwYXRoKVxuXHRQYXRoLnByb3RvdHlwZS5nZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLnBhdGhCQm94KHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRtLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIHRoaXMuZWFzZVBvaW50cyk7XG5cdH07XG5cblx0Ly9yZXR1cm5zIGEgbmV3IHBhdGgsIHNjYWxlZFxuXHRQYXRoLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHJhdGlvKSB7XG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0uc2NhbGUocmF0aW8pO1xuXHRcdHZhciBzdmcgPSBSYXBoYWVsLm1hcFBhdGgodGhpcy5nZXRTVkdTdHJpbmcoKSwgbSk7XG5cdFx0dmFyIGVhc2VQb2ludHMgPSB0aGlzLmVhc2VQb2ludHMubWFwKGZ1bmN0aW9uKGVwKXtcblx0XHRcdHJldHVybiBlcCAqIHJhdGlvO1xuXHRcdH0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIGVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKHBhcnQsIG5hbWUpwqB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJ0KTtcblx0XHRpZihuYW1lKSB0aGlzLm5hbWUgKz0gbmFtZTtcblx0XHR0aGlzLl9zZXRQYXJzZWQodGhpcy5wYXJzZWQuY29uY2F0KHBhcnQucGFyc2VkLnNsaWNlKDEpKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYWRkRWFzZXBvaW50ID0gZnVuY3Rpb24ocG9zKXtcblx0XHR0aGlzLmVhc2VQb2ludHMucHVzaChwb3MpO1xuXHR9O1xuXG5cdFBhdGguZmFjdG9yeSA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKSB7XG5cdFx0cmV0dXJuIG5ldyBQYXRoKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKTtcblx0fTtcblxuXHRyZXR1cm4gUGF0aDtcblxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpLCByZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5fLCByb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBfLCBSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBkZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5cdHZhciByYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cdHZhciB0b1JhZGlhbnMgPSBmdW5jdGlvbihkZWdyZWVzKSB7XG5cdCAgcmV0dXJuIGRlZ3JlZXMgKiBkZWdUb1JhZDtcblx0fTtcdCBcblx0Ly8gQ29udmVydHMgZnJvbSByYWRpYW5zIHRvIGRlZ3JlZXMuXG5cdHZhciB0b0RlZ3JlZXMgPSBmdW5jdGlvbihyYWRpYW5zKSB7XG5cdCAgcmV0dXJuIHJhZGlhbnMgKiByYWRUb0RlZztcblx0fTtcblxuXG5cdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdHZhciBhbmdsZVRyZXNob2xkID0gdG9SYWRpYW5zKDEyKTtcblxuXHR2YXIgc3RhZ2U7XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xvciwgc2l6ZSl7XG5cdFx0dmFyIGVsID0gc3RhZ2UuY2lyY2xlKHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMik7XG5cdFx0ZWwuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0dmFyIHNob3cgPSBmdW5jdGlvbihwYXRoRGVmKSB7XG5cdFx0dmFyIHBhdGggPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1x0XHRcdFxuXHRcdHZhciBlbCA9IHN0YWdlLnBhdGgocGF0aCk7XG5cdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogMywgc3Ryb2tlOiAnIzAwMDAwMCd9KTsvKiovXG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdHZhciBmaW5kRGVmYXVsdHMgPSBmdW5jdGlvbihwYXRoRGVmKXtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0dmFyIGxlbmd0aCA9IHBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0dmFyIHBvaW50UG9zID0gW107XG5cdFx0XG5cdFx0XG5cdFx0dmFyIHByZWNpc2lvbiA9IDE7XG5cdFx0dmFyIHByZXY7XG5cdFx0dmFyIGFsbFBvaW50cyA9IFtdO1xuXHRcdGZvcih2YXIgaT1wcmVjaXNpb247IGk8PWxlbmd0aDsgaSArPSBwcmVjaXNpb24pIHtcblx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0dmFyIHAgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgaSk7XG5cdFx0XHRcblx0XHRcdC8vaXQgc2VlbXMgdGhhdCBSYXBoYWVsJ3MgYWxwaGEgaXMgaW5jb25zaXN0ZW50Li4uIHNvbWV0aW1lcyBvdmVyIDM2MFxuXHRcdFx0dmFyIGFscGhhID0gTWF0aC5hYnMoIE1hdGguYXNpbiggTWF0aC5zaW4odG9SYWRpYW5zKHAuYWxwaGEpKSApKTtcblx0XHRcdGlmKHByZXYpIHtcblx0XHRcdFx0cC5kaWZmID0gTWF0aC5hYnMoYWxwaGEgLSBwcmV2KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHAuZGlmZiA9IDA7XG5cdFx0XHR9XG5cdFx0XHRwcmV2ID0gYWxwaGE7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHAuZGlmZik7XG5cblx0XHRcdGlmKHAuZGlmZiA+IGFuZ2xlVHJlc2hvbGQpIHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpKTtcblx0XHRcdFx0cG9pbnRQb3MucHVzaChpKTtcblx0XHRcdH1cblxuXHRcdFx0Ly9wLmNvbXB1dGVkQWxwaGEgPSBhbHBoYTtcblx0XHRcdC8vYWxsUG9pbnRzLnB1c2gocCk7XG5cblx0XHR9LyoqL1xuXG5cdFx0IC8qXG5cdFx0Ly9ERUJVRyBcblx0XHQvL2ZpbmQgbWF4IGN1cnZhdHVyZSB0aGF0IGlzIG5vdCBhIGN1c3AgKHRyZXNob2xkIGRldGVybWluZXMgY3VzcClcblx0XHR2YXIgY3VzcFRyZXNob2xkID0gNDA7XG5cdFx0dmFyIG1heCA9IGFsbFBvaW50cy5yZWR1Y2UoZnVuY3Rpb24obSwgcCl7XG5cdFx0XHRyZXR1cm4gcC5kaWZmID4gbSAmJiBwLmRpZmYgPCBjdXNwVHJlc2hvbGQgPyBwLmRpZmYgOiBtO1xuXHRcdH0sIDApO1xuXHRcdGNvbnNvbGUubG9nKG1heCk7XG5cblx0XHR2YXIgcHJldiA9IFswLDAsMCwwXTtcblx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdHZhciByID0gTWF0aC5yb3VuZCgocC5kaWZmIC8gbWF4KSAqIDI1NSk7XG5cdFx0XHR2YXIgZyA9IDI1NSAtIE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0dmFyIHJnYiA9ICdyZ2IoJytyKycsJytnKycsMCknO1xuXHRcdFx0aWYocj4xMDApIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJz09PT09PT09PT0nKTtcblx0XHRcdFx0cHJldi5mb3JFYWNoKGZ1bmN0aW9uKHApe2NvbnNvbGUubG9nKHAuY29tcHV0ZWRBbHBoYSwgcC5hbHBoYSk7fSk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHAuY29tcHV0ZWRBbHBoYSwgcC5hbHBoYSwgcmdiKTtcblx0XHRcdH1cblx0XHRcdHAueSArPSAxNTA7XG5cdFx0XHRzaG93UG9pbnQocCwgcmdiLCAwLjUpO1xuXHRcdFx0cHJldlszXSA9IHByZXZbMl07XG5cdFx0XHRwcmV2WzJdID0gcHJldlsxXTtcblx0XHRcdHByZXZbMV0gPSBwcmV2WzBdO1xuXHRcdFx0cHJldlswXSA9IHA7XG5cdFx0fSk7XG5cdFx0LyoqL1xuXG5cdFx0Ly9maW5kcyBncm91cHMgb2YgcG9pbnRzIGRlcGVuZGluZyBvbiB0cmVzaG9sZCwgYW5kIGZpbmQgdGhlIG1pZGRsZSBvZiBlYWNoIGdyb3VwXG5cdFx0cmV0dXJuIHBvaW50UG9zLnJlZHVjZShmdW5jdGlvbihwb2ludHMsIHBvaW50KXtcblxuXHRcdFx0dmFyIGxhc3QgPSBwb2ludHNbcG9pbnRzLmxlbmd0aC0xXTtcblx0XHRcdGlmKCFsYXN0IHx8IHBvaW50IC0gbGFzdFtsYXN0Lmxlbmd0aC0xXSA+IGRpc3RhbmNlVHJlc2hvbGQpe1xuXHRcdFx0XHRsYXN0ID0gW3BvaW50XTtcblx0XHRcdFx0cG9pbnRzLnB1c2gobGFzdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsYXN0LnB1c2gocG9pbnQpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcG9pbnRzO1xuXHRcdH0sIFtdKS5tYXAoZnVuY3Rpb24ocG9pbnRzKXtcblx0XHRcdHJldHVybiBwb2ludHNbTWF0aC5mbG9vcihwb2ludHMubGVuZ3RoLzIpXTtcblx0XHR9KTtcblx0XHRcblx0fTtcblxuXHR2YXIgYWxsUG9pbnRzID0gW107XG5cdHZhciBlYXNlUG9pbnRzID0ge307XG5cblx0dmFyIGN1cnJlbnQ7XG5cblx0dmFyIGdldEVhc2Vwb2ludHMgPSBmdW5jdGlvbihsZXR0ZXIsIHBhdGhJZHgsIHBhdGhEZWYpe1xuXHRcdFxuXHRcdHZhciBwYXRoID0gc2hvdyhwYXRoRGVmKTtcblxuXHRcdC8vYXJlIGVhc2UgcG9pbnRzIGFscmVhZHkgc2V0IGZvciB0aGlzIHBhdGg/XG5cdFx0dmFyIHBhdGhFYXNlUG9pbnRzID0gcGF0aERlZi5nZXRFYXNlcG9pbnRzKCk7IFxuXHRcdGlmKHBhdGhFYXNlUG9pbnRzLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0cGF0aEVhc2VQb2ludHMgPSBmaW5kRGVmYXVsdHMocGF0aERlZik7XG5cdFx0fVxuXG5cdFx0Ly9jb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XG5cblx0XHR2YXIgaW5hY3RpdmVDb2xvciA9ICcjMDBmZjAwJztcblx0XHR2YXIgYWN0aXZlQ29sb3IgPSAnI2ZmMjIwMCc7XG5cblx0XHR2YXIgYWRkUG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdFx0dmFyIHBPYmogPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcG9zKTtcblx0XHRcdHZhciBwb2ludCA9IHNob3dQb2ludChwT2JqLCBpbmFjdGl2ZUNvbG9yLCAzKTtcblxuXHRcdFx0cG9pbnQuZGF0YSgncG9zJywgcG9zKTtcblx0XHRcdHBvaW50LmRhdGEoJ2xldHRlcicsIGxldHRlcik7XG5cdFx0XHRwb2ludC5kYXRhKCdwYXRoSWR4JywgcGF0aElkeCk7XG5cdFx0XHRwb2ludC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRcdHBvaW50LmRhdGEoJ3knLCBwT2JqLnkpO1xuXG5cdFx0XHRhbGxQb2ludHMucHVzaChwb2ludCk7XG5cblx0XHRcdHBvaW50LmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFxuXHRcdFx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0XHRwLmF0dHIoe2ZpbGw6IGluYWN0aXZlQ29sb3J9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cG9pbnQuYXR0cih7ZmlsbDogYWN0aXZlQ29sb3J9KTtcblxuXHRcdFx0XHRjdXJyZW50ID0ge1xuXHRcdFx0XHRcdHBvaW50OiBwb2ludCxcblx0XHRcdFx0XHRwYXRoOiBwYXRoLFxuXHRcdFx0XHRcdHBhdGhEZWY6IHBhdGhEZWYsXG5cdFx0XHRcdFx0c3ZnIDogcGF0aFN0cixcblx0XHRcdFx0XHRsZXR0ZXIgOiBsZXR0ZXIsXG5cdFx0XHRcdFx0cGF0aElkeCA6IHBhdGhJZHhcblx0XHRcdFx0fTtcblxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHBhdGhFYXNlUG9pbnRzLmZvckVhY2goYWRkUG9pbnQpOy8qKi9cblxuXHRcdHBhdGguY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdGNvbnNvbGUubG9nKCdhZGQnKTtcblx0XHRcdGFkZFBvaW50KDApO1xuXHRcdH0pO1xuXHRcdFxuXG5cdFx0cmV0dXJuIHBhdGhFYXNlUG9pbnRzO1xuXG5cdH07XG5cblx0dmFyIG1vdmVDdXJyZW50ID0gZnVuY3Rpb24oZGlzdCkge1xuXHRcdHZhciBwID0gY3VycmVudC5wb2ludDtcblx0XHR2YXIgcG9zID0gcC5kYXRhKCdwb3MnKTtcblx0XHRwb3MgKz0gZGlzdDtcblx0XHR2YXIgbWF4ID0gY3VycmVudC5wYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdGlmKHBvcyA8IDApIHBvcyA9IDA7XG5cdFx0aWYocG9zID4gbWF4KSBwb3MgPSBtYXg7XG5cdFx0cC5kYXRhKCdwb3MnLCBwb3MpO1xuXG5cdFx0dmFyIHBPYmogPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgoY3VycmVudC5zdmcsIHBvcyk7XG5cblx0XHR2YXIgeCA9IHAuZGF0YSgneCcpO1xuXHRcdHZhciB5ID0gcC5kYXRhKCd5Jyk7XG5cdFx0dmFyIGRlbHRhWCA9IHBPYmoueCAtIHg7XG5cdFx0dmFyIGRlbHRhWSA9IHBPYmoueSAtIHk7XG5cblx0XHQvKnAuZGF0YSgneCcsIHBPYmoueCk7XG5cdFx0cC5kYXRhKCd5JywgcE9iai55KTsvKiovXG5cblx0XHRwLnRyYW5zZm9ybSgndCcgKyBkZWx0YVggKyAnLCcgKyBkZWx0YVkpO1xuXHRcdHByaW50SlNPTigpO1xuXG5cdH07XG5cblxuXHQkKHdpbmRvdykub24oJ2tleWRvd24uZWFzZScsIGZ1bmN0aW9uKGUpe1xuXHRcdC8vY29uc29sZS5sb2coZS53aGljaCwgY3VycmVudCk7XG5cdFx0dmFyIExFRlQgPSAzNztcblx0XHR2YXIgVVAgPSAzODtcblx0XHR2YXIgUklHSFQgPSAzOTtcblx0XHR2YXIgRE9XTiA9IDQwO1xuXHRcdHZhciBERUwgPSA0NjtcblxuXHRcdGlmKGN1cnJlbnQpIHtcblx0XHRcdHN3aXRjaChlLndoaWNoKSB7XG5cdFx0XHRcdGNhc2UgTEVGVDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoLTEpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFVQOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMTApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFJJR0hUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgxKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBET1dOOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgxMCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgREVMOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHR2YXIgaWR4ID0gYWxsUG9pbnRzLmluZGV4T2YoY3VycmVudC5wb2ludCk7XG5cdFx0XHRcdFx0Y3VycmVudC5wb2ludC5yZW1vdmUoKTtcblx0XHRcdFx0XHRhbGxQb2ludHMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdFx0Y3VycmVudCA9IG51bGw7XG5cdFx0XHRcdFx0cHJpbnRKU09OKCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHR9KTtcblxuXHR2YXIgcHJpbnROb2RlO1xuXHR2YXIgcHJpbnRKU09OID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGpzb24gPSBhbGxQb2ludHMucmVkdWNlKGZ1bmN0aW9uKGpzb24sIHBvaW50KXtcblxuXHRcdFx0dmFyIGxldHRlciA9IHBvaW50LmRhdGEoJ2xldHRlcicpO1xuXHRcdFx0dmFyIHBhdGhJZHggPSBwb2ludC5kYXRhKCdwYXRoSWR4Jyk7XG5cblx0XHRcdHZhciBwYXRocyA9IGpzb25bbGV0dGVyXSA9IGpzb25bbGV0dGVyXSB8fCBbXTtcblx0XHRcdHZhciBlYXNlcG9pbnRzID0gcGF0aHNbcGF0aElkeF0gPSBwYXRoc1twYXRoSWR4XSB8fCBbXTtcblx0XHRcdGVhc2Vwb2ludHMucHVzaChwb2ludC5kYXRhKCdwb3MnKSk7XG5cdFx0XHRyZXR1cm4ganNvbjtcblx0XHR9LCB7fSk7XG5cdFx0cHJpbnROb2RlLnRleHQoSlNPTi5zdHJpbmdpZnkoanNvbikpO1xuXHR9O1xuXG5cdHJldHVybiBmdW5jdGlvbihzLCBncm91cHMsIG5vZGUsIGRpbSl7XG5cdFx0c3RhZ2UgPSBzO1xuXHRcdHZhciBwYWQgPSAyMDtcblx0XHR2YXIgYXZhaWxXID0gZGltWzBdIC0gcGFkO1xuXG5cdFx0dmFyIGdyb3VwTWF4SGVpZ2h0ID0gT2JqZWN0LmtleXMoZ3JvdXBzKS5yZWR1Y2UoZnVuY3Rpb24obWluLCBncm91cE5hbWUpe1xuXHRcdFx0dmFyIHQgPSBncm91cHNbZ3JvdXBOYW1lXS5nZXRIZWlnaHQoKTtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IHQgPiBtaW4pIHtcblx0XHRcdFx0bWluID0gdDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtaW47XG5cdFx0fSwgdW5kZWZpbmVkKTtcblx0XHRcblx0XHR2YXIgdG9wTGVmdCA9IHt4OnBhZCwgeTpwYWR9O1xuXHRcdE9iamVjdC5rZXlzKGdyb3VwcykuZm9yRWFjaChmdW5jdGlvbihuYW1lKXtcblx0XHRcdHZhciBncm91cCA9IGdyb3Vwc1tuYW1lXTtcblx0XHRcdC8vY29uc29sZS5sb2coZ3JvdXApO1xuXHRcdFx0dmFyIGVuZExlZnQgPSB0b3BMZWZ0LnggKyBncm91cC5nZXRXaWR0aCgpICsgcGFkO1xuXG5cdFx0XHRpZihlbmRMZWZ0ID4gYXZhaWxXKSB7XG5cdFx0XHRcdHRvcExlZnQueCA9IHBhZDtcblx0XHRcdFx0dG9wTGVmdC55ICs9IHBhZCArIGdyb3VwTWF4SGVpZ2h0O1xuXHRcdFx0XHRlbmRMZWZ0ID0gdG9wTGVmdC54ICsgZ3JvdXAuZ2V0V2lkdGgoKSArIHBhZDtcblx0XHRcdH1cblxuXG5cdFx0XHR2YXIgdGhpc0Vhc2UgPSBncm91cC5wYXRocy5tYXAoZnVuY3Rpb24ocCwgaWR4KXtcblx0XHRcdFx0cCA9IHAudHJhbnNsYXRlKHRvcExlZnQueCwgdG9wTGVmdC55KTtcblx0XHRcdFx0cmV0dXJuIGdldEVhc2Vwb2ludHMobmFtZSwgaWR4LCBwKTtcblx0XHRcdH0pO1xuXG5cblx0XHRcdHRvcExlZnQueCA9IGVuZExlZnQ7XHRcdFx0XG5cblx0XHR9KTtcblx0XHQvL2NvbnNvbGUubG9nKGVhc2VQb2ludHMpO1xuXG5cdFx0cHJpbnROb2RlID0gbm9kZTtcblx0XHRwcmludEpTT04oKTtcblx0fTtcblxuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoR3JvdXAnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeSgpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIFBhdGhHcm91cCA9IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5ib3VuZGluZyA9IHRoaXMucGF0aHMucmVkdWNlKGZ1bmN0aW9uKGJvdW5kaW5nLCBwYXRoKXtcblx0XHRcdHZhciBwYXRoQm91bmRpbmcgPSBwYXRoLmdldEJvdW5kaW5nKCk7XG5cblx0XHRcdGJvdW5kaW5nID0gYm91bmRpbmcgfHwgcGF0aEJvdW5kaW5nO1xuXHRcdFx0Ym91bmRpbmcueCA9IGJvdW5kaW5nLnggPCBwYXRoQm91bmRpbmcueCA/IGJvdW5kaW5nLnggOiAgcGF0aEJvdW5kaW5nLng7XG5cdFx0XHRib3VuZGluZy55ID0gYm91bmRpbmcueSA8IHBhdGhCb3VuZGluZy55ID8gYm91bmRpbmcueSA6ICBwYXRoQm91bmRpbmcueTtcblx0XHRcdGJvdW5kaW5nLngyID0gYm91bmRpbmcueDIgPiBwYXRoQm91bmRpbmcueDIgPyBib3VuZGluZy54MiA6IHBhdGhCb3VuZGluZy54Mjtcblx0XHRcdGJvdW5kaW5nLnkyID0gYm91bmRpbmcueTIgPiBwYXRoQm91bmRpbmcueTIgPyBib3VuZGluZy55MiA6IHBhdGhCb3VuZGluZy55Mjtcblx0XHRcdGJvdW5kaW5nLndpZHRoID0gYm91bmRpbmcueDIgLSBib3VuZGluZy54O1xuXHRcdFx0Ym91bmRpbmcuaGVpZ2h0ID0gYm91bmRpbmcueTIgLSBib3VuZGluZy55O1xuXHRcdFx0cmV0dXJuIGJvdW5kaW5nO1xuXHRcdH0sIHVuZGVmaW5lZCkgfHwge307XG5cdFx0Ly9pZiB0aGVyZSdzIGEgZW5kUG9pbnQgcG9pbnQgdGhhdCBpcyBzZXQsIHVzZSBpdHMgY29vcmRpbmF0ZXMgYXMgYm91bmRpbmdcblx0XHRpZih0aGlzLmVuZFBvaW50KSB7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuZW5kUG9pbnQuZ2V0UG9pbnQoMCk7XG5cdFx0XHR0aGlzLmJvdW5kaW5nLngyID0gYW5jaG9yc1swXTtcblx0XHRcdHRoaXMuYm91bmRpbmcud2lkdGggPSB0aGlzLmJvdW5kaW5nLngyIC0gdGhpcy5ib3VuZGluZy54O1xuXHRcdH1cblx0XHRpZih0aGlzLnN0YXJ0UG9pbnQpIHtcblx0XHRcdHZhciBhbmNob3JzID0gdGhpcy5zdGFydFBvaW50LmdldFBvaW50KDApO1xuXHRcdFx0dGhpcy5ib3VuZGluZy54ID0gYW5jaG9yc1swXTtcblx0XHRcdHRoaXMuYm91bmRpbmcud2lkdGggPSB0aGlzLmJvdW5kaW5nLngyIC0gdGhpcy5ib3VuZGluZy54O1xuXHRcdH1cblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmFkZFBhdGggPSBmdW5jdGlvbihwKXtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocyB8fCBbXTtcblx0XHRpZihwLm5hbWUgJiYgcC5uYW1lLmluZGV4T2YoJ2VuZCcpID09PSAwKSB7XG5cdFx0XHR0aGlzLmVuZFBvaW50ID0gcDtcblx0XHR9IGVsc2UgaWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdzdGFydCcpID09PSAwKSB7XG5cdFx0XHR0aGlzLnN0YXJ0UG9pbnQgPSBwO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnBhdGhzLnB1c2gocCk7XG5cdFx0fVxuXHRcdHRoaXMuc2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldEhlaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcuaGVpZ2h0O1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0V2lkdGggPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLndpZHRoO1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldEJvdHRvbiA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueTI7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0VG9wID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy55O1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldExlZnQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLng7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0UmlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLngyO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2V0T2Zmc2V0ID0gZnVuY3Rpb24oeCwgeSl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMubWFwKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRwYXRoID0gcGF0aC50cmFuc2xhdGUoeCwgeSk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0fSk7XG5cdFx0dGhpcy5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQudHJhbnNsYXRlKHgsIHkpKTtcblx0XHR0aGlzLnN0YXJ0UG9pbnQgPSAodGhpcy5zdGFydFBvaW50ICYmIHRoaXMuc3RhcnRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgUGF0aEdyb3VwLCBzY2FsZWRcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcblx0XHRpZighdGhpcy5wYXRocykgcmV0dXJuIHRoaXM7XG5cdFx0dmFyIHNjYWxlZCA9IG5ldyBQYXRoR3JvdXAodGhpcy5uYW1lKTtcblx0XHR0aGlzLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCl7XG5cdFx0XHRzY2FsZWQuYWRkUGF0aChwYXRoLnNjYWxlKHNjYWxlKSk7XG5cdFx0fSk7XG5cblx0XHRzY2FsZWQuZW5kUG9pbnQgPSAodGhpcy5lbmRQb2ludCAmJiB0aGlzLmVuZFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnN0YXJ0UG9pbnQgPSAodGhpcy5zdGFydFBvaW50ICYmIHRoaXMuc3RhcnRQb2ludC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zZXRCb3VuZGluZygpO1xuXHRcdHJldHVybiBzY2FsZWQ7XG5cdH07XG5cblx0cmV0dXJuIFBhdGhHcm91cDtcblxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvQWxwaGFiZXQuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5BbHBoYWJldCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKEFscGhhYmV0KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdFxuXHR2YXIgVmVjdG9yV29yZCA9IHtcblx0XHRnZXRQYXRocyA6IGZ1bmN0aW9uKG5hbWUsIHJpZ2h0LCB0b3AsIHNjYWxlKSB7XG5cdFx0XHRyaWdodCA9IHJpZ2h0IHx8IDA7XG5cdFx0XHR0b3AgPSB0b3AgfHwgMDtcblxuXHRcdFx0dmFyIGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdHZhciBsaW5lcyA9IFtdO1xuXG5cdFx0XHQvL2xvb3AgZm9yIGV2ZXJ5IGNoYXJhY3RlciBpbiBuYW1lIChzdHJpbmcpXG5cdFx0XHRmb3IodmFyIGk9MDsgaTxuYW1lLmxlbmd0aDsgaSsrKcKge1xuXHRcdFx0XHR2YXIgbGV0dGVyID0gbmFtZVtpXTtcblx0XHRcdFx0aWYobGV0dGVyID09PSAnICcpIHtcblx0XHRcdFx0XHRyaWdodCArPSBBbHBoYWJldC5nZXROU3BhY2UoKSAqIHNjYWxlO1xuXHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgbGV0dGVyRGVmID0gQWxwaGFiZXQuZ2V0TGV0dGVyKGxldHRlcikuc2NhbGUoc2NhbGUpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlckRlZik7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgbGV0dGVySm9pbmVkRW5kID0gZmFsc2U7XG5cdFx0XHRcdGxldHRlckRlZi5wYXRocy5mb3JFYWNoKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdFx0XHR2YXIgZGVmID0gcGF0aC50cmFuc2xhdGUocmlnaHQsIHRvcCk7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZFN0YXJ0ID0gZGVmLm5hbWUgJiYgZGVmLm5hbWUuaW5kZXhPZignam9pbmEnKSA+IC0xO1xuXHRcdFx0XHRcdHZhciBqb2luZWRFbmQgPSAvam9pbihhPyliLy50ZXN0KGRlZi5uYW1lKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgam9pbmVkU3RhcnQsIGpvaW5lZEVuZCk7XG5cdFx0XHRcdFx0bGV0dGVySm9pbmVkRW5kID0gbGV0dGVySm9pbmVkRW5kIHx8IGpvaW5lZEVuZDtcblx0XHRcdFx0XHRpZihqb2luZWRTdGFydCAmJiBjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL2FwcGVuZCBhdSBjb250aW51b3VzXG5cdFx0XHRcdFx0XHRjb250aW51b3VzLmFwcGVuZChkZWYsIGxldHRlcik7XG5cblx0XHRcdFx0XHRcdC8vYWpvdXRlIGxlcyBlYXNlcG9pbnRzIGRlIGNlIHBhdGhcblx0XHRcdFx0XHRcdHZhciBwYXRoU3RhcnRQb3MgPSBjb250aW51b3VzLmdldExlbmd0aCgpIC0gZGVmLmdldExlbmd0aCgpO1xuXHRcdFx0XHRcdFx0ZGVmLmdldEVhc2Vwb2ludHMoKS5mb3JFYWNoKGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYWRkRWFzZXBvaW50KHBhdGhTdGFydFBvcyArIHBvcyk7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZihqb2luZWRFbmQgJiYgIWNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vc3RhcnQgdW4gbm91dmVhdSBsaW5lXG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZGVmO1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5uYW1lID0gbGV0dGVyO1xuXHRcdFx0XHRcdFx0bGluZXMucHVzaChjb250aW51b3VzKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bGluZXMucHVzaChkZWYpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKCFsZXR0ZXJKb2luZWRFbmQpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRyaWdodCArPSBsZXR0ZXJEZWYuZ2V0V2lkdGgoKTtcblx0XHRcdFx0Ly9jb25zb2xlLnRhYmxlKFt7bGV0dGVyOm5hbWVbaV0sIGxldHRlcldpZHRoOiBsZXR0ZXIuZ2V0V2lkdGgoKSwgdG90YWw6cmlnaHR9XSk7XHRcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGxpbmVzO1xuXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBWZWN0b3JXb3JkO1xuXHRcbn0pKTtcblxuXG4iXX0=
