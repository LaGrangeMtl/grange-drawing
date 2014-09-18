(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var DrawPath = require('app/rose/drawing/DrawPath.js');
	var VectorWord = require('app/rose/drawing/VectorWord.js');
	var Alphabet = require('app/rose/drawing/Alphabet.js');


	var W = 1400;
	var H = 1200;

	var scaleFactor = 1;

	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	names.length = 6;/**/


	var getStage = (function(){
		var stage;
		var init = function(){
			return Raphael("svg", W, H);
		};
		return function(){
			return stage = stage || init();
		}
	})();


	var loading = Alphabet.init();	
	loading.then(function(){
		var incr = H / names.length;
		names.forEach(function(name, k){
			//traceName(name, 0, k * incr);

			var paths = VectorWord.getPaths(name, 0, k * incr, scaleFactor);

			DrawPath.group(paths, getStage(), {pxPerSecond:200, color:'#ff0000', strokeWidth:2});

		});

	});
},{"app/rose/drawing/Alphabet.js":2,"app/rose/drawing/DrawPath.js":3,"app/rose/drawing/VectorWord.js":4,"jquery":"jquery","raphael":"raphael"}],2:[function(require,module,exports){
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
	if (typeof define === 'function' && define.amd) {
		define(
			'rose/drawing/Alphabet',//must be a string, not a var
			[
				'jquery',
				'lagrange/drawing/Path'
			], function ($) {
			return (ns[name] = factory($, Path));
		});
	} else if (typeof exports === 'object') {
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
	    ns[name] = module.exports = factory(require('raphael'), require('gsap'));
  	} else {
		ns[name] = factory(root.Raphael, (root.GreenSockGlobals || root));
	}
}(this, function (Raphael, TweenMax) {
	"use strict";

	//gsap exports TweenMax
	var gsap = window.GreenSockGlobals || window;

	var defaults = {
		color: '#000000',
		strokeWidth : 0.6,
		pxPerSecond : 100 //speed of drawing
	};


	var DrawPath = function(){

		var settings = {};
		var pathDef;
		var stage;

		//prend la string des points SVG
		this.init = function(path, stageParam, params) {
			pathDef = path;
			stage = stageParam;
			settings.color = params.color ||  defaults.color;
			settings.strokeWidth = params.strokeWidth ||  defaults.strokeWidth;
			settings.pxPerSecond = params.pxPerSecond ||  defaults.pxPerSecond;
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

			var el;
			var update = function(){

				var pathPart = Raphael.getSubpath(pathStr, 0, anim.to);
				if(el) el.remove();
				el = stage.path(pathPart);
				el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});
			};

			return gsap.TweenMax.to(anim, time, {
				to : length,
				onUpdate : update,
				ease : gsap.Quad.easeIn
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



},{"gsap":"gsap","raphael":"raphael"}],4:[function(require,module,exports){
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
	if (typeof define === 'function' && define.amd) {
		define(
			'rose/drawing/VectorWord',//must be a string, not a var
			[
				'rose/drawing/Alphabet'
			], function (Alphabet) {
			return (ns[name] = factory(Alphabet));
		});
	} else if (typeof exports === 'object') {
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
	if (typeof define === 'function' && define.amd) {
		define(
			'lagrange/drawing/Path',//must be a string, not a var
			[
				'raphael'
			], function (Raphael) {
			return (ns[name] = factory(Raphael));
		});
	} else if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('raphael'));
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
		
		return Raphael.getTotalLength(this.getSVGString())

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
	Parses an SVG path string to a list of segment definitions with ABSOLUTE positions (therefore we don't use Raphael.parsePathString)
	*/
	Path.prototype.parse = function(svg) {
		var m;
		var lastPoint;
		var lastBezierAnchor;
		var rawDefs = [];

		while(m = reg.exec(svg)) {
			var type = m[1];
			var genericType = type.toLowerCase();
			var expectedLength = expectedLengths[genericType];
			var anchors = m[2].match(/\-?[0-9\.]+/g).map(function(v, i) {
				return Number(v);
			});
			//svg srtandards states that if a command of a same type follows another, the command is not required
			for(var i = 0; i < anchors.length; i += expectedLength){
				rawDefs.push({
					type : type,
					genericType : genericType,
					anchors : anchors.slice(i, i+expectedLength)
				});
			}

		};
		//console.log(svg);

		var path = rawDefs.map(function(def) {

			//console.log(def);
			var type = def.type;
			var createJsCommand;
			var isAbsolute = type === type.toUpperCase();

			//transform relative points to absolute
			var anchors = def.anchors.map(function(v, i) {
				if(!isAbsolute) v = v + lastPoint[i % 2];
				return v;
			});

			//console.log(anchors, type);

			switch(def.genericType) {
				//moveTo
				case 'm':
					createJsCommand = 'moveTo';
					break;
				case 'l':
					createJsCommand = 'lineTo';
					break;
				//horizontal line to
				case 'h':
					type = 'l';
					createJsCommand = 'lineTo';
					anchors.push(lastPoint[1]);
					break;
				//vertical line to
				case 'v':
					type = 'l';
					createJsCommand = 'lineTo';
					anchors.unshift(lastPoint[0]);
					break;
				case 's':
					if(lastBezierAnchor){
						anchors.splice(0, 0, lastBezierAnchor[0] , lastBezierAnchor[1] );
					}
					//fallthrough
				case 'c':
					type = 'c';
					createJsCommand = 'bezierCurveTo';
					lastBezierAnchor = [
						2*anchors[4] - anchors[2],
						2*anchors[5] - anchors[3]
					];
					break;

			}
			
			lastPoint = [anchors[anchors.length-2], anchors[anchors.length-1]];

			//console.log(anchors);
			return {
				type : type.toUpperCase(),
				createJsCommand: createJsCommand,
				anchors : anchors
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0XG5cdHZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XG5cdHZhciBSYXBoYWVsID0gcmVxdWlyZSgncmFwaGFlbCcpO1xuXHR2YXIgRHJhd1BhdGggPSByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL0RyYXdQYXRoLmpzJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzJyk7XG5cdHZhciBBbHBoYWJldCA9IHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKTtcblxuXG5cdHZhciBXID0gMTQwMDtcblx0dmFyIEggPSAxMjAwO1xuXG5cdHZhciBzY2FsZUZhY3RvciA9IDE7XG5cblx0dmFyIG5hbWVzID0gW1wiSmVzc2ljYSBXYW5uaW5nXCIsXCJKdWxpYSBSb2Nrd2VsbFwiLFwiQ2Fyb2wgSHViYmFyZFwiLFwiUm9uYWxkIENhbmR5XCIsXCJKb2huIE5ld3RvblwiLFwiRWx2aXMgTmljb2xlXCIsXCJHbG9yaWEgV2VhdmVyXCIsXCJKdWxpYSBDcm9ua2l0ZVwiLFwiTW90aGVyIFJvZ2Vyc1wiLFwiQ2hldnkgSXJ3aW5cIixcIkVkZGllIEFsbGVuXCIsXCJOb3JtYW4gSmFja3NvblwiLFwiUGV0ZXIgUm9nZXJzXCIsXCJXZWlyZCBDaGFzZVwiLFwiQ29saW4gTWF5c1wiLFwiTmFwb2xlb24gTWFydGluXCIsXCJFZGdhciBTaW1wc29uXCIsXCJNb2hhbW1hZCBNY0NhcnRuZXlcIixcIkxpYmVyYWNlIFdpbGxpYW1zXCIsXCJGaWVsZHMgQnVybmV0dFwiLFwiU3RldmUgQXNoZVwiLFwiQ2FycmllIENoYXJsZXNcIixcIlRvbW15IFBhc3RldXJcIixcIkVkZGllIFNpbHZlcnN0b25lXCIsXCJPcHJhaCBBc2hlXCIsXCJSYXkgQmFsbFwiLFwiSmltIERpYW5hXCIsXCJNaWNoZWxhbmdlbG8gRWFzdHdvb2RcIixcIkdlb3JnZSBTaW1wc29uXCIsXCJBbGljaWEgQXVzdGVuXCIsXCJKZXNzaWNhIE5pY29sZVwiLFwiTWFyaWx5biBFdmVyZXR0XCIsXCJLZWl0aCBFYXN0d29vZFwiLFwiUGFibG8gRWFzdHdvb2RcIixcIlBleXRvbiBMdXRoZXJcIixcIk1vemFydCBBcm1zdHJvbmdcIixcIk1pY2hhZWwgQnVybmV0dFwiLFwiS2VpdGggR2xvdmVyXCIsXCJFbGl6YWJldGggQ2hpbGRcIixcIk1pbGVzIEFzdGFpcmVcIixcIkFuZHkgRWRpc29uXCIsXCJNYXJ0aW4gTGVubm9uXCIsXCJUb20gUGljY2Fzb1wiLFwiQmV5b25jZSBEaXNuZXlcIixcIlBldGVyIENsaW50b25cIixcIkhlbnJ5IEtlbm5lZHlcIixcIlBhdWwgQ2hpbGRcIixcIkxld2lzIFNhZ2FuXCIsXCJNaWNoZWxhbmdlbG8gTGVlXCIsXCJNYXJpbHluIEZpc2hlclwiXTtcblx0bmFtZXMubGVuZ3RoID0gNjsvKiovXG5cblxuXHR2YXIgZ2V0U3RhZ2UgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgc3RhZ2U7XG5cdFx0dmFyIGluaXQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIFJhcGhhZWwoXCJzdmdcIiwgVywgSCk7XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzdGFnZSA9IHN0YWdlIHx8IGluaXQoKTtcblx0XHR9XG5cdH0pKCk7XG5cblxuXHR2YXIgbG9hZGluZyA9IEFscGhhYmV0LmluaXQoKTtcdFxuXHRsb2FkaW5nLnRoZW4oZnVuY3Rpb24oKXtcblx0XHR2YXIgaW5jciA9IEggLyBuYW1lcy5sZW5ndGg7XG5cdFx0bmFtZXMuZm9yRWFjaChmdW5jdGlvbihuYW1lLCBrKXtcblx0XHRcdC8vdHJhY2VOYW1lKG5hbWUsIDAsIGsgKiBpbmNyKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gVmVjdG9yV29yZC5nZXRQYXRocyhuYW1lLCAwLCBrICogaW5jciwgc2NhbGVGYWN0b3IpO1xuXG5cdFx0XHREcmF3UGF0aC5ncm91cChwYXRocywgZ2V0U3RhZ2UoKSwge3B4UGVyU2Vjb25kOjIwMCwgY29sb3I6JyNmZjAwMDAnLCBzdHJva2VXaWR0aDoyfSk7XG5cblx0XHR9KTtcblxuXHR9KTsiLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0FscGhhYmV0Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShcblx0XHRcdCdyb3NlL2RyYXdpbmcvQWxwaGFiZXQnLC8vbXVzdCBiZSBhIHN0cmluZywgbm90IGEgdmFyXG5cdFx0XHRbXG5cdFx0XHRcdCdqcXVlcnknLFxuXHRcdFx0XHQnbGFncmFuZ2UvZHJhd2luZy9QYXRoJ1xuXHRcdFx0XSwgZnVuY3Rpb24gKCQpIHtcblx0XHRcdHJldHVybiAobnNbbmFtZV0gPSBmYWN0b3J5KCQsIFBhdGgpKTtcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcycpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGgpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBTQ0FMRSA9IDE7XG5cdHZhciBzdmdGaWxlID0gJ2Fzc2V0cy9hbHBoYWJldC5zdmcnO1xuXG5cdHZhciBsZXR0ZXJzID0ge307XG5cblx0dmFyIExldHRlciA9IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5zZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5ib3VuZGluZyA9IHRoaXMucGF0aHMucmVkdWNlKGZ1bmN0aW9uKGJvdW5kaW5nLCBwYXRoKXtcblx0XHRcdHZhciBwYXRoQm91bmRpbmcgPSBwYXRoLmZpbmRCb3VuZGluZygpO1xuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZyA9IFBhdGgucHJvdG90eXBlLnJlZmluZUJvdW5kaW5nKGJvdW5kaW5nLCBwYXRoQm91bmRpbmcpO1xuXHRcdFx0cmV0dXJuIGJvdW5kaW5nO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0aWYodGhpcy5ib3R0b21SaWdodCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmJvdHRvbVJpZ2h0LnBhcnNlZFswXS5hbmNob3JzO1xuXHRcdFx0dGhpcy5ib3VuZGluZ1sxXSA9IFthbmNob3JzWzBdLCBhbmNob3JzWzFdXTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5ib3R0b21SaWdodCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmdbMV1bMF07XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbihvZmZzZXQpe1xuXHRcdHRoaXMub2Zmc2V0ID0gb2Zmc2V0O1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzLm1hcChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cGF0aCA9IHBhdGgudHJhbnNsYXRlKG9mZnNldCk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0fSk7XG5cdFx0dGhpcy5ib3R0b21SaWdodCA9ICh0aGlzLmJvdHRvbVJpZ2h0ICYmIHRoaXMuYm90dG9tUmlnaHQudHJhbnNsYXRlKG9mZnNldCkpO1xuXHRcdHRoaXMuc2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgbGV0dGVyLCBzY2FsZWRcblx0TGV0dGVyLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcblx0XHRpZighdGhpcy5wYXRocykgcmV0dXJuIHRoaXM7XG5cdFx0dmFyIHNjYWxlZCA9IG5ldyBMZXR0ZXIodGhpcy5uYW1lKTtcblx0XHR0aGlzLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCl7XG5cdFx0XHRzY2FsZWQuYWRkUGF0aChwYXRoLnNjYWxlKHNjYWxlKSk7XG5cdFx0fSk7XG5cdFx0c2NhbGVkLmJvdHRvbVJpZ2h0ID0gKHRoaXMuYm90dG9tUmlnaHQgJiYgdGhpcy5ib3R0b21SaWdodC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zZXRCb3VuZGluZygpO1xuXHRcdHJldHVybiBzY2FsZWQ7XG5cdH07XG5cblxuXHR2YXIgcGFyc2VTVkcgPSBmdW5jdGlvbihkYXRhKXtcblx0XHR2YXIgYm91bmRpbmdzID0gW107XG5cblx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdHZhciBkb2MgPSAkKGRhdGEpO1xuXHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdHZhciBsYXllciA9ICQoZWwpO1xuXHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblxuXHRcdFx0aWYoaWQgPT0gJ194MkRfJykge1xuXHRcdFx0XHRpZCA9ICctJztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgbGV0dGVyID0gbGV0dGVyc1tpZF0gPSBuZXcgTGV0dGVyKGlkKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gbGF5ZXIuZmluZCgncGF0aCcpO1xuXHRcdFx0Ly9pZihwYXRocy5sZW5ndGg9PTApIGNvbnNvbGUubG9nKGxheWVyKTtcblx0XHRcdHZhciBsZXR0ZXJQYXRoc0JvdW5kaW5nID0gW107XG5cdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIHBhdGhFbCA9ICQoZWwpO1x0XHRcdFx0XG5cdFx0XHRcdGxldHRlci5hZGRQYXRoKCBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpKS5zY2FsZShTQ0FMRSkgKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXR0ZXIuc2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmdzLnB1c2gobGV0dGVyLmJvdW5kaW5nKTtcblxuXHRcdH0pO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhib3VuZGluZ3MpO1xuXHRcdC8vdHJvdXZlIGxlIHRvcCBhYnNvbHUgKHRvcCBkZSBsYSBsZXR0cmUgbGEgcGx1cyBoYXV0ZSlcblx0XHR2YXIgdG9wID0gYm91bmRpbmdzLnJlZHVjZShmdW5jdGlvbihtaW4sIGJvdW5kaW5nKXtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IGJvdW5kaW5nWzBdWzFdKSB7XG5cdFx0XHRcdG1pbiA9IGJvdW5kaW5nWzBdWzFdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdC8vY29uc29sZS5sb2codG9wKTtcblx0XHQvL2NvbnNvbGUubG9nKGxldHRlcnMpO1xuXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhsZXR0ZXJzKTtcblx0XHQvL2FqdXN0ZSBsZSBiYXNlbGluZSBkZSBjaGFxdWUgbGV0dHJlXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0bGV0dGVyc1trZXldLnNldE9mZnNldChbLTEgKiBsZXR0ZXJzW2tleV0uYm91bmRpbmdbMF1bMF0sIC0xICogdG9wXSk7XG5cdFx0fSk7XG5cblxuXHR9O1xuXG5cdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdHZhciBsb2FkaW5nID0gJC5hamF4KHtcblx0XHRcdHVybCA6IHN2Z0ZpbGUsXG5cdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdH0pO1xuXG5cdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhiKTtcblx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHR9O1xuXG5cdHZhciBBbHBoYWJldCA9IHtcblx0XHRpbml0IDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZG9Mb2FkKCk7XG5cdFx0fSxcblx0XHRnZXRMZXR0ZXIgOiBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzW2xdO1xuXHRcdH0sXG5cdFx0Z2V0TlNwYWNlIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0RyYXdQYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3JhcGhhZWwnKSwgcmVxdWlyZSgnZ3NhcCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LlJhcGhhZWwsIChyb290LkdyZWVuU29ja0dsb2JhbHMgfHwgcm9vdCkpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChSYXBoYWVsLCBUd2Vlbk1heCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL2dzYXAgZXhwb3J0cyBUd2Vlbk1heFxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Y29sb3I6ICcjMDAwMDAwJyxcblx0XHRzdHJva2VXaWR0aCA6IDAuNixcblx0XHRweFBlclNlY29uZCA6IDEwMCAvL3NwZWVkIG9mIGRyYXdpbmdcblx0fTtcblxuXG5cdHZhciBEcmF3UGF0aCA9IGZ1bmN0aW9uKCl7XG5cblx0XHR2YXIgc2V0dGluZ3MgPSB7fTtcblx0XHR2YXIgcGF0aERlZjtcblx0XHR2YXIgc3RhZ2U7XG5cblx0XHQvL3ByZW5kIGxhIHN0cmluZyBkZXMgcG9pbnRzIFNWR1xuXHRcdHRoaXMuaW5pdCA9IGZ1bmN0aW9uKHBhdGgsIHN0YWdlUGFyYW0sIHBhcmFtcykge1xuXHRcdFx0cGF0aERlZiA9IHBhdGg7XG5cdFx0XHRzdGFnZSA9IHN0YWdlUGFyYW07XG5cdFx0XHRzZXR0aW5ncy5jb2xvciA9IHBhcmFtcy5jb2xvciB8fCAgZGVmYXVsdHMuY29sb3I7XG5cdFx0XHRzZXR0aW5ncy5zdHJva2VXaWR0aCA9IHBhcmFtcy5zdHJva2VXaWR0aCB8fCAgZGVmYXVsdHMuc3Ryb2tlV2lkdGg7XG5cdFx0XHRzZXR0aW5ncy5weFBlclNlY29uZCA9IHBhcmFtcy5weFBlclNlY29uZCB8fCAgZGVmYXVsdHMucHhQZXJTZWNvbmQ7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9O1xuXG5cdFx0dGhpcy5zaG93ID0gZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcGF0aCA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XHRcdFx0XG5cdFx0XHR2YXIgZWwgPSBzdGFnZS5wYXRoKHBhdGgpO1xuXHRcdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc2V0dGluZ3Muc3Ryb2tlV2lkdGgsIHN0cm9rZTogc2V0dGluZ3MuY29sb3J9KTsvKiovXG5cdFx0fTtcblxuXHRcdHRoaXMuZHJhdyA9IGZ1bmN0aW9uKHB4UGVyU2Vjb25kKXtcblx0XHRcdHZhciBwYXRoU3RyID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdHZhciBsZW5ndGggPSBwYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdFx0dmFyIHRpbWUgPSBsZW5ndGggLyAocHhQZXJTZWNvbmQgfHwgc2V0dGluZ3MucHhQZXJTZWNvbmQpO1xuXG5cdFx0XHR2YXIgYW5pbSA9IHt0bzogMH07XG5cblx0XHRcdHZhciBlbDtcblx0XHRcdHZhciB1cGRhdGUgPSBmdW5jdGlvbigpe1xuXG5cdFx0XHRcdHZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBhbmltLnRvKTtcblx0XHRcdFx0aWYoZWwpIGVsLnJlbW92ZSgpO1xuXHRcdFx0XHRlbCA9IHN0YWdlLnBhdGgocGF0aFBhcnQpO1xuXHRcdFx0XHRlbC5hdHRyKHtcInN0cm9rZS13aWR0aFwiOiBzZXR0aW5ncy5zdHJva2VXaWR0aCwgc3Ryb2tlOiBzZXR0aW5ncy5jb2xvcn0pO1xuXHRcdFx0fTtcblxuXHRcdFx0cmV0dXJuIGdzYXAuVHdlZW5NYXgudG8oYW5pbSwgdGltZSwge1xuXHRcdFx0XHR0byA6IGxlbmd0aCxcblx0XHRcdFx0b25VcGRhdGUgOiB1cGRhdGUsXG5cdFx0XHRcdGVhc2UgOiBnc2FwLlF1YWQuZWFzZUluXG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdH07XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdERyYXdQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihvKSB7XG5cdFx0cmV0dXJuIERyYXdQYXRoLmFwcGx5KG8gfHwge30pO1xuXHR9O1xuXG5cdC8qKlxuXHRTdGF0aWMuIFJldHVybnMgYSB0aW1lbGluZW1heCBvZiBhbGwgdGhlIHBhdGhzIGluIHRoZSBncm91cCwgZHJhd24gb25lIGF0IGEgdGltZS5cblx0Ki9cblx0RHJhd1BhdGguZ3JvdXAgPSBmdW5jdGlvbihwYXRocywgc3RhZ2UsIHNldHRpbmdzLCBvbkNvbXBsZXRlKSB7XG5cdFx0cmV0dXJuIHBhdGhzLnJlZHVjZShmdW5jdGlvbih0bCwgcGF0aCl7XG5cdFx0XHR2YXIgZHJhd2luZ1BhdGggPSBEcmF3UGF0aC5mYWN0b3J5KCkuaW5pdChwYXRoLCBzdGFnZSwgc2V0dGluZ3MpO1xuXHRcdFx0cmV0dXJuIHRsLmFwcGVuZChkcmF3aW5nUGF0aC5kcmF3KCkpO1xuXHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHsgb25Db21wbGV0ZTogKG9uQ29tcGxldGUgfHwgZnVuY3Rpb24oKXt9KSB9KSk7XG5cdH07XG5cblx0cmV0dXJuIERyYXdQYXRoO1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL1ZlY3RvcldvcmQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0ZGVmaW5lKFxuXHRcdFx0J3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkJywvL211c3QgYmUgYSBzdHJpbmcsIG5vdCBhIHZhclxuXHRcdFx0W1xuXHRcdFx0XHQncm9zZS9kcmF3aW5nL0FscGhhYmV0J1xuXHRcdFx0XSwgZnVuY3Rpb24gKEFscGhhYmV0KSB7XG5cdFx0XHRyZXR1cm4gKG5zW25hbWVdID0gZmFjdG9yeShBbHBoYWJldCkpO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdyb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9zZS5kcmF3aW5nLkFscGhhYmV0KTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQWxwaGFiZXQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXHRcdGdldFBhdGhzIDogZnVuY3Rpb24obmFtZSwgcmlnaHQsIHRvcCwgc2NhbGUpIHtcblx0XHRcdHJpZ2h0ID0gcmlnaHQgfHwgMDtcblx0XHRcdHRvcCA9IHRvcCB8fCAwO1xuXG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0dmFyIGxpbmVzID0gW107XG5cblx0XHRcdGZvcih2YXIgaT0wOyBpPG5hbWUubGVuZ3RoOyBpKyspwqB7XG5cdFx0XHRcdHZhciBsZXR0ZXIgPSBuYW1lW2ldO1xuXHRcdFx0XHRpZihsZXR0ZXIgPT09ICcgJykge1xuXHRcdFx0XHRcdHJpZ2h0ICs9IEFscGhhYmV0LmdldE5TcGFjZSgpICogc2NhbGU7XG5cdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBsZXR0ZXJEZWYgPSBBbHBoYWJldC5nZXRMZXR0ZXIobGV0dGVyKTtcblx0XHRcdFx0bGV0dGVyRGVmID0gbGV0dGVyRGVmLnNjYWxlKHNjYWxlKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXJEZWYpO1xuXHRcdFx0XHRcblx0XHRcdFx0dmFyIGxldHRlckpvaW5lZEVuZCA9IGZhbHNlO1xuXHRcdFx0XHRsZXR0ZXJEZWYucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHRcdFx0dmFyIGRlZiA9IHBhdGgudHJhbnNsYXRlKFtyaWdodCwgdG9wXSk7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZFN0YXJ0ID0gZGVmLm5hbWUgJiYgZGVmLm5hbWUuaW5kZXhPZignam9pbmEnKSA+IC0xO1xuXHRcdFx0XHRcdHZhciBqb2luZWRFbmQgPSAvam9pbihhPyliLy50ZXN0KGRlZi5uYW1lKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgam9pbmVkU3RhcnQsIGpvaW5lZEVuZCk7XG5cdFx0XHRcdFx0bGV0dGVySm9pbmVkRW5kID0gbGV0dGVySm9pbmVkRW5kIHx8IGpvaW5lZEVuZDtcblx0XHRcdFx0XHRpZihqb2luZWRTdGFydCAmJiBjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL2FwcGVuZCBhdSBjb250aW51b3VzXG5cdFx0XHRcdFx0XHRjb250aW51b3VzLmFwcGVuZChkZWYsIGxldHRlcik7XG5cdFx0XHRcdFx0fSBlbHNlIGlmKGpvaW5lZEVuZCAmJiAhY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9zdGFydCB1biBub3V2ZWF1IGxpbmVcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBkZWY7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzLm5hbWUgPSBsZXR0ZXI7XG5cdFx0XHRcdFx0XHRsaW5lcy5wdXNoKGNvbnRpbnVvdXMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRsaW5lcy5wdXNoKGRlZik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoIWxldHRlckpvaW5lZEVuZCkge1xuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdHJpZ2h0ICs9IGxldHRlckRlZi5ib3VuZGluZ1sxXVswXTtcblx0XHRcdFx0Ly9jb25zb2xlLnRhYmxlKFt7bGV0dGVyOm5hbWVbaV0sIGxldHRlcldpZHRoOiBsZXR0ZXIuYm91bmRpbmdbMV1bMF0sIHRvdGFsOnJpZ2h0fV0pO1x0XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBsaW5lcztcblxuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gVmVjdG9yV29yZDtcblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHRkZWZpbmUoXG5cdFx0XHQnbGFncmFuZ2UvZHJhd2luZy9QYXRoJywvL211c3QgYmUgYSBzdHJpbmcsIG5vdCBhIHZhclxuXHRcdFx0W1xuXHRcdFx0XHQncmFwaGFlbCdcblx0XHRcdF0sIGZ1bmN0aW9uIChSYXBoYWVsKSB7XG5cdFx0XHRyZXR1cm4gKG5zW25hbWVdID0gZmFjdG9yeShSYXBoYWVsKSk7XG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcmVnID0gLyhbYS16XSkoWzAtOVxcc1xcLFxcLlxcLV0rKS9naTtcblx0XHRcblx0Ly9leHBlY3RlZCBsZW5ndGggb2YgZWFjaCB0eXBlXG5cdHZhciBleHBlY3RlZExlbmd0aHMgPSB7XG5cdFx0bSA6IDIsXG5cdFx0bCA6IDIsXG5cdFx0diA6IDEsXG5cdFx0aCA6IDEsXG5cdFx0YyA6IDYsXG5cdFx0cyA6IDRcblx0fTtcblxuXHR2YXIgUGF0aCA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkKSB7XG5cdFx0dGhpcy5zdmcgPSBzdmc7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHQvL2lmKHN2ZykgY29uc29sZS5sb2coc3ZnLCBwYXJzZWQpO1xuXHRcdHRoaXMuc2V0UGFyc2VkKHBhcnNlZCB8fCB0aGlzLnBhcnNlKHN2ZykpO1xuXHR9O1xuXG5cdHZhciByZWZpbmVCb3VuZGluZyA9IGZ1bmN0aW9uKGJvdW5kaW5nLCBwb2ludCkge1xuXHRcdGJvdW5kaW5nWzBdID0gYm91bmRpbmdbMF0gfHwgcG9pbnQuc2xpY2UoMCk7XG5cdFx0Ym91bmRpbmdbMV0gPSBib3VuZGluZ1sxXSB8fCBwb2ludC5zbGljZSgwKTtcblx0XHQvL3RvcCBsZWZ0XG5cdFx0aWYocG9pbnRbMF0gPCBib3VuZGluZ1swXVswXSkgYm91bmRpbmdbMF1bMF0gPSBwb2ludFswXTtcblx0XHRpZihwb2ludFsxXSA8IGJvdW5kaW5nWzBdWzFdKSBib3VuZGluZ1swXVsxXSA9IHBvaW50WzFdO1xuXHRcdC8vYm90dG9tIHJpZ2h0XG5cdFx0aWYocG9pbnRbMF0gPiBib3VuZGluZ1sxXVswXSkgYm91bmRpbmdbMV1bMF0gPSBwb2ludFswXTtcblx0XHRpZihwb2ludFsxXSA+IGJvdW5kaW5nWzFdWzFdKSBib3VuZGluZ1sxXVsxXSA9IHBvaW50WzFdO1xuXHRcdHJldHVybiBib3VuZGluZztcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnNldFNWRyA9IGZ1bmN0aW9uKHN2Zykge1xuXHRcdHRoaXMuc3ZnID0gc3ZnO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLnNldFBhcnNlZCA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuXHRcdC8vY29uc29sZS5sb2cocGFyc2VkKTtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0XHR0aGlzLmZpbmRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldEN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY3ViaWMgfHwgdGhpcy5wYXJzZUN1YmljKCk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0XHRcblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRUb3RhbExlbmd0aCh0aGlzLmdldFNWR1N0cmluZygpKVxuXG5cdH07XG5cblx0LyoqXG5cdEdldHMgYW4gU1ZHIHN0cmluZyBvZiB0aGUgcGF0aCBzZWdlbW50cy4gSXQgaXMgbm90IHRoZSBzdmcgcHJvcGVydHkgb2YgdGhlIHBhdGgsIGFzIGl0IGlzIHBvdGVudGlhbGx5IHRyYW5zZm9ybWVkXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLmdldFNWR1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oc3ZnLCBzZWdtZW50KXtcblx0XHRcdHJldHVybiBzdmcgKyBzZWdtZW50LnR5cGUgKyBzZWdtZW50LmFuY2hvcnMuam9pbignLCcpOyBcblx0XHR9LCAnJyk7XG5cdH07XG5cblx0LyoqXG5cdFBhcnNlcyBhbiBTVkcgcGF0aCBzdHJpbmcgdG8gYSBsaXN0IG9mIHNlZ21lbnQgZGVmaW5pdGlvbnMgd2l0aCBBQlNPTFVURSBwb3NpdGlvbnMgKHRoZXJlZm9yZSB3ZSBkb24ndCB1c2UgUmFwaGFlbC5wYXJzZVBhdGhTdHJpbmcpXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLnBhcnNlID0gZnVuY3Rpb24oc3ZnKSB7XG5cdFx0dmFyIG07XG5cdFx0dmFyIGxhc3RQb2ludDtcblx0XHR2YXIgbGFzdEJlemllckFuY2hvcjtcblx0XHR2YXIgcmF3RGVmcyA9IFtdO1xuXG5cdFx0d2hpbGUobSA9IHJlZy5leGVjKHN2ZykpIHtcblx0XHRcdHZhciB0eXBlID0gbVsxXTtcblx0XHRcdHZhciBnZW5lcmljVHlwZSA9IHR5cGUudG9Mb3dlckNhc2UoKTtcblx0XHRcdHZhciBleHBlY3RlZExlbmd0aCA9IGV4cGVjdGVkTGVuZ3Roc1tnZW5lcmljVHlwZV07XG5cdFx0XHR2YXIgYW5jaG9ycyA9IG1bMl0ubWF0Y2goL1xcLT9bMC05XFwuXSsvZykubWFwKGZ1bmN0aW9uKHYsIGkpIHtcblx0XHRcdFx0cmV0dXJuIE51bWJlcih2KTtcblx0XHRcdH0pO1xuXHRcdFx0Ly9zdmcgc3J0YW5kYXJkcyBzdGF0ZXMgdGhhdCBpZiBhIGNvbW1hbmQgb2YgYSBzYW1lIHR5cGUgZm9sbG93cyBhbm90aGVyLCB0aGUgY29tbWFuZCBpcyBub3QgcmVxdWlyZWRcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCBhbmNob3JzLmxlbmd0aDsgaSArPSBleHBlY3RlZExlbmd0aCl7XG5cdFx0XHRcdHJhd0RlZnMucHVzaCh7XG5cdFx0XHRcdFx0dHlwZSA6IHR5cGUsXG5cdFx0XHRcdFx0Z2VuZXJpY1R5cGUgOiBnZW5lcmljVHlwZSxcblx0XHRcdFx0XHRhbmNob3JzIDogYW5jaG9ycy5zbGljZShpLCBpK2V4cGVjdGVkTGVuZ3RoKVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdH07XG5cdFx0Ly9jb25zb2xlLmxvZyhzdmcpO1xuXG5cdFx0dmFyIHBhdGggPSByYXdEZWZzLm1hcChmdW5jdGlvbihkZWYpIHtcblxuXHRcdFx0Ly9jb25zb2xlLmxvZyhkZWYpO1xuXHRcdFx0dmFyIHR5cGUgPSBkZWYudHlwZTtcblx0XHRcdHZhciBjcmVhdGVKc0NvbW1hbmQ7XG5cdFx0XHR2YXIgaXNBYnNvbHV0ZSA9IHR5cGUgPT09IHR5cGUudG9VcHBlckNhc2UoKTtcblxuXHRcdFx0Ly90cmFuc2Zvcm0gcmVsYXRpdmUgcG9pbnRzIHRvIGFic29sdXRlXG5cdFx0XHR2YXIgYW5jaG9ycyA9IGRlZi5hbmNob3JzLm1hcChmdW5jdGlvbih2LCBpKSB7XG5cdFx0XHRcdGlmKCFpc0Fic29sdXRlKSB2ID0gdiArIGxhc3RQb2ludFtpICUgMl07XG5cdFx0XHRcdHJldHVybiB2O1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vY29uc29sZS5sb2coYW5jaG9ycywgdHlwZSk7XG5cblx0XHRcdHN3aXRjaChkZWYuZ2VuZXJpY1R5cGUpIHtcblx0XHRcdFx0Ly9tb3ZlVG9cblx0XHRcdFx0Y2FzZSAnbSc6XG5cdFx0XHRcdFx0Y3JlYXRlSnNDb21tYW5kID0gJ21vdmVUbyc7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ2wnOlxuXHRcdFx0XHRcdGNyZWF0ZUpzQ29tbWFuZCA9ICdsaW5lVG8nO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHQvL2hvcml6b250YWwgbGluZSB0b1xuXHRcdFx0XHRjYXNlICdoJzpcblx0XHRcdFx0XHR0eXBlID0gJ2wnO1xuXHRcdFx0XHRcdGNyZWF0ZUpzQ29tbWFuZCA9ICdsaW5lVG8nO1xuXHRcdFx0XHRcdGFuY2hvcnMucHVzaChsYXN0UG9pbnRbMV0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHQvL3ZlcnRpY2FsIGxpbmUgdG9cblx0XHRcdFx0Y2FzZSAndic6XG5cdFx0XHRcdFx0dHlwZSA9ICdsJztcblx0XHRcdFx0XHRjcmVhdGVKc0NvbW1hbmQgPSAnbGluZVRvJztcblx0XHRcdFx0XHRhbmNob3JzLnVuc2hpZnQobGFzdFBvaW50WzBdKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAncyc6XG5cdFx0XHRcdFx0aWYobGFzdEJlemllckFuY2hvcil7XG5cdFx0XHRcdFx0XHRhbmNob3JzLnNwbGljZSgwLCAwLCBsYXN0QmV6aWVyQW5jaG9yWzBdICwgbGFzdEJlemllckFuY2hvclsxXSApO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvL2ZhbGx0aHJvdWdoXG5cdFx0XHRcdGNhc2UgJ2MnOlxuXHRcdFx0XHRcdHR5cGUgPSAnYyc7XG5cdFx0XHRcdFx0Y3JlYXRlSnNDb21tYW5kID0gJ2JlemllckN1cnZlVG8nO1xuXHRcdFx0XHRcdGxhc3RCZXppZXJBbmNob3IgPSBbXG5cdFx0XHRcdFx0XHQyKmFuY2hvcnNbNF0gLSBhbmNob3JzWzJdLFxuXHRcdFx0XHRcdFx0MiphbmNob3JzWzVdIC0gYW5jaG9yc1szXVxuXHRcdFx0XHRcdF07XG5cdFx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0bGFzdFBvaW50ID0gW2FuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMl0sIGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV1dO1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGFuY2hvcnMpO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZSA6IHR5cGUudG9VcHBlckNhc2UoKSxcblx0XHRcdFx0Y3JlYXRlSnNDb21tYW5kOiBjcmVhdGVKc0NvbW1hbmQsXG5cdFx0XHRcdGFuY2hvcnMgOiBhbmNob3JzXG5cdFx0XHR9O1xuXG5cdFx0fSk7XG5cdFxuXHRcdHJldHVybiBwYXRoO1xuXHR9O1xuXG5cdC8qKlxuXHRcdFBhcnNlcyBhIHBhdGggZGVmaW5lZCBieSBwYXJzZVBhdGggdG8gYSBsaXN0IG9mIGJlemllciBwb2ludHMgdG8gYmUgdXNlZCBieSBHcmVlbnNvY2sgQmV6aWVyIHBsdWdpbiwgZm9yIGV4YW1wbGVcblx0XHRUd2Vlbk1heC50byhzcHJpdGUsIDUwMCwge1xuXHRcdFx0YmV6aWVyOnt0eXBlOlwiY3ViaWNcIiwgdmFsdWVzOmN1YmljfSxcblx0XHRcdGVhc2U6UXVhZC5lYXNlSW5PdXQsXG5cdFx0XHR1c2VGcmFtZXMgOiB0cnVlXG5cdFx0fSk7XG5cdFx0Ki9cblx0UGF0aC5wcm90b3R5cGUucGFyc2VDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vY29uc29sZS5sb2cocGF0aCk7XG5cdFx0Ly9hc3N1bWVkIGZpcnN0IGVsZW1lbnQgaXMgYSBtb3ZldG9cblx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuY3ViaWMgPSB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oYW5jaG9ycywgc2VnbWVudCl7XG5cdFx0XHR2YXIgYSA9IHNlZ21lbnQuYW5jaG9ycztcblx0XHRcdGlmKHNlZ21lbnQudHlwZT09PSdNJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTphWzFdfSk7XG5cdFx0XHR9IGVsc2UgaWYoc2VnbWVudC50eXBlPT09J0wnKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMl0sIHk6IGFbM119KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzRdLCB5OiBhWzVdfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHRcdH0sIFtdKTtcblxuXHRcdHJldHVybiBhbmNob3JzO1xuXG5cdH07XG5cblx0Ly90cm91dmUgbGUgYm91bmRpbmcgYm94IGQndW5lIGxldHRyZSAoZW4gc2UgZmlhbnQganVzdGUgc3VyIGxlcyBwb2ludHMuLi4gb24gbmUgY2FsY3VsZSBwYXMgb3UgcGFzc2UgbGUgcGF0aClcblx0UGF0aC5wcm90b3R5cGUuZmluZEJvdW5kaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGJvdW5kaW5nID0gdGhpcy5ib3VuZGluZyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihib3VuZGluZywgcCl7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHAuYW5jaG9ycztcblx0XHRcdHZhciBwb2ludDtcblx0XHRcdGlmKGFuY2hvcnMubGVuZ3RoID09PSAyKSB7XG5cdFx0XHRcdHBvaW50ID0gW2FuY2hvcnNbMF0sIGFuY2hvcnNbMV1dO1xuXHRcdFx0fSBlbHNlIGlmKGFuY2hvcnMubGVuZ3RoID09PSA2KSB7XG5cdFx0XHRcdHBvaW50ID0gW2FuY2hvcnNbNF0sIGFuY2hvcnNbNV1dO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlZmluZUJvdW5kaW5nKGJvdW5kaW5nLCBwb2ludCk7XG5cdFx0fSwgW10pO1xuXHRcdHJldHVybiBib3VuZGluZztcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKG9mZnNldCkge1xuXHRcdHZhciBwYXJzZWQgPSB0aGlzLnBhcnNlZC5tYXAoZnVuY3Rpb24oZGVmKSB7XG5cdFx0XHR2YXIgbmV3RGVmID0gT2JqZWN0LmNyZWF0ZShkZWYpO1xuXHRcdFx0bmV3RGVmLmFuY2hvcnMgPSBkZWYuYW5jaG9ycy5tYXAoZnVuY3Rpb24oY29vcmQsIGkpe1xuXHRcdFx0XHRyZXR1cm4gY29vcmQgKz0gb2Zmc2V0W2klMl07XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBuZXdEZWY7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShudWxsLCB0aGlzLm5hbWUsIHBhcnNlZCk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihyYXRpbykge1xuXHRcdHZhciBwYXJzZWQgPSB0aGlzLnBhcnNlZC5tYXAoZnVuY3Rpb24oZGVmKSB7XG5cdFx0XHR2YXIgbmV3RGVmID0gT2JqZWN0LmNyZWF0ZShkZWYpO1xuXHRcdFx0bmV3RGVmLmFuY2hvcnMgPSBkZWYuYW5jaG9ycy5tYXAoZnVuY3Rpb24oY29vcmQsIGkpe1xuXHRcdFx0XHRyZXR1cm4gY29vcmQgKj0gcmF0aW87XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBuZXdEZWY7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShudWxsLCB0aGlzLm5hbWUsIHBhcnNlZCk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24ocGFydCwgbmFtZSnCoHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnQpO1xuXHRcdGlmKG5hbWUpIHRoaXMubmFtZSArPSBuYW1lO1xuXHRcdHRoaXMuc2V0UGFyc2VkKHRoaXMucGFyc2VkLmNvbmNhdChwYXJ0LnBhcnNlZC5zbGljZSgxKSkpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLnJlZmluZUJvdW5kaW5nID0gcmVmaW5lQm91bmRpbmc7XG5cblx0UGF0aC5mYWN0b3J5ID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQpIHtcblx0XHRyZXR1cm4gbmV3IFBhdGgoc3ZnLCBuYW1lLCBwYXJzZWQpO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoO1xuXG59KSk7XG5cblxuIl19
