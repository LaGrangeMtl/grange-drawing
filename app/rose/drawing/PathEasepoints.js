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


