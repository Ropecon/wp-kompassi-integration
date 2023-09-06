__ = wp.i18n.__;
_x = wp.i18n._x;
var display_type = '';
var time_start = 0;
var time_end = 0;
var time_total = 0;
var dates = {};
var date_filtered = false;
var popover_timeout = '';
var cookie;

jQuery( function( e ) {
	// TODO
	block = jQuery( '.wp-block-kompassi-integration-programme' ).first( );

	// Set up cookie for favorites
	cookie = Cookies.get( 'kompassi_integration' );
	if( cookie == undefined ) {
		cookie = { favorites: [] };
		Cookies.set( 'kompassi_integration', JSON.stringify( cookie ), { sameSite: 'strict', secure: true } );
	} else {
		cookie = JSON.parse( cookie );
		jQuery.each( cookie.favorites, function( ) {
			jQuery( '#' + this ).addClass( 'is-favorite' );
		} );
	}

	//  Populate attribute filter data
	attribute_filters = [
		{ key: 'room_name', label: __( 'Room name', 'kompassi-integration' ) }
	];
	jQuery( attribute_filters ).each( function( index ) {
		values = [];
		jQuery( '#kompassi_programme article .' + this.key ).each( function( ) {
			values.push( jQuery( this ).text( ) );
		} );
		attribute_filters[index]['values'] = values.filter( filter_unique );
	} );

	//  Get earliest and latest timestamps
	//  Add favorite markup
	jQuery( '#kompassi_programme article' ).each( function( ) {
		if( time_start == 0 ) {
			time_start = jQuery( this ).attr( 'data-start-timestamp' );
		}
		if( time_end < jQuery( this ).attr( 'data-end-timestamp' ) ) {
			time_end = jQuery( this ).attr( 'data-end-timestamp' );
		}
		jQuery( this ).append( '<div class="favorite" style="grid-area: favorite;" />' );
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

	// Get list of dates
	i = ts.setHours( 0 ).valueOf( ) / 1000;
	while( i < time_end ) {
		dates[i] = kompassi_get_date_formatted( new Date( i * 1000 ) );
		i += 24 * 60 * 60;
	}

	// FAVORITES
	jQuery( 'body' ).on( 'click', 'article.kompassi-programme .favorite', kompassi_toggle_favorite );

	// FILTERS
	if( block.attr( 'data-show-filters' ) == 'true' ) {
		filters = jQuery( '<section id="kompassi_programme_filters" />' );
		filters.append( jQuery( '<span>' + _x( 'Filter', 'verb (shown before filters)', 'kompassi-integration' ) + '</span>' ) );

		//  Text filter
		filters.append( jQuery( '<input class="filter filter-text" name="filter_text" placeholder="' + __( 'Search (title, description)', 'kompassi-integration' ) + '" />' ) );

		//  Single attribute filters
		jQuery.each( attribute_filters, function( ) {
			select = jQuery( '<select class="filter filter-attribute" name="filter_' + this.key + '" data-attribute="' + this.key + '" />' );
			select.append( jQuery( '<option value="0">-- ' + this.label + ' --</option>' ) );
			jQuery.each( this.values, function( index, value ) {
				select.append( jQuery( '<option value="' + value + '">' + value + '</option>' ) );
			} );
			filters.append( select );
		} );

		//  Date filter
		select = jQuery( '<select class="filter filter-date" name="filter_date" />' );
		select.append( jQuery( '<option value="0">-- ' + __( 'All dates', 'kompassi-integration' ) + ' --</option>' ) );
		jQuery.each( dates, function( timestamp, label ) {
			select.append( jQuery( '<option value="' + timestamp + '">' + label + '</option>' ) );
		} );
		filters.append( select );

		filters.append( '<label><input class="filter filter-favorite" type="checkbox" name="filter_favorite" />' + __( 'Favorites only', 'kompassi-integration' ) + '</label>' );

		//  Show filters
		block.prepend( filters );

		// Handle filtering
		filters.on( 'change', 'select.filter, .filter[type="checkbox"]', kompassi_apply_filters );
		filters.on( 'keyup', '.filter-text', kompassi_apply_filters );
	}

	// DISPLAY STYLES
	if( block.attr( 'data-show-display-styles' ) == 'true' ) {
		styles = {
			'table': _x( 'Table', 'display style', 'kompassi-integration' ),
			'list': _x( 'Compact List', 'display style', 'kompassi-integration' ),
			'expanded': _x( 'Expanded List', 'display style', 'kompassi-integration' ),
			'timeline': _x( 'Timeline', 'display style', 'kompassi-integration' )
		};
		ds = jQuery( '<section id="kompassi_programme_display" />' );
		jQuery.each( styles, function( style, label ) {
			ds.append( '<a class="' + style + '">' + label + '</a>' );
		} );
		block.prepend( ds );

		// Change display type
		jQuery( '#kompassi_programme_display' ).on( 'click', 'a', function( ) {
			display_type = jQuery( this ).attr( 'class' );
			jQuery( '#kompassi_programme' ).removeClass( 'table list expanded timeline' ).addClass( jQuery( this ).attr( 'class' ) );
			kompassi_revert_timeline_layout( );
			if( kompassi_get_display_type( ) == 'timeline' ) {
				kompassi_setup_timeline_layout( );
			}
		} );
	}

	// Popover
	jQuery( '#kompassi_programme article' ).on( 'mouseover', function( e ) {
		if( !jQuery( '#kompassi_programme' ).hasClass( 'timeline' ) ) {
			return;
		}
		clearTimeout( popover_timeout );
		popover_timeout = setTimeout( kompassi_popover, 300, this, e.pageX );
	} );
	jQuery( '#kompassi_programme article' ).on( 'mouseout', function( e ) {
		clearTimeout( popover_timeout );
		jQuery( '#kompassi_programme_popover' ).remove( );
	} );

	// Show modal
	jQuery( '#kompassi_programme article' ).on( 'click', function( e ) {
		if( jQuery( e.target ).hasClass( 'favorite' ) ) {
			return;
		}
		clone = jQuery( this ).clone( );
		clone.attr( 'id', 'kompassi_programme_modal' ).attr( 'style', '' );
		clone.appendTo( jQuery( 'body' ) );
		jQuery( 'body' ).append( '<div id="kompassi_programme_modal_bg" />' ).css( 'overflow', 'hidden' );
	} );

	// Close modals when clicking on modal bg or pressing Esc
	jQuery( 'body' ).on( 'click', '#kompassi_programme_modal_bg', kompassi_close_modal );
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( e.keyCode == 27 ) {
			kompassi_close_modal( e );
		}
	} );

	//  On first load, if timeline is the display type, trigger setup
	if( kompassi_get_display_type( ) == 'timeline' ) {
		kompassi_setup_timeline_layout( );
	}
} );

