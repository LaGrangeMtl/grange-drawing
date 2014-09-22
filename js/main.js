(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var DrawPath = require('app/rose/drawing/DrawPath.js');
	var VectorWord = require('app/rose/drawing/VectorWord.js');
	var Alphabet = require('app/rose/drawing/Alphabet.js');
	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1400;
	var H = 1200;

	var scaleFactor = 1;

	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	function Shuffle(o) {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	//Shuffle(names);
	names.length = 1;/**/

	//names = ['ak'];


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

	var loading = Alphabet.init();	
	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		loading.then(doDraw);
	});


},{"app/rose/drawing/Alphabet.js":2,"app/rose/drawing/DrawPath.js":3,"app/rose/drawing/VectorWord.js":4,"gsap":"gsap","jquery":"jquery","raphael":"raphael"}],2:[function(require,module,exports){
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
	    module.exports = factory(require('jquery'), require('lagrange/drawing/Path.js'));
  	} else {
		ns[name] = factory(root.jQuery, root.lagrange.drawing.Path);
	}
}(this, function ($, Path) {
	"use strict";

	//original scale factor
	var SCALE = 1;
	var svgFile = 'assets/alphabet.svg';

	var letters = {};

	var Letter = function(name){
		this.name = name;
	};

	Letter.prototype.setBounding = function(){
		this.bounding = this.paths.reduce(function(bounding, path){
			var pathBounding = path.findBounding();
			bounding = bounding || pathBounding;
			bounding = Path.prototype.refineBounding(bounding, pathBounding);
			return bounding;
		}, undefined);
		if(this.bottomRight) {
			var anchors = this.bottomRight.parsed[0].anchors;
			this.bounding[1] = [anchors[0], anchors[1]];
		}
	};

	Letter.prototype.addPath = function(p){
		this.paths = this.paths || [];
		if(p.name && p.name.indexOf('end') === 0) {
			this.bottomRight = p;
		} else {
			this.paths.push(p);
		}
	};

	Letter.prototype.getWidth = function(){
		return this.bounding[1][0];
	};

	Letter.prototype.setOffset = function(offset){
		this.offset = offset;
		this.paths = this.paths.map(function(path) {
			//console.log(path.parsed[0].anchors[1]);
			path = path.translate(offset);
			//console.log(path.parsed[0].anchors[1]);
			return path;
		});
		this.bottomRight = (this.bottomRight && this.bottomRight.translate(offset));
		this.setBounding();
	};

	//returns a new letter, scaled
	Letter.prototype.scale = function(scale){
		if(!this.paths) return this;
		var scaled = new Letter(this.name);
		this.paths.forEach(function(path){
			scaled.addPath(path.scale(scale));
		});
		scaled.bottomRight = (this.bottomRight && this.bottomRight.scale(scale));
		scaled.setBounding();
		return scaled;
	};


	var parseSVG = function(data){
		var boundings = [];

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

			var letter = letters[id] = new Letter(id);

			var paths = layer.find('path');
			//if(paths.length==0) console.log(layer);
			var letterPathsBounding = [];
			paths.each(function(i, el){
				var pathEl = $(el);				
				letter.addPath( Path.factory( pathEl.attr('d'), pathEl.attr('id')).scale(SCALE) );
			});

			letter.setBounding();

			boundings.push(letter.bounding);

		});

		//console.log(boundings);
		//trouve le top absolu (top de la lettre la plus haute)
		var top = boundings.reduce(function(min, bounding){
			if(min === undefined || min > bounding[0][1]) {
				min = bounding[0][1];
			}
			return min;
		}, undefined);
		//console.log(top);
		//console.log(letters);

		var keys = Object.keys(letters);
		//ajuste le baseline de chaque lettre
		keys.forEach(function(key) {
			letters[key].setOffset([-1 * letters[key].bounding[0][0], -1 * top]);
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
		}
	};

	return Alphabet;
	
}));



},{"jquery":"jquery","lagrange/drawing/Path.js":5}],3:[function(require,module,exports){
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/DrawPath'.split('/');
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
		var el = stage.circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
	};

	var DrawPath = function(){

		var settings = {};
		var pathDef;
		var stage;

		var toRadians = function(degrees) {
		  return degrees * Math.PI / 180;
		};
		 
		// Converts from radians to degrees.
		var toDegrees = function(radians) {
		  return radians * 180 / Math.PI;
		};


		//prend la string des points SVG
		this.init = function(path, stageParam, params) {
			pathDef = path;
			stage = stageParam;
			_.extend(settings, defaults, params);
			return this;
		};

		this.show = function() {
			var path = pathDef.getSVGString();			
			var el = stage.path(path);
			el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});/**/
		};

		this.draw = function(pxPerSecond){
			var pathStr = pathDef.getSVGString();
			var length = pathDef.getLength();
			pxPerSecond = pxPerSecond || settings.pxPerSecond;
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
			
			var breakPoints = (function(){

				
				var distanceTreshold = 40;
				var angleTreshold = toRadians(12);

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
					showPoint(p, stage, rgb, 0.5);
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
			})();

			console.log(breakPoints);
			breakPoints.forEach(function(p){
				var pObj = Raphael.getPointAtLength(pathStr, p);
				showPoint(pObj, stage, '#00ff00', 3);
			});/**/

			var last = 0;
			var tl = breakPoints.reduce(function(tl, dist) {
				var time = (dist-last) / pxPerSecond;
				last = dist;
				return tl.to(anim, time, {to: dist, ease : settings.easing});
			}, new gsap.TimelineMax({
				onUpdate : update
			})).to(anim, ((length - (breakPoints[breakPoints.length-1]||0)) / pxPerSecond), {to: length, ease : settings.easing});

			return tl;

			return gsap.TweenMax.to(anim, time, {
				to : length,
				onUpdate : update,
				ease : settings.easing
			});
			
		};

		return this;

	};

	DrawPath.factory = function(o) {
		return DrawPath.apply(o || {});
	};

	/**
	Static. Returns a timelinemax of all the paths in the group, drawn one at a time.
	*/
	DrawPath.group = function(paths, stage, settings, onComplete) {

		return paths.reduce(function(tl, path){
			var drawingPath = DrawPath.factory().init(path, stage, settings);
			return tl.append(drawingPath.draw());
		}, new gsap.TimelineMax({ onComplete: (onComplete || function(){}) }));
	};

	return DrawPath;
	
}));



},{"gsap":"gsap","lodash":"lodash","raphael":"raphael"}],4:[function(require,module,exports){
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

			for(var i=0; i<name.length; i++) {
				var letter = name[i];
				if(letter === ' ') {
					right += Alphabet.getNSpace() * scale;
					continuous = false;
					continue;
				}
				var letterDef = Alphabet.getLetter(letter);
				letterDef = letterDef.scale(scale);
				//console.log(letterDef);
				
				var letterJoinedEnd = false;
				letterDef.paths.forEach(function(path) {
					var def = path.translate([right, top]);
					var joinedStart = def.name && def.name.indexOf('joina') > -1;
					var joinedEnd = /join(a?)b/.test(def.name);
					//console.log(letter, joinedStart, joinedEnd);
					letterJoinedEnd = letterJoinedEnd || joinedEnd;
					if(joinedStart && continuous) {
						//append au continuous
						continuous.append(def, letter);
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
				
				right += letterDef.bounding[1][0];
				//console.table([{letter:name[i], letterWidth: letter.bounding[1][0], total:right}]);	
			}

			return lines;

		}
	};

	return VectorWord;
	
}));



},{"rose/drawing/Alphabet.js":6}],5:[function(require,module,exports){
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

	var Path = function(svg, name, parsed) {
		this.svg = svg;
		this.name = name;
		//if(svg) console.log(svg, parsed);
		this.setParsed(parsed || this.parse(svg));
	};

	var refineBounding = function(bounding, point) {
		bounding[0] = bounding[0] || point.slice(0);
		bounding[1] = bounding[1] || point.slice(0);
		//top left
		if(point[0] < bounding[0][0]) bounding[0][0] = point[0];
		if(point[1] < bounding[0][1]) bounding[0][1] = point[1];
		//bottom right
		if(point[0] > bounding[1][0]) bounding[1][0] = point[0];
		if(point[1] > bounding[1][1]) bounding[1][1] = point[1];
		return bounding;
	};


	Path.prototype.setSVG = function(svg) {
		this.svg = svg;
	};

	Path.prototype.setParsed = function(parsed) {
		//console.log(parsed);
		this.parsed = parsed;
		this.findBounding();
	};

	Path.prototype.getCubic = function() {
		return this.cubic || this.parseCubic();
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
	Parses an SVG path string to a list of segment definitions with ABSOLUTE positions using Raphael.path2curve
	*/
	Path.prototype.parse = function(svg) {
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
	Path.prototype.parseCubic = function() {
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
	Path.prototype.findBounding = function() {
		var bounding = this.bounding = this.parsed.reduce(function(bounding, p){
			var anchors = p.anchors;
			var point;
			if(anchors.length === 2) {
				point = [anchors[0], anchors[1]];
			} else if(anchors.length === 6) {
				point = [anchors[4], anchors[5]];
			}
			return refineBounding(bounding, point);
		}, []);
		return bounding;
	};


	Path.prototype.translate = function(offset) {
		var parsed = this.parsed.map(function(def) {
			var newDef = Object.create(def);
			newDef.anchors = def.anchors.map(function(coord, i){
				return coord += offset[i%2];
			});
			return newDef;
		});
		return Path.factory(null, this.name, parsed);
	};

	Path.prototype.scale = function(ratio) {
		var parsed = this.parsed.map(function(def) {
			var newDef = Object.create(def);
			newDef.anchors = def.anchors.map(function(coord, i){
				return coord *= ratio;
			});
			return newDef;
		});
		return Path.factory(null, this.name, parsed);
	};

	Path.prototype.append = function(part, name) {
		//console.log(part);
		if(name) this.name += name;
		this.setParsed(this.parsed.concat(part.parsed.slice(1)));
	};

	Path.prototype.refineBounding = refineBounding;

	Path.factory = function(svg, name, parsed) {
		return new Path(svg, name, parsed);
	};

	return Path;

}));



},{"raphael":"raphael"}],6:[function(require,module,exports){
module.exports=require(2)
},{"/Users/lagrange/git/lab/alphabet/node_modules/app/rose/drawing/Alphabet.js":2,"jquery":"jquery","lagrange/drawing/Path.js":5}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0XG5cdHZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XG5cdHZhciBSYXBoYWVsID0gcmVxdWlyZSgncmFwaGFlbCcpO1xuXHR2YXIgRHJhd1BhdGggPSByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL0RyYXdQYXRoLmpzJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzJyk7XG5cdHZhciBBbHBoYWJldCA9IHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKTtcblx0dmFyIFR3ZWVuTWF4ID0gcmVxdWlyZSgnZ3NhcCcpO1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBXID0gMTQwMDtcblx0dmFyIEggPSAxMjAwO1xuXG5cdHZhciBzY2FsZUZhY3RvciA9IDE7XG5cblx0dmFyIG5hbWVzID0gW1wiSmVzc2ljYSBXYW5uaW5nXCIsXCJKdWxpYSBSb2Nrd2VsbFwiLFwiQ2Fyb2wgSHViYmFyZFwiLFwiUm9uYWxkIENhbmR5XCIsXCJKb2huIE5ld3RvblwiLFwiRWx2aXMgTmljb2xlXCIsXCJHbG9yaWEgV2VhdmVyXCIsXCJKdWxpYSBDcm9ua2l0ZVwiLFwiTW90aGVyIFJvZ2Vyc1wiLFwiQ2hldnkgSXJ3aW5cIixcIkVkZGllIEFsbGVuXCIsXCJOb3JtYW4gSmFja3NvblwiLFwiUGV0ZXIgUm9nZXJzXCIsXCJXZWlyZCBDaGFzZVwiLFwiQ29saW4gTWF5c1wiLFwiTmFwb2xlb24gTWFydGluXCIsXCJFZGdhciBTaW1wc29uXCIsXCJNb2hhbW1hZCBNY0NhcnRuZXlcIixcIkxpYmVyYWNlIFdpbGxpYW1zXCIsXCJGaWVsZHMgQnVybmV0dFwiLFwiU3RldmUgQXNoZVwiLFwiQ2FycmllIENoYXJsZXNcIixcIlRvbW15IFBhc3RldXJcIixcIkVkZGllIFNpbHZlcnN0b25lXCIsXCJPcHJhaCBBc2hlXCIsXCJSYXkgQmFsbFwiLFwiSmltIERpYW5hXCIsXCJNaWNoZWxhbmdlbG8gRWFzdHdvb2RcIixcIkdlb3JnZSBTaW1wc29uXCIsXCJBbGljaWEgQXVzdGVuXCIsXCJKZXNzaWNhIE5pY29sZVwiLFwiTWFyaWx5biBFdmVyZXR0XCIsXCJLZWl0aCBFYXN0d29vZFwiLFwiUGFibG8gRWFzdHdvb2RcIixcIlBleXRvbiBMdXRoZXJcIixcIk1vemFydCBBcm1zdHJvbmdcIixcIk1pY2hhZWwgQnVybmV0dFwiLFwiS2VpdGggR2xvdmVyXCIsXCJFbGl6YWJldGggQ2hpbGRcIixcIk1pbGVzIEFzdGFpcmVcIixcIkFuZHkgRWRpc29uXCIsXCJNYXJ0aW4gTGVubm9uXCIsXCJUb20gUGljY2Fzb1wiLFwiQmV5b25jZSBEaXNuZXlcIixcIlBldGVyIENsaW50b25cIixcIkhlbnJ5IEtlbm5lZHlcIixcIlBhdWwgQ2hpbGRcIixcIkxld2lzIFNhZ2FuXCIsXCJNaWNoZWxhbmdlbG8gTGVlXCIsXCJNYXJpbHluIEZpc2hlclwiXTtcblx0ZnVuY3Rpb24gU2h1ZmZsZShvKSB7XG5cdFx0Zm9yKHZhciBqLCB4LCBpID0gby5sZW5ndGg7IGk7IGogPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogaSksIHggPSBvWy0taV0sIG9baV0gPSBvW2pdLCBvW2pdID0geCk7XG5cdFx0cmV0dXJuIG87XG5cdH07XG5cdC8vU2h1ZmZsZShuYW1lcyk7XG5cdG5hbWVzLmxlbmd0aCA9IDE7LyoqL1xuXG5cdC8vbmFtZXMgPSBbJ2FrJ107XG5cblxuXHR2YXIgZ2V0U3RhZ2UgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgc3RhZ2U7XG5cdFx0dmFyIGluaXQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIFJhcGhhZWwoXCJzdmdcIiwgVywgSCk7XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzdGFnZSA9IHN0YWdlIHx8IGluaXQoKTtcblx0XHR9XG5cdH0pKCk7XG5cblx0dmFyIGRvRHJhdyA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGluY3IgPSBIIC8gbmFtZXMubGVuZ3RoO1xuXHRcdG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSwgayl7XG5cdFx0XHQvL3RyYWNlTmFtZShuYW1lLCAwLCBrICogaW5jcik7XG5cblx0XHRcdHZhciBwYXRocyA9IFZlY3RvcldvcmQuZ2V0UGF0aHMobmFtZSwgMCwgayAqIGluY3IsIHNjYWxlRmFjdG9yKTtcblx0XHRcdHZhciBzdGFydCA9IG5ldyBEYXRlKCk7XG5cdFx0XHREcmF3UGF0aC5ncm91cChwYXRocywgZ2V0U3RhZ2UoKSwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IDIwMCxcblx0XHRcdFx0Y29sb3IgOiAnIzQ0NDQ0NCcsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogMixcblx0XHRcdFx0ZWFzaW5nIDogZ3NhcC5TaW5lLmVhc2VJbk91dFxuXHRcdFx0fSk7XG5cblx0XHRcdHZhciBlbmQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coZW5kLXN0YXJ0KTtcblxuXHRcdH0pO1xuXG5cdH07XG5cblx0dmFyIGxvYWRpbmcgPSBBbHBoYWJldC5pbml0KCk7XHRcblx0dmFyIGJ0biA9ICQoJyNjdHJsJyk7XG5cblx0YnRuLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0FscGhhYmV0Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnbGFncmFuZ2UvZHJhd2luZy9QYXRoLmpzJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIFBhdGgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9vcmlnaW5hbCBzY2FsZSBmYWN0b3Jcblx0dmFyIFNDQUxFID0gMTtcblx0dmFyIHN2Z0ZpbGUgPSAnYXNzZXRzL2FscGhhYmV0LnN2Zyc7XG5cblx0dmFyIGxldHRlcnMgPSB7fTtcblxuXHR2YXIgTGV0dGVyID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0fTtcblxuXHRMZXR0ZXIucHJvdG90eXBlLnNldEJvdW5kaW5nID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXRocy5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHBhdGgpe1xuXHRcdFx0dmFyIHBhdGhCb3VuZGluZyA9IHBhdGguZmluZEJvdW5kaW5nKCk7XG5cdFx0XHRib3VuZGluZyA9IGJvdW5kaW5nIHx8IHBhdGhCb3VuZGluZztcblx0XHRcdGJvdW5kaW5nID0gUGF0aC5wcm90b3R5cGUucmVmaW5lQm91bmRpbmcoYm91bmRpbmcsIHBhdGhCb3VuZGluZyk7XG5cdFx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdFx0fSwgdW5kZWZpbmVkKTtcblx0XHRpZih0aGlzLmJvdHRvbVJpZ2h0KSB7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuYm90dG9tUmlnaHQucGFyc2VkWzBdLmFuY2hvcnM7XG5cdFx0XHR0aGlzLmJvdW5kaW5nWzFdID0gW2FuY2hvcnNbMF0sIGFuY2hvcnNbMV1dO1xuXHRcdH1cblx0fTtcblxuXHRMZXR0ZXIucHJvdG90eXBlLmFkZFBhdGggPSBmdW5jdGlvbihwKXtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocyB8fCBbXTtcblx0XHRpZihwLm5hbWUgJiYgcC5uYW1lLmluZGV4T2YoJ2VuZCcpID09PSAwKSB7XG5cdFx0XHR0aGlzLmJvdHRvbVJpZ2h0ID0gcDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wYXRocy5wdXNoKHApO1xuXHRcdH1cblx0fTtcblxuXHRMZXR0ZXIucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZ1sxXVswXTtcblx0fTtcblxuXHRMZXR0ZXIucHJvdG90eXBlLnNldE9mZnNldCA9IGZ1bmN0aW9uKG9mZnNldCl7XG5cdFx0dGhpcy5vZmZzZXQgPSBvZmZzZXQ7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMubWFwKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRwYXRoID0gcGF0aC50cmFuc2xhdGUob2Zmc2V0KTtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRyZXR1cm4gcGF0aDtcblx0XHR9KTtcblx0XHR0aGlzLmJvdHRvbVJpZ2h0ID0gKHRoaXMuYm90dG9tUmlnaHQgJiYgdGhpcy5ib3R0b21SaWdodC50cmFuc2xhdGUob2Zmc2V0KSk7XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBsZXR0ZXIsIHNjYWxlZFxuXHRMZXR0ZXIucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuXHRcdGlmKCF0aGlzLnBhdGhzKSByZXR1cm4gdGhpcztcblx0XHR2YXIgc2NhbGVkID0gbmV3IExldHRlcih0aGlzLm5hbWUpO1xuXHRcdHRoaXMucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKXtcblx0XHRcdHNjYWxlZC5hZGRQYXRoKHBhdGguc2NhbGUoc2NhbGUpKTtcblx0XHR9KTtcblx0XHRzY2FsZWQuYm90dG9tUmlnaHQgPSAodGhpcy5ib3R0b21SaWdodCAmJiB0aGlzLmJvdHRvbVJpZ2h0LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnNldEJvdW5kaW5nKCk7XG5cdFx0cmV0dXJuIHNjYWxlZDtcblx0fTtcblxuXG5cdHZhciBwYXJzZVNWRyA9IGZ1bmN0aW9uKGRhdGEpe1xuXHRcdHZhciBib3VuZGluZ3MgPSBbXTtcblxuXHRcdC8vY29uc29sZS5sb2coZGF0YSk7XG5cdFx0dmFyIGRvYyA9ICQoZGF0YSk7XG5cdFx0dmFyIGxheWVycyA9IGRvYy5maW5kKCdnJyk7XG5cdFx0bGF5ZXJzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0dmFyIGxheWVyID0gJChlbCk7XG5cdFx0XHR2YXIgaWQgPSBsYXllci5hdHRyKCdpZCcpO1xuXG5cdFx0XHRpZihpZCA9PSAnX3gyRF8nKSB7XG5cdFx0XHRcdGlkID0gJy0nO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZihpZC5sZW5ndGggPiAxKSByZXR1cm47XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBsZXR0ZXJzW2lkXSA9IG5ldyBMZXR0ZXIoaWQpO1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBsYXllci5maW5kKCdwYXRoJyk7XG5cdFx0XHQvL2lmKHBhdGhzLmxlbmd0aD09MCkgY29uc29sZS5sb2cobGF5ZXIpO1xuXHRcdFx0dmFyIGxldHRlclBhdGhzQm91bmRpbmcgPSBbXTtcblx0XHRcdHBhdGhzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0XHR2YXIgcGF0aEVsID0gJChlbCk7XHRcdFx0XHRcblx0XHRcdFx0bGV0dGVyLmFkZFBhdGgoIFBhdGguZmFjdG9yeSggcGF0aEVsLmF0dHIoJ2QnKSwgcGF0aEVsLmF0dHIoJ2lkJykpLnNjYWxlKFNDQUxFKSApO1xuXHRcdFx0fSk7XG5cblx0XHRcdGxldHRlci5zZXRCb3VuZGluZygpO1xuXG5cdFx0XHRib3VuZGluZ3MucHVzaChsZXR0ZXIuYm91bmRpbmcpO1xuXG5cdFx0fSk7XG5cblx0XHQvL2NvbnNvbGUubG9nKGJvdW5kaW5ncyk7XG5cdFx0Ly90cm91dmUgbGUgdG9wIGFic29sdSAodG9wIGRlIGxhIGxldHRyZSBsYSBwbHVzIGhhdXRlKVxuXHRcdHZhciB0b3AgPSBib3VuZGluZ3MucmVkdWNlKGZ1bmN0aW9uKG1pbiwgYm91bmRpbmcpe1xuXHRcdFx0aWYobWluID09PSB1bmRlZmluZWQgfHwgbWluID4gYm91bmRpbmdbMF1bMV0pIHtcblx0XHRcdFx0bWluID0gYm91bmRpbmdbMF1bMV07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWluO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0Ly9jb25zb2xlLmxvZyh0b3ApO1xuXHRcdC8vY29uc29sZS5sb2cobGV0dGVycyk7XG5cblx0XHR2YXIga2V5cyA9IE9iamVjdC5rZXlzKGxldHRlcnMpO1xuXHRcdC8vYWp1c3RlIGxlIGJhc2VsaW5lIGRlIGNoYXF1ZSBsZXR0cmVcblx0XHRrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRsZXR0ZXJzW2tleV0uc2V0T2Zmc2V0KFstMSAqIGxldHRlcnNba2V5XS5ib3VuZGluZ1swXVswXSwgLTEgKiB0b3BdKTtcblx0XHR9KTtcblxuXG5cdH07XG5cblx0dmFyIGRvTG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGxvYWRpbmcgPSAkLmFqYXgoe1xuXHRcdFx0dXJsIDogc3ZnRmlsZSxcblx0XHRcdGRhdGFUeXBlIDogJ3RleHQnXG5cdFx0fSk7XG5cblx0XHRsb2FkaW5nLnRoZW4ocGFyc2VTVkcsIGZ1bmN0aW9uKGEsIGIsIGMpe1xuXHRcdFx0Y29uc29sZS5sb2coJ2Vycm9yIGxvYWQnKTtcblx0XHRcdGNvbnNvbGUubG9nKGIpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhjKTtcblx0XHRcdC8vY29uc29sZS5sb2coYS5yZXNwb25zZVRleHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGxvYWRpbmcucHJvbWlzZSgpO1xuXG5cdH07XG5cblx0dmFyIEFscGhhYmV0ID0ge1xuXHRcdGluaXQgOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBkb0xvYWQoKTtcblx0XHR9LFxuXHRcdGdldExldHRlciA6IGZ1bmN0aW9uKGwpe1xuXHRcdFx0cmV0dXJuIGxldHRlcnNbbF07XG5cdFx0fSxcblx0XHRnZXROU3BhY2UgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIGxldHRlcnNbJ24nXS5nZXRXaWR0aCgpO1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gQWxwaGFiZXQ7XG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdyb3NlL2RyYXdpbmcvRHJhd1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSwgcmVxdWlyZSgnZ3NhcCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290Ll8sIHJvb3QuUmFwaGFlbCwgKHJvb3QuR3JlZW5Tb2NrR2xvYmFscyB8fCByb290KSk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKF8sIFJhcGhhZWwsIFR3ZWVuTWF4KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vZ3NhcCBleHBvcnRzIFR3ZWVuTWF4XG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBkZWZhdWx0cyA9IHtcblx0XHRjb2xvcjogJyMwMDAwMDAnLFxuXHRcdHN0cm9rZVdpZHRoIDogMC42LFxuXHRcdHB4UGVyU2Vjb25kIDogMTAwLCAvL3NwZWVkIG9mIGRyYXdpbmdcblx0XHRlYXNpbmcgOiBnc2FwLlF1YWQuZWFzZUluXG5cdH07XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBzdGFnZSwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpO1xuXHRcdGVsLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdH07XG5cblx0dmFyIERyYXdQYXRoID0gZnVuY3Rpb24oKXtcblxuXHRcdHZhciBzZXR0aW5ncyA9IHt9O1xuXHRcdHZhciBwYXRoRGVmO1xuXHRcdHZhciBzdGFnZTtcblxuXHRcdHZhciB0b1JhZGlhbnMgPSBmdW5jdGlvbihkZWdyZWVzKSB7XG5cdFx0ICByZXR1cm4gZGVncmVlcyAqIE1hdGguUEkgLyAxODA7XG5cdFx0fTtcblx0XHQgXG5cdFx0Ly8gQ29udmVydHMgZnJvbSByYWRpYW5zIHRvIGRlZ3JlZXMuXG5cdFx0dmFyIHRvRGVncmVlcyA9IGZ1bmN0aW9uKHJhZGlhbnMpIHtcblx0XHQgIHJldHVybiByYWRpYW5zICogMTgwIC8gTWF0aC5QSTtcblx0XHR9O1xuXG5cblx0XHQvL3ByZW5kIGxhIHN0cmluZyBkZXMgcG9pbnRzIFNWR1xuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uKHBhdGgsIHN0YWdlUGFyYW0sIHBhcmFtcykge1xuXHRcdFx0cGF0aERlZiA9IHBhdGg7XG5cdFx0XHRzdGFnZSA9IHN0YWdlUGFyYW07XG5cdFx0XHRfLmV4dGVuZChzZXR0aW5ncywgZGVmYXVsdHMsIHBhcmFtcyk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXG5cdFx0dGhpcy5zaG93ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcGF0aCA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XHRcdFx0XG5cdFx0XHR2YXIgZWwgPSBzdGFnZS5wYXRoKHBhdGgpO1xuXHRcdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc2V0dGluZ3Muc3Ryb2tlV2lkdGgsIHN0cm9rZTogc2V0dGluZ3MuY29sb3J9KTsvKiovXG5cdFx0fTtcblxuXHRcdHRoaXMuZHJhdyA9IGZ1bmN0aW9uKHB4UGVyU2Vjb25kKXtcblx0XHRcdHZhciBwYXRoU3RyID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdHZhciBsZW5ndGggPSBwYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdFx0cHhQZXJTZWNvbmQgPSBweFBlclNlY29uZCB8fCBzZXR0aW5ncy5weFBlclNlY29uZDtcblx0XHRcdHZhciB0aW1lID0gbGVuZ3RoIC8gcHhQZXJTZWNvbmQ7XG5cblx0XHRcdHZhciBhbmltID0ge3RvOiAwfTtcblx0XHRcdFxuXHRcdFx0dmFyIHVwZGF0ZSA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgZWw7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBhbmltLnRvKTtcblx0XHRcdFx0XHRpZihlbCkgZWwucmVtb3ZlKCk7XG5cdFx0XHRcdFx0ZWwgPSBzdGFnZS5wYXRoKHBhdGhQYXJ0KTtcblx0XHRcdFx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzZXR0aW5ncy5zdHJva2VXaWR0aCwgc3Ryb2tlOiBzZXR0aW5ncy5jb2xvcn0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSkoKTtcblx0XHRcdFxuXHRcdFx0dmFyIGJyZWFrUG9pbnRzID0gKGZ1bmN0aW9uKCl7XG5cblx0XHRcdFx0XG5cdFx0XHRcdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdFx0XHRcdHZhciBhbmdsZVRyZXNob2xkID0gdG9SYWRpYW5zKDEyKTtcblxuXHRcdFx0XHR2YXIgcG9pbnRQb3MgPSBbXTtcblx0XHRcdFx0XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgcHJlY2lzaW9uID0gMTtcblx0XHRcdFx0dmFyIHByZXY7XG5cdFx0XHRcdHZhciBhbGxQb2ludHMgPSBbXTtcblx0XHRcdFx0Zm9yKHZhciBpPXByZWNpc2lvbjsgaTw9bGVuZ3RoOyBpICs9IHByZWNpc2lvbikge1xuXHRcdFx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdC8vaXQgc2VlbXMgdGhhdCBSYXBoYWVsJ3MgYWxwaGEgaXMgaW5jb25zaXN0ZW50Li4uIHNvbWV0aW1lcyBvdmVyIDM2MFxuXHRcdFx0XHRcdHZhciBhbHBoYSA9IE1hdGguYWJzKCBNYXRoLmFzaW4oIE1hdGguc2luKHRvUmFkaWFucyhwLmFscGhhKSkgKSk7XG5cdFx0XHRcdFx0aWYocHJldikge1xuXHRcdFx0XHRcdFx0cC5kaWZmID0gTWF0aC5hYnMoYWxwaGEgLSBwcmV2KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0cC5kaWZmID0gMDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cHJldiA9IGFscGhhO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cocC5kaWZmKTtcblxuXHRcdFx0XHRcdGlmKHAuZGlmZiA+IGFuZ2xlVHJlc2hvbGQpIHtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coaSk7XG5cdFx0XHRcdFx0XHRwb2ludFBvcy5wdXNoKGkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdC8vcC5jb21wdXRlZEFscGhhID0gYWxwaGE7XG5cdFx0XHRcdFx0Ly9hbGxQb2ludHMucHVzaChwKTtcblxuXHRcdFx0XHR9LyoqL1xuXG5cdFx0XHRcdCAvKlxuXHRcdFx0XHQvL0RFQlVHIFxuXHRcdFx0XHQvL2ZpbmQgbWF4IGN1cnZhdHVyZSB0aGF0IGlzIG5vdCBhIGN1c3AgKHRyZXNob2xkIGRldGVybWluZXMgY3VzcClcblx0XHRcdFx0dmFyIGN1c3BUcmVzaG9sZCA9IDQwO1xuXHRcdFx0XHR2YXIgbWF4ID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihtLCBwKXtcblx0XHRcdFx0XHRyZXR1cm4gcC5kaWZmID4gbSAmJiBwLmRpZmYgPCBjdXNwVHJlc2hvbGQgPyBwLmRpZmYgOiBtO1xuXHRcdFx0XHR9LCAwKTtcblx0XHRcdFx0Y29uc29sZS5sb2cobWF4KTtcblxuXHRcdFx0XHR2YXIgcHJldiA9IFswLDAsMCwwXTtcblx0XHRcdFx0YWxsUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHRcdFx0dmFyIHIgPSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdFx0XHR2YXIgZyA9IDI1NSAtIE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0XHRcdHZhciByZ2IgPSAncmdiKCcrcisnLCcrZysnLDApJztcblx0XHRcdFx0XHRpZihyPjEwMCkge1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJz09PT09PT09PT0nKTtcblx0XHRcdFx0XHRcdHByZXYuZm9yRWFjaChmdW5jdGlvbihwKXtjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEpO30pO1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhLCByZ2IpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRwLnkgKz0gMTUwO1xuXHRcdFx0XHRcdHNob3dQb2ludChwLCBzdGFnZSwgcmdiLCAwLjUpO1xuXHRcdFx0XHRcdHByZXZbM10gPSBwcmV2WzJdO1xuXHRcdFx0XHRcdHByZXZbMl0gPSBwcmV2WzFdO1xuXHRcdFx0XHRcdHByZXZbMV0gPSBwcmV2WzBdO1xuXHRcdFx0XHRcdHByZXZbMF0gPSBwO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0LyoqL1xuXG5cdFx0XHRcdC8vZmluZHMgZ3JvdXBzIG9mIHBvaW50cyBkZXBlbmRpbmcgb24gdHJlc2hvbGQsIGFuZCBmaW5kIHRoZSBtaWRkbGUgb2YgZWFjaCBncm91cFxuXHRcdFx0XHRyZXR1cm4gcG9pbnRQb3MucmVkdWNlKGZ1bmN0aW9uKHBvaW50cywgcG9pbnQpe1xuXG5cdFx0XHRcdFx0dmFyIGxhc3QgPSBwb2ludHNbcG9pbnRzLmxlbmd0aC0xXTtcblx0XHRcdFx0XHRpZighbGFzdCB8fCBwb2ludCAtIGxhc3RbbGFzdC5sZW5ndGgtMV0gPiBkaXN0YW5jZVRyZXNob2xkKXtcblx0XHRcdFx0XHRcdGxhc3QgPSBbcG9pbnRdO1xuXHRcdFx0XHRcdFx0cG9pbnRzLnB1c2gobGFzdCk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxhc3QucHVzaChwb2ludCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIHBvaW50cztcblx0XHRcdFx0fSwgW10pLm1hcChmdW5jdGlvbihwb2ludHMpe1xuXHRcdFx0XHRcdHJldHVybiBwb2ludHNbTWF0aC5mbG9vcihwb2ludHMubGVuZ3RoLzIpXTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KSgpO1xuXG5cdFx0XHRjb25zb2xlLmxvZyhicmVha1BvaW50cyk7XG5cdFx0XHRicmVha1BvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwKTtcblx0XHRcdFx0c2hvd1BvaW50KHBPYmosIHN0YWdlLCAnIzAwZmYwMCcsIDMpO1xuXHRcdFx0fSk7LyoqL1xuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHR2YXIgdGwgPSBicmVha1BvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIHB4UGVyU2Vjb25kO1xuXHRcdFx0XHRsYXN0ID0gZGlzdDtcblx0XHRcdFx0cmV0dXJuIHRsLnRvKGFuaW0sIHRpbWUsIHt0bzogZGlzdCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe1xuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZVxuXHRcdFx0fSkpLnRvKGFuaW0sICgobGVuZ3RoIC0gKGJyZWFrUG9pbnRzW2JyZWFrUG9pbnRzLmxlbmd0aC0xXXx8MCkpIC8gcHhQZXJTZWNvbmQpLCB7dG86IGxlbmd0aCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXG5cdFx0XHRyZXR1cm4gdGw7XG5cblx0XHRcdHJldHVybiBnc2FwLlR3ZWVuTWF4LnRvKGFuaW0sIHRpbWUsIHtcblx0XHRcdFx0dG8gOiBsZW5ndGgsXG5cdFx0XHRcdG9uVXBkYXRlIDogdXBkYXRlLFxuXHRcdFx0XHRlYXNlIDogc2V0dGluZ3MuZWFzaW5nXG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdERyYXdQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihvKSB7XG5cdFx0cmV0dXJuIERyYXdQYXRoLmFwcGx5KG8gfHwge30pO1xuXHR9O1xuXG5cdC8qKlxuXHRTdGF0aWMuIFJldHVybnMgYSB0aW1lbGluZW1heCBvZiBhbGwgdGhlIHBhdGhzIGluIHRoZSBncm91cCwgZHJhd24gb25lIGF0IGEgdGltZS5cblx0Ki9cblx0RHJhd1BhdGguZ3JvdXAgPSBmdW5jdGlvbihwYXRocywgc3RhZ2UsIHNldHRpbmdzLCBvbkNvbXBsZXRlKSB7XG5cblx0XHRyZXR1cm4gcGF0aHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBwYXRoKXtcblx0XHRcdHZhciBkcmF3aW5nUGF0aCA9IERyYXdQYXRoLmZhY3RvcnkoKS5pbml0KHBhdGgsIHN0YWdlLCBzZXR0aW5ncyk7XG5cdFx0XHRyZXR1cm4gdGwuYXBwZW5kKGRyYXdpbmdQYXRoLmRyYXcoKSk7XG5cdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoeyBvbkNvbXBsZXRlOiAob25Db21wbGV0ZSB8fCBmdW5jdGlvbigpe30pIH0pKTtcblx0fTtcblxuXHRyZXR1cm4gRHJhd1BhdGg7XG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdyb3NlL2RyYXdpbmcvVmVjdG9yV29yZCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvc2UuZHJhd2luZy5BbHBoYWJldCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKEFscGhhYmV0KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdFxuXHR2YXIgVmVjdG9yV29yZCA9IHtcblx0XHRnZXRQYXRocyA6IGZ1bmN0aW9uKG5hbWUsIHJpZ2h0LCB0b3AsIHNjYWxlKSB7XG5cdFx0XHRyaWdodCA9IHJpZ2h0IHx8IDA7XG5cdFx0XHR0b3AgPSB0b3AgfHwgMDtcblxuXHRcdFx0dmFyIGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdHZhciBsaW5lcyA9IFtdO1xuXG5cdFx0XHRmb3IodmFyIGk9MDsgaTxuYW1lLmxlbmd0aDsgaSsrKcKge1xuXHRcdFx0XHR2YXIgbGV0dGVyID0gbmFtZVtpXTtcblx0XHRcdFx0aWYobGV0dGVyID09PSAnICcpIHtcblx0XHRcdFx0XHRyaWdodCArPSBBbHBoYWJldC5nZXROU3BhY2UoKSAqIHNjYWxlO1xuXHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgbGV0dGVyRGVmID0gQWxwaGFiZXQuZ2V0TGV0dGVyKGxldHRlcik7XG5cdFx0XHRcdGxldHRlckRlZiA9IGxldHRlckRlZi5zY2FsZShzY2FsZSk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyRGVmKTtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBsZXR0ZXJKb2luZWRFbmQgPSBmYWxzZTtcblx0XHRcdFx0bGV0dGVyRGVmLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0XHRcdHZhciBkZWYgPSBwYXRoLnRyYW5zbGF0ZShbcmlnaHQsIHRvcF0pO1xuXHRcdFx0XHRcdHZhciBqb2luZWRTdGFydCA9IGRlZi5uYW1lICYmIGRlZi5uYW1lLmluZGV4T2YoJ2pvaW5hJykgPiAtMTtcblx0XHRcdFx0XHR2YXIgam9pbmVkRW5kID0gL2pvaW4oYT8pYi8udGVzdChkZWYubmFtZSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXIsIGpvaW5lZFN0YXJ0LCBqb2luZWRFbmQpO1xuXHRcdFx0XHRcdGxldHRlckpvaW5lZEVuZCA9IGxldHRlckpvaW5lZEVuZCB8fCBqb2luZWRFbmQ7XG5cdFx0XHRcdFx0aWYoam9pbmVkU3RhcnQgJiYgY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9hcHBlbmQgYXUgY29udGludW91c1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5hcHBlbmQoZGVmLCBsZXR0ZXIpO1xuXHRcdFx0XHRcdH0gZWxzZSBpZihqb2luZWRFbmQgJiYgIWNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vc3RhcnQgdW4gbm91dmVhdSBsaW5lXG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZGVmO1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5uYW1lID0gbGV0dGVyO1xuXHRcdFx0XHRcdFx0bGluZXMucHVzaChjb250aW51b3VzKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bGluZXMucHVzaChkZWYpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKCFsZXR0ZXJKb2luZWRFbmQpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRyaWdodCArPSBsZXR0ZXJEZWYuYm91bmRpbmdbMV1bMF07XG5cdFx0XHRcdC8vY29uc29sZS50YWJsZShbe2xldHRlcjpuYW1lW2ldLCBsZXR0ZXJXaWR0aDogbGV0dGVyLmJvdW5kaW5nWzFdWzBdLCB0b3RhbDpyaWdodH1dKTtcdFxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbGluZXM7XG5cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFZlY3RvcldvcmQ7XG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByZWcgPSAvKFthLXpdKShbMC05XFxzXFwsXFwuXFwtXSspL2dpO1xuXHRcdFxuXHQvL2V4cGVjdGVkIGxlbmd0aCBvZiBlYWNoIHR5cGVcblx0dmFyIGV4cGVjdGVkTGVuZ3RocyA9IHtcblx0XHRtIDogMixcblx0XHRsIDogMixcblx0XHR2IDogMSxcblx0XHRoIDogMSxcblx0XHRjIDogNixcblx0XHRzIDogNFxuXHR9O1xuXG5cdHZhciBQYXRoID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQpIHtcblx0XHR0aGlzLnN2ZyA9IHN2Zztcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdC8vaWYoc3ZnKSBjb25zb2xlLmxvZyhzdmcsIHBhcnNlZCk7XG5cdFx0dGhpcy5zZXRQYXJzZWQocGFyc2VkIHx8IHRoaXMucGFyc2Uoc3ZnKSk7XG5cdH07XG5cblx0dmFyIHJlZmluZUJvdW5kaW5nID0gZnVuY3Rpb24oYm91bmRpbmcsIHBvaW50KSB7XG5cdFx0Ym91bmRpbmdbMF0gPSBib3VuZGluZ1swXSB8fCBwb2ludC5zbGljZSgwKTtcblx0XHRib3VuZGluZ1sxXSA9IGJvdW5kaW5nWzFdIHx8IHBvaW50LnNsaWNlKDApO1xuXHRcdC8vdG9wIGxlZnRcblx0XHRpZihwb2ludFswXSA8IGJvdW5kaW5nWzBdWzBdKSBib3VuZGluZ1swXVswXSA9IHBvaW50WzBdO1xuXHRcdGlmKHBvaW50WzFdIDwgYm91bmRpbmdbMF1bMV0pIGJvdW5kaW5nWzBdWzFdID0gcG9pbnRbMV07XG5cdFx0Ly9ib3R0b20gcmlnaHRcblx0XHRpZihwb2ludFswXSA+IGJvdW5kaW5nWzFdWzBdKSBib3VuZGluZ1sxXVswXSA9IHBvaW50WzBdO1xuXHRcdGlmKHBvaW50WzFdID4gYm91bmRpbmdbMV1bMV0pIGJvdW5kaW5nWzFdWzFdID0gcG9pbnRbMV07XG5cdFx0cmV0dXJuIGJvdW5kaW5nO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUuc2V0U1ZHID0gZnVuY3Rpb24oc3ZnKSB7XG5cdFx0dGhpcy5zdmcgPSBzdmc7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuc2V0UGFyc2VkID0gZnVuY3Rpb24ocGFyc2VkKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJzZWQpO1xuXHRcdHRoaXMucGFyc2VkID0gcGFyc2VkO1xuXHRcdHRoaXMuZmluZEJvdW5kaW5nKCk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0Q3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jdWJpYyB8fCB0aGlzLnBhcnNlQ3ViaWMoKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLmdldFRvdGFsTGVuZ3RoKHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIGFuIFNWRyBzdHJpbmcgb2YgdGhlIHBhdGggc2VnZW1udHMuIEl0IGlzIG5vdCB0aGUgc3ZnIHByb3BlcnR5IG9mIHRoZSBwYXRoLCBhcyBpdCBpcyBwb3RlbnRpYWxseSB0cmFuc2Zvcm1lZFxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKHN2Zywgc2VnbWVudCl7XG5cdFx0XHRyZXR1cm4gc3ZnICsgc2VnbWVudC50eXBlICsgc2VnbWVudC5hbmNob3JzLmpvaW4oJywnKTsgXG5cdFx0fSwgJycpO1xuXHR9O1xuXG5cdC8qKlxuXHRQYXJzZXMgYW4gU1ZHIHBhdGggc3RyaW5nIHRvIGEgbGlzdCBvZiBzZWdtZW50IGRlZmluaXRpb25zIHdpdGggQUJTT0xVVEUgcG9zaXRpb25zIHVzaW5nIFJhcGhhZWwucGF0aDJjdXJ2ZVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5wYXJzZSA9IGZ1bmN0aW9uKHN2Zykge1xuXHRcdHZhciBjdXJ2ZSA9IFJhcGhhZWwucGF0aDJjdXJ2ZShzdmcpO1xuXHRcdHZhciBwYXRoID0gY3VydmUubWFwKGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHR5cGUgOiBwb2ludC5zaGlmdCgpLFxuXHRcdFx0XHRhbmNob3JzIDogcG9pbnRcblx0XHRcdH07XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHBhdGg7XG5cdH07XG5cblx0LyoqXG5cdFx0UGFyc2VzIGEgcGF0aCBkZWZpbmVkIGJ5IHBhcnNlUGF0aCB0byBhIGxpc3Qgb2YgYmV6aWVyIHBvaW50cyB0byBiZSB1c2VkIGJ5IEdyZWVuc29jayBCZXppZXIgcGx1Z2luLCBmb3IgZXhhbXBsZVxuXHRcdFR3ZWVuTWF4LnRvKHNwcml0ZSwgNTAwLCB7XG5cdFx0XHRiZXppZXI6e3R5cGU6XCJjdWJpY1wiLCB2YWx1ZXM6Y3ViaWN9LFxuXHRcdFx0ZWFzZTpRdWFkLmVhc2VJbk91dCxcblx0XHRcdHVzZUZyYW1lcyA6IHRydWVcblx0XHR9KTtcblx0XHQqL1xuXHRQYXRoLnByb3RvdHlwZS5wYXJzZUN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoKTtcblx0XHQvL2Fzc3VtZWQgZmlyc3QgZWxlbWVudCBpcyBhIG1vdmV0b1xuXHRcdHZhciBhbmNob3JzID0gdGhpcy5jdWJpYyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihhbmNob3JzLCBzZWdtZW50KXtcblx0XHRcdHZhciBhID0gc2VnbWVudC5hbmNob3JzO1xuXHRcdFx0aWYoc2VnbWVudC50eXBlPT09J00nKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OmFbMV19KTtcblx0XHRcdH0gZWxzZSBpZihzZWdtZW50LnR5cGU9PT0nTCcpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVsyXSwgeTogYVszXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbNF0sIHk6IGFbNV19KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBhbmNob3JzO1xuXG5cdFx0fSwgW10pO1xuXG5cdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0fTtcblxuXHQvL3Ryb3V2ZSBsZSBib3VuZGluZyBib3ggZCd1bmUgbGV0dHJlIChlbiBzZSBmaWFudCBqdXN0ZSBzdXIgbGVzIHBvaW50cy4uLiBvbiBuZSBjYWxjdWxlIHBhcyBvdSBwYXNzZSBsZSBwYXRoKVxuXHRQYXRoLnByb3RvdHlwZS5maW5kQm91bmRpbmcgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgYm91bmRpbmcgPSB0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKGJvdW5kaW5nLCBwKXtcblx0XHRcdHZhciBhbmNob3JzID0gcC5hbmNob3JzO1xuXHRcdFx0dmFyIHBvaW50O1xuXHRcdFx0aWYoYW5jaG9ycy5sZW5ndGggPT09IDIpIHtcblx0XHRcdFx0cG9pbnQgPSBbYW5jaG9yc1swXSwgYW5jaG9yc1sxXV07XG5cdFx0XHR9IGVsc2UgaWYoYW5jaG9ycy5sZW5ndGggPT09IDYpIHtcblx0XHRcdFx0cG9pbnQgPSBbYW5jaG9yc1s0XSwgYW5jaG9yc1s1XV07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmVmaW5lQm91bmRpbmcoYm91bmRpbmcsIHBvaW50KTtcblx0XHR9LCBbXSk7XG5cdFx0cmV0dXJuIGJvdW5kaW5nO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24ob2Zmc2V0KSB7XG5cdFx0dmFyIHBhcnNlZCA9IHRoaXMucGFyc2VkLm1hcChmdW5jdGlvbihkZWYpIHtcblx0XHRcdHZhciBuZXdEZWYgPSBPYmplY3QuY3JlYXRlKGRlZik7XG5cdFx0XHRuZXdEZWYuYW5jaG9ycyA9IGRlZi5hbmNob3JzLm1hcChmdW5jdGlvbihjb29yZCwgaSl7XG5cdFx0XHRcdHJldHVybiBjb29yZCArPSBvZmZzZXRbaSUyXTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIG5ld0RlZjtcblx0XHR9KTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KG51bGwsIHRoaXMubmFtZSwgcGFyc2VkKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHJhdGlvKSB7XG5cdFx0dmFyIHBhcnNlZCA9IHRoaXMucGFyc2VkLm1hcChmdW5jdGlvbihkZWYpIHtcblx0XHRcdHZhciBuZXdEZWYgPSBPYmplY3QuY3JlYXRlKGRlZik7XG5cdFx0XHRuZXdEZWYuYW5jaG9ycyA9IGRlZi5hbmNob3JzLm1hcChmdW5jdGlvbihjb29yZCwgaSl7XG5cdFx0XHRcdHJldHVybiBjb29yZCAqPSByYXRpbztcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIG5ld0RlZjtcblx0XHR9KTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KG51bGwsIHRoaXMubmFtZSwgcGFyc2VkKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihwYXJ0LCBuYW1lKcKge1xuXHRcdC8vY29uc29sZS5sb2cocGFydCk7XG5cdFx0aWYobmFtZSkgdGhpcy5uYW1lICs9IG5hbWU7XG5cdFx0dGhpcy5zZXRQYXJzZWQodGhpcy5wYXJzZWQuY29uY2F0KHBhcnQucGFyc2VkLnNsaWNlKDEpKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUucmVmaW5lQm91bmRpbmcgPSByZWZpbmVCb3VuZGluZztcblxuXHRQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCkge1xuXHRcdHJldHVybiBuZXcgUGF0aChzdmcsIG5hbWUsIHBhcnNlZCk7XG5cdH07XG5cblx0cmV0dXJuIFBhdGg7XG5cbn0pKTtcblxuXG4iXX0=
