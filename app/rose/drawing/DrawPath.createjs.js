/*!
 * More info at http://lab.la-grange.ca
 * @author Martin Vézina <m.vezina@la-grange.ca>
 * @copyright 2014 Martin Vézina <m.vezina@la-grange.ca>
 * 
 * module pattern : https://github.com/umdjs/umd/blob/master/amdWebGlobal.js
*/
(function (root, factory) {
	var nsParts = 'rose/drawing/DrawPath'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof define === 'function' && define.amd) {
		define(
			'rose/drawing/DrawPath',//must be a string, not a var
			[
				'createjs'
			], function (createjs) {
			return (ns[name] = factory(createjs));
		});
	} else {
		ns[name] = factory(createjs);
	}
}(this, function (createjs) {
	"use strict";

	var defaults = {
		color: '#000000',
		strokeWidth : 2
	};


	var clearShape = function(obj){
		if(obj.shape) {
			var stage = obj.shape.getStage();
			stage.removeChild(obj.shape);
		}
	};


	var DrawPath = {

		//prend la string des points SVG
		setDef : function(def) {
			this.def = def;
		},

		setColor : function(c){
			this.color = c;
		},
		setStrokeWitdh : function(w){
			this.strokeWidth = w;
		},

		setStage : function(stage) {
			this.stage = stage;
		},

		//ajoute un path au stage en one-shot
		show : function() {
			clearShape(this);
			var shape = this.shape = new createjs.Shape();
			this.stage.addChild(shape);

			var g = shape.graphics;
			g.clear().setStrokeStyle(this.strokeWidth || defaults.strokeWidth, 'round', 'round').beginStroke(this.color || defaults.color);

			var lastPoint = [0, 0];
			var allPoints = [];
			//var allBeziers = [];
			this.def.parsed.forEach(function(segment){

				var type = segment.type;
				var fcn = false;

				//clone
				var anchors = segment.anchors.slice(0);

				switch(type) {
					case 'M':
						fcn = 'moveTo';
						break;
					case 'S':
						//fcn = 'curveTo';
						fcn = 'bezierCurveTo';
						/*allBeziers.push([anchors[0], anchors[1], lastPoint[0], lastPoint[1], '#ff0000']);
						allBeziers.push([anchors[2], anchors[3], anchors[4], anchors[5], '#0000ff']);/**/
						break;
					case 'C':
						fcn = 'bezierCurveTo';
						/*allBeziers.push([anchors[0], anchors[1], lastPoint[0], lastPoint[1]]);
						allBeziers.push([anchors[2], anchors[3], anchors[4], anchors[5]]);/**/
						break;
					case 'L':
						fcn = 'lineTo';
						break;
				}
				if(fcn) {
					g[fcn].apply(g, anchors);
				}

				var lastY = anchors.pop();
				var lastX = anchors.pop();

				lastPoint = [lastX, lastY];
				allPoints.push([lastX, lastY]);


			});
			g.endStroke();

			this.stage.update();
			return shape;

		},

		//initialise un path pour tracer
		draw : function(steps) {
			steps = Math.ceil(steps) || 500;
			clearShape(this);
			var shape = this.shape = new createjs.Shape();
			this.stage.addChild(shape);
			var g = shape.graphics;
			var stage = this.stage;

			var w = this.strokeWidth || defaults.strokeWidth;
			var c = this.color || defaults.color;

			var addPoint = (function(){
				var previous;
				return function(x, y) {
					/*g.beginFill(createjs.Graphics.getRGB(255,0,0));
					g.drawCircle(x, y, 1);
					g.endFill();/**/

					if(previous) {
						//g.setStrokeStyle(0.3, 2, 2).beginStroke('#000000');
						//g.moveTo(last[0], last[1]);
						g.lineTo(x, y);
						//g.endStroke();/**/
					} else {

						g.setStrokeStyle(w, 2, 2, 1).beginStroke(c);
						g.moveTo(x, y);
					}

					stage.update();
					previous = [x, y];
				};
			}());

			var cubic = this.def.getCubic();
			var sprite = {x:cubic[0].x,y:cubic[0].y};
			addPoint(sprite.x, sprite.y);
			var deferred = $.Deferred();
			TweenMax.to(sprite, steps, {
				bezier:{ type : "cubic", values : cubic},
				ease:Linear.easeOut,
				useFrames : true,
				onUpdate : function(){
					addPoint(sprite.x, sprite.y);
				},
				onComplete : function(){
					this.show();
					deferred.resolve();
				}.bind(this)
			});

			return deferred.promise();

		}

	};

	DrawPath.factory = function() {
		return Object.create(DrawPath);
	};

	return DrawPath;
	
}));


