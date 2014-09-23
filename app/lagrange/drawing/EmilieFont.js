(function (root, factory) {
	var nsParts = 'lagrange/drawing/EmilieFont'.split('/');
	var name = nsParts.pop();
	var ns = nsParts.reduce(function(prev, part){
		return prev[part] = (prev[part] || {});
	}, root);
	if (typeof exports === 'object') {
	    // CommonJS
	    module.exports = factory();
  	} else {
		ns[name] = factory();
	}
}(this, function () {
	"use strict";

	//original scale factor
	var EmilieFont = {
		scale : 1,
		svgFile : 'assets/emilieFont.svg',
		//PARSÉ avec le helper
		easepoints : {"Ö":[[5],[5]],"Ô":[null,[16]],"Ï":[[136],[5],[5]],"Î":[[93],[16]],"Ë":[[159],[5],[5]],"Ê":[[159],[17]],"È":[[159]],"É":[[159]],"Ç":[null,[13]],"Ä":[[189],null,[5],[5]],"Â":[[189],null,[15]],"À":[[189]],"Z":[[193,340]],"Y":[[329]],"W":[[227,336]],"V":[[231]],"U":[[317]],"R":[[289]],"N":[[247,350]],"M":[[238,338,452]],"K":[[115],[122]],"J":[[132]],"I":[[93]],"H":[[142]],"G":[[321]],"E":[[159]],"B":[[453]],"A":[[189]],"ô":[[155],[16]],"ö":[[155],[5],[5]],"ï":[[42],[5],[5]],"î":[[42],[16]],"ë":[null,[5],[5]],"ê":[null,[17]],"ç":[[72],[13]],"ä":[[55,133],[5],[5]],"â":[[55,133],[15]],"à":[[55,133]],"z":[[110]],"y":[[42,116,227]],"x":[[42]],"w":[[38,107,177]],"v":[[66]],"u":[[33,105]],"t":[[103]],"s":[[50,110]],"r":[[64]],"q":[[144,325]],"p":[[56,305]],"o":[[155]],"n":[[104]],"m":[[110]],"l":[[24]],"k":[[131,244,327]],"j":[[52],[18]],"i":[[42],[18]],"h":[[133,248,293]],"g":[[60,145]],"f":[[419]],"d":[[236]],"c":[[72]],"b":[[291]],"a":[[55,133]],"O":[[300]],"L":[[220]],"F":[[220]],"D":[[370]]}
	};


	return EmilieFont;
	
}));