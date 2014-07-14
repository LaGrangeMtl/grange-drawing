

(function($, createjs, SVGUtils){

	var addPath = function(path, stage) {
		
		var shape = new createjs.Shape();
		stage.addChild(shape);

		var g = shape.graphics;
		g.clear().setStrokeStyle(1, 'round', 'round').beginStroke('#aaaaaa');

		var lastPoint = [0, 0];
		var allPoints = [];
		var allBeziers = [];
		path.forEach(function(segment){

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
					allBeziers.push([anchors[0], anchors[1], lastPoint[0], lastPoint[1], '#ff0000']);
					allBeziers.push([anchors[2], anchors[3], anchors[4], anchors[5], '#0000ff']);
					break;
				case 'C':
					fcn = 'bezierCurveTo';
					allBeziers.push([anchors[0], anchors[1], lastPoint[0], lastPoint[1]]);
					allBeziers.push([anchors[2], anchors[3], anchors[4], anchors[5]]);
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

		stage.update();
		return stage;

	};



	var getStage = function(){
		var canvas = document.getElementById("rootCanvas");
		var stage = new createjs.Stage(canvas);
		return stage;
	};

	
	var stage = getStage();
	

	var pointsShape = new createjs.Shape();
	stage.addChild(pointsShape);
	var pg = pointsShape.graphics;

	var addPoint = (function(){
		var last;
		return function(x, y) {
			/*pg.beginFill(createjs.Graphics.getRGB(255,0,0));
			pg.drawCircle(x, y, 1);
			pg.endFill();/**/

			if(last) {
				//pg.setStrokeStyle(0.3, 2, 2).beginStroke('#000000');
				//pg.moveTo(last[0], last[1]);
				pg.lineTo(x, y);
				//pg.endStroke();/**/
			} else {

				pg.setStrokeStyle(0.3, 2, 2, 1).beginStroke('#000000');
				pg.moveTo(x, y);
			}

			stage.update();
			last = [x, y];
		};
	}());

	var doLoad = function(){
		var loading = $.ajax({
			url:'paths.svg'
		});
		loading.then(function(data){
		//console.log(data);
			var doc = $(data);
			var paths = doc.find('path');

			paths.each(function(i, el){
				var pathEl = $(el);
				var pathDef = pathEl.attr('d');
				//if(i !== 0) return;
				var path = SVGUtils.parsePath(pathDef);

				//addPath(path, stage);

				//if(i===4){
					var cubic = SVGUtils.toCubic(path);
					//console.log(cubic);
					var drawFcn = function(){
						var sprite = {x:0,y:0};
						TweenMax.to(sprite, 500, {
							bezier:{type:"cubic", values:cubic},
							ease:Quad.easeInOut,
							useFrames : true,
							onUpdate : function(){
								addPoint(sprite.x, sprite.y);
							}
						});
					};

					$('#ctrl').off('.line').on('click.line', drawFcn);
				//}

				//console.log(path);
			});

		}, function(a, b, c){
			console.log(a);
		});

	};

	$('#draw').on('click.line', doLoad);

	



})(jQuery, createjs, lagrange.drawing.SVGUtils);