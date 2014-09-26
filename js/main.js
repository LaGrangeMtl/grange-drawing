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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9sYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcdFxuXHR2YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xuXHR2YXIgUmFwaGFlbCA9IHJlcXVpcmUoJ3JhcGhhZWwnKTtcblx0dmFyIERyYXdQYXRoID0gcmVxdWlyZSgnbGFncmFuZ2UvZHJhd2luZy9EcmF3UGF0aC5qcycpO1xuXHR2YXIgVmVjdG9yV29yZCA9IHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvVmVjdG9yV29yZC5qcycpO1xuXHR2YXIgQWxwaGFiZXQgPSByZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzJyk7XG5cblx0dmFyIEVtaWxpZUZvbnQgPSByZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL0VtaWxpZUZvbnQuanMnKTtcblxuXG5cblx0dmFyIFR3ZWVuTWF4ID0gcmVxdWlyZSgnZ3NhcCcpO1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBXID0gMTIwMDtcblx0dmFyIEggPSAxNjAwO1xuXG5cdHZhciBzY2FsZUZhY3RvciA9IDE7XG5cblx0dmFyIG5hbWVzID0gW1wiSmVzc2ljYSBXYW5uaW5nXCIsXCJKdWxpYSBSb2Nrd2VsbFwiLFwiQ2Fyb2wgSHViYmFyZFwiLFwiUm9uYWxkIENhbmR5XCIsXCJKb2huIE5ld3RvblwiLFwiRWx2aXMgTmljb2xlXCIsXCJHbG9yaWEgV2VhdmVyXCIsXCJKdWxpYSBDcm9ua2l0ZVwiLFwiTW90aGVyIFJvZ2Vyc1wiLFwiQ2hldnkgSXJ3aW5cIixcIkVkZGllIEFsbGVuXCIsXCJOb3JtYW4gSmFja3NvblwiLFwiUGV0ZXIgUm9nZXJzXCIsXCJXZWlyZCBDaGFzZVwiLFwiQ29saW4gTWF5c1wiLFwiTmFwb2xlb24gTWFydGluXCIsXCJFZGdhciBTaW1wc29uXCIsXCJNb2hhbW1hZCBNY0NhcnRuZXlcIixcIkxpYmVyYWNlIFdpbGxpYW1zXCIsXCJGaWVsZHMgQnVybmV0dFwiLFwiU3RldmUgQXNoZVwiLFwiQ2FycmllIENoYXJsZXNcIixcIlRvbW15IFBhc3RldXJcIixcIkVkZGllIFNpbHZlcnN0b25lXCIsXCJPcHJhaCBBc2hlXCIsXCJSYXkgQmFsbFwiLFwiSmltIERpYW5hXCIsXCJNaWNoZWxhbmdlbG8gRWFzdHdvb2RcIixcIkdlb3JnZSBTaW1wc29uXCIsXCJBbGljaWEgQXVzdGVuXCIsXCJKZXNzaWNhIE5pY29sZVwiLFwiTWFyaWx5biBFdmVyZXR0XCIsXCJLZWl0aCBFYXN0d29vZFwiLFwiUGFibG8gRWFzdHdvb2RcIixcIlBleXRvbiBMdXRoZXJcIixcIk1vemFydCBBcm1zdHJvbmdcIixcIk1pY2hhZWwgQnVybmV0dFwiLFwiS2VpdGggR2xvdmVyXCIsXCJFbGl6YWJldGggQ2hpbGRcIixcIk1pbGVzIEFzdGFpcmVcIixcIkFuZHkgRWRpc29uXCIsXCJNYXJ0aW4gTGVubm9uXCIsXCJUb20gUGljY2Fzb1wiLFwiQmV5b25jZSBEaXNuZXlcIixcIlBldGVyIENsaW50b25cIixcIkhlbnJ5IEtlbm5lZHlcIixcIlBhdWwgQ2hpbGRcIixcIkxld2lzIFNhZ2FuXCIsXCJNaWNoZWxhbmdlbG8gTGVlXCIsXCJNYXJpbHluIEZpc2hlclwiXTtcblx0ZnVuY3Rpb24gU2h1ZmZsZShvKSB7XG5cdFx0Zm9yKHZhciBqLCB4LCBpID0gby5sZW5ndGg7IGk7IGogPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogaSksIHggPSBvWy0taV0sIG9baV0gPSBvW2pdLCBvW2pdID0geCk7XG5cdFx0cmV0dXJuIG87XG5cdH07XG5cdFNodWZmbGUobmFtZXMpO1xuXHRuYW1lcy5sZW5ndGggPSAxOy8qKi9cblxuXHQvL25hbWVzID0gWydha3N0dGVmJ107XG5cblxuXHR2YXIgZ2V0U3RhZ2UgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgc3RhZ2U7XG5cdFx0dmFyIGluaXQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIFJhcGhhZWwoXCJzdmdcIiwgVywgSCk7XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzdGFnZSA9IHN0YWdlIHx8IGluaXQoKTtcblx0XHR9XG5cdH0pKCk7XG5cblx0dmFyIGRvRHJhdyA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGluY3IgPSBIIC8gbmFtZXMubGVuZ3RoO1xuXHRcdG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSwgayl7XG5cdFx0XHQvL3RyYWNlTmFtZShuYW1lLCAwLCBrICogaW5jcik7XG5cblx0XHRcdHZhciBwYXRocyA9IFZlY3RvcldvcmQuZ2V0UGF0aHMobmFtZSwgMCwgayAqIGluY3IsIHNjYWxlRmFjdG9yKTtcblx0XHRcdHZhciBzdGFydCA9IG5ldyBEYXRlKCk7XG5cdFx0XHREcmF3UGF0aC5ncm91cChwYXRocywgZ2V0U3RhZ2UoKSwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IDIwMCxcblx0XHRcdFx0Y29sb3IgOiAnIzQ0NDQ0NCcsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogMixcblx0XHRcdFx0ZWFzaW5nIDogZ3NhcC5TaW5lLmVhc2VJbk91dFxuXHRcdFx0fSk7XG5cblx0XHRcdHZhciBlbmQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coZW5kLXN0YXJ0KTtcblxuXHRcdH0pO1xuXG5cdH07XG5cblx0dmFyIGxvYWRpbmcgPSBBbHBoYWJldC5pbml0KEVtaWxpZUZvbnQpO1x0XG5cdHZhciBidG4gPSAkKCcjY3RybCcpO1xuXG5cdGJ0bi5vbignY2xpY2suYWxwaGFiZXQnLCBmdW5jdGlvbigpe1xuXHRcdGxvYWRpbmcudGhlbihkb0RyYXcpO1xuXHR9KTtcblxuXG5cdC8vcGFyc2UgbGVzIGJyZWFrcG9pbnRzIGRlIGNoYXF1ZSBsZXR0cmUsIG91dHB1dCBlbiBKU09OICjDoCBzYXZlcilcblx0dmFyIHByaW50RWFzZXBvaW50cyA9IGZ1bmN0aW9uKCl7XG5cdFx0QWxwaGFiZXQucGFyc2VFYXNlcG9pbnRzKGdldFN0YWdlKCksICQoJyNicnAnKSwgW1csIEhdKTtcblx0fTtcblxuXHR2YXIgZ2V0QnByID0gJCgnI2dldGJycCcpO1xuXG5cdGdldEJwci5vbignY2xpY2suYWxwaGFiZXQnLCBmdW5jdGlvbigpe1xuXHRcdGxvYWRpbmcudGhlbihwcmludEVhc2Vwb2ludHMpO1xuXHR9KTtcblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvQWxwaGFiZXQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpLCByZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL1BhdGguanMnKSwgcmVxdWlyZSgnbGFncmFuZ2UvZHJhd2luZy9QYXRoR3JvdXAuanMnKSwgcmVxdWlyZSgnbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cy5qcycpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGgsIHJvb3QubGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXAsIHJvb3QubGFncmFuZ2UuZHJhd2luZy5QYXRoRWFzZXBvaW50cyk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIFBhdGgsIFBhdGhHcm91cCwgUGF0aEVhc2Vwb2ludHMpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHNldHRpbmdzO1xuXG5cdHZhciBsZXR0ZXJzID0ge307XG5cblx0dmFyIHBhcnNlU1ZHID0gZnVuY3Rpb24oZGF0YSl7XG5cblx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdHZhciBkb2MgPSAkKGRhdGEpO1xuXHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdHZhciBsYXllciA9ICQoZWwpO1xuXHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblxuXHRcdFx0aWYoaWQgPT0gJ194MkRfJykge1xuXHRcdFx0XHRpZCA9ICctJztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgbGV0dGVyID0gbGV0dGVyc1tpZF0gPSBuZXcgUGF0aEdyb3VwKGlkKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gbGF5ZXIuZmluZCgncGF0aCcpO1xuXHRcdFx0Ly9pZihwYXRocy5sZW5ndGg9PTApIGNvbnNvbGUubG9nKGxheWVyKTtcblx0XHRcdC8vY29uc29sZS5sb2coaWQpO1xuXHRcdFx0cGF0aHMuZWFjaChmdW5jdGlvbihpLCBlbCl7XG5cdFx0XHRcdHZhciBwYXRoRWwgPSAkKGVsKTtcblx0XHRcdFx0dmFyIHAgPSBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpLCBudWxsLCBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXSAmJiBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXVtpXSkuc2NhbGUoc2V0dGluZ3Muc2NhbGUgfHwgMSk7XHRcdFx0XHRcblx0XHRcdFx0bGV0dGVyLmFkZFBhdGgoIHAgKTtcblx0XHRcdH0pO1xuXG5cdFx0fSk7XG5cblx0XHQvL2NvbnNvbGUubG9nKGJvdW5kaW5ncyk7XG5cdFx0Ly90cm91dmUgbGUgdG9wIGFic29sdSAodG9wIGRlIGxhIGxldHRyZSBsYSBwbHVzIGhhdXRlKVxuXHRcdHZhciB0b3AgPSBPYmplY3Qua2V5cyhsZXR0ZXJzKS5yZWR1Y2UoZnVuY3Rpb24obWluLCBsZXR0ZXJOYW1lKXtcblx0XHRcdHZhciB0ID0gbGV0dGVyc1tsZXR0ZXJOYW1lXS5nZXRUb3AoKTtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IHQpIHtcblx0XHRcdFx0bWluID0gdDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtaW47XG5cdFx0fSwgdW5kZWZpbmVkKTtcblx0XHQvL2NvbnNvbGUubG9nKHRvcCk7XG5cdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXJzKTtcblxuXHRcdC8vYWp1c3RlIGxlIGJhc2VsaW5lIGRlIGNoYXF1ZSBsZXR0cmVcblx0XHRPYmplY3Qua2V5cyhsZXR0ZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0bGV0dGVyc1trZXldLnNldE9mZnNldCgtMSAqIGxldHRlcnNba2V5XS5nZXRMZWZ0KCksIC0xICogdG9wKTtcblx0XHR9KTtcblxuXG5cdH07XG5cblx0dmFyIGRvTG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGxvYWRpbmcgPSAkLmFqYXgoe1xuXHRcdFx0dXJsIDogc2V0dGluZ3Muc3ZnRmlsZSxcblx0XHRcdGRhdGFUeXBlIDogJ3RleHQnXG5cdFx0fSk7XG5cblx0XHRsb2FkaW5nLnRoZW4ocGFyc2VTVkcsIGZ1bmN0aW9uKGEsIGIsIGMpe1xuXHRcdFx0Y29uc29sZS5sb2coJ2Vycm9yIGxvYWQnKTtcblx0XHRcdGNvbnNvbGUubG9nKGIpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhjKTtcblx0XHRcdC8vY29uc29sZS5sb2coYS5yZXNwb25zZVRleHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGxvYWRpbmcucHJvbWlzZSgpO1xuXG5cdH07XG5cblx0XG5cblx0dmFyIEFscGhhYmV0ID0ge1xuXHRcdGluaXQgOiBmdW5jdGlvbihmb250U2V0dGluZ3MpIHtcblx0XHRcdHNldHRpbmdzID0gZm9udFNldHRpbmdzO1xuXHRcdFx0cmV0dXJuIGRvTG9hZCgpO1xuXHRcdH0sXG5cdFx0Z2V0TGV0dGVyIDogZnVuY3Rpb24obCl7XG5cdFx0XHRyZXR1cm4gbGV0dGVyc1tsXTtcblx0XHR9LFxuXHRcdGdldE5TcGFjZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gbGV0dGVyc1snbiddLmdldFdpZHRoKCk7XG5cdFx0fSxcblx0XHQvL3NldHVwIGRlcyBicmVha3BvaW50cyAocG9pbnRzIG/DuSBvbiBmYWl0IHVuIGVhc2luZykgZGUgY2hhY3VuZSBkZXMgbGV0dHJlcy4gU2VyYSBvdXRwdXR0w6kgZXQgc2F2w6kgZW4gSlNPTiwgcG91ciDDqnRyZSBsb2Fkw6kgZW4gbcOqbWUgdGVtcHMgcXVlIGwnYWxwaGFiZXQuIExlIHBhcnNlIGVuIHJlYWx0aW1lIGVzdCB0cm9wIGxlbnQsIGRvbmMgY2V0dGUgZm9uY3Rpb24gZG9pdCBldHJlIGNhbGzDqWUgcG91ciByZWZhaXJlIGxlcyBicmVha3BvaW50cyBjaGFxdWUgZm9pcyBxdWUgbGUgU1ZHIGNoYW5nZS5cblx0XHRwYXJzZUVhc2Vwb2ludHMgOiBmdW5jdGlvbihzdGFnZSwgbm9kZSwgZGltKXtcblxuXHRcdFx0UGF0aEVhc2Vwb2ludHMoc3RhZ2UsIGxldHRlcnMsIG5vZGUsIGRpbSk7XG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBBbHBoYWJldDtcblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvRHJhd1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSwgcmVxdWlyZSgnZ3NhcCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290Ll8sIHJvb3QuUmFwaGFlbCwgKHJvb3QuR3JlZW5Tb2NrR2xvYmFscyB8fCByb290KSk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKF8sIFJhcGhhZWwsIFR3ZWVuTWF4KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vZ3NhcCBleHBvcnRzIFR3ZWVuTWF4XG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBkZWZhdWx0cyA9IHtcblx0XHRjb2xvcjogJyMwMDAwMDAnLFxuXHRcdHN0cm9rZVdpZHRoIDogMC42LFxuXHRcdHB4UGVyU2Vjb25kIDogMTAwLCAvL3NwZWVkIG9mIGRyYXdpbmdcblx0XHRlYXNpbmcgOiBnc2FwLlF1YWQuZWFzZUluXG5cdH07XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBzdGFnZSwgY29sb3IsIHNpemUpe1xuXHRcdHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdH07XG5cblx0dmFyIERyYXdQYXRoID0ge1xuXG5cdFx0c2luZ2xlIDogZnVuY3Rpb24ocGF0aCwgc3RhZ2UsIHBhcmFtcyl7XG5cblx0XHRcdHZhciBzZXR0aW5ncyA9IF8uZXh0ZW5kKHt9LCBkZWZhdWx0cywgcGFyYW1zKTtcblx0XHRcdHZhciBwYXRoU3RyID0gcGF0aC5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdHZhciBsZW5ndGggPSBwYXRoLmdldExlbmd0aCgpO1xuXHRcdFx0dmFyIHB4UGVyU2Vjb25kID0gc2V0dGluZ3MucHhQZXJTZWNvbmQ7XG5cdFx0XHR2YXIgdGltZSA9IGxlbmd0aCAvIHB4UGVyU2Vjb25kO1xuXG5cdFx0XHR2YXIgYW5pbSA9IHt0bzogMH07XG5cdFx0XHRcblx0XHRcdHZhciB1cGRhdGUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGVsO1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgYW5pbS50byk7XG5cdFx0XHRcdFx0aWYoZWwpIGVsLnJlbW92ZSgpO1xuXHRcdFx0XHRcdGVsID0gc3RhZ2UucGF0aChwYXRoUGFydCk7XG5cdFx0XHRcdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc2V0dGluZ3Muc3Ryb2tlV2lkdGgsIHN0cm9rZTogc2V0dGluZ3MuY29sb3J9KTtcblx0XHRcdFx0fTtcblx0XHRcdH0pKCk7XG5cblx0XHRcdHZhciBlYXNlUG9pbnRzID0gcGF0aC5nZXRFYXNlcG9pbnRzKCk7XG5cdFx0XHQvKmNvbnNvbGUubG9nKGVhc2VQb2ludHMpO1xuXHRcdFx0ZWFzZVBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHRcdHNob3dQb2ludChwLCBzdGFnZSwgJyNmZjAwMDAnLCAyKTtcblx0XHRcdH0pOy8qKi9cblx0XHRcdFxuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHRyZXR1cm4gZWFzZVBvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIHB4UGVyU2Vjb25kO1xuXHRcdFx0XHRsYXN0ID0gZGlzdDtcblx0XHRcdFx0cmV0dXJuIHRsLnRvKGFuaW0sIHRpbWUsIHt0bzogZGlzdCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe1xuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZVxuXHRcdFx0fSkpLnRvKGFuaW0sICgobGVuZ3RoIC0gKGVhc2VQb2ludHMubGVuZ3RoICYmIGVhc2VQb2ludHNbZWFzZVBvaW50cy5sZW5ndGgtMV0pKSAvIHB4UGVyU2Vjb25kKSwge3RvOiBsZW5ndGgsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdFxuXHRcdH0sXG5cblx0XHRncm91cCA6IGZ1bmN0aW9uKHBhdGhzLCBzdGFnZSwgc2V0dGluZ3MsIG9uQ29tcGxldGUpIHtcblx0XHRcdHJldHVybiBwYXRocy5yZWR1Y2UoZnVuY3Rpb24odGwsIHBhdGgpe1xuXHRcdFx0XHRyZXR1cm4gdGwuYXBwZW5kKERyYXdQYXRoLnNpbmdsZShwYXRoLCBzdGFnZSwgc2V0dGluZ3MpKTtcblx0XHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHsgb25Db21wbGV0ZTogKG9uQ29tcGxldGUgfHwgZnVuY3Rpb24oKXt9KSB9KSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIERyYXdQYXRoO1xuXHRcbn0pKTtcblxuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9FbWlsaWVGb250Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL29yaWdpbmFsIHNjYWxlIGZhY3RvclxuXHR2YXIgRW1pbGllRm9udCA9IHtcblx0XHRzY2FsZSA6IDEsXG5cdFx0c3ZnRmlsZSA6ICdhc3NldHMvZW1pbGllRm9udC5zdmcnLFxuXHRcdC8vUEFSU8OJIGF2ZWMgbGUgaGVscGVyXG5cdFx0ZWFzZXBvaW50cyA6IHtcIsOWXCI6W1s1XSxbNV1dLFwiw5RcIjpbbnVsbCxbMTZdXSxcIsOPXCI6W1sxMzZdLFs1XSxbNV1dLFwiw45cIjpbWzkzXSxbMTZdXSxcIsOLXCI6W1sxNTldLFs1XSxbNV1dLFwiw4pcIjpbWzE1OV0sWzE3XV0sXCLDiFwiOltbMTU5XV0sXCLDiVwiOltbMTU5XV0sXCLDh1wiOltudWxsLFsxM11dLFwiw4RcIjpbWzE4OV0sbnVsbCxbNV0sWzVdXSxcIsOCXCI6W1sxODldLG51bGwsWzE1XV0sXCLDgFwiOltbMTg5XV0sXCJaXCI6W1sxOTMsMzQwXV0sXCJZXCI6W1szMjldXSxcIldcIjpbWzIyNywzMzZdXSxcIlZcIjpbWzIzMV1dLFwiVVwiOltbMzE3XV0sXCJSXCI6W1syODldXSxcIk5cIjpbWzI0NywzNTBdXSxcIk1cIjpbWzIzOCwzMzgsNDUyXV0sXCJLXCI6W1sxMTVdLFsxMjJdXSxcIkpcIjpbWzEzMl1dLFwiSVwiOltbOTNdXSxcIkhcIjpbWzE0Ml1dLFwiR1wiOltbMzIxXV0sXCJFXCI6W1sxNTldXSxcIkJcIjpbWzQ1M11dLFwiQVwiOltbMTg5XV0sXCLDtFwiOltbMTU1XSxbMTZdXSxcIsO2XCI6W1sxNTVdLFs1XSxbNV1dLFwiw69cIjpbWzQyXSxbNV0sWzVdXSxcIsOuXCI6W1s0Ml0sWzE2XV0sXCLDq1wiOltudWxsLFs1XSxbNV1dLFwiw6pcIjpbbnVsbCxbMTddXSxcIsOnXCI6W1s3Ml0sWzEzXV0sXCLDpFwiOltbNTUsMTMzXSxbNV0sWzVdXSxcIsOiXCI6W1s1NSwxMzNdLFsxNV1dLFwiw6BcIjpbWzU1LDEzM11dLFwielwiOltbMTEwXV0sXCJ5XCI6W1s0MiwxMTYsMjI3XV0sXCJ4XCI6W1s0Ml1dLFwid1wiOltbMzgsMTA3LDE3N11dLFwidlwiOltbNjZdXSxcInVcIjpbWzMzLDEwNV1dLFwidFwiOltbMTAzXV0sXCJzXCI6W1s1MCwxMTBdXSxcInJcIjpbWzY0XV0sXCJxXCI6W1sxNDQsMzI1XV0sXCJwXCI6W1s1NiwzMDVdXSxcIm9cIjpbWzE1NV1dLFwiblwiOltbMTA0XV0sXCJtXCI6W1sxMTBdXSxcImxcIjpbWzI0XV0sXCJrXCI6W1sxMzEsMjQ0LDMyN11dLFwialwiOltbNTJdLFsxOF1dLFwiaVwiOltbNDJdLFsxOF1dLFwiaFwiOltbMTMzLDI0OCwyOTNdXSxcImdcIjpbWzYwLDE0NV1dLFwiZlwiOltbNDE5XV0sXCJkXCI6W1syMzZdXSxcImNcIjpbWzcyXV0sXCJiXCI6W1syOTFdXSxcImFcIjpbWzU1LDEzM11dLFwiT1wiOltbMzAwXV0sXCJMXCI6W1syMjBdXSxcIkZcIjpbWzIyMF1dLFwiRFwiOltbMzcwXV19XG5cdH07XG5cblxuXHRyZXR1cm4gRW1pbGllRm9udDtcblx0XG59KSk7IiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdyYXBoYWVsJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuUmFwaGFlbCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKFJhcGhhZWwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHJlZyA9IC8oW2Etel0pKFswLTlcXHNcXCxcXC5cXC1dKykvZ2k7XG5cdFx0XG5cdC8vZXhwZWN0ZWQgbGVuZ3RoIG9mIGVhY2ggdHlwZVxuXHR2YXIgZXhwZWN0ZWRMZW5ndGhzID0ge1xuXHRcdG0gOiAyLFxuXHRcdGwgOiAyLFxuXHRcdHYgOiAxLFxuXHRcdGggOiAxLFxuXHRcdGMgOiA2LFxuXHRcdHMgOiA0XG5cdH07XG5cblx0dmFyIFBhdGggPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cykge1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0Ly9pZihzdmcpIGNvbnNvbGUubG9nKHN2ZywgcGFyc2VkKTtcblx0XHR0aGlzLmVhc2VQb2ludHMgPSBlYXNlUG9pbnRzIHx8IFtdO1xuXHRcdC8vY29uc29sZS5sb2cobmFtZSwgZWFzZVBvaW50cyk7XG5cdFx0dGhpcy5fc2V0UGFyc2VkKHBhcnNlZCB8fCB0aGlzLl9wYXJzZShzdmcpKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5fc2V0UGFyc2VkID0gZnVuY3Rpb24ocGFyc2VkKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJzZWQpO1xuXHRcdHRoaXMucGFyc2VkID0gcGFyc2VkO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldEN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY3ViaWMgfHwgdGhpcy5fcGFyc2VDdWJpYygpO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJhcGhhZWwuZ2V0VG90YWxMZW5ndGgodGhpcy5nZXRTVkdTdHJpbmcoKSk7XG5cdH07XG5cblx0LyoqXG5cdEdldHMgYW4gU1ZHIHN0cmluZyBvZiB0aGUgcGF0aCBzZWdlbW50cy4gSXQgaXMgbm90IHRoZSBzdmcgcHJvcGVydHkgb2YgdGhlIHBhdGgsIGFzIGl0IGlzIHBvdGVudGlhbGx5IHRyYW5zZm9ybWVkXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLmdldFNWR1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oc3ZnLCBzZWdtZW50KXtcblx0XHRcdHJldHVybiBzdmcgKyBzZWdtZW50LnR5cGUgKyBzZWdtZW50LmFuY2hvcnMuam9pbignLCcpOyBcblx0XHR9LCAnJyk7XG5cdH07XG5cblx0LyoqXG5cdEdldHMgdGhlIHBvc2l0aW9ucyBhdCB3aGljaCB3ZSBoYXZlIGVhc2UgcG9pbnRzICh3aGljaCBhcmUgcHJlcGFyc2VkIGFuZCBjb25zaWRlcmVkIHBhcnQgb2YgdGhlIHBhdGgncyBkZWZpbml0aW9ucylcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0RWFzZXBvaW50cyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmVhc2VQb2ludHM7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0UG9pbnQgPSBmdW5jdGlvbihpZHgpIHtcblx0XHQvL2NvbnNvbGUubG9nKHRoaXMucGFyc2VkKTtcblx0XHRyZXR1cm4gdGhpcy5wYXJzZWRbaWR4XSAmJiB0aGlzLnBhcnNlZFtpZHhdLmFuY2hvcnM7XG5cdH07XG5cblx0LyoqXG5cdFBhcnNlcyBhbiBTVkcgcGF0aCBzdHJpbmcgdG8gYSBsaXN0IG9mIHNlZ21lbnQgZGVmaW5pdGlvbnMgd2l0aCBBQlNPTFVURSBwb3NpdGlvbnMgdXNpbmcgUmFwaGFlbC5wYXRoMmN1cnZlXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLl9wYXJzZSA9IGZ1bmN0aW9uKHN2Zykge1xuXHRcdHZhciBjdXJ2ZSA9IFJhcGhhZWwucGF0aDJjdXJ2ZShzdmcpO1xuXHRcdHZhciBwYXRoID0gY3VydmUubWFwKGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHR5cGUgOiBwb2ludC5zaGlmdCgpLFxuXHRcdFx0XHRhbmNob3JzIDogcG9pbnRcblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHBhdGg7XG5cdH07XG5cblx0LyoqXG5cdFx0UGFyc2VzIGEgcGF0aCBkZWZpbmVkIGJ5IHBhcnNlUGF0aCB0byBhIGxpc3Qgb2YgYmV6aWVyIHBvaW50cyB0byBiZSB1c2VkIGJ5IEdyZWVuc29jayBCZXppZXIgcGx1Z2luLCBmb3IgZXhhbXBsZVxuXHRcdFR3ZWVuTWF4LnRvKHNwcml0ZSwgNTAwLCB7XG5cdFx0XHRiZXppZXI6e3R5cGU6XCJjdWJpY1wiLCB2YWx1ZXM6Y3ViaWN9LFxuXHRcdFx0ZWFzZTpRdWFkLmVhc2VJbk91dCxcblx0XHRcdHVzZUZyYW1lcyA6IHRydWVcblx0XHR9KTtcblx0XHQqL1xuXHRQYXRoLnByb3RvdHlwZS5fcGFyc2VDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vY29uc29sZS5sb2cocGF0aCk7XG5cdFx0Ly9hc3N1bWVkIGZpcnN0IGVsZW1lbnQgaXMgYSBtb3ZldG9cblx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuY3ViaWMgPSB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oYW5jaG9ycywgc2VnbWVudCl7XG5cdFx0XHR2YXIgYSA9IHNlZ21lbnQuYW5jaG9ycztcblx0XHRcdGlmKHNlZ21lbnQudHlwZT09PSdNJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTphWzFdfSk7XG5cdFx0XHR9IGVsc2UgaWYoc2VnbWVudC50eXBlPT09J0wnKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMl0sIHk6IGFbM119KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzRdLCB5OiBhWzVdfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHRcdH0sIFtdKTtcblxuXHRcdHJldHVybiBhbmNob3JzO1xuXG5cdH07XG5cblx0Ly90cm91dmUgbGUgYm91bmRpbmcgYm94IGQndW5lIGxldHRyZSAoZW4gc2UgZmlhbnQganVzdGUgc3VyIGxlcyBwb2ludHMuLi4gb24gbmUgY2FsY3VsZSBwYXMgb3UgcGFzc2UgbGUgcGF0aClcblx0UGF0aC5wcm90b3R5cGUuZ2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5wYXRoQkJveCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHgsIHkpIHtcblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS50cmFuc2xhdGUoeCwgeSk7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KHN2ZywgdGhpcy5uYW1lLCBudWxsLCB0aGlzLmVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBwYXRoLCBzY2FsZWRcblx0UGF0aC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihyYXRpbykge1xuXHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRtLnNjYWxlKHJhdGlvKTtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHZhciBlYXNlUG9pbnRzID0gdGhpcy5lYXNlUG9pbnRzLm1hcChmdW5jdGlvbihlcCl7XG5cdFx0XHRyZXR1cm4gZXAgKiByYXRpbztcblx0XHR9KTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KHN2ZywgdGhpcy5uYW1lLCBudWxsLCBlYXNlUG9pbnRzKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihwYXJ0LCBuYW1lKcKge1xuXHRcdC8vY29uc29sZS5sb2cocGFydCk7XG5cdFx0aWYobmFtZSkgdGhpcy5uYW1lICs9IG5hbWU7XG5cdFx0dGhpcy5fc2V0UGFyc2VkKHRoaXMucGFyc2VkLmNvbmNhdChwYXJ0LnBhcnNlZC5zbGljZSgxKSkpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmFkZEVhc2Vwb2ludCA9IGZ1bmN0aW9uKHBvcyl7XG5cdFx0dGhpcy5lYXNlUG9pbnRzLnB1c2gocG9zKTtcblx0fTtcblxuXHRQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cykge1xuXHRcdHJldHVybiBuZXcgUGF0aChzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cyk7XG5cdH07XG5cblx0cmV0dXJuIFBhdGg7XG5cbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5qUXVlcnksIHJvb3QuXywgcm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoJCwgXywgUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXHR2YXIgcmFkVG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuXHR2YXIgdG9SYWRpYW5zID0gZnVuY3Rpb24oZGVncmVlcykge1xuXHQgIHJldHVybiBkZWdyZWVzICogZGVnVG9SYWQ7XG5cdH07XHQgXG5cdC8vIENvbnZlcnRzIGZyb20gcmFkaWFucyB0byBkZWdyZWVzLlxuXHR2YXIgdG9EZWdyZWVzID0gZnVuY3Rpb24ocmFkaWFucykge1xuXHQgIHJldHVybiByYWRpYW5zICogcmFkVG9EZWc7XG5cdH07XG5cblxuXHR2YXIgZGlzdGFuY2VUcmVzaG9sZCA9IDQwO1xuXHR2YXIgYW5nbGVUcmVzaG9sZCA9IHRvUmFkaWFucygxMik7XG5cblx0dmFyIHN0YWdlO1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpO1xuXHRcdGVsLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdHZhciBzaG93ID0gZnVuY3Rpb24ocGF0aERlZikge1xuXHRcdHZhciBwYXRoID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcdFx0XHRcblx0XHR2YXIgZWwgPSBzdGFnZS5wYXRoKHBhdGgpO1xuXHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IDMsIHN0cm9rZTogJyMwMDAwMDAnfSk7LyoqL1xuXHRcdHJldHVybiBlbDtcblx0fTtcblxuXHR2YXIgZmluZERlZmF1bHRzID0gZnVuY3Rpb24ocGF0aERlZil7XG5cdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdHZhciBsZW5ndGggPSBwYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdHZhciBwb2ludFBvcyA9IFtdO1xuXHRcdFxuXHRcdFxuXHRcdHZhciBwcmVjaXNpb24gPSAxO1xuXHRcdHZhciBwcmV2O1xuXHRcdHZhciBhbGxQb2ludHMgPSBbXTtcblx0XHRmb3IodmFyIGk9cHJlY2lzaW9uOyBpPD1sZW5ndGg7IGkgKz0gcHJlY2lzaW9uKSB7XG5cdFx0XHQvL3ZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBpKTtcblx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XG5cdFx0XHQvL2l0IHNlZW1zIHRoYXQgUmFwaGFlbCdzIGFscGhhIGlzIGluY29uc2lzdGVudC4uLiBzb21ldGltZXMgb3ZlciAzNjBcblx0XHRcdHZhciBhbHBoYSA9IE1hdGguYWJzKCBNYXRoLmFzaW4oIE1hdGguc2luKHRvUmFkaWFucyhwLmFscGhhKSkgKSk7XG5cdFx0XHRpZihwcmV2KSB7XG5cdFx0XHRcdHAuZGlmZiA9IE1hdGguYWJzKGFscGhhIC0gcHJldik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwLmRpZmYgPSAwO1xuXHRcdFx0fVxuXHRcdFx0cHJldiA9IGFscGhhO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwLmRpZmYpO1xuXG5cdFx0XHRpZihwLmRpZmYgPiBhbmdsZVRyZXNob2xkKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coaSk7XG5cdFx0XHRcdHBvaW50UG9zLnB1c2goaSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vcC5jb21wdXRlZEFscGhhID0gYWxwaGE7XG5cdFx0XHQvL2FsbFBvaW50cy5wdXNoKHApO1xuXG5cdFx0fS8qKi9cblxuXHRcdCAvKlxuXHRcdC8vREVCVUcgXG5cdFx0Ly9maW5kIG1heCBjdXJ2YXR1cmUgdGhhdCBpcyBub3QgYSBjdXNwICh0cmVzaG9sZCBkZXRlcm1pbmVzIGN1c3ApXG5cdFx0dmFyIGN1c3BUcmVzaG9sZCA9IDQwO1xuXHRcdHZhciBtYXggPSBhbGxQb2ludHMucmVkdWNlKGZ1bmN0aW9uKG0sIHApe1xuXHRcdFx0cmV0dXJuIHAuZGlmZiA+IG0gJiYgcC5kaWZmIDwgY3VzcFRyZXNob2xkID8gcC5kaWZmIDogbTtcblx0XHR9LCAwKTtcblx0XHRjb25zb2xlLmxvZyhtYXgpO1xuXG5cdFx0dmFyIHByZXYgPSBbMCwwLDAsMF07XG5cdFx0YWxsUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHR2YXIgciA9IE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0dmFyIGcgPSAyNTUgLSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdHZhciByZ2IgPSAncmdiKCcrcisnLCcrZysnLDApJztcblx0XHRcdGlmKHI+MTAwKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09Jyk7XG5cdFx0XHRcdHByZXYuZm9yRWFjaChmdW5jdGlvbihwKXtjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEpO30pO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEsIHJnYik7XG5cdFx0XHR9XG5cdFx0XHRwLnkgKz0gMTUwO1xuXHRcdFx0c2hvd1BvaW50KHAsIHJnYiwgMC41KTtcblx0XHRcdHByZXZbM10gPSBwcmV2WzJdO1xuXHRcdFx0cHJldlsyXSA9IHByZXZbMV07XG5cdFx0XHRwcmV2WzFdID0gcHJldlswXTtcblx0XHRcdHByZXZbMF0gPSBwO1xuXHRcdH0pO1xuXHRcdC8qKi9cblxuXHRcdC8vZmluZHMgZ3JvdXBzIG9mIHBvaW50cyBkZXBlbmRpbmcgb24gdHJlc2hvbGQsIGFuZCBmaW5kIHRoZSBtaWRkbGUgb2YgZWFjaCBncm91cFxuXHRcdHJldHVybiBwb2ludFBvcy5yZWR1Y2UoZnVuY3Rpb24ocG9pbnRzLCBwb2ludCl7XG5cblx0XHRcdHZhciBsYXN0ID0gcG9pbnRzW3BvaW50cy5sZW5ndGgtMV07XG5cdFx0XHRpZighbGFzdCB8fCBwb2ludCAtIGxhc3RbbGFzdC5sZW5ndGgtMV0gPiBkaXN0YW5jZVRyZXNob2xkKXtcblx0XHRcdFx0bGFzdCA9IFtwb2ludF07XG5cdFx0XHRcdHBvaW50cy5wdXNoKGxhc3QpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGFzdC5wdXNoKHBvaW50KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHBvaW50cztcblx0XHR9LCBbXSkubWFwKGZ1bmN0aW9uKHBvaW50cyl7XG5cdFx0XHRyZXR1cm4gcG9pbnRzW01hdGguZmxvb3IocG9pbnRzLmxlbmd0aC8yKV07XG5cdFx0fSk7XG5cdFx0XG5cdH07XG5cblx0dmFyIGFsbFBvaW50cyA9IFtdO1xuXHR2YXIgZWFzZVBvaW50cyA9IHt9O1xuXG5cdHZhciBjdXJyZW50O1xuXG5cdHZhciBnZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24obGV0dGVyLCBwYXRoSWR4LCBwYXRoRGVmKXtcblx0XHRcblx0XHR2YXIgcGF0aCA9IHNob3cocGF0aERlZik7XG5cblx0XHQvL2FyZSBlYXNlIHBvaW50cyBhbHJlYWR5IHNldCBmb3IgdGhpcyBwYXRoP1xuXHRcdHZhciBwYXRoRWFzZVBvaW50cyA9IHBhdGhEZWYuZ2V0RWFzZXBvaW50cygpOyBcblx0XHRpZihwYXRoRWFzZVBvaW50cy5sZW5ndGggPT09IDApIHtcblx0XHRcdHBhdGhFYXNlUG9pbnRzID0gZmluZERlZmF1bHRzKHBhdGhEZWYpO1xuXHRcdH1cblxuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdFxuXG5cdFx0dmFyIGluYWN0aXZlQ29sb3IgPSAnIzAwZmYwMCc7XG5cdFx0dmFyIGFjdGl2ZUNvbG9yID0gJyNmZjIyMDAnO1xuXG5cdFx0dmFyIGFkZFBvaW50ID0gZnVuY3Rpb24ocG9zKXtcblx0XHRcdHZhciBwT2JqID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHR2YXIgcG9pbnQgPSBzaG93UG9pbnQocE9iaiwgaW5hY3RpdmVDb2xvciwgMyk7XG5cblx0XHRcdHBvaW50LmRhdGEoJ3BvcycsIHBvcyk7XG5cdFx0XHRwb2ludC5kYXRhKCdsZXR0ZXInLCBsZXR0ZXIpO1xuXHRcdFx0cG9pbnQuZGF0YSgncGF0aElkeCcsIHBhdGhJZHgpO1xuXHRcdFx0cG9pbnQuZGF0YSgneCcsIHBPYmoueCk7XG5cdFx0XHRwb2ludC5kYXRhKCd5JywgcE9iai55KTtcblxuXHRcdFx0YWxsUG9pbnRzLnB1c2gocG9pbnQpO1xuXG5cdFx0XHRwb2ludC5jbGljayhmdW5jdGlvbigpe1xuXHRcdFx0XHRcblx0XHRcdFx0YWxsUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHRcdFx0cC5hdHRyKHtmaWxsOiBpbmFjdGl2ZUNvbG9yfSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHBvaW50LmF0dHIoe2ZpbGw6IGFjdGl2ZUNvbG9yfSk7XG5cblx0XHRcdFx0Y3VycmVudCA9IHtcblx0XHRcdFx0XHRwb2ludDogcG9pbnQsXG5cdFx0XHRcdFx0cGF0aDogcGF0aCxcblx0XHRcdFx0XHRwYXRoRGVmOiBwYXRoRGVmLFxuXHRcdFx0XHRcdHN2ZyA6IHBhdGhTdHIsXG5cdFx0XHRcdFx0bGV0dGVyIDogbGV0dGVyLFxuXHRcdFx0XHRcdHBhdGhJZHggOiBwYXRoSWR4XG5cdFx0XHRcdH07XG5cblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRwYXRoRWFzZVBvaW50cy5mb3JFYWNoKGFkZFBvaW50KTsvKiovXG5cblx0XHRwYXRoLmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHRjb25zb2xlLmxvZygnYWRkJyk7XG5cdFx0XHRhZGRQb2ludCgwKTtcblx0XHR9KTtcblx0XHRcblxuXHRcdHJldHVybiBwYXRoRWFzZVBvaW50cztcblxuXHR9O1xuXG5cdHZhciBtb3ZlQ3VycmVudCA9IGZ1bmN0aW9uKGRpc3QpIHtcblx0XHR2YXIgcCA9IGN1cnJlbnQucG9pbnQ7XG5cdFx0dmFyIHBvcyA9IHAuZGF0YSgncG9zJyk7XG5cdFx0cG9zICs9IGRpc3Q7XG5cdFx0dmFyIG1heCA9IGN1cnJlbnQucGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHRpZihwb3MgPCAwKSBwb3MgPSAwO1xuXHRcdGlmKHBvcyA+IG1heCkgcG9zID0gbWF4O1xuXHRcdHAuZGF0YSgncG9zJywgcG9zKTtcblxuXHRcdHZhciBwT2JqID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGN1cnJlbnQuc3ZnLCBwb3MpO1xuXG5cdFx0dmFyIHggPSBwLmRhdGEoJ3gnKTtcblx0XHR2YXIgeSA9IHAuZGF0YSgneScpO1xuXHRcdHZhciBkZWx0YVggPSBwT2JqLnggLSB4O1xuXHRcdHZhciBkZWx0YVkgPSBwT2JqLnkgLSB5O1xuXG5cdFx0LypwLmRhdGEoJ3gnLCBwT2JqLngpO1xuXHRcdHAuZGF0YSgneScsIHBPYmoueSk7LyoqL1xuXG5cdFx0cC50cmFuc2Zvcm0oJ3QnICsgZGVsdGFYICsgJywnICsgZGVsdGFZKTtcblx0XHRwcmludEpTT04oKTtcblxuXHR9O1xuXG5cblx0JCh3aW5kb3cpLm9uKCdrZXlkb3duLmVhc2UnLCBmdW5jdGlvbihlKXtcblx0XHQvL2NvbnNvbGUubG9nKGUud2hpY2gsIGN1cnJlbnQpO1xuXHRcdHZhciBMRUZUID0gMzc7XG5cdFx0dmFyIFVQID0gMzg7XG5cdFx0dmFyIFJJR0hUID0gMzk7XG5cdFx0dmFyIERPV04gPSA0MDtcblx0XHR2YXIgREVMID0gNDY7XG5cblx0XHRpZihjdXJyZW50KSB7XG5cdFx0XHRzd2l0Y2goZS53aGljaCkge1xuXHRcdFx0XHRjYXNlIExFRlQ6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KC0xKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBVUDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoLTEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBSSUdIVDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgRE9XTjpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMTApO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIERFTDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0dmFyIGlkeCA9IGFsbFBvaW50cy5pbmRleE9mKGN1cnJlbnQucG9pbnQpO1xuXHRcdFx0XHRcdGN1cnJlbnQucG9pbnQucmVtb3ZlKCk7XG5cdFx0XHRcdFx0YWxsUG9pbnRzLnNwbGljZShpZHgsIDEpO1xuXHRcdFx0XHRcdGN1cnJlbnQgPSBudWxsO1xuXHRcdFx0XHRcdHByaW50SlNPTigpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSk7XG5cblx0dmFyIHByaW50Tm9kZTtcblx0dmFyIHByaW50SlNPTiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBqc29uID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihqc29uLCBwb2ludCl7XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBwb2ludC5kYXRhKCdsZXR0ZXInKTtcblx0XHRcdHZhciBwYXRoSWR4ID0gcG9pbnQuZGF0YSgncGF0aElkeCcpO1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBqc29uW2xldHRlcl0gPSBqc29uW2xldHRlcl0gfHwgW107XG5cdFx0XHR2YXIgZWFzZXBvaW50cyA9IHBhdGhzW3BhdGhJZHhdID0gcGF0aHNbcGF0aElkeF0gfHwgW107XG5cdFx0XHRlYXNlcG9pbnRzLnB1c2gocG9pbnQuZGF0YSgncG9zJykpO1xuXHRcdFx0cmV0dXJuIGpzb247XG5cdFx0fSwge30pO1xuXHRcdHByaW50Tm9kZS50ZXh0KEpTT04uc3RyaW5naWZ5KGpzb24pKTtcblx0fTtcblxuXHRyZXR1cm4gZnVuY3Rpb24ocywgZ3JvdXBzLCBub2RlLCBkaW0pe1xuXHRcdHN0YWdlID0gcztcblx0XHR2YXIgcGFkID0gMjA7XG5cdFx0dmFyIGF2YWlsVyA9IGRpbVswXSAtIHBhZDtcblxuXHRcdHZhciBncm91cE1heEhlaWdodCA9IE9iamVjdC5rZXlzKGdyb3VwcykucmVkdWNlKGZ1bmN0aW9uKG1pbiwgZ3JvdXBOYW1lKXtcblx0XHRcdHZhciB0ID0gZ3JvdXBzW2dyb3VwTmFtZV0uZ2V0SGVpZ2h0KCk7XG5cdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZCB8fCB0ID4gbWluKSB7XG5cdFx0XHRcdG1pbiA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWluO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0XG5cdFx0dmFyIHRvcExlZnQgPSB7eDpwYWQsIHk6cGFkfTtcblx0XHRPYmplY3Qua2V5cyhncm91cHMpLmZvckVhY2goZnVuY3Rpb24obmFtZSl7XG5cdFx0XHR2YXIgZ3JvdXAgPSBncm91cHNbbmFtZV07XG5cdFx0XHQvL2NvbnNvbGUubG9nKGdyb3VwKTtcblx0XHRcdHZhciBlbmRMZWZ0ID0gdG9wTGVmdC54ICsgZ3JvdXAuZ2V0V2lkdGgoKSArIHBhZDtcblxuXHRcdFx0aWYoZW5kTGVmdCA+IGF2YWlsVykge1xuXHRcdFx0XHR0b3BMZWZ0LnggPSBwYWQ7XG5cdFx0XHRcdHRvcExlZnQueSArPSBwYWQgKyBncm91cE1heEhlaWdodDtcblx0XHRcdFx0ZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cdFx0XHR9XG5cblxuXHRcdFx0dmFyIHRoaXNFYXNlID0gZ3JvdXAucGF0aHMubWFwKGZ1bmN0aW9uKHAsIGlkeCl7XG5cdFx0XHRcdHAgPSBwLnRyYW5zbGF0ZSh0b3BMZWZ0LngsIHRvcExlZnQueSk7XG5cdFx0XHRcdHJldHVybiBnZXRFYXNlcG9pbnRzKG5hbWUsIGlkeCwgcCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0XHR0b3BMZWZ0LnggPSBlbmRMZWZ0O1x0XHRcdFxuXG5cdFx0fSk7XG5cdFx0Ly9jb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblxuXHRcdHByaW50Tm9kZSA9IG5vZGU7XG5cdFx0cHJpbnRKU09OKCk7XG5cdH07XG5cblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBQYXRoR3JvdXAgPSBmdW5jdGlvbihuYW1lKXtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMuYm91bmRpbmcgPSB0aGlzLnBhdGhzLnJlZHVjZShmdW5jdGlvbihib3VuZGluZywgcGF0aCl7XG5cdFx0XHR2YXIgcGF0aEJvdW5kaW5nID0gcGF0aC5nZXRCb3VuZGluZygpO1xuXG5cdFx0XHRib3VuZGluZyA9IGJvdW5kaW5nIHx8IHBhdGhCb3VuZGluZztcblx0XHRcdGJvdW5kaW5nLnggPSBib3VuZGluZy54IDwgcGF0aEJvdW5kaW5nLnggPyBib3VuZGluZy54IDogIHBhdGhCb3VuZGluZy54O1xuXHRcdFx0Ym91bmRpbmcueSA9IGJvdW5kaW5nLnkgPCBwYXRoQm91bmRpbmcueSA/IGJvdW5kaW5nLnkgOiAgcGF0aEJvdW5kaW5nLnk7XG5cdFx0XHRib3VuZGluZy54MiA9IGJvdW5kaW5nLngyID4gcGF0aEJvdW5kaW5nLngyID8gYm91bmRpbmcueDIgOiBwYXRoQm91bmRpbmcueDI7XG5cdFx0XHRib3VuZGluZy55MiA9IGJvdW5kaW5nLnkyID4gcGF0aEJvdW5kaW5nLnkyID8gYm91bmRpbmcueTIgOiBwYXRoQm91bmRpbmcueTI7XG5cdFx0XHRib3VuZGluZy53aWR0aCA9IGJvdW5kaW5nLngyIC0gYm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLmhlaWdodCA9IGJvdW5kaW5nLnkyIC0gYm91bmRpbmcueTtcblx0XHRcdHJldHVybiBib3VuZGluZztcblx0XHR9LCB1bmRlZmluZWQpIHx8IHt9O1xuXHRcdC8vaWYgdGhlcmUncyBhIGVuZFBvaW50IHBvaW50IHRoYXQgaXMgc2V0LCB1c2UgaXRzIGNvb3JkaW5hdGVzIGFzIGJvdW5kaW5nXG5cdFx0aWYodGhpcy5lbmRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmVuZFBvaW50LmdldFBvaW50KDApO1xuXHRcdFx0dGhpcy5ib3VuZGluZy54MiA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdFx0aWYodGhpcy5zdGFydFBvaW50KSB7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuc3RhcnRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueCA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5lbmRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignc3RhcnQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5zdGFydFBvaW50ID0gcDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wYXRocy5wdXNoKHApO1xuXHRcdH1cblx0XHR0aGlzLnNldEJvdW5kaW5nKCk7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLmhlaWdodDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy53aWR0aDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRCb3R0b24gPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnkyO1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFRvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueTtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54O1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFJpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54Mjtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNldE9mZnNldCA9IGZ1bmN0aW9uKHgsIHkpe1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzLm1hcChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cGF0aCA9IHBhdGgudHJhbnNsYXRlKHgsIHkpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHJldHVybiBwYXRoO1xuXHRcdH0pO1xuXHRcdHRoaXMuZW5kUG9pbnQgPSAodGhpcy5lbmRQb2ludCAmJiB0aGlzLmVuZFBvaW50LnRyYW5zbGF0ZSh4LCB5KSk7XG5cdFx0dGhpcy5zdGFydFBvaW50ID0gKHRoaXMuc3RhcnRQb2ludCAmJiB0aGlzLnN0YXJ0UG9pbnQudHJhbnNsYXRlKHgsIHkpKTtcblx0XHR0aGlzLnNldEJvdW5kaW5nKCk7XG5cdH07XG5cblx0Ly9yZXR1cm5zIGEgbmV3IFBhdGhHcm91cCwgc2NhbGVkXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG5cdFx0aWYoIXRoaXMucGF0aHMpIHJldHVybiB0aGlzO1xuXHRcdHZhciBzY2FsZWQgPSBuZXcgUGF0aEdyb3VwKHRoaXMubmFtZSk7XG5cdFx0dGhpcy5wYXRocy5mb3JFYWNoKGZ1bmN0aW9uKHBhdGgpe1xuXHRcdFx0c2NhbGVkLmFkZFBhdGgocGF0aC5zY2FsZShzY2FsZSkpO1xuXHRcdH0pO1xuXG5cdFx0c2NhbGVkLmVuZFBvaW50ID0gKHRoaXMuZW5kUG9pbnQgJiYgdGhpcy5lbmRQb2ludC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zdGFydFBvaW50ID0gKHRoaXMuc3RhcnRQb2ludCAmJiB0aGlzLnN0YXJ0UG9pbnQuc2NhbGUoc2NhbGUpKTtcblx0XHRzY2FsZWQuc2V0Qm91bmRpbmcoKTtcblx0XHRyZXR1cm4gc2NhbGVkO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoR3JvdXA7XG5cbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9WZWN0b3JXb3JkJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL0FscGhhYmV0LmpzJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KGxhZ3JhbmdlLmRyYXdpbmcuQWxwaGFiZXQpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChBbHBoYWJldCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRcblx0dmFyIFZlY3RvcldvcmQgPSB7XG5cdFx0Z2V0UGF0aHMgOiBmdW5jdGlvbihuYW1lLCByaWdodCwgdG9wLCBzY2FsZSkge1xuXHRcdFx0cmlnaHQgPSByaWdodCB8fCAwO1xuXHRcdFx0dG9wID0gdG9wIHx8IDA7XG5cblx0XHRcdHZhciBjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHR2YXIgbGluZXMgPSBbXTtcblxuXHRcdFx0Ly9sb29wIGZvciBldmVyeSBjaGFyYWN0ZXIgaW4gbmFtZSAoc3RyaW5nKVxuXHRcdFx0Zm9yKHZhciBpPTA7IGk8bmFtZS5sZW5ndGg7IGkrKynCoHtcblx0XHRcdFx0dmFyIGxldHRlciA9IG5hbWVbaV07XG5cdFx0XHRcdGlmKGxldHRlciA9PT0gJyAnKSB7XG5cdFx0XHRcdFx0cmlnaHQgKz0gQWxwaGFiZXQuZ2V0TlNwYWNlKCkgKiBzY2FsZTtcblx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGxldHRlckRlZiA9IEFscGhhYmV0LmdldExldHRlcihsZXR0ZXIpLnNjYWxlKHNjYWxlKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXJEZWYpO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGxldHRlckpvaW5lZEVuZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXR0ZXJEZWYucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHRcdFx0dmFyIGRlZiA9IHBhdGgudHJhbnNsYXRlKHJpZ2h0LCB0b3ApO1xuXHRcdFx0XHRcdHZhciBqb2luZWRTdGFydCA9IGRlZi5uYW1lICYmIGRlZi5uYW1lLmluZGV4T2YoJ2pvaW5hJykgPiAtMTtcblx0XHRcdFx0XHR2YXIgam9pbmVkRW5kID0gL2pvaW4oYT8pYi8udGVzdChkZWYubmFtZSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXIsIGpvaW5lZFN0YXJ0LCBqb2luZWRFbmQpO1xuXHRcdFx0XHRcdGxldHRlckpvaW5lZEVuZCA9IGxldHRlckpvaW5lZEVuZCB8fCBqb2luZWRFbmQ7XG5cdFx0XHRcdFx0aWYoam9pbmVkU3RhcnQgJiYgY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9hcHBlbmQgYXUgY29udGludW91c1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5hcHBlbmQoZGVmLCBsZXR0ZXIpO1xuXG5cdFx0XHRcdFx0XHQvL2Fqb3V0ZSBsZXMgZWFzZXBvaW50cyBkZSBjZSBwYXRoXG5cdFx0XHRcdFx0XHR2YXIgcGF0aFN0YXJ0UG9zID0gY29udGludW91cy5nZXRMZW5ndGgoKSAtIGRlZi5nZXRMZW5ndGgoKTtcblx0XHRcdFx0XHRcdGRlZi5nZXRFYXNlcG9pbnRzKCkuZm9yRWFjaChmdW5jdGlvbihwb3Mpe1xuXHRcdFx0XHRcdFx0XHRjb250aW51b3VzLmFkZEVhc2Vwb2ludChwYXRoU3RhcnRQb3MgKyBwb3MpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYoam9pbmVkRW5kICYmICFjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL3N0YXJ0IHVuIG5vdXZlYXUgbGluZVxuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGRlZjtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMubmFtZSA9IGxldHRlcjtcblx0XHRcdFx0XHRcdGxpbmVzLnB1c2goY29udGludW91cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxpbmVzLnB1c2goZGVmKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZighbGV0dGVySm9pbmVkRW5kKSB7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0cmlnaHQgKz0gbGV0dGVyRGVmLmdldFdpZHRoKCk7XG5cdFx0XHRcdC8vY29uc29sZS50YWJsZShbe2xldHRlcjpuYW1lW2ldLCBsZXR0ZXJXaWR0aDogbGV0dGVyLmdldFdpZHRoKCksIHRvdGFsOnJpZ2h0fV0pO1x0XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBsaW5lcztcblxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gVmVjdG9yV29yZDtcblx0XG59KSk7XG5cblxuIl19
