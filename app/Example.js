	
	var $ = require('jquery');
	var PathEasepoints = require('./lagrange/drawing/PathEasepoints');/**/
	
	var WriteNames = require('./WriteNames');
	var Stage = require('./lagrange/drawing/Stage');



	var docReady = (function(){
		var d = $.Deferred();

		$(document).ready(function(){
			d.resolve()
		});

		return d.promise();

	})();

	var ready = $.when(docReady, WriteNames.load());

	var doDraw = function(){
		var container = $('#svg');

		var words = [
			{
				text : 'Hello',
				size : 1
			},
			{
				text : 'Montréal',
				size : 1.2,
				append : function(DecorativeLines){
					return {
						symbol: DecorativeLines.getSymbol('wordDecorationEnd').getPaths()[0],
						size: 1 //height in em
					};
				}
			}
		];


		var stage = Stage.getStage('svg');
		var tl = WriteNames.getTimeline(words, stage);
		tl.play();
	};



	var btn = $('#ctrl');

	btn.on('click.alphabet', function(){
		ready.then(doDraw);
	});


	//parse les easepoints de chaque lettre, output en JSON (à saver)
	var printEasepoints = function(){
		//EmilieFont
		//DecorativeLines

		var EmilieFont = require('./lagrange/drawing/EmilieFont.js');
		var DecorativeLines = require('./DecorativeLines');
		PathEasepoints(Stage.getStage('svg'), DecorativeLines.getAll(), $('#brp'));
	};

	var getBpr = $('#getbrp');

	getBpr.on('click.alphabet', function(){
		ready.then(printEasepoints);
	});

