	
	var $ = require('jquery');
	var Raphael = require('raphael');
	var DrawPath = require('app/rose/drawing/DrawPath.js');
	var VectorWord = require('app/rose/drawing/VectorWord.js');
	var Alphabet = require('app/rose/drawing/Alphabet.js');


	var W = 1400;
	var H = 1200;

	var scaleFactor = 1;

	var names = ["Jessica Wanning","Julia Rockwell","Carol Hubbard","Ronald Candy","John Newton","Elvis Nicole","Gloria Weaver","Julia Cronkite","Mother Rogers","Chevy Irwin","Eddie Allen","Norman Jackson","Peter Rogers","Weird Chase","Colin Mays","Napoleon Martin","Edgar Simpson","Mohammad McCartney","Liberace Williams","Fields Burnett","Steve Ashe","Carrie Charles","Tommy Pasteur","Eddie Silverstone","Oprah Ashe","Ray Ball","Jim Diana","Michelangelo Eastwood","George Simpson","Alicia Austen","Jessica Nicole","Marilyn Everett","Keith Eastwood","Pablo Eastwood","Peyton Luther","Mozart Armstrong","Michael Burnett","Keith Glover","Elizabeth Child","Miles Astaire","Andy Edison","Martin Lennon","Tom Piccaso","Beyonce Disney","Peter Clinton","Henry Kennedy","Paul Child","Lewis Sagan","Michelangelo Lee","Marilyn Fisher"];
	names.length = 6;/**/


	var getStage = (function(){
		var stage;
		var init = function(){
			return Raphael("svg", W, H);
		};
		return function(){
			return stage = stage || init();
		}
	})();


	var loading = Alphabet.init();	
	loading.then(function(){
		var incr = H / names.length;
		names.forEach(function(name, k){
			//traceName(name, 0, k * incr);

			var paths = VectorWord.getPaths(name, 0, k * incr, scaleFactor);

			DrawPath.group(paths, getStage(), {pxPerSecond:200, color:'#ff0000', strokeWidth:2});

		});

	});