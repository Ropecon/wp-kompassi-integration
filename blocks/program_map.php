<?php

// Get the desired scale
if( !isset( $_GET['scale'] ) || intval( $_GET['scale'] ) == 0 ) {
	$scale = 1;
} else {
	$scale = intval( $_GET['scale'] );
}

// See if we want to limit to one date only
$end = 0;
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

/* CUT START */

$jsonraw = file_get_contents( plugin_dir_url( __FILE__ ) . '../data/2023.json' );
$jsonraw = str_replace( '\r\n', '<br />', $jsonraw );
$programme = json_decode( $jsonraw, true );
$prog = array( );


// Sort programme by event starting time
usort( $programme, array( &$this, 'sort_by_starting_time' ) );

/* CUT END */

// Get the earliest starting time
$begin = strtotime( $programme[0]['start_time'] );

/*
 *  Populate programme to an array in the following format:
 *  - Each subarray (2nd level) is an array for a single room
 *  - Each room array (3rd level) consists of arrays (4th level) of programme numbers
 *  - Each room-row array (4th level) only consists events, which times do not overlap with each other
 *
 */

foreach( $programme as $id => $event ) {
	$added = false;
	$event['start_timestamp'] = strtotime( $event['start_time'] );
	$event['end_timestamp'] = $event['start_timestamp'] + ( $event['length'] * 60 );
	$event['id'] = $id;

	// When a date is set, filter out events that do not happen today
	if( $date != false ) {
		if( $event['start_timestamp'] >= $date_end || $event['end_timestamp'] <= $date_begin ) {
			unset( $programme[$id] );
			continue 1;
		}
	}

	if( isset( $prog[$event['room_name']] ) ) {
		foreach( $prog[$event['room_name']] as $n => $c ) {
			if( $c['last_end'] <= $event['start_timestamp'] ) {
				// Add to this row...
				$prog[$event['room_name']][$n]['events'][] = $event;
				$prog[$event['room_name']][$n]['last_end'] = $event['end_timestamp'];
				if( $event['end_timestamp'] > $end ) {
					$end = $event['end_timestamp'];
				}
				$added = true;
				continue 2;
			}
		}
	}
	if( $added == false ) {
		// New row...
		$prog[$event['room_name']][] = array(
			'last_end' => $event['end_timestamp'],
			'events' => array( $event )
		);
		if( $event['end_timestamp'] > $end ) { $end = $event['end_timestamp']; }
	}
}

if( $date != false && $begin < $date_begin ) {
	$begin = $date_begin;
}

if( $date != false && $end > $date_end ) {
	$end = $date_end;
} else {
	if( date( 'i', $end ) != '00' ) {
		$end += ( 60 - date( 'i', $end ) ) * 60;
	}
}

echo '<script>var begin = ' . $begin . '; var end = ' . $end . ';</script>';

// Sort events by room name
ksort( $prog );

$minutes = ( $end - $begin ) / 60;
$hours = $minutes / 60 - 1;

echo '<style type="text/css">#times th, #lines td { min-width: ' . 100 / $minutes / 60  . '% !important; }</style>';

// URL parameter stuff
$url_parts = parse_url( $_SERVER['REQUEST_URI'] );
if( isset( $url_parts['query'] ) ) {
	parse_str( $url_parts['query'], $params );
} else {
	$params = array( );
}

echo '<div id="filters">';
	echo '<div class="filter-date"><strong>' . __( 'Day', 'kompassi-integration' ) . '</strong><br />';
		// TODO: Catch days from JSON
		foreach( array( '0' => __( 'All', 'kompassi-integration' ), '2023-07-28' => '28.7.', '2023-07-29' => '29.7.', '2023-07-30' => '30.7.' ) as $dd => $dt ) {
			if( isset( $date_format ) && $date_format == $dd ) {
				$dc = 'current';
			} else {
				$dc = '';
			}
			if( $dd == 0 ) {
				unset( $params['date'] );
			} else {
				$params['date'] = $dd;
			}
			$url_parts['query'] = http_build_query( $params );

			echo '<a class="' . $dc . '" href="?' . $url_parts['query'] . '">' . $dt . '</a> ';
		}
		if( isset( $_GET['date'] ) ) {
			$params['date'] = $_GET['date'];
		}

	echo '</div>';
	echo '<div class="filter-scale"><strong>' . __( 'Scale', 'kompassi-integration' ) . '</strong><br />';
		foreach( array( '1' => __( 'Screen', 'kompassi-integration' ), 2 => '×2', 4 => '×4' ) as $ss => $st ) {
			if( $scale == $ss ) {
				$sc = 'current';
			} else {
				$sc = '';
			}
			if( $ss == 1 ) {
				unset( $params['scale'] );
			} else {
				$params['scale'] = $ss;
			}
			$url_parts['query'] = http_build_query( $params );

			echo '<a class="' . $sc . '" href="?' . $url_parts['query'] . '">' . $st . '</a> ';
		}
	echo '</div>';
