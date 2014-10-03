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


