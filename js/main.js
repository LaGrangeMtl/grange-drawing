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
	Shuffle(names);
	names.length = 1;/**/

	//names = ['abcdefg'];


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

			DrawPath.group(paths, getStage(), {
				pxPerSecond : 200,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeIn
			});

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
		el.attr({fill: color || '#ff0000'});
	};

	var DrawPath = function(){

		var settings = {};
		var pathDef;
		var stage;



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
			var time = length / (pxPerSecond || settings.pxPerSecond);

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
				var angleTreshold = 12;

				var lastAlpha, alpha, p, diff, pointPos = [];
				var max = length - distanceTreshold;
				for(var i=distanceTreshold; i<=max; i += 2) {
					//var pathPart = Raphael.getSubpath(pathStr, 0, i);
					p = Raphael.getPointAtLength(pathStr, i);
					alpha = p.alpha % 360;
					if(!lastAlpha) {
						lastAlpha = alpha;
						continue;
					}
					var dif = Math.abs(alpha - lastAlpha);
					//console.log(alpha, dif);
					if(dif > angleTreshold) {
						//console.log(alpha, alpha);
						//showPoint(p, stage, '#ff0000');
						pointPos.push(i);
					}
					lastAlpha = alpha;
				}
				//console.log(pointPos);

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
				showPoint(Raphael.getPointAtLength(pathStr, p), stage, '#00ff00', 2);
			});/**/

			var last = 0;
			var tl = breakPoints.reduce(function(tl, dist) {
				var time = (dist-last) / (pxPerSecond || settings.pxPerSecond);
				last = dist;
				return tl.to(anim, time, {to: dist, ease : settings.easing});
			}, new gsap.TimelineMax({
				onUpdate : update
			})).to(anim, ((length - (breakPoints[breakPoints.length-1]||0)) / (pxPerSecond || settings.pxPerSecond)), {to: length, ease : settings.easing});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHRcblx0dmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblx0dmFyIFJhcGhhZWwgPSByZXF1aXJlKCdyYXBoYWVsJyk7XG5cdHZhciBEcmF3UGF0aCA9IHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMnKTtcblx0dmFyIFZlY3RvcldvcmQgPSByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL1ZlY3RvcldvcmQuanMnKTtcblx0dmFyIEFscGhhYmV0ID0gcmVxdWlyZSgnYXBwL3Jvc2UvZHJhd2luZy9BbHBoYWJldC5qcycpO1xuXHR2YXIgVHdlZW5NYXggPSByZXF1aXJlKCdnc2FwJyk7XG5cblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIFcgPSAxNDAwO1xuXHR2YXIgSCA9IDEyMDA7XG5cblx0dmFyIHNjYWxlRmFjdG9yID0gMTtcblxuXHR2YXIgbmFtZXMgPSBbXCJKZXNzaWNhIFdhbm5pbmdcIixcIkp1bGlhIFJvY2t3ZWxsXCIsXCJDYXJvbCBIdWJiYXJkXCIsXCJSb25hbGQgQ2FuZHlcIixcIkpvaG4gTmV3dG9uXCIsXCJFbHZpcyBOaWNvbGVcIixcIkdsb3JpYSBXZWF2ZXJcIixcIkp1bGlhIENyb25raXRlXCIsXCJNb3RoZXIgUm9nZXJzXCIsXCJDaGV2eSBJcndpblwiLFwiRWRkaWUgQWxsZW5cIixcIk5vcm1hbiBKYWNrc29uXCIsXCJQZXRlciBSb2dlcnNcIixcIldlaXJkIENoYXNlXCIsXCJDb2xpbiBNYXlzXCIsXCJOYXBvbGVvbiBNYXJ0aW5cIixcIkVkZ2FyIFNpbXBzb25cIixcIk1vaGFtbWFkIE1jQ2FydG5leVwiLFwiTGliZXJhY2UgV2lsbGlhbXNcIixcIkZpZWxkcyBCdXJuZXR0XCIsXCJTdGV2ZSBBc2hlXCIsXCJDYXJyaWUgQ2hhcmxlc1wiLFwiVG9tbXkgUGFzdGV1clwiLFwiRWRkaWUgU2lsdmVyc3RvbmVcIixcIk9wcmFoIEFzaGVcIixcIlJheSBCYWxsXCIsXCJKaW0gRGlhbmFcIixcIk1pY2hlbGFuZ2VsbyBFYXN0d29vZFwiLFwiR2VvcmdlIFNpbXBzb25cIixcIkFsaWNpYSBBdXN0ZW5cIixcIkplc3NpY2EgTmljb2xlXCIsXCJNYXJpbHluIEV2ZXJldHRcIixcIktlaXRoIEVhc3R3b29kXCIsXCJQYWJsbyBFYXN0d29vZFwiLFwiUGV5dG9uIEx1dGhlclwiLFwiTW96YXJ0IEFybXN0cm9uZ1wiLFwiTWljaGFlbCBCdXJuZXR0XCIsXCJLZWl0aCBHbG92ZXJcIixcIkVsaXphYmV0aCBDaGlsZFwiLFwiTWlsZXMgQXN0YWlyZVwiLFwiQW5keSBFZGlzb25cIixcIk1hcnRpbiBMZW5ub25cIixcIlRvbSBQaWNjYXNvXCIsXCJCZXlvbmNlIERpc25leVwiLFwiUGV0ZXIgQ2xpbnRvblwiLFwiSGVucnkgS2VubmVkeVwiLFwiUGF1bCBDaGlsZFwiLFwiTGV3aXMgU2FnYW5cIixcIk1pY2hlbGFuZ2VsbyBMZWVcIixcIk1hcmlseW4gRmlzaGVyXCJdO1xuXHRmdW5jdGlvbiBTaHVmZmxlKG8pIHtcblx0XHRmb3IodmFyIGosIHgsIGkgPSBvLmxlbmd0aDsgaTsgaiA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiBpKSwgeCA9IG9bLS1pXSwgb1tpXSA9IG9bal0sIG9bal0gPSB4KTtcblx0XHRyZXR1cm4gbztcblx0fTtcblx0U2h1ZmZsZShuYW1lcyk7XG5cdG5hbWVzLmxlbmd0aCA9IDE7LyoqL1xuXG5cdC8vbmFtZXMgPSBbJ2FiY2RlZmcnXTtcblxuXG5cdHZhciBnZXRTdGFnZSA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBzdGFnZTtcblx0XHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gUmFwaGFlbChcInN2Z1wiLCBXLCBIKTtcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN0YWdlID0gc3RhZ2UgfHwgaW5pdCgpO1xuXHRcdH1cblx0fSkoKTtcblxuXHR2YXIgZG9EcmF3ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgaW5jciA9IEggLyBuYW1lcy5sZW5ndGg7XG5cdFx0bmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBrKXtcblx0XHRcdC8vdHJhY2VOYW1lKG5hbWUsIDAsIGsgKiBpbmNyKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gVmVjdG9yV29yZC5nZXRQYXRocyhuYW1lLCAwLCBrICogaW5jciwgc2NhbGVGYWN0b3IpO1xuXG5cdFx0XHREcmF3UGF0aC5ncm91cChwYXRocywgZ2V0U3RhZ2UoKSwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IDIwMCxcblx0XHRcdFx0Y29sb3IgOiAnIzQ0NDQ0NCcsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogMixcblx0XHRcdFx0ZWFzaW5nIDogZ3NhcC5TaW5lLmVhc2VJblxuXHRcdFx0fSk7XG5cblx0XHR9KTtcblxuXHR9O1xuXG5cdHZhciBsb2FkaW5nID0gQWxwaGFiZXQuaW5pdCgpO1x0XG5cdHZhciBidG4gPSAkKCcjY3RybCcpO1xuXG5cdGJ0bi5vbignY2xpY2suYWxwaGFiZXQnLCBmdW5jdGlvbigpe1xuXHRcdGxvYWRpbmcudGhlbihkb0RyYXcpO1xuXHR9KTtcblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9BbHBoYWJldCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcycpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGgpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBTQ0FMRSA9IDE7XG5cdHZhciBzdmdGaWxlID0gJ2Fzc2V0cy9hbHBoYWJldC5zdmcnO1xuXG5cdHZhciBsZXR0ZXJzID0ge307XG5cblx0dmFyIExldHRlciA9IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5zZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5ib3VuZGluZyA9IHRoaXMucGF0aHMucmVkdWNlKGZ1bmN0aW9uKGJvdW5kaW5nLCBwYXRoKXtcblx0XHRcdHZhciBwYXRoQm91bmRpbmcgPSBwYXRoLmZpbmRCb3VuZGluZygpO1xuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZyA9IFBhdGgucHJvdG90eXBlLnJlZmluZUJvdW5kaW5nKGJvdW5kaW5nLCBwYXRoQm91bmRpbmcpO1xuXHRcdFx0cmV0dXJuIGJvdW5kaW5nO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0aWYodGhpcy5ib3R0b21SaWdodCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmJvdHRvbVJpZ2h0LnBhcnNlZFswXS5hbmNob3JzO1xuXHRcdFx0dGhpcy5ib3VuZGluZ1sxXSA9IFthbmNob3JzWzBdLCBhbmNob3JzWzFdXTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5ib3R0b21SaWdodCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmdbMV1bMF07XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbihvZmZzZXQpe1xuXHRcdHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzLm1hcChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cGF0aCA9IHBhdGgudHJhbnNsYXRlKG9mZnNldCk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0fSk7XG5cdFx0dGhpcy5ib3R0b21SaWdodCA9ICh0aGlzLmJvdHRvbVJpZ2h0ICYmIHRoaXMuYm90dG9tUmlnaHQudHJhbnNsYXRlKG9mZnNldCkpO1xuXHRcdHRoaXMuc2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgbGV0dGVyLCBzY2FsZWRcblx0TGV0dGVyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcblx0XHRpZighdGhpcy5wYXRocykgcmV0dXJuIHRoaXM7XG5cdFx0dmFyIHNjYWxlZCA9IG5ldyBMZXR0ZXIodGhpcy5uYW1lKTtcblx0XHR0aGlzLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCl7XG5cdFx0XHRzY2FsZWQuYWRkUGF0aChwYXRoLnNjYWxlKHNjYWxlKSk7XG5cdFx0fSk7XG5cdFx0c2NhbGVkLmJvdHRvbVJpZ2h0ID0gKHRoaXMuYm90dG9tUmlnaHQgJiYgdGhpcy5ib3R0b21SaWdodC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zZXRCb3VuZGluZygpO1xuXHRcdHJldHVybiBzY2FsZWQ7XG5cdH07XG5cblxuXHR2YXIgcGFyc2VTVkcgPSBmdW5jdGlvbihkYXRhKXtcblx0XHR2YXIgYm91bmRpbmdzID0gW107XG5cblx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdHZhciBkb2MgPSAkKGRhdGEpO1xuXHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdHZhciBsYXllciA9ICQoZWwpO1xuXHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblxuXHRcdFx0aWYoaWQgPT0gJ194MkRfJykge1xuXHRcdFx0XHRpZCA9ICctJztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgbGV0dGVyID0gbGV0dGVyc1tpZF0gPSBuZXcgTGV0dGVyKGlkKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gbGF5ZXIuZmluZCgncGF0aCcpO1xuXHRcdFx0Ly9pZihwYXRocy5sZW5ndGg9PTApIGNvbnNvbGUubG9nKGxheWVyKTtcblx0XHRcdHZhciBsZXR0ZXJQYXRoc0JvdW5kaW5nID0gW107XG5cdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIHBhdGhFbCA9ICQoZWwpO1x0XHRcdFx0XG5cdFx0XHRcdGxldHRlci5hZGRQYXRoKCBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpKS5zY2FsZShTQ0FMRSkgKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXR0ZXIuc2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmdzLnB1c2gobGV0dGVyLmJvdW5kaW5nKTtcblxuXHRcdH0pO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhib3VuZGluZ3MpO1xuXHRcdC8vdHJvdXZlIGxlIHRvcCBhYnNvbHUgKHRvcCBkZSBsYSBsZXR0cmUgbGEgcGx1cyBoYXV0ZSlcblx0XHR2YXIgdG9wID0gYm91bmRpbmdzLnJlZHVjZShmdW5jdGlvbihtaW4sIGJvdW5kaW5nKXtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IGJvdW5kaW5nWzBdWzFdKSB7XG5cdFx0XHRcdG1pbiA9IGJvdW5kaW5nWzBdWzFdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdC8vY29uc29sZS5sb2codG9wKTtcblx0XHQvL2NvbnNvbGUubG9nKGxldHRlcnMpO1xuXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhsZXR0ZXJzKTtcblx0XHQvL2FqdXN0ZSBsZSBiYXNlbGluZSBkZSBjaGFxdWUgbGV0dHJlXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0bGV0dGVyc1trZXldLnNldE9mZnNldChbLTEgKiBsZXR0ZXJzW2tleV0uYm91bmRpbmdbMF1bMF0sIC0xICogdG9wXSk7XG5cdFx0fSk7XG5cblxuXHR9O1xuXG5cdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdHZhciBsb2FkaW5nID0gJC5hamF4KHtcblx0XHRcdHVybCA6IHN2Z0ZpbGUsXG5cdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdH0pO1xuXG5cdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhiKTtcblx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHR9O1xuXG5cdHZhciBBbHBoYWJldCA9IHtcblx0XHRpbml0IDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZG9Mb2FkKCk7XG5cdFx0fSxcblx0XHRnZXRMZXR0ZXIgOiBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzW2xdO1xuXHRcdH0sXG5cdFx0Z2V0TlNwYWNlIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0RyYXdQYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJyksIHJlcXVpcmUoJ2dzYXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5fLCByb290LlJhcGhhZWwsIChyb290LkdyZWVuU29ja0dsb2JhbHMgfHwgcm9vdCkpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChfLCBSYXBoYWVsLCBUd2Vlbk1heCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL2dzYXAgZXhwb3J0cyBUd2Vlbk1heFxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Y29sb3I6ICcjMDAwMDAwJyxcblx0XHRzdHJva2VXaWR0aCA6IDAuNixcblx0XHRweFBlclNlY29uZCA6IDEwMCwgLy9zcGVlZCBvZiBkcmF3aW5nXG5cdFx0ZWFzaW5nIDogZ3NhcC5RdWFkLmVhc2VJblxuXHR9O1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgc3RhZ2UsIGNvbG9yLCBzaXplKXtcblx0XHR2YXIgZWwgPSBzdGFnZS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKTtcblx0XHRlbC5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCd9KTtcblx0fTtcblxuXHR2YXIgRHJhd1BhdGggPSBmdW5jdGlvbigpe1xuXG5cdFx0dmFyIHNldHRpbmdzID0ge307XG5cdFx0dmFyIHBhdGhEZWY7XG5cdFx0dmFyIHN0YWdlO1xuXG5cblxuXHRcdC8vcHJlbmQgbGEgc3RyaW5nIGRlcyBwb2ludHMgU1ZHXG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24ocGF0aCwgc3RhZ2VQYXJhbSwgcGFyYW1zKSB7XG5cdFx0XHRwYXRoRGVmID0gcGF0aDtcblx0XHRcdHN0YWdlID0gc3RhZ2VQYXJhbTtcblx0XHRcdF8uZXh0ZW5kKHNldHRpbmdzLCBkZWZhdWx0cywgcGFyYW1zKTtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH07XG5cblx0XHR0aGlzLnNob3cgPSBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBwYXRoID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcdFx0XHRcblx0XHRcdHZhciBlbCA9IHN0YWdlLnBhdGgocGF0aCk7XG5cdFx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzZXR0aW5ncy5zdHJva2VXaWR0aCwgc3Ryb2tlOiBzZXR0aW5ncy5jb2xvcn0pOy8qKi9cblx0XHR9O1xuXG5cdFx0dGhpcy5kcmF3ID0gZnVuY3Rpb24ocHhQZXJTZWNvbmQpe1xuXHRcdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdFx0dmFyIGxlbmd0aCA9IHBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0XHR2YXIgdGltZSA9IGxlbmd0aCAvIChweFBlclNlY29uZCB8fCBzZXR0aW5ncy5weFBlclNlY29uZCk7XG5cblx0XHRcdHZhciBhbmltID0ge3RvOiAwfTtcblx0XHRcdFxuXHRcdFx0dmFyIHVwZGF0ZSA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgZWw7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBhbmltLnRvKTtcblx0XHRcdFx0XHRpZihlbCkgZWwucmVtb3ZlKCk7XG5cdFx0XHRcdFx0ZWwgPSBzdGFnZS5wYXRoKHBhdGhQYXJ0KTtcblx0XHRcdFx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzZXR0aW5ncy5zdHJva2VXaWR0aCwgc3Ryb2tlOiBzZXR0aW5ncy5jb2xvcn0pO1xuXHRcdFx0XHR9O1xuXHRcdFx0fSkoKTtcblx0XHRcdFxuXHRcdFx0dmFyIGJyZWFrUG9pbnRzID0gKGZ1bmN0aW9uKCl7XG5cblx0XHRcdFx0dmFyIGRpc3RhbmNlVHJlc2hvbGQgPSA0MDtcblx0XHRcdFx0dmFyIGFuZ2xlVHJlc2hvbGQgPSAxMjtcblxuXHRcdFx0XHR2YXIgbGFzdEFscGhhLCBhbHBoYSwgcCwgZGlmZiwgcG9pbnRQb3MgPSBbXTtcblx0XHRcdFx0dmFyIG1heCA9IGxlbmd0aCAtIGRpc3RhbmNlVHJlc2hvbGQ7XG5cdFx0XHRcdGZvcih2YXIgaT1kaXN0YW5jZVRyZXNob2xkOyBpPD1tYXg7IGkgKz0gMikge1xuXHRcdFx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0XHRcdHAgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgaSk7XG5cdFx0XHRcdFx0YWxwaGEgPSBwLmFscGhhICUgMzYwO1xuXHRcdFx0XHRcdGlmKCFsYXN0QWxwaGEpIHtcblx0XHRcdFx0XHRcdGxhc3RBbHBoYSA9IGFscGhhO1xuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHZhciBkaWYgPSBNYXRoLmFicyhhbHBoYSAtIGxhc3RBbHBoYSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhbHBoYSwgZGlmKTtcblx0XHRcdFx0XHRpZihkaWYgPiBhbmdsZVRyZXNob2xkKSB7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGFscGhhLCBhbHBoYSk7XG5cdFx0XHRcdFx0XHQvL3Nob3dQb2ludChwLCBzdGFnZSwgJyNmZjAwMDAnKTtcblx0XHRcdFx0XHRcdHBvaW50UG9zLnB1c2goaSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGxhc3RBbHBoYSA9IGFscGhhO1xuXHRcdFx0XHR9XG5cdFx0XHRcdC8vY29uc29sZS5sb2cocG9pbnRQb3MpO1xuXG5cdFx0XHRcdHJldHVybiBwb2ludFBvcy5yZWR1Y2UoZnVuY3Rpb24ocG9pbnRzLCBwb2ludCl7XG5cblx0XHRcdFx0XHR2YXIgbGFzdCA9IHBvaW50c1twb2ludHMubGVuZ3RoLTFdO1xuXHRcdFx0XHRcdGlmKCFsYXN0IHx8IHBvaW50IC0gbGFzdFtsYXN0Lmxlbmd0aC0xXSA+IGRpc3RhbmNlVHJlc2hvbGQpe1xuXHRcdFx0XHRcdFx0bGFzdCA9IFtwb2ludF07XG5cdFx0XHRcdFx0XHRwb2ludHMucHVzaChsYXN0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bGFzdC5wdXNoKHBvaW50KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcG9pbnRzO1xuXHRcdFx0XHR9LCBbXSkubWFwKGZ1bmN0aW9uKHBvaW50cyl7XG5cdFx0XHRcdFx0cmV0dXJuIHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGgvMildO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pKCk7XG5cblx0XHRcdGNvbnNvbGUubG9nKGJyZWFrUG9pbnRzKTtcblx0XHRcdGJyZWFrUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHRcdHNob3dQb2ludChSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcCksIHN0YWdlLCAnIzAwZmYwMCcsIDIpO1xuXHRcdFx0fSk7LyoqL1xuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHR2YXIgdGwgPSBicmVha1BvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIChweFBlclNlY29uZCB8fCBzZXR0aW5ncy5weFBlclNlY29uZCk7XG5cdFx0XHRcdGxhc3QgPSBkaXN0O1xuXHRcdFx0XHRyZXR1cm4gdGwudG8oYW5pbSwgdGltZSwge3RvOiBkaXN0LCBlYXNlIDogc2V0dGluZ3MuZWFzaW5nfSk7XG5cdFx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7XG5cdFx0XHRcdG9uVXBkYXRlIDogdXBkYXRlXG5cdFx0XHR9KSkudG8oYW5pbSwgKChsZW5ndGggLSAoYnJlYWtQb2ludHNbYnJlYWtQb2ludHMubGVuZ3RoLTFdfHwwKSkgLyAocHhQZXJTZWNvbmQgfHwgc2V0dGluZ3MucHhQZXJTZWNvbmQpKSwge3RvOiBsZW5ndGgsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblxuXHRcdFx0cmV0dXJuIHRsO1xuXG5cdFx0XHRyZXR1cm4gZ3NhcC5Ud2Vlbk1heC50byhhbmltLCB0aW1lLCB7XG5cdFx0XHRcdHRvIDogbGVuZ3RoLFxuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZSxcblx0XHRcdFx0ZWFzZSA6IHNldHRpbmdzLmVhc2luZ1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHREcmF3UGF0aC5mYWN0b3J5ID0gZnVuY3Rpb24obykge1xuXHRcdHJldHVybiBEcmF3UGF0aC5hcHBseShvIHx8IHt9KTtcblx0fTtcblxuXHQvKipcblx0U3RhdGljLiBSZXR1cm5zIGEgdGltZWxpbmVtYXggb2YgYWxsIHRoZSBwYXRocyBpbiB0aGUgZ3JvdXAsIGRyYXduIG9uZSBhdCBhIHRpbWUuXG5cdCovXG5cdERyYXdQYXRoLmdyb3VwID0gZnVuY3Rpb24ocGF0aHMsIHN0YWdlLCBzZXR0aW5ncywgb25Db21wbGV0ZSkge1xuXHRcdHJldHVybiBwYXRocy5yZWR1Y2UoZnVuY3Rpb24odGwsIHBhdGgpe1xuXHRcdFx0dmFyIGRyYXdpbmdQYXRoID0gRHJhd1BhdGguZmFjdG9yeSgpLmluaXQocGF0aCwgc3RhZ2UsIHNldHRpbmdzKTtcblx0XHRcdHJldHVybiB0bC5hcHBlbmQoZHJhd2luZ1BhdGguZHJhdygpKTtcblx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7IG9uQ29tcGxldGU6IChvbkNvbXBsZXRlIHx8IGZ1bmN0aW9uKCl7fSkgfSkpO1xuXHR9O1xuXG5cdHJldHVybiBEcmF3UGF0aDtcblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdyb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9zZS5kcmF3aW5nLkFscGhhYmV0KTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQWxwaGFiZXQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXHRcdGdldFBhdGhzIDogZnVuY3Rpb24obmFtZSwgcmlnaHQsIHRvcCwgc2NhbGUpIHtcblx0XHRcdHJpZ2h0ID0gcmlnaHQgfHwgMDtcblx0XHRcdHRvcCA9IHRvcCB8fCAwO1xuXG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0dmFyIGxpbmVzID0gW107XG5cblx0XHRcdGZvcih2YXIgaT0wOyBpPG5hbWUubGVuZ3RoOyBpKyspwqB7XG5cdFx0XHRcdHZhciBsZXR0ZXIgPSBuYW1lW2ldO1xuXHRcdFx0XHRpZihsZXR0ZXIgPT09ICcgJykge1xuXHRcdFx0XHRcdHJpZ2h0ICs9IEFscGhhYmV0LmdldE5TcGFjZSgpICogc2NhbGU7XG5cdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBsZXR0ZXJEZWYgPSBBbHBoYWJldC5nZXRMZXR0ZXIobGV0dGVyKTtcblx0XHRcdFx0bGV0dGVyRGVmID0gbGV0dGVyRGVmLnNjYWxlKHNjYWxlKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXJEZWYpO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGxldHRlckpvaW5lZEVuZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXR0ZXJEZWYucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHRcdFx0dmFyIGRlZiA9IHBhdGgudHJhbnNsYXRlKFtyaWdodCwgdG9wXSk7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZFN0YXJ0ID0gZGVmLm5hbWUgJiYgZGVmLm5hbWUuaW5kZXhPZignam9pbmEnKSA+IC0xO1xuXHRcdFx0XHRcdHZhciBqb2luZWRFbmQgPSAvam9pbihhPyliLy50ZXN0KGRlZi5uYW1lKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgam9pbmVkU3RhcnQsIGpvaW5lZEVuZCk7XG5cdFx0XHRcdFx0bGV0dGVySm9pbmVkRW5kID0gbGV0dGVySm9pbmVkRW5kIHx8IGpvaW5lZEVuZDtcblx0XHRcdFx0XHRpZihqb2luZWRTdGFydCAmJiBjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL2FwcGVuZCBhdSBjb250aW51b3VzXG5cdFx0XHRcdFx0XHRjb250aW51b3VzLmFwcGVuZChkZWYsIGxldHRlcik7XG5cdFx0XHRcdFx0fSBlbHNlIGlmKGpvaW5lZEVuZCAmJiAhY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9zdGFydCB1biBub3V2ZWF1IGxpbmVcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBkZWY7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzLm5hbWUgPSBsZXR0ZXI7XG5cdFx0XHRcdFx0XHRsaW5lcy5wdXNoKGNvbnRpbnVvdXMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRsaW5lcy5wdXNoKGRlZik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoIWxldHRlckpvaW5lZEVuZCkge1xuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdHJpZ2h0ICs9IGxldHRlckRlZi5ib3VuZGluZ1sxXVswXTtcblx0XHRcdFx0Ly9jb25zb2xlLnRhYmxlKFt7bGV0dGVyOm5hbWVbaV0sIGxldHRlcldpZHRoOiBsZXR0ZXIuYm91bmRpbmdbMV1bMF0sIHRvdGFsOnJpZ2h0fV0pO1x0XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBsaW5lcztcblxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gVmVjdG9yV29yZDtcblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdyYXBoYWVsJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuUmFwaGFlbCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKFJhcGhhZWwpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHJlZyA9IC8oW2Etel0pKFswLTlcXHNcXCxcXC5cXC1dKykvZ2k7XG5cdFx0XG5cdC8vZXhwZWN0ZWQgbGVuZ3RoIG9mIGVhY2ggdHlwZVxuXHR2YXIgZXhwZWN0ZWRMZW5ndGhzID0ge1xuXHRcdG0gOiAyLFxuXHRcdGwgOiAyLFxuXHRcdHYgOiAxLFxuXHRcdGggOiAxLFxuXHRcdGMgOiA2LFxuXHRcdHMgOiA0XG5cdH07XG5cblx0dmFyIFBhdGggPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCkge1xuXHRcdHRoaXMuc3ZnID0gc3ZnO1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdFx0Ly9pZihzdmcpIGNvbnNvbGUubG9nKHN2ZywgcGFyc2VkKTtcblx0XHR0aGlzLnNldFBhcnNlZChwYXJzZWQgfHwgdGhpcy5wYXJzZShzdmcpKTtcblx0fTtcblxuXHR2YXIgcmVmaW5lQm91bmRpbmcgPSBmdW5jdGlvbihib3VuZGluZywgcG9pbnQpIHtcblx0XHRib3VuZGluZ1swXSA9IGJvdW5kaW5nWzBdIHx8IHBvaW50LnNsaWNlKDApO1xuXHRcdGJvdW5kaW5nWzFdID0gYm91bmRpbmdbMV0gfHwgcG9pbnQuc2xpY2UoMCk7XG5cdFx0Ly90b3AgbGVmdFxuXHRcdGlmKHBvaW50WzBdIDwgYm91bmRpbmdbMF1bMF0pIGJvdW5kaW5nWzBdWzBdID0gcG9pbnRbMF07XG5cdFx0aWYocG9pbnRbMV0gPCBib3VuZGluZ1swXVsxXSkgYm91bmRpbmdbMF1bMV0gPSBwb2ludFsxXTtcblx0XHQvL2JvdHRvbSByaWdodFxuXHRcdGlmKHBvaW50WzBdID4gYm91bmRpbmdbMV1bMF0pIGJvdW5kaW5nWzFdWzBdID0gcG9pbnRbMF07XG5cdFx0aWYocG9pbnRbMV0gPiBib3VuZGluZ1sxXVsxXSkgYm91bmRpbmdbMV1bMV0gPSBwb2ludFsxXTtcblx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5zZXRTVkcgPSBmdW5jdGlvbihzdmcpIHtcblx0XHR0aGlzLnN2ZyA9IHN2Zztcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5zZXRQYXJzZWQgPSBmdW5jdGlvbihwYXJzZWQpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnNlZCk7XG5cdFx0dGhpcy5wYXJzZWQgPSBwYXJzZWQ7XG5cdFx0dGhpcy5maW5kQm91bmRpbmcoKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmN1YmljIHx8IHRoaXMucGFyc2VDdWJpYygpO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0TGVuZ3RoID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJhcGhhZWwuZ2V0VG90YWxMZW5ndGgodGhpcy5nZXRTVkdTdHJpbmcoKSk7XG5cdH07XG5cblx0LyoqXG5cdEdldHMgYW4gU1ZHIHN0cmluZyBvZiB0aGUgcGF0aCBzZWdlbW50cy4gSXQgaXMgbm90IHRoZSBzdmcgcHJvcGVydHkgb2YgdGhlIHBhdGgsIGFzIGl0IGlzIHBvdGVudGlhbGx5IHRyYW5zZm9ybWVkXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLmdldFNWR1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oc3ZnLCBzZWdtZW50KXtcblx0XHRcdHJldHVybiBzdmcgKyBzZWdtZW50LnR5cGUgKyBzZWdtZW50LmFuY2hvcnMuam9pbignLCcpOyBcblx0XHR9LCAnJyk7XG5cdH07XG5cblx0LyoqXG5cdFBhcnNlcyBhbiBTVkcgcGF0aCBzdHJpbmcgdG8gYSBsaXN0IG9mIHNlZ21lbnQgZGVmaW5pdGlvbnMgd2l0aCBBQlNPTFVURSBwb3NpdGlvbnMgdXNpbmcgUmFwaGFlbC5wYXRoMmN1cnZlXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24oc3ZnKSB7XG5cdFx0dmFyIGN1cnZlID0gUmFwaGFlbC5wYXRoMmN1cnZlKHN2Zyk7XG5cdFx0dmFyIHBhdGggPSBjdXJ2ZS5tYXAoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZSA6IHBvaW50LnNoaWZ0KCksXG5cdFx0XHRcdGFuY2hvcnMgOiBwb2ludFxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcGF0aDtcblx0fTtcblxuXHQvKipcblx0XHRQYXJzZXMgYSBwYXRoIGRlZmluZWQgYnkgcGFyc2VQYXRoIHRvIGEgbGlzdCBvZiBiZXppZXIgcG9pbnRzIHRvIGJlIHVzZWQgYnkgR3JlZW5zb2NrIEJlemllciBwbHVnaW4sIGZvciBleGFtcGxlXG5cdFx0VHdlZW5NYXgudG8oc3ByaXRlLCA1MDAsIHtcblx0XHRcdGJlemllcjp7dHlwZTpcImN1YmljXCIsIHZhbHVlczpjdWJpY30sXG5cdFx0XHRlYXNlOlF1YWQuZWFzZUluT3V0LFxuXHRcdFx0dXNlRnJhbWVzIDogdHJ1ZVxuXHRcdH0pO1xuXHRcdCovXG5cdFBhdGgucHJvdG90eXBlLnBhcnNlQ3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhdGgpO1xuXHRcdC8vYXNzdW1lZCBmaXJzdCBlbGVtZW50IGlzIGEgbW92ZXRvXG5cdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmN1YmljID0gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKGFuY2hvcnMsIHNlZ21lbnQpe1xuXHRcdFx0dmFyIGEgPSBzZWdtZW50LmFuY2hvcnM7XG5cdFx0XHRpZihzZWdtZW50LnR5cGU9PT0nTScpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6YVsxXX0pO1xuXHRcdFx0fSBlbHNlIGlmKHNlZ21lbnQudHlwZT09PSdMJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzJdLCB5OiBhWzNdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVs0XSwgeTogYVs1XX0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0XHR9LCBbXSk7XG5cblx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHR9O1xuXG5cdC8vdHJvdXZlIGxlIGJvdW5kaW5nIGJveCBkJ3VuZSBsZXR0cmUgKGVuIHNlIGZpYW50IGp1c3RlIHN1ciBsZXMgcG9pbnRzLi4uIG9uIG5lIGNhbGN1bGUgcGFzIG91IHBhc3NlIGxlIHBhdGgpXG5cdFBhdGgucHJvdG90eXBlLmZpbmRCb3VuZGluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBib3VuZGluZyA9IHRoaXMuYm91bmRpbmcgPSB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHApe1xuXHRcdFx0dmFyIGFuY2hvcnMgPSBwLmFuY2hvcnM7XG5cdFx0XHR2YXIgcG9pbnQ7XG5cdFx0XHRpZihhbmNob3JzLmxlbmd0aCA9PT0gMikge1xuXHRcdFx0XHRwb2ludCA9IFthbmNob3JzWzBdLCBhbmNob3JzWzFdXTtcblx0XHRcdH0gZWxzZSBpZihhbmNob3JzLmxlbmd0aCA9PT0gNikge1xuXHRcdFx0XHRwb2ludCA9IFthbmNob3JzWzRdLCBhbmNob3JzWzVdXTtcblx0XHRcdH1cblx0XHRcdHJldHVybiByZWZpbmVCb3VuZGluZyhib3VuZGluZywgcG9pbnQpO1xuXHRcdH0sIFtdKTtcblx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbihvZmZzZXQpIHtcblx0XHR2YXIgcGFyc2VkID0gdGhpcy5wYXJzZWQubWFwKGZ1bmN0aW9uKGRlZikge1xuXHRcdFx0dmFyIG5ld0RlZiA9IE9iamVjdC5jcmVhdGUoZGVmKTtcblx0XHRcdG5ld0RlZi5hbmNob3JzID0gZGVmLmFuY2hvcnMubWFwKGZ1bmN0aW9uKGNvb3JkLCBpKXtcblx0XHRcdFx0cmV0dXJuIGNvb3JkICs9IG9mZnNldFtpJTJdO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gbmV3RGVmO1xuXHRcdH0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3RvcnkobnVsbCwgdGhpcy5uYW1lLCBwYXJzZWQpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24ocmF0aW8pIHtcblx0XHR2YXIgcGFyc2VkID0gdGhpcy5wYXJzZWQubWFwKGZ1bmN0aW9uKGRlZikge1xuXHRcdFx0dmFyIG5ld0RlZiA9IE9iamVjdC5jcmVhdGUoZGVmKTtcblx0XHRcdG5ld0RlZi5hbmNob3JzID0gZGVmLmFuY2hvcnMubWFwKGZ1bmN0aW9uKGNvb3JkLCBpKXtcblx0XHRcdFx0cmV0dXJuIGNvb3JkICo9IHJhdGlvO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gbmV3RGVmO1xuXHRcdH0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3RvcnkobnVsbCwgdGhpcy5uYW1lLCBwYXJzZWQpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKHBhcnQsIG5hbWUpwqB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJ0KTtcblx0XHRpZihuYW1lKSB0aGlzLm5hbWUgKz0gbmFtZTtcblx0XHR0aGlzLnNldFBhcnNlZCh0aGlzLnBhcnNlZC5jb25jYXQocGFydC5wYXJzZWQuc2xpY2UoMSkpKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5yZWZpbmVCb3VuZGluZyA9IHJlZmluZUJvdW5kaW5nO1xuXG5cdFBhdGguZmFjdG9yeSA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkKSB7XG5cdFx0cmV0dXJuIG5ldyBQYXRoKHN2ZywgbmFtZSwgcGFyc2VkKTtcblx0fTtcblxuXHRyZXR1cm4gUGF0aDtcblxufSkpO1xuXG5cbiJdfQ==
