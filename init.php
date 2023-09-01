<?php
	include 'functions.php';

	// Set the default timezone
	date_default_timezone_set( 'Europe/Helsinki' );

	// Get the desired scale
	if( !isset( $_GET['scale'] ) || intval( $_GET['scale'] ) == 0 ) {
		$scale = 1;
	} else {
		$scale = intval( $_GET['scale'] );
	}

	// See if we want to limit to one date only
	if( isset( $_GET['date'] ) ) {
		$date = strtotime( $_GET['date'] );
		if( $date != false ) {
			$date_begin = $date;
			$date_begin = $date + 28800; // When showing a single date, show dates starting from 8am
			$date_end = $date_begin + 86400;
			$end = $date_begin + 86400;
			$date_format = date( 'Y-m-d', $date );
		} else {
			$date = 0;
		}
	} else {
		$date = 0;
	}

	// Get strings in preferred language
	$lang = substr( $_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2 );

	if( $lang == 'fi' ) {
		$strings = array(
			'programme_guide' => 'Ohjelmakartta',
			'day' => 'Päivä',
			'all' => 'Kaikki',
			'scale' => 'Skaala',
			'screen' => 'Ruutu'
		);
	} else {
		$strings = array(
			'programme_guide' => 'Program Map',
			'day' => 'Day',
			'all' => 'All',
			'scale' => 'Scale',
			'screen' => 'Screen'
		);
	}
?>
