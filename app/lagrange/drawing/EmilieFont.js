(function (root, factory) {
	var nsParts = 'lagrange/drawing/EmilieFont'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory(require('./Alphabet'));
  	} else {
		ns[name] = factory(lagrange.drawing.Alphabet);
	}
}(this, function (Alphabet) {
	"use strict";

	//original scale factor
	var EmilieFont = {
		scale : 1,
		svgFile : 'assets/emilieFont.svg',
		//PARSÉ avec le helper
		easepoints : {"Ô":[null,[16]],"Ï":[[136]],"Î":[[93],[16]],"Ë":[[159]],"Ê":[[159],[17]],"È":[[159]],"É":[[159]],"Ç":[null,[13]],"Ä":[[189]],"Â":[[189],null,[15]],"À":[[189]],"Z":[[193,340]],"Y":[[329]],"W":[[227,336]],"V":[[231]],"U":[[317]],"R":[[289]],"O":[[300]],"N":[[247,350]],"M":[[238,338,452]],"L":[[220]],"K":[[115],[122]],"J":[[132]],"H":[[142]],"G":[[321]],"E":[[159]],"D":[[370]],"B":[[453]],"A":[[189]],"ô":[[155],[16]],"ö":[[155]],"ï":[[42]],"î":[[42],[16]],"ë":[[40]],"ê":[[40],[17]],"è":[[40]],"é":[[40]],"ç":[[72],[13]],"ä":[[55,133]],"â":[[55,133],[15]],"à":[[55,133]],"z":[[110,210]],"y":[[42,116,227]],"x":[[42]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[123]],"k":[[129,244,327]],"j":[[52]],"i":[[42]],"h":[[131,248,293]],"g":[[60,145]],"f":[[134,419]],"d":[[57,234]],"c":[[72]],"b":[[126,291]],"a":[[55,133]]}
	};


	return  Alphabet.factory(EmilieFont);;
	
}));