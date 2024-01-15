<?php

$json = array( );
$json['unique'] = array( );
require_once 'ropecon_2024_dimensions.php';
$json['dimensions'] = ropecon_2024_dimensions();

foreach( json_decode( file_get_contents( 'v1_ropecon.json' ), true ) as $index => $row ) {
	$prog = array( );
	$prog['title'] = $row['title'];
	$prog['description'] = $row['description'];
	$prog['formatted_hosts'] = $row['formatted_hosts'];
	$prog['room_name'] = $row['room_name'];
	$prog['length'] = $row['length'];
	$prog['start_time'] = $row['start_time'];
	$prog['end_time'] = $row['end_time'];
	$prog['identifier'] = $row['identifier'];
	$prog['short_blurb'] = $row['short_blurb'];

	// Convert categories and tags to 2024 dimensions
	$prog['dimensions'] = ropecon2023_to_2024_dimensions( $row );

	// Accessibility dimension
	foreach( $row as $key => $value ) {
		if( strpos( $key, 'accessibility' ) > 0 ) {
			if( $row[$key] == 'true' ) {
				$key_short = substr( $key, strpos( $key, 'accessibility_' ) + strlen( 'accessibility_' ) );
				$prog['dimensions']['accessibility'][] = $key_short;
			}
		}
	}

	$programs[$index] = $prog;
}

$json['programs'] = $programs;

header( 'Content-Type: application/json' );
echo json_encode( $json );

?>
