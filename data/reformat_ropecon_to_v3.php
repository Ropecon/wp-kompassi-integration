<?php

error_reporting( E_ALL );

$json = json_decode( file_get_contents( '2023.json' ), true );
foreach( $json as $index => $row ) {
	foreach( $row as $key => $value ) {
		// Players
		$json[$index]['participants'] = array(
			'min' => $json[$index]['min_players'],
			'max' => $json[$index]['max_players'],
		);
		if( isset( $json[$index]['min_players'] ) ) { unset( $json[$index]['min_players'] ); }
		if( isset( $json[$index]['max_players'] ) ) { unset( $json[$index]['max_players'] ); }
		// Accessibility stuff
		if( strpos( $key, 'accessibility' ) > 0 ) {
			if( $json[$index][$key] == 'true' ) {
				$key_short = substr( $key, strpos( $key, 'accessibility_' ) + strlen( 'accessibility_' ) );
				$json[$index]['accessibility'][] = $key_short;
			}
			unset( $json[$index][$key] );
		}
		// Random stuff as tags
		$tags = array(
			'revolving_door',
			'ropecon2023_beginner_friendly' => 'beginner_friendly',
		);
		foreach( $tags as $key => $new_key ) {
			if( !isset( $new_key ) ) {
				$new_key = $key;
			}
			if( $json[$index][$key] == 'true' ) {
				$json[$index]['options'][] = $new_key;
			}
			unset( $json[$index][$key] );
		}

		// Language
		$json[$index]['language'] = $json[$index]['ropecon2023_language'];
		unset( $json[$index]['ropecon2023_language'] );

		// Temp
		unset( $json[$index]['ropecon2023_celebratory_year'] );
		unset( $json[$index]['ropecon2023_signuplist'] );
		unset( $json[$index]['ropecon2023_workshop_fee'] );
		unset( $json[$index]['ropecon_theme'] );

		if( isset( $json[$index]['tags'] ) ) {
			// var_dump( $json[$index]['tags'] );
		}
	}
}

$json['programmes'] = $json;
$json['categories'] = array(
	'Esitysohjelma / Performance programme' => array( 'color' => 'rgba(116, 27, 71, 1)' ),
	'Figupelit: avoin pelautus / Miniature wargames: Open game' => array( 'color' => 'rgba(64, 224, 208, 1)' ),
	'Figupelit: demotus / Miniature wargames: Demo game' => array( 'color' => 'rgba(64, 224, 208, 1)' ),
	'Kokemuspiste: avoin pelautus / Experience Point: Open game' => array( 'color' => 'rgba(244, 227, 0, 1)' ),
	'Kokemuspiste: demotus / Experience Point: Demo game' => array( 'color' => 'rgba(244, 227, 0, 1)' ),
	'Kokemuspiste: muu / Experience Point: Other' => array( 'color' => 'rgba(244, 227, 0, 1)' ),
	'LARP' => array( 'color' => 'rgba(11, 125, 9, 1)' ),
	'Miitti / Meetup' => array( 'color' => 'rgba(144, 228, 93, 1)' ),
	'Muu ohjelma / None of the above' => array( 'color' => 'rgba(144, 228, 93, 1)' ),
	'Muu peliohjelma / Other game programme' => array( 'color' => 'rgba(235, 152, 0, 1)' ),
	'Puheohjelma: esitelmä / Presentation' => array( 'color' => 'rgba(62, 40, 171, 1)' ),
	'Puheohjelma: keskustelu / Discussion group' => array( 'color' => 'rgba(62, 40, 171, 1)' ),
	'Puheohjelma: paneeli / Panel discussion' => array( 'color' => 'rgba(62, 40, 171, 1)' ),
	'Roolipeli / Pen & Paper RPG' => array( 'color' => 'rgba(171, 47, 169, 1)' ),
	'Tanssiohjelma / Dance programme' => array( 'color' => 'rgba(255, 0, 70, 1)' ),
	'Turnaukset: figupelit / Tournament: Miniature wargames' => array( 'color' => 'rgba(196, 47, 52, 1)' ),
	'Turnaukset: korttipelit / Tournament: Card games' => array( 'color' => 'rgba(196, 47, 52, 1)' ),
	'Turnaukset: lautapelit / Tournament: Board games' => array( 'color' => 'rgba(196, 47, 52, 1)' ),
	'Turnaukset: muu / Tournament: Other' => array( 'color' => 'rgba(196, 47, 52, 1)' ),
	'Työpaja: figut / Workshop: miniature figurines' => array( 'color' => 'rgba(68, 185, 228, 1)' ),
	'Työpaja: käsityö / Workshop: crafts' => array( 'color' => 'rgba(68, 185, 228, 1)' ),
	'Työpaja: musiikki / Workshop: music' => array( 'color' => 'rgba(68, 185, 228, 1)' ),
	'Työpaja: muu / Workshop: other' => array( 'color' => 'rgba(68, 185, 228, 1)' )
);


header( 'Content-Type: application/json' );
echo json_encode( $json );

?>
