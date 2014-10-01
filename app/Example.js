	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var EmilieFont = require('./lagrange/drawing/EmilieFont.js');
	var DrawPath = require('./lagrange/drawing/DrawPath');
	var VectorWord = require('./lagrange/drawing/VectorWord');
	var Alphabet = require('./lagrange/drawing/Alphabet');
	var PathEasepoints = require('./lagrange/drawing/PathEasepoints');/**/
	var TweenMax = require('gsap');

	var gsap = window.GreenSockGlobals || window;

	var W = 1200;
	var CENTER = W / 2;
	var H = 1600;
	var T = 50;
	var LINE_HEIGHT = 1.2;//em
	var SPEED = 250;//px per sec


	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	function Shuffle(o) {
		for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	Shuffle(names);
	//names.length = 1;/**/
	var words = [
		{
			text : 'a',
			size : 0.8
		},
		{
			text : 'aaaaaaa ',//names.pop(),
			size : 1
		}
	];

	//names = ['aksttef'];

	var emily = Alphabet.factory().init(EmilieFont);
	var emilyLoading = emily.load();

	var guidis = Alphabet.factory().init({
		scale : 1,
		svgFile : 'assets/guidis.svg',
		easepoints : {}
	});
	var guidisLoading = guidis.load();

	var loading = $.when(emilyLoading, guidisLoading);


	var getStage = (function(){
		var stage;
		var init = function(){
			return Raphael("svg", W, H);
		};
		return function(){
			return stage = stage || init();
		}
	})();

		//helper
	var showPoint = function(point, color, size){
		var el = getStage().circle(point.x, point.y, size || 2);
		el.attr({fill: color || '#ff0000', "stroke-width":0});
		return el;
	};

	var doDraw = function(){
		var top = T;
		var tl = words.reduce(function(tl, params, lineNum){

			var word = VectorWord.getPaths(emily, params.text);

			word = word.scale(params.size);

			//center text
			var width = word.getWidth();
			var left = (W - width) / 2;

			word.setOffset(left, top);
			
			top += word.getHeight() * LINE_HEIGHT;

			//ajoute le guidi sur le dernier mot
			if(lineNum === words.length -1) {
				var curve = guidis.getSymbol('wordDecorationEnd');
				curve = curve.getPaths()[0];
				
				var curveStr = curve.getSVGString();
				//trouve les points de départ et d'arrivée de la curve
				var startPos = Raphael.getPointAtLength(curveStr, 0);
				var endPos = Raphael.getPointAtLength(curveStr, curve.getLength());
				/*console.log(startPos);
				console.log(endPos);/**/

				var guidiOrigH = endPos.y - startPos.y;
				var finalBottom = top+guidiOrigH;

				var wordPaths = word.getPaths();
				//trouve le path le plus à droite dans les lettres
				var lastPath = wordPaths.reduce(function(last, cur){
					last = last || cur;
					var bbLast = last.getBounding();
					var bbCur = cur.getBounding();

					if(bbLast.y2 < bbCur.y2){
						last = cur;
					}

					return last;
				}, null);
				console.log(word.name);

				var bb = lastPath.getBounding();
				//console.log('bb', bb);
				var targetStartPos = {
					x: bb.x2 - startPos.x,
					y: bb.y2 - startPos.y
				};

				/*showPoint({x:bb.x2, y:bb.y2}, '#22ff00');
				showPoint(targetStartPos, '#ff0000');/**/

				//à combien de distance le boute est du début
				var currentEndPos = {
					x: endPos.x - startPos.x,
					y: endPos.y - startPos.y
				};

				//à quel endroit on doit faire arriver le endpos, relatif au début du path
				var targetEndPos = {
					x: CENTER - bb.x2,
					y: finalBottom - bb.y2
				};

				var ratio = {
					x : targetEndPos.x / currentEndPos.x,
					y : targetEndPos.y / currentEndPos.y,
				};
				console.log('start at',targetStartPos);
				console.log(targetEndPos);
				console.log(ratio, currentEndPos);

				var m = Raphael.matrix();
				m.scale(ratio.x, ratio.y, targetStartPos.x+startPos.x, targetStartPos.y);
				m.translate(targetStartPos.x, targetStartPos.y);
				curve = curve.applyMatrix(m);


				/*var m = Raphael.matrix();
				m.scale(ratio.x, ratio.y, targetStartPos.x+startPos.x, targetStartPos.y);
				curve = curve.applyMatrix(m);/**/

				//var lastPath = wordPaths[wordPaths.length-1];
				console.log(lastPath.name);

				lastPath.append(curve);
				//word.addPath(curve);
				
			}

			return DrawPath.group(word.getPaths(), getStage(), {
				pxPerSecond : SPEED * params.size,
				color : '#444444',
				strokeWidth : 2,
				easing : gsap.Sine.easeInOut
			}, tl);
			

		}, new gsap.TimelineMax({paused:true}));

		tl.play();


	};

		
	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		loading.then(doDraw);
	});



	//parse les easepoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		PathEasepoints(getStage(), Alphabet.getAll(), $('#brp'), [W, H]);

	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		loading.then(printEasepoints);
	});

