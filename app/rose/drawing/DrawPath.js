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
		var el = stage.circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
	};

	var DrawPath = function(){

		var settings = {};
		var pathDef;
		var stage;

		var toRadians = function(degrees) {
		  return degrees * Math.PI / 180;
		};
		 
		// Converts from radians to degrees.
		var toDegrees = function(radians) {
		  return radians * 180 / Math.PI;
		};


		//prend la string des points SVG
		this.init = function(path, stageParam, params) {
			pathDef = path;
			stage = stageParam;
			_.extend(settings, defaults, params);
			return this;
		};

		this.show = function() {
			var path = pathDef.getSVGString();			
			var el = stage.path(path);
			el.attr({"stroke-width": settings.strokeWidth, stroke: settings.color});/**/
		};

		this.draw = function(pxPerSecond){
			var pathStr = pathDef.getSVGString();
			var length = pathDef.getLength();
			pxPerSecond = pxPerSecond || settings.pxPerSecond;
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
			
			var breakPoints = (function(){

				
				var distanceTreshold = 40;
				var angleTreshold = toRadians(12);

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
					showPoint(p, stage, rgb, 0.5);
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
				showPoint(pObj, stage, '#00ff00', 3);
			});/**/

			var last = 0;
			var tl = breakPoints.reduce(function(tl, dist) {
				var time = (dist-last) / pxPerSecond;
				last = dist;
				return tl.to(anim, time, {to: dist, ease : settings.easing});
			}, new gsap.TimelineMax({
				onUpdate : update
			})).to(anim, ((length - (breakPoints[breakPoints.length-1]||0)) / pxPerSecond), {to: length, ease : settings.easing});

			return tl;

			return gsap.TweenMax.to(anim, time, {
				to : length,
				onUpdate : update,
				ease : settings.easing
			});
			
		};

		return this;

	};

	DrawPath.factory = function(o) {
		return DrawPath.apply(o || {});
	};

	/**
	Static. Returns a timelinemax of all the paths in the group, drawn one at a time.
	*/
	DrawPath.group = function(paths, stage, settings, onComplete) {

		return paths.reduce(function(tl, path){
			var drawingPath = DrawPath.factory().init(path, stage, settings);
			return tl.append(drawingPath.draw());
		}, new gsap.TimelineMax({ onComplete: (onComplete || function(){}) }));
	};

	return DrawPath;
	
}));


