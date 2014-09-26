<?php


	$lst = file_get_contents('http://www.whoismorefamous.com/?fulllist=1');
	$names = array(
		'first'=>array(),
		'last'=>array(),
	);
	preg_match_all('/<li>.*/i', $lst, $matchesLi);
		
	foreach($matchesLi[0] as $name){
		preg_match_all('/[a-z]{3,}/i', $name, $matches);
		if($matches[0][0]) $names['first'][] = $matches[0][0];
		if($matches[0][1]) $names['last'][] = $matches[0][1];
	}
	//Utils::debug($names);
	$parsed = array();
	for($i=0; $i<50; $i++){
		$name = $names['first'][rand(0, count($names['first'])-1)] . ' ' . $names['last'][rand(0, count($names['last'])-1)];
		
		$parsed[] = "$name";

	}

	echo json_encode($parsed);