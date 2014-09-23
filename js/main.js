(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var DrawPath = require('app/rose/drawing/DrawPath.js');
	var VectorWord = require('app/rose/drawing/VectorWord.js');
	var Alphabet = require('app/rose/drawing/Alphabet.js');
	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1600;
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


	//parse les breakpoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		Alphabet.parseEasepoints(getStage(), $('#brp'), [W, H]);
	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		loading.then(printEasepoints);
	});


},{"app/rose/drawing/Alphabet.js":2,"app/rose/drawing/DrawPath.js":3,"app/rose/drawing/VectorWord.js":5,"gsap":"gsap","jquery":"jquery","raphael":"raphael"}],2:[function(require,module,exports){
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
	    module.exports = factory(require('jquery'), require('lagrange/drawing/Path.js'), require('app/rose/drawing/PathEasepoints.js'));
  	} else {
		ns[name] = factory(root.jQuery, root.lagrange.drawing.Path, root.lagrange.drawing.PathEasepoints);
	}
}(this, function ($, Path, PathEasepoints) {
	"use strict";

	//original scale factor
	var SCALE = 1;
	var svgFile = 'assets/alphabet.svg';

	//PARSÉ avec le helper au bas
	var EASEPOINTS = {"Ö":[[5],[5],[]],"Ô":[[]],"Ï":[[93],[5],[5]],"Î":[[93]],"Ë":[[159],[5],[5]],"Ê":[[159]],"È":[[159],[]],"É":[[159],[]],"Ç":[[],[13]],"Ä":[[189],[],[5],[5]],"Â":[[189],[]],"À":[[189],[],[]],"Z":[[193,340]],"Y":[[329]],"X":[[],[]],"W":[[227,336]],"V":[[231]],"U":[[317]],"T":[[],[]],"S":[[]],"R":[[289],[]],"Q":[[]],"P":[[],[]],"O":[[]],"N":[[247,350]],"M":[[238,338,452]],"L":[[]],"K":[[115],[122]],"J":[[132]],"I":[[93]],"H":[[142],[],[]],"G":[[321]],"F":[[],[]],"E":[[159]],"D":[[]],"C":[[]],"B":[[453]],"A":[[189],[]],"ô":[[155]],"ö":[[155],[5],[5]],"ï":[[42],[5],[5]],"î":[[42]],"ë":[[],[5],[5]],"ê":[[]],"è":[[],[]],"é":[[],[]],"ç":[[72],[13]],"ä":[[55,133],[5],[5]],"â":[[55,133]],"à":[[55,133],[]],"z":[[110]],"y":[[42,116,227]],"x":[[42],[]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103],[]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[124]],"k":[[131,244,327]],"j":[[52],[18]],"i":[[42],[18]],"h":[[133,248,293]],"g":[[60,145]],"f":[[419]],"e":[[]],"d":[[236]],"c":[[72]],"b":[[291]],"a":[[55,133]]};

	var letters = {};

	var Letter = function(name){
		this.name = name;
	};

	Letter.prototype.setBounding = function(){
		this.bounding = this.paths.reduce(function(bounding, path){
			var pathBounding = path.findBounding();
			bounding = bounding || pathBounding;
			bounding = Path.refineBounding(bounding, pathBounding);
			return bounding;
		}, undefined);
		//if there's a bottomright point that is set, use its coordinates as bounding
		if(this.bottomRight) {
			var anchors = this.bottomRight.getPoint(0);
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

	Letter.prototype.getHeight = function(){
		return this.bounding[0][1];
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

	var maxHeight;
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
			//console.log(id);
			var letterPathsBounding = [];
			paths.each(function(i, el){
				var pathEl = $(el);

				var p = Path.factory( pathEl.attr('d'), pathEl.attr('id'), null, EASEPOINTS[id] && EASEPOINTS[id][i]).scale(SCALE);
				
				letter.addPath( p );
			});

			letter.setBounding();

			boundings.push(letter.bounding);

		});

		//console.log(boundings);
		//trouve le top absolu (top de la lettre la plus haute)
		maxHeight = boundings.reduce(function(min, bounding){
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
			letters[key].setOffset([-1 * letters[key].bounding[0][0], -1 * maxHeight]);
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
		},
		//setup des breakpoints (points où on fait un easing) de chacune des lettres. Sera outputté et savé en JSON, pour être loadé en même temps que l'alphabet. Le parse en realtime est trop lent, donc cette fonction doit etre callée pour refaire les breakpoints chaque fois que le SVG change.
		parseEasepoints : function(stage, node, dim){
			PathEasepoints(stage, letters, node, dim, maxHeight);
		}
	};

	return Alphabet;
	
}));



},{"app/rose/drawing/PathEasepoints.js":4,"jquery":"jquery","lagrange/drawing/Path.js":6}],3:[function(require,module,exports){
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
/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/PathEasepoints'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    ns[name] = module.exports = factory(require('lodash'), require('raphael'), require('rose/drawing/MathUtils.js'));
  	} else {
		ns[name] = factory(root._, root.Raphael, ns.MathUtils);
	}
}(this, function (_, Raphael, MathUtils) {
	"use strict";


	var distanceTreshold = 40;
	var angleTreshold = MathUtils.toRadians(12);

	var stage;

	//helper
	var showPoint = function(point, color, size){
		var el = stage.circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
	};

	var show = function(pathDef) {
		var path = pathDef.getSVGString();			
		var el = stage.path(path);
		el.attr({"stroke-width": 1, stroke: '#000000'});/**/
	};

	var findDefaults = function(pathDef){
		var pathStr = pathDef.getSVGString();
		var length = pathDef.getLength();

		show(pathDef);

		var breakPoints = (function(){

			var pointPos = [];
			
			
			var precision = 1;
			var prev;
			var allPoints = [];
			for(var i=precision; i<=length; i += precision) {
				//var pathPart = Raphael.getSubpath(pathStr, 0, i);
				var p = Raphael.getPointAtLength(pathStr, i);
				
				//it seems that Raphael's alpha is inconsistent... sometimes over 360
				var alpha = Math.abs( Math.asin( Math.sin(MathUtils.toRadians(p.alpha)) ));
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
		})();

		console.log(breakPoints);
		breakPoints.forEach(function(p){
			var pObj = Raphael.getPointAtLength(pathStr, p);
			showPoint(pObj, '#00ff00', 3);
		});/**/
		
		return breakPoints;

	};

	return function(s, groups, printNode, dim, groupMaxHeight){
		stage = s;
		var pad = 20;
		var availW = dim[0] - pad;
		
		var topLeft = {x:pad, y:pad};
		var easePoints = Object.keys(groups).reduce(function(all, name){
			var group = groups[name];

			var endLeft = topLeft.x + group.getWidth() + pad;
			console.log(group.getWidth(), groupMaxHeight);

			if(endLeft > availW) {
				topLeft.x = pad;
				topLeft.y += pad + (groupMaxHeight / 2);
				endLeft = topLeft.x + group.getWidth() + pad;
			}


			var thisEase = group.paths.map(function(p){
				p = p.translate([topLeft.x, topLeft.y]);
				return findDefaults(p);
			});
			all[name] = thisEase;


			topLeft.x = endLeft;			


			return all;
		}, {});
		console.log(easePoints);

		printNode.text(JSON.stringify(easePoints));
	};

	
}));



},{"lodash":"lodash","raphael":"raphael","rose/drawing/MathUtils.js":8}],5:[function(require,module,exports){
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
					var def = path.translate([right, top]);
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
				//console.table([{letter:name[i], letterWidth: letter.bounding[1][0], total:right}]);	
			}

			return lines;

		}
	};

	return VectorWord;
	
}));



},{"rose/drawing/Alphabet.js":7}],6:[function(require,module,exports){
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
		this.svg = svg;
		this.name = name;
		//if(svg) console.log(svg, parsed);
		this.easePoints = easePoints || [];
		//console.log(name, easePoints);
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
		return Path.factory(null, this.name, parsed, this.easePoints);
	};

	//returns a new path, scaled
	Path.prototype.scale = function(ratio) {
		var parsed = this.parsed.map(function(def) {
			var newDef = Object.create(def);
			newDef.anchors = def.anchors.map(function(coord, i){
				return coord *= ratio;
			});
			return newDef;
		});
		var easePoints = this.easePoints.map(function(ep){
			return ep * ratio;
		});
		return Path.factory(null, this.name, parsed, easePoints);
	};

	Path.prototype.append = function(part, name) {
		//console.log(part);
		if(name) this.name += name;
		this.setParsed(this.parsed.concat(part.parsed.slice(1)));
	};

	Path.prototype.addEasepoint = function(pos){
		this.easePoints.push(pos);
	};

	Path.refineBounding = refineBounding;

	Path.factory = function(svg, name, parsed, easePoints) {
		return new Path(svg, name, parsed, easePoints);
	};

	return Path;

}));



},{"raphael":"raphael"}],7:[function(require,module,exports){
module.exports=require(2)
},{"/Users/lagrange/git/lab/alphabet/node_modules/app/rose/drawing/Alphabet.js":2,"app/rose/drawing/PathEasepoints.js":4,"jquery":"jquery","lagrange/drawing/Path.js":6}],8:[function(require,module,exports){
(function (root, factory) {
	var nsParts = 'rose/drawing/MathUtils'.split('/');
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

	var degToRad = Math.PI / 180;
	var radToDeg = 180 / Math.PI;

	return {

		toRadians : function(degrees) {
		  return degrees * degToRad;
		},
		 
		// Converts from radians to degrees.
		toDegrees : function(radians) {
		  return radians * radToDeg;
		}
	};

}));
},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvYXBwL3Jvc2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cy5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL1ZlY3RvcldvcmQuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvbGFncmFuZ2UvZHJhd2luZy9QYXRoLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL3Jvc2UvZHJhd2luZy9NYXRoVXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHRcblx0dmFyICQgPSByZXF1aXJlKCdqcXVlcnknKTtcblx0dmFyIFJhcGhhZWwgPSByZXF1aXJlKCdyYXBoYWVsJyk7XG5cdHZhciBEcmF3UGF0aCA9IHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMnKTtcblx0dmFyIFZlY3RvcldvcmQgPSByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL1ZlY3RvcldvcmQuanMnKTtcblx0dmFyIEFscGhhYmV0ID0gcmVxdWlyZSgnYXBwL3Jvc2UvZHJhd2luZy9BbHBoYWJldC5qcycpO1xuXHR2YXIgVHdlZW5NYXggPSByZXF1aXJlKCdnc2FwJyk7XG5cblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIFcgPSAxNjAwO1xuXHR2YXIgSCA9IDEyMDA7XG5cblx0dmFyIHNjYWxlRmFjdG9yID0gMTtcblxuXHR2YXIgbmFtZXMgPSBbXCJKZXNzaWNhIFdhbm5pbmdcIixcIkp1bGlhIFJvY2t3ZWxsXCIsXCJDYXJvbCBIdWJiYXJkXCIsXCJSb25hbGQgQ2FuZHlcIixcIkpvaG4gTmV3dG9uXCIsXCJFbHZpcyBOaWNvbGVcIixcIkdsb3JpYSBXZWF2ZXJcIixcIkp1bGlhIENyb25raXRlXCIsXCJNb3RoZXIgUm9nZXJzXCIsXCJDaGV2eSBJcndpblwiLFwiRWRkaWUgQWxsZW5cIixcIk5vcm1hbiBKYWNrc29uXCIsXCJQZXRlciBSb2dlcnNcIixcIldlaXJkIENoYXNlXCIsXCJDb2xpbiBNYXlzXCIsXCJOYXBvbGVvbiBNYXJ0aW5cIixcIkVkZ2FyIFNpbXBzb25cIixcIk1vaGFtbWFkIE1jQ2FydG5leVwiLFwiTGliZXJhY2UgV2lsbGlhbXNcIixcIkZpZWxkcyBCdXJuZXR0XCIsXCJTdGV2ZSBBc2hlXCIsXCJDYXJyaWUgQ2hhcmxlc1wiLFwiVG9tbXkgUGFzdGV1clwiLFwiRWRkaWUgU2lsdmVyc3RvbmVcIixcIk9wcmFoIEFzaGVcIixcIlJheSBCYWxsXCIsXCJKaW0gRGlhbmFcIixcIk1pY2hlbGFuZ2VsbyBFYXN0d29vZFwiLFwiR2VvcmdlIFNpbXBzb25cIixcIkFsaWNpYSBBdXN0ZW5cIixcIkplc3NpY2EgTmljb2xlXCIsXCJNYXJpbHluIEV2ZXJldHRcIixcIktlaXRoIEVhc3R3b29kXCIsXCJQYWJsbyBFYXN0d29vZFwiLFwiUGV5dG9uIEx1dGhlclwiLFwiTW96YXJ0IEFybXN0cm9uZ1wiLFwiTWljaGFlbCBCdXJuZXR0XCIsXCJLZWl0aCBHbG92ZXJcIixcIkVsaXphYmV0aCBDaGlsZFwiLFwiTWlsZXMgQXN0YWlyZVwiLFwiQW5keSBFZGlzb25cIixcIk1hcnRpbiBMZW5ub25cIixcIlRvbSBQaWNjYXNvXCIsXCJCZXlvbmNlIERpc25leVwiLFwiUGV0ZXIgQ2xpbnRvblwiLFwiSGVucnkgS2VubmVkeVwiLFwiUGF1bCBDaGlsZFwiLFwiTGV3aXMgU2FnYW5cIixcIk1pY2hlbGFuZ2VsbyBMZWVcIixcIk1hcmlseW4gRmlzaGVyXCJdO1xuXHRmdW5jdGlvbiBTaHVmZmxlKG8pIHtcblx0XHRmb3IodmFyIGosIHgsIGkgPSBvLmxlbmd0aDsgaTsgaiA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiBpKSwgeCA9IG9bLS1pXSwgb1tpXSA9IG9bal0sIG9bal0gPSB4KTtcblx0XHRyZXR1cm4gbztcblx0fTtcblx0U2h1ZmZsZShuYW1lcyk7XG5cdG5hbWVzLmxlbmd0aCA9IDE7LyoqL1xuXG5cdC8vbmFtZXMgPSBbJ2FrJ107XG5cblxuXHR2YXIgZ2V0U3RhZ2UgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgc3RhZ2U7XG5cdFx0dmFyIGluaXQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIFJhcGhhZWwoXCJzdmdcIiwgVywgSCk7XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzdGFnZSA9IHN0YWdlIHx8IGluaXQoKTtcblx0XHR9XG5cdH0pKCk7XG5cblx0dmFyIGRvRHJhdyA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGluY3IgPSBIIC8gbmFtZXMubGVuZ3RoO1xuXHRcdG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSwgayl7XG5cdFx0XHQvL3RyYWNlTmFtZShuYW1lLCAwLCBrICogaW5jcik7XG5cblx0XHRcdHZhciBwYXRocyA9IFZlY3RvcldvcmQuZ2V0UGF0aHMobmFtZSwgMCwgayAqIGluY3IsIHNjYWxlRmFjdG9yKTtcblx0XHRcdHZhciBzdGFydCA9IG5ldyBEYXRlKCk7XG5cdFx0XHREcmF3UGF0aC5ncm91cChwYXRocywgZ2V0U3RhZ2UoKSwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IDIwMCxcblx0XHRcdFx0Y29sb3IgOiAnIzQ0NDQ0NCcsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogMixcblx0XHRcdFx0ZWFzaW5nIDogZ3NhcC5TaW5lLmVhc2VJbk91dFxuXHRcdFx0fSk7XG5cblx0XHRcdHZhciBlbmQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coZW5kLXN0YXJ0KTtcblxuXHRcdH0pO1xuXG5cdH07XG5cblx0dmFyIGxvYWRpbmcgPSBBbHBoYWJldC5pbml0KCk7XHRcblx0dmFyIGJ0biA9ICQoJyNjdHJsJyk7XG5cblx0YnRuLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG5cblx0Ly9wYXJzZSBsZXMgYnJlYWtwb2ludHMgZGUgY2hhcXVlIGxldHRyZSwgb3V0cHV0IGVuIEpTT04gKMOgIHNhdmVyKVxuXHR2YXIgcHJpbnRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKXtcblx0XHRBbHBoYWJldC5wYXJzZUVhc2Vwb2ludHMoZ2V0U3RhZ2UoKSwgJCgnI2JycCcpLCBbVywgSF0pO1xuXHR9O1xuXG5cdHZhciBnZXRCcHIgPSAkKCcjZ2V0YnJwJyk7XG5cblx0Z2V0QnByLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKHByaW50RWFzZXBvaW50cyk7XG5cdH0pO1xuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0FscGhhYmV0Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnbGFncmFuZ2UvZHJhd2luZy9QYXRoLmpzJyksIHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvUGF0aEVhc2Vwb2ludHMuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5qUXVlcnksIHJvb3QubGFncmFuZ2UuZHJhd2luZy5QYXRoLCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aEVhc2Vwb2ludHMpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoLCBQYXRoRWFzZXBvaW50cykge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL29yaWdpbmFsIHNjYWxlIGZhY3RvclxuXHR2YXIgU0NBTEUgPSAxO1xuXHR2YXIgc3ZnRmlsZSA9ICdhc3NldHMvYWxwaGFiZXQuc3ZnJztcblxuXHQvL1BBUlPDiSBhdmVjIGxlIGhlbHBlciBhdSBiYXNcblx0dmFyIEVBU0VQT0lOVFMgPSB7XCLDllwiOltbNV0sWzVdLFtdXSxcIsOUXCI6W1tdXSxcIsOPXCI6W1s5M10sWzVdLFs1XV0sXCLDjlwiOltbOTNdXSxcIsOLXCI6W1sxNTldLFs1XSxbNV1dLFwiw4pcIjpbWzE1OV1dLFwiw4hcIjpbWzE1OV0sW11dLFwiw4lcIjpbWzE1OV0sW11dLFwiw4dcIjpbW10sWzEzXV0sXCLDhFwiOltbMTg5XSxbXSxbNV0sWzVdXSxcIsOCXCI6W1sxODldLFtdXSxcIsOAXCI6W1sxODldLFtdLFtdXSxcIlpcIjpbWzE5MywzNDBdXSxcIllcIjpbWzMyOV1dLFwiWFwiOltbXSxbXV0sXCJXXCI6W1syMjcsMzM2XV0sXCJWXCI6W1syMzFdXSxcIlVcIjpbWzMxN11dLFwiVFwiOltbXSxbXV0sXCJTXCI6W1tdXSxcIlJcIjpbWzI4OV0sW11dLFwiUVwiOltbXV0sXCJQXCI6W1tdLFtdXSxcIk9cIjpbW11dLFwiTlwiOltbMjQ3LDM1MF1dLFwiTVwiOltbMjM4LDMzOCw0NTJdXSxcIkxcIjpbW11dLFwiS1wiOltbMTE1XSxbMTIyXV0sXCJKXCI6W1sxMzJdXSxcIklcIjpbWzkzXV0sXCJIXCI6W1sxNDJdLFtdLFtdXSxcIkdcIjpbWzMyMV1dLFwiRlwiOltbXSxbXV0sXCJFXCI6W1sxNTldXSxcIkRcIjpbW11dLFwiQ1wiOltbXV0sXCJCXCI6W1s0NTNdXSxcIkFcIjpbWzE4OV0sW11dLFwiw7RcIjpbWzE1NV1dLFwiw7ZcIjpbWzE1NV0sWzVdLFs1XV0sXCLDr1wiOltbNDJdLFs1XSxbNV1dLFwiw65cIjpbWzQyXV0sXCLDq1wiOltbXSxbNV0sWzVdXSxcIsOqXCI6W1tdXSxcIsOoXCI6W1tdLFtdXSxcIsOpXCI6W1tdLFtdXSxcIsOnXCI6W1s3Ml0sWzEzXV0sXCLDpFwiOltbNTUsMTMzXSxbNV0sWzVdXSxcIsOiXCI6W1s1NSwxMzNdXSxcIsOgXCI6W1s1NSwxMzNdLFtdXSxcInpcIjpbWzExMF1dLFwieVwiOltbNDIsMTE2LDIyN11dLFwieFwiOltbNDJdLFtdXSxcIndcIjpbWzM4LDEwNywxNzddXSxcInZcIjpbWzY2XV0sXCJ1XCI6W1szMywxMDVdXSxcInRcIjpbWzEwM10sW11dLFwic1wiOltbNTAsMTEwXV0sXCJyXCI6W1s2NF1dLFwicVwiOltbMTQ0LDMyNV1dLFwicFwiOltbNTYsMzA1XV0sXCJvXCI6W1sxNTVdXSxcIm5cIjpbWzEwNF1dLFwibVwiOltbMTEwXV0sXCJsXCI6W1sxMjRdXSxcImtcIjpbWzEzMSwyNDQsMzI3XV0sXCJqXCI6W1s1Ml0sWzE4XV0sXCJpXCI6W1s0Ml0sWzE4XV0sXCJoXCI6W1sxMzMsMjQ4LDI5M11dLFwiZ1wiOltbNjAsMTQ1XV0sXCJmXCI6W1s0MTldXSxcImVcIjpbW11dLFwiZFwiOltbMjM2XV0sXCJjXCI6W1s3Ml1dLFwiYlwiOltbMjkxXV0sXCJhXCI6W1s1NSwxMzNdXX07XG5cblx0dmFyIGxldHRlcnMgPSB7fTtcblxuXHR2YXIgTGV0dGVyID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0fTtcblxuXHRMZXR0ZXIucHJvdG90eXBlLnNldEJvdW5kaW5nID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXRocy5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHBhdGgpe1xuXHRcdFx0dmFyIHBhdGhCb3VuZGluZyA9IHBhdGguZmluZEJvdW5kaW5nKCk7XG5cdFx0XHRib3VuZGluZyA9IGJvdW5kaW5nIHx8IHBhdGhCb3VuZGluZztcblx0XHRcdGJvdW5kaW5nID0gUGF0aC5yZWZpbmVCb3VuZGluZyhib3VuZGluZywgcGF0aEJvdW5kaW5nKTtcblx0XHRcdHJldHVybiBib3VuZGluZztcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdC8vaWYgdGhlcmUncyBhIGJvdHRvbXJpZ2h0IHBvaW50IHRoYXQgaXMgc2V0LCB1c2UgaXRzIGNvb3JkaW5hdGVzIGFzIGJvdW5kaW5nXG5cdFx0aWYodGhpcy5ib3R0b21SaWdodCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmJvdHRvbVJpZ2h0LmdldFBvaW50KDApO1xuXHRcdFx0dGhpcy5ib3VuZGluZ1sxXSA9IFthbmNob3JzWzBdLCBhbmNob3JzWzFdXTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5ib3R0b21SaWdodCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdH07XG5cblx0TGV0dGVyLnByb3RvdHlwZS5nZXRIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nWzBdWzFdO1xuXHR9O1xuXG5cdExldHRlci5wcm90b3R5cGUuZ2V0V2lkdGggPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nWzFdWzBdO1xuXHR9O1xuXG5cdExldHRlci5wcm90b3R5cGUuc2V0T2Zmc2V0ID0gZnVuY3Rpb24ob2Zmc2V0KXtcblx0XHR0aGlzLm9mZnNldCA9IG9mZnNldDtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocy5tYXAoZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHBhdGggPSBwYXRoLnRyYW5zbGF0ZShvZmZzZXQpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHJldHVybiBwYXRoO1xuXHRcdH0pO1xuXHRcdHRoaXMuYm90dG9tUmlnaHQgPSAodGhpcy5ib3R0b21SaWdodCAmJiB0aGlzLmJvdHRvbVJpZ2h0LnRyYW5zbGF0ZShvZmZzZXQpKTtcblx0XHR0aGlzLnNldEJvdW5kaW5nKCk7XG5cdH07XG5cblx0Ly9yZXR1cm5zIGEgbmV3IGxldHRlciwgc2NhbGVkXG5cdExldHRlci5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG5cdFx0aWYoIXRoaXMucGF0aHMpIHJldHVybiB0aGlzO1xuXHRcdHZhciBzY2FsZWQgPSBuZXcgTGV0dGVyKHRoaXMubmFtZSk7XG5cdFx0dGhpcy5wYXRocy5mb3JFYWNoKGZ1bmN0aW9uKHBhdGgpe1xuXHRcdFx0c2NhbGVkLmFkZFBhdGgocGF0aC5zY2FsZShzY2FsZSkpO1xuXHRcdH0pO1xuXG5cdFx0c2NhbGVkLmJvdHRvbVJpZ2h0ID0gKHRoaXMuYm90dG9tUmlnaHQgJiYgdGhpcy5ib3R0b21SaWdodC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zZXRCb3VuZGluZygpO1xuXHRcdHJldHVybiBzY2FsZWQ7XG5cdH07XG5cblx0dmFyIG1heEhlaWdodDtcblx0dmFyIHBhcnNlU1ZHID0gZnVuY3Rpb24oZGF0YSl7XG5cdFx0dmFyIGJvdW5kaW5ncyA9IFtdO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhkYXRhKTtcblx0XHR2YXIgZG9jID0gJChkYXRhKTtcblx0XHR2YXIgbGF5ZXJzID0gZG9jLmZpbmQoJ2cnKTtcblx0XHRsYXllcnMuZWFjaChmdW5jdGlvbihpLCBlbCl7XG5cdFx0XHR2YXIgbGF5ZXIgPSAkKGVsKTtcblx0XHRcdHZhciBpZCA9IGxheWVyLmF0dHIoJ2lkJyk7XG5cblx0XHRcdGlmKGlkID09ICdfeDJEXycpIHtcblx0XHRcdFx0aWQgPSAnLSc7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmKGlkLmxlbmd0aCA+IDEpIHJldHVybjtcblxuXHRcdFx0dmFyIGxldHRlciA9IGxldHRlcnNbaWRdID0gbmV3IExldHRlcihpZCk7XG5cblx0XHRcdHZhciBwYXRocyA9IGxheWVyLmZpbmQoJ3BhdGgnKTtcblx0XHRcdC8vaWYocGF0aHMubGVuZ3RoPT0wKSBjb25zb2xlLmxvZyhsYXllcik7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGlkKTtcblx0XHRcdHZhciBsZXR0ZXJQYXRoc0JvdW5kaW5nID0gW107XG5cdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIHBhdGhFbCA9ICQoZWwpO1xuXG5cdFx0XHRcdHZhciBwID0gUGF0aC5mYWN0b3J5KCBwYXRoRWwuYXR0cignZCcpLCBwYXRoRWwuYXR0cignaWQnKSwgbnVsbCwgRUFTRVBPSU5UU1tpZF0gJiYgRUFTRVBPSU5UU1tpZF1baV0pLnNjYWxlKFNDQUxFKTtcblx0XHRcdFx0XG5cdFx0XHRcdGxldHRlci5hZGRQYXRoKCBwICk7XG5cdFx0XHR9KTtcblxuXHRcdFx0bGV0dGVyLnNldEJvdW5kaW5nKCk7XG5cblx0XHRcdGJvdW5kaW5ncy5wdXNoKGxldHRlci5ib3VuZGluZyk7XG5cblx0XHR9KTtcblxuXHRcdC8vY29uc29sZS5sb2coYm91bmRpbmdzKTtcblx0XHQvL3Ryb3V2ZSBsZSB0b3AgYWJzb2x1ICh0b3AgZGUgbGEgbGV0dHJlIGxhIHBsdXMgaGF1dGUpXG5cdFx0bWF4SGVpZ2h0ID0gYm91bmRpbmdzLnJlZHVjZShmdW5jdGlvbihtaW4sIGJvdW5kaW5nKXtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IGJvdW5kaW5nWzBdWzFdKSB7XG5cdFx0XHRcdG1pbiA9IGJvdW5kaW5nWzBdWzFdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdC8vY29uc29sZS5sb2codG9wKTtcblx0XHQvL2NvbnNvbGUubG9nKGxldHRlcnMpO1xuXG5cdFx0dmFyIGtleXMgPSBPYmplY3Qua2V5cyhsZXR0ZXJzKTtcblx0XHQvL2FqdXN0ZSBsZSBiYXNlbGluZSBkZSBjaGFxdWUgbGV0dHJlXG5cdFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0bGV0dGVyc1trZXldLnNldE9mZnNldChbLTEgKiBsZXR0ZXJzW2tleV0uYm91bmRpbmdbMF1bMF0sIC0xICogbWF4SGVpZ2h0XSk7XG5cdFx0fSk7XG5cblxuXHR9O1xuXG5cdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdHZhciBsb2FkaW5nID0gJC5hamF4KHtcblx0XHRcdHVybCA6IHN2Z0ZpbGUsXG5cdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdH0pO1xuXG5cdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhiKTtcblx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHR9O1xuXG5cdFxuXG5cdHZhciBBbHBoYWJldCA9IHtcblx0XHRpbml0IDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZG9Mb2FkKCk7XG5cdFx0fSxcblx0XHRnZXRMZXR0ZXIgOiBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzW2xdO1xuXHRcdH0sXG5cdFx0Z2V0TlNwYWNlIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9LFxuXHRcdC8vc2V0dXAgZGVzIGJyZWFrcG9pbnRzIChwb2ludHMgb8O5IG9uIGZhaXQgdW4gZWFzaW5nKSBkZSBjaGFjdW5lIGRlcyBsZXR0cmVzLiBTZXJhIG91dHB1dHTDqSBldCBzYXbDqSBlbiBKU09OLCBwb3VyIMOqdHJlIGxvYWTDqSBlbiBtw6ptZSB0ZW1wcyBxdWUgbCdhbHBoYWJldC4gTGUgcGFyc2UgZW4gcmVhbHRpbWUgZXN0IHRyb3AgbGVudCwgZG9uYyBjZXR0ZSBmb25jdGlvbiBkb2l0IGV0cmUgY2FsbMOpZSBwb3VyIHJlZmFpcmUgbGVzIGJyZWFrcG9pbnRzIGNoYXF1ZSBmb2lzIHF1ZSBsZSBTVkcgY2hhbmdlLlxuXHRcdHBhcnNlRWFzZXBvaW50cyA6IGZ1bmN0aW9uKHN0YWdlLCBub2RlLCBkaW0pe1xuXHRcdFx0UGF0aEVhc2Vwb2ludHMoc3RhZ2UsIGxldHRlcnMsIG5vZGUsIGRpbSwgbWF4SGVpZ2h0KTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0RyYXdQYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJyksIHJlcXVpcmUoJ2dzYXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5fLCByb290LlJhcGhhZWwsIChyb290LkdyZWVuU29ja0dsb2JhbHMgfHwgcm9vdCkpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChfLCBSYXBoYWVsLCBUd2Vlbk1heCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL2dzYXAgZXhwb3J0cyBUd2Vlbk1heFxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Y29sb3I6ICcjMDAwMDAwJyxcblx0XHRzdHJva2VXaWR0aCA6IDAuNixcblx0XHRweFBlclNlY29uZCA6IDEwMCwgLy9zcGVlZCBvZiBkcmF3aW5nXG5cdFx0ZWFzaW5nIDogZ3NhcC5RdWFkLmVhc2VJblxuXHR9O1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgc3RhZ2UsIGNvbG9yLCBzaXplKXtcblx0XHRzdGFnZS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKS5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHR9O1xuXG5cdHZhciBEcmF3UGF0aCA9IHtcblxuXHRcdHNpbmdsZSA6IGZ1bmN0aW9uKHBhdGgsIHN0YWdlLCBwYXJhbXMpe1xuXG5cdFx0XHR2YXIgc2V0dGluZ3MgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cdFx0XHR2YXIgcGF0aFN0ciA9IHBhdGguZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gcGF0aC5nZXRMZW5ndGgoKTtcblx0XHRcdHZhciBweFBlclNlY29uZCA9IHNldHRpbmdzLnB4UGVyU2Vjb25kO1xuXHRcdFx0dmFyIHRpbWUgPSBsZW5ndGggLyBweFBlclNlY29uZDtcblxuXHRcdFx0dmFyIGFuaW0gPSB7dG86IDB9O1xuXHRcdFx0XG5cdFx0XHR2YXIgdXBkYXRlID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciBlbDtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0dmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGFuaW0udG8pO1xuXHRcdFx0XHRcdGlmKGVsKSBlbC5yZW1vdmUoKTtcblx0XHRcdFx0XHRlbCA9IHN0YWdlLnBhdGgocGF0aFBhcnQpO1xuXHRcdFx0XHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IHNldHRpbmdzLnN0cm9rZVdpZHRoLCBzdHJva2U6IHNldHRpbmdzLmNvbG9yfSk7XG5cdFx0XHRcdH07XG5cdFx0XHR9KSgpO1xuXG5cdFx0XHR2YXIgZWFzZVBvaW50cyA9IHBhdGguZ2V0RWFzZXBvaW50cygpO1xuXHRcdFx0Lypjb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblx0XHRcdGVhc2VQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb3Mpe1xuXHRcdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwb3MpO1xuXHRcdFx0XHRzaG93UG9pbnQocCwgc3RhZ2UsICcjZmYwMDAwJywgMik7XG5cdFx0XHR9KTsvKiovXG5cdFx0XHRcblxuXHRcdFx0dmFyIGxhc3QgPSAwO1xuXHRcdFx0cmV0dXJuIGVhc2VQb2ludHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBkaXN0KSB7XG5cdFx0XHRcdHZhciB0aW1lID0gKGRpc3QtbGFzdCkgLyBweFBlclNlY29uZDtcblx0XHRcdFx0bGFzdCA9IGRpc3Q7XG5cdFx0XHRcdHJldHVybiB0bC50byhhbmltLCB0aW1lLCB7dG86IGRpc3QsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHtcblx0XHRcdFx0b25VcGRhdGUgOiB1cGRhdGVcblx0XHRcdH0pKS50byhhbmltLCAoKGxlbmd0aCAtIChlYXNlUG9pbnRzLmxlbmd0aCAmJiBlYXNlUG9pbnRzW2Vhc2VQb2ludHMubGVuZ3RoLTFdKSkgLyBweFBlclNlY29uZCksIHt0bzogbGVuZ3RoLCBlYXNlIDogc2V0dGluZ3MuZWFzaW5nfSk7XG5cdFx0XHRcblx0XHR9LFxuXG5cdFx0Z3JvdXAgOiBmdW5jdGlvbihwYXRocywgc3RhZ2UsIHNldHRpbmdzLCBvbkNvbXBsZXRlKSB7XG5cdFx0XHRyZXR1cm4gcGF0aHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBwYXRoKXtcblx0XHRcdFx0cmV0dXJuIHRsLmFwcGVuZChEcmF3UGF0aC5zaW5nbGUocGF0aCwgc3RhZ2UsIHNldHRpbmdzKSk7XG5cdFx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7IG9uQ29tcGxldGU6IChvbkNvbXBsZXRlIHx8IGZ1bmN0aW9uKCl7fSkgfSkpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBEcmF3UGF0aDtcblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpLCByZXF1aXJlKCdyb3NlL2RyYXdpbmcvTWF0aFV0aWxzLmpzJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuXywgcm9vdC5SYXBoYWVsLCBucy5NYXRoVXRpbHMpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChfLCBSYXBoYWVsLCBNYXRoVXRpbHMpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblxuXHR2YXIgZGlzdGFuY2VUcmVzaG9sZCA9IDQwO1xuXHR2YXIgYW5nbGVUcmVzaG9sZCA9IE1hdGhVdGlscy50b1JhZGlhbnMoMTIpO1xuXG5cdHZhciBzdGFnZTtcblxuXHQvL2hlbHBlclxuXHR2YXIgc2hvd1BvaW50ID0gZnVuY3Rpb24ocG9pbnQsIGNvbG9yLCBzaXplKXtcblx0XHR2YXIgZWwgPSBzdGFnZS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKTtcblx0XHRlbC5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHR9O1xuXG5cdHZhciBzaG93ID0gZnVuY3Rpb24ocGF0aERlZikge1xuXHRcdHZhciBwYXRoID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcdFx0XHRcblx0XHR2YXIgZWwgPSBzdGFnZS5wYXRoKHBhdGgpO1xuXHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IDEsIHN0cm9rZTogJyMwMDAwMDAnfSk7LyoqL1xuXHR9O1xuXG5cdHZhciBmaW5kRGVmYXVsdHMgPSBmdW5jdGlvbihwYXRoRGVmKXtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0dmFyIGxlbmd0aCA9IHBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cblx0XHRzaG93KHBhdGhEZWYpO1xuXG5cdFx0dmFyIGJyZWFrUG9pbnRzID0gKGZ1bmN0aW9uKCl7XG5cblx0XHRcdHZhciBwb2ludFBvcyA9IFtdO1xuXHRcdFx0XG5cdFx0XHRcblx0XHRcdHZhciBwcmVjaXNpb24gPSAxO1xuXHRcdFx0dmFyIHByZXY7XG5cdFx0XHR2YXIgYWxsUG9pbnRzID0gW107XG5cdFx0XHRmb3IodmFyIGk9cHJlY2lzaW9uOyBpPD1sZW5ndGg7IGkgKz0gcHJlY2lzaW9uKSB7XG5cdFx0XHRcdC8vdmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGkpO1xuXHRcdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBpKTtcblx0XHRcdFx0XG5cdFx0XHRcdC8vaXQgc2VlbXMgdGhhdCBSYXBoYWVsJ3MgYWxwaGEgaXMgaW5jb25zaXN0ZW50Li4uIHNvbWV0aW1lcyBvdmVyIDM2MFxuXHRcdFx0XHR2YXIgYWxwaGEgPSBNYXRoLmFicyggTWF0aC5hc2luKCBNYXRoLnNpbihNYXRoVXRpbHMudG9SYWRpYW5zKHAuYWxwaGEpKSApKTtcblx0XHRcdFx0aWYocHJldikge1xuXHRcdFx0XHRcdHAuZGlmZiA9IE1hdGguYWJzKGFscGhhIC0gcHJldik7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cC5kaWZmID0gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRwcmV2ID0gYWxwaGE7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cocC5kaWZmKTtcblxuXHRcdFx0XHRpZihwLmRpZmYgPiBhbmdsZVRyZXNob2xkKSB7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpKTtcblx0XHRcdFx0XHRwb2ludFBvcy5wdXNoKGkpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9wLmNvbXB1dGVkQWxwaGEgPSBhbHBoYTtcblx0XHRcdFx0Ly9hbGxQb2ludHMucHVzaChwKTtcblxuXHRcdFx0fS8qKi9cblxuXHRcdFx0IC8qXG5cdFx0XHQvL0RFQlVHIFxuXHRcdFx0Ly9maW5kIG1heCBjdXJ2YXR1cmUgdGhhdCBpcyBub3QgYSBjdXNwICh0cmVzaG9sZCBkZXRlcm1pbmVzIGN1c3ApXG5cdFx0XHR2YXIgY3VzcFRyZXNob2xkID0gNDA7XG5cdFx0XHR2YXIgbWF4ID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihtLCBwKXtcblx0XHRcdFx0cmV0dXJuIHAuZGlmZiA+IG0gJiYgcC5kaWZmIDwgY3VzcFRyZXNob2xkID8gcC5kaWZmIDogbTtcblx0XHRcdH0sIDApO1xuXHRcdFx0Y29uc29sZS5sb2cobWF4KTtcblxuXHRcdFx0dmFyIHByZXYgPSBbMCwwLDAsMF07XG5cdFx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0dmFyIHIgPSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdFx0dmFyIGcgPSAyNTUgLSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdFx0dmFyIHJnYiA9ICdyZ2IoJytyKycsJytnKycsMCknO1xuXHRcdFx0XHRpZihyPjEwMCkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09Jyk7XG5cdFx0XHRcdFx0cHJldi5mb3JFYWNoKGZ1bmN0aW9uKHApe2NvbnNvbGUubG9nKHAuY29tcHV0ZWRBbHBoYSwgcC5hbHBoYSk7fSk7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhLCByZ2IpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHAueSArPSAxNTA7XG5cdFx0XHRcdHNob3dQb2ludChwLCByZ2IsIDAuNSk7XG5cdFx0XHRcdHByZXZbM10gPSBwcmV2WzJdO1xuXHRcdFx0XHRwcmV2WzJdID0gcHJldlsxXTtcblx0XHRcdFx0cHJldlsxXSA9IHByZXZbMF07XG5cdFx0XHRcdHByZXZbMF0gPSBwO1xuXHRcdFx0fSk7XG5cdFx0XHQvKiovXG5cblx0XHRcdC8vZmluZHMgZ3JvdXBzIG9mIHBvaW50cyBkZXBlbmRpbmcgb24gdHJlc2hvbGQsIGFuZCBmaW5kIHRoZSBtaWRkbGUgb2YgZWFjaCBncm91cFxuXHRcdFx0cmV0dXJuIHBvaW50UG9zLnJlZHVjZShmdW5jdGlvbihwb2ludHMsIHBvaW50KXtcblxuXHRcdFx0XHR2YXIgbGFzdCA9IHBvaW50c1twb2ludHMubGVuZ3RoLTFdO1xuXHRcdFx0XHRpZighbGFzdCB8fCBwb2ludCAtIGxhc3RbbGFzdC5sZW5ndGgtMV0gPiBkaXN0YW5jZVRyZXNob2xkKXtcblx0XHRcdFx0XHRsYXN0ID0gW3BvaW50XTtcblx0XHRcdFx0XHRwb2ludHMucHVzaChsYXN0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRsYXN0LnB1c2gocG9pbnQpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIHBvaW50cztcblx0XHRcdH0sIFtdKS5tYXAoZnVuY3Rpb24ocG9pbnRzKXtcblx0XHRcdFx0cmV0dXJuIHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGgvMildO1xuXHRcdFx0fSk7XG5cdFx0fSkoKTtcblxuXHRcdGNvbnNvbGUubG9nKGJyZWFrUG9pbnRzKTtcblx0XHRicmVha1BvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0dmFyIHBPYmogPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcCk7XG5cdFx0XHRzaG93UG9pbnQocE9iaiwgJyMwMGZmMDAnLCAzKTtcblx0XHR9KTsvKiovXG5cdFx0XG5cdFx0cmV0dXJuIGJyZWFrUG9pbnRzO1xuXG5cdH07XG5cblx0cmV0dXJuIGZ1bmN0aW9uKHMsIGdyb3VwcywgcHJpbnROb2RlLCBkaW0sIGdyb3VwTWF4SGVpZ2h0KXtcblx0XHRzdGFnZSA9IHM7XG5cdFx0dmFyIHBhZCA9IDIwO1xuXHRcdHZhciBhdmFpbFcgPSBkaW1bMF0gLSBwYWQ7XG5cdFx0XG5cdFx0dmFyIHRvcExlZnQgPSB7eDpwYWQsIHk6cGFkfTtcblx0XHR2YXIgZWFzZVBvaW50cyA9IE9iamVjdC5rZXlzKGdyb3VwcykucmVkdWNlKGZ1bmN0aW9uKGFsbCwgbmFtZSl7XG5cdFx0XHR2YXIgZ3JvdXAgPSBncm91cHNbbmFtZV07XG5cblx0XHRcdHZhciBlbmRMZWZ0ID0gdG9wTGVmdC54ICsgZ3JvdXAuZ2V0V2lkdGgoKSArIHBhZDtcblx0XHRcdGNvbnNvbGUubG9nKGdyb3VwLmdldFdpZHRoKCksIGdyb3VwTWF4SGVpZ2h0KTtcblxuXHRcdFx0aWYoZW5kTGVmdCA+IGF2YWlsVykge1xuXHRcdFx0XHR0b3BMZWZ0LnggPSBwYWQ7XG5cdFx0XHRcdHRvcExlZnQueSArPSBwYWQgKyAoZ3JvdXBNYXhIZWlnaHQgLyAyKTtcblx0XHRcdFx0ZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cdFx0XHR9XG5cblxuXHRcdFx0dmFyIHRoaXNFYXNlID0gZ3JvdXAucGF0aHMubWFwKGZ1bmN0aW9uKHApe1xuXHRcdFx0XHRwID0gcC50cmFuc2xhdGUoW3RvcExlZnQueCwgdG9wTGVmdC55XSk7XG5cdFx0XHRcdHJldHVybiBmaW5kRGVmYXVsdHMocCk7XG5cdFx0XHR9KTtcblx0XHRcdGFsbFtuYW1lXSA9IHRoaXNFYXNlO1xuXG5cblx0XHRcdHRvcExlZnQueCA9IGVuZExlZnQ7XHRcdFx0XG5cblxuXHRcdFx0cmV0dXJuIGFsbDtcblx0XHR9LCB7fSk7XG5cdFx0Y29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cblx0XHRwcmludE5vZGUudGV4dChKU09OLnN0cmluZ2lmeShlYXNlUG9pbnRzKSk7XG5cdH07XG5cblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdyb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9zZS5kcmF3aW5nLkFscGhhYmV0KTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQWxwaGFiZXQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXHRcdGdldFBhdGhzIDogZnVuY3Rpb24obmFtZSwgcmlnaHQsIHRvcCwgc2NhbGUpIHtcblx0XHRcdHJpZ2h0ID0gcmlnaHQgfHwgMDtcblx0XHRcdHRvcCA9IHRvcCB8fCAwO1xuXG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0dmFyIGxpbmVzID0gW107XG5cblx0XHRcdC8vbG9vcCBmb3IgZXZlcnkgY2hhcmFjdGVyIGluIG5hbWUgKHN0cmluZylcblx0XHRcdGZvcih2YXIgaT0wOyBpPG5hbWUubGVuZ3RoOyBpKyspwqB7XG5cdFx0XHRcdHZhciBsZXR0ZXIgPSBuYW1lW2ldO1xuXHRcdFx0XHRpZihsZXR0ZXIgPT09ICcgJykge1xuXHRcdFx0XHRcdHJpZ2h0ICs9IEFscGhhYmV0LmdldE5TcGFjZSgpICogc2NhbGU7XG5cdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBsZXR0ZXJEZWYgPSBBbHBoYWJldC5nZXRMZXR0ZXIobGV0dGVyKS5zY2FsZShzY2FsZSk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyRGVmKTtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBsZXR0ZXJKb2luZWRFbmQgPSBmYWxzZTtcblx0XHRcdFx0bGV0dGVyRGVmLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0XHRcdHZhciBkZWYgPSBwYXRoLnRyYW5zbGF0ZShbcmlnaHQsIHRvcF0pO1xuXHRcdFx0XHRcdHZhciBqb2luZWRTdGFydCA9IGRlZi5uYW1lICYmIGRlZi5uYW1lLmluZGV4T2YoJ2pvaW5hJykgPiAtMTtcblx0XHRcdFx0XHR2YXIgam9pbmVkRW5kID0gL2pvaW4oYT8pYi8udGVzdChkZWYubmFtZSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXIsIGpvaW5lZFN0YXJ0LCBqb2luZWRFbmQpO1xuXHRcdFx0XHRcdGxldHRlckpvaW5lZEVuZCA9IGxldHRlckpvaW5lZEVuZCB8fCBqb2luZWRFbmQ7XG5cdFx0XHRcdFx0aWYoam9pbmVkU3RhcnQgJiYgY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9hcHBlbmQgYXUgY29udGludW91c1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5hcHBlbmQoZGVmLCBsZXR0ZXIpO1xuXG5cdFx0XHRcdFx0XHQvL2Fqb3V0ZSBsZXMgZWFzZXBvaW50cyBkZSBjZSBwYXRoXG5cdFx0XHRcdFx0XHR2YXIgcGF0aFN0YXJ0UG9zID0gY29udGludW91cy5nZXRMZW5ndGgoKSAtIGRlZi5nZXRMZW5ndGgoKTtcblx0XHRcdFx0XHRcdGRlZi5nZXRFYXNlcG9pbnRzKCkuZm9yRWFjaChmdW5jdGlvbihwb3Mpe1xuXHRcdFx0XHRcdFx0XHRjb250aW51b3VzLmFkZEVhc2Vwb2ludChwYXRoU3RhcnRQb3MgKyBwb3MpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHR9IGVsc2UgaWYoam9pbmVkRW5kICYmICFjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL3N0YXJ0IHVuIG5vdXZlYXUgbGluZVxuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGRlZjtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMubmFtZSA9IGxldHRlcjtcblx0XHRcdFx0XHRcdGxpbmVzLnB1c2goY29udGludW91cyk7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGxpbmVzLnB1c2goZGVmKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZighbGV0dGVySm9pbmVkRW5kKSB7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRcblx0XHRcdFx0cmlnaHQgKz0gbGV0dGVyRGVmLmdldFdpZHRoKCk7XG5cdFx0XHRcdC8vY29uc29sZS50YWJsZShbe2xldHRlcjpuYW1lW2ldLCBsZXR0ZXJXaWR0aDogbGV0dGVyLmJvdW5kaW5nWzFdWzBdLCB0b3RhbDpyaWdodH1dKTtcdFxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbGluZXM7XG5cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFZlY3RvcldvcmQ7XG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByZWcgPSAvKFthLXpdKShbMC05XFxzXFwsXFwuXFwtXSspL2dpO1xuXHRcdFxuXHQvL2V4cGVjdGVkIGxlbmd0aCBvZiBlYWNoIHR5cGVcblx0dmFyIGV4cGVjdGVkTGVuZ3RocyA9IHtcblx0XHRtIDogMixcblx0XHRsIDogMixcblx0XHR2IDogMSxcblx0XHRoIDogMSxcblx0XHRjIDogNixcblx0XHRzIDogNFxuXHR9O1xuXG5cdHZhciBQYXRoID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHR0aGlzLnN2ZyA9IHN2Zztcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdC8vaWYoc3ZnKSBjb25zb2xlLmxvZyhzdmcsIHBhcnNlZCk7XG5cdFx0dGhpcy5lYXNlUG9pbnRzID0gZWFzZVBvaW50cyB8fCBbXTtcblx0XHQvL2NvbnNvbGUubG9nKG5hbWUsIGVhc2VQb2ludHMpO1xuXHRcdHRoaXMuc2V0UGFyc2VkKHBhcnNlZCB8fCB0aGlzLnBhcnNlKHN2ZykpO1xuXHR9O1xuXG5cdHZhciByZWZpbmVCb3VuZGluZyA9IGZ1bmN0aW9uKGJvdW5kaW5nLCBwb2ludCkge1xuXHRcdGJvdW5kaW5nWzBdID0gYm91bmRpbmdbMF0gfHwgcG9pbnQuc2xpY2UoMCk7XG5cdFx0Ym91bmRpbmdbMV0gPSBib3VuZGluZ1sxXSB8fCBwb2ludC5zbGljZSgwKTtcblx0XHQvL3RvcCBsZWZ0XG5cdFx0aWYocG9pbnRbMF0gPCBib3VuZGluZ1swXVswXSkgYm91bmRpbmdbMF1bMF0gPSBwb2ludFswXTtcblx0XHRpZihwb2ludFsxXSA8IGJvdW5kaW5nWzBdWzFdKSBib3VuZGluZ1swXVsxXSA9IHBvaW50WzFdO1xuXHRcdC8vYm90dG9tIHJpZ2h0XG5cdFx0aWYocG9pbnRbMF0gPiBib3VuZGluZ1sxXVswXSkgYm91bmRpbmdbMV1bMF0gPSBwb2ludFswXTtcblx0XHRpZihwb2ludFsxXSA+IGJvdW5kaW5nWzFdWzFdKSBib3VuZGluZ1sxXVsxXSA9IHBvaW50WzFdO1xuXHRcdHJldHVybiBib3VuZGluZztcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnNldFNWRyA9IGZ1bmN0aW9uKHN2Zykge1xuXHRcdHRoaXMuc3ZnID0gc3ZnO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLnNldFBhcnNlZCA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuXHRcdC8vY29uc29sZS5sb2cocGFyc2VkKTtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0XHR0aGlzLmZpbmRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldEN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY3ViaWMgfHwgdGhpcy5wYXJzZUN1YmljKCk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRUb3RhbExlbmd0aCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyBhbiBTVkcgc3RyaW5nIG9mIHRoZSBwYXRoIHNlZ2VtbnRzLiBJdCBpcyBub3QgdGhlIHN2ZyBwcm9wZXJ0eSBvZiB0aGUgcGF0aCwgYXMgaXQgaXMgcG90ZW50aWFsbHkgdHJhbnNmb3JtZWRcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0U1ZHU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihzdmcsIHNlZ21lbnQpe1xuXHRcdFx0cmV0dXJuIHN2ZyArIHNlZ21lbnQudHlwZSArIHNlZ21lbnQuYW5jaG9ycy5qb2luKCcsJyk7IFxuXHRcdH0sICcnKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyB0aGUgcG9zaXRpb25zIGF0IHdoaWNoIHdlIGhhdmUgZWFzZSBwb2ludHMgKHdoaWNoIGFyZSBwcmVwYXJzZWQgYW5kIGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgcGF0aCdzIGRlZmluaXRpb25zKVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZWFzZVBvaW50cztcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRQb2ludCA9IGZ1bmN0aW9uKGlkeCkge1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5wYXJzZWQpO1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZFtpZHhdICYmIHRoaXMucGFyc2VkW2lkeF0uYW5jaG9ycztcblx0fTtcblxuXHQvKipcblx0UGFyc2VzIGFuIFNWRyBwYXRoIHN0cmluZyB0byBhIGxpc3Qgb2Ygc2VnbWVudCBkZWZpbml0aW9ucyB3aXRoIEFCU09MVVRFIHBvc2l0aW9ucyB1c2luZyBSYXBoYWVsLnBhdGgyY3VydmVcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUucGFyc2UgPSBmdW5jdGlvbihzdmcpIHtcblx0XHR2YXIgY3VydmUgPSBSYXBoYWVsLnBhdGgyY3VydmUoc3ZnKTtcblx0XHR2YXIgcGF0aCA9IGN1cnZlLm1hcChmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlIDogcG9pbnQuc2hpZnQoKSxcblx0XHRcdFx0YW5jaG9ycyA6IHBvaW50XG5cdFx0XHR9O1xuXHRcdH0pO1xuXHRcdHJldHVybiBwYXRoO1xuXHR9O1xuXG5cdC8qKlxuXHRcdFBhcnNlcyBhIHBhdGggZGVmaW5lZCBieSBwYXJzZVBhdGggdG8gYSBsaXN0IG9mIGJlemllciBwb2ludHMgdG8gYmUgdXNlZCBieSBHcmVlbnNvY2sgQmV6aWVyIHBsdWdpbiwgZm9yIGV4YW1wbGVcblx0XHRUd2Vlbk1heC50byhzcHJpdGUsIDUwMCwge1xuXHRcdFx0YmV6aWVyOnt0eXBlOlwiY3ViaWNcIiwgdmFsdWVzOmN1YmljfSxcblx0XHRcdGVhc2U6UXVhZC5lYXNlSW5PdXQsXG5cdFx0XHR1c2VGcmFtZXMgOiB0cnVlXG5cdFx0fSk7XG5cdFx0Ki9cblx0UGF0aC5wcm90b3R5cGUucGFyc2VDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdC8vY29uc29sZS5sb2cocGF0aCk7XG5cdFx0Ly9hc3N1bWVkIGZpcnN0IGVsZW1lbnQgaXMgYSBtb3ZldG9cblx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuY3ViaWMgPSB0aGlzLnBhcnNlZC5yZWR1Y2UoZnVuY3Rpb24oYW5jaG9ycywgc2VnbWVudCl7XG5cdFx0XHR2YXIgYSA9IHNlZ21lbnQuYW5jaG9ycztcblx0XHRcdGlmKHNlZ21lbnQudHlwZT09PSdNJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTphWzFdfSk7XG5cdFx0XHR9IGVsc2UgaWYoc2VnbWVudC50eXBlPT09J0wnKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVswXSwgeTogYVsxXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMl0sIHk6IGFbM119KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzRdLCB5OiBhWzVdfSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHRcdH0sIFtdKTtcblxuXHRcdHJldHVybiBhbmNob3JzO1xuXG5cdH07XG5cblx0Ly90cm91dmUgbGUgYm91bmRpbmcgYm94IGQndW5lIGxldHRyZSAoZW4gc2UgZmlhbnQganVzdGUgc3VyIGxlcyBwb2ludHMuLi4gb24gbmUgY2FsY3VsZSBwYXMgb3UgcGFzc2UgbGUgcGF0aClcblx0UGF0aC5wcm90b3R5cGUuZmluZEJvdW5kaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGJvdW5kaW5nID0gdGhpcy5ib3VuZGluZyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihib3VuZGluZywgcCl7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHAuYW5jaG9ycztcblx0XHRcdHZhciBwb2ludDtcblx0XHRcdGlmKGFuY2hvcnMubGVuZ3RoID09PSAyKSB7XG5cdFx0XHRcdHBvaW50ID0gW2FuY2hvcnNbMF0sIGFuY2hvcnNbMV1dO1xuXHRcdFx0fSBlbHNlIGlmKGFuY2hvcnMubGVuZ3RoID09PSA2KSB7XG5cdFx0XHRcdHBvaW50ID0gW2FuY2hvcnNbNF0sIGFuY2hvcnNbNV1dO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlZmluZUJvdW5kaW5nKGJvdW5kaW5nLCBwb2ludCk7XG5cdFx0fSwgW10pO1xuXHRcdHJldHVybiBib3VuZGluZztcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKG9mZnNldCkge1xuXHRcdHZhciBwYXJzZWQgPSB0aGlzLnBhcnNlZC5tYXAoZnVuY3Rpb24oZGVmKSB7XG5cdFx0XHR2YXIgbmV3RGVmID0gT2JqZWN0LmNyZWF0ZShkZWYpO1xuXHRcdFx0bmV3RGVmLmFuY2hvcnMgPSBkZWYuYW5jaG9ycy5tYXAoZnVuY3Rpb24oY29vcmQsIGkpe1xuXHRcdFx0XHRyZXR1cm4gY29vcmQgKz0gb2Zmc2V0W2klMl07XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBuZXdEZWY7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShudWxsLCB0aGlzLm5hbWUsIHBhcnNlZCwgdGhpcy5lYXNlUG9pbnRzKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgcGF0aCwgc2NhbGVkXG5cdFBhdGgucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24ocmF0aW8pIHtcblx0XHR2YXIgcGFyc2VkID0gdGhpcy5wYXJzZWQubWFwKGZ1bmN0aW9uKGRlZikge1xuXHRcdFx0dmFyIG5ld0RlZiA9IE9iamVjdC5jcmVhdGUoZGVmKTtcblx0XHRcdG5ld0RlZi5hbmNob3JzID0gZGVmLmFuY2hvcnMubWFwKGZ1bmN0aW9uKGNvb3JkLCBpKXtcblx0XHRcdFx0cmV0dXJuIGNvb3JkICo9IHJhdGlvO1xuXHRcdFx0fSk7XG5cdFx0XHRyZXR1cm4gbmV3RGVmO1xuXHRcdH0pO1xuXHRcdHZhciBlYXNlUG9pbnRzID0gdGhpcy5lYXNlUG9pbnRzLm1hcChmdW5jdGlvbihlcCl7XG5cdFx0XHRyZXR1cm4gZXAgKiByYXRpbztcblx0XHR9KTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KG51bGwsIHRoaXMubmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihwYXJ0LCBuYW1lKcKge1xuXHRcdC8vY29uc29sZS5sb2cocGFydCk7XG5cdFx0aWYobmFtZSkgdGhpcy5uYW1lICs9IG5hbWU7XG5cdFx0dGhpcy5zZXRQYXJzZWQodGhpcy5wYXJzZWQuY29uY2F0KHBhcnQucGFyc2VkLnNsaWNlKDEpKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYWRkRWFzZXBvaW50ID0gZnVuY3Rpb24ocG9zKXtcblx0XHR0aGlzLmVhc2VQb2ludHMucHVzaChwb3MpO1xuXHR9O1xuXG5cdFBhdGgucmVmaW5lQm91bmRpbmcgPSByZWZpbmVCb3VuZGluZztcblxuXHRQYXRoLmZhY3RvcnkgPSBmdW5jdGlvbihzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cykge1xuXHRcdHJldHVybiBuZXcgUGF0aChzdmcsIG5hbWUsIHBhcnNlZCwgZWFzZVBvaW50cyk7XG5cdH07XG5cblx0cmV0dXJuIFBhdGg7XG5cbn0pKTtcblxuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL01hdGhVdGlscycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXG5cdHZhciBkZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5cdHZhciByYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cblx0cmV0dXJuIHtcblxuXHRcdHRvUmFkaWFucyA6IGZ1bmN0aW9uKGRlZ3JlZXMpIHtcblx0XHQgIHJldHVybiBkZWdyZWVzICogZGVnVG9SYWQ7XG5cdFx0fSxcblx0XHQgXG5cdFx0Ly8gQ29udmVydHMgZnJvbSByYWRpYW5zIHRvIGRlZ3JlZXMuXG5cdFx0dG9EZWdyZWVzIDogZnVuY3Rpb24ocmFkaWFucykge1xuXHRcdCAgcmV0dXJuIHJhZGlhbnMgKiByYWRUb0RlZztcblx0XHR9XG5cdH07XG5cbn0pKTsiXX0=
