__ = wp.i18n.__;
_x = wp.i18n._x;
var display_type = ''; // default
var time_start = 0;
var time_end = 0;
var time_total = 0;
var time_total_min = 0;
var time_total_hours = 0;
const dayNames = [
	_x( 'Sun', 'day abbreviation', 'kompassi-integration' ),
	_x( 'Mon', 'day abbreviation', 'kompassi-integration' ),
	_x( 'Tue', 'day abbreviation', 'kompassi-integration' ),
	_x( 'Wed', 'day abbreviation', 'kompassi-integration' ),
	_x( 'Thu', 'day abbreviation', 'kompassi-integration' ),
	_x( 'Fri', 'day abbreviation', 'kompassi-integration' ),
	_x( 'Sat', 'day abbreviation', 'kompassi-integration' )
];

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

	//  Initialize data
	tags = {};

	jQuery( '#kompassi_programme article' ).each( function( ) {
		p = jQuery( this );
		jQuery.each( this.attributes, function( ) {
			attr = this.name;
			value = this.value;
			if( attr.startsWith( 'data-' ) ) {
				if( typeof tags[attr] === 'undefined' ) {
					tags[attr] = [];
				}
				if( !tags[attr].includes( this.value ) ) {
					tags[attr].push( this.value );
				}
			}
		} );
		if( time_start == 0 ) {
			time_start = p.attr( 'data-start-timestamp' );
		}
		if( time_end < p.attr( 'data-end-timestamp' ) ) {
			time_end = p.attr( 'data-end-timestamp' );
		}
	} );

	//  Always start and end with even hours
	ts = new Date( time_start * 1000 );
	if( ts.getMinutes( ) !== 0 ) {
		ts.setMinutes( 0, 0, 0 );
		time_start = ts.valueOf( ) / 1000;
	}
	te = new Date( time_end * 1000 );
	if( te.getMinutes( ) > 0 ) {
		te.setHours( te.getHours( ) + 1, 0, 0, 0 );
		time_end = te.valueOf( ) / 1000;
	}

	time_total = time_end - time_start;
	time_total_min = time_total / 60;
	time_total_hours = Math.ceil( time_total_min / 60 );

	// TODO
	delete tags['data-length'];
	delete tags['data-start-timestamp'];
	delete tags['data-end-timestamp'];
	tagnames = {
		'data-room-name': __( 'Room name', 'kompassi-integration' )
	};
	// TODO END

	//  Show filters
	jQuery( '#kompassi_programme_filters' ).append( jQuery( '<span>' + _x( 'Filter', 'verb (shown before filters)', 'kompassi-integration' ) + '</span>' ) );

	//  Show text filter
	jQuery( '#kompassi_programme_filters' ).append( jQuery( '<input class="filter filter-text" name="filter_text" />' ) );

	//  Show tag filters
	jQuery.each( tags, function( tag, values ) {
		select = jQuery( '<select class="filter filter-tag" name="filter_' + tag + '" data-attr="' + tag + '" />' );
		select.append( jQuery( '<option value="0">-- ' + tagnames[tag] + ' --</option>' ) );
		jQuery.each( values, function( index, value ) {
			select.append( jQuery( '<option value="' + value + '">' + value + '</option>' ) );
		} );
		jQuery( '#kompassi_programme_filters' ).append( select );
	} );

	// Handle filtering
	jQuery( '#kompassi_programme_filters' ).on( 'change', '.filter-tag', apply_filters );
	jQuery( '#kompassi_programme_filters' ).on( 'keyup', '.filter-text', apply_filters );

	// Show modal
	jQuery( '#kompassi_programme article' ).on( 'click', function( ) {
		clone = jQuery( this ).clone( );
		clone.attr( 'id', 'kompassi_programme_modal' ).attr( 'style', '' );
		clone.appendTo( 'body' );
	} );
	jQuery( 'body' ).on( 'click', '#kompassi_programme_modal', function( ) {
		jQuery( '#kompassi_programme_modal' ).remove( );
	} );

	//  On first load, if timeline is the display type, trigger setup
	if( get_display_type( ) == 'timeline' ) {
		setup_timeline_layout( );
	}
} );

// TODO: Get this value from filters
var grouping = 'data-room-name';

