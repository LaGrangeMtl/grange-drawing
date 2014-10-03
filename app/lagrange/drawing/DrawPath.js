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


