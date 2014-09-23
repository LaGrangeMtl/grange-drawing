(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var DrawPath = require('app/rose/drawing/DrawPath.js');
	var VectorWord = require('app/rose/drawing/VectorWord.js');
	var Alphabet = require('app/rose/drawing/Alphabet.js');
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
	var EASEPOINTS = {"Ö":[[5],[5]],"Ô":[null,[16]],"Ï":[[136],[5],[5]],"Î":[[93],[16]],"Ë":[[159],[5],[5]],"Ê":[[159],[17]],"È":[[159]],"É":[[159]],"Ç":[null,[13]],"Ä":[[189],null,[5],[5]],"Â":[[189],null,[15]],"À":[[189]],"Z":[[193,340]],"Y":[[329]],"W":[[227,336]],"V":[[231]],"U":[[317]],"R":[[289]],"N":[[247,350]],"M":[[238,338,452]],"K":[[115],[122]],"J":[[132]],"I":[[93]],"H":[[142]],"G":[[321]],"E":[[159]],"B":[[453]],"A":[[189]],"ô":[[155],[16]],"ö":[[155],[5],[5]],"ï":[[42],[5],[5]],"î":[[42],[16]],"ë":[null,[5],[5]],"ê":[null,[17]],"ç":[[72],[13]],"ä":[[55,133],[5],[5]],"â":[[55,133],[15]],"à":[[55,133]],"z":[[110]],"y":[[42,116,227]],"x":[[42]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[24]],"k":[[131,244,327]],"j":[[52],[18]],"i":[[42],[18]],"h":[[133,248,293]],"g":[[60,145]],"f":[[419]],"d":[[236]],"c":[[72]],"b":[[291]],"a":[[55,133]],"O":[[300]],"L":[[220]],"F":[[220]],"D":[[370]]};

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
	    ns[name] = module.exports = factory(require('jquery'), require('lodash'), require('raphael'), require('rose/drawing/MathUtils.js'));
  	} else {
		ns[name] = factory(root.jQuery, root._, root.Raphael, ns.MathUtils);
	}
}(this, function ($, _, Raphael, MathUtils) {
	"use strict";


	var distanceTreshold = 40;
	var angleTreshold = MathUtils.toRadians(12);

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



},{"jquery":"jquery","lodash":"lodash","raphael":"raphael","rose/drawing/MathUtils.js":9}],5:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvTWFpbi5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2FwcC9yb3NlL2RyYXdpbmcvRHJhd1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvYXBwL3Jvc2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cy5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9hcHAvcm9zZS9kcmF3aW5nL1ZlY3RvcldvcmQuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9ub2RlX21vZHVsZXMvbGFncmFuZ2UvZHJhd2luZy9QYXRoLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvbm9kZV9tb2R1bGVzL3Jvc2UvZHJhd2luZy9NYXRoVXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIlx0XG5cdHZhciAkID0gcmVxdWlyZSgnanF1ZXJ5Jyk7XG5cdHZhciBSYXBoYWVsID0gcmVxdWlyZSgncmFwaGFlbCcpO1xuXHR2YXIgRHJhd1BhdGggPSByZXF1aXJlKCdhcHAvcm9zZS9kcmF3aW5nL0RyYXdQYXRoLmpzJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnYXBwL3Jvc2UvZHJhd2luZy9WZWN0b3JXb3JkLmpzJyk7XG5cdHZhciBBbHBoYWJldCA9IHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvQWxwaGFiZXQuanMnKTtcblx0dmFyIFR3ZWVuTWF4ID0gcmVxdWlyZSgnZ3NhcCcpO1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBXID0gMTIwMDtcblx0dmFyIEggPSAxNjAwO1xuXG5cdHZhciBzY2FsZUZhY3RvciA9IDE7XG5cblx0dmFyIG5hbWVzID0gW1wiSmVzc2ljYSBXYW5uaW5nXCIsXCJKdWxpYSBSb2Nrd2VsbFwiLFwiQ2Fyb2wgSHViYmFyZFwiLFwiUm9uYWxkIENhbmR5XCIsXCJKb2huIE5ld3RvblwiLFwiRWx2aXMgTmljb2xlXCIsXCJHbG9yaWEgV2VhdmVyXCIsXCJKdWxpYSBDcm9ua2l0ZVwiLFwiTW90aGVyIFJvZ2Vyc1wiLFwiQ2hldnkgSXJ3aW5cIixcIkVkZGllIEFsbGVuXCIsXCJOb3JtYW4gSmFja3NvblwiLFwiUGV0ZXIgUm9nZXJzXCIsXCJXZWlyZCBDaGFzZVwiLFwiQ29saW4gTWF5c1wiLFwiTmFwb2xlb24gTWFydGluXCIsXCJFZGdhciBTaW1wc29uXCIsXCJNb2hhbW1hZCBNY0NhcnRuZXlcIixcIkxpYmVyYWNlIFdpbGxpYW1zXCIsXCJGaWVsZHMgQnVybmV0dFwiLFwiU3RldmUgQXNoZVwiLFwiQ2FycmllIENoYXJsZXNcIixcIlRvbW15IFBhc3RldXJcIixcIkVkZGllIFNpbHZlcnN0b25lXCIsXCJPcHJhaCBBc2hlXCIsXCJSYXkgQmFsbFwiLFwiSmltIERpYW5hXCIsXCJNaWNoZWxhbmdlbG8gRWFzdHdvb2RcIixcIkdlb3JnZSBTaW1wc29uXCIsXCJBbGljaWEgQXVzdGVuXCIsXCJKZXNzaWNhIE5pY29sZVwiLFwiTWFyaWx5biBFdmVyZXR0XCIsXCJLZWl0aCBFYXN0d29vZFwiLFwiUGFibG8gRWFzdHdvb2RcIixcIlBleXRvbiBMdXRoZXJcIixcIk1vemFydCBBcm1zdHJvbmdcIixcIk1pY2hhZWwgQnVybmV0dFwiLFwiS2VpdGggR2xvdmVyXCIsXCJFbGl6YWJldGggQ2hpbGRcIixcIk1pbGVzIEFzdGFpcmVcIixcIkFuZHkgRWRpc29uXCIsXCJNYXJ0aW4gTGVubm9uXCIsXCJUb20gUGljY2Fzb1wiLFwiQmV5b25jZSBEaXNuZXlcIixcIlBldGVyIENsaW50b25cIixcIkhlbnJ5IEtlbm5lZHlcIixcIlBhdWwgQ2hpbGRcIixcIkxld2lzIFNhZ2FuXCIsXCJNaWNoZWxhbmdlbG8gTGVlXCIsXCJNYXJpbHluIEZpc2hlclwiXTtcblx0ZnVuY3Rpb24gU2h1ZmZsZShvKSB7XG5cdFx0Zm9yKHZhciBqLCB4LCBpID0gby5sZW5ndGg7IGk7IGogPSBwYXJzZUludChNYXRoLnJhbmRvbSgpICogaSksIHggPSBvWy0taV0sIG9baV0gPSBvW2pdLCBvW2pdID0geCk7XG5cdFx0cmV0dXJuIG87XG5cdH07XG5cdFNodWZmbGUobmFtZXMpO1xuXHRuYW1lcy5sZW5ndGggPSAxOy8qKi9cblxuXHQvL25hbWVzID0gWydha3N0dGVmJ107XG5cblxuXHR2YXIgZ2V0U3RhZ2UgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgc3RhZ2U7XG5cdFx0dmFyIGluaXQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIFJhcGhhZWwoXCJzdmdcIiwgVywgSCk7XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzdGFnZSA9IHN0YWdlIHx8IGluaXQoKTtcblx0XHR9XG5cdH0pKCk7XG5cblx0dmFyIGRvRHJhdyA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGluY3IgPSBIIC8gbmFtZXMubGVuZ3RoO1xuXHRcdG5hbWVzLmZvckVhY2goZnVuY3Rpb24obmFtZSwgayl7XG5cdFx0XHQvL3RyYWNlTmFtZShuYW1lLCAwLCBrICogaW5jcik7XG5cblx0XHRcdHZhciBwYXRocyA9IFZlY3RvcldvcmQuZ2V0UGF0aHMobmFtZSwgMCwgayAqIGluY3IsIHNjYWxlRmFjdG9yKTtcblx0XHRcdHZhciBzdGFydCA9IG5ldyBEYXRlKCk7XG5cdFx0XHREcmF3UGF0aC5ncm91cChwYXRocywgZ2V0U3RhZ2UoKSwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IDIwMCxcblx0XHRcdFx0Y29sb3IgOiAnIzQ0NDQ0NCcsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogMixcblx0XHRcdFx0ZWFzaW5nIDogZ3NhcC5TaW5lLmVhc2VJbk91dFxuXHRcdFx0fSk7XG5cblx0XHRcdHZhciBlbmQgPSBuZXcgRGF0ZSgpO1xuXHRcdFx0Y29uc29sZS5sb2coZW5kLXN0YXJ0KTtcblxuXHRcdH0pO1xuXG5cdH07XG5cblx0dmFyIGxvYWRpbmcgPSBBbHBoYWJldC5pbml0KCk7XHRcblx0dmFyIGJ0biA9ICQoJyNjdHJsJyk7XG5cblx0YnRuLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKGRvRHJhdyk7XG5cdH0pO1xuXG5cblx0Ly9wYXJzZSBsZXMgYnJlYWtwb2ludHMgZGUgY2hhcXVlIGxldHRyZSwgb3V0cHV0IGVuIEpTT04gKMOgIHNhdmVyKVxuXHR2YXIgcHJpbnRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKXtcblx0XHRBbHBoYWJldC5wYXJzZUVhc2Vwb2ludHMoZ2V0U3RhZ2UoKSwgJCgnI2JycCcpLCBbVywgSF0pO1xuXHR9O1xuXG5cdHZhciBnZXRCcHIgPSAkKCcjZ2V0YnJwJyk7XG5cblx0Z2V0QnByLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKHByaW50RWFzZXBvaW50cyk7XG5cdH0pO1xuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0FscGhhYmV0Jy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnbGFncmFuZ2UvZHJhd2luZy9QYXRoLmpzJyksIHJlcXVpcmUoJ2xhZ3JhbmdlL2RyYXdpbmcvUGF0aEdyb3VwLmpzJyksIHJlcXVpcmUoJ2FwcC9yb3NlL2RyYXdpbmcvUGF0aEVhc2Vwb2ludHMuanMnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5qUXVlcnksIHJvb3QubGFncmFuZ2UuZHJhd2luZy5QYXRoLCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aEdyb3VwLCByb290LmxhZ3JhbmdlLmRyYXdpbmcuUGF0aEVhc2Vwb2ludHMpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoLCBQYXRoR3JvdXAsIFBhdGhFYXNlcG9pbnRzKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBTQ0FMRSA9IDE7XG5cdHZhciBzdmdGaWxlID0gJ2Fzc2V0cy9hbHBoYWJldC5zdmcnO1xuXG5cdC8vUEFSU8OJIGF2ZWMgbGUgaGVscGVyIGF1IGJhc1xuXHR2YXIgRUFTRVBPSU5UUyA9IHtcIsOWXCI6W1s1XSxbNV1dLFwiw5RcIjpbbnVsbCxbMTZdXSxcIsOPXCI6W1sxMzZdLFs1XSxbNV1dLFwiw45cIjpbWzkzXSxbMTZdXSxcIsOLXCI6W1sxNTldLFs1XSxbNV1dLFwiw4pcIjpbWzE1OV0sWzE3XV0sXCLDiFwiOltbMTU5XV0sXCLDiVwiOltbMTU5XV0sXCLDh1wiOltudWxsLFsxM11dLFwiw4RcIjpbWzE4OV0sbnVsbCxbNV0sWzVdXSxcIsOCXCI6W1sxODldLG51bGwsWzE1XV0sXCLDgFwiOltbMTg5XV0sXCJaXCI6W1sxOTMsMzQwXV0sXCJZXCI6W1szMjldXSxcIldcIjpbWzIyNywzMzZdXSxcIlZcIjpbWzIzMV1dLFwiVVwiOltbMzE3XV0sXCJSXCI6W1syODldXSxcIk5cIjpbWzI0NywzNTBdXSxcIk1cIjpbWzIzOCwzMzgsNDUyXV0sXCJLXCI6W1sxMTVdLFsxMjJdXSxcIkpcIjpbWzEzMl1dLFwiSVwiOltbOTNdXSxcIkhcIjpbWzE0Ml1dLFwiR1wiOltbMzIxXV0sXCJFXCI6W1sxNTldXSxcIkJcIjpbWzQ1M11dLFwiQVwiOltbMTg5XV0sXCLDtFwiOltbMTU1XSxbMTZdXSxcIsO2XCI6W1sxNTVdLFs1XSxbNV1dLFwiw69cIjpbWzQyXSxbNV0sWzVdXSxcIsOuXCI6W1s0Ml0sWzE2XV0sXCLDq1wiOltudWxsLFs1XSxbNV1dLFwiw6pcIjpbbnVsbCxbMTddXSxcIsOnXCI6W1s3Ml0sWzEzXV0sXCLDpFwiOltbNTUsMTMzXSxbNV0sWzVdXSxcIsOiXCI6W1s1NSwxMzNdLFsxNV1dLFwiw6BcIjpbWzU1LDEzM11dLFwielwiOltbMTEwXV0sXCJ5XCI6W1s0MiwxMTYsMjI3XV0sXCJ4XCI6W1s0Ml1dLFwid1wiOltbMzgsMTA3LDE3N11dLFwidlwiOltbNjZdXSxcInVcIjpbWzMzLDEwNV1dLFwidFwiOltbMTAzXV0sXCJzXCI6W1s1MCwxMTBdXSxcInJcIjpbWzY0XV0sXCJxXCI6W1sxNDQsMzI1XV0sXCJwXCI6W1s1NiwzMDVdXSxcIm9cIjpbWzE1NV1dLFwiblwiOltbMTA0XV0sXCJtXCI6W1sxMTBdXSxcImxcIjpbWzI0XV0sXCJrXCI6W1sxMzEsMjQ0LDMyN11dLFwialwiOltbNTJdLFsxOF1dLFwiaVwiOltbNDJdLFsxOF1dLFwiaFwiOltbMTMzLDI0OCwyOTNdXSxcImdcIjpbWzYwLDE0NV1dLFwiZlwiOltbNDE5XV0sXCJkXCI6W1syMzZdXSxcImNcIjpbWzcyXV0sXCJiXCI6W1syOTFdXSxcImFcIjpbWzU1LDEzM11dLFwiT1wiOltbMzAwXV0sXCJMXCI6W1syMjBdXSxcIkZcIjpbWzIyMF1dLFwiRFwiOltbMzcwXV19O1xuXG5cdHZhciBsZXR0ZXJzID0ge307XG5cblx0XG5cblx0dmFyIHBhcnNlU1ZHID0gZnVuY3Rpb24oZGF0YSl7XG5cblx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdHZhciBkb2MgPSAkKGRhdGEpO1xuXHRcdHZhciBsYXllcnMgPSBkb2MuZmluZCgnZycpO1xuXHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdHZhciBsYXllciA9ICQoZWwpO1xuXHRcdFx0dmFyIGlkID0gbGF5ZXIuYXR0cignaWQnKTtcblxuXHRcdFx0aWYoaWQgPT0gJ194MkRfJykge1xuXHRcdFx0XHRpZCA9ICctJztcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgbGV0dGVyID0gbGV0dGVyc1tpZF0gPSBuZXcgUGF0aEdyb3VwKGlkKTtcblxuXHRcdFx0dmFyIHBhdGhzID0gbGF5ZXIuZmluZCgncGF0aCcpO1xuXHRcdFx0Ly9pZihwYXRocy5sZW5ndGg9PTApIGNvbnNvbGUubG9nKGxheWVyKTtcblx0XHRcdC8vY29uc29sZS5sb2coaWQpO1xuXHRcdFx0cGF0aHMuZWFjaChmdW5jdGlvbihpLCBlbCl7XG5cdFx0XHRcdHZhciBwYXRoRWwgPSAkKGVsKTtcblx0XHRcdFx0dmFyIHAgPSBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpLCBudWxsLCBFQVNFUE9JTlRTW2lkXSAmJiBFQVNFUE9JTlRTW2lkXVtpXSkuc2NhbGUoU0NBTEUpO1x0XHRcdFx0XG5cdFx0XHRcdGxldHRlci5hZGRQYXRoKCBwICk7XG5cdFx0XHR9KTtcblxuXHRcdH0pO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhib3VuZGluZ3MpO1xuXHRcdC8vdHJvdXZlIGxlIHRvcCBhYnNvbHUgKHRvcCBkZSBsYSBsZXR0cmUgbGEgcGx1cyBoYXV0ZSlcblx0XHR2YXIgdG9wID0gT2JqZWN0LmtleXMobGV0dGVycykucmVkdWNlKGZ1bmN0aW9uKG1pbiwgbGV0dGVyTmFtZSl7XG5cdFx0XHR2YXIgdCA9IGxldHRlcnNbbGV0dGVyTmFtZV0uZ2V0VG9wKCk7XG5cdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZCB8fCBtaW4gPiB0KSB7XG5cdFx0XHRcdG1pbiA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbWluO1xuXHRcdH0sIHVuZGVmaW5lZCk7XG5cdFx0Ly9jb25zb2xlLmxvZyh0b3ApO1xuXHRcdC8vY29uc29sZS5sb2cobGV0dGVycyk7XG5cblx0XHQvL2FqdXN0ZSBsZSBiYXNlbGluZSBkZSBjaGFxdWUgbGV0dHJlXG5cdFx0T2JqZWN0LmtleXMobGV0dGVycykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcblx0XHRcdGxldHRlcnNba2V5XS5zZXRPZmZzZXQoLTEgKiBsZXR0ZXJzW2tleV0uZ2V0TGVmdCgpLCAtMSAqIHRvcCk7XG5cdFx0fSk7XG5cblxuXHR9O1xuXG5cdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdHZhciBsb2FkaW5nID0gJC5hamF4KHtcblx0XHRcdHVybCA6IHN2Z0ZpbGUsXG5cdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdH0pO1xuXG5cdFx0bG9hZGluZy50aGVuKHBhcnNlU1ZHLCBmdW5jdGlvbihhLCBiLCBjKXtcblx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRjb25zb2xlLmxvZyhiKTtcblx0XHRcdC8vY29uc29sZS5sb2coYyk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBsb2FkaW5nLnByb21pc2UoKTtcblxuXHR9O1xuXG5cdFxuXG5cdHZhciBBbHBoYWJldCA9IHtcblx0XHRpbml0IDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gZG9Mb2FkKCk7XG5cdFx0fSxcblx0XHRnZXRMZXR0ZXIgOiBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzW2xdO1xuXHRcdH0sXG5cdFx0Z2V0TlNwYWNlIDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBsZXR0ZXJzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9LFxuXHRcdC8vc2V0dXAgZGVzIGJyZWFrcG9pbnRzIChwb2ludHMgb8O5IG9uIGZhaXQgdW4gZWFzaW5nKSBkZSBjaGFjdW5lIGRlcyBsZXR0cmVzLiBTZXJhIG91dHB1dHTDqSBldCBzYXbDqSBlbiBKU09OLCBwb3VyIMOqdHJlIGxvYWTDqSBlbiBtw6ptZSB0ZW1wcyBxdWUgbCdhbHBoYWJldC4gTGUgcGFyc2UgZW4gcmVhbHRpbWUgZXN0IHRyb3AgbGVudCwgZG9uYyBjZXR0ZSBmb25jdGlvbiBkb2l0IGV0cmUgY2FsbMOpZSBwb3VyIHJlZmFpcmUgbGVzIGJyZWFrcG9pbnRzIGNoYXF1ZSBmb2lzIHF1ZSBsZSBTVkcgY2hhbmdlLlxuXHRcdHBhcnNlRWFzZXBvaW50cyA6IGZ1bmN0aW9uKHN0YWdlLCBub2RlLCBkaW0pe1xuXG5cdFx0XHRQYXRoRWFzZXBvaW50cyhzdGFnZSwgbGV0dGVycywgbm9kZSwgZGltKTtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAncm9zZS9kcmF3aW5nL0RyYXdQYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2xvZGFzaCcpLCByZXF1aXJlKCdyYXBoYWVsJyksIHJlcXVpcmUoJ2dzYXAnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5fLCByb290LlJhcGhhZWwsIChyb290LkdyZWVuU29ja0dsb2JhbHMgfHwgcm9vdCkpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uIChfLCBSYXBoYWVsLCBUd2Vlbk1heCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHQvL2dzYXAgZXhwb3J0cyBUd2Vlbk1heFxuXHR2YXIgZ3NhcCA9IHdpbmRvdy5HcmVlblNvY2tHbG9iYWxzIHx8IHdpbmRvdztcblxuXHR2YXIgZGVmYXVsdHMgPSB7XG5cdFx0Y29sb3I6ICcjMDAwMDAwJyxcblx0XHRzdHJva2VXaWR0aCA6IDAuNixcblx0XHRweFBlclNlY29uZCA6IDEwMCwgLy9zcGVlZCBvZiBkcmF3aW5nXG5cdFx0ZWFzaW5nIDogZ3NhcC5RdWFkLmVhc2VJblxuXHR9O1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgc3RhZ2UsIGNvbG9yLCBzaXplKXtcblx0XHRzdGFnZS5jaXJjbGUocG9pbnQueCwgcG9pbnQueSwgc2l6ZSB8fCAyKS5hdHRyKHtmaWxsOiBjb2xvciB8fCAnI2ZmMDAwMCcsIFwic3Ryb2tlLXdpZHRoXCI6MH0pO1xuXHR9O1xuXG5cdHZhciBEcmF3UGF0aCA9IHtcblxuXHRcdHNpbmdsZSA6IGZ1bmN0aW9uKHBhdGgsIHN0YWdlLCBwYXJhbXMpe1xuXG5cdFx0XHR2YXIgc2V0dGluZ3MgPSBfLmV4dGVuZCh7fSwgZGVmYXVsdHMsIHBhcmFtcyk7XG5cdFx0XHR2YXIgcGF0aFN0ciA9IHBhdGguZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XHR2YXIgbGVuZ3RoID0gcGF0aC5nZXRMZW5ndGgoKTtcblx0XHRcdHZhciBweFBlclNlY29uZCA9IHNldHRpbmdzLnB4UGVyU2Vjb25kO1xuXHRcdFx0dmFyIHRpbWUgPSBsZW5ndGggLyBweFBlclNlY29uZDtcblxuXHRcdFx0dmFyIGFuaW0gPSB7dG86IDB9O1xuXHRcdFx0XG5cdFx0XHR2YXIgdXBkYXRlID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciBlbDtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0dmFyIHBhdGhQYXJ0ID0gUmFwaGFlbC5nZXRTdWJwYXRoKHBhdGhTdHIsIDAsIGFuaW0udG8pO1xuXHRcdFx0XHRcdGlmKGVsKSBlbC5yZW1vdmUoKTtcblx0XHRcdFx0XHRlbCA9IHN0YWdlLnBhdGgocGF0aFBhcnQpO1xuXHRcdFx0XHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IHNldHRpbmdzLnN0cm9rZVdpZHRoLCBzdHJva2U6IHNldHRpbmdzLmNvbG9yfSk7XG5cdFx0XHRcdH07XG5cdFx0XHR9KSgpO1xuXG5cdFx0XHR2YXIgZWFzZVBvaW50cyA9IHBhdGguZ2V0RWFzZXBvaW50cygpO1xuXHRcdFx0Lypjb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblx0XHRcdGVhc2VQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwb3Mpe1xuXHRcdFx0XHR2YXIgcCA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwb3MpO1xuXHRcdFx0XHRzaG93UG9pbnQocCwgc3RhZ2UsICcjZmYwMDAwJywgMik7XG5cdFx0XHR9KTsvKiovXG5cdFx0XHRcblxuXHRcdFx0dmFyIGxhc3QgPSAwO1xuXHRcdFx0cmV0dXJuIGVhc2VQb2ludHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBkaXN0KSB7XG5cdFx0XHRcdHZhciB0aW1lID0gKGRpc3QtbGFzdCkgLyBweFBlclNlY29uZDtcblx0XHRcdFx0bGFzdCA9IGRpc3Q7XG5cdFx0XHRcdHJldHVybiB0bC50byhhbmltLCB0aW1lLCB7dG86IGRpc3QsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdH0sIG5ldyBnc2FwLlRpbWVsaW5lTWF4KHtcblx0XHRcdFx0b25VcGRhdGUgOiB1cGRhdGVcblx0XHRcdH0pKS50byhhbmltLCAoKGxlbmd0aCAtIChlYXNlUG9pbnRzLmxlbmd0aCAmJiBlYXNlUG9pbnRzW2Vhc2VQb2ludHMubGVuZ3RoLTFdKSkgLyBweFBlclNlY29uZCksIHt0bzogbGVuZ3RoLCBlYXNlIDogc2V0dGluZ3MuZWFzaW5nfSk7XG5cdFx0XHRcblx0XHR9LFxuXG5cdFx0Z3JvdXAgOiBmdW5jdGlvbihwYXRocywgc3RhZ2UsIHNldHRpbmdzLCBvbkNvbXBsZXRlKSB7XG5cdFx0XHRyZXR1cm4gcGF0aHMucmVkdWNlKGZ1bmN0aW9uKHRsLCBwYXRoKXtcblx0XHRcdFx0cmV0dXJuIHRsLmFwcGVuZChEcmF3UGF0aC5zaW5nbGUocGF0aCwgc3RhZ2UsIHNldHRpbmdzKSk7XG5cdFx0XHR9LCBuZXcgZ3NhcC5UaW1lbGluZU1heCh7IG9uQ29tcGxldGU6IChvbkNvbXBsZXRlIHx8IGZ1bmN0aW9uKCl7fSkgfSkpO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBEcmF3UGF0aDtcblx0XG59KSk7XG5cblxuIiwiLyohXG4gKiBNb3JlIGluZm8gYXQgaHR0cDovL2xhYi5sYS1ncmFuZ2UuY2FcbiAqIEBhdXRob3IgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIEBjb3B5cmlnaHQgMjAxNCBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogXG4qL1xuKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cycuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdqcXVlcnknKSwgcmVxdWlyZSgnbG9kYXNoJyksIHJlcXVpcmUoJ3JhcGhhZWwnKSwgcmVxdWlyZSgncm9zZS9kcmF3aW5nL01hdGhVdGlscy5qcycpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5fLCByb290LlJhcGhhZWwsIG5zLk1hdGhVdGlscyk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCQsIF8sIFJhcGhhZWwsIE1hdGhVdGlscykge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXG5cdHZhciBkaXN0YW5jZVRyZXNob2xkID0gNDA7XG5cdHZhciBhbmdsZVRyZXNob2xkID0gTWF0aFV0aWxzLnRvUmFkaWFucygxMik7XG5cblx0dmFyIHN0YWdlO1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpO1xuXHRcdGVsLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdHZhciBzaG93ID0gZnVuY3Rpb24ocGF0aERlZikge1xuXHRcdHZhciBwYXRoID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcdFx0XHRcblx0XHR2YXIgZWwgPSBzdGFnZS5wYXRoKHBhdGgpO1xuXHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IDMsIHN0cm9rZTogJyMwMDAwMDAnfSk7LyoqL1xuXHRcdHJldHVybiBlbDtcblx0fTtcblxuXHR2YXIgZmluZERlZmF1bHRzID0gZnVuY3Rpb24ocGF0aERlZil7XG5cdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdHZhciBsZW5ndGggPSBwYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdHZhciBwb2ludFBvcyA9IFtdO1xuXHRcdFxuXHRcdFxuXHRcdHZhciBwcmVjaXNpb24gPSAxO1xuXHRcdHZhciBwcmV2O1xuXHRcdHZhciBhbGxQb2ludHMgPSBbXTtcblx0XHRmb3IodmFyIGk9cHJlY2lzaW9uOyBpPD1sZW5ndGg7IGkgKz0gcHJlY2lzaW9uKSB7XG5cdFx0XHQvL3ZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBpKTtcblx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XG5cdFx0XHQvL2l0IHNlZW1zIHRoYXQgUmFwaGFlbCdzIGFscGhhIGlzIGluY29uc2lzdGVudC4uLiBzb21ldGltZXMgb3ZlciAzNjBcblx0XHRcdHZhciBhbHBoYSA9IE1hdGguYWJzKCBNYXRoLmFzaW4oIE1hdGguc2luKE1hdGhVdGlscy50b1JhZGlhbnMocC5hbHBoYSkpICkpO1xuXHRcdFx0aWYocHJldikge1xuXHRcdFx0XHRwLmRpZmYgPSBNYXRoLmFicyhhbHBoYSAtIHByZXYpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cC5kaWZmID0gMDtcblx0XHRcdH1cblx0XHRcdHByZXYgPSBhbHBoYTtcblx0XHRcdC8vY29uc29sZS5sb2cocC5kaWZmKTtcblxuXHRcdFx0aWYocC5kaWZmID4gYW5nbGVUcmVzaG9sZCkge1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGkpO1xuXHRcdFx0XHRwb2ludFBvcy5wdXNoKGkpO1xuXHRcdFx0fVxuXG5cdFx0XHQvL3AuY29tcHV0ZWRBbHBoYSA9IGFscGhhO1xuXHRcdFx0Ly9hbGxQb2ludHMucHVzaChwKTtcblxuXHRcdH0vKiovXG5cblx0XHQgLypcblx0XHQvL0RFQlVHIFxuXHRcdC8vZmluZCBtYXggY3VydmF0dXJlIHRoYXQgaXMgbm90IGEgY3VzcCAodHJlc2hvbGQgZGV0ZXJtaW5lcyBjdXNwKVxuXHRcdHZhciBjdXNwVHJlc2hvbGQgPSA0MDtcblx0XHR2YXIgbWF4ID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihtLCBwKXtcblx0XHRcdHJldHVybiBwLmRpZmYgPiBtICYmIHAuZGlmZiA8IGN1c3BUcmVzaG9sZCA/IHAuZGlmZiA6IG07XG5cdFx0fSwgMCk7XG5cdFx0Y29uc29sZS5sb2cobWF4KTtcblxuXHRcdHZhciBwcmV2ID0gWzAsMCwwLDBdO1xuXHRcdGFsbFBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0dmFyIHIgPSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdHZhciBnID0gMjU1IC0gTWF0aC5yb3VuZCgocC5kaWZmIC8gbWF4KSAqIDI1NSk7XG5cdFx0XHR2YXIgcmdiID0gJ3JnYignK3IrJywnK2crJywwKSc7XG5cdFx0XHRpZihyPjEwMCkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnPT09PT09PT09PScpO1xuXHRcdFx0XHRwcmV2LmZvckVhY2goZnVuY3Rpb24ocCl7Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhKTt9KTtcblx0XHRcdFx0Y29uc29sZS5sb2cocC5jb21wdXRlZEFscGhhLCBwLmFscGhhLCByZ2IpO1xuXHRcdFx0fVxuXHRcdFx0cC55ICs9IDE1MDtcblx0XHRcdHNob3dQb2ludChwLCByZ2IsIDAuNSk7XG5cdFx0XHRwcmV2WzNdID0gcHJldlsyXTtcblx0XHRcdHByZXZbMl0gPSBwcmV2WzFdO1xuXHRcdFx0cHJldlsxXSA9IHByZXZbMF07XG5cdFx0XHRwcmV2WzBdID0gcDtcblx0XHR9KTtcblx0XHQvKiovXG5cblx0XHQvL2ZpbmRzIGdyb3VwcyBvZiBwb2ludHMgZGVwZW5kaW5nIG9uIHRyZXNob2xkLCBhbmQgZmluZCB0aGUgbWlkZGxlIG9mIGVhY2ggZ3JvdXBcblx0XHRyZXR1cm4gcG9pbnRQb3MucmVkdWNlKGZ1bmN0aW9uKHBvaW50cywgcG9pbnQpe1xuXG5cdFx0XHR2YXIgbGFzdCA9IHBvaW50c1twb2ludHMubGVuZ3RoLTFdO1xuXHRcdFx0aWYoIWxhc3QgfHwgcG9pbnQgLSBsYXN0W2xhc3QubGVuZ3RoLTFdID4gZGlzdGFuY2VUcmVzaG9sZCl7XG5cdFx0XHRcdGxhc3QgPSBbcG9pbnRdO1xuXHRcdFx0XHRwb2ludHMucHVzaChsYXN0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGxhc3QucHVzaChwb2ludCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwb2ludHM7XG5cdFx0fSwgW10pLm1hcChmdW5jdGlvbihwb2ludHMpe1xuXHRcdFx0cmV0dXJuIHBvaW50c1tNYXRoLmZsb29yKHBvaW50cy5sZW5ndGgvMildO1xuXHRcdH0pO1xuXHRcdFxuXHR9O1xuXG5cdHZhciBhbGxQb2ludHMgPSBbXTtcblx0dmFyIGVhc2VQb2ludHMgPSB7fTtcblxuXHR2YXIgY3VycmVudDtcblxuXHR2YXIgZ2V0RWFzZXBvaW50cyA9IGZ1bmN0aW9uKGxldHRlciwgcGF0aElkeCwgcGF0aERlZil7XG5cdFx0XG5cdFx0dmFyIHBhdGggPSBzaG93KHBhdGhEZWYpO1xuXG5cdFx0Ly9hcmUgZWFzZSBwb2ludHMgYWxyZWFkeSBzZXQgZm9yIHRoaXMgcGF0aD9cblx0XHR2YXIgcGF0aEVhc2VQb2ludHMgPSBwYXRoRGVmLmdldEVhc2Vwb2ludHMoKTsgXG5cdFx0aWYocGF0aEVhc2VQb2ludHMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRwYXRoRWFzZVBvaW50cyA9IGZpbmREZWZhdWx0cyhwYXRoRGVmKTtcblx0XHR9XG5cblx0XHQvL2NvbnNvbGUubG9nKGVhc2VQb2ludHMpO1xuXHRcdHZhciBwYXRoU3RyID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcblx0XHRcblxuXHRcdHZhciBpbmFjdGl2ZUNvbG9yID0gJyMwMGZmMDAnO1xuXHRcdHZhciBhY3RpdmVDb2xvciA9ICcjZmYyMjAwJztcblxuXHRcdHZhciBhZGRQb2ludCA9IGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwb3MpO1xuXHRcdFx0dmFyIHBvaW50ID0gc2hvd1BvaW50KHBPYmosIGluYWN0aXZlQ29sb3IsIDMpO1xuXG5cdFx0XHRwb2ludC5kYXRhKCdwb3MnLCBwb3MpO1xuXHRcdFx0cG9pbnQuZGF0YSgnbGV0dGVyJywgbGV0dGVyKTtcblx0XHRcdHBvaW50LmRhdGEoJ3BhdGhJZHgnLCBwYXRoSWR4KTtcblx0XHRcdHBvaW50LmRhdGEoJ3gnLCBwT2JqLngpO1xuXHRcdFx0cG9pbnQuZGF0YSgneScsIHBPYmoueSk7XG5cblx0XHRcdGFsbFBvaW50cy5wdXNoKHBvaW50KTtcblxuXHRcdFx0cG9pbnQuY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdFx0XG5cdFx0XHRcdGFsbFBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0XHRcdHAuYXR0cih7ZmlsbDogaW5hY3RpdmVDb2xvcn0pO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRwb2ludC5hdHRyKHtmaWxsOiBhY3RpdmVDb2xvcn0pO1xuXG5cdFx0XHRcdGN1cnJlbnQgPSB7XG5cdFx0XHRcdFx0cG9pbnQ6IHBvaW50LFxuXHRcdFx0XHRcdHBhdGg6IHBhdGgsXG5cdFx0XHRcdFx0cGF0aERlZjogcGF0aERlZixcblx0XHRcdFx0XHRzdmcgOiBwYXRoU3RyLFxuXHRcdFx0XHRcdGxldHRlciA6IGxldHRlcixcblx0XHRcdFx0XHRwYXRoSWR4IDogcGF0aElkeFxuXHRcdFx0XHR9O1xuXG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0cGF0aEVhc2VQb2ludHMuZm9yRWFjaChhZGRQb2ludCk7LyoqL1xuXG5cdFx0cGF0aC5jbGljayhmdW5jdGlvbigpe1xuXHRcdFx0Y29uc29sZS5sb2coJ2FkZCcpO1xuXHRcdFx0YWRkUG9pbnQoMCk7XG5cdFx0fSk7XG5cdFx0XG5cblx0XHRyZXR1cm4gcGF0aEVhc2VQb2ludHM7XG5cblx0fTtcblxuXHR2YXIgbW92ZUN1cnJlbnQgPSBmdW5jdGlvbihkaXN0KSB7XG5cdFx0dmFyIHAgPSBjdXJyZW50LnBvaW50O1xuXHRcdHZhciBwb3MgPSBwLmRhdGEoJ3BvcycpO1xuXHRcdHBvcyArPSBkaXN0O1xuXHRcdHZhciBtYXggPSBjdXJyZW50LnBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0aWYocG9zIDwgMCkgcG9zID0gMDtcblx0XHRpZihwb3MgPiBtYXgpIHBvcyA9IG1heDtcblx0XHRwLmRhdGEoJ3BvcycsIHBvcyk7XG5cblx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJyZW50LnN2ZywgcG9zKTtcblxuXHRcdHZhciB4ID0gcC5kYXRhKCd4Jyk7XG5cdFx0dmFyIHkgPSBwLmRhdGEoJ3knKTtcblx0XHR2YXIgZGVsdGFYID0gcE9iai54IC0geDtcblx0XHR2YXIgZGVsdGFZID0gcE9iai55IC0geTtcblxuXHRcdC8qcC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRwLmRhdGEoJ3knLCBwT2JqLnkpOy8qKi9cblxuXHRcdHAudHJhbnNmb3JtKCd0JyArIGRlbHRhWCArICcsJyArIGRlbHRhWSk7XG5cdFx0cHJpbnRKU09OKCk7XG5cblx0fTtcblxuXG5cdCQod2luZG93KS5vbigna2V5ZG93bi5lYXNlJywgZnVuY3Rpb24oZSl7XG5cdFx0Ly9jb25zb2xlLmxvZyhlLndoaWNoLCBjdXJyZW50KTtcblx0XHR2YXIgTEVGVCA9IDM3O1xuXHRcdHZhciBVUCA9IDM4O1xuXHRcdHZhciBSSUdIVCA9IDM5O1xuXHRcdHZhciBET1dOID0gNDA7XG5cdFx0dmFyIERFTCA9IDQ2O1xuXG5cdFx0aWYoY3VycmVudCkge1xuXHRcdFx0c3dpdGNoKGUud2hpY2gpIHtcblx0XHRcdFx0Y2FzZSBMRUZUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgVVA6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KC0xMCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgUklHSFQ6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KDEpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIERPV046XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KDEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBERUw6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHZhciBpZHggPSBhbGxQb2ludHMuaW5kZXhPZihjdXJyZW50LnBvaW50KTtcblx0XHRcdFx0XHRjdXJyZW50LnBvaW50LnJlbW92ZSgpO1xuXHRcdFx0XHRcdGFsbFBvaW50cy5zcGxpY2UoaWR4LCAxKTtcblx0XHRcdFx0XHRjdXJyZW50ID0gbnVsbDtcblx0XHRcdFx0XHRwcmludEpTT04oKTtcblx0XHRcdFx0XHRicmVhaztcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdH0pO1xuXG5cdHZhciBwcmludE5vZGU7XG5cdHZhciBwcmludEpTT04gPSBmdW5jdGlvbigpIHtcblx0XHR2YXIganNvbiA9IGFsbFBvaW50cy5yZWR1Y2UoZnVuY3Rpb24oanNvbiwgcG9pbnQpe1xuXG5cdFx0XHR2YXIgbGV0dGVyID0gcG9pbnQuZGF0YSgnbGV0dGVyJyk7XG5cdFx0XHR2YXIgcGF0aElkeCA9IHBvaW50LmRhdGEoJ3BhdGhJZHgnKTtcblxuXHRcdFx0dmFyIHBhdGhzID0ganNvbltsZXR0ZXJdID0ganNvbltsZXR0ZXJdIHx8IFtdO1xuXHRcdFx0dmFyIGVhc2Vwb2ludHMgPSBwYXRoc1twYXRoSWR4XSA9IHBhdGhzW3BhdGhJZHhdIHx8IFtdO1xuXHRcdFx0ZWFzZXBvaW50cy5wdXNoKHBvaW50LmRhdGEoJ3BvcycpKTtcblx0XHRcdHJldHVybiBqc29uO1xuXHRcdH0sIHt9KTtcblx0XHRwcmludE5vZGUudGV4dChKU09OLnN0cmluZ2lmeShqc29uKSk7XG5cdH07XG5cblx0cmV0dXJuIGZ1bmN0aW9uKHMsIGdyb3Vwcywgbm9kZSwgZGltKXtcblx0XHRzdGFnZSA9IHM7XG5cdFx0dmFyIHBhZCA9IDIwO1xuXHRcdHZhciBhdmFpbFcgPSBkaW1bMF0gLSBwYWQ7XG5cblx0XHR2YXIgZ3JvdXBNYXhIZWlnaHQgPSBPYmplY3Qua2V5cyhncm91cHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIGdyb3VwTmFtZSl7XG5cdFx0XHR2YXIgdCA9IGdyb3Vwc1tncm91cE5hbWVdLmdldEhlaWdodCgpO1xuXHRcdFx0aWYobWluID09PSB1bmRlZmluZWQgfHwgdCA+IG1pbikge1xuXHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFxuXHRcdHZhciB0b3BMZWZ0ID0ge3g6cGFkLCB5OnBhZH07XG5cdFx0T2JqZWN0LmtleXMoZ3JvdXBzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpe1xuXHRcdFx0dmFyIGdyb3VwID0gZ3JvdXBzW25hbWVdO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhncm91cCk7XG5cdFx0XHR2YXIgZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cblx0XHRcdGlmKGVuZExlZnQgPiBhdmFpbFcpIHtcblx0XHRcdFx0dG9wTGVmdC54ID0gcGFkO1xuXHRcdFx0XHR0b3BMZWZ0LnkgKz0gcGFkICsgZ3JvdXBNYXhIZWlnaHQ7XG5cdFx0XHRcdGVuZExlZnQgPSB0b3BMZWZ0LnggKyBncm91cC5nZXRXaWR0aCgpICsgcGFkO1xuXHRcdFx0fVxuXG5cblx0XHRcdHZhciB0aGlzRWFzZSA9IGdyb3VwLnBhdGhzLm1hcChmdW5jdGlvbihwLCBpZHgpe1xuXHRcdFx0XHRwID0gcC50cmFuc2xhdGUodG9wTGVmdC54LCB0b3BMZWZ0LnkpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0RWFzZXBvaW50cyhuYW1lLCBpZHgsIHApO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dG9wTGVmdC54ID0gZW5kTGVmdDtcdFx0XHRcblxuXHRcdH0pO1xuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cblx0XHRwcmludE5vZGUgPSBub2RlO1xuXHRcdHByaW50SlNPTigpO1xuXHR9O1xuXG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdyb3NlL2RyYXdpbmcvVmVjdG9yV29yZCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgncm9zZS9kcmF3aW5nL0FscGhhYmV0LmpzJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvc2UuZHJhd2luZy5BbHBoYWJldCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKEFscGhhYmV0KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdFxuXHR2YXIgVmVjdG9yV29yZCA9IHtcblx0XHRnZXRQYXRocyA6IGZ1bmN0aW9uKG5hbWUsIHJpZ2h0LCB0b3AsIHNjYWxlKSB7XG5cdFx0XHRyaWdodCA9IHJpZ2h0IHx8IDA7XG5cdFx0XHR0b3AgPSB0b3AgfHwgMDtcblxuXHRcdFx0dmFyIGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdHZhciBsaW5lcyA9IFtdO1xuXG5cdFx0XHQvL2xvb3AgZm9yIGV2ZXJ5IGNoYXJhY3RlciBpbiBuYW1lIChzdHJpbmcpXG5cdFx0XHRmb3IodmFyIGk9MDsgaTxuYW1lLmxlbmd0aDsgaSsrKcKge1xuXHRcdFx0XHR2YXIgbGV0dGVyID0gbmFtZVtpXTtcblx0XHRcdFx0aWYobGV0dGVyID09PSAnICcpIHtcblx0XHRcdFx0XHRyaWdodCArPSBBbHBoYWJldC5nZXROU3BhY2UoKSAqIHNjYWxlO1xuXHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgbGV0dGVyRGVmID0gQWxwaGFiZXQuZ2V0TGV0dGVyKGxldHRlcikuc2NhbGUoc2NhbGUpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlckRlZik7XG5cdFx0XHRcdFxuXHRcdFx0XHR2YXIgbGV0dGVySm9pbmVkRW5kID0gZmFsc2U7XG5cdFx0XHRcdGxldHRlckRlZi5wYXRocy5mb3JFYWNoKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdFx0XHR2YXIgZGVmID0gcGF0aC50cmFuc2xhdGUocmlnaHQsIHRvcCk7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZFN0YXJ0ID0gZGVmLm5hbWUgJiYgZGVmLm5hbWUuaW5kZXhPZignam9pbmEnKSA+IC0xO1xuXHRcdFx0XHRcdHZhciBqb2luZWRFbmQgPSAvam9pbihhPyliLy50ZXN0KGRlZi5uYW1lKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgam9pbmVkU3RhcnQsIGpvaW5lZEVuZCk7XG5cdFx0XHRcdFx0bGV0dGVySm9pbmVkRW5kID0gbGV0dGVySm9pbmVkRW5kIHx8IGpvaW5lZEVuZDtcblx0XHRcdFx0XHRpZihqb2luZWRTdGFydCAmJiBjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL2FwcGVuZCBhdSBjb250aW51b3VzXG5cdFx0XHRcdFx0XHRjb250aW51b3VzLmFwcGVuZChkZWYsIGxldHRlcik7XG5cblx0XHRcdFx0XHRcdC8vYWpvdXRlIGxlcyBlYXNlcG9pbnRzIGRlIGNlIHBhdGhcblx0XHRcdFx0XHRcdHZhciBwYXRoU3RhcnRQb3MgPSBjb250aW51b3VzLmdldExlbmd0aCgpIC0gZGVmLmdldExlbmd0aCgpO1xuXHRcdFx0XHRcdFx0ZGVmLmdldEVhc2Vwb2ludHMoKS5mb3JFYWNoKGZ1bmN0aW9uKHBvcyl7XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVvdXMuYWRkRWFzZXBvaW50KHBhdGhTdGFydFBvcyArIHBvcyk7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZihqb2luZWRFbmQgJiYgIWNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vc3RhcnQgdW4gbm91dmVhdSBsaW5lXG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZGVmO1xuXHRcdFx0XHRcdFx0Y29udGludW91cy5uYW1lID0gbGV0dGVyO1xuXHRcdFx0XHRcdFx0bGluZXMucHVzaChjb250aW51b3VzKTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0bGluZXMucHVzaChkZWYpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmKCFsZXR0ZXJKb2luZWRFbmQpIHtcblx0XHRcdFx0XHRcdGNvbnRpbnVvdXMgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSk7XG5cdFx0XHRcdFxuXHRcdFx0XHRyaWdodCArPSBsZXR0ZXJEZWYuZ2V0V2lkdGgoKTtcblx0XHRcdFx0Ly9jb25zb2xlLnRhYmxlKFt7bGV0dGVyOm5hbWVbaV0sIGxldHRlcldpZHRoOiBsZXR0ZXIuZ2V0V2lkdGgoKSwgdG90YWw6cmlnaHR9XSk7XHRcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGxpbmVzO1xuXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBWZWN0b3JXb3JkO1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcmVnID0gLyhbYS16XSkoWzAtOVxcc1xcLFxcLlxcLV0rKS9naTtcblx0XHRcblx0Ly9leHBlY3RlZCBsZW5ndGggb2YgZWFjaCB0eXBlXG5cdHZhciBleHBlY3RlZExlbmd0aHMgPSB7XG5cdFx0bSA6IDIsXG5cdFx0bCA6IDIsXG5cdFx0diA6IDEsXG5cdFx0aCA6IDEsXG5cdFx0YyA6IDYsXG5cdFx0cyA6IDRcblx0fTtcblxuXHR2YXIgUGF0aCA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKSB7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHQvL2lmKHN2ZykgY29uc29sZS5sb2coc3ZnLCBwYXJzZWQpO1xuXHRcdHRoaXMuZWFzZVBvaW50cyA9IGVhc2VQb2ludHMgfHwgW107XG5cdFx0Ly9jb25zb2xlLmxvZyhuYW1lLCBlYXNlUG9pbnRzKTtcblx0XHR0aGlzLl9zZXRQYXJzZWQocGFyc2VkIHx8IHRoaXMuX3BhcnNlKHN2ZykpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLl9zZXRQYXJzZWQgPSBmdW5jdGlvbihwYXJzZWQpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnNlZCk7XG5cdFx0dGhpcy5wYXJzZWQgPSBwYXJzZWQ7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0Q3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jdWJpYyB8fCB0aGlzLl9wYXJzZUN1YmljKCk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRUb3RhbExlbmd0aCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyBhbiBTVkcgc3RyaW5nIG9mIHRoZSBwYXRoIHNlZ2VtbnRzLiBJdCBpcyBub3QgdGhlIHN2ZyBwcm9wZXJ0eSBvZiB0aGUgcGF0aCwgYXMgaXQgaXMgcG90ZW50aWFsbHkgdHJhbnNmb3JtZWRcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0U1ZHU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihzdmcsIHNlZ21lbnQpe1xuXHRcdFx0cmV0dXJuIHN2ZyArIHNlZ21lbnQudHlwZSArIHNlZ21lbnQuYW5jaG9ycy5qb2luKCcsJyk7IFxuXHRcdH0sICcnKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyB0aGUgcG9zaXRpb25zIGF0IHdoaWNoIHdlIGhhdmUgZWFzZSBwb2ludHMgKHdoaWNoIGFyZSBwcmVwYXJzZWQgYW5kIGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgcGF0aCdzIGRlZmluaXRpb25zKVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZWFzZVBvaW50cztcblx0fTtcblxuXHRQYXRoLnByb3RvdHlwZS5nZXRQb2ludCA9IGZ1bmN0aW9uKGlkeCkge1xuXHRcdC8vY29uc29sZS5sb2codGhpcy5wYXJzZWQpO1xuXHRcdHJldHVybiB0aGlzLnBhcnNlZFtpZHhdICYmIHRoaXMucGFyc2VkW2lkeF0uYW5jaG9ycztcblx0fTtcblxuXHQvKipcblx0UGFyc2VzIGFuIFNWRyBwYXRoIHN0cmluZyB0byBhIGxpc3Qgb2Ygc2VnbWVudCBkZWZpbml0aW9ucyB3aXRoIEFCU09MVVRFIHBvc2l0aW9ucyB1c2luZyBSYXBoYWVsLnBhdGgyY3VydmVcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlID0gZnVuY3Rpb24oc3ZnKSB7XG5cdFx0dmFyIGN1cnZlID0gUmFwaGFlbC5wYXRoMmN1cnZlKHN2Zyk7XG5cdFx0dmFyIHBhdGggPSBjdXJ2ZS5tYXAoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0dHlwZSA6IHBvaW50LnNoaWZ0KCksXG5cdFx0XHRcdGFuY2hvcnMgOiBwb2ludFxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcGF0aDtcblx0fTtcblxuXHQvKipcblx0XHRQYXJzZXMgYSBwYXRoIGRlZmluZWQgYnkgcGFyc2VQYXRoIHRvIGEgbGlzdCBvZiBiZXppZXIgcG9pbnRzIHRvIGJlIHVzZWQgYnkgR3JlZW5zb2NrIEJlemllciBwbHVnaW4sIGZvciBleGFtcGxlXG5cdFx0VHdlZW5NYXgudG8oc3ByaXRlLCA1MDAsIHtcblx0XHRcdGJlemllcjp7dHlwZTpcImN1YmljXCIsIHZhbHVlczpjdWJpY30sXG5cdFx0XHRlYXNlOlF1YWQuZWFzZUluT3V0LFxuXHRcdFx0dXNlRnJhbWVzIDogdHJ1ZVxuXHRcdH0pO1xuXHRcdCovXG5cdFBhdGgucHJvdG90eXBlLl9wYXJzZUN1YmljID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoKTtcblx0XHQvL2Fzc3VtZWQgZmlyc3QgZWxlbWVudCBpcyBhIG1vdmV0b1xuXHRcdHZhciBhbmNob3JzID0gdGhpcy5jdWJpYyA9IHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihhbmNob3JzLCBzZWdtZW50KXtcblx0XHRcdHZhciBhID0gc2VnbWVudC5hbmNob3JzO1xuXHRcdFx0aWYoc2VnbWVudC50eXBlPT09J00nKXtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OmFbMV19KTtcblx0XHRcdH0gZWxzZSBpZihzZWdtZW50LnR5cGU9PT0nTCcpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueCwgeTogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS55fSlcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzBdLCB5OiBhWzFdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVsyXSwgeTogYVszXX0pO1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbNF0sIHk6IGFbNV19KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBhbmNob3JzO1xuXG5cdFx0fSwgW10pO1xuXG5cdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0fTtcblxuXHQvL3Ryb3V2ZSBsZSBib3VuZGluZyBib3ggZCd1bmUgbGV0dHJlIChlbiBzZSBmaWFudCBqdXN0ZSBzdXIgbGVzIHBvaW50cy4uLiBvbiBuZSBjYWxjdWxlIHBhcyBvdSBwYXNzZSBsZSBwYXRoKVxuXHRQYXRoLnByb3RvdHlwZS5nZXRCb3VuZGluZyA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBSYXBoYWVsLnBhdGhCQm94KHRoaXMuZ2V0U1ZHU3RyaW5nKCkpO1xuXHR9O1xuXG5cblx0UGF0aC5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24oeCwgeSkge1xuXHRcdHZhciBtID0gUmFwaGFlbC5tYXRyaXgoKTtcblx0XHRtLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHR2YXIgc3ZnID0gUmFwaGFlbC5tYXBQYXRoKHRoaXMuZ2V0U1ZHU3RyaW5nKCksIG0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIHRoaXMuZWFzZVBvaW50cyk7XG5cdH07XG5cblx0Ly9yZXR1cm5zIGEgbmV3IHBhdGgsIHNjYWxlZFxuXHRQYXRoLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHJhdGlvKSB7XG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0uc2NhbGUocmF0aW8pO1xuXHRcdHZhciBzdmcgPSBSYXBoYWVsLm1hcFBhdGgodGhpcy5nZXRTVkdTdHJpbmcoKSwgbSk7XG5cdFx0dmFyIGVhc2VQb2ludHMgPSB0aGlzLmVhc2VQb2ludHMubWFwKGZ1bmN0aW9uKGVwKXtcblx0XHRcdHJldHVybiBlcCAqIHJhdGlvO1xuXHRcdH0pO1xuXHRcdHJldHVybiBQYXRoLmZhY3Rvcnkoc3ZnLCB0aGlzLm5hbWUsIG51bGwsIGVhc2VQb2ludHMpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKHBhcnQsIG5hbWUpwqB7XG5cdFx0Ly9jb25zb2xlLmxvZyhwYXJ0KTtcblx0XHRpZihuYW1lKSB0aGlzLm5hbWUgKz0gbmFtZTtcblx0XHR0aGlzLl9zZXRQYXJzZWQodGhpcy5wYXJzZWQuY29uY2F0KHBhcnQucGFyc2VkLnNsaWNlKDEpKSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYWRkRWFzZXBvaW50ID0gZnVuY3Rpb24ocG9zKXtcblx0XHR0aGlzLmVhc2VQb2ludHMucHVzaChwb3MpO1xuXHR9O1xuXG5cdFBhdGguZmFjdG9yeSA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKSB7XG5cdFx0cmV0dXJuIG5ldyBQYXRoKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKTtcblx0fTtcblxuXHRyZXR1cm4gUGF0aDtcblxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgUGF0aEdyb3VwID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNldEJvdW5kaW5nID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXRocy5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHBhdGgpe1xuXHRcdFx0dmFyIHBhdGhCb3VuZGluZyA9IHBhdGguZ2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZy54ID0gYm91bmRpbmcueCA8IHBhdGhCb3VuZGluZy54ID8gYm91bmRpbmcueCA6ICBwYXRoQm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLnkgPSBib3VuZGluZy55IDwgcGF0aEJvdW5kaW5nLnkgPyBib3VuZGluZy55IDogIHBhdGhCb3VuZGluZy55O1xuXHRcdFx0Ym91bmRpbmcueDIgPSBib3VuZGluZy54MiA+IHBhdGhCb3VuZGluZy54MiA/IGJvdW5kaW5nLngyIDogcGF0aEJvdW5kaW5nLngyO1xuXHRcdFx0Ym91bmRpbmcueTIgPSBib3VuZGluZy55MiA+IHBhdGhCb3VuZGluZy55MiA/IGJvdW5kaW5nLnkyIDogcGF0aEJvdW5kaW5nLnkyO1xuXHRcdFx0Ym91bmRpbmcud2lkdGggPSBib3VuZGluZy54MiAtIGJvdW5kaW5nLng7XG5cdFx0XHRib3VuZGluZy5oZWlnaHQgPSBib3VuZGluZy55MiAtIGJvdW5kaW5nLnk7XG5cdFx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdFx0fSwgdW5kZWZpbmVkKSB8fCB7fTtcblx0XHQvL2lmIHRoZXJlJ3MgYSBlbmRQb2ludCBwb2ludCB0aGF0IGlzIHNldCwgdXNlIGl0cyBjb29yZGluYXRlcyBhcyBib3VuZGluZ1xuXHRcdGlmKHRoaXMuZW5kUG9pbnQpIHtcblx0XHRcdHZhciBhbmNob3JzID0gdGhpcy5lbmRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueDIgPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHRcdGlmKHRoaXMuc3RhcnRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLnN0YXJ0UG9pbnQuZ2V0UG9pbnQoMCk7XG5cdFx0XHR0aGlzLmJvdW5kaW5nLnggPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuYWRkUGF0aCA9IGZ1bmN0aW9uKHApe1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzIHx8IFtdO1xuXHRcdGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignZW5kJykgPT09IDApIHtcblx0XHRcdHRoaXMuZW5kUG9pbnQgPSBwO1xuXHRcdH0gZWxzZSBpZihwLm5hbWUgJiYgcC5uYW1lLmluZGV4T2YoJ3N0YXJ0JykgPT09IDApIHtcblx0XHRcdHRoaXMuc3RhcnRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy5oZWlnaHQ7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcud2lkdGg7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0Qm90dG9uID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy55Mjtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRUb3AgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnk7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0TGVmdCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRSaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDI7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zZXRPZmZzZXQgPSBmdW5jdGlvbih4LCB5KXtcblx0XHR0aGlzLnBhdGhzID0gdGhpcy5wYXRocy5tYXAoZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoLnBhcnNlZFswXS5hbmNob3JzWzFdKTtcblx0XHRcdHBhdGggPSBwYXRoLnRyYW5zbGF0ZSh4LCB5KTtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRyZXR1cm4gcGF0aDtcblx0XHR9KTtcblx0XHR0aGlzLmVuZFBvaW50ID0gKHRoaXMuZW5kUG9pbnQgJiYgdGhpcy5lbmRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnRyYW5zbGF0ZSh4LCB5KSk7XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdC8vcmV0dXJucyBhIG5ldyBQYXRoR3JvdXAsIHNjYWxlZFxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpe1xuXHRcdGlmKCF0aGlzLnBhdGhzKSByZXR1cm4gdGhpcztcblx0XHR2YXIgc2NhbGVkID0gbmV3IFBhdGhHcm91cCh0aGlzLm5hbWUpO1xuXHRcdHRoaXMucGF0aHMuZm9yRWFjaChmdW5jdGlvbihwYXRoKXtcblx0XHRcdHNjYWxlZC5hZGRQYXRoKHBhdGguc2NhbGUoc2NhbGUpKTtcblx0XHR9KTtcblxuXHRcdHNjYWxlZC5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQuc2NhbGUoc2NhbGUpKTtcblx0XHRzY2FsZWQuc3RhcnRQb2ludCA9ICh0aGlzLnN0YXJ0UG9pbnQgJiYgdGhpcy5zdGFydFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnNldEJvdW5kaW5nKCk7XG5cdFx0cmV0dXJuIHNjYWxlZDtcblx0fTtcblxuXHRyZXR1cm4gUGF0aEdyb3VwO1xuXG59KSk7XG5cblxuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG5cdHZhciBuc1BhcnRzID0gJ3Jvc2UvZHJhd2luZy9NYXRoVXRpbHMnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbnNbbmFtZV0gPSBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeSgpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuXHR2YXIgZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXHR2YXIgcmFkVG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuXG5cdHJldHVybiB7XG5cblx0XHR0b1JhZGlhbnMgOiBmdW5jdGlvbihkZWdyZWVzKSB7XG5cdFx0ICByZXR1cm4gZGVncmVlcyAqIGRlZ1RvUmFkO1xuXHRcdH0sXG5cdFx0IFxuXHRcdC8vIENvbnZlcnRzIGZyb20gcmFkaWFucyB0byBkZWdyZWVzLlxuXHRcdHRvRGVncmVlcyA6IGZ1bmN0aW9uKHJhZGlhbnMpIHtcblx0XHQgIHJldHVybiByYWRpYW5zICogcmFkVG9EZWc7XG5cdFx0fVxuXHR9O1xuXG59KSk7Il19
