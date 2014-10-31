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
		this.svg = null;
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
		return this.svg = this.svg || this.parsed.reduce(function(svg, segment){
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

	Path.prototype.getSvgSub = function(start, end, absolute) {
		start = start || 0;
		end = end || 1;
		var subL = end - start;
		var l = this.getLength();
		if(!absolute) {
			start *=l;
			end *= l;
		}
		return Raphael.getSubpath(this.getSVGString(), start, end);
	};

	Path.prototype.getSub = function(start, end, absolute) {
		var prcStart = absolute ? start / this.getLength() : start;
		var subL = end - start;
		var ease = this.easePoints.map(function(e){
			return (e - prcStart) / subL;
		}).filter(function(e){
			return e > 0 && e < 1;
		});/**/
		return Path.factory(this.getSvgSub(start, end, absolute), this.name, null, ease);
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
		return this.applyMatrix(m);
	};

	Path.prototype.rotate = function(deg) {
		var m = Raphael.matrix();
		m.rotate(deg);
		return this.applyMatrix(m);
	};

	//returns a new path, scaled
	Path.prototype.scale = Path.prototype.clone = function(ratiox, ratioy) {
		ratiox = ratiox || 1;
		var m = Raphael.matrix();
		m.scale(ratiox, ratioy || ratiox);
		return this.applyMatrix(m);
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


	Path.prototype.reverse = function(){
		var svg = this.getSVGString();
		var pathPieces = svg.match(/[MLHVCSQTA][-0-9.,]*/gi);
	    var reversed = '';
	    var skip = true;
	    var previousPathType;
	    for (var i = pathPieces.length - 1; i >= 0; i--) {
	        var pathType = pathPieces[i].substr(0, 1);
	        var pathValues = pathPieces[i].substr(1);
	        switch (pathType) {
	            case 'M':
	            case 'L':
	                reversed += (skip ? '' : pathType) + pathValues;
	                skip = false;
	                break;
	            case 'C':
	                var curvePieces = pathValues.match(/^([-0-9.]*,[-0-9.]*),([-0-9.]*,[-0-9.]*),([-0-9.]*,[-0-9.]*)$/);
	                reversed += curvePieces[3] + pathType + curvePieces[2] + ',' + curvePieces[1] + ',';
	                skip = true;
	                break;
	            default:
	                alert('Not implemented: ' + pathType);
	                break;
	        }
	    }
	    var ease = this.easePoints.map(function(e){
			return 1 - e;
		});
		//console.log(reversed);
	    return Path.factory('M'+reversed, this.name, null, ease);
	
	};

	Path.factory = function(svg, name, parsed, easePoints) {
		return new Path(svg, name, parsed, easePoints);
	};

	return Path;

}));