function setup_timeline_layout( ) {
	rows = [ 'day hints', 'time hints' ];

	prev_group = '';
	var grouping_row = 1;

	jQuery( '#kompassi_programme article' ).sort( sort_by_group ).each( function( index ) {
		p = jQuery( this );

		// TODO: Do not show events that would start after or end before visible area
		if( p.attr( 'data-end-timestamp' ) < time_start || p.attr( 'data-start-timestamp' ) > time_end ) {
			p.css( 'visibility', 'hidden' );
			return;
		}
		if( p.hasClass( 'hidden' ) ) {
			return;
		}

		added = false;

		per = p.attr( 'data-length' ) / time_total_min * 100;
		offset = ( ( p.attr( 'data-start-timestamp' ) - time_start ) / time_total ) * 100;

		//
		if( p.attr( grouping ) != prev_group ) {
			rows.push( 'group: ' + p.attr( grouping ) );
			group = jQuery( '<p class="group-name">' + p.attr( grouping ) + '</p>' );
			grouping_row = rows.length - 1;
			group.css( 'top', 'calc( ' + grouping_row + ' * var(--kompassi-programme-timeline-row-height)' );
			jQuery( '#kompassi_programme' ).append( group );
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

	jQuery( '#kompassi_programme' ).css( 'height', 'calc( var(--kompassi-programme-timeline-row-height) * ' + ( rows.length ) + ' )' )

	first_hour = new Date( time_start * 1000 ).getHours( );
	for( i = 0; i < time_total_hours; i++ ) {
		offset = 100 / ( time_total_hours );
		label = i + first_hour;
		label = label % 24;
		if( label < 10 ) {
			label = '0' + label;
		}
		jQuery( '#kompassi_programme' ).append( '<div class="ruler" style="top: var(--kompassi-programme-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% );">' + label + '</div>' );
		if( label == '00' || i == 0 ) {
			d = new Date( time_start * 1000 + i * 60 * 60 * 1000 );
			day_label = dayNames[d.getDay()] + ' ' + d.getDate( ) + '.' + ( d.getMonth( ) + 1 ) + '.';
			jQuery( '#kompassi_programme' ).append( '<strong class="day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% );">' + day_label + '</div>' );
		}
	}
}

function apply_filters( ) {
	//  Show all
	jQuery( '#kompassi_programme article' ).removeClass( 'hidden' );

	//  Iterate through each filter
	jQuery( '#kompassi_programme_filters .filter' ).each( function( index ) {
		filter = jQuery( this );
		// Tag filters
		if( filter.hasClass( 'filter-tag' ) ) {
			if( filter.val( ) !== '0' ) {
				jQuery( '#kompassi_programme article:not([' + jQuery( this ).attr( 'data-attr' ) + '="' + this.value + '"])' ).addClass( 'hidden' );
			}
		}
		// Text filter
		if( filter.hasClass( 'filter-text' ) ) {
			if( filter.val( ) !== '' ) {
				jQuery( '#kompassi_programme article' ).each( function( index ) {
					program = jQuery( this );
					words = filter.val( ).toLowerCase( ).split( ' ' );
					text = jQuery( this ).find( '.title' ).first( ).text( ).toLowerCase( );
					text += ' ' + jQuery( this ).find( '.description' ).first( ).text( ).toLowerCase( );
					jQuery.each( words, function( ) {
						if( !text.includes( this ) ) {
							program.addClass( 'hidden' );
						}
					} );
				} );
			}
		}

		// Date filter

	} );

	//  If on timeline, refresh the layout
	if( get_display_type( ) == 'timeline' ) {
		revert_timeline_layout( );
		setup_timeline_layout( );
	}
}

function get_display_type( ) {
	if( display_type !== '' ) {
		return display_type;
	} else {
		if( jQuery( '#kompassi_programme' ).hasClass( 'table' ) ) { display_type = 'table'; }
		if( jQuery( '#kompassi_programme' ).hasClass( 'list' ) ) { display_type = 'list'; }
		if( jQuery( '#kompassi_programme' ).hasClass( 'expanded' ) ) { display_type = 'expanded'; }
		if( jQuery( '#kompassi_programme' ).hasClass( 'timeline' ) ) { display_type = 'timeline'; }
	}
	return display_type;
}

function sort_by_group( a, b ) {
	// TODO: return -1 if attrs are not found
	if( jQuery( a ).attr( grouping ) > jQuery( b ).attr( grouping ) ) {
		return 1;
	}
	return -1;
}

function revert_timeline_layout( ) {
	jQuery( '#kompassi_programme' ).css( 'height', 'auto' );
	jQuery( '#kompassi_programme article' ).attr( 'style', '' );
	jQuery( '#kompassi_programme .day_hint, #kompassi_programme .ruler, #kompassi_programme .group-name' ).remove( );
}
