/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'lagrange/drawing/SVGUtils'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof define === 'function' && define.amd) {
		define(
			'lagrange/drawing/SVGUtils',//must be a string, not a var
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

	return {
		/**
		Parses an SVG path string to a list of segment definitions, notably to be used by easel
		*/
		parsePath : function(pathString) {
			var m;
			var lastPoint;
			var lastBezierAnchor;
			var rawDefs = [];
			

			while(m = reg.exec(pathString)) {
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
			//console.log(rawDefs);

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
		},

		/**
		Parses a path defined by parsePath to a list of bezier points to be used by Greensock Bezier plugin, for example
		TweenMax.to(sprite, 500, {
			bezier:{type:"cubic", values:cubic},
			ease:Quad.easeInOut,
			useFrames : true
		});
		*/
		toCubic : function(path) {
			//console.log(path);
			//assumed first element is a moveto
			var anchors = [];
			path.forEach(function(segment){
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

		}

	};

}));


