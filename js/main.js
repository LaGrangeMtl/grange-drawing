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

			DrawPath.group(paths, getStage(), {
				pxPerSecond : 200,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeInOut
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
				var angleTreshold = 12;

				var pointPos = [];
				/*
				var lastAlpha, alpha, p, diff;
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
				}/**/

				/*var a = 20;
				var b = (a + 180) % 360;
				var t = 4;
				for(var i=0; i<=length; i += 1) {
					//var pathPart = Raphael.getSubpath(pathStr, 0, i);
					var p = Raphael.getPointAtLength(pathStr, i);
					var alpha = p.alpha % 360;
					if(Math.abs(alpha - a) < t) {
						//showPoint(p, stage, '#ff0000');
						pointPos.push(i);
					}
					if(Math.abs(alpha - b) < t) {
						//showPoint(p, stage, '#00ff00');

						pointPos.push(i);
					}
				}/**/
				/*
				var t = 2;
				var at = 12;
				for(var i=t; i<=length; i += t) {
					//var pathPart = Raphael.getSubpath(pathStr, 0, i);
					var p = Raphael.getPointAtLength(pathStr, i);
					var p0 = Raphael.getPointAtLength(pathStr, i-t);
					var p2 = Raphael.getPointAtLength(pathStr, i+t);
					var alpha = p.alpha % 360;
					var alpha0 = p0.alpha % 360;
					var alpha2 = p2.alpha % 360;
					if(Math.abs(alpha - alpha0) > at && Math.abs(alpha - alpha2) > at) {
						//showPoint(p, stage, '#ff0000');
						pointPos.push(i);
					}
				}/**/
				//console.log(pointPos);

				var t = 1;
				var at = 12;
				var prev;
				var testPoints = [];
				for(var i=t; i<=length; i += t) {
					//var pathPart = Raphael.getSubpath(pathStr, 0, i);
					var p = Raphael.getPointAtLength(pathStr, i);
					//var alpha = (p.alpha > 360 ? p.alpha - 180 : p.alpha) % 360;// > 360 ? p.alpha % 360 : p.alpha % 180;
					var alpha = Math.abs(toDegrees( Math.asin( Math.sin(toRadians(p.alpha)) ) ));
					if(prev) {
						p.diff = Math.abs(alpha - prev);
					} else {
						p.diff = 0;
					}
					p.alphaCorr = alpha;
					prev = alpha;
					//console.log(p.diff);
					testPoints.push(p);

				}/**/
				var max = testPoints.reduce(function(m, p){
					return p.diff > m && p.diff < 40 ? p.diff : m;
				}, 0);
				console.log(max);

				var prev = [0,0,0,0];
				testPoints.forEach(function(p){
					var r = Math.round((p.diff / max) * 255);
					var g = 255 - Math.round((p.diff / max) * 255);
					var rgb = 'rgb('+r+','+g+',0)';
					if(r>100) {
						console.log('==========');
						prev.forEach(function(p){console.log(p.alphaCorr, p.alpha);});
						console.log(p.alphaCorr, p.alpha, rgb);
					}
					p.y += 150;
					showPoint(p, stage, rgb, 0.5);
					prev[3] = prev[2];
					prev[2] = prev[1];
					prev[1] = prev[0];
					prev[0] = p;
				});


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
				showPoint(Raphael.getPointAtLength(pathStr, p), stage, '#00ff00', 3);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcdFxuXHR2YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xuXHR2YXIgUmFwaGFlbCA9IHJlcXVpcmUoJ3JhcGhhZWwnKTtcblx0dmFyIERyYXdQYXRoID0gcmVxdWlyZSgnYXBwL3Jvc2UvZHJhd2luZy9EcmF3UGF0aC5qcycpO1xuXHR2YXIgVmVjdG9yV29yZCA9IHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvVmVjdG9yV29yZC5qcycpO1xuXHR2YXIgQWxwaGFiZXQgPSByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzJyk7XG5cdHZhciBUd2Vlbk1heCA9IHJlcXVpcmUoJ2dzYXAnKTtcblxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgVyA9IDE0MDA7XG5cdHZhciBIID0gMTIwMDtcblxuXHR2YXIgc2NhbGVGYWN0b3IgPSAxO1xuXG5cdHZhciBuYW1lcyA9IFtcIkplc3NpY2EgV2FubmluZ1wiLFwiSnVsaWEgUm9ja3dlbGxcIixcIkNhcm9sIEh1YmJhcmRcIixcIlJvbmFsZCBDYW5keVwiLFwiSm9obiBOZXd0b25cIixcIkVsdmlzIE5pY29sZVwiLFwiR2xvcmlhIFdlYXZlclwiLFwiSnVsaWEgQ3JvbmtpdGVcIixcIk1vdGhlciBSb2dlcnNcIixcIkNoZXZ5IElyd2luXCIsXCJFZGRpZSBBbGxlblwiLFwiTm9ybWFuIEphY2tzb25cIixcIlBldGVyIFJvZ2Vyc1wiLFwiV2VpcmQgQ2hhc2VcIixcIkNvbGluIE1heXNcIixcIk5hcG9sZW9uIE1hcnRpblwiLFwiRWRnYXIgU2ltcHNvblwiLFwiTW9oYW1tYWQgTWNDYXJ0bmV5XCIsXCJMaWJlcmFjZSBXaWxsaWFtc1wiLFwiRmllbGRzIEJ1cm5ldHRcIixcIlN0ZXZlIEFzaGVcIixcIkNhcnJpZSBDaGFybGVzXCIsXCJUb21teSBQYXN0ZXVyXCIsXCJFZGRpZSBTaWx2ZXJzdG9uZVwiLFwiT3ByYWggQXNoZVwiLFwiUmF5IEJhbGxcIixcIkppbSBEaWFuYVwiLFwiTWljaGVsYW5nZWxvIEVhc3R3b29kXCIsXCJHZW9yZ2UgU2ltcHNvblwiLFwiQWxpY2lhIEF1c3RlblwiLFwiSmVzc2ljYSBOaWNvbGVcIixcIk1hcmlseW4gRXZlcmV0dFwiLFwiS2VpdGggRWFzdHdvb2RcIixcIlBhYmxvIEVhc3R3b29kXCIsXCJQZXl0b24gTHV0aGVyXCIsXCJNb3phcnQgQXJtc3Ryb25nXCIsXCJNaWNoYWVsIEJ1cm5ldHRcIixcIktlaXRoIEdsb3ZlclwiLFwiRWxpemFiZXRoIENoaWxkXCIsXCJNaWxlcyBBc3RhaXJlXCIsXCJBbmR5IEVkaXNvblwiLFwiTWFydGluIExlbm5vblwiLFwiVG9tIFBpY2Nhc29cIixcIkJleW9uY2UgRGlzbmV5XCIsXCJQZXRlciBDbGludG9uXCIsXCJIZW5yeSBLZW5uZWR5XCIsXCJQYXVsIENoaWxkXCIsXCJMZXdpcyBTYWdhblwiLFwiTWljaGVsYW5nZWxvIExlZVwiLFwiTWFyaWx5biBGaXNoZXJcIl07XG5cdGZ1bmN0aW9uIFNodWZmbGUobykge1xuXHRcdGZvcih2YXIgaiwgeCwgaSA9IG8ubGVuZ3RoOyBpOyBqID0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSAqIGkpLCB4ID0gb1stLWldLCBvW2ldID0gb1tqXSwgb1tqXSA9IHgpO1xuXHRcdHJldHVybiBvO1xuXHR9O1xuXHRTaHVmZmxlKG5hbWVzKTtcblx0bmFtZXMubGVuZ3RoID0gMTsvKiovXG5cblx0Ly9uYW1lcyA9IFsnYWsnXTtcblxuXG5cdHZhciBnZXRTdGFnZSA9IChmdW5jdGlvbigpe1xuXHRcdHZhciBzdGFnZTtcblx0XHR2YXIgaW5pdCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gUmFwaGFlbChcInN2Z1wiLCBXLCBIKTtcblx0XHR9O1xuXHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN0YWdlID0gc3RhZ2UgfHwgaW5pdCgpO1xuXHRcdH1cblx0fSkoKTtcblxuXHR2YXIgZG9EcmF3ID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgaW5jciA9IEggLyBuYW1lcy5sZW5ndGg7XG5cdFx0bmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBrKXtcblx0XHRcdC8vdHJhY2VOYW1lKG5hbWUsIDAsIGsgKiBpbmNyKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gVmVjdG9yV29yZC5nZXRQYXRocyhuYW1lLCAwLCBrICogaW5jciwgc2NhbGVGYWN0b3IpO1xuXG5cdFx0XHREcmF3UGF0aC5ncm91cChwYXRocywgZ2V0U3RhZ2UoKSwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IDIwMCxcblx0XHRcdFx0Y29sb3IgOiAnIzQ0NDQ0NCcsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogMixcblx0XHRcdFx0ZWFzaW5nIDogZ3NhcC5TaW5lLmVhc2VJbk91dFxuXHRcdFx0fSk7XG5cblx0XHR9KTtcblxuXHR9O1xuXG5cdHZhciBsb2FkaW5nID0gQWxwaGFiZXQuaW5pdCgpO1x0XG5cdHZhciBidG4gPSAkKCcjY3RybCcpO1xuXG5cdGJ0bi5vbignY2xpY2suYWxwaGFiZXQnLCBmdW5jdGlvbigpe1xuXHRcdGxvYWRpbmcudGhlbihkb0RyYXcpO1xuXHR9KTtcblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9BbHBoYWJldCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcycpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGgpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBTQ0FMRSA9IDE7XG5cdHZhciBzdmdGaWxlID0gJ2Fzc2V0cy9hbHBoYWJldC5zdmcnO1xuXG5cdHZhciBsZXR0ZXJzID0ge307XG5cblx0dmFyIExldHRlciA9IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5zZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5ib3VuZGluZyA9IHRoaXMucGF0aHMucmVkdWNlKGZ1bmN0aW9uKGJvdW5kaW5nLCBwYXRoKXtcblx0XHRcdHZhciBwYXRoQm91bmRpbmcgPSBwYXRoLmZpbmRCb3VuZGluZygpO1xuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZyA9IFBhdGgucHJvdG90eXBlLnJlZmluZUJvdW5kaW5nKGJvdW5kaW5nLCBwYXRoQm91bmRpbmcpO1xuXHRcdFx0cmV0dXJuIGJvdW5kaW5nO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0aWYodGhpcy5ib3R0b21SaWdodCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmJvdHRvbVJpZ2h0LnBhcnNlZFswXS5hbmNob3JzO1xuXHRcdFx0dGhpcy5ib3VuZGluZ1sxXSA9IFthbmNob3JzWzBdLCBhbmNob3JzWzFdXTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5ib3R0b21SaWdodCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmdbMV1bMF07XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbihvZmZzZXQpe1xuXHRcdHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzLm1hcChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cGF0aCA9IHBhdGgudHJhbnNsYXRlKG9mZnNldCk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0fSk7XG5cdFx0dGhpcy5ib3R0b21SaWdodCA9ICh0aGlzLmJvdHRvbVJpZ2h0ICYmIHRoaXMuYm90dG9tUmlnaHQudHJhbnNsYXRlKG9mZnNldCkpO1xuXHRcdHRoaXMuc2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgbGV0dGVyLCBzY2FsZWRcblx0TGV0dGVyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcblx0XHRpZighdGhpcy5wYXRocykgcmV0dXJuIHRoaXM7XG5cdFx0dmFyIHNjYWxlZCA9IG5ldyBMZXR0ZXIodGhpcy5uYW1lKTtcblx0XHR0aGlzLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCl7XG5cdFx0XHRzY2FsZWQuYWRkUGF0aChwYXRoLnNjYWxlKHNjYWxlKSk7XG5cdFx0fSk7XG5cdFx0c2NhbGVkLmJvdHRvbVJpZ2h0ID0gKHRoaXMuYm90dG9tUmlnaHQgJiYgdGhpcy5ib3R0b21SaWdodC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zZXRCb3VuZGluZygpO1xuXHRcdHJldHVybiBzY2FsZWQ7XG5cdH07XG5cblxuXHR2YXIgcGFyc2VTVkcgPSBmdW5jdGlvbihkYXRhKXtcblx0XHR2YXIgYm91bmRpbmdzID0gW107XG5cblx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdHZhciBkb2MgPSAkKGRhdGEpO1xuXHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdHZhciBsYXllciA9ICQoZWwpO1xuXHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblxuXHRcdFx0aWYoaWQgPT0gJ194MkRfJykge1xuXHRcdFx0XHRpZCA9ICctJztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgbGV0dGVyID0gbGV0dGVyc1tpZF0gPSBuZXcgTGV0dGVyKGlkKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gbGF5ZXIuZmluZCgncGF0aCcpO1xuXHRcdFx0Ly9pZihwYXRocy5sZW5ndGg9PTApIGNvbnNvbGUubG9nKGxheWVyKTtcblx0XHRcdHZhciBsZXR0ZXJQYXRoc0JvdW5kaW5nID0gW107XG5cdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIHBhdGhFbCA9ICQoZWwpO1x0XHRcdFx0XG5cdFx0XHRcdGxldHRlci5hZGRQYXRoKCBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpKS5zY2FsZShTQ0FMRSkgKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXR0ZXIuc2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmdzLnB1c2gobGV0dGVyLmJvdW5kaW5nKTtcblxuXHRcdH0pO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhib3VuZGluZ3MpO1xuXHRcdC8vdHJvdXZlIGxlIHRvcCBhYnNvbHUgKHRvcCBkZSBsYSBsZXR0cmUgbGEgcGx1cyBoYXV0ZSlcblx0XHR2YXIgdG9wID0gYm91bmRpbmdzLnJlZHVjZShmdW5jdGlvbihtaW4sIGJvdW5kaW5nKXtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IGJvdW5kaW5nWzBdWzFdKSB7XG5cdFx0XHRcdG1pbiA9IGJvdW5kaW5nWzBdWzFdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdC8vY29uc29sZS5sb2codG9wKTtcblx0XHQvL2NvbnNvbGUubG9nKGxldHRlcnMpO1xuXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhsZXR0ZXJzKTtcblx0XHQvL2FqdXN0ZSBsZSBiYXNlbGluZSBkZSBjaGFxdWUgbGV0dHJlXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0bGV0dGVyc1trZXldLnNldE9mZnNldChbLTEgKiBsZXR0ZXJzW2tleV0uYm91bmRpbmdbMF1bMF0sIC0xICogdG9wXSk7XG5cdFx0fSk7XG5cblxuXHR9O1xuXG5cdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdHZhciBsb2FkaW5nID0gJC5hamF4KHtcblx0XHRcdHVybCA6IHN2Z0ZpbGUsXG5cdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdH0pO1xuXG5cdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhiKTtcblx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHR9O1xuXG5cdHZhciBBbHBoYWJldCA9IHtcblx0XHRpbml0IDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZG9Mb2FkKCk7XG5cdFx0fSxcblx0XHRnZXRMZXR0ZXIgOiBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzW2xdO1xuXHRcdH0sXG5cdFx0Z2V0TlNwYWNlIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0RyYXdQYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJyksIHJlcXVpcmUoJ2dzYXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5fLCByb290LlJhcGhhZWwsIChyb290LkdyZWVuU29ja0dsb2JhbHMgfHwgcm9vdCkpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChfLCBSYXBoYWVsLCBUd2Vlbk1heCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL2dzYXAgZXhwb3J0cyBUd2Vlbk1heFxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Y29sb3I6ICcjMDAwMDAwJyxcblx0XHRzdHJva2VXaWR0aCA6IDAuNixcblx0XHRweFBlclNlY29uZCA6IDEwMCwgLy9zcGVlZCBvZiBkcmF3aW5nXG5cdFx0ZWFzaW5nIDogZ3NhcC5RdWFkLmVhc2VJblxuXHR9O1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgc3RhZ2UsIGNvbG9yLCBzaXplKXtcblx0XHR2YXIgZWwgPSBzdGFnZS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKTtcblx0XHRlbC5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHR9O1xuXG5cdHZhciBEcmF3UGF0aCA9IGZ1bmN0aW9uKCl7XG5cblx0XHR2YXIgc2V0dGluZ3MgPSB7fTtcblx0XHR2YXIgcGF0aERlZjtcblx0XHR2YXIgc3RhZ2U7XG5cblx0XHR2YXIgdG9SYWRpYW5zID0gZnVuY3Rpb24oZGVncmVlcykge1xuXHRcdCAgcmV0dXJuIGRlZ3JlZXMgKiBNYXRoLlBJIC8gMTgwO1xuXHRcdH07XG5cdFx0IFxuXHRcdC8vIENvbnZlcnRzIGZyb20gcmFkaWFucyB0byBkZWdyZWVzLlxuXHRcdHZhciB0b0RlZ3JlZXMgPSBmdW5jdGlvbihyYWRpYW5zKSB7XG5cdFx0ICByZXR1cm4gcmFkaWFucyAqIDE4MCAvIE1hdGguUEk7XG5cdFx0fTtcblxuXG5cdFx0Ly9wcmVuZCBsYSBzdHJpbmcgZGVzIHBvaW50cyBTVkdcblx0XHR0aGlzLmluaXQgPSBmdW5jdGlvbihwYXRoLCBzdGFnZVBhcmFtLCBwYXJhbXMpIHtcblx0XHRcdHBhdGhEZWYgPSBwYXRoO1xuXHRcdFx0c3RhZ2UgPSBzdGFnZVBhcmFtO1xuXHRcdFx0Xy5leHRlbmQoc2V0dGluZ3MsIGRlZmF1bHRzLCBwYXJhbXMpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fTtcblxuXHRcdHRoaXMuc2hvdyA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHBhdGggPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1x0XHRcdFxuXHRcdFx0dmFyIGVsID0gc3RhZ2UucGF0aChwYXRoKTtcblx0XHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IHNldHRpbmdzLnN0cm9rZVdpZHRoLCBzdHJva2U6IHNldHRpbmdzLmNvbG9yfSk7LyoqL1xuXHRcdH07XG5cblx0XHR0aGlzLmRyYXcgPSBmdW5jdGlvbihweFBlclNlY29uZCl7XG5cdFx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gcGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHRcdHB4UGVyU2Vjb25kID0gcHhQZXJTZWNvbmQgfHwgc2V0dGluZ3MucHhQZXJTZWNvbmQ7XG5cdFx0XHR2YXIgdGltZSA9IGxlbmd0aCAvIHB4UGVyU2Vjb25kO1xuXG5cdFx0XHR2YXIgYW5pbSA9IHt0bzogMH07XG5cdFx0XHRcblx0XHRcdHZhciB1cGRhdGUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGVsO1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgYW5pbS50byk7XG5cdFx0XHRcdFx0aWYoZWwpIGVsLnJlbW92ZSgpO1xuXHRcdFx0XHRcdGVsID0gc3RhZ2UucGF0aChwYXRoUGFydCk7XG5cdFx0XHRcdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc2V0dGluZ3Muc3Ryb2tlV2lkdGgsIHN0cm9rZTogc2V0dGluZ3MuY29sb3J9KTtcblx0XHRcdFx0fTtcblx0XHRcdH0pKCk7XG5cblx0XHRcdFx0XG5cdFx0XHRcblx0XHRcdHZhciBicmVha1BvaW50cyA9IChmdW5jdGlvbigpe1xuXG5cdFx0XHRcdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdFx0XHRcdHZhciBhbmdsZVRyZXNob2xkID0gMTI7XG5cblx0XHRcdFx0dmFyIHBvaW50UG9zID0gW107XG5cdFx0XHRcdC8qXG5cdFx0XHRcdHZhciBsYXN0QWxwaGEsIGFscGhhLCBwLCBkaWZmO1xuXHRcdFx0XHR2YXIgbWF4ID0gbGVuZ3RoIC0gZGlzdGFuY2VUcmVzaG9sZDtcblx0XHRcdFx0Zm9yKHZhciBpPWRpc3RhbmNlVHJlc2hvbGQ7IGk8PW1heDsgaSArPSAyKSB7XG5cdFx0XHRcdFx0Ly92YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgaSk7XG5cdFx0XHRcdFx0cCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBpKTtcblx0XHRcdFx0XHRhbHBoYSA9IHAuYWxwaGEgJSAzNjA7XG5cdFx0XHRcdFx0aWYoIWxhc3RBbHBoYSkge1xuXHRcdFx0XHRcdFx0bGFzdEFscGhhID0gYWxwaGE7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFyIGRpZiA9IE1hdGguYWJzKGFscGhhIC0gbGFzdEFscGhhKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGFscGhhLCBkaWYpO1xuXHRcdFx0XHRcdGlmKGRpZiA+IGFuZ2xlVHJlc2hvbGQpIHtcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coYWxwaGEsIGFscGhhKTtcblx0XHRcdFx0XHRcdC8vc2hvd1BvaW50KHAsIHN0YWdlLCAnI2ZmMDAwMCcpO1xuXHRcdFx0XHRcdFx0cG9pbnRQb3MucHVzaChpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0bGFzdEFscGhhID0gYWxwaGE7XG5cdFx0XHRcdH0vKiovXG5cblx0XHRcdFx0Lyp2YXIgYSA9IDIwO1xuXHRcdFx0XHR2YXIgYiA9IChhICsgMTgwKSAlIDM2MDtcblx0XHRcdFx0dmFyIHQgPSA0O1xuXHRcdFx0XHRmb3IodmFyIGk9MDsgaTw9bGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdFx0XHQvL3ZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBpKTtcblx0XHRcdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBpKTtcblx0XHRcdFx0XHR2YXIgYWxwaGEgPSBwLmFscGhhICUgMzYwO1xuXHRcdFx0XHRcdGlmKE1hdGguYWJzKGFscGhhIC0gYSkgPCB0KSB7XG5cdFx0XHRcdFx0XHQvL3Nob3dQb2ludChwLCBzdGFnZSwgJyNmZjAwMDAnKTtcblx0XHRcdFx0XHRcdHBvaW50UG9zLnB1c2goaSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmKE1hdGguYWJzKGFscGhhIC0gYikgPCB0KSB7XG5cdFx0XHRcdFx0XHQvL3Nob3dQb2ludChwLCBzdGFnZSwgJyMwMGZmMDAnKTtcblxuXHRcdFx0XHRcdFx0cG9pbnRQb3MucHVzaChpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0vKiovXG5cdFx0XHRcdC8qXG5cdFx0XHRcdHZhciB0ID0gMjtcblx0XHRcdFx0dmFyIGF0ID0gMTI7XG5cdFx0XHRcdGZvcih2YXIgaT10OyBpPD1sZW5ndGg7IGkgKz0gdCkge1xuXHRcdFx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XHRcdHZhciBwMCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBpLXQpO1xuXHRcdFx0XHRcdHZhciBwMiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBpK3QpO1xuXHRcdFx0XHRcdHZhciBhbHBoYSA9IHAuYWxwaGEgJSAzNjA7XG5cdFx0XHRcdFx0dmFyIGFscGhhMCA9IHAwLmFscGhhICUgMzYwO1xuXHRcdFx0XHRcdHZhciBhbHBoYTIgPSBwMi5hbHBoYSAlIDM2MDtcblx0XHRcdFx0XHRpZihNYXRoLmFicyhhbHBoYSAtIGFscGhhMCkgPiBhdCAmJiBNYXRoLmFicyhhbHBoYSAtIGFscGhhMikgPiBhdCkge1xuXHRcdFx0XHRcdFx0Ly9zaG93UG9pbnQocCwgc3RhZ2UsICcjZmYwMDAwJyk7XG5cdFx0XHRcdFx0XHRwb2ludFBvcy5wdXNoKGkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fS8qKi9cblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwb2ludFBvcyk7XG5cblx0XHRcdFx0dmFyIHQgPSAxO1xuXHRcdFx0XHR2YXIgYXQgPSAxMjtcblx0XHRcdFx0dmFyIHByZXY7XG5cdFx0XHRcdHZhciB0ZXN0UG9pbnRzID0gW107XG5cdFx0XHRcdGZvcih2YXIgaT10OyBpPD1sZW5ndGg7IGkgKz0gdCkge1xuXHRcdFx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XHRcdC8vdmFyIGFscGhhID0gKHAuYWxwaGEgPiAzNjAgPyBwLmFscGhhIC0gMTgwIDogcC5hbHBoYSkgJSAzNjA7Ly8gPiAzNjAgPyBwLmFscGhhICUgMzYwIDogcC5hbHBoYSAlIDE4MDtcblx0XHRcdFx0XHR2YXIgYWxwaGEgPSBNYXRoLmFicyh0b0RlZ3JlZXMoIE1hdGguYXNpbiggTWF0aC5zaW4odG9SYWRpYW5zKHAuYWxwaGEpKSApICkpO1xuXHRcdFx0XHRcdGlmKHByZXYpIHtcblx0XHRcdFx0XHRcdHAuZGlmZiA9IE1hdGguYWJzKGFscGhhIC0gcHJldik7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdHAuZGlmZiA9IDA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHAuYWxwaGFDb3JyID0gYWxwaGE7XG5cdFx0XHRcdFx0cHJldiA9IGFscGhhO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cocC5kaWZmKTtcblx0XHRcdFx0XHR0ZXN0UG9pbnRzLnB1c2gocCk7XG5cblx0XHRcdFx0fS8qKi9cblx0XHRcdFx0dmFyIG1heCA9IHRlc3RQb2ludHMucmVkdWNlKGZ1bmN0aW9uKG0sIHApe1xuXHRcdFx0XHRcdHJldHVybiBwLmRpZmYgPiBtICYmIHAuZGlmZiA8IDQwID8gcC5kaWZmIDogbTtcblx0XHRcdFx0fSwgMCk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKG1heCk7XG5cblx0XHRcdFx0dmFyIHByZXYgPSBbMCwwLDAsMF07XG5cdFx0XHRcdHRlc3RQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0XHR2YXIgciA9IE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0XHRcdHZhciBnID0gMjU1IC0gTWF0aC5yb3VuZCgocC5kaWZmIC8gbWF4KSAqIDI1NSk7XG5cdFx0XHRcdFx0dmFyIHJnYiA9ICdyZ2IoJytyKycsJytnKycsMCknO1xuXHRcdFx0XHRcdGlmKHI+MTAwKSB7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PScpO1xuXHRcdFx0XHRcdFx0cHJldi5mb3JFYWNoKGZ1bmN0aW9uKHApe2NvbnNvbGUubG9nKHAuYWxwaGFDb3JyLCBwLmFscGhhKTt9KTtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKHAuYWxwaGFDb3JyLCBwLmFscGhhLCByZ2IpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRwLnkgKz0gMTUwO1xuXHRcdFx0XHRcdHNob3dQb2ludChwLCBzdGFnZSwgcmdiLCAwLjUpO1xuXHRcdFx0XHRcdHByZXZbM10gPSBwcmV2WzJdO1xuXHRcdFx0XHRcdHByZXZbMl0gPSBwcmV2WzFdO1xuXHRcdFx0XHRcdHByZXZbMV0gPSBwcmV2WzBdO1xuXHRcdFx0XHRcdHByZXZbMF0gPSBwO1xuXHRcdFx0XHR9KTtcblxuXG5cdFx0XHRcdHJldHVybiBwb2ludFBvcy5yZWR1Y2UoZnVuY3Rpb24ocG9pbnRzLCBwb2ludCl7XG5cblx0XHRcdFx0XHR2YXIgbGFzdCA9IHBvaW50c1twb2ludHMubGVuZ3RoLTFdO1xuXHRcdFx0XHRcdGlmKCFsYXN0IHx8IHBvaW50IC0gbGFzdFtsYXN0Lmxlbmd0aC0xXSA+IGRpc3RhbmNlVHJlc2hvbGQpe1xuXHRcdFx0XHRcdFx0bGFzdCA9IFtwb2ludF07XG5cdFx0XHRcdFx0XHRwb2ludHMucHVzaChsYXN0KTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bGFzdC5wdXNoKHBvaW50KTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gcG9pbnRzO1xuXHRcdFx0XHR9LCBbXSkubWFwKGZ1bmN0aW9uKHBvaW50cyl7XG5cdFx0XHRcdFx0cmV0dXJuIHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGgvMildO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pKCk7XG5cblx0XHRcdGNvbnNvbGUubG9nKGJyZWFrUG9pbnRzKTtcblx0XHRcdGJyZWFrUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHRcdHNob3dQb2ludChSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcCksIHN0YWdlLCAnIzAwZmYwMCcsIDMpO1xuXHRcdFx0fSk7LyoqL1xuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHR2YXIgdGwgPSBicmVha1BvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIHB4UGVyU2Vjb25kO1xuXHRcdFx0XHRsYXN0ID0gZGlzdDtcblx0XHRcdFx0cmV0dXJuIHRsLnRvKGFuaW0sIHRpbWUsIHt0bzogZGlzdCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe1xuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZVxuXHRcdFx0fSkpLnRvKGFuaW0sICgobGVuZ3RoIC0gKGJyZWFrUG9pbnRzW2JyZWFrUG9pbnRzLmxlbmd0aC0xXXx8MCkpIC8gcHhQZXJTZWNvbmQpLCB7dG86IGxlbmd0aCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXG5cdFx0XHRyZXR1cm4gdGw7XG5cblx0XHRcdHJldHVybiBnc2FwLlR3ZWVuTWF4LnRvKGFuaW0sIHRpbWUsIHtcblx0XHRcdFx0dG8gOiBsZW5ndGgsXG5cdFx0XHRcdG9uVXBkYXRlIDogdXBkYXRlLFxuXHRcdFx0XHRlYXNlIDogc2V0dGluZ3MuZWFzaW5nXG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdERyYXdQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihvKSB7XG5cdFx0cmV0dXJuIERyYXdQYXRoLmFwcGx5KG8gfHwge30pO1xuXHR9O1xuXG5cdC8qKlxuXHRTdGF0aWMuIFJldHVybnMgYSB0aW1lbGluZW1heCBvZiBhbGwgdGhlIHBhdGhzIGluIHRoZSBncm91cCwgZHJhd24gb25lIGF0IGEgdGltZS5cblx0Ki9cblx0RHJhd1BhdGguZ3JvdXAgPSBmdW5jdGlvbihwYXRocywgc3RhZ2UsIHNldHRpbmdzLCBvbkNvbXBsZXRlKSB7XG5cdFx0cmV0dXJuIHBhdGhzLnJlZHVjZShmdW5jdGlvbih0bCwgcGF0aCl7XG5cdFx0XHR2YXIgZHJhd2luZ1BhdGggPSBEcmF3UGF0aC5mYWN0b3J5KCkuaW5pdChwYXRoLCBzdGFnZSwgc2V0dGluZ3MpO1xuXHRcdFx0cmV0dXJuIHRsLmFwcGVuZChkcmF3aW5nUGF0aC5kcmF3KCkpO1xuXHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHsgb25Db21wbGV0ZTogKG9uQ29tcGxldGUgfHwgZnVuY3Rpb24oKXt9KSB9KSk7XG5cdH07XG5cblx0cmV0dXJuIERyYXdQYXRoO1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL1ZlY3RvcldvcmQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3Jvc2UvZHJhd2luZy9BbHBoYWJldC5qcycpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb3NlLmRyYXdpbmcuQWxwaGFiZXQpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChBbHBoYWJldCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRcblx0dmFyIFZlY3RvcldvcmQgPSB7XG5cdFx0Z2V0UGF0aHMgOiBmdW5jdGlvbihuYW1lLCByaWdodCwgdG9wLCBzY2FsZSkge1xuXHRcdFx0cmlnaHQgPSByaWdodCB8fCAwO1xuXHRcdFx0dG9wID0gdG9wIHx8IDA7XG5cblx0XHRcdHZhciBjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHR2YXIgbGluZXMgPSBbXTtcblxuXHRcdFx0Zm9yKHZhciBpPTA7IGk8bmFtZS5sZW5ndGg7IGkrKynCoHtcblx0XHRcdFx0dmFyIGxldHRlciA9IG5hbWVbaV07XG5cdFx0XHRcdGlmKGxldHRlciA9PT0gJyAnKSB7XG5cdFx0XHRcdFx0cmlnaHQgKz0gQWxwaGFiZXQuZ2V0TlNwYWNlKCkgKiBzY2FsZTtcblx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGxldHRlckRlZiA9IEFscGhhYmV0LmdldExldHRlcihsZXR0ZXIpO1xuXHRcdFx0XHRsZXR0ZXJEZWYgPSBsZXR0ZXJEZWYuc2NhbGUoc2NhbGUpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlckRlZik7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgbGV0dGVySm9pbmVkRW5kID0gZmFsc2U7XG5cdFx0XHRcdGxldHRlckRlZi5wYXRocy5mb3JFYWNoKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdFx0XHR2YXIgZGVmID0gcGF0aC50cmFuc2xhdGUoW3JpZ2h0LCB0b3BdKTtcblx0XHRcdFx0XHR2YXIgam9pbmVkU3RhcnQgPSBkZWYubmFtZSAmJiBkZWYubmFtZS5pbmRleE9mKCdqb2luYScpID4gLTE7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZEVuZCA9IC9qb2luKGE/KWIvLnRlc3QoZGVmLm5hbWUpO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyLCBqb2luZWRTdGFydCwgam9pbmVkRW5kKTtcblx0XHRcdFx0XHRsZXR0ZXJKb2luZWRFbmQgPSBsZXR0ZXJKb2luZWRFbmQgfHwgam9pbmVkRW5kO1xuXHRcdFx0XHRcdGlmKGpvaW5lZFN0YXJ0ICYmIGNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vYXBwZW5kIGF1IGNvbnRpbnVvdXNcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYXBwZW5kKGRlZiwgbGV0dGVyKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYoam9pbmVkRW5kICYmICFjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL3N0YXJ0IHVuIG5vdXZlYXUgbGluZVxuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGRlZjtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMubmFtZSA9IGxldHRlcjtcblx0XHRcdFx0XHRcdGxpbmVzLnB1c2goY29udGludW91cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxpbmVzLnB1c2goZGVmKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZighbGV0dGVySm9pbmVkRW5kKSB7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0cmlnaHQgKz0gbGV0dGVyRGVmLmJvdW5kaW5nWzFdWzBdO1xuXHRcdFx0XHQvL2NvbnNvbGUudGFibGUoW3tsZXR0ZXI6bmFtZVtpXSwgbGV0dGVyV2lkdGg6IGxldHRlci5ib3VuZGluZ1sxXVswXSwgdG90YWw6cmlnaHR9XSk7XHRcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGxpbmVzO1xuXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBWZWN0b3JXb3JkO1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcmVnID0gLyhbYS16XSkoWzAtOVxcc1xcLFxcLlxcLV0rKS9naTtcblx0XHRcblx0Ly9leHBlY3RlZCBsZW5ndGggb2YgZWFjaCB0eXBlXG5cdHZhciBleHBlY3RlZExlbmd0aHMgPSB7XG5cdFx0bSA6IDIsXG5cdFx0bCA6IDIsXG5cdFx0diA6IDEsXG5cdFx0aCA6IDEsXG5cdFx0YyA6IDYsXG5cdFx0cyA6IDRcblx0fTtcblxuXHR2YXIgUGF0aCA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkKSB7XG5cdFx0dGhpcy5zdmcgPSBzdmc7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHQvL2lmKHN2ZykgY29uc29sZS5sb2coc3ZnLCBwYXJzZWQpO1xuXHRcdHRoaXMuc2V0UGFyc2VkKHBhcnNlZCB8fCB0aGlzLnBhcnNlKHN2ZykpO1xuXHR9O1xuXG5cdHZhciByZWZpbmVCb3VuZGluZyA9IGZ1bmN0aW9uKGJvdW5kaW5nLCBwb2ludCkge1xuXHRcdGJvdW5kaW5nWzBdID0gYm91bmRpbmdbMF0gfHwgcG9pbnQuc2xpY2UoMCk7XG5cdFx0Ym91bmRpbmdbMV0gPSBib3VuZGluZ1sxXSB8fCBwb2ludC5zbGljZSgwKTtcblx0XHQvL3RvcCBsZWZ0XG5cdFx0aWYocG9pbnRbMF0gPCBib3VuZGluZ1swXVswXSkgYm91bmRpbmdbMF1bMF0gPSBwb2ludFswXTtcblx0XHRpZihwb2ludFsxXSA8IGJvdW5kaW5nWzBdWzFdKSBib3VuZGluZ1swXVsxXSA9IHBvaW50WzFdO1xuXHRcdC8vYm90dG9tIHJpZ2h0XG5cdFx0aWYocG9pbnRbMF0gPiBib3VuZGluZ1sxXVswXSkgYm91bmRpbmdbMV1bMF0gPSBwb2ludFswXTtcblx0XHRpZihwb2ludFsxXSA+IGJvdW5kaW5nWzFdWzFdKSBib3VuZGluZ1sxXVsxXSA9IHBvaW50WzFdO1xuXHRcdHJldHVybiBib3VuZGluZztcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnNldFNWRyA9IGZ1bmN0aW9uKHN2Zykge1xuXHRcdHRoaXMuc3ZnID0gc3ZnO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLnNldFBhcnNlZCA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuXHRcdC8vY29uc29sZS5sb2cocGFyc2VkKTtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0XHR0aGlzLmZpbmRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldEN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY3ViaWMgfHwgdGhpcy5wYXJzZUN1YmljKCk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRUb3RhbExlbmd0aCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyBhbiBTVkcgc3RyaW5nIG9mIHRoZSBwYXRoIHNlZ2VtbnRzLiBJdCBpcyBub3QgdGhlIHN2ZyBwcm9wZXJ0eSBvZiB0aGUgcGF0aCwgYXMgaXQgaXMgcG90ZW50aWFsbHkgdHJhbnNmb3JtZWRcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0U1ZHU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihzdmcsIHNlZ21lbnQpe1xuXHRcdFx0cmV0dXJuIHN2ZyArIHNlZ21lbnQudHlwZSArIHNlZ21lbnQuYW5jaG9ycy5qb2luKCcsJyk7IFxuXHRcdH0sICcnKTtcblx0fTtcblxuXHQvKipcblx0UGFyc2VzIGFuIFNWRyBwYXRoIHN0cmluZyB0byBhIGxpc3Qgb2Ygc2VnbWVudCBkZWZpbml0aW9ucyB3aXRoIEFCU09MVVRFIHBvc2l0aW9ucyB1c2luZyBSYXBoYWVsLnBhdGgyY3VydmVcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbihzdmcpIHtcblx0XHR2YXIgY3VydmUgPSBSYXBoYWVsLnBhdGgyY3VydmUoc3ZnKTtcblx0XHR2YXIgcGF0aCA9IGN1cnZlLm1hcChmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlIDogcG9pbnQuc2hpZnQoKSxcblx0XHRcdFx0YW5jaG9ycyA6IHBvaW50XG5cdFx0XHR9O1xuXHRcdH0pO1xuXHRcdHJldHVybiBwYXRoO1xuXHR9O1xuXG5cdC8qKlxuXHRcdFBhcnNlcyBhIHBhdGggZGVmaW5lZCBieSBwYXJzZVBhdGggdG8gYSBsaXN0IG9mIGJlemllciBwb2ludHMgdG8gYmUgdXNlZCBieSBHcmVlbnNvY2sgQmV6aWVyIHBsdWdpbiwgZm9yIGV4YW1wbGVcblx0XHRUd2Vlbk1heC50byhzcHJpdGUsIDUwMCwge1xuXHRcdFx0YmV6aWVyOnt0eXBlOlwiY3ViaWNcIiwgdmFsdWVzOmN1YmljfSxcblx0XHRcdGVhc2U6UXVhZC5lYXNlSW5PdXQsXG5cdFx0XHR1c2VGcmFtZXMgOiB0cnVlXG5cdFx0fSk7XG5cdFx0Ki9cblx0UGF0aC5wcm90b3R5cGUucGFyc2VDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vY29uc29sZS5sb2cocGF0aCk7XG5cdFx0Ly9hc3N1bWVkIGZpcnN0IGVsZW1lbnQgaXMgYSBtb3ZldG9cblx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuY3ViaWMgPSB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oYW5jaG9ycywgc2VnbWVudCl7XG5cdFx0XHR2YXIgYSA9IHNlZ21lbnQuYW5jaG9ycztcblx0XHRcdGlmKHNlZ21lbnQudHlwZT09PSdNJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTphWzFdfSk7XG5cdFx0XHR9IGVsc2UgaWYoc2VnbWVudC50eXBlPT09J0wnKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMl0sIHk6IGFbM119KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzRdLCB5OiBhWzVdfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHRcdH0sIFtdKTtcblxuXHRcdHJldHVybiBhbmNob3JzO1xuXG5cdH07XG5cblx0Ly90cm91dmUgbGUgYm91bmRpbmcgYm94IGQndW5lIGxldHRyZSAoZW4gc2UgZmlhbnQganVzdGUgc3VyIGxlcyBwb2ludHMuLi4gb24gbmUgY2FsY3VsZSBwYXMgb3UgcGFzc2UgbGUgcGF0aClcblx0UGF0aC5wcm90b3R5cGUuZmluZEJvdW5kaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGJvdW5kaW5nID0gdGhpcy5ib3VuZGluZyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihib3VuZGluZywgcCl7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHAuYW5jaG9ycztcblx0XHRcdHZhciBwb2ludDtcblx0XHRcdGlmKGFuY2hvcnMubGVuZ3RoID09PSAyKSB7XG5cdFx0XHRcdHBvaW50ID0gW2FuY2hvcnNbMF0sIGFuY2hvcnNbMV1dO1xuXHRcdFx0fSBlbHNlIGlmKGFuY2hvcnMubGVuZ3RoID09PSA2KSB7XG5cdFx0XHRcdHBvaW50ID0gW2FuY2hvcnNbNF0sIGFuY2hvcnNbNV1dO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlZmluZUJvdW5kaW5nKGJvdW5kaW5nLCBwb2ludCk7XG5cdFx0fSwgW10pO1xuXHRcdHJldHVybiBib3VuZGluZztcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKG9mZnNldCkge1xuXHRcdHZhciBwYXJzZWQgPSB0aGlzLnBhcnNlZC5tYXAoZnVuY3Rpb24oZGVmKSB7XG5cdFx0XHR2YXIgbmV3RGVmID0gT2JqZWN0LmNyZWF0ZShkZWYpO1xuXHRcdFx0bmV3RGVmLmFuY2hvcnMgPSBkZWYuYW5jaG9ycy5tYXAoZnVuY3Rpb24oY29vcmQsIGkpe1xuXHRcdFx0XHRyZXR1cm4gY29vcmQgKz0gb2Zmc2V0W2klMl07XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBuZXdEZWY7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShudWxsLCB0aGlzLm5hbWUsIHBhcnNlZCk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihyYXRpbykge1xuXHRcdHZhciBwYXJzZWQgPSB0aGlzLnBhcnNlZC5tYXAoZnVuY3Rpb24oZGVmKSB7XG5cdFx0XHR2YXIgbmV3RGVmID0gT2JqZWN0LmNyZWF0ZShkZWYpO1xuXHRcdFx0bmV3RGVmLmFuY2hvcnMgPSBkZWYuYW5jaG9ycy5tYXAoZnVuY3Rpb24oY29vcmQsIGkpe1xuXHRcdFx0XHRyZXR1cm4gY29vcmQgKj0gcmF0aW87XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBuZXdEZWY7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShudWxsLCB0aGlzLm5hbWUsIHBhcnNlZCk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24ocGFydCwgbmFtZSnCoHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnQpO1xuXHRcdGlmKG5hbWUpIHRoaXMubmFtZSArPSBuYW1lO1xuXHRcdHRoaXMuc2V0UGFyc2VkKHRoaXMucGFyc2VkLmNvbmNhdChwYXJ0LnBhcnNlZC5zbGljZSgxKSkpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLnJlZmluZUJvdW5kaW5nID0gcmVmaW5lQm91bmRpbmc7XG5cblx0UGF0aC5mYWN0b3J5ID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQpIHtcblx0XHRyZXR1cm4gbmV3IFBhdGgoc3ZnLCBuYW1lLCBwYXJzZWQpO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoO1xuXG59KSk7XG5cblxuIl19
