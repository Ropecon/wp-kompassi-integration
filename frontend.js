__ = wp.i18n.__;
_x = wp.i18n._x;
var display_type = ''; // default
jQuery( function( e ) {
	// Change display type
	jQuery( '#kompassi_programme_display a' ).on( 'click', function( ) {
		display_type = jQuery( this ).attr( 'class' );
		jQuery( '#kompassi_programme' ).removeClass( 'table list expanded timeline' ).addClass( jQuery( this ).attr( 'class' ) );
		revert_timeline_layout( );
		if( get_display_type( ) == 'timeline' ) {
			setup_timeline_layout( );
		}
	} );


	//  On first load, if timeline is the display type, trigger setup
	if( get_display_type( ) == 'timeline' ) {
		setup_timeline_layout( );
	}
} );

// TODO: Get this value from filters
var grouping = 'data-room-name';

function setup_timeline_layout( ) {
	hours = 24;

	time_total_min = 60 * hours;
	time_start = 1690491600 + 60 * 60 * 24;
	time_duration = time_total_min * 60;
	time_end = time_start + time_duration;
	rows = [ 'time hints' ];

	prev_group = '';
	var grouping_row = 1;
//	jQuery( '.programme-list article' );

	jQuery( '.programme-list article' ).sort( sort_by_group ).each( function( index ) {
		p = jQuery( this );

		// TODO: Do not show events that would start after or end before visible area
		if( p.attr( 'data-end-timestamp' ) < time_start || p.attr( 'data-start-timestamp' ) > time_end ) {
			p.css( 'visibility', 'hidden' );
			return;
		}

		added = false;

		per =  p.attr( 'data-length' ) / time_total_min * 100;
		offset = ( ( p.attr( 'data-start-timestamp' ) - time_start ) / time_duration ) * 100;

		//
		if( p.attr( grouping ) != prev_group ) {
			rows.push( 'group: ' + p.attr( grouping ) );
			group = jQuery( '<p class="group-name">' + p.attr( grouping ) + '</p>' );
			grouping_row = rows.length - 1;
			group.css( 'top', 'calc( ' + grouping_row + ' * var(--kompassi-programme-timeline-row-height)' );
			jQuery( '.programme-list' ).append( group );
		}

		current_row = grouping_row;

		while( added == false ) {
			if( typeof rows[current_row] === 'undefined' ) {
				// Row does not exist, create new
				rows.push( p.attr( 'data-end-timestamp' ) );
				rownum = rows.length - 1;
				added = true;
			}
			if( rows[current_row] <= p.attr( 'data-start-timestamp' ) ) {
				// Rows last event ends before or at the same time as this one starts
				rows[current_row] = p.attr( 'data-end-timestamp' );
				rownum = current_row;
				added = true;
			}
			current_row = current_row + 1;
		}

		p.css( 'width', 'calc( ' + per + '% - 5px )' );
		p.css( 'min-width', 'calc( ' + per + '% - 5px )' );
		p.css( 'left', 'calc( ' + offset + '% + 3px )' );
		p.css( 'top', 'calc( ' + rownum + ' * var(--kompassi-programme-timeline-row-height)' );

		prev_group = p.attr( 'data-room-name' );
	} );

	jQuery( '.programme-list' ).css( 'height', 'calc( var(--kompassi-programme-timeline-row-height) * ' + ( rows.length ) + ' )' )

	for( i = 0; i < hours; i++ ) {
		offset = 100 / ( hours )
		jQuery( '.programme-list' ).append( '<div class="ruler" style="left: calc( ' + offset + ' * ' + i + '% );">' + i + '</div>' );
	}
}

function sort_by_group( a, b ) {
	// TODO: return -1 if attrs are not found
	if( jQuery( a ).attr( grouping ) > jQuery( b ).attr( grouping ) ) {
		return 1;
	}
	return -1;
}

function revert_timeline_layout( ) {
	jQuery( '.programme-list article' ).css( 'width', 'auto' ).css( 'min-width', 'auto' ).css( 'visibility', 'visible' );
	jQuery( '.programme-list .ruler, .programme-list .group-name' ).remove( );
}