function kompassi_toggle_favorite( ) {
	art_id = jQuery( this ).closest( 'article.kompassi-programme' ).attr( 'data-id' );
	jQuery( 'article.kompassi-programme[data-id="' + art_id + '"]' ).toggleClass( 'is-favorite' );
	if( cookie.favorites.includes( art_id ) ) {
		cookie.favorites = cookie.favorites.filter( function( id ) { return id !== art_id; } );
	} else {
		cookie.favorites.push( art_id );
	}
	Cookies.set( 'kompassi_integration', JSON.stringify( cookie ), { sameSite: 'strict', secure: true } );
}

function kompassi_close_modal( ) {
	jQuery( '#kompassi_programme_modal_bg, #kompassi_programme_modal' ).remove( );
	jQuery( 'body' ).css( 'overflow', 'auto' );
}

// TODO: Get this value from filters
var grouping = 'room_name';

function kompassi_setup_timeline_layout( ) {
	rows = [ 'day hints', 'time hints' ];

	prev_group = '';
	var grouping_row = 1;

	jQuery( '#kompassi_programme article' ).sort( kompassi_sort_by_group ).each( function( index ) {
		p = jQuery( this );
		if( p.hasClass( 'hidden' ) ) {
			return;
		}

		added = false;

		if( date_filtered ) {
			time_start_filtered = jQuery( '[name="filter_date"]' ).val( );
			if( time_start_filtered < time_start ) {
				time_start_filtered = time_start;
				tsf = new Date( time_start_filtered * 1000 );
				time_total_filtered = ( 24 - tsf.getHours( ) ) * 60 * 60;
			} else if( parseInt( time_start_filtered ) + ( 24 * 60 * 60 ) > time_end ) {
				tef = new Date( time_end * 1000 );
				time_total_filtered = tef.getHours( ) * 60 * 60;
			} else {
				time_total_filtered = 24 * 60 * 60;
			}
		} else {
			time_start_filtered = time_start;
			time_total_filtered = time_total;
		}
		// TODO: If favorites enabled...

		if( options.timeline_earliest_hour > 0 ) {
			tsf = new Date( time_start_filtered * 1000 );
			if( tsf.getHours( ) < options.timeline_earliest_hour ) {
				time_start_filtered = parseInt( time_start_filtered ) + ( options.timeline_earliest_hour * 60 * 60 );
				time_total_filtered = parseInt( time_total_filtered ) - ( options.timeline_earliest_hour * 60 * 60 );
			}
		}

		per = p.attr( 'data-length' ) / ( time_total_filtered / 60 ) * 100;
		offset = ( ( p.attr( 'data-start-timestamp' ) - time_start_filtered ) / time_total_filtered ) * 100;

		//
		if( p.find( '.' + grouping ).text( ) != prev_group ) {
			rows.push( 'group: ' + p.find( '.' + grouping ).text( ) );
			group = jQuery( '<p class="group-name">' + p.find( '.' + grouping ).text( ) + '</p>' );
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
		if( offset < 0 ) {
			p.find( '.title' ).css( 'position', 'absolute' ).css( 'left', ( ( -1 * p.position( ).left ) + 6 ) + 'px' );
		}

		prev_group = p.find( '.' + grouping ).text( );
	} );

	jQuery( '#kompassi_programme' ).css( 'height', 'calc( var(--kompassi-programme-timeline-row-height) * ' + ( rows.length ) + ' )' )

	first_hour = new Date( time_start_filtered * 1000 ).getHours( );
	for( i = 0; i < Math.ceil( time_total_filtered / 60 / 60 ); i++ ) {
		offset = 100 / Math.ceil( time_total_filtered / 60 / 60 );
		label = i + first_hour;
		label = label % 24;
		if( label < 10 ) {
			label = '0' + label;
		}
		jQuery( '#kompassi_programme' ).append( '<div class="ruler" style="top: var(--kompassi-programme-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% )">' + label + '</div>' );
		if( label == '00' || i == 0 ) {
			d = new Date( time_start_filtered * 1000 + i * 60 * 60 * 1000 );
			jQuery( '#kompassi_programme' ).append( '<strong class="day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% );">' + kompassi_get_date_formatted( d ) + '</div>' );
		}
	}
}

function kompassi_apply_filters( ) {
	//  Show all
	jQuery( '#kompassi_programme article' ).removeClass( 'hidden' );

	//  Iterate through each filter
	jQuery( '#kompassi_programme_filters .filter' ).each( function( index ) {
		filter = jQuery( this );

		// Attribute filters
		if( filter.hasClass( 'filter-attribute' ) ) {
			if( filter.val( ) !== '0' ) {
				jQuery( '#kompassi_programme article' ).filter( function( ) { return jQuery( this ).find( '.' + filter.attr( 'data-attribute' ) ).text( ) !== filter.val( ); } ).addClass( 'hidden' );
				// jQuery( '#kompassi_programme article:not([' + jQuery( this ).attr( 'data-attr' ) + '="' + this.value + '"])' ).addClass( 'hidden' );
			}
		}

		// Tag filters
		// TODO

		// Text filter
		if( filter.hasClass( 'filter-text' ) ) {
			if( filter.val( ) !== '' ) {
				jQuery( '#kompassi_programme article' ).each( function( index ) {
					program = jQuery( this );
					words = filter.val( ).toLowerCase( ).split( ' ' );
					text = program.find( '.title' ).first( ).text( ).toLowerCase( );
					text += ' ' + program.find( '.description' ).first( ).text( ).toLowerCase( );
					jQuery.each( words, function( ) {
						if( !text.includes( this ) ) {
							program.addClass( 'hidden' );
						}
					} );
				} );
			}
		}

		// Date filter
		if( filter.hasClass( 'filter-date' ) ) {
			if( filter.val( ) !== '0' ) {
				time_start_filtered = parseInt( filter.val( ) );
				time_end_filtered = parseInt( filter.val( ) ) + ( 24 * 60 * 60 );
				jQuery( '#kompassi_programme article' ).each( function( index ) {
					program = jQuery( this );
					if( parseInt( program.attr( 'data-start-timestamp' ) ) > time_end_filtered || parseInt( program.attr( 'data-end-timestamp' ) ) <= time_start_filtered ) {
						program.addClass( 'hidden' );
					}
				} );
				date_filtered = true;
			} else {
				date_filtered = false;
			}
		}

		// Favorite filter
		if( filter.hasClass( 'filter-favorite' ) ) {
			if( filter.prop( 'checked' ) ) {
				jQuery( '#kompassi_programme article:not(.is-favorite)' ).addClass( 'hidden' );
			}
		}
	} );

	//  If on timeline, refresh the layout
	if( kompassi_get_display_type( ) == 'timeline' ) {
		kompassi_revert_timeline_layout( );
		kompassi_setup_timeline_layout( );
	}
}

function kompassi_get_display_type( ) {
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

function kompassi_revert_timeline_layout( ) {
	jQuery( '#kompassi_programme' ).css( 'height', 'auto' );
	jQuery( '#kompassi_programme article' ).attr( 'style', '' );
	jQuery( '#kompassi_programme .title' ).css( 'left', '' ).css( 'position', '' );
	jQuery( '#kompassi_programme .day_hint, #kompassi_programme .ruler, #kompassi_programme .group-name' ).remove( );
}

function kompassi_popover( program, posX ) {
	popover = jQuery( '<div id="kompassi_programme_popover" />' );
	markup = '<div class="title">' + jQuery( program ).find( '.title' ).html( ) + '</div>';
	markup += jQuery( program ).find( '.times' ).prop( 'outerHTML' );
	popover.html( markup );
	jQuery( 'body' ).append( popover );
	offset_top = parseInt( jQuery( program ).offset( ).top ) - parseInt( jQuery( window ).scrollTop( ) );
	popover.css( 'top', 'calc( ' + offset_top + 'px - ' + popover.outerHeight( ) + 'px - 0.5em )' );
	popover.css( 'left', 'calc( ' + posX + 'px - ' + popover.outerWidth( ) / 2  + 'px )');
}

//  Helper functions
function kompassi_get_date_formatted( datetime_obj ) {
	const dayNames = [
		_x( 'Sun', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Mon', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Tue', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Wed', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Thu', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Fri', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Sat', 'day abbreviation', 'kompassi-integration' )
	];
	return dayNames[datetime_obj.getDay( )] + ' ' + datetime_obj.getDate( ) + '.' + ( datetime_obj.getMonth( ) + 1 ) + '.';
}

function kompassi_sort_by_group( a, b ) {
	// TODO: return -1 if attrs are not found
	if( jQuery( a ).find( '.' + grouping ).text( ) > jQuery( b ).find( '.' + grouping ).text( ) ) {
		return 1;
	}
	return -1;
}

function filter_unique( value, index, array ) {
  return array.indexOf( value ) === index;
}
