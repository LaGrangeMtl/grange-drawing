/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/DrawGroup'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof define === 'function' && define.amd) {
		define(
			'rose/drawing/DrawGroup',//must be a string, not a var
			[
				'rose/drawing/DrawPath'
			], function (DrawPath) {
			return (ns[name] = factory(DrawPath));
		});
	} else {
		ns[name] = factory(rose.drawing.DrawPath);
	}
}(this, function (DrawPath) {
	"use strict";
	

	var DrawGroup = function(){
		var stage;
		this.setStage = function(s) {
			stage = s;
		};
		
		this.trace = function(lines, speed) {
			var drawLine = function(){
				var line = lines.shift();
				if(!line) return;

				var length = line.getLength();//in px
				var steps = length / 2;//px per frames

				var path = DrawPath.factory();
				path.setDef(line);
				path.setStage(stage);
				path.draw(steps).then(drawLine);
			};
			drawLine();
		};
		return this;
	};

	DrawGroup.factory = function(o) {
		return DrawGroup.apply(o || {});
	};

	return DrawGroup;
	
}));