echo '</div>';

// Date/hour labels
echo '<table id="times" class="kompassi">';
echo '<tr>';
$prev_date = '';
for( $i = 0; $i <= $hours; $i++ ) {
	$now = $begin + ( $i * 60 * 60 );
	if( date( 'Y-m-d', $now ) != $prev_date ) {
		$date_p = date( 'd.n.', $now );
		$prev_date = date( 'Y-m-d', $now );
	} else {
		$date_p = '&nbsp;';
	}
	echo '<th><strong>' . $date_p . '</strong><br />' . date( 'H', $now ) . '</th>';
}
echo '</tr>';
echo '</table>';

// Hour lines
echo '<table id="lines" class="kompassi">';
echo '<tr>';
for( $i = 0; $i <= $hours; $i++ ) {
	echo '<td>&nbsp;</td>';
}
echo '</tr>';
echo '</table>';

// Current time
$time = time( );
$current_offset = ( $time - $begin ) * 100 / ( $end - $begin );
echo '<div id="now" style="left: calc(' . $current_offset . '% - 1px );"></div>';

// Events
echo '<table id="programme">';
echo '<tbody>';
foreach( $prog as $roomname => $room ) {
	echo '<tr class="room"><th><span>' . $roomname . '</span></th></tr>';
	foreach( $room as $rownum => $room_rows ) {
		echo '<tr class="prog"><td>';
		foreach( $room_rows['events'] as $event ) {
			$classes = ' ';
			if( $date > 0 ) {
				// Events that start before the current date
				if( $event['start_timestamp'] <= $date_begin ) {
					$event['length'] = $event['length'] - ( ( $date_begin - $event['start_timestamp'] ) / 60 );
					$event['start_timestamp'] = $date_begin;
					$classes .= 'continues-before ';
				}
				// Events that end after the current date
				if( $event['end_timestamp'] > $date_end ) {
					$event['length'] = ( $date_end - $event['start_timestamp'] ) / 60;
					$classes .= 'continues ';
				}
			}
			$offset = ( ( $event['start_timestamp'] - $begin ) / 60 ) / $minutes * 100;
			$length = $event['length'] / $minutes * 100;

			$width = 'calc( ' . $length . '% - 4px )';
			$left = 'calc( ' . $offset . '% + 2px )';
			echo '<span id="' . $event['id'] . '" class="event tag_' . $event['category_title'] . $classes . '" style="width: ' . $width . '; min-width: ' . $width . '; left: ' . $left . ';">' . $event['title'] . '</span>';

			echo '<div class="info" id="info-' . $event['id'] . '">';
			echo '<header>';
			echo '<h2>' . $event['title'] . '</h2>';
			echo '<h3>' . $event['formatted_hosts'] . '</h3>';
			echo '<div class="meta">';
			echo '<strong>' . $event['room_name'] . '</strong> / ' . $event['category_title'] . '<br />';
			if( date( 'Y-m-d', $event['start_timestamp'] ) == date( 'Y-m-d', $event['end_timestamp'] ) ) {
				echo date( 'Y-m-d H:i', $event['start_timestamp'] ) . ' – ' . date( 'H:i', $event['end_timestamp'] ) . '</strong>';
			} else {
				echo date( 'Y-m-d H:i', $event['start_timestamp'] ) . ' – ' . date( 'Y-m-d H:i', $event['end_timestamp'] ) . '</strong>';
			}
			echo '</div>';
			echo '</header>';
			echo '<main>';
			echo make_links_clickable( $event['description'] );
			echo '</main>';
			echo '</div>';
		}
		echo '</td></tr>';
	}
}
echo '</tbody>';
echo '</table>';


?>
