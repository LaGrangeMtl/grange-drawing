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
			], function () {
			return (ns[name] = factory());
		});
	} else {
		ns[name] = factory();
	}
}(this, function () {
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
		//console.log(svg, parsed);
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
		this.parsed = parsed;
		this.findBounding();
	};

	Path.prototype.getCubic = function() {
		return this.cubic || this.parseCubic();
	};

	// cubic helper formula at t interval
	var CubicN = function(t, a, b, c, d) {
		var t2 = t * t;
		var t3 = t2 * t;
		return a + (-a * 3 + t * (3 * a - a * t)) * t
		+ (3 * b + t * (-6 * b + b * 3 * t)) * t
		+ (c * 3 - c * 3 * t) * t2
		+ d * t3;
	};
	Path.prototype.getLength = function() {
		
		
		var lastPoint = [0, 0];

		var length = this.parsed.reduce(function(l, segment){
			var type = segment.type;
			var fcn = false;

			//clone
			var anchors = segment.anchors.slice(0);
			//console.log(segment.anchors);
			switch(type) {
				case 'M':
					break;
				case 'S':
				case 'C':
					
					for(var i=0; i<50; i++) {
						var x = CubicN(i/50, lastPoint[0], segment.anchors[0], segment.anchors[2], segment.anchors[4]);
						var y = CubicN(i/50, lastPoint[1], segment.anchors[1], segment.anchors[3], segment.anchors[5]);
						//console.log(x, y);
						l += Math.sqrt(Math.pow(y - lastPoint[1], 2) + Math.pow(x - lastPoint[0], 2));
					}

					break;
				case 'L':
					l += Math.sqrt(Math.pow(anchors[1] - lastY, 2) + Math.pow(anchors[0] - lastX, 2));
					break;
			}

			var lastY = anchors.pop();
			var lastX = anchors.pop();

			lastPoint = [lastX, lastY];
			return l;
		}, 0);

		//console.log(this.name, length);

		return length;
		

		
	};

	/**
	Parses an SVG path string to a list of segment definitions, notably to be used by easel
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

			//console.log(m);
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
		var anchors = this.cubic = [];
		this.parsed.forEach(function(segment){
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

		});

		return anchors;

	};

	//trouve le bounding box d'une lettre (en se fiant juste sur les points... on ne calcule pas ou passe le path)
	Path.prototype.findBounding = function() {
		var bounding = this.bounding = [];
		this.parsed.forEach(function(p){
			var anchors = p.anchors;
			var point;
			if(anchors.length === 2) {
				point = [anchors[0], anchors[1]];
			} else if(anchors.length === 6) {
				point = [anchors[4], anchors[5]];
			}
			bounding = refineBounding(bounding, point);
		});
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


