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

	names = ['aksttef'];


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
	    module.exports = factory(require('jquery'), require('lagrange/drawing/Path.js'), require('lagrange/drawing/PathGroup.js'), require('app/rose/drawing/PathEasepoints.js'));
  	} else {
		ns[name] = factory(root.jQuery, root.lagrange.drawing.Path, root.lagrange.drawing.PathGroup, root.lagrange.drawing.PathEasepoints);
	}
}(this, function ($, Path, PathGroup, PathEasepoints) {
	"use strict";

	//original scale factor
	var SCALE = 1;
	var svgFile = 'assets/alphabet.svg';

	//PARSÉ avec le helper au bas
	var EASEPOINTS = {"Ö":[[5],[5],[]],"Ô":[[]],"Ï":[[93],[5],[5]],"Î":[[93]],"Ë":[[159],[5],[5]],"Ê":[[159]],"È":[[159],[]],"É":[[159],[]],"Ç":[[],[13]],"Ä":[[189],[],[5],[5]],"Â":[[189],[]],"À":[[189],[],[]],"Z":[[193,340]],"Y":[[329]],"X":[[],[]],"W":[[227,336]],"V":[[231]],"U":[[317]],"T":[[],[]],"S":[[]],"R":[[289],[]],"Q":[[]],"P":[[],[]],"O":[[]],"N":[[247,350]],"M":[[238,338,452]],"L":[[]],"K":[[115],[122]],"J":[[132]],"I":[[93]],"H":[[142],[],[]],"G":[[321]],"F":[[],[]],"E":[[159]],"D":[[]],"C":[[]],"B":[[453]],"A":[[189],[]],"ô":[[155]],"ö":[[155],[5],[5]],"ï":[[42],[5],[5]],"î":[[42]],"ë":[[],[5],[5]],"ê":[[]],"è":[[],[]],"é":[[],[]],"ç":[[72],[13]],"ä":[[55,133],[5],[5]],"â":[[55,133]],"à":[[55,133],[]],"z":[[110]],"y":[[42,116,227]],"x":[[42],[]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103],[]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[124]],"k":[[131,244,327]],"j":[[52],[18]],"i":[[42],[18]],"h":[[133,248,293]],"g":[[60,145]],"f":[[419]],"e":[[]],"d":[[236]],"c":[[72]],"b":[[291]],"a":[[55,133]]};

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
				var p = Path.factory( pathEl.attr('d'), pathEl.attr('id'), null, EASEPOINTS[id] && EASEPOINTS[id][i]).scale(SCALE);				
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

			PathEasepoints(stage, letters, node, dim);
		}
	};

	return Alphabet;
	
}));



},{"app/rose/drawing/PathEasepoints.js":4,"jquery":"jquery","lagrange/drawing/Path.js":6,"lagrange/drawing/PathGroup.js":7}],3:[function(require,module,exports){
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

	return function(s, groups, printNode, dim){
		stage = s;
		var pad = 20;
		var availW = dim[0] - pad;

		var groupMaxHeight = Object.keys(groups).reduce(function(min, groupName){
			var t = groups[groupName].getHeight();
			if(min === undefined || min > t) {
				min = t;
			}
			return min;
		}, undefined);
		
		var topLeft = {x:pad, y:pad};
		var easePoints = Object.keys(groups).reduce(function(all, name){
			var group = groups[name];

			var endLeft = topLeft.x + group.getWidth() + pad;
			console.log(group.getWidth(), groupMaxHeight);

			if(endLeft > availW) {
				topLeft.x = pad;
				topLeft.y += pad + groupMaxHeight;
				endLeft = topLeft.x + group.getWidth() + pad;
			}


			var thisEase = group.paths.map(function(p){
				p = p.translate(topLeft.x, topLeft.y);
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



},{"lodash":"lodash","raphael":"raphael","rose/drawing/MathUtils.js":9}],5:[function(require,module,exports){
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



},{"rose/drawing/Alphabet.js":8}],6:[function(require,module,exports){
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



},{"raphael":"raphael"}],7:[function(require,module,exports){
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
module.exports=require(2)
},{"/Users/lagrange/git/lab/alphabet/node_modules/app/rose/drawing/Alphabet.js":2,"app/rose/drawing/PathEasepoints.js":4,"jquery":"jquery","lagrange/drawing/Path.js":6,"lagrange/drawing/PathGroup.js":7}],9:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvYXBwL3Jvc2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cy5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL1ZlY3RvcldvcmQuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvbGFncmFuZ2UvZHJhd2luZy9QYXRoLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL3Jvc2UvZHJhd2luZy9NYXRoVXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0XG5cdHZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XG5cdHZhciBSYXBoYWVsID0gcmVxdWlyZSgncmFwaGFlbCcpO1xuXHR2YXIgRHJhd1BhdGggPSByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL0RyYXdQYXRoLmpzJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzJyk7XG5cdHZhciBBbHBoYWJldCA9IHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKTtcblx0dmFyIFR3ZWVuTWF4ID0gcmVxdWlyZSgnZ3NhcCcpO1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBXID0gMTYwMDtcblx0dmFyIEggPSAxMjAwO1xuXG5cdHZhciBzY2FsZUZhY3RvciA9IDE7XG5cblx0dmFyIG5hbWVzID0gW1wiSmVzc2ljYSBXYW5uaW5nXCIsXCJKdWxpYSBSb2Nrd2VsbFwiLFwiQ2Fyb2wgSHViYmFyZFwiLFwiUm9uYWxkIENhbmR5XCIsXCJKb2huIE5ld3RvblwiLFwiRWx2aXMgTmljb2xlXCIsXCJHbG9yaWEgV2VhdmVyXCIsXCJKdWxpYSBDcm9ua2l0ZVwiLFwiTW90aGVyIFJvZ2Vyc1wiLFwiQ2hldnkgSXJ3aW5cIixcIkVkZGllIEFsbGVuXCIsXCJOb3JtYW4gSmFja3NvblwiLFwiUGV0ZXIgUm9nZXJzXCIsXCJXZWlyZCBDaGFzZVwiLFwiQ29saW4gTWF5c1wiLFwiTmFwb2xlb24gTWFydGluXCIsXCJFZGdhciBTaW1wc29uXCIsXCJNb2hhbW1hZCBNY0NhcnRuZXlcIixcIkxpYmVyYWNlIFdpbGxpYW1zXCIsXCJGaWVsZHMgQnVybmV0dFwiLFwiU3RldmUgQXNoZVwiLFwiQ2FycmllIENoYXJsZXNcIixcIlRvbW15IFBhc3RldXJcIixcIkVkZGllIFNpbHZlcnN0b25lXCIsXCJPcHJhaCBBc2hlXCIsXCJSYXkgQmFsbFwiLFwiSmltIERpYW5hXCIsXCJNaWNoZWxhbmdlbG8gRWFzdHdvb2RcIixcIkdlb3JnZSBTaW1wc29uXCIsXCJBbGljaWEgQXVzdGVuXCIsXCJKZXNzaWNhIE5pY29sZVwiLFwiTWFyaWx5biBFdmVyZXR0XCIsXCJLZWl0aCBFYXN0d29vZFwiLFwiUGFibG8gRWFzdHdvb2RcIixcIlBleXRvbiBMdXRoZXJcIixcIk1vemFydCBBcm1zdHJvbmdcIixcIk1pY2hhZWwgQnVybmV0dFwiLFwiS2VpdGggR2xvdmVyXCIsXCJFbGl6YWJldGggQ2hpbGRcIixcIk1pbGVzIEFzdGFpcmVcIixcIkFuZHkgRWRpc29uXCIsXCJNYXJ0aW4gTGVubm9uXCIsXCJUb20gUGljY2Fzb1wiLFwiQmV5b25jZSBEaXNuZXlcIixcIlBldGVyIENsaW50b25cIixcIkhlbnJ5IEtlbm5lZHlcIixcIlBhdWwgQ2hpbGRcIixcIkxld2lzIFNhZ2FuXCIsXCJNaWNoZWxhbmdlbG8gTGVlXCIsXCJNYXJpbHluIEZpc2hlclwiXTtcblx0ZnVuY3Rpb24gU2h1ZmZsZShvKSB7XG5cdFx0Zm9yKHZhciBqLCB4LCBpID0gby5sZW5ndGg7IGk7IGogPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogaSksIHggPSBvWy0taV0sIG9baV0gPSBvW2pdLCBvW2pdID0geCk7XG5cdFx0cmV0dXJuIG87XG5cdH07XG5cdFNodWZmbGUobmFtZXMpO1xuXHRuYW1lcy5sZW5ndGggPSAxOy8qKi9cblxuXHRuYW1lcyA9IFsnYWtzdHRlZiddO1xuXG5cblx0dmFyIGdldFN0YWdlID0gKGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHN0YWdlO1xuXHRcdHZhciBpbml0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBSYXBoYWVsKFwic3ZnXCIsIFcsIEgpO1xuXHRcdH07XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3RhZ2UgPSBzdGFnZSB8fCBpbml0KCk7XG5cdFx0fVxuXHR9KSgpO1xuXG5cdHZhciBkb0RyYXcgPSBmdW5jdGlvbigpe1xuXHRcdHZhciBpbmNyID0gSCAvIG5hbWVzLmxlbmd0aDtcblx0XHRuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUsIGspe1xuXHRcdFx0Ly90cmFjZU5hbWUobmFtZSwgMCwgayAqIGluY3IpO1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBWZWN0b3JXb3JkLmdldFBhdGhzKG5hbWUsIDAsIGsgKiBpbmNyLCBzY2FsZUZhY3Rvcik7XG5cdFx0XHR2YXIgc3RhcnQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0RHJhd1BhdGguZ3JvdXAocGF0aHMsIGdldFN0YWdlKCksIHtcblx0XHRcdFx0cHhQZXJTZWNvbmQgOiAyMDAsXG5cdFx0XHRcdGNvbG9yIDogJyM0NDQ0NDQnLFxuXHRcdFx0XHRzdHJva2VXaWR0aCA6IDIsXG5cdFx0XHRcdGVhc2luZyA6IGdzYXAuU2luZS5lYXNlSW5PdXRcblx0XHRcdH0pO1xuXG5cdFx0XHR2YXIgZW5kID0gbmV3IERhdGUoKTtcblx0XHRcdGNvbnNvbGUubG9nKGVuZC1zdGFydCk7XG5cblx0XHR9KTtcblxuXHR9O1xuXG5cdHZhciBsb2FkaW5nID0gQWxwaGFiZXQuaW5pdCgpO1x0XG5cdHZhciBidG4gPSAkKCcjY3RybCcpO1xuXG5cdGJ0bi5vbignY2xpY2suYWxwaGFiZXQnLCBmdW5jdGlvbigpe1xuXHRcdGxvYWRpbmcudGhlbihkb0RyYXcpO1xuXHR9KTtcblxuXG5cdC8vcGFyc2UgbGVzIGJyZWFrcG9pbnRzIGRlIGNoYXF1ZSBsZXR0cmUsIG91dHB1dCBlbiBKU09OICjDoCBzYXZlcilcblx0dmFyIHByaW50RWFzZXBvaW50cyA9IGZ1bmN0aW9uKCl7XG5cdFx0QWxwaGFiZXQucGFyc2VFYXNlcG9pbnRzKGdldFN0YWdlKCksICQoJyNicnAnKSwgW1csIEhdKTtcblx0fTtcblxuXHR2YXIgZ2V0QnByID0gJCgnI2dldGJycCcpO1xuXG5cdGdldEJwci5vbignY2xpY2suYWxwaGFiZXQnLCBmdW5jdGlvbigpe1xuXHRcdGxvYWRpbmcudGhlbihwcmludEVhc2Vwb2ludHMpO1xuXHR9KTtcblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9BbHBoYWJldCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aC5qcycpLCByZXF1aXJlKCdsYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cC5qcycpLCByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzLmpzJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QualF1ZXJ5LCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aCwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGhHcm91cCwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGhFYXNlcG9pbnRzKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoJCwgUGF0aCwgUGF0aEdyb3VwLCBQYXRoRWFzZXBvaW50cykge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL29yaWdpbmFsIHNjYWxlIGZhY3RvclxuXHR2YXIgU0NBTEUgPSAxO1xuXHR2YXIgc3ZnRmlsZSA9ICdhc3NldHMvYWxwaGFiZXQuc3ZnJztcblxuXHQvL1BBUlPDiSBhdmVjIGxlIGhlbHBlciBhdSBiYXNcblx0dmFyIEVBU0VQT0lOVFMgPSB7XCLDllwiOltbNV0sWzVdLFtdXSxcIsOUXCI6W1tdXSxcIsOPXCI6W1s5M10sWzVdLFs1XV0sXCLDjlwiOltbOTNdXSxcIsOLXCI6W1sxNTldLFs1XSxbNV1dLFwiw4pcIjpbWzE1OV1dLFwiw4hcIjpbWzE1OV0sW11dLFwiw4lcIjpbWzE1OV0sW11dLFwiw4dcIjpbW10sWzEzXV0sXCLDhFwiOltbMTg5XSxbXSxbNV0sWzVdXSxcIsOCXCI6W1sxODldLFtdXSxcIsOAXCI6W1sxODldLFtdLFtdXSxcIlpcIjpbWzE5MywzNDBdXSxcIllcIjpbWzMyOV1dLFwiWFwiOltbXSxbXV0sXCJXXCI6W1syMjcsMzM2XV0sXCJWXCI6W1syMzFdXSxcIlVcIjpbWzMxN11dLFwiVFwiOltbXSxbXV0sXCJTXCI6W1tdXSxcIlJcIjpbWzI4OV0sW11dLFwiUVwiOltbXV0sXCJQXCI6W1tdLFtdXSxcIk9cIjpbW11dLFwiTlwiOltbMjQ3LDM1MF1dLFwiTVwiOltbMjM4LDMzOCw0NTJdXSxcIkxcIjpbW11dLFwiS1wiOltbMTE1XSxbMTIyXV0sXCJKXCI6W1sxMzJdXSxcIklcIjpbWzkzXV0sXCJIXCI6W1sxNDJdLFtdLFtdXSxcIkdcIjpbWzMyMV1dLFwiRlwiOltbXSxbXV0sXCJFXCI6W1sxNTldXSxcIkRcIjpbW11dLFwiQ1wiOltbXV0sXCJCXCI6W1s0NTNdXSxcIkFcIjpbWzE4OV0sW11dLFwiw7RcIjpbWzE1NV1dLFwiw7ZcIjpbWzE1NV0sWzVdLFs1XV0sXCLDr1wiOltbNDJdLFs1XSxbNV1dLFwiw65cIjpbWzQyXV0sXCLDq1wiOltbXSxbNV0sWzVdXSxcIsOqXCI6W1tdXSxcIsOoXCI6W1tdLFtdXSxcIsOpXCI6W1tdLFtdXSxcIsOnXCI6W1s3Ml0sWzEzXV0sXCLDpFwiOltbNTUsMTMzXSxbNV0sWzVdXSxcIsOiXCI6W1s1NSwxMzNdXSxcIsOgXCI6W1s1NSwxMzNdLFtdXSxcInpcIjpbWzExMF1dLFwieVwiOltbNDIsMTE2LDIyN11dLFwieFwiOltbNDJdLFtdXSxcIndcIjpbWzM4LDEwNywxNzddXSxcInZcIjpbWzY2XV0sXCJ1XCI6W1szMywxMDVdXSxcInRcIjpbWzEwM10sW11dLFwic1wiOltbNTAsMTEwXV0sXCJyXCI6W1s2NF1dLFwicVwiOltbMTQ0LDMyNV1dLFwicFwiOltbNTYsMzA1XV0sXCJvXCI6W1sxNTVdXSxcIm5cIjpbWzEwNF1dLFwibVwiOltbMTEwXV0sXCJsXCI6W1sxMjRdXSxcImtcIjpbWzEzMSwyNDQsMzI3XV0sXCJqXCI6W1s1Ml0sWzE4XV0sXCJpXCI6W1s0Ml0sWzE4XV0sXCJoXCI6W1sxMzMsMjQ4LDI5M11dLFwiZ1wiOltbNjAsMTQ1XV0sXCJmXCI6W1s0MTldXSxcImVcIjpbW11dLFwiZFwiOltbMjM2XV0sXCJjXCI6W1s3Ml1dLFwiYlwiOltbMjkxXV0sXCJhXCI6W1s1NSwxMzNdXX07XG5cblx0dmFyIGxldHRlcnMgPSB7fTtcblxuXHRcblxuXHR2YXIgcGFyc2VTVkcgPSBmdW5jdGlvbihkYXRhKXtcblxuXHRcdC8vY29uc29sZS5sb2coZGF0YSk7XG5cdFx0dmFyIGRvYyA9ICQoZGF0YSk7XG5cdFx0dmFyIGxheWVycyA9IGRvYy5maW5kKCdnJyk7XG5cdFx0bGF5ZXJzLmVhY2goZnVuY3Rpb24oaSwgZWwpe1xuXHRcdFx0dmFyIGxheWVyID0gJChlbCk7XG5cdFx0XHR2YXIgaWQgPSBsYXllci5hdHRyKCdpZCcpO1xuXG5cdFx0XHRpZihpZCA9PSAnX3gyRF8nKSB7XG5cdFx0XHRcdGlkID0gJy0nO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRpZihpZC5sZW5ndGggPiAxKSByZXR1cm47XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBsZXR0ZXJzW2lkXSA9IG5ldyBQYXRoR3JvdXAoaWQpO1xuXG5cdFx0XHR2YXIgcGF0aHMgPSBsYXllci5maW5kKCdwYXRoJyk7XG5cdFx0XHQvL2lmKHBhdGhzLmxlbmd0aD09MCkgY29uc29sZS5sb2cobGF5ZXIpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhpZCk7XG5cdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIHBhdGhFbCA9ICQoZWwpO1xuXHRcdFx0XHR2YXIgcCA9IFBhdGguZmFjdG9yeSggcGF0aEVsLmF0dHIoJ2QnKSwgcGF0aEVsLmF0dHIoJ2lkJyksIG51bGwsIEVBU0VQT0lOVFNbaWRdICYmIEVBU0VQT0lOVFNbaWRdW2ldKS5zY2FsZShTQ0FMRSk7XHRcdFx0XHRcblx0XHRcdFx0bGV0dGVyLmFkZFBhdGgoIHAgKTtcblx0XHRcdH0pO1xuXG5cdFx0fSk7XG5cblx0XHQvL2NvbnNvbGUubG9nKGJvdW5kaW5ncyk7XG5cdFx0Ly90cm91dmUgbGUgdG9wIGFic29sdSAodG9wIGRlIGxhIGxldHRyZSBsYSBwbHVzIGhhdXRlKVxuXHRcdHZhciB0b3AgPSBPYmplY3Qua2V5cyhsZXR0ZXJzKS5yZWR1Y2UoZnVuY3Rpb24obWluLCBsZXR0ZXJOYW1lKXtcblx0XHRcdHZhciB0ID0gbGV0dGVyc1tsZXR0ZXJOYW1lXS5nZXRUb3AoKTtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IHQpIHtcblx0XHRcdFx0bWluID0gdDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtaW47XG5cdFx0fSwgdW5kZWZpbmVkKTtcblx0XHQvL2NvbnNvbGUubG9nKHRvcCk7XG5cdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXJzKTtcblxuXHRcdC8vYWp1c3RlIGxlIGJhc2VsaW5lIGRlIGNoYXF1ZSBsZXR0cmVcblx0XHRPYmplY3Qua2V5cyhsZXR0ZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0bGV0dGVyc1trZXldLnNldE9mZnNldCgtMSAqIGxldHRlcnNba2V5XS5nZXRMZWZ0KCksIC0xICogdG9wKTtcblx0XHR9KTtcblxuXG5cdH07XG5cblx0dmFyIGRvTG9hZCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGxvYWRpbmcgPSAkLmFqYXgoe1xuXHRcdFx0dXJsIDogc3ZnRmlsZSxcblx0XHRcdGRhdGFUeXBlIDogJ3RleHQnXG5cdFx0fSk7XG5cblx0XHRsb2FkaW5nLnRoZW4ocGFyc2VTVkcsIGZ1bmN0aW9uKGEsIGIsIGMpe1xuXHRcdFx0Y29uc29sZS5sb2coJ2Vycm9yIGxvYWQnKTtcblx0XHRcdGNvbnNvbGUubG9nKGIpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhjKTtcblx0XHRcdC8vY29uc29sZS5sb2coYS5yZXNwb25zZVRleHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGxvYWRpbmcucHJvbWlzZSgpO1xuXG5cdH07XG5cblx0XG5cblx0dmFyIEFscGhhYmV0ID0ge1xuXHRcdGluaXQgOiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBkb0xvYWQoKTtcblx0XHR9LFxuXHRcdGdldExldHRlciA6IGZ1bmN0aW9uKGwpe1xuXHRcdFx0cmV0dXJuIGxldHRlcnNbbF07XG5cdFx0fSxcblx0XHRnZXROU3BhY2UgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIGxldHRlcnNbJ24nXS5nZXRXaWR0aCgpO1xuXHRcdH0sXG5cdFx0Ly9zZXR1cCBkZXMgYnJlYWtwb2ludHMgKHBvaW50cyBvw7kgb24gZmFpdCB1biBlYXNpbmcpIGRlIGNoYWN1bmUgZGVzIGxldHRyZXMuIFNlcmEgb3V0cHV0dMOpIGV0IHNhdsOpIGVuIEpTT04sIHBvdXIgw6p0cmUgbG9hZMOpIGVuIG3Dqm1lIHRlbXBzIHF1ZSBsJ2FscGhhYmV0LiBMZSBwYXJzZSBlbiByZWFsdGltZSBlc3QgdHJvcCBsZW50LCBkb25jIGNldHRlIGZvbmN0aW9uIGRvaXQgZXRyZSBjYWxsw6llIHBvdXIgcmVmYWlyZSBsZXMgYnJlYWtwb2ludHMgY2hhcXVlIGZvaXMgcXVlIGxlIFNWRyBjaGFuZ2UuXG5cdFx0cGFyc2VFYXNlcG9pbnRzIDogZnVuY3Rpb24oc3RhZ2UsIG5vZGUsIGRpbSl7XG5cblx0XHRcdFBhdGhFYXNlcG9pbnRzKHN0YWdlLCBsZXR0ZXJzLCBub2RlLCBkaW0pO1xuXHRcdH1cblx0fTtcblxuXHRyZXR1cm4gQWxwaGFiZXQ7XG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdyb3NlL2RyYXdpbmcvRHJhd1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSwgcmVxdWlyZSgnZ3NhcCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290Ll8sIHJvb3QuUmFwaGFlbCwgKHJvb3QuR3JlZW5Tb2NrR2xvYmFscyB8fCByb290KSk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKF8sIFJhcGhhZWwsIFR3ZWVuTWF4KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vZ3NhcCBleHBvcnRzIFR3ZWVuTWF4XG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBkZWZhdWx0cyA9IHtcblx0XHRjb2xvcjogJyMwMDAwMDAnLFxuXHRcdHN0cm9rZVdpZHRoIDogMC42LFxuXHRcdHB4UGVyU2Vjb25kIDogMTAwLCAvL3NwZWVkIG9mIGRyYXdpbmdcblx0XHRlYXNpbmcgOiBnc2FwLlF1YWQuZWFzZUluXG5cdH07XG5cblx0Ly9oZWxwZXJcblx0dmFyIHNob3dQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBzdGFnZSwgY29sb3IsIHNpemUpe1xuXHRcdHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdH07XG5cblx0dmFyIERyYXdQYXRoID0ge1xuXG5cdFx0c2luZ2xlIDogZnVuY3Rpb24ocGF0aCwgc3RhZ2UsIHBhcmFtcyl7XG5cblx0XHRcdHZhciBzZXR0aW5ncyA9IF8uZXh0ZW5kKHt9LCBkZWZhdWx0cywgcGFyYW1zKTtcblx0XHRcdHZhciBwYXRoU3RyID0gcGF0aC5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdHZhciBsZW5ndGggPSBwYXRoLmdldExlbmd0aCgpO1xuXHRcdFx0dmFyIHB4UGVyU2Vjb25kID0gc2V0dGluZ3MucHhQZXJTZWNvbmQ7XG5cdFx0XHR2YXIgdGltZSA9IGxlbmd0aCAvIHB4UGVyU2Vjb25kO1xuXG5cdFx0XHR2YXIgYW5pbSA9IHt0bzogMH07XG5cdFx0XHRcblx0XHRcdHZhciB1cGRhdGUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdFx0dmFyIGVsO1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHR2YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgYW5pbS50byk7XG5cdFx0XHRcdFx0aWYoZWwpIGVsLnJlbW92ZSgpO1xuXHRcdFx0XHRcdGVsID0gc3RhZ2UucGF0aChwYXRoUGFydCk7XG5cdFx0XHRcdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogc2V0dGluZ3Muc3Ryb2tlV2lkdGgsIHN0cm9rZTogc2V0dGluZ3MuY29sb3J9KTtcblx0XHRcdFx0fTtcblx0XHRcdH0pKCk7XG5cblx0XHRcdHZhciBlYXNlUG9pbnRzID0gcGF0aC5nZXRFYXNlcG9pbnRzKCk7XG5cdFx0XHQvKmNvbnNvbGUubG9nKGVhc2VQb2ludHMpO1xuXHRcdFx0ZWFzZVBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIHBvcyk7XG5cdFx0XHRcdHNob3dQb2ludChwLCBzdGFnZSwgJyNmZjAwMDAnLCAyKTtcblx0XHRcdH0pOy8qKi9cblx0XHRcdFxuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHRyZXR1cm4gZWFzZVBvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIHB4UGVyU2Vjb25kO1xuXHRcdFx0XHRsYXN0ID0gZGlzdDtcblx0XHRcdFx0cmV0dXJuIHRsLnRvKGFuaW0sIHRpbWUsIHt0bzogZGlzdCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe1xuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZVxuXHRcdFx0fSkpLnRvKGFuaW0sICgobGVuZ3RoIC0gKGVhc2VQb2ludHMubGVuZ3RoICYmIGVhc2VQb2ludHNbZWFzZVBvaW50cy5sZW5ndGgtMV0pKSAvIHB4UGVyU2Vjb25kKSwge3RvOiBsZW5ndGgsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdFxuXHRcdH0sXG5cblx0XHRncm91cCA6IGZ1bmN0aW9uKHBhdGhzLCBzdGFnZSwgc2V0dGluZ3MsIG9uQ29tcGxldGUpIHtcblx0XHRcdHJldHVybiBwYXRocy5yZWR1Y2UoZnVuY3Rpb24odGwsIHBhdGgpe1xuXHRcdFx0XHRyZXR1cm4gdGwuYXBwZW5kKERyYXdQYXRoLnNpbmdsZShwYXRoLCBzdGFnZSwgc2V0dGluZ3MpKTtcblx0XHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHsgb25Db21wbGV0ZTogKG9uQ29tcGxldGUgfHwgZnVuY3Rpb24oKXt9KSB9KSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIERyYXdQYXRoO1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJyksIHJlcXVpcmUoJ3Jvc2UvZHJhd2luZy9NYXRoVXRpbHMuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5fLCByb290LlJhcGhhZWwsIG5zLk1hdGhVdGlscyk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKF8sIFJhcGhhZWwsIE1hdGhVdGlscykge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXG5cdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdHZhciBhbmdsZVRyZXNob2xkID0gTWF0aFV0aWxzLnRvUmFkaWFucygxMik7XG5cblx0dmFyIHN0YWdlO1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpO1xuXHRcdGVsLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdH07XG5cblx0dmFyIHNob3cgPSBmdW5jdGlvbihwYXRoRGVmKSB7XG5cdFx0dmFyIHBhdGggPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1x0XHRcdFxuXHRcdHZhciBlbCA9IHN0YWdlLnBhdGgocGF0aCk7XG5cdFx0ZWwuYXR0cih7XCJzdHJva2Utd2lkdGhcIjogMSwgc3Ryb2tlOiAnIzAwMDAwMCd9KTsvKiovXG5cdH07XG5cblx0dmFyIGZpbmREZWZhdWx0cyA9IGZ1bmN0aW9uKHBhdGhEZWYpe1xuXHRcdHZhciBwYXRoU3RyID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcblx0XHR2YXIgbGVuZ3RoID0gcGF0aERlZi5nZXRMZW5ndGgoKTtcblxuXHRcdHNob3cocGF0aERlZik7XG5cblx0XHR2YXIgYnJlYWtQb2ludHMgPSAoZnVuY3Rpb24oKXtcblxuXHRcdFx0dmFyIHBvaW50UG9zID0gW107XG5cdFx0XHRcblx0XHRcdFxuXHRcdFx0dmFyIHByZWNpc2lvbiA9IDE7XG5cdFx0XHR2YXIgcHJldjtcblx0XHRcdHZhciBhbGxQb2ludHMgPSBbXTtcblx0XHRcdGZvcih2YXIgaT1wcmVjaXNpb247IGk8PWxlbmd0aDsgaSArPSBwcmVjaXNpb24pIHtcblx0XHRcdFx0Ly92YXIgcGF0aFBhcnQgPSBSYXBoYWVsLmdldFN1YnBhdGgocGF0aFN0ciwgMCwgaSk7XG5cdFx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly9pdCBzZWVtcyB0aGF0IFJhcGhhZWwncyBhbHBoYSBpcyBpbmNvbnNpc3RlbnQuLi4gc29tZXRpbWVzIG92ZXIgMzYwXG5cdFx0XHRcdHZhciBhbHBoYSA9IE1hdGguYWJzKCBNYXRoLmFzaW4oIE1hdGguc2luKE1hdGhVdGlscy50b1JhZGlhbnMocC5hbHBoYSkpICkpO1xuXHRcdFx0XHRpZihwcmV2KSB7XG5cdFx0XHRcdFx0cC5kaWZmID0gTWF0aC5hYnMoYWxwaGEgLSBwcmV2KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRwLmRpZmYgPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHByZXYgPSBhbHBoYTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhwLmRpZmYpO1xuXG5cdFx0XHRcdGlmKHAuZGlmZiA+IGFuZ2xlVHJlc2hvbGQpIHtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGkpO1xuXHRcdFx0XHRcdHBvaW50UG9zLnB1c2goaSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL3AuY29tcHV0ZWRBbHBoYSA9IGFscGhhO1xuXHRcdFx0XHQvL2FsbFBvaW50cy5wdXNoKHApO1xuXG5cdFx0XHR9LyoqL1xuXG5cdFx0XHQgLypcblx0XHRcdC8vREVCVUcgXG5cdFx0XHQvL2ZpbmQgbWF4IGN1cnZhdHVyZSB0aGF0IGlzIG5vdCBhIGN1c3AgKHRyZXNob2xkIGRldGVybWluZXMgY3VzcClcblx0XHRcdHZhciBjdXNwVHJlc2hvbGQgPSA0MDtcblx0XHRcdHZhciBtYXggPSBhbGxQb2ludHMucmVkdWNlKGZ1bmN0aW9uKG0sIHApe1xuXHRcdFx0XHRyZXR1cm4gcC5kaWZmID4gbSAmJiBwLmRpZmYgPCBjdXNwVHJlc2hvbGQgPyBwLmRpZmYgOiBtO1xuXHRcdFx0fSwgMCk7XG5cdFx0XHRjb25zb2xlLmxvZyhtYXgpO1xuXG5cdFx0XHR2YXIgcHJldiA9IFswLDAsMCwwXTtcblx0XHRcdGFsbFBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0XHR2YXIgciA9IE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0XHR2YXIgZyA9IDI1NSAtIE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0XHR2YXIgcmdiID0gJ3JnYignK3IrJywnK2crJywwKSc7XG5cdFx0XHRcdGlmKHI+MTAwKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJz09PT09PT09PT0nKTtcblx0XHRcdFx0XHRwcmV2LmZvckVhY2goZnVuY3Rpb24ocCl7Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhKTt9KTtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEsIHJnYik7XG5cdFx0XHRcdH1cblx0XHRcdFx0cC55ICs9IDE1MDtcblx0XHRcdFx0c2hvd1BvaW50KHAsIHJnYiwgMC41KTtcblx0XHRcdFx0cHJldlszXSA9IHByZXZbMl07XG5cdFx0XHRcdHByZXZbMl0gPSBwcmV2WzFdO1xuXHRcdFx0XHRwcmV2WzFdID0gcHJldlswXTtcblx0XHRcdFx0cHJldlswXSA9IHA7XG5cdFx0XHR9KTtcblx0XHRcdC8qKi9cblxuXHRcdFx0Ly9maW5kcyBncm91cHMgb2YgcG9pbnRzIGRlcGVuZGluZyBvbiB0cmVzaG9sZCwgYW5kIGZpbmQgdGhlIG1pZGRsZSBvZiBlYWNoIGdyb3VwXG5cdFx0XHRyZXR1cm4gcG9pbnRQb3MucmVkdWNlKGZ1bmN0aW9uKHBvaW50cywgcG9pbnQpe1xuXG5cdFx0XHRcdHZhciBsYXN0ID0gcG9pbnRzW3BvaW50cy5sZW5ndGgtMV07XG5cdFx0XHRcdGlmKCFsYXN0IHx8IHBvaW50IC0gbGFzdFtsYXN0Lmxlbmd0aC0xXSA+IGRpc3RhbmNlVHJlc2hvbGQpe1xuXHRcdFx0XHRcdGxhc3QgPSBbcG9pbnRdO1xuXHRcdFx0XHRcdHBvaW50cy5wdXNoKGxhc3QpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGxhc3QucHVzaChwb2ludCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcG9pbnRzO1xuXHRcdFx0fSwgW10pLm1hcChmdW5jdGlvbihwb2ludHMpe1xuXHRcdFx0XHRyZXR1cm4gcG9pbnRzW01hdGguZmxvb3IocG9pbnRzLmxlbmd0aC8yKV07XG5cdFx0XHR9KTtcblx0XHR9KSgpO1xuXG5cdFx0Y29uc29sZS5sb2coYnJlYWtQb2ludHMpO1xuXHRcdGJyZWFrUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwKTtcblx0XHRcdHNob3dQb2ludChwT2JqLCAnIzAwZmYwMCcsIDMpO1xuXHRcdH0pOy8qKi9cblx0XHRcblx0XHRyZXR1cm4gYnJlYWtQb2ludHM7XG5cblx0fTtcblxuXHRyZXR1cm4gZnVuY3Rpb24ocywgZ3JvdXBzLCBwcmludE5vZGUsIGRpbSl7XG5cdFx0c3RhZ2UgPSBzO1xuXHRcdHZhciBwYWQgPSAyMDtcblx0XHR2YXIgYXZhaWxXID0gZGltWzBdIC0gcGFkO1xuXG5cdFx0dmFyIGdyb3VwTWF4SGVpZ2h0ID0gT2JqZWN0LmtleXMoZ3JvdXBzKS5yZWR1Y2UoZnVuY3Rpb24obWluLCBncm91cE5hbWUpe1xuXHRcdFx0dmFyIHQgPSBncm91cHNbZ3JvdXBOYW1lXS5nZXRIZWlnaHQoKTtcblx0XHRcdGlmKG1pbiA9PT0gdW5kZWZpbmVkIHx8IG1pbiA+IHQpIHtcblx0XHRcdFx0bWluID0gdDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBtaW47XG5cdFx0fSwgdW5kZWZpbmVkKTtcblx0XHRcblx0XHR2YXIgdG9wTGVmdCA9IHt4OnBhZCwgeTpwYWR9O1xuXHRcdHZhciBlYXNlUG9pbnRzID0gT2JqZWN0LmtleXMoZ3JvdXBzKS5yZWR1Y2UoZnVuY3Rpb24oYWxsLCBuYW1lKXtcblx0XHRcdHZhciBncm91cCA9IGdyb3Vwc1tuYW1lXTtcblxuXHRcdFx0dmFyIGVuZExlZnQgPSB0b3BMZWZ0LnggKyBncm91cC5nZXRXaWR0aCgpICsgcGFkO1xuXHRcdFx0Y29uc29sZS5sb2coZ3JvdXAuZ2V0V2lkdGgoKSwgZ3JvdXBNYXhIZWlnaHQpO1xuXG5cdFx0XHRpZihlbmRMZWZ0ID4gYXZhaWxXKSB7XG5cdFx0XHRcdHRvcExlZnQueCA9IHBhZDtcblx0XHRcdFx0dG9wTGVmdC55ICs9IHBhZCArIGdyb3VwTWF4SGVpZ2h0O1xuXHRcdFx0XHRlbmRMZWZ0ID0gdG9wTGVmdC54ICsgZ3JvdXAuZ2V0V2lkdGgoKSArIHBhZDtcblx0XHRcdH1cblxuXG5cdFx0XHR2YXIgdGhpc0Vhc2UgPSBncm91cC5wYXRocy5tYXAoZnVuY3Rpb24ocCl7XG5cdFx0XHRcdHAgPSBwLnRyYW5zbGF0ZSh0b3BMZWZ0LngsIHRvcExlZnQueSk7XG5cdFx0XHRcdHJldHVybiBmaW5kRGVmYXVsdHMocCk7XG5cdFx0XHR9KTtcblx0XHRcdGFsbFtuYW1lXSA9IHRoaXNFYXNlO1xuXG5cblx0XHRcdHRvcExlZnQueCA9IGVuZExlZnQ7XHRcdFx0XG5cblxuXHRcdFx0cmV0dXJuIGFsbDtcblx0XHR9LCB7fSk7XG5cdFx0Y29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cblx0XHRwcmludE5vZGUudGV4dChKU09OLnN0cmluZ2lmeShlYXNlUG9pbnRzKSk7XG5cdH07XG5cblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdyb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9zZS5kcmF3aW5nLkFscGhhYmV0KTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoQWxwaGFiZXQpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0XG5cdHZhciBWZWN0b3JXb3JkID0ge1xuXHRcdGdldFBhdGhzIDogZnVuY3Rpb24obmFtZSwgcmlnaHQsIHRvcCwgc2NhbGUpIHtcblx0XHRcdHJpZ2h0ID0gcmlnaHQgfHwgMDtcblx0XHRcdHRvcCA9IHRvcCB8fCAwO1xuXG5cdFx0XHR2YXIgY29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0dmFyIGxpbmVzID0gW107XG5cblx0XHRcdC8vbG9vcCBmb3IgZXZlcnkgY2hhcmFjdGVyIGluIG5hbWUgKHN0cmluZylcblx0XHRcdGZvcih2YXIgaT0wOyBpPG5hbWUubGVuZ3RoOyBpKyspwqB7XG5cdFx0XHRcdHZhciBsZXR0ZXIgPSBuYW1lW2ldO1xuXHRcdFx0XHRpZihsZXR0ZXIgPT09ICcgJykge1xuXHRcdFx0XHRcdHJpZ2h0ICs9IEFscGhhYmV0LmdldE5TcGFjZSgpICogc2NhbGU7XG5cdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBsZXR0ZXJEZWYgPSBBbHBoYWJldC5nZXRMZXR0ZXIobGV0dGVyKS5zY2FsZShzY2FsZSk7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyRGVmKTtcblx0XHRcdFx0XG5cdFx0XHRcdHZhciBsZXR0ZXJKb2luZWRFbmQgPSBmYWxzZTtcblx0XHRcdFx0bGV0dGVyRGVmLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0XHRcdHZhciBkZWYgPSBwYXRoLnRyYW5zbGF0ZShyaWdodCwgdG9wKTtcblx0XHRcdFx0XHR2YXIgam9pbmVkU3RhcnQgPSBkZWYubmFtZSAmJiBkZWYubmFtZS5pbmRleE9mKCdqb2luYScpID4gLTE7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZEVuZCA9IC9qb2luKGE/KWIvLnRlc3QoZGVmLm5hbWUpO1xuXHRcdFx0XHRcdC8vY29uc29sZS5sb2cobGV0dGVyLCBqb2luZWRTdGFydCwgam9pbmVkRW5kKTtcblx0XHRcdFx0XHRsZXR0ZXJKb2luZWRFbmQgPSBsZXR0ZXJKb2luZWRFbmQgfHwgam9pbmVkRW5kO1xuXHRcdFx0XHRcdGlmKGpvaW5lZFN0YXJ0ICYmIGNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vYXBwZW5kIGF1IGNvbnRpbnVvdXNcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYXBwZW5kKGRlZiwgbGV0dGVyKTtcblxuXHRcdFx0XHRcdFx0Ly9ham91dGUgbGVzIGVhc2Vwb2ludHMgZGUgY2UgcGF0aFxuXHRcdFx0XHRcdFx0dmFyIHBhdGhTdGFydFBvcyA9IGNvbnRpbnVvdXMuZ2V0TGVuZ3RoKCkgLSBkZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHRkZWYuZ2V0RWFzZXBvaW50cygpLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0XHRcdFx0Y29udGludW91cy5hZGRFYXNlcG9pbnQocGF0aFN0YXJ0UG9zICsgcG9zKTtcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0fSBlbHNlIGlmKGpvaW5lZEVuZCAmJiAhY29udGludW91cykge1xuXHRcdFx0XHRcdFx0Ly9zdGFydCB1biBub3V2ZWF1IGxpbmVcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBkZWY7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzLm5hbWUgPSBsZXR0ZXI7XG5cdFx0XHRcdFx0XHRsaW5lcy5wdXNoKGNvbnRpbnVvdXMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRsaW5lcy5wdXNoKGRlZik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoIWxldHRlckpvaW5lZEVuZCkge1xuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdHJpZ2h0ICs9IGxldHRlckRlZi5nZXRXaWR0aCgpO1xuXHRcdFx0XHQvL2NvbnNvbGUudGFibGUoW3tsZXR0ZXI6bmFtZVtpXSwgbGV0dGVyV2lkdGg6IGxldHRlci5nZXRXaWR0aCgpLCB0b3RhbDpyaWdodH1dKTtcdFxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbGluZXM7XG5cblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIFZlY3RvcldvcmQ7XG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGgnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByZWcgPSAvKFthLXpdKShbMC05XFxzXFwsXFwuXFwtXSspL2dpO1xuXHRcdFxuXHQvL2V4cGVjdGVkIGxlbmd0aCBvZiBlYWNoIHR5cGVcblx0dmFyIGV4cGVjdGVkTGVuZ3RocyA9IHtcblx0XHRtIDogMixcblx0XHRsIDogMixcblx0XHR2IDogMSxcblx0XHRoIDogMSxcblx0XHRjIDogNixcblx0XHRzIDogNFxuXHR9O1xuXG5cdHZhciBQYXRoID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdC8vaWYoc3ZnKSBjb25zb2xlLmxvZyhzdmcsIHBhcnNlZCk7XG5cdFx0dGhpcy5lYXNlUG9pbnRzID0gZWFzZVBvaW50cyB8fCBbXTtcblx0XHQvL2NvbnNvbGUubG9nKG5hbWUsIGVhc2VQb2ludHMpO1xuXHRcdHRoaXMuX3NldFBhcnNlZChwYXJzZWQgfHwgdGhpcy5fcGFyc2Uoc3ZnKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuX3NldFBhcnNlZCA9IGZ1bmN0aW9uKHBhcnNlZCkge1xuXHRcdC8vY29uc29sZS5sb2cocGFyc2VkKTtcblx0XHR0aGlzLnBhcnNlZCA9IHBhcnNlZDtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRDdWJpYyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmN1YmljIHx8IHRoaXMuX3BhcnNlQ3ViaWMoKTtcblx0fTtcblxuXG5cdFBhdGgucHJvdG90eXBlLmdldExlbmd0aCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLmdldFRvdGFsTGVuZ3RoKHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIGFuIFNWRyBzdHJpbmcgb2YgdGhlIHBhdGggc2VnZW1udHMuIEl0IGlzIG5vdCB0aGUgc3ZnIHByb3BlcnR5IG9mIHRoZSBwYXRoLCBhcyBpdCBpcyBwb3RlbnRpYWxseSB0cmFuc2Zvcm1lZFxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRTVkdTdHJpbmcgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKHN2Zywgc2VnbWVudCl7XG5cdFx0XHRyZXR1cm4gc3ZnICsgc2VnbWVudC50eXBlICsgc2VnbWVudC5hbmNob3JzLmpvaW4oJywnKTsgXG5cdFx0fSwgJycpO1xuXHR9O1xuXG5cdC8qKlxuXHRHZXRzIHRoZSBwb3NpdGlvbnMgYXQgd2hpY2ggd2UgaGF2ZSBlYXNlIHBvaW50cyAod2hpY2ggYXJlIHByZXBhcnNlZCBhbmQgY29uc2lkZXJlZCBwYXJ0IG9mIHRoZSBwYXRoJ3MgZGVmaW5pdGlvbnMpXG5cdCovXG5cdFBhdGgucHJvdG90eXBlLmdldEVhc2Vwb2ludHMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5lYXNlUG9pbnRzO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldFBvaW50ID0gZnVuY3Rpb24oaWR4KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzLnBhcnNlZCk7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkW2lkeF0gJiYgdGhpcy5wYXJzZWRbaWR4XS5hbmNob3JzO1xuXHR9O1xuXG5cdC8qKlxuXHRQYXJzZXMgYW4gU1ZHIHBhdGggc3RyaW5nIHRvIGEgbGlzdCBvZiBzZWdtZW50IGRlZmluaXRpb25zIHdpdGggQUJTT0xVVEUgcG9zaXRpb25zIHVzaW5nIFJhcGhhZWwucGF0aDJjdXJ2ZVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5fcGFyc2UgPSBmdW5jdGlvbihzdmcpIHtcblx0XHR2YXIgY3VydmUgPSBSYXBoYWVsLnBhdGgyY3VydmUoc3ZnKTtcblx0XHR2YXIgcGF0aCA9IGN1cnZlLm1hcChmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlIDogcG9pbnQuc2hpZnQoKSxcblx0XHRcdFx0YW5jaG9ycyA6IHBvaW50XG5cdFx0XHR9O1xuXHRcdH0pO1xuXHRcdHJldHVybiBwYXRoO1xuXHR9O1xuXG5cdC8qKlxuXHRcdFBhcnNlcyBhIHBhdGggZGVmaW5lZCBieSBwYXJzZVBhdGggdG8gYSBsaXN0IG9mIGJlemllciBwb2ludHMgdG8gYmUgdXNlZCBieSBHcmVlbnNvY2sgQmV6aWVyIHBsdWdpbiwgZm9yIGV4YW1wbGVcblx0XHRUd2Vlbk1heC50byhzcHJpdGUsIDUwMCwge1xuXHRcdFx0YmV6aWVyOnt0eXBlOlwiY3ViaWNcIiwgdmFsdWVzOmN1YmljfSxcblx0XHRcdGVhc2U6UXVhZC5lYXNlSW5PdXQsXG5cdFx0XHR1c2VGcmFtZXMgOiB0cnVlXG5cdFx0fSk7XG5cdFx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlQ3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhdGgpO1xuXHRcdC8vYXNzdW1lZCBmaXJzdCBlbGVtZW50IGlzIGEgbW92ZXRvXG5cdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmN1YmljID0gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKGFuY2hvcnMsIHNlZ21lbnQpe1xuXHRcdFx0dmFyIGEgPSBzZWdtZW50LmFuY2hvcnM7XG5cdFx0XHRpZihzZWdtZW50LnR5cGU9PT0nTScpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6YVsxXX0pO1xuXHRcdFx0fSBlbHNlIGlmKHNlZ21lbnQudHlwZT09PSdMJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzJdLCB5OiBhWzNdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVs0XSwgeTogYVs1XX0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0XHR9LCBbXSk7XG5cblx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHR9O1xuXG5cdC8vdHJvdXZlIGxlIGJvdW5kaW5nIGJveCBkJ3VuZSBsZXR0cmUgKGVuIHNlIGZpYW50IGp1c3RlIHN1ciBsZXMgcG9pbnRzLi4uIG9uIG5lIGNhbGN1bGUgcGFzIG91IHBhc3NlIGxlIHBhdGgpXG5cdFBhdGgucHJvdG90eXBlLmdldEJvdW5kaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJhcGhhZWwucGF0aEJCb3godGhpcy5nZXRTVkdTdHJpbmcoKSk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0udHJhbnNsYXRlKHgsIHkpO1xuXHRcdHZhciBzdmcgPSBSYXBoYWVsLm1hcFBhdGgodGhpcy5nZXRTVkdTdHJpbmcoKSwgbSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShzdmcsIHRoaXMubmFtZSwgbnVsbCwgdGhpcy5lYXNlUG9pbnRzKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgcGF0aCwgc2NhbGVkXG5cdFBhdGgucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24ocmF0aW8pIHtcblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS5zY2FsZShyYXRpbyk7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHR2YXIgZWFzZVBvaW50cyA9IHRoaXMuZWFzZVBvaW50cy5tYXAoZnVuY3Rpb24oZXApe1xuXHRcdFx0cmV0dXJuIGVwICogcmF0aW87XG5cdFx0fSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShzdmcsIHRoaXMubmFtZSwgbnVsbCwgZWFzZVBvaW50cyk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24ocGFydCwgbmFtZSnCoHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnQpO1xuXHRcdGlmKG5hbWUpIHRoaXMubmFtZSArPSBuYW1lO1xuXHRcdHRoaXMuX3NldFBhcnNlZCh0aGlzLnBhcnNlZC5jb25jYXQocGFydC5wYXJzZWQuc2xpY2UoMSkpKTtcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5hZGRFYXNlcG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdHRoaXMuZWFzZVBvaW50cy5wdXNoKHBvcyk7XG5cdH07XG5cblx0UGF0aC5mYWN0b3J5ID0gZnVuY3Rpb24oc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpIHtcblx0XHRyZXR1cm4gbmV3IFBhdGgoc3ZnLCBuYW1lLCBwYXJzZWQsIGVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoO1xuXG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4gKiBtb2R1bGUgcGF0dGVybiA6IGh0dHBzOi8vZ2l0aHViLmNvbS91bWRqcy91bWQvYmxvYi9tYXN0ZXIvYW1kV2ViR2xvYmFsLmpzXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBQYXRoR3JvdXAgPSBmdW5jdGlvbihuYW1lKXtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMuYm91bmRpbmcgPSB0aGlzLnBhdGhzLnJlZHVjZShmdW5jdGlvbihib3VuZGluZywgcGF0aCl7XG5cdFx0XHR2YXIgcGF0aEJvdW5kaW5nID0gcGF0aC5nZXRCb3VuZGluZygpO1xuXG5cdFx0XHRib3VuZGluZyA9IGJvdW5kaW5nIHx8IHBhdGhCb3VuZGluZztcblx0XHRcdGJvdW5kaW5nLnggPSBib3VuZGluZy54IDwgcGF0aEJvdW5kaW5nLnggPyBib3VuZGluZy54IDogIHBhdGhCb3VuZGluZy54O1xuXHRcdFx0Ym91bmRpbmcueSA9IGJvdW5kaW5nLnkgPCBwYXRoQm91bmRpbmcueSA/IGJvdW5kaW5nLnkgOiAgcGF0aEJvdW5kaW5nLnk7XG5cdFx0XHRib3VuZGluZy54MiA9IGJvdW5kaW5nLngyID4gcGF0aEJvdW5kaW5nLngyID8gYm91bmRpbmcueDIgOiBwYXRoQm91bmRpbmcueDI7XG5cdFx0XHRib3VuZGluZy55MiA9IGJvdW5kaW5nLnkyID4gcGF0aEJvdW5kaW5nLnkyID8gYm91bmRpbmcueTIgOiBwYXRoQm91bmRpbmcueTI7XG5cdFx0XHRib3VuZGluZy53aWR0aCA9IGJvdW5kaW5nLngyIC0gYm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLmhlaWdodCA9IGJvdW5kaW5nLnkyIC0gYm91bmRpbmcueTtcblx0XHRcdHJldHVybiBib3VuZGluZztcblx0XHR9LCB1bmRlZmluZWQpIHx8IHt9O1xuXHRcdC8vaWYgdGhlcmUncyBhIGVuZFBvaW50IHBvaW50IHRoYXQgaXMgc2V0LCB1c2UgaXRzIGNvb3JkaW5hdGVzIGFzIGJvdW5kaW5nXG5cdFx0aWYodGhpcy5lbmRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmVuZFBvaW50LmdldFBvaW50KDApO1xuXHRcdFx0dGhpcy5ib3VuZGluZy54MiA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdFx0aWYodGhpcy5zdGFydFBvaW50KSB7XG5cdFx0XHR2YXIgYW5jaG9ycyA9IHRoaXMuc3RhcnRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueCA9IGFuY2hvcnNbMF07XG5cdFx0XHR0aGlzLmJvdW5kaW5nLndpZHRoID0gdGhpcy5ib3VuZGluZy54MiAtIHRoaXMuYm91bmRpbmcueDtcblx0XHR9XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5hZGRQYXRoID0gZnVuY3Rpb24ocCl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMgfHwgW107XG5cdFx0aWYocC5uYW1lICYmIHAubmFtZS5pbmRleE9mKCdlbmQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5lbmRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignc3RhcnQnKSA9PT0gMCkge1xuXHRcdFx0dGhpcy5zdGFydFBvaW50ID0gcDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5wYXRocy5wdXNoKHApO1xuXHRcdH1cblx0XHR0aGlzLnNldEJvdW5kaW5nKCk7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLmhlaWdodDtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFdpZHRoID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy53aWR0aDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRCb3R0b24gPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnkyO1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFRvcCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueTtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRMZWZ0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54O1xuXHR9O1xuXHRQYXRoR3JvdXAucHJvdG90eXBlLmdldFJpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy54Mjtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNldE9mZnNldCA9IGZ1bmN0aW9uKHgsIHkpe1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzLm1hcChmdW5jdGlvbihwYXRoKSB7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cGF0aCA9IHBhdGgudHJhbnNsYXRlKHgsIHkpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHJldHVybiBwYXRoO1xuXHRcdH0pO1xuXHRcdHRoaXMuZW5kUG9pbnQgPSAodGhpcy5lbmRQb2ludCAmJiB0aGlzLmVuZFBvaW50LnRyYW5zbGF0ZSh4LCB5KSk7XG5cdFx0dGhpcy5zdGFydFBvaW50ID0gKHRoaXMuc3RhcnRQb2ludCAmJiB0aGlzLnN0YXJ0UG9pbnQudHJhbnNsYXRlKHgsIHkpKTtcblx0XHR0aGlzLnNldEJvdW5kaW5nKCk7XG5cdH07XG5cblx0Ly9yZXR1cm5zIGEgbmV3IFBhdGhHcm91cCwgc2NhbGVkXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2NhbGUgPSBmdW5jdGlvbihzY2FsZSl7XG5cdFx0aWYoIXRoaXMucGF0aHMpIHJldHVybiB0aGlzO1xuXHRcdHZhciBzY2FsZWQgPSBuZXcgUGF0aEdyb3VwKHRoaXMubmFtZSk7XG5cdFx0dGhpcy5wYXRocy5mb3JFYWNoKGZ1bmN0aW9uKHBhdGgpe1xuXHRcdFx0c2NhbGVkLmFkZFBhdGgocGF0aC5zY2FsZShzY2FsZSkpO1xuXHRcdH0pO1xuXG5cdFx0c2NhbGVkLmVuZFBvaW50ID0gKHRoaXMuZW5kUG9pbnQgJiYgdGhpcy5lbmRQb2ludC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zdGFydFBvaW50ID0gKHRoaXMuc3RhcnRQb2ludCAmJiB0aGlzLnN0YXJ0UG9pbnQuc2NhbGUoc2NhbGUpKTtcblx0XHRzY2FsZWQuc2V0Qm91bmRpbmcoKTtcblx0XHRyZXR1cm4gc2NhbGVkO1xuXHR9O1xuXG5cdHJldHVybiBQYXRoR3JvdXA7XG5cbn0pKTtcblxuXG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL01hdGhVdGlscycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXG5cdHZhciBkZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5cdHZhciByYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cblx0cmV0dXJuIHtcblxuXHRcdHRvUmFkaWFucyA6IGZ1bmN0aW9uKGRlZ3JlZXMpIHtcblx0XHQgIHJldHVybiBkZWdyZWVzICogZGVnVG9SYWQ7XG5cdFx0fSxcblx0XHQgXG5cdFx0Ly8gQ29udmVydHMgZnJvbSByYWRpYW5zIHRvIGRlZ3JlZXMuXG5cdFx0dG9EZWdyZWVzIDogZnVuY3Rpb24ocmFkaWFucykge1xuXHRcdCAgcmV0dXJuIHJhZGlhbnMgKiByYWRUb0RlZztcblx0XHR9XG5cdH07XG5cbn0pKTsiXX0=
