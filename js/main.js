(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (root, factory) {
	var nsParts = 'DecorativeLines'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('./lagrange/drawing/Alphabet'));
  	} else {
		ns[name] = factory(lagrange.drawing.Alphabet);
	}
}(this, function (Alphabet) {
	"use strict";

	//original scale factor
	var Lines = {
		scale : 0.2,
		svgFile : 'assets/lignes.svg',
		easepoints : {"folie":[[0.2643860025806711]],"wordDecorationEnd":[[0.6140462357835195]],"decembre":[[0.5796293820295325]],"nouvelles":[[0.2520739271467172,0.6689654220432111]]}
	};


	return  Alphabet.factory(Lines);
	
}));
},{"./lagrange/drawing/Alphabet":3}],2:[function(require,module,exports){
	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var EmilieFont = require('./lagrange/drawing/EmilieFont.js');
	var DecorativeLines = require('./DecorativeLines');
	var DrawPath = require('./lagrange/drawing/DrawPath');
	var VectorWord = require('./lagrange/drawing/VectorWord');
	var PathEasepoints = require('./lagrange/drawing/PathEasepoints');/**/
	var PathGroup = require('./lagrange/drawing/PathGroup');/**/
	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1600;
	var H = 1200;
	var CENTER = W / 2;
	var T = 50;
	var LINE_HEIGHT = 1.2;//em
	var SPEED = 250;//px per sec


	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	
	function Shuffle(o) {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	
	Shuffle(names);
	//names.length = 1;/**/



	var getStage = (function(){
		var stage;
		var init = function(){
			return Raphael("svg", W, H);
		};
		return function(){
			return stage = stage || init();
		}
	})();
	//helper
	var showPoint = function(point, color, size){
		var el = getStage().circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	var loading = $.when(EmilieFont.load(), DecorativeLines.load());

	var words = [
		{
			text : 'Merci',
			size : 0.8
		},
		{
			text : 'Jean-Paul',//names.pop(),
			size : 1,
			append : function(){
				return {
					symbol: DecorativeLines.getSymbol('wordDecorationEnd').getPaths()[0],
					size: 1 //height in em
				};
			}
		}
	];




	var doDraw = function(){
		var top = 0;
		words = words.map(function(word, lineNum){

			var paths = VectorWord.getPaths(EmilieFont, word.text);
			paths = paths.scale(word.size);

			//center text
			var width = paths.getWidth();
			var left = - width / 2;

			paths.setOffset(left, top);
			
			top += EmilieFont.getUpperLineHeight() * LINE_HEIGHT;

			//ajoute le guidi sur le dernier mot
			if(word.append) {
				var append = word.append();
				var curve = append.symbol;
				
				//trouve les points de départ et d'arrivée de la curve
				var curveStr = curve.getSVGString();
				var startPos = Raphael.getPointAtLength(curveStr, 0);
				var endPos = Raphael.getPointAtLength(curveStr, curve.getLength());

				var wordPaths = paths.getPaths();
				//trouve le path qui finit le plus à droite dans les lettres
				var lastPath = wordPaths.reduce(function(last, cur){
					if(!last) return cur;
					//si le path se finit plus à droite ET qu'il a un nom (les détails genre barre du t et point de i n'ont pas de nom)
					if(cur.name && last.getBounding().x2 < cur.getBounding().x2){
						last = cur;
					}
					return last;
				}, null);

				var wordEndPos = Raphael.getPointAtLength(lastPath.getSVGString(), lastPath.getLength());

				//position absolue du point de départ du path
				var absStartPos = {
					x: wordEndPos.x - startPos.x,
					y: wordEndPos.y - startPos.y
				};

				/*showPoint({x:wordEndPos.xx, y:wordEndPos.y}, '#22ff00');
				showPoint(absStartPos, '#ff0000');/**/

				//à combien de distance le boute est du début
				var relEndPos = {
					x: endPos.x - startPos.x,
					y: endPos.y - startPos.y
				};

				//à quel endroit on doit faire arriver le endpos, relatif au début du path
				var targetRelEndPos = {
					x: - wordEndPos.x,
					y: append.size * EmilieFont.getUpperLineHeight()
				};

				var ratio = {
					x : targetRelEndPos.x / relEndPos.x,
					y : targetRelEndPos.y / relEndPos.y,
				};
				/*console.log('start at',absStartPos);
				console.log(targetRelEndPos);
				console.log(ratio, currentEndPos);**/

				var m = Raphael.matrix();
				m.scale(ratio.x, ratio.y, absStartPos.x+startPos.x, absStartPos.y);
				m.translate(absStartPos.x, absStartPos.y);
				curve = curve.applyMatrix(m);

				lastPath.append(curve);
				//paths.addPath(curve);
				
			}

			word.paths = paths;

			return word;

		});

		//trouve le bounding box de l'ensemble des paths, s'en servira pour s'assurer que ça entre toujours dans le stage
		var bounding = words.reduce(function(g, w){
			w.paths.getPaths().forEach(function(p){
				g.addPath(p);
			});
			return g;
		}, PathGroup.factory()).getBounding();

		var elementSet = getStage().set();

		var resizeSet = function(){
			var scale = W / bounding.width;
			var targetH = bounding.height * scale;
			if(targetH > H){
				scale = H / bounding.height;
			}
			//console.log(scale);
			
			var targetLeft = ((W - bounding.width) / 2) - bounding.x;
			elementSet.transform('t'+targetLeft+',0s'+scale+','+scale+',0,0');
		};

		var tl = words.reduce(function(tl, word, lineNum){
			return DrawPath.group(word.paths.getPaths(), getStage(), elementSet, {
				pxPerSecond : SPEED * word.size,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeInOut
			}, tl);
		}, new gsap.TimelineMax({paused:true, onUpdate: resizeSet}));

		tl.play();
	};

		
	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		loading.then(doDraw);
	});



	//parse les easepoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		//EmilieFont
		//DecorativeLines
		PathEasepoints(getStage(), EmilieFont.getAll(), $('#brp'), [W, H]);
	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		loading.then(printEasepoints);
	});


},{"./DecorativeLines":1,"./lagrange/drawing/DrawPath":4,"./lagrange/drawing/EmilieFont.js":5,"./lagrange/drawing/PathEasepoints":7,"./lagrange/drawing/PathGroup":8,"./lagrange/drawing/VectorWord":9,"gsap":"gsap","jquery":"jquery","raphael":"raphael"}],3:[function(require,module,exports){
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
			return symbols['n'] && symbols['n'].getWidth();
		};

		this.getLowerLineHeight = function(){
			return symbols['n'] && symbols['n'].getHeight();
		};

		this.getUpperLineHeight = function(){
			return symbols['N'] && symbols['N'].getHeight();
		};

		this.getAll = function(){
			return symbols;
		};

		return this;
	};

	var instances = {};
	Alphabet.factory = function(settings){
		var svg = settings.svgFile;
		instances[svg] = instances[svg] || (new Alphabet()).init(settings);
		return instances[svg];
	};

	return Alphabet;
	
}));



},{"./Path":6,"./PathGroup":8,"jquery":"jquery"}],4:[function(require,module,exports){
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
	var showPoint = function(point, stage, elSet, color, size){
		var el = stage.circle(point.x, point.y, size || 2).attr({fill: color || '#ff0000', "stroke-width":0});
		if(elSet) {
			elSet.push(el);
		}
	};

	var DrawPath = {

		single : function(path, stage, elSet, params){
			
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
					if(elSet) {
						elSet.push(el);
					}
					el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});
				};
			})();

			var easePoints = path.getEasepoints();
			/*console.log(easePoints.length);
			easePoints.forEach(function(pos){
				var p = Raphael.getPointAtLength(pathStr, pos);
				showPoint(p, stage, elSet, '#ff0000', 2);
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

		group : function(paths, stage, elSet, settings, tl) {
			return paths.reduce(function(tl, path){
				return tl.append(DrawPath.single(path, stage, elSet, settings));
			}, tl || new gsap.TimelineMax({paused:true}));
		}
	}

	return DrawPath;
	
}));



},{"gsap":"gsap","lodash":"lodash","raphael":"raphael"}],5:[function(require,module,exports){
(function (root, factory) {
	var nsParts = 'lagrange/drawing/EmilieFont'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('./Alphabet'));
  	} else {
		ns[name] = factory(lagrange.drawing.Alphabet);
	}
}(this, function (Alphabet) {
	"use strict";

	//original scale factor
	var EmilieFont = {
		scale : 1,
		svgFile : 'assets/emilieFont.svg',
		//PARSÉ avec le helper
		easepoints : {"Ô":[null,[0.5584914919761824]],"Ï":[[0.29016354963613855]],"Î":[[0.2965407705072625],[0.5467815045609877]],"Ë":[[0.5077096788604549]],"Ê":[[0.5077096788604549],[0.5772976077109914]],"È":[[0.5077096788604548]],"É":[[0.5077096788604549]],"Ç":[null,[0.2598411554903728]],"Ä":[[0.6336814724971563]],"Â":[[0.6336814724971539],null,[0.5090886807972653]],"À":[[0.6336814724971515]],"Z":[[0.43397251661486874,0.7645111691660901]],"Y":[[0.5721288765582158]],"W":[[0.39059019156730196,0.5781423099850813]],"V":[[0.6084105902730373]],"U":[[0.7019970416843152]],"R":[[0.7209223516252533]],"O":[[0.7438835818476476]],"N":[[0.5220142131783195,0.739696253491546]],"M":[[0.4230267565749447,0.6007690912702996,0.8033953528230042]],"L":[[0.675791197094622]],"K":[[0.4176184176593474],[0.4974675895966692]],"J":[[0.30526202860950097]],"H":[[0.44412310090678697]],"G":[[0.565989875455731]],"E":[[0.507714239419093]],"D":[[0.7437876093459903]],"B":[[0.7472581393948285]],"A":[[0.6336814724971553]],"ô":[[0.8733942750707324],[0.5467815045610148]],"ö":[[0.8733942750707276]],"ï":[[0.5396497019042842]],"î":[[0.5396497019042847],[0.5446698429470289]],"ë":[[0.4019332258014558]],"ê":[[0.4019332258014558],[0.5730882321053653]],"è":[[0.401933225801456]],"é":[[0.4019332258014584]],"ç":[[0.5330591122685393],[0.25984115549037146]],"ä":[[0.34940430982819826,0.8449231492209157]],"â":[[0.34940430982820014,0.8449231492209203],[0.5142123761120201]],"à":[[0.34940430982820303,0.8449231492209274]],"z":[[0.365922277194166,0.6985788928252259]],"y":[[0.1268221593350814,0.35027072578260576,0.6854435754538923]],"x":[[0.4191980810790184]],"w":[[0.17801329921332273,0.5012479741006719,0.8291672094936348]],"v":[[0.5536092498520837]],"u":[[0.22756813200989953,0.7240804200314985]],"t":[[0.49372903305517213]],"s":[[0.35139938159549133,0.7730786395100809]],"r":[[0.5461246516048937]],"q":[[0.4202781109450618,0.948544347619063]],"p":[[0.13929487659814935,0.7586595957577777]],"o":[[0.8719079009287485]],"n":[[0.7670173696488157]],"m":[[0.5253602561298806]],"l":[[0.4928220467456207]],"k":[[0.3589229109383251,0.6788929478213281,0.9098278440064521]],"j":[[0.1910121713438751]],"i":[[0.5396497019042862]],"h":[[0.3948367837720256,0.7474772700416973,0.8831082262992633]],"g":[[0.171539588772651,0.41455400620057326]],"f":[[0.2940218468777052,0.9193668197146155]],"d":[[0.15935695427297436,0.6542022333311579]],"c":[[0.5330591122685394]],"b":[[0.40392205820143084,0.9328676106080666]],"a":[[0.3494043098281997,0.8449231492209193]]}
	};


	return  Alphabet.factory(EmilieFont);;
	
}));
},{"./Alphabet":3}],6:[function(require,module,exports){
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
	Gets the absolute positions at which we have ease points (which are preparsed and considered part of the path's definitions)
	*/
	Path.prototype.getEasepoints = function() {
		var l = this.getLength();
		return this.easePoints.map(function(e){
			return e * l;
		});
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
		return Path.factory(svg, this.name, null, this.easePoints.slice(0));
	};

	//returns a new path, scaled
	Path.prototype.scale = Path.prototype.clone = function(ratio) {
		ratio = ratio || 1;
		var m = Raphael.matrix();
		m.scale(ratio);
		var svg = Raphael.mapPath(this.getSVGString(), m);
		return Path.factory(svg, this.name, null, this.easePoints.slice(0));
	};

	Path.prototype.applyMatrix = function(m){
		var svg = Raphael.mapPath(this.getSVGString(), m);
		return Path.factory(svg, this.name, null, this.easePoints.slice(0));
	}; 

	Path.prototype.append = function(part, name) {
		//console.log(part);
		if(name) this.name += name;
		var origLength = this.getLength();
		this._setParsed(this.parsed.concat(part.parsed.slice(1)));
		var finalLength = this.getLength();
		//remap easepoints, as length of path has changed
		var lengthRatio = finalLength / origLength;
		this.easePoints = this.easePoints.map(function(e){
			return e / lengthRatio;
		});
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



},{"raphael":"raphael"}],7:[function(require,module,exports){
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
		var pathEasePoints = pathDef.getEasepoints(true); 
		if(pathEasePoints.length === 0 && GET_DEFAULTS) {
			pathEasePoints = findDefaults(pathDef);
		}

		//console.log(easePoints);
		var length = pathDef.getLength();
		var pathStr = pathDef.getSVGString();
		

		var inactiveColor = '#00ff00';
		var activeColor = '#ff2200';

		var addPoint = function(pos){
			if(pos < 1) pos = pos * length;//si en prc
			var pObj = Raphael.getPointAtLength(pathStr, pos);
			var point = showPoint(pObj, inactiveColor, 3);
			//console.log(pathIdx);
			point.data('pos', pos);
			point.data('letter', letter);
			point.data('pathIdx', pathIdx);
			point.data('pathLength', length);
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
			var l = point.data('pathLength');

			var paths = json[letter] = json[letter] || [];
			var easepoints = paths[pathIdx] = paths[pathIdx] || [];
			easepoints.push(point.data('pos') / l);
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



},{"jquery":"jquery","lodash":"lodash","raphael":"raphael"}],8:[function(require,module,exports){
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
	PathGroup.prototype.getBounding = function(){
		return this.bounding;
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

	PathGroup.factory = function(){
		return new PathGroup();
	};

	return PathGroup;

}));



},{}],9:[function(require,module,exports){
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
						var totalLength = continuous.getLength();
						var pathStartPos = totalLength - def.getLength();
						def.getEasepoints().forEach(function(pos){
							continuous.addEasepoint((pathStartPos + pos) / totalLength);
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



},{"./PathGroup":8}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvRGVjb3JhdGl2ZUxpbmVzLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL0V4YW1wbGUuanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9BbHBoYWJldC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL0RyYXdQYXRoLmpzIiwiL1VzZXJzL2xhZ3JhbmdlL2dpdC9sYWIvYWxwaGFiZXQvYXBwL2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGguanMiLCIvVXNlcnMvbGFncmFuZ2UvZ2l0L2xhYi9hbHBoYWJldC9hcHAvbGFncmFuZ2UvZHJhd2luZy9QYXRoRWFzZXBvaW50cy5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cC5qcyIsIi9Vc2Vycy9sYWdyYW5nZS9naXQvbGFiL2FscGhhYmV0L2FwcC9sYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnRGVjb3JhdGl2ZUxpbmVzJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvQWxwaGFiZXQnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5BbHBoYWJldCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKEFscGhhYmV0KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBMaW5lcyA9IHtcblx0XHRzY2FsZSA6IDAuMixcblx0XHRzdmdGaWxlIDogJ2Fzc2V0cy9saWduZXMuc3ZnJyxcblx0XHRlYXNlcG9pbnRzIDoge1wiZm9saWVcIjpbWzAuMjY0Mzg2MDAyNTgwNjcxMV1dLFwid29yZERlY29yYXRpb25FbmRcIjpbWzAuNjE0MDQ2MjM1NzgzNTE5NV1dLFwiZGVjZW1icmVcIjpbWzAuNTc5NjI5MzgyMDI5NTMyNV1dLFwibm91dmVsbGVzXCI6W1swLjI1MjA3MzkyNzE0NjcxNzIsMC42Njg5NjU0MjIwNDMyMTExXV19XG5cdH07XG5cblxuXHRyZXR1cm4gIEFscGhhYmV0LmZhY3RvcnkoTGluZXMpO1xuXHRcbn0pKTsiLCJcdFxuXHR2YXIgJCA9IHJlcXVpcmUoJ2pxdWVyeScpO1xuXHR2YXIgUmFwaGFlbCA9IHJlcXVpcmUoJ3JhcGhhZWwnKTtcblx0dmFyIEVtaWxpZUZvbnQgPSByZXF1aXJlKCcuL2xhZ3JhbmdlL2RyYXdpbmcvRW1pbGllRm9udC5qcycpO1xuXHR2YXIgRGVjb3JhdGl2ZUxpbmVzID0gcmVxdWlyZSgnLi9EZWNvcmF0aXZlTGluZXMnKTtcblx0dmFyIERyYXdQYXRoID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL0RyYXdQYXRoJyk7XG5cdHZhciBWZWN0b3JXb3JkID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQnKTtcblx0dmFyIFBhdGhFYXNlcG9pbnRzID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzJyk7LyoqL1xuXHR2YXIgUGF0aEdyb3VwID0gcmVxdWlyZSgnLi9sYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cCcpOy8qKi9cblx0dmFyIFR3ZWVuTWF4ID0gcmVxdWlyZSgnZ3NhcCcpO1xuXG5cdHZhciBnc2FwID0gd2luZG93LkdyZWVuU29ja0dsb2JhbHMgfHwgd2luZG93O1xuXG5cdHZhciBXID0gMTYwMDtcblx0dmFyIEggPSAxMjAwO1xuXHR2YXIgQ0VOVEVSID0gVyAvIDI7XG5cdHZhciBUID0gNTA7XG5cdHZhciBMSU5FX0hFSUdIVCA9IDEuMjsvL2VtXG5cdHZhciBTUEVFRCA9IDI1MDsvL3B4IHBlciBzZWNcblxuXG5cdHZhciBuYW1lcyA9IFtcIkplc3NpY2EgV2FubmluZ1wiLFwiSnVsaWEgUm9ja3dlbGxcIixcIkNhcm9sIEh1YmJhcmRcIixcIlJvbmFsZCBDYW5keVwiLFwiSm9obiBOZXd0b25cIixcIkVsdmlzIE5pY29sZVwiLFwiR2xvcmlhIFdlYXZlclwiLFwiSnVsaWEgQ3JvbmtpdGVcIixcIk1vdGhlciBSb2dlcnNcIixcIkNoZXZ5IElyd2luXCIsXCJFZGRpZSBBbGxlblwiLFwiTm9ybWFuIEphY2tzb25cIixcIlBldGVyIFJvZ2Vyc1wiLFwiV2VpcmQgQ2hhc2VcIixcIkNvbGluIE1heXNcIixcIk5hcG9sZW9uIE1hcnRpblwiLFwiRWRnYXIgU2ltcHNvblwiLFwiTW9oYW1tYWQgTWNDYXJ0bmV5XCIsXCJMaWJlcmFjZSBXaWxsaWFtc1wiLFwiRmllbGRzIEJ1cm5ldHRcIixcIlN0ZXZlIEFzaGVcIixcIkNhcnJpZSBDaGFybGVzXCIsXCJUb21teSBQYXN0ZXVyXCIsXCJFZGRpZSBTaWx2ZXJzdG9uZVwiLFwiT3ByYWggQXNoZVwiLFwiUmF5IEJhbGxcIixcIkppbSBEaWFuYVwiLFwiTWljaGVsYW5nZWxvIEVhc3R3b29kXCIsXCJHZW9yZ2UgU2ltcHNvblwiLFwiQWxpY2lhIEF1c3RlblwiLFwiSmVzc2ljYSBOaWNvbGVcIixcIk1hcmlseW4gRXZlcmV0dFwiLFwiS2VpdGggRWFzdHdvb2RcIixcIlBhYmxvIEVhc3R3b29kXCIsXCJQZXl0b24gTHV0aGVyXCIsXCJNb3phcnQgQXJtc3Ryb25nXCIsXCJNaWNoYWVsIEJ1cm5ldHRcIixcIktlaXRoIEdsb3ZlclwiLFwiRWxpemFiZXRoIENoaWxkXCIsXCJNaWxlcyBBc3RhaXJlXCIsXCJBbmR5IEVkaXNvblwiLFwiTWFydGluIExlbm5vblwiLFwiVG9tIFBpY2Nhc29cIixcIkJleW9uY2UgRGlzbmV5XCIsXCJQZXRlciBDbGludG9uXCIsXCJIZW5yeSBLZW5uZWR5XCIsXCJQYXVsIENoaWxkXCIsXCJMZXdpcyBTYWdhblwiLFwiTWljaGVsYW5nZWxvIExlZVwiLFwiTWFyaWx5biBGaXNoZXJcIl07XG5cdFxuXHRmdW5jdGlvbiBTaHVmZmxlKG8pIHtcblx0XHRmb3IodmFyIGosIHgsIGkgPSBvLmxlbmd0aDsgaTsgaiA9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkgKiBpKSwgeCA9IG9bLS1pXSwgb1tpXSA9IG9bal0sIG9bal0gPSB4KTtcblx0XHRyZXR1cm4gbztcblx0fTtcblx0XG5cdFNodWZmbGUobmFtZXMpO1xuXHQvL25hbWVzLmxlbmd0aCA9IDE7LyoqL1xuXG5cblxuXHR2YXIgZ2V0U3RhZ2UgPSAoZnVuY3Rpb24oKXtcblx0XHR2YXIgc3RhZ2U7XG5cdFx0dmFyIGluaXQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIFJhcGhhZWwoXCJzdmdcIiwgVywgSCk7XG5cdFx0fTtcblx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzdGFnZSA9IHN0YWdlIHx8IGluaXQoKTtcblx0XHR9XG5cdH0pKCk7XG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IGdldFN0YWdlKCkuY2lyY2xlKHBvaW50LngsIHBvaW50LnksIHNpemUgfHwgMik7XG5cdFx0ZWwuYXR0cih7ZmlsbDogY29sb3IgfHwgJyNmZjAwMDAnLCBcInN0cm9rZS13aWR0aFwiOjB9KTtcblx0XHRyZXR1cm4gZWw7XG5cdH07XG5cblx0dmFyIGxvYWRpbmcgPSAkLndoZW4oRW1pbGllRm9udC5sb2FkKCksIERlY29yYXRpdmVMaW5lcy5sb2FkKCkpO1xuXG5cdHZhciB3b3JkcyA9IFtcblx0XHR7XG5cdFx0XHR0ZXh0IDogJ01lcmNpJyxcblx0XHRcdHNpemUgOiAwLjhcblx0XHR9LFxuXHRcdHtcblx0XHRcdHRleHQgOiAnSmVhbi1QYXVsJywvL25hbWVzLnBvcCgpLFxuXHRcdFx0c2l6ZSA6IDEsXG5cdFx0XHRhcHBlbmQgOiBmdW5jdGlvbigpe1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdHN5bWJvbDogRGVjb3JhdGl2ZUxpbmVzLmdldFN5bWJvbCgnd29yZERlY29yYXRpb25FbmQnKS5nZXRQYXRocygpWzBdLFxuXHRcdFx0XHRcdHNpemU6IDEgLy9oZWlnaHQgaW4gZW1cblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHR9XG5cdF07XG5cblxuXG5cblx0dmFyIGRvRHJhdyA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHRvcCA9IDA7XG5cdFx0d29yZHMgPSB3b3Jkcy5tYXAoZnVuY3Rpb24od29yZCwgbGluZU51bSl7XG5cblx0XHRcdHZhciBwYXRocyA9IFZlY3RvcldvcmQuZ2V0UGF0aHMoRW1pbGllRm9udCwgd29yZC50ZXh0KTtcblx0XHRcdHBhdGhzID0gcGF0aHMuc2NhbGUod29yZC5zaXplKTtcblxuXHRcdFx0Ly9jZW50ZXIgdGV4dFxuXHRcdFx0dmFyIHdpZHRoID0gcGF0aHMuZ2V0V2lkdGgoKTtcblx0XHRcdHZhciBsZWZ0ID0gLSB3aWR0aCAvIDI7XG5cblx0XHRcdHBhdGhzLnNldE9mZnNldChsZWZ0LCB0b3ApO1xuXHRcdFx0XG5cdFx0XHR0b3AgKz0gRW1pbGllRm9udC5nZXRVcHBlckxpbmVIZWlnaHQoKSAqIExJTkVfSEVJR0hUO1xuXG5cdFx0XHQvL2Fqb3V0ZSBsZSBndWlkaSBzdXIgbGUgZGVybmllciBtb3Rcblx0XHRcdGlmKHdvcmQuYXBwZW5kKSB7XG5cdFx0XHRcdHZhciBhcHBlbmQgPSB3b3JkLmFwcGVuZCgpO1xuXHRcdFx0XHR2YXIgY3VydmUgPSBhcHBlbmQuc3ltYm9sO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly90cm91dmUgbGVzIHBvaW50cyBkZSBkw6lwYXJ0IGV0IGQnYXJyaXbDqWUgZGUgbGEgY3VydmVcblx0XHRcdFx0dmFyIGN1cnZlU3RyID0gY3VydmUuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XHRcdHZhciBzdGFydFBvcyA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJ2ZVN0ciwgMCk7XG5cdFx0XHRcdHZhciBlbmRQb3MgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgoY3VydmVTdHIsIGN1cnZlLmdldExlbmd0aCgpKTtcblxuXHRcdFx0XHR2YXIgd29yZFBhdGhzID0gcGF0aHMuZ2V0UGF0aHMoKTtcblx0XHRcdFx0Ly90cm91dmUgbGUgcGF0aCBxdWkgZmluaXQgbGUgcGx1cyDDoCBkcm9pdGUgZGFucyBsZXMgbGV0dHJlc1xuXHRcdFx0XHR2YXIgbGFzdFBhdGggPSB3b3JkUGF0aHMucmVkdWNlKGZ1bmN0aW9uKGxhc3QsIGN1cil7XG5cdFx0XHRcdFx0aWYoIWxhc3QpIHJldHVybiBjdXI7XG5cdFx0XHRcdFx0Ly9zaSBsZSBwYXRoIHNlIGZpbml0IHBsdXMgw6AgZHJvaXRlIEVUIHF1J2lsIGEgdW4gbm9tIChsZXMgZMOpdGFpbHMgZ2VucmUgYmFycmUgZHUgdCBldCBwb2ludCBkZSBpIG4nb250IHBhcyBkZSBub20pXG5cdFx0XHRcdFx0aWYoY3VyLm5hbWUgJiYgbGFzdC5nZXRCb3VuZGluZygpLngyIDwgY3VyLmdldEJvdW5kaW5nKCkueDIpe1xuXHRcdFx0XHRcdFx0bGFzdCA9IGN1cjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmV0dXJuIGxhc3Q7XG5cdFx0XHRcdH0sIG51bGwpO1xuXG5cdFx0XHRcdHZhciB3b3JkRW5kUG9zID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKGxhc3RQYXRoLmdldFNWR1N0cmluZygpLCBsYXN0UGF0aC5nZXRMZW5ndGgoKSk7XG5cblx0XHRcdFx0Ly9wb3NpdGlvbiBhYnNvbHVlIGR1IHBvaW50IGRlIGTDqXBhcnQgZHUgcGF0aFxuXHRcdFx0XHR2YXIgYWJzU3RhcnRQb3MgPSB7XG5cdFx0XHRcdFx0eDogd29yZEVuZFBvcy54IC0gc3RhcnRQb3MueCxcblx0XHRcdFx0XHR5OiB3b3JkRW5kUG9zLnkgLSBzdGFydFBvcy55XG5cdFx0XHRcdH07XG5cblx0XHRcdFx0LypzaG93UG9pbnQoe3g6d29yZEVuZFBvcy54eCwgeTp3b3JkRW5kUG9zLnl9LCAnIzIyZmYwMCcpO1xuXHRcdFx0XHRzaG93UG9pbnQoYWJzU3RhcnRQb3MsICcjZmYwMDAwJyk7LyoqL1xuXG5cdFx0XHRcdC8vw6AgY29tYmllbiBkZSBkaXN0YW5jZSBsZSBib3V0ZSBlc3QgZHUgZMOpYnV0XG5cdFx0XHRcdHZhciByZWxFbmRQb3MgPSB7XG5cdFx0XHRcdFx0eDogZW5kUG9zLnggLSBzdGFydFBvcy54LFxuXHRcdFx0XHRcdHk6IGVuZFBvcy55IC0gc3RhcnRQb3MueVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdC8vw6AgcXVlbCBlbmRyb2l0IG9uIGRvaXQgZmFpcmUgYXJyaXZlciBsZSBlbmRwb3MsIHJlbGF0aWYgYXUgZMOpYnV0IGR1IHBhdGhcblx0XHRcdFx0dmFyIHRhcmdldFJlbEVuZFBvcyA9IHtcblx0XHRcdFx0XHR4OiAtIHdvcmRFbmRQb3MueCxcblx0XHRcdFx0XHR5OiBhcHBlbmQuc2l6ZSAqIEVtaWxpZUZvbnQuZ2V0VXBwZXJMaW5lSGVpZ2h0KClcblx0XHRcdFx0fTtcblxuXHRcdFx0XHR2YXIgcmF0aW8gPSB7XG5cdFx0XHRcdFx0eCA6IHRhcmdldFJlbEVuZFBvcy54IC8gcmVsRW5kUG9zLngsXG5cdFx0XHRcdFx0eSA6IHRhcmdldFJlbEVuZFBvcy55IC8gcmVsRW5kUG9zLnksXG5cdFx0XHRcdH07XG5cdFx0XHRcdC8qY29uc29sZS5sb2coJ3N0YXJ0IGF0JyxhYnNTdGFydFBvcyk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHRhcmdldFJlbEVuZFBvcyk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJhdGlvLCBjdXJyZW50RW5kUG9zKTsqKi9cblxuXHRcdFx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0XHRcdG0uc2NhbGUocmF0aW8ueCwgcmF0aW8ueSwgYWJzU3RhcnRQb3MueCtzdGFydFBvcy54LCBhYnNTdGFydFBvcy55KTtcblx0XHRcdFx0bS50cmFuc2xhdGUoYWJzU3RhcnRQb3MueCwgYWJzU3RhcnRQb3MueSk7XG5cdFx0XHRcdGN1cnZlID0gY3VydmUuYXBwbHlNYXRyaXgobSk7XG5cblx0XHRcdFx0bGFzdFBhdGguYXBwZW5kKGN1cnZlKTtcblx0XHRcdFx0Ly9wYXRocy5hZGRQYXRoKGN1cnZlKTtcblx0XHRcdFx0XG5cdFx0XHR9XG5cblx0XHRcdHdvcmQucGF0aHMgPSBwYXRocztcblxuXHRcdFx0cmV0dXJuIHdvcmQ7XG5cblx0XHR9KTtcblxuXHRcdC8vdHJvdXZlIGxlIGJvdW5kaW5nIGJveCBkZSBsJ2Vuc2VtYmxlIGRlcyBwYXRocywgcydlbiBzZXJ2aXJhIHBvdXIgcydhc3N1cmVyIHF1ZSDDp2EgZW50cmUgdG91am91cnMgZGFucyBsZSBzdGFnZVxuXHRcdHZhciBib3VuZGluZyA9IHdvcmRzLnJlZHVjZShmdW5jdGlvbihnLCB3KXtcblx0XHRcdHcucGF0aHMuZ2V0UGF0aHMoKS5mb3JFYWNoKGZ1bmN0aW9uKHApe1xuXHRcdFx0XHRnLmFkZFBhdGgocCk7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBnO1xuXHRcdH0sIFBhdGhHcm91cC5mYWN0b3J5KCkpLmdldEJvdW5kaW5nKCk7XG5cblx0XHR2YXIgZWxlbWVudFNldCA9IGdldFN0YWdlKCkuc2V0KCk7XG5cblx0XHR2YXIgcmVzaXplU2V0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHZhciBzY2FsZSA9IFcgLyBib3VuZGluZy53aWR0aDtcblx0XHRcdHZhciB0YXJnZXRIID0gYm91bmRpbmcuaGVpZ2h0ICogc2NhbGU7XG5cdFx0XHRpZih0YXJnZXRIID4gSCl7XG5cdFx0XHRcdHNjYWxlID0gSCAvIGJvdW5kaW5nLmhlaWdodDtcblx0XHRcdH1cblx0XHRcdC8vY29uc29sZS5sb2coc2NhbGUpO1xuXHRcdFx0XG5cdFx0XHR2YXIgdGFyZ2V0TGVmdCA9ICgoVyAtIGJvdW5kaW5nLndpZHRoKSAvIDIpIC0gYm91bmRpbmcueDtcblx0XHRcdGVsZW1lbnRTZXQudHJhbnNmb3JtKCd0Jyt0YXJnZXRMZWZ0KycsMHMnK3NjYWxlKycsJytzY2FsZSsnLDAsMCcpO1xuXHRcdH07XG5cblx0XHR2YXIgdGwgPSB3b3Jkcy5yZWR1Y2UoZnVuY3Rpb24odGwsIHdvcmQsIGxpbmVOdW0pe1xuXHRcdFx0cmV0dXJuIERyYXdQYXRoLmdyb3VwKHdvcmQucGF0aHMuZ2V0UGF0aHMoKSwgZ2V0U3RhZ2UoKSwgZWxlbWVudFNldCwge1xuXHRcdFx0XHRweFBlclNlY29uZCA6IFNQRUVEICogd29yZC5zaXplLFxuXHRcdFx0XHRjb2xvciA6ICcjNDQ0NDQ0Jyxcblx0XHRcdFx0c3Ryb2tlV2lkdGggOiAyLFxuXHRcdFx0XHRlYXNpbmcgOiBnc2FwLlNpbmUuZWFzZUluT3V0XG5cdFx0XHR9LCB0bCk7XG5cdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe3BhdXNlZDp0cnVlLCBvblVwZGF0ZTogcmVzaXplU2V0fSkpO1xuXG5cdFx0dGwucGxheSgpO1xuXHR9O1xuXG5cdFx0XG5cdHZhciBidG4gPSAkKCcjY3RybCcpO1xuXG5cdGJ0bi5vbignY2xpY2suYWxwaGFiZXQnLCBmdW5jdGlvbigpe1xuXHRcdGxvYWRpbmcudGhlbihkb0RyYXcpO1xuXHR9KTtcblxuXG5cblx0Ly9wYXJzZSBsZXMgZWFzZXBvaW50cyBkZSBjaGFxdWUgbGV0dHJlLCBvdXRwdXQgZW4gSlNPTiAow6Agc2F2ZXIpXG5cdHZhciBwcmludEVhc2Vwb2ludHMgPSBmdW5jdGlvbigpe1xuXHRcdC8vRW1pbGllRm9udFxuXHRcdC8vRGVjb3JhdGl2ZUxpbmVzXG5cdFx0UGF0aEVhc2Vwb2ludHMoZ2V0U3RhZ2UoKSwgRW1pbGllRm9udC5nZXRBbGwoKSwgJCgnI2JycCcpLCBbVywgSF0pO1xuXHR9O1xuXG5cdHZhciBnZXRCcHIgPSAkKCcjZ2V0YnJwJyk7XG5cblx0Z2V0QnByLm9uKCdjbGljay5hbHBoYWJldCcsIGZ1bmN0aW9uKCl7XG5cdFx0bG9hZGluZy50aGVuKHByaW50RWFzZXBvaW50cyk7XG5cdH0pO1xuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9BbHBoYWJldCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZSgnanF1ZXJ5JyksIHJlcXVpcmUoJy4vUGF0aCcpLCByZXF1aXJlKCcuL1BhdGhHcm91cCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5sYWdyYW5nZS5kcmF3aW5nLlBhdGgsIHJvb3QubGFncmFuZ2UuZHJhd2luZy5QYXRoR3JvdXApO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBQYXRoLCBQYXRoR3JvdXApIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblxuXHR2YXIgc3BlY2lhbENoYXJzID0ge1xuXHRcdCdfeDJEXycgOiAnLScsXG5cdFx0J194MkVfJyA6ICcuJ1xuXHR9O1xuXG5cdHZhciBBbHBoYWJldCA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIHNldHRpbmdzO1xuXHRcdHZhciBzeW1ib2xzID0ge307XG5cblxuXHRcdHZhciBwYXJzZVNWRyA9IGZ1bmN0aW9uKGRhdGEpe1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXHRcdFx0dmFyIGRvYyA9ICQoZGF0YSk7XG5cdFx0XHR2YXIgbGF5ZXJzID0gZG9jLmZpbmQoJ2cnKTtcblx0XHRcdGxheWVycy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0dmFyIGxheWVyID0gJChlbCk7XG5cdFx0XHRcdHZhciBpZCA9IGxheWVyLmF0dHIoJ2lkJyk7XG5cdFx0XHRcdGlkID0gc3BlY2lhbENoYXJzW2lkXSB8fCBpZDtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhpZCk7XG5cdFx0XHRcdC8vaWYoaWQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXHRcdFx0XHR2YXIgcGF0aHMgPSBsYXllci5maW5kKCdwYXRoJyk7XG5cdFx0XHRcdGlmKHBhdGhzLmxlbmd0aD09PTApIHJldHVybjtcblxuXHRcdFx0XHR2YXIgc3ltYm9sID0gc3ltYm9sc1tpZF0gPSBuZXcgUGF0aEdyb3VwKGlkKTtcblxuXHRcdFx0XHRwYXRocy5lYWNoKGZ1bmN0aW9uKGksIGVsKXtcblx0XHRcdFx0XHR2YXIgcGF0aEVsID0gJChlbCk7XG5cdFx0XHRcdFx0dmFyIHAgPSBQYXRoLmZhY3RvcnkoIHBhdGhFbC5hdHRyKCdkJyksIHBhdGhFbC5hdHRyKCdpZCcpLCBudWxsLCBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXSAmJiBzZXR0aW5ncy5lYXNlcG9pbnRzW2lkXVtpXSkuc2NhbGUoc2V0dGluZ3Muc2NhbGUgfHwgMSk7XHRcdFx0XHRcblx0XHRcdFx0XHRzeW1ib2wuYWRkUGF0aCggcCApO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0fSk7XG5cblx0XHRcdC8vdHJvdXZlIGxlIHRvcCBhYnNvbHUgKHRvcCBkZSBsYSBsZXR0cmUgbGEgcGx1cyBoYXV0ZSlcblx0XHRcdHZhciB0b3AgPSBPYmplY3Qua2V5cyhzeW1ib2xzKS5yZWR1Y2UoZnVuY3Rpb24obWluLCBzeW1ib2xOYW1lKXtcblx0XHRcdFx0dmFyIHQgPSBzeW1ib2xzW3N5bWJvbE5hbWVdLmdldFRvcCgpO1xuXHRcdFx0XHRpZihtaW4gPT09IHVuZGVmaW5lZCB8fCBtaW4gPiB0KSB7XG5cdFx0XHRcdFx0bWluID0gdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbWluO1xuXHRcdFx0fSwgdW5kZWZpbmVkKTtcblx0XHRcdC8vY29uc29sZS5sb2coc3ltYm9scyk7XG5cblx0XHRcdC8vYWp1c3RlIGxlIGJhc2VsaW5lIGRlIGNoYXF1ZSBsZXR0cmVcblx0XHRcdE9iamVjdC5rZXlzKHN5bWJvbHMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRcdHN5bWJvbHNba2V5XS5zZXRPZmZzZXQoLTEgKiBzeW1ib2xzW2tleV0uZ2V0TGVmdCgpLCAtMSAqIHRvcCk7XG5cdFx0XHR9KTtcblxuXG5cdFx0fTtcblxuXHRcdHZhciBkb0xvYWQgPSBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIGxvYWRpbmcgPSAkLmFqYXgoe1xuXHRcdFx0XHR1cmwgOiBzZXR0aW5ncy5zdmdGaWxlLFxuXHRcdFx0XHRkYXRhVHlwZSA6ICd0ZXh0J1xuXHRcdFx0fSk7XG5cblx0XHRcdGxvYWRpbmcudGhlbihwYXJzZVNWRywgZnVuY3Rpb24oYSwgYiwgYyl7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdlcnJvciBsb2FkJyk7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGIpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGMpO1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGEucmVzcG9uc2VUZXh0KTtcblx0XHRcdH0pO1xuXG5cdFx0XHRyZXR1cm4gbG9hZGluZy5wcm9taXNlKCk7XG5cblx0XHR9O1xuXG5cdFx0XG5cdFx0dGhpcy5pbml0ID0gZnVuY3Rpb24ocykge1xuXHRcdFx0c2V0dGluZ3MgPSBzO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fTtcblxuXHRcdHRoaXMubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIGRvTG9hZCgpO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXRTeW1ib2wgPSBmdW5jdGlvbihsKXtcblx0XHRcdHJldHVybiBzeW1ib2xzW2xdO1xuXHRcdH07XG5cdFx0XG5cdFx0dGhpcy5nZXROU3BhY2UgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0V2lkdGgoKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5nZXRMb3dlckxpbmVIZWlnaHQgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHN5bWJvbHNbJ24nXSAmJiBzeW1ib2xzWyduJ10uZ2V0SGVpZ2h0KCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuZ2V0VXBwZXJMaW5lSGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiBzeW1ib2xzWydOJ10gJiYgc3ltYm9sc1snTiddLmdldEhlaWdodCgpO1xuXHRcdH07XG5cblx0XHR0aGlzLmdldEFsbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gc3ltYm9scztcblx0XHR9O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH07XG5cblx0dmFyIGluc3RhbmNlcyA9IHt9O1xuXHRBbHBoYWJldC5mYWN0b3J5ID0gZnVuY3Rpb24oc2V0dGluZ3Mpe1xuXHRcdHZhciBzdmcgPSBzZXR0aW5ncy5zdmdGaWxlO1xuXHRcdGluc3RhbmNlc1tzdmddID0gaW5zdGFuY2VzW3N2Z10gfHwgKG5ldyBBbHBoYWJldCgpKS5pbml0KHNldHRpbmdzKTtcblx0XHRyZXR1cm4gaW5zdGFuY2VzW3N2Z107XG5cdH07XG5cblx0cmV0dXJuIEFscGhhYmV0O1xuXHRcbn0pKTtcblxuXG4iLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9EcmF3UGF0aCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpLCByZXF1aXJlKCdnc2FwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KHJvb3QuXywgcm9vdC5SYXBoYWVsLCAocm9vdC5HcmVlblNvY2tHbG9iYWxzIHx8IHJvb3QpKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoXywgUmFwaGFlbCwgVHdlZW5NYXgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0Ly9nc2FwIGV4cG9ydHMgVHdlZW5NYXhcblx0dmFyIGdzYXAgPSB3aW5kb3cuR3JlZW5Tb2NrR2xvYmFscyB8fCB3aW5kb3c7XG5cblx0dmFyIGRlZmF1bHRzID0ge1xuXHRcdGNvbG9yOiAnIzAwMDAwMCcsXG5cdFx0c3Ryb2tlV2lkdGggOiAwLjYsXG5cdFx0cHhQZXJTZWNvbmQgOiAxMDAsIC8vc3BlZWQgb2YgZHJhd2luZ1xuXHRcdGVhc2luZyA6IGdzYXAuUXVhZC5lYXNlSW5cblx0fTtcblxuXHQvL2hlbHBlclxuXHR2YXIgc2hvd1BvaW50ID0gZnVuY3Rpb24ocG9pbnQsIHN0YWdlLCBlbFNldCwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdFx0aWYoZWxTZXQpIHtcblx0XHRcdGVsU2V0LnB1c2goZWwpO1xuXHRcdH1cblx0fTtcblxuXHR2YXIgRHJhd1BhdGggPSB7XG5cblx0XHRzaW5nbGUgOiBmdW5jdGlvbihwYXRoLCBzdGFnZSwgZWxTZXQsIHBhcmFtcyl7XG5cdFx0XHRcblx0XHRcdHZhciBzZXR0aW5ncyA9IF8uZXh0ZW5kKHt9LCBkZWZhdWx0cywgcGFyYW1zKTtcblx0XHRcdHZhciBwYXRoU3RyID0gcGF0aC5nZXRTVkdTdHJpbmcoKTtcblx0XHRcdHZhciBsZW5ndGggPSBwYXRoLmdldExlbmd0aCgpO1xuXG5cdFx0XHR2YXIgcHhQZXJTZWNvbmQgPSBzZXR0aW5ncy5weFBlclNlY29uZDtcblx0XHRcdHZhciB0aW1lID0gbGVuZ3RoIC8gcHhQZXJTZWNvbmQ7XG5cblx0XHRcdHZhciBhbmltID0ge3RvOiAwfTtcblx0XHRcdFxuXHRcdFx0dmFyIHVwZGF0ZSA9IChmdW5jdGlvbigpe1xuXHRcdFx0XHR2YXIgZWw7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBhbmltLnRvKTtcblx0XHRcdFx0XHRpZihlbCkgZWwucmVtb3ZlKCk7XG5cdFx0XHRcdFx0ZWwgPSBzdGFnZS5wYXRoKHBhdGhQYXJ0KTtcblx0XHRcdFx0XHRpZihlbFNldCkge1xuXHRcdFx0XHRcdFx0ZWxTZXQucHVzaChlbCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IHNldHRpbmdzLnN0cm9rZVdpZHRoLCBzdHJva2U6IHNldHRpbmdzLmNvbG9yfSk7XG5cdFx0XHRcdH07XG5cdFx0XHR9KSgpO1xuXG5cdFx0XHR2YXIgZWFzZVBvaW50cyA9IHBhdGguZ2V0RWFzZXBvaW50cygpO1xuXHRcdFx0Lypjb25zb2xlLmxvZyhlYXNlUG9pbnRzLmxlbmd0aCk7XG5cdFx0XHRlYXNlUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0dmFyIHAgPSBSYXBoYWVsLmdldFBvaW50QXRMZW5ndGgocGF0aFN0ciwgcG9zKTtcblx0XHRcdFx0c2hvd1BvaW50KHAsIHN0YWdlLCBlbFNldCwgJyNmZjAwMDAnLCAyKTtcblx0XHRcdH0pOy8qKi9cblx0XHRcdFxuXG5cdFx0XHR2YXIgbGFzdCA9IDA7XG5cdFx0XHRyZXR1cm4gZWFzZVBvaW50cy5yZWR1Y2UoZnVuY3Rpb24odGwsIGRpc3QpIHtcblx0XHRcdFx0dmFyIHRpbWUgPSAoZGlzdC1sYXN0KSAvIHB4UGVyU2Vjb25kO1xuXHRcdFx0XHRsYXN0ID0gZGlzdDtcblx0XHRcdFx0cmV0dXJuIHRsLnRvKGFuaW0sIHRpbWUsIHt0bzogZGlzdCwgZWFzZSA6IHNldHRpbmdzLmVhc2luZ30pO1xuXHRcdFx0fSwgbmV3IGdzYXAuVGltZWxpbmVNYXgoe1xuXHRcdFx0XHRvblVwZGF0ZSA6IHVwZGF0ZVxuXHRcdFx0fSkpLnRvKGFuaW0sICgobGVuZ3RoIC0gKGVhc2VQb2ludHMubGVuZ3RoICYmIGVhc2VQb2ludHNbZWFzZVBvaW50cy5sZW5ndGgtMV0pKSAvIHB4UGVyU2Vjb25kKSwge3RvOiBsZW5ndGgsIGVhc2UgOiBzZXR0aW5ncy5lYXNpbmd9KTtcblx0XHRcdFxuXHRcdH0sXG5cblx0XHRncm91cCA6IGZ1bmN0aW9uKHBhdGhzLCBzdGFnZSwgZWxTZXQsIHNldHRpbmdzLCB0bCkge1xuXHRcdFx0cmV0dXJuIHBhdGhzLnJlZHVjZShmdW5jdGlvbih0bCwgcGF0aCl7XG5cdFx0XHRcdHJldHVybiB0bC5hcHBlbmQoRHJhd1BhdGguc2luZ2xlKHBhdGgsIHN0YWdlLCBlbFNldCwgc2V0dGluZ3MpKTtcblx0XHRcdH0sIHRsIHx8IG5ldyBnc2FwLlRpbWVsaW5lTWF4KHtwYXVzZWQ6dHJ1ZX0pKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gRHJhd1BhdGg7XG5cdFxufSkpO1xuXG5cbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL0VtaWxpZUZvbnQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJy4vQWxwaGFiZXQnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3RvcnkobGFncmFuZ2UuZHJhd2luZy5BbHBoYWJldCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKEFscGhhYmV0KSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vb3JpZ2luYWwgc2NhbGUgZmFjdG9yXG5cdHZhciBFbWlsaWVGb250ID0ge1xuXHRcdHNjYWxlIDogMSxcblx0XHRzdmdGaWxlIDogJ2Fzc2V0cy9lbWlsaWVGb250LnN2ZycsXG5cdFx0Ly9QQVJTw4kgYXZlYyBsZSBoZWxwZXJcblx0XHRlYXNlcG9pbnRzIDoge1wiw5RcIjpbbnVsbCxbMC41NTg0OTE0OTE5NzYxODI0XV0sXCLDj1wiOltbMC4yOTAxNjM1NDk2MzYxMzg1NV1dLFwiw45cIjpbWzAuMjk2NTQwNzcwNTA3MjYyNV0sWzAuNTQ2NzgxNTA0NTYwOTg3N11dLFwiw4tcIjpbWzAuNTA3NzA5Njc4ODYwNDU0OV1dLFwiw4pcIjpbWzAuNTA3NzA5Njc4ODYwNDU0OV0sWzAuNTc3Mjk3NjA3NzEwOTkxNF1dLFwiw4hcIjpbWzAuNTA3NzA5Njc4ODYwNDU0OF1dLFwiw4lcIjpbWzAuNTA3NzA5Njc4ODYwNDU0OV1dLFwiw4dcIjpbbnVsbCxbMC4yNTk4NDExNTU0OTAzNzI4XV0sXCLDhFwiOltbMC42MzM2ODE0NzI0OTcxNTYzXV0sXCLDglwiOltbMC42MzM2ODE0NzI0OTcxNTM5XSxudWxsLFswLjUwOTA4ODY4MDc5NzI2NTNdXSxcIsOAXCI6W1swLjYzMzY4MTQ3MjQ5NzE1MTVdXSxcIlpcIjpbWzAuNDMzOTcyNTE2NjE0ODY4NzQsMC43NjQ1MTExNjkxNjYwOTAxXV0sXCJZXCI6W1swLjU3MjEyODg3NjU1ODIxNThdXSxcIldcIjpbWzAuMzkwNTkwMTkxNTY3MzAxOTYsMC41NzgxNDIzMDk5ODUwODEzXV0sXCJWXCI6W1swLjYwODQxMDU5MDI3MzAzNzNdXSxcIlVcIjpbWzAuNzAxOTk3MDQxNjg0MzE1Ml1dLFwiUlwiOltbMC43MjA5MjIzNTE2MjUyNTMzXV0sXCJPXCI6W1swLjc0Mzg4MzU4MTg0NzY0NzZdXSxcIk5cIjpbWzAuNTIyMDE0MjEzMTc4MzE5NSwwLjczOTY5NjI1MzQ5MTU0Nl1dLFwiTVwiOltbMC40MjMwMjY3NTY1NzQ5NDQ3LDAuNjAwNzY5MDkxMjcwMjk5NiwwLjgwMzM5NTM1MjgyMzAwNDJdXSxcIkxcIjpbWzAuNjc1NzkxMTk3MDk0NjIyXV0sXCJLXCI6W1swLjQxNzYxODQxNzY1OTM0NzRdLFswLjQ5NzQ2NzU4OTU5NjY2OTJdXSxcIkpcIjpbWzAuMzA1MjYyMDI4NjA5NTAwOTddXSxcIkhcIjpbWzAuNDQ0MTIzMTAwOTA2Nzg2OTddXSxcIkdcIjpbWzAuNTY1OTg5ODc1NDU1NzMxXV0sXCJFXCI6W1swLjUwNzcxNDIzOTQxOTA5M11dLFwiRFwiOltbMC43NDM3ODc2MDkzNDU5OTAzXV0sXCJCXCI6W1swLjc0NzI1ODEzOTM5NDgyODVdXSxcIkFcIjpbWzAuNjMzNjgxNDcyNDk3MTU1M11dLFwiw7RcIjpbWzAuODczMzk0Mjc1MDcwNzMyNF0sWzAuNTQ2NzgxNTA0NTYxMDE0OF1dLFwiw7ZcIjpbWzAuODczMzk0Mjc1MDcwNzI3Nl1dLFwiw69cIjpbWzAuNTM5NjQ5NzAxOTA0Mjg0Ml1dLFwiw65cIjpbWzAuNTM5NjQ5NzAxOTA0Mjg0N10sWzAuNTQ0NjY5ODQyOTQ3MDI4OV1dLFwiw6tcIjpbWzAuNDAxOTMzMjI1ODAxNDU1OF1dLFwiw6pcIjpbWzAuNDAxOTMzMjI1ODAxNDU1OF0sWzAuNTczMDg4MjMyMTA1MzY1M11dLFwiw6hcIjpbWzAuNDAxOTMzMjI1ODAxNDU2XV0sXCLDqVwiOltbMC40MDE5MzMyMjU4MDE0NTg0XV0sXCLDp1wiOltbMC41MzMwNTkxMTIyNjg1MzkzXSxbMC4yNTk4NDExNTU0OTAzNzE0Nl1dLFwiw6RcIjpbWzAuMzQ5NDA0MzA5ODI4MTk4MjYsMC44NDQ5MjMxNDkyMjA5MTU3XV0sXCLDolwiOltbMC4zNDk0MDQzMDk4MjgyMDAxNCwwLjg0NDkyMzE0OTIyMDkyMDNdLFswLjUxNDIxMjM3NjExMjAyMDFdXSxcIsOgXCI6W1swLjM0OTQwNDMwOTgyODIwMzAzLDAuODQ0OTIzMTQ5MjIwOTI3NF1dLFwielwiOltbMC4zNjU5MjIyNzcxOTQxNjYsMC42OTg1Nzg4OTI4MjUyMjU5XV0sXCJ5XCI6W1swLjEyNjgyMjE1OTMzNTA4MTQsMC4zNTAyNzA3MjU3ODI2MDU3NiwwLjY4NTQ0MzU3NTQ1Mzg5MjNdXSxcInhcIjpbWzAuNDE5MTk4MDgxMDc5MDE4NF1dLFwid1wiOltbMC4xNzgwMTMyOTkyMTMzMjI3MywwLjUwMTI0Nzk3NDEwMDY3MTksMC44MjkxNjcyMDk0OTM2MzQ4XV0sXCJ2XCI6W1swLjU1MzYwOTI0OTg1MjA4MzddXSxcInVcIjpbWzAuMjI3NTY4MTMyMDA5ODk5NTMsMC43MjQwODA0MjAwMzE0OTg1XV0sXCJ0XCI6W1swLjQ5MzcyOTAzMzA1NTE3MjEzXV0sXCJzXCI6W1swLjM1MTM5OTM4MTU5NTQ5MTMzLDAuNzczMDc4NjM5NTEwMDgwOV1dLFwiclwiOltbMC41NDYxMjQ2NTE2MDQ4OTM3XV0sXCJxXCI6W1swLjQyMDI3ODExMDk0NTA2MTgsMC45NDg1NDQzNDc2MTkwNjNdXSxcInBcIjpbWzAuMTM5Mjk0ODc2NTk4MTQ5MzUsMC43NTg2NTk1OTU3NTc3Nzc3XV0sXCJvXCI6W1swLjg3MTkwNzkwMDkyODc0ODVdXSxcIm5cIjpbWzAuNzY3MDE3MzY5NjQ4ODE1N11dLFwibVwiOltbMC41MjUzNjAyNTYxMjk4ODA2XV0sXCJsXCI6W1swLjQ5MjgyMjA0Njc0NTYyMDddXSxcImtcIjpbWzAuMzU4OTIyOTEwOTM4MzI1MSwwLjY3ODg5Mjk0NzgyMTMyODEsMC45MDk4Mjc4NDQwMDY0NTIxXV0sXCJqXCI6W1swLjE5MTAxMjE3MTM0Mzg3NTFdXSxcImlcIjpbWzAuNTM5NjQ5NzAxOTA0Mjg2Ml1dLFwiaFwiOltbMC4zOTQ4MzY3ODM3NzIwMjU2LDAuNzQ3NDc3MjcwMDQxNjk3MywwLjg4MzEwODIyNjI5OTI2MzNdXSxcImdcIjpbWzAuMTcxNTM5NTg4NzcyNjUxLDAuNDE0NTU0MDA2MjAwNTczMjZdXSxcImZcIjpbWzAuMjk0MDIxODQ2ODc3NzA1MiwwLjkxOTM2NjgxOTcxNDYxNTVdXSxcImRcIjpbWzAuMTU5MzU2OTU0MjcyOTc0MzYsMC42NTQyMDIyMzMzMzExNTc5XV0sXCJjXCI6W1swLjUzMzA1OTExMjI2ODUzOTRdXSxcImJcIjpbWzAuNDAzOTIyMDU4MjAxNDMwODQsMC45MzI4Njc2MTA2MDgwNjY2XV0sXCJhXCI6W1swLjM0OTQwNDMwOTgyODE5OTcsMC44NDQ5MjMxNDkyMjA5MTkzXV19XG5cdH07XG5cblxuXHRyZXR1cm4gIEFscGhhYmV0LmZhY3RvcnkoRW1pbGllRm9udCk7O1xuXHRcbn0pKTsiLCIvKiFcbiAqIE1vcmUgaW5mbyBhdCBodHRwOi8vbGFiLmxhLWdyYW5nZS5jYVxuICogQGF1dGhvciBNYXJ0aW4gVsOpemluYSA8bS52ZXppbmFAbGEtZ3JhbmdlLmNhPlxuICogQGNvcHlyaWdodCAyMDE0IE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBcbiAqIG1vZHVsZSBwYXR0ZXJuIDogaHR0cHM6Ly9naXRodWIuY29tL3VtZGpzL3VtZC9ibG9iL21hc3Rlci9hbWRXZWJHbG9iYWwuanNcbiovXG4oZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0dmFyIG5zUGFydHMgPSAnbGFncmFuZ2UvZHJhd2luZy9QYXRoJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ3JhcGhhZWwnKSk7XG4gIFx0fSBlbHNlIHtcblx0XHRuc1tuYW1lXSA9IGZhY3Rvcnkocm9vdC5SYXBoYWVsKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUmFwaGFlbCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcmVnID0gLyhbYS16XSkoWzAtOVxcc1xcLFxcLlxcLV0rKS9naTtcblx0XHRcblx0Ly9leHBlY3RlZCBsZW5ndGggb2YgZWFjaCB0eXBlXG5cdHZhciBleHBlY3RlZExlbmd0aHMgPSB7XG5cdFx0bSA6IDIsXG5cdFx0bCA6IDIsXG5cdFx0diA6IDEsXG5cdFx0aCA6IDEsXG5cdFx0YyA6IDYsXG5cdFx0cyA6IDRcblx0fTtcblxuXHR2YXIgUGF0aCA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKSB7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0XHQvL2lmKHN2ZykgY29uc29sZS5sb2coc3ZnLCBwYXJzZWQpO1xuXHRcdHRoaXMuZWFzZVBvaW50cyA9IGVhc2VQb2ludHMgfHwgW107XG5cdFx0Ly9jb25zb2xlLmxvZyhuYW1lLCBlYXNlUG9pbnRzKTtcblx0XHR0aGlzLl9zZXRQYXJzZWQocGFyc2VkIHx8IHRoaXMuX3BhcnNlKHN2ZykpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLl9zZXRQYXJzZWQgPSBmdW5jdGlvbihwYXJzZWQpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhcnNlZCk7XG5cdFx0dGhpcy5wYXJzZWQgPSBwYXJzZWQ7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuZ2V0Q3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jdWJpYyB8fCB0aGlzLl9wYXJzZUN1YmljKCk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS5nZXRMZW5ndGggPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gUmFwaGFlbC5nZXRUb3RhbExlbmd0aCh0aGlzLmdldFNWR1N0cmluZygpKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyBhbiBTVkcgc3RyaW5nIG9mIHRoZSBwYXRoIHNlZ2VtbnRzLiBJdCBpcyBub3QgdGhlIHN2ZyBwcm9wZXJ0eSBvZiB0aGUgcGF0aCwgYXMgaXQgaXMgcG90ZW50aWFsbHkgdHJhbnNmb3JtZWRcblx0Ki9cblx0UGF0aC5wcm90b3R5cGUuZ2V0U1ZHU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkLnJlZHVjZShmdW5jdGlvbihzdmcsIHNlZ21lbnQpe1xuXHRcdFx0cmV0dXJuIHN2ZyArIHNlZ21lbnQudHlwZSArIHNlZ21lbnQuYW5jaG9ycy5qb2luKCcsJyk7IFxuXHRcdH0sICcnKTtcblx0fTtcblxuXHQvKipcblx0R2V0cyB0aGUgYWJzb2x1dGUgcG9zaXRpb25zIGF0IHdoaWNoIHdlIGhhdmUgZWFzZSBwb2ludHMgKHdoaWNoIGFyZSBwcmVwYXJzZWQgYW5kIGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgcGF0aCdzIGRlZmluaXRpb25zKVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5nZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGwgPSB0aGlzLmdldExlbmd0aCgpO1xuXHRcdHJldHVybiB0aGlzLmVhc2VQb2ludHMubWFwKGZ1bmN0aW9uKGUpe1xuXHRcdFx0cmV0dXJuIGUgKiBsO1xuXHRcdH0pO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmdldFBvaW50ID0gZnVuY3Rpb24oaWR4KSB7XG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzLnBhcnNlZCk7XG5cdFx0cmV0dXJuIHRoaXMucGFyc2VkW2lkeF0gJiYgdGhpcy5wYXJzZWRbaWR4XS5hbmNob3JzO1xuXHR9O1xuXG5cdC8qKlxuXHRQYXJzZXMgYW4gU1ZHIHBhdGggc3RyaW5nIHRvIGEgbGlzdCBvZiBzZWdtZW50IGRlZmluaXRpb25zIHdpdGggQUJTT0xVVEUgcG9zaXRpb25zIHVzaW5nIFJhcGhhZWwucGF0aDJjdXJ2ZVxuXHQqL1xuXHRQYXRoLnByb3RvdHlwZS5fcGFyc2UgPSBmdW5jdGlvbihzdmcpIHtcblx0XHR2YXIgY3VydmUgPSBSYXBoYWVsLnBhdGgyY3VydmUoc3ZnKTtcblx0XHR2YXIgcGF0aCA9IGN1cnZlLm1hcChmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR0eXBlIDogcG9pbnQuc2hpZnQoKSxcblx0XHRcdFx0YW5jaG9ycyA6IHBvaW50XG5cdFx0XHR9O1xuXHRcdH0pO1xuXHRcdHJldHVybiBwYXRoO1xuXHR9O1xuXG5cdC8qKlxuXHRcdFBhcnNlcyBhIHBhdGggZGVmaW5lZCBieSBwYXJzZVBhdGggdG8gYSBsaXN0IG9mIGJlemllciBwb2ludHMgdG8gYmUgdXNlZCBieSBHcmVlbnNvY2sgQmV6aWVyIHBsdWdpbiwgZm9yIGV4YW1wbGVcblx0XHRUd2Vlbk1heC50byhzcHJpdGUsIDUwMCwge1xuXHRcdFx0YmV6aWVyOnt0eXBlOlwiY3ViaWNcIiwgdmFsdWVzOmN1YmljfSxcblx0XHRcdGVhc2U6UXVhZC5lYXNlSW5PdXQsXG5cdFx0XHR1c2VGcmFtZXMgOiB0cnVlXG5cdFx0fSk7XG5cdFx0Ki9cblx0UGF0aC5wcm90b3R5cGUuX3BhcnNlQ3ViaWMgPSBmdW5jdGlvbigpIHtcblx0XHQvL2NvbnNvbGUubG9nKHBhdGgpO1xuXHRcdC8vYXNzdW1lZCBmaXJzdCBlbGVtZW50IGlzIGEgbW92ZXRvXG5cdFx0dmFyIGFuY2hvcnMgPSB0aGlzLmN1YmljID0gdGhpcy5wYXJzZWQucmVkdWNlKGZ1bmN0aW9uKGFuY2hvcnMsIHNlZ21lbnQpe1xuXHRcdFx0dmFyIGEgPSBzZWdtZW50LmFuY2hvcnM7XG5cdFx0XHRpZihzZWdtZW50LnR5cGU9PT0nTScpe1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6YVsxXX0pO1xuXHRcdFx0fSBlbHNlIGlmKHNlZ21lbnQudHlwZT09PSdMJyl7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYW5jaG9yc1thbmNob3JzLmxlbmd0aC0xXS54LCB5OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLnl9KVxuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhbmNob3JzW2FuY2hvcnMubGVuZ3RoLTFdLngsIHk6IGFuY2hvcnNbYW5jaG9ycy5sZW5ndGgtMV0ueX0pXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhbmNob3JzLnB1c2goe3g6IGFbMF0sIHk6IGFbMV19KTtcblx0XHRcdFx0YW5jaG9ycy5wdXNoKHt4OiBhWzJdLCB5OiBhWzNdfSk7XG5cdFx0XHRcdGFuY2hvcnMucHVzaCh7eDogYVs0XSwgeTogYVs1XX0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGFuY2hvcnM7XG5cblx0XHR9LCBbXSk7XG5cblx0XHRyZXR1cm4gYW5jaG9ycztcblxuXHR9O1xuXG5cdC8vdHJvdXZlIGxlIGJvdW5kaW5nIGJveCBkJ3VuZSBsZXR0cmUgKGVuIHNlIGZpYW50IGp1c3RlIHN1ciBsZXMgcG9pbnRzLi4uIG9uIG5lIGNhbGN1bGUgcGFzIG91IHBhc3NlIGxlIHBhdGgpXG5cdFBhdGgucHJvdG90eXBlLmdldEJvdW5kaW5nID0gZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIFJhcGhhZWwucGF0aEJCb3godGhpcy5nZXRTVkdTdHJpbmcoKSk7XG5cdH07XG5cblxuXHRQYXRoLnByb3RvdHlwZS50cmFuc2xhdGUgPSBmdW5jdGlvbih4LCB5KSB7XG5cdFx0dmFyIG0gPSBSYXBoYWVsLm1hdHJpeCgpO1xuXHRcdG0udHJhbnNsYXRlKHgsIHkpO1xuXHRcdHZhciBzdmcgPSBSYXBoYWVsLm1hcFBhdGgodGhpcy5nZXRTVkdTdHJpbmcoKSwgbSk7XG5cdFx0cmV0dXJuIFBhdGguZmFjdG9yeShzdmcsIHRoaXMubmFtZSwgbnVsbCwgdGhpcy5lYXNlUG9pbnRzLnNsaWNlKDApKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgcGF0aCwgc2NhbGVkXG5cdFBhdGgucHJvdG90eXBlLnNjYWxlID0gUGF0aC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbihyYXRpbykge1xuXHRcdHJhdGlvID0gcmF0aW8gfHwgMTtcblx0XHR2YXIgbSA9IFJhcGhhZWwubWF0cml4KCk7XG5cdFx0bS5zY2FsZShyYXRpbyk7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KHN2ZywgdGhpcy5uYW1lLCBudWxsLCB0aGlzLmVhc2VQb2ludHMuc2xpY2UoMCkpO1xuXHR9O1xuXG5cdFBhdGgucHJvdG90eXBlLmFwcGx5TWF0cml4ID0gZnVuY3Rpb24obSl7XG5cdFx0dmFyIHN2ZyA9IFJhcGhhZWwubWFwUGF0aCh0aGlzLmdldFNWR1N0cmluZygpLCBtKTtcblx0XHRyZXR1cm4gUGF0aC5mYWN0b3J5KHN2ZywgdGhpcy5uYW1lLCBudWxsLCB0aGlzLmVhc2VQb2ludHMuc2xpY2UoMCkpO1xuXHR9OyBcblxuXHRQYXRoLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihwYXJ0LCBuYW1lKcKge1xuXHRcdC8vY29uc29sZS5sb2cocGFydCk7XG5cdFx0aWYobmFtZSkgdGhpcy5uYW1lICs9IG5hbWU7XG5cdFx0dmFyIG9yaWdMZW5ndGggPSB0aGlzLmdldExlbmd0aCgpO1xuXHRcdHRoaXMuX3NldFBhcnNlZCh0aGlzLnBhcnNlZC5jb25jYXQocGFydC5wYXJzZWQuc2xpY2UoMSkpKTtcblx0XHR2YXIgZmluYWxMZW5ndGggPSB0aGlzLmdldExlbmd0aCgpO1xuXHRcdC8vcmVtYXAgZWFzZXBvaW50cywgYXMgbGVuZ3RoIG9mIHBhdGggaGFzIGNoYW5nZWRcblx0XHR2YXIgbGVuZ3RoUmF0aW8gPSBmaW5hbExlbmd0aCAvIG9yaWdMZW5ndGg7XG5cdFx0dGhpcy5lYXNlUG9pbnRzID0gdGhpcy5lYXNlUG9pbnRzLm1hcChmdW5jdGlvbihlKXtcblx0XHRcdHJldHVybiBlIC8gbGVuZ3RoUmF0aW87XG5cdFx0fSk7XG5cdH07XG5cblx0UGF0aC5wcm90b3R5cGUuYWRkRWFzZXBvaW50ID0gZnVuY3Rpb24ocG9zKXtcblx0XHQvL2NvbnNvbGUubG9nKHRoaXMuZWFzZVBvaW50cywgcG9zKTtcblx0XHR0aGlzLmVhc2VQb2ludHMucHVzaChwb3MpO1xuXHR9O1xuXG5cdFBhdGguZmFjdG9yeSA9IGZ1bmN0aW9uKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKSB7XG5cdFx0cmV0dXJuIG5ldyBQYXRoKHN2ZywgbmFtZSwgcGFyc2VkLCBlYXNlUG9pbnRzKTtcblx0fTtcblxuXHRyZXR1cm4gUGF0aDtcblxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGhFYXNlcG9pbnRzJy5zcGxpdCgnLycpO1xuXHR2YXIgbmFtZSA9IG5zUGFydHMucG9wKCk7XG5cdHZhciBucyA9IG5zUGFydHMucmVkdWNlKGZ1bmN0aW9uKHByZXYsIHBhcnQpe1xuXHRcdHJldHVybiBwcmV2W3BhcnRdID0gKHByZXZbcGFydF0gfHwge30pO1xuXHR9LCByb290KTtcblx0aWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXHQgICAgLy8gQ29tbW9uSlNcblx0ICAgIG5zW25hbWVdID0gbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJ2pxdWVyeScpLCByZXF1aXJlKCdsb2Rhc2gnKSwgcmVxdWlyZSgncmFwaGFlbCcpKTtcbiAgXHR9IGVsc2Uge1xuXHRcdG5zW25hbWVdID0gZmFjdG9yeShyb290LmpRdWVyeSwgcm9vdC5fLCByb290LlJhcGhhZWwpO1xuXHR9XG59KHRoaXMsIGZ1bmN0aW9uICgkLCBfLCBSYXBoYWVsKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciBHRVRfREVGQVVMVFMgPSBmYWxzZTtcblxuXHR2YXIgZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuXHR2YXIgcmFkVG9EZWcgPSAxODAgLyBNYXRoLlBJO1xuXHR2YXIgdG9SYWRpYW5zID0gZnVuY3Rpb24oZGVncmVlcykge1xuXHQgIHJldHVybiBkZWdyZWVzICogZGVnVG9SYWQ7XG5cdH07XHQgXG5cdC8vIENvbnZlcnRzIGZyb20gcmFkaWFucyB0byBkZWdyZWVzLlxuXHR2YXIgdG9EZWdyZWVzID0gZnVuY3Rpb24ocmFkaWFucykge1xuXHQgIHJldHVybiByYWRpYW5zICogcmFkVG9EZWc7XG5cdH07XG5cblxuXHR2YXIgZGlzdGFuY2VUcmVzaG9sZCA9IDQwO1xuXHR2YXIgYW5nbGVUcmVzaG9sZCA9IHRvUmFkaWFucygxMik7XG5cblx0dmFyIHN0YWdlO1xuXG5cdC8vaGVscGVyXG5cdHZhciBzaG93UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sb3IsIHNpemUpe1xuXHRcdHZhciBlbCA9IHN0YWdlLmNpcmNsZShwb2ludC54LCBwb2ludC55LCBzaXplIHx8IDIpO1xuXHRcdGVsLmF0dHIoe2ZpbGw6IGNvbG9yIHx8ICcjZmYwMDAwJywgXCJzdHJva2Utd2lkdGhcIjowfSk7XG5cdFx0cmV0dXJuIGVsO1xuXHR9O1xuXG5cdHZhciBzaG93ID0gZnVuY3Rpb24ocGF0aERlZikge1xuXHRcdHZhciBwYXRoID0gcGF0aERlZi5nZXRTVkdTdHJpbmcoKTtcdFx0XHRcblx0XHR2YXIgZWwgPSBzdGFnZS5wYXRoKHBhdGgpO1xuXHRcdGVsLmF0dHIoe1wic3Ryb2tlLXdpZHRoXCI6IDMsIHN0cm9rZTogJyMwMDAwMDAnfSk7LyoqL1xuXHRcdHJldHVybiBlbDtcblx0fTtcblxuXHR2YXIgZmluZERlZmF1bHRzID0gZnVuY3Rpb24ocGF0aERlZil7XG5cdFx0dmFyIHBhdGhTdHIgPSBwYXRoRGVmLmdldFNWR1N0cmluZygpO1xuXHRcdHZhciBsZW5ndGggPSBwYXRoRGVmLmdldExlbmd0aCgpO1xuXHRcdHZhciBwb2ludFBvcyA9IFtdO1xuXHRcdFxuXHRcdFxuXHRcdHZhciBwcmVjaXNpb24gPSAxO1xuXHRcdHZhciBwcmV2O1xuXHRcdHZhciBhbGxQb2ludHMgPSBbXTtcblx0XHRmb3IodmFyIGk9cHJlY2lzaW9uOyBpPD1sZW5ndGg7IGkgKz0gcHJlY2lzaW9uKSB7XG5cdFx0XHQvL3ZhciBwYXRoUGFydCA9IFJhcGhhZWwuZ2V0U3VicGF0aChwYXRoU3RyLCAwLCBpKTtcblx0XHRcdHZhciBwID0gUmFwaGFlbC5nZXRQb2ludEF0TGVuZ3RoKHBhdGhTdHIsIGkpO1xuXHRcdFx0XG5cdFx0XHQvL2l0IHNlZW1zIHRoYXQgUmFwaGFlbCdzIGFscGhhIGlzIGluY29uc2lzdGVudC4uLiBzb21ldGltZXMgb3ZlciAzNjBcblx0XHRcdHZhciBhbHBoYSA9IE1hdGguYWJzKCBNYXRoLmFzaW4oIE1hdGguc2luKHRvUmFkaWFucyhwLmFscGhhKSkgKSk7XG5cdFx0XHRpZihwcmV2KSB7XG5cdFx0XHRcdHAuZGlmZiA9IE1hdGguYWJzKGFscGhhIC0gcHJldik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwLmRpZmYgPSAwO1xuXHRcdFx0fVxuXHRcdFx0cHJldiA9IGFscGhhO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwLmRpZmYpO1xuXG5cdFx0XHRpZihwLmRpZmYgPiBhbmdsZVRyZXNob2xkKSB7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coaSk7XG5cdFx0XHRcdHBvaW50UG9zLnB1c2goaSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vcC5jb21wdXRlZEFscGhhID0gYWxwaGE7XG5cdFx0XHQvL2FsbFBvaW50cy5wdXNoKHApO1xuXG5cdFx0fS8qKi9cblxuXHRcdCAvKlxuXHRcdC8vREVCVUcgXG5cdFx0Ly9maW5kIG1heCBjdXJ2YXR1cmUgdGhhdCBpcyBub3QgYSBjdXNwICh0cmVzaG9sZCBkZXRlcm1pbmVzIGN1c3ApXG5cdFx0dmFyIGN1c3BUcmVzaG9sZCA9IDQwO1xuXHRcdHZhciBtYXggPSBhbGxQb2ludHMucmVkdWNlKGZ1bmN0aW9uKG0sIHApe1xuXHRcdFx0cmV0dXJuIHAuZGlmZiA+IG0gJiYgcC5kaWZmIDwgY3VzcFRyZXNob2xkID8gcC5kaWZmIDogbTtcblx0XHR9LCAwKTtcblx0XHRjb25zb2xlLmxvZyhtYXgpO1xuXG5cdFx0dmFyIHByZXYgPSBbMCwwLDAsMF07XG5cdFx0YWxsUG9pbnRzLmZvckVhY2goZnVuY3Rpb24ocCl7XG5cdFx0XHR2YXIgciA9IE1hdGgucm91bmQoKHAuZGlmZiAvIG1heCkgKiAyNTUpO1xuXHRcdFx0dmFyIGcgPSAyNTUgLSBNYXRoLnJvdW5kKChwLmRpZmYgLyBtYXgpICogMjU1KTtcblx0XHRcdHZhciByZ2IgPSAncmdiKCcrcisnLCcrZysnLDApJztcblx0XHRcdGlmKHI+MTAwKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCc9PT09PT09PT09Jyk7XG5cdFx0XHRcdHByZXYuZm9yRWFjaChmdW5jdGlvbihwKXtjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEpO30pO1xuXHRcdFx0XHRjb25zb2xlLmxvZyhwLmNvbXB1dGVkQWxwaGEsIHAuYWxwaGEsIHJnYik7XG5cdFx0XHR9XG5cdFx0XHRwLnkgKz0gMTUwO1xuXHRcdFx0c2hvd1BvaW50KHAsIHJnYiwgMC41KTtcblx0XHRcdHByZXZbM10gPSBwcmV2WzJdO1xuXHRcdFx0cHJldlsyXSA9IHByZXZbMV07XG5cdFx0XHRwcmV2WzFdID0gcHJldlswXTtcblx0XHRcdHByZXZbMF0gPSBwO1xuXHRcdH0pO1xuXHRcdC8qKi9cblxuXHRcdC8vZmluZHMgZ3JvdXBzIG9mIHBvaW50cyBkZXBlbmRpbmcgb24gdHJlc2hvbGQsIGFuZCBmaW5kIHRoZSBtaWRkbGUgb2YgZWFjaCBncm91cFxuXHRcdHJldHVybiBwb2ludFBvcy5yZWR1Y2UoZnVuY3Rpb24ocG9pbnRzLCBwb2ludCl7XG5cblx0XHRcdHZhciBsYXN0ID0gcG9pbnRzW3BvaW50cy5sZW5ndGgtMV07XG5cdFx0XHRpZighbGFzdCB8fCBwb2ludCAtIGxhc3RbbGFzdC5sZW5ndGgtMV0gPiBkaXN0YW5jZVRyZXNob2xkKXtcblx0XHRcdFx0bGFzdCA9IFtwb2ludF07XG5cdFx0XHRcdHBvaW50cy5wdXNoKGxhc3QpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bGFzdC5wdXNoKHBvaW50KTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHBvaW50cztcblx0XHR9LCBbXSkubWFwKGZ1bmN0aW9uKHBvaW50cyl7XG5cdFx0XHRyZXR1cm4gcG9pbnRzW01hdGguZmxvb3IocG9pbnRzLmxlbmd0aC8yKV07XG5cdFx0fSk7XG5cdFx0XG5cdH07XG5cblx0dmFyIGFsbFBvaW50cyA9IFtdO1xuXHR2YXIgZWFzZVBvaW50cyA9IHt9O1xuXG5cdHZhciBjdXJyZW50O1xuXG5cdHZhciBnZXRFYXNlcG9pbnRzID0gZnVuY3Rpb24obGV0dGVyLCBwYXRoSWR4LCBwYXRoRGVmKXtcblx0XHRcblx0XHR2YXIgcGF0aCA9IHNob3cocGF0aERlZik7XG5cblx0XHQvL2FyZSBlYXNlIHBvaW50cyBhbHJlYWR5IHNldCBmb3IgdGhpcyBwYXRoP1xuXHRcdHZhciBwYXRoRWFzZVBvaW50cyA9IHBhdGhEZWYuZ2V0RWFzZXBvaW50cyh0cnVlKTsgXG5cdFx0aWYocGF0aEVhc2VQb2ludHMubGVuZ3RoID09PSAwICYmIEdFVF9ERUZBVUxUUykge1xuXHRcdFx0cGF0aEVhc2VQb2ludHMgPSBmaW5kRGVmYXVsdHMocGF0aERlZik7XG5cdFx0fVxuXG5cdFx0Ly9jb25zb2xlLmxvZyhlYXNlUG9pbnRzKTtcblx0XHR2YXIgbGVuZ3RoID0gcGF0aERlZi5nZXRMZW5ndGgoKTtcblx0XHR2YXIgcGF0aFN0ciA9IHBhdGhEZWYuZ2V0U1ZHU3RyaW5nKCk7XG5cdFx0XG5cblx0XHR2YXIgaW5hY3RpdmVDb2xvciA9ICcjMDBmZjAwJztcblx0XHR2YXIgYWN0aXZlQ29sb3IgPSAnI2ZmMjIwMCc7XG5cblx0XHR2YXIgYWRkUG9pbnQgPSBmdW5jdGlvbihwb3Mpe1xuXHRcdFx0aWYocG9zIDwgMSkgcG9zID0gcG9zICogbGVuZ3RoOy8vc2kgZW4gcHJjXG5cdFx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChwYXRoU3RyLCBwb3MpO1xuXHRcdFx0dmFyIHBvaW50ID0gc2hvd1BvaW50KHBPYmosIGluYWN0aXZlQ29sb3IsIDMpO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhwYXRoSWR4KTtcblx0XHRcdHBvaW50LmRhdGEoJ3BvcycsIHBvcyk7XG5cdFx0XHRwb2ludC5kYXRhKCdsZXR0ZXInLCBsZXR0ZXIpO1xuXHRcdFx0cG9pbnQuZGF0YSgncGF0aElkeCcsIHBhdGhJZHgpO1xuXHRcdFx0cG9pbnQuZGF0YSgncGF0aExlbmd0aCcsIGxlbmd0aCk7XG5cdFx0XHRwb2ludC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRcdHBvaW50LmRhdGEoJ3knLCBwT2JqLnkpO1xuXG5cdFx0XHRhbGxQb2ludHMucHVzaChwb2ludCk7XG5cblx0XHRcdHBvaW50LmNsaWNrKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFxuXHRcdFx0XHRhbGxQb2ludHMuZm9yRWFjaChmdW5jdGlvbihwKXtcblx0XHRcdFx0XHRwLmF0dHIoe2ZpbGw6IGluYWN0aXZlQ29sb3J9KTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0cG9pbnQuYXR0cih7ZmlsbDogYWN0aXZlQ29sb3J9KTtcblxuXHRcdFx0XHRjdXJyZW50ID0ge1xuXHRcdFx0XHRcdHBvaW50OiBwb2ludCxcblx0XHRcdFx0XHRwYXRoOiBwYXRoLFxuXHRcdFx0XHRcdHBhdGhEZWY6IHBhdGhEZWYsXG5cdFx0XHRcdFx0c3ZnIDogcGF0aFN0cixcblx0XHRcdFx0XHRsZXR0ZXIgOiBsZXR0ZXIsXG5cdFx0XHRcdFx0cGF0aElkeCA6IHBhdGhJZHhcblx0XHRcdFx0fTtcblxuXHRcdFx0fSk7XG5cdFx0fTtcblxuXHRcdHBhdGhFYXNlUG9pbnRzLmZvckVhY2goYWRkUG9pbnQpOy8qKi9cblxuXHRcdHBhdGguY2xpY2soZnVuY3Rpb24oKXtcblx0XHRcdC8vY29uc29sZS5sb2coJ2FkZCcpO1xuXHRcdFx0YWRkUG9pbnQoMCk7XG5cdFx0fSk7XG5cdFx0XG5cblx0XHRyZXR1cm4gcGF0aEVhc2VQb2ludHM7XG5cblx0fTtcblxuXHR2YXIgbW92ZUN1cnJlbnQgPSBmdW5jdGlvbihkaXN0KSB7XG5cdFx0dmFyIHAgPSBjdXJyZW50LnBvaW50O1xuXHRcdHZhciBwb3MgPSBwLmRhdGEoJ3BvcycpO1xuXHRcdHBvcyArPSBkaXN0O1xuXHRcdHZhciBtYXggPSBjdXJyZW50LnBhdGhEZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0aWYocG9zIDwgMCkgcG9zID0gMDtcblx0XHRpZihwb3MgPiBtYXgpIHBvcyA9IG1heDtcblx0XHRwLmRhdGEoJ3BvcycsIHBvcyk7XG5cblx0XHR2YXIgcE9iaiA9IFJhcGhhZWwuZ2V0UG9pbnRBdExlbmd0aChjdXJyZW50LnN2ZywgcG9zKTtcblxuXHRcdHZhciB4ID0gcC5kYXRhKCd4Jyk7XG5cdFx0dmFyIHkgPSBwLmRhdGEoJ3knKTtcblx0XHR2YXIgZGVsdGFYID0gcE9iai54IC0geDtcblx0XHR2YXIgZGVsdGFZID0gcE9iai55IC0geTtcblxuXHRcdC8qcC5kYXRhKCd4JywgcE9iai54KTtcblx0XHRwLmRhdGEoJ3knLCBwT2JqLnkpOy8qKi9cblxuXHRcdHAudHJhbnNmb3JtKCd0JyArIGRlbHRhWCArICcsJyArIGRlbHRhWSk7XG5cdFx0cHJpbnRKU09OKCk7XG5cblx0fTtcblxuXG5cdCQod2luZG93KS5vbigna2V5ZG93bi5lYXNlJywgZnVuY3Rpb24oZSl7XG5cdFx0Ly9jb25zb2xlLmxvZyhlLndoaWNoLCBjdXJyZW50KTtcblx0XHR2YXIgTEVGVCA9IDM3O1xuXHRcdHZhciBVUCA9IDM4O1xuXHRcdHZhciBSSUdIVCA9IDM5O1xuXHRcdHZhciBET1dOID0gNDA7XG5cdFx0dmFyIERFTCA9IDQ2O1xuXG5cdFx0aWYoY3VycmVudCkge1xuXHRcdFx0c3dpdGNoKGUud2hpY2gpIHtcblx0XHRcdFx0Y2FzZSBMRUZUOlxuXHRcdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRtb3ZlQ3VycmVudCgtMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgRE9XTjpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoLTEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBSSUdIVDpcblx0XHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0bW92ZUN1cnJlbnQoMSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgVVA6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdG1vdmVDdXJyZW50KDEwKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBERUw6XG5cdFx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHZhciBpZHggPSBhbGxQb2ludHMuaW5kZXhPZihjdXJyZW50LnBvaW50KTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGlkeCk7XG5cdFx0XHRcdFx0Y3VycmVudC5wb2ludC5yZW1vdmUoKTtcblx0XHRcdFx0XHRhbGxQb2ludHMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhhbGxQb2ludHMpO1xuXHRcdFx0XHRcdGN1cnJlbnQgPSBudWxsO1xuXHRcdFx0XHRcdHByaW50SlNPTigpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0fSk7XG5cblx0dmFyIHByaW50Tm9kZTtcblx0dmFyIHByaW50SlNPTiA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBqc29uID0gYWxsUG9pbnRzLnJlZHVjZShmdW5jdGlvbihqc29uLCBwb2ludCl7XG5cblx0XHRcdHZhciBsZXR0ZXIgPSBwb2ludC5kYXRhKCdsZXR0ZXInKTtcblx0XHRcdHZhciBwYXRoSWR4ID0gcG9pbnQuZGF0YSgncGF0aElkeCcpO1xuXHRcdFx0dmFyIGwgPSBwb2ludC5kYXRhKCdwYXRoTGVuZ3RoJyk7XG5cblx0XHRcdHZhciBwYXRocyA9IGpzb25bbGV0dGVyXSA9IGpzb25bbGV0dGVyXSB8fCBbXTtcblx0XHRcdHZhciBlYXNlcG9pbnRzID0gcGF0aHNbcGF0aElkeF0gPSBwYXRoc1twYXRoSWR4XSB8fCBbXTtcblx0XHRcdGVhc2Vwb2ludHMucHVzaChwb2ludC5kYXRhKCdwb3MnKSAvIGwpO1xuXHRcdFx0ZWFzZXBvaW50cy5zb3J0KGZ1bmN0aW9uKGEsIGIpe1xuXHRcdFx0XHRyZXR1cm4gYSAtIGI7XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBqc29uO1xuXHRcdH0sIHt9KTtcblx0XHRwcmludE5vZGUudGV4dChKU09OLnN0cmluZ2lmeShqc29uKSk7XG5cdH07XG5cblx0cmV0dXJuIGZ1bmN0aW9uKHMsIGdyb3Vwcywgbm9kZSwgZGltKXtcblx0XHRzdGFnZSA9IHM7XG5cdFx0dmFyIHBhZCA9IDIwO1xuXHRcdHZhciBhdmFpbFcgPSBkaW1bMF0gLSBwYWQ7XG5cblx0XHR2YXIgZ3JvdXBNYXhIZWlnaHQgPSBPYmplY3Qua2V5cyhncm91cHMpLnJlZHVjZShmdW5jdGlvbihtaW4sIGdyb3VwTmFtZSl7XG5cdFx0XHR2YXIgdCA9IGdyb3Vwc1tncm91cE5hbWVdLmdldEhlaWdodCgpO1xuXHRcdFx0aWYobWluID09PSB1bmRlZmluZWQgfHwgdCA+IG1pbikge1xuXHRcdFx0XHRtaW4gPSB0O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9LCB1bmRlZmluZWQpO1xuXHRcdFxuXHRcdHZhciB0b3BMZWZ0ID0ge3g6cGFkLCB5OnBhZH07XG5cdFx0T2JqZWN0LmtleXMoZ3JvdXBzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpe1xuXHRcdFx0dmFyIGdyb3VwID0gZ3JvdXBzW25hbWVdO1xuXHRcdFx0Ly9jb25zb2xlLmxvZyhncm91cCk7XG5cdFx0XHR2YXIgZW5kTGVmdCA9IHRvcExlZnQueCArIGdyb3VwLmdldFdpZHRoKCkgKyBwYWQ7XG5cblx0XHRcdGlmKGVuZExlZnQgPiBhdmFpbFcpIHtcblx0XHRcdFx0dG9wTGVmdC54ID0gcGFkO1xuXHRcdFx0XHR0b3BMZWZ0LnkgKz0gcGFkICsgZ3JvdXBNYXhIZWlnaHQ7XG5cdFx0XHRcdGVuZExlZnQgPSB0b3BMZWZ0LnggKyBncm91cC5nZXRXaWR0aCgpICsgcGFkO1xuXHRcdFx0fVxuXG5cblx0XHRcdHZhciB0aGlzRWFzZSA9IGdyb3VwLnBhdGhzLm1hcChmdW5jdGlvbihwLCBpZHgpe1xuXHRcdFx0XHRwID0gcC50cmFuc2xhdGUodG9wTGVmdC54LCB0b3BMZWZ0LnkpO1xuXHRcdFx0XHRyZXR1cm4gZ2V0RWFzZXBvaW50cyhuYW1lLCBpZHgsIHApO1xuXHRcdFx0fSk7XG5cblxuXHRcdFx0dG9wTGVmdC54ID0gZW5kTGVmdDtcdFx0XHRcblxuXHRcdH0pO1xuXHRcdC8vY29uc29sZS5sb2coZWFzZVBvaW50cyk7XG5cblx0XHRwcmludE5vZGUgPSBub2RlO1xuXHRcdHByaW50SlNPTigpO1xuXHR9O1xuXG5cdFxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1BhdGhHcm91cCcuc3BsaXQoJy8nKTtcblx0dmFyIG5hbWUgPSBuc1BhcnRzLnBvcCgpO1xuXHR2YXIgbnMgPSBuc1BhcnRzLnJlZHVjZShmdW5jdGlvbihwcmV2LCBwYXJ0KXtcblx0XHRyZXR1cm4gcHJldltwYXJ0XSA9IChwcmV2W3BhcnRdIHx8IHt9KTtcblx0fSwgcm9vdCk7XG5cdGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblx0ICAgIC8vIENvbW1vbkpTXG5cdCAgICBuc1tuYW1lXSA9IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KCk7XG5cdH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgUGF0aEdyb3VwID0gZnVuY3Rpb24obmFtZSl7XG5cdFx0dGhpcy5uYW1lID0gbmFtZTtcblx0fTtcblxuXHRQYXRoR3JvdXAucHJvdG90eXBlLnNldEJvdW5kaW5nID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLmJvdW5kaW5nID0gdGhpcy5wYXRocy5yZWR1Y2UoZnVuY3Rpb24oYm91bmRpbmcsIHBhdGgpe1xuXHRcdFx0dmFyIHBhdGhCb3VuZGluZyA9IHBhdGguZ2V0Qm91bmRpbmcoKTtcblxuXHRcdFx0Ym91bmRpbmcgPSBib3VuZGluZyB8fCBwYXRoQm91bmRpbmc7XG5cdFx0XHRib3VuZGluZy54ID0gYm91bmRpbmcueCA8IHBhdGhCb3VuZGluZy54ID8gYm91bmRpbmcueCA6ICBwYXRoQm91bmRpbmcueDtcblx0XHRcdGJvdW5kaW5nLnkgPSBib3VuZGluZy55IDwgcGF0aEJvdW5kaW5nLnkgPyBib3VuZGluZy55IDogIHBhdGhCb3VuZGluZy55O1xuXHRcdFx0Ym91bmRpbmcueDIgPSBib3VuZGluZy54MiA+IHBhdGhCb3VuZGluZy54MiA/IGJvdW5kaW5nLngyIDogcGF0aEJvdW5kaW5nLngyO1xuXHRcdFx0Ym91bmRpbmcueTIgPSBib3VuZGluZy55MiA+IHBhdGhCb3VuZGluZy55MiA/IGJvdW5kaW5nLnkyIDogcGF0aEJvdW5kaW5nLnkyO1xuXHRcdFx0Ym91bmRpbmcud2lkdGggPSBib3VuZGluZy54MiAtIGJvdW5kaW5nLng7XG5cdFx0XHRib3VuZGluZy5oZWlnaHQgPSBib3VuZGluZy55MiAtIGJvdW5kaW5nLnk7XG5cdFx0XHRyZXR1cm4gYm91bmRpbmc7XG5cdFx0fSwgdW5kZWZpbmVkKSB8fCB7fTtcblx0XHQvL2lmIHRoZXJlJ3MgYSBlbmRQb2ludCBwb2ludCB0aGF0IGlzIHNldCwgdXNlIGl0cyBjb29yZGluYXRlcyBhcyBib3VuZGluZ1xuXHRcdGlmKHRoaXMuZW5kUG9pbnQpIHtcblx0XHRcdHZhciBhbmNob3JzID0gdGhpcy5lbmRQb2ludC5nZXRQb2ludCgwKTtcblx0XHRcdHRoaXMuYm91bmRpbmcueDIgPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHRcdGlmKHRoaXMuc3RhcnRQb2ludCkge1xuXHRcdFx0dmFyIGFuY2hvcnMgPSB0aGlzLnN0YXJ0UG9pbnQuZ2V0UG9pbnQoMCk7XG5cdFx0XHR0aGlzLmJvdW5kaW5nLnggPSBhbmNob3JzWzBdO1xuXHRcdFx0dGhpcy5ib3VuZGluZy53aWR0aCA9IHRoaXMuYm91bmRpbmcueDIgLSB0aGlzLmJvdW5kaW5nLng7XG5cdFx0fVxuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuYWRkUGF0aCA9IGZ1bmN0aW9uKHApe1xuXHRcdHRoaXMucGF0aHMgPSB0aGlzLnBhdGhzIHx8IFtdO1xuXHRcdGlmKHAubmFtZSAmJiBwLm5hbWUuaW5kZXhPZignZW5kJykgPT09IDApIHtcblx0XHRcdHRoaXMuZW5kUG9pbnQgPSBwO1xuXHRcdH0gZWxzZSBpZihwLm5hbWUgJiYgcC5uYW1lLmluZGV4T2YoJ3N0YXJ0JykgPT09IDApIHtcblx0XHRcdHRoaXMuc3RhcnRQb2ludCA9IHA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMucGF0aHMucHVzaChwKTtcblx0XHR9XG5cdFx0dGhpcy5zZXRCb3VuZGluZygpO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0SGVpZ2h0ID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy5oZWlnaHQ7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRXaWR0aCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcud2lkdGg7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0Qm90dG9uID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gdGhpcy5ib3VuZGluZy55Mjtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRUb3AgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nLnk7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0TGVmdCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDtcblx0fTtcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRSaWdodCA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRpbmcueDI7XG5cdH07XG5cdFBhdGhHcm91cC5wcm90b3R5cGUuZ2V0Qm91bmRpbmcgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiB0aGlzLmJvdW5kaW5nO1xuXHR9O1xuXG5cdFBhdGhHcm91cC5wcm90b3R5cGUuc2V0T2Zmc2V0ID0gZnVuY3Rpb24oeCwgeSl7XG5cdFx0dGhpcy5wYXRocyA9IHRoaXMucGF0aHMubWFwKGZ1bmN0aW9uKHBhdGgpIHtcblx0XHRcdC8vY29uc29sZS5sb2cocGF0aC5wYXJzZWRbMF0uYW5jaG9yc1sxXSk7XG5cdFx0XHRwYXRoID0gcGF0aC50cmFuc2xhdGUoeCwgeSk7XG5cdFx0XHQvL2NvbnNvbGUubG9nKHBhdGgucGFyc2VkWzBdLmFuY2hvcnNbMV0pO1xuXHRcdFx0cmV0dXJuIHBhdGg7XG5cdFx0fSk7XG5cdFx0dGhpcy5lbmRQb2ludCA9ICh0aGlzLmVuZFBvaW50ICYmIHRoaXMuZW5kUG9pbnQudHJhbnNsYXRlKHgsIHkpKTtcblx0XHR0aGlzLnN0YXJ0UG9pbnQgPSAodGhpcy5zdGFydFBvaW50ICYmIHRoaXMuc3RhcnRQb2ludC50cmFuc2xhdGUoeCwgeSkpO1xuXHRcdHRoaXMuc2V0Qm91bmRpbmcoKTtcblx0fTtcblxuXHQvL3JldHVybnMgYSBuZXcgUGF0aEdyb3VwLCBzY2FsZWRcblx0UGF0aEdyb3VwLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKXtcblx0XHRpZighdGhpcy5wYXRocykgcmV0dXJuIHRoaXM7XG5cdFx0dmFyIHNjYWxlZCA9IG5ldyBQYXRoR3JvdXAodGhpcy5uYW1lKTtcblx0XHR0aGlzLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCl7XG5cdFx0XHRzY2FsZWQuYWRkUGF0aChwYXRoLnNjYWxlKHNjYWxlKSk7XG5cdFx0fSk7XG5cblx0XHRzY2FsZWQuZW5kUG9pbnQgPSAodGhpcy5lbmRQb2ludCAmJiB0aGlzLmVuZFBvaW50LnNjYWxlKHNjYWxlKSk7XG5cdFx0c2NhbGVkLnN0YXJ0UG9pbnQgPSAodGhpcy5zdGFydFBvaW50ICYmIHRoaXMuc3RhcnRQb2ludC5zY2FsZShzY2FsZSkpO1xuXHRcdHNjYWxlZC5zZXRCb3VuZGluZygpO1xuXHRcdHJldHVybiBzY2FsZWQ7XG5cdH07XG5cblx0UGF0aEdyb3VwLnByb3RvdHlwZS5nZXRQYXRocyA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuIHRoaXMucGF0aHM7XG5cdH07XG5cblx0UGF0aEdyb3VwLmZhY3RvcnkgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiBuZXcgUGF0aEdyb3VwKCk7XG5cdH07XG5cblx0cmV0dXJuIFBhdGhHcm91cDtcblxufSkpO1xuXG5cbiIsIi8qIVxuICogTW9yZSBpbmZvIGF0IGh0dHA6Ly9sYWIubGEtZ3JhbmdlLmNhXG4gKiBAYXV0aG9yIE1hcnRpbiBWw6l6aW5hIDxtLnZlemluYUBsYS1ncmFuZ2UuY2E+XG4gKiBAY29weXJpZ2h0IDIwMTQgTWFydGluIFbDqXppbmEgPG0udmV6aW5hQGxhLWdyYW5nZS5jYT5cbiAqIFxuICogbW9kdWxlIHBhdHRlcm4gOiBodHRwczovL2dpdGh1Yi5jb20vdW1kanMvdW1kL2Jsb2IvbWFzdGVyL2FtZFdlYkdsb2JhbC5qc1xuKi9cbihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuXHR2YXIgbnNQYXJ0cyA9ICdsYWdyYW5nZS9kcmF3aW5nL1ZlY3RvcldvcmQnLnNwbGl0KCcvJyk7XG5cdHZhciBuYW1lID0gbnNQYXJ0cy5wb3AoKTtcblx0dmFyIG5zID0gbnNQYXJ0cy5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgcGFydCl7XG5cdFx0cmV0dXJuIHByZXZbcGFydF0gPSAocHJldltwYXJ0XSB8fCB7fSk7XG5cdH0sIHJvb3QpO1xuXHRpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cdCAgICAvLyBDb21tb25KU1xuXHQgICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoJy4vUGF0aEdyb3VwJykpO1xuICBcdH0gZWxzZSB7XG5cdFx0bnNbbmFtZV0gPSBmYWN0b3J5KGxhZ3JhbmdlLmRyYXdpbmcuUGF0aEdyb3VwKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoUGF0aEdyb3VwKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdFxuXHR2YXIgVmVjdG9yV29yZCA9IHtcblxuXHRcdGdldFBhdGhzIDogZnVuY3Rpb24oYWxwaGFiZXQsIHRleHQpIHtcblx0XHRcdHZhciByaWdodCA9IDA7XG5cdFx0XHR2YXIgbGluZXMgPSBuZXcgUGF0aEdyb3VwKHRleHQpO1xuXHRcdFx0dmFyIGNvbnRpbnVvdXMgPSBmYWxzZTtcblxuXHRcdFx0Ly9sb29wIGZvciBldmVyeSBjaGFyYWN0ZXIgaW4gbmFtZSAoc3RyaW5nKVxuXHRcdFx0Zm9yKHZhciBpPTA7IGk8dGV4dC5sZW5ndGg7IGkrKynCoHtcblx0XHRcdFx0dmFyIGxldHRlciA9IHRleHRbaV07XG5cdFx0XHRcdGlmKGxldHRlciA9PT0gJyAnKSB7XG5cdFx0XHRcdFx0cmlnaHQgKz0gYWxwaGFiZXQuZ2V0TlNwYWNlKCk7XG5cdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhciBsZXR0ZXJEZWYgPSBhbHBoYWJldC5nZXRTeW1ib2wobGV0dGVyKSB8fCBhbHBoYWJldC5nZXRTeW1ib2woJy0nKTtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhsZXR0ZXIsIGxldHRlckRlZik7XG5cblx0XHRcdFx0XG5cdFx0XHRcdHZhciBsZXR0ZXJKb2luZWRFbmQgPSBmYWxzZTtcblx0XHRcdFx0bGV0dGVyRGVmLnBhdGhzLmZvckVhY2goZnVuY3Rpb24ocGF0aCkge1xuXHRcdFx0XHRcdHZhciBkZWYgPSBwYXRoLnRyYW5zbGF0ZShyaWdodCwgMCk7XG5cdFx0XHRcdFx0dmFyIGpvaW5lZFN0YXJ0ID0gZGVmLm5hbWUgJiYgZGVmLm5hbWUuaW5kZXhPZignam9pbmEnKSA+IC0xO1xuXHRcdFx0XHRcdHZhciBqb2luZWRFbmQgPSAvam9pbihhPyliLy50ZXN0KGRlZi5uYW1lKTtcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGxldHRlciwgam9pbmVkU3RhcnQsIGpvaW5lZEVuZCk7XG5cdFx0XHRcdFx0bGV0dGVySm9pbmVkRW5kID0gbGV0dGVySm9pbmVkRW5kIHx8IGpvaW5lZEVuZDtcblx0XHRcdFx0XHRpZihqb2luZWRTdGFydCAmJiBjb250aW51b3VzKSB7XG5cdFx0XHRcdFx0XHQvL2FwcGVuZCBhdSBjb250aW51b3VzXG5cdFx0XHRcdFx0XHRjb250aW51b3VzLmFwcGVuZChkZWYsIGxldHRlcik7XG5cblx0XHRcdFx0XHRcdC8vYWpvdXRlIGxlcyBlYXNlcG9pbnRzIGRlIGNlIHBhdGhcblx0XHRcdFx0XHRcdHZhciB0b3RhbExlbmd0aCA9IGNvbnRpbnVvdXMuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHR2YXIgcGF0aFN0YXJ0UG9zID0gdG90YWxMZW5ndGggLSBkZWYuZ2V0TGVuZ3RoKCk7XG5cdFx0XHRcdFx0XHRkZWYuZ2V0RWFzZXBvaW50cygpLmZvckVhY2goZnVuY3Rpb24ocG9zKXtcblx0XHRcdFx0XHRcdFx0Y29udGludW91cy5hZGRFYXNlcG9pbnQoKHBhdGhTdGFydFBvcyArIHBvcykgLyB0b3RhbExlbmd0aCk7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdH0gZWxzZSBpZihqb2luZWRFbmQgJiYgIWNvbnRpbnVvdXMpIHtcblx0XHRcdFx0XHRcdC8vc3RhcnQgdW4gbm91dmVhdSBsaW5lIChjbG9uZSBlbiBzY2FsYW50IGRlIDEpXG5cdFx0XHRcdFx0XHRjb250aW51b3VzID0gZGVmLmNsb25lKCk7XG5cdFx0XHRcdFx0XHRjb250aW51b3VzLm5hbWUgPSBsZXR0ZXI7XG5cdFx0XHRcdFx0XHRsaW5lcy5hZGRQYXRoKGNvbnRpbnVvdXMpO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRsaW5lcy5hZGRQYXRoKGRlZik7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYoIWxldHRlckpvaW5lZEVuZCkge1xuXHRcdFx0XHRcdFx0Y29udGludW91cyA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHR9KTtcblx0XHRcdFx0XG5cdFx0XHRcdHJpZ2h0ICs9IGxldHRlckRlZi5nZXRXaWR0aCgpO1xuXHRcdFx0XHQvL2NvbnNvbGUudGFibGUoW3tsZXR0ZXI6bmFtZVtpXSwgbGV0dGVyV2lkdGg6IGxldHRlci5nZXRXaWR0aCgpLCB0b3RhbDpyaWdodH1dKTtcdFxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGxpbmVzO1xuXG5cdFx0fVxuXHR9O1xuXG5cdHJldHVybiBWZWN0b3JXb3JkO1xuXHRcbn0pKTtcblxuXG4iXX0=
