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


