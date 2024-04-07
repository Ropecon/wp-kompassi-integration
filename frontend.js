__ = wp.i18n.__;
_x = wp.i18n._x;
_n = wp.i18n._n;
sprintf = wp.i18n.sprintf;

var timeline_grouping = 'room_name';

var kompassi_cookie;
var kompassi_event = {};
var kompassi_filters = {};
var kompassi_timeouts = {};
var kompassi_user_options = {};

jQuery( function( e ) {
	block = jQuery( '#kompassi_block_schedule' );

	/*
	 *  Set up cookie for user preferences, including favorites
	 *
	 */

	kompassi_cookie = Cookies.get( 'kompassi_integration' );
	if( kompassi_cookie == undefined ) {
		kompassi_cookie = { favorites: [] };
		Cookies.set( 'kompassi_integration', JSON.stringify( kompassi_cookie ), { expires: 365, sameSite: 'strict', secure: true } );
	} else {
		kompassi_cookie = JSON.parse( kompassi_cookie );
		jQuery.each( kompassi_cookie.favorites, function( ) {
			jQuery( '#' + this ).addClass( 'is-favorite' );
		} );
	}

	/*
	 *  Additional markup for items
	 *
	 */

	jQuery( '#kompassi_schedule article' ).each( function( ) {
		actions = jQuery( '<div class="actions" style="grid-area: actions;" />' );
		actions.append( '<a class="favorite kompassi-icon-favorite" />' );
		jQuery( this ).find( '.description' ).before( actions );
	} );

	/*
	 *  Get date/time related information about program
	 *  - Earliest starting time for program
	 *  - Latest ending time for program
	 *  - List of dates the program spans through
	 *
	 */

	kompassi_event.start = new Date( parseInt( jQuery( '#kompassi_schedule article' ).first( ).attr( 'data-start' ) ) * 1000 );
	kompassi_event.end = new Date( kompassi_event.start );
	jQuery( '#kompassi_schedule article' ).each( function( ) {
		if( kompassi_event.end / 1000 < jQuery( this ).attr( 'data-end' ) ) {
			kompassi_event.end.setTime( parseInt( jQuery( this ).attr( 'data-end' ) * 1000 ) );
		}
	} );

	//  Always start and end with even hours
	kompassi_event.start.setMinutes( 0, 0, 0 );
	kompassi_event.end.setMinutes( 0, 0, 0 );

	// Get list of dates
	dates_start = new Date( kompassi_event.start );
	i = dates_start.setHours( 0 ).valueOf( );
	let dates = {};
	while( i < kompassi_event.end ) {
		dates[i] = {
			'long': kompassi_get_date_formatted( i / 1000, true, true ),
			'short': kompassi_get_date_formatted( i / 1000, true, false ),
			'ymd': dayjs( i ).format( 'YYYY-MM-DD' )
		};
		i += 24 * 60 * 60 * 1000;
	}

	/*
	 *  Generate toolbar markup
	 *
	 */

	toolbar = jQuery( '<section id="kompassi_schedule_toolbar" />' );
	toolbar.prependTo( block );

	/*  Date filter  */
	date_section = jQuery( '<section id="kompassi_schedule_dates"  class="kompassi-button-group" />' );
	//  TODO: Only show "Next" if there is anything to show?
	date_next_toggle = jQuery( '<a class="date-toggle no-icon" data-date="next">' + _x( 'Next', 'date filter', 'kompassi-integration' ) + '</a>' );
	date_section.append( date_next_toggle );
	jQuery.each( dates, function( timestamp, labels ) {
		date_toggle = jQuery( '<a class="date-toggle no-icon" data-date="' + labels.ymd + '" data-timestamp="' + timestamp + '" title="' + labels.long + '">' + labels.short + '</a>' );
		date_section.append( date_toggle );
	} );

	jQuery( date_section ).on( 'click', '.date-toggle', function( ) {
		if( jQuery( this ).hasClass( 'active' ) ) {
			jQuery( this ).removeClass( 'active' );
		} else {
			date_section.find( '.date-toggle' ).removeClass( 'active' );
			jQuery( this ).addClass( 'active' );
		}
		kompassi_apply_filters( );
	} );

	date_section.appendTo( toolbar );

	/*  Filtering section  */
	filtering_section = jQuery( '<section id="kompassi_schedule_filtering" class="kompassi-button-group has-icon-and-label" />' );
	toggle_favorites = jQuery( '<a class="favorites-toggle kompassi-icon-favorite">' + __( 'Favorites', 'kompassi-integration' ) + '</a>' ).appendTo( filtering_section );
	toggle_filters = jQuery( '<a class="filters-toggle kompassi-icon-filter">' + _x( 'Filter', 'verb (shown before filters)', 'kompassi-integration' ) + '<span class="indicator"></span></a>' ).appendTo( filtering_section );
	filtering_section.appendTo( toolbar );

	toggle_favorites.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		kompassi_apply_filters( );
	} );

	toggle_filters.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		jQuery( '#kompassi_schedule_filters' ).toggleClass( 'visible' );
	} );

	/*  Filter popup  */
	filters = jQuery( '<section id="kompassi_schedule_filters" />' );

	//  Text filter
	filters.append( jQuery( '<input class="filter filter-text" name="filter_text" placeholder="' + __( 'Text search (title, description)', 'kompassi-integration' ) + '" />' ) );

	//  Dimension filters
	//  TODO: Possibility to hide dimensions from this list
	jQuery.each( kompassi_schedule_dimensions, function( index, dimension ) {
		console.log( dimension );
		select = jQuery( '<select class="filter filter-dimension" name="filter_' + dimension.slug + '" data-dimension="' + dimension.slug + '" />' );
		select.append( jQuery( '<option value="0">-- ' + dimension.title + ' --</option>' ) );
		jQuery.each( this.values, function( index, value ) {
			select.append( jQuery( '<option value="' + value.slug + '">' + value.title + '</option>' ) );
		} );
		filters.append( select );
	} );

	// Clear filters
	clear_filters = jQuery( '<a href="#" class="clear-filters">' + __( 'Clear filters', 'kompassi-integration' ) + '</button>' );
	clear_filters.hide( );
	clear_filters.on( 'click', function( ) {
		jQuery( filters ).children( ).each( function( index ) {
			if( jQuery( this ).hasClass( 'filter-dimension' ) ) {
				jQuery( this ).val( '0' );
			}
			if( jQuery( this ).hasClass( 'filter-text' ) ) {
				jQuery( this ).val( '' );
			}
		} );
		kompassi_apply_filters( );
	} );
	filters.append( clear_filters );

	//  Show filters
	filters.insertAfter( toolbar );

	//  Handle filtering
	filters.on( 'change', '.filter-dimension', kompassi_apply_filters );
	filters.on( 'keyup', '.filter-text', function( ) {
		clearTimeout( kompassi_timeouts['text-filter'] );
		kompassi_timeouts['text-filter'] = setTimeout( kompassi_apply_filters, 300 );
	} );

	/*  Show event count  */
	jQuery( '<section id="kompassi_event_count" />' ).appendTo( toolbar );
	kompassi_update_event_count( );

 	/*  Display styles  */
	styles = {
		'list': _x( 'List', 'display style', 'kompassi-integration' ),
		'timeline': _x( 'Timeline', 'display style', 'kompassi-integration' )
	};
	ds = jQuery( '<section id="kompassi_schedule_display" class="kompassi-button-group has-icon-and-label" />' );
	jQuery.each( styles, function( style, label ) {
		link = jQuery( '<a class="kompassi-icon-' + style + '" data-display="' + style + '">' + label + '</a>' );
		ds.append( link );
		if( jQuery( '#kompassi_schedule' ).attr( 'data-display' ) == style ) {
			link.addClass( 'active' );
		}
	} );
	toolbar.append( ds );

	// Change display type
	jQuery( '#kompassi_schedule_display' ).on( 'click', 'a', function( ) {
		if( jQuery( this ).hasClass( 'active' ) ) {
			return;
		}

		kompassi_setup_display( jQuery( this ).attr( 'data-display' ) );
	} );

	/*
	 *  Container for notes section
	 *
	 */

	jQuery( '<section id="kompassi_schedule_notes" />' ).insertAfter( filters );

	/*
	 *  Toggle favorites
	 *
	 */

	jQuery( 'body' ).on( 'click', 'article.kompassi-program .favorite', kompassi_toggle_favorite );

	/*
	 *  Apply user options
	 *
	 */

	filters_from_url = false;
	hash = new URL( window.location ).hash.substring( 1 ).split( '/' );
	jQuery( hash ).each( function( opt_pair ) {
		opt = this.split( ':' );
		if( !opt[1] ) {
			kompassi_user_options[opt[0]] = true;
		} else {
			kompassi_user_options[opt[0]] = opt[1];
		}

		// Filters
		filter = jQuery( '[name="filter_' + opt[0] + '"]' );
		if( filter.length > 0 ) {
			if( filter.prop( 'tagName' ) == 'SELECT' ) {
				filter.find( '[value="' + opt[1] + '"]').attr( 'selected', 'selected' );
			} else if( filter.prop( 'tagName' ) == 'INPUT' ) {
				filter.val( opt[1] );
			}
			filters_from_url = true;
		}
	} );

	// If filters are set from URL, open filters toolbar
	if( filters_from_url == true ) {
		jQuery( '.filters-toggle' ).addClass( 'active' );
		jQuery( '#kompassi_schedule_filters' ).toggleClass( 'visible' );
	}

	// Date
	if( kompassi_user_options.date ) {
		if( jQuery( '.date-toggle[data-date="' + kompassi_user_options.date + '"]' ).length > 0 ) {
		 	jQuery( '.date-toggle[data-date="' + kompassi_user_options.date + '"]' ).addClass( 'active' );
			filters_from_url = true;
		}
	}

	// Favorites
	if( kompassi_user_options.favorites ) {
		jQuery( '.favorites-toggle' ).addClass( 'active' );
		filters_from_url = true;
	}

	// Apply filters
	if( filters_from_url == true ) {
		kompassi_apply_filters( );
	}

	if( kompassi_user_options.prog ) {
		if( jQuery( '#' + kompassi_user_options.prog ).length > 0 ) {
			kompassi_show_modal( jQuery( '#' + kompassi_user_options.prog ) );
		}
	}

	//  Display style
	if( kompassi_user_options.display && Object.keys( styles ).indexOf( kompassi_user_options.display ) > -1 ) {
		kompassi_setup_display( kompassi_user_options.display );
	}

	/*
	 *  Popover for program
	 *
	 */

	jQuery( '#kompassi_schedule article' ).on( 'mouseover', function( e ) {
		if( !jQuery( '#kompassi_schedule' ).hasClass( 'timeline' ) ) {
			return;
		}
		clearTimeout( kompassi_timeouts['popover'] );
		kompassi_timeouts['popover'] = setTimeout( kompassi_popover, 300, this, e.pageX );
	} );
	jQuery( '#kompassi_schedule article' ).on( 'mouseout', function( e ) {
		clearTimeout( kompassi_timeouts['popover'] );
		jQuery( '#kompassi_program_popover' ).remove( );
	} );

	/*
	 *  Modal for program
	 *
	 */

	jQuery( '#kompassi_schedule article' ).on( 'click', function( e ) {
		if( jQuery( e.target ).hasClass( 'favorite' ) ) {
			return;
		}
		kompassi_show_modal( jQuery( this ) );
	} );

	// Close modals when clicking on modal bg or close button or when pressing Esc
	jQuery( 'body' ).on( 'click', '#kompassi_schedule_modal_bg, #kompassi_modal .actions .close', kompassi_close_modal );
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( e.keyCode == 27 ) {
			kompassi_close_modal( e );
		}
	} );

	kompassi_setup_display( );

	//
	jQuery( window ).on( 'scroll', kompassi_schedule_timeline_sticky_header );
} );

/*
 *  Filter: Toggle Favorites
 *
 */

function kompassi_toggle_favorite( ) {
	art_id = jQuery( this ).closest( 'article.kompassi-program' ).attr( 'data-id' );
	jQuery( 'article.kompassi-program[data-id="' + art_id + '"]' ).toggleClass( 'is-favorite' );
	if( kompassi_cookie.favorites.includes( art_id ) ) {
		kompassi_cookie.favorites = kompassi_cookie.favorites.filter( function( id ) { return id !== art_id; } );
	} else {
		kompassi_cookie.favorites.push( art_id );
	}
	Cookies.set( 'kompassi_integration', JSON.stringify( kompassi_cookie ), { expires: 365, sameSite: 'strict', secure: true } );
}

/*
 *  Get and show (visible) event count
 *
 */

function kompassi_update_event_count( ) {
	event_count = jQuery( '#kompassi_schedule article:not(.filtered)' ).length;
	if( kompassi_filters.enabled > 0 ) {
		// translators: count of programs visible
		event_count_label = _n( '%s program visible', '%s programs visible', event_count, 'kompassi-integration' );
	} else {
		// translators: count of programs
		event_count_label = _n( '%s program', '%s programs', event_count, 'kompassi-integration' );
	}
	event_count_label = event_count_label.replace( '%s', event_count );
	jQuery( '#kompassi_schedule_toolbar #kompassi_event_count' ).html( event_count_label );
}

/*
 *  Update date view parameters
 *
 */

function kompassi_update_date_view_parameters( ) {
	kompassi_filters.date = { };
	if( block.find( '.date-toggle.active' ).length > 0 ) {
		selected_date = block.find( '.date-toggle.active' ).first( );
		if( selected_date.attr( 'data-date' ) == 'next' ) {
			kompassi_filters.date.start = new Date( );
			// This is for debugging purposes...
			if( kompassi_user_options.now ) {
				kompassi_filters.date.start.setTime( kompassi_user_options.now * 1000 ).setMinutes( 0, 0, 0 );
			}
			// TODO: Allow user to select how much program to show?
			kompassi_filters.date.length_hours = 2;
		} else {
			timestamp = selected_date.attr( 'data-timestamp' );
			start_of_day = parseInt( kompassi_options.schedule_start_of_day );
			end_of_day = parseInt( kompassi_options.schedule_end_of_day );

			// Calculate Start of Day
			kompassi_filters.date.start = new Date( parseInt( timestamp ) + ( start_of_day * 3600 ) * 1000 );
			if( kompassi_filters.date.start < kompassi_event.start ) {
				// Never start before event start (be nice to timeline)
				kompassi_filters.date.start = new Date( kompassi_event.start );
				start_of_day = kompassi_filters.date.start.getHours( );
			}

			// Calculate Length of Day
			if( end_of_day > start_of_day ) {
				// During the same day
				kompassi_filters.date.length_hours = end_of_day - start_of_day;
			} else if( end_of_day < start_of_day ) {
				// Wraps over to next date
				kompassi_filters.date.length_hours = 24 - start_of_day + end_of_day;
			} else {
				// Exactly 24 hours
				kompassi_filters.date.length_hours = 24;
			}

			// Calculate End of Day
			kompassi_filters.date.end = new Date( kompassi_filters.date.start.valueOf( ) + ( kompassi_filters.date.length_hours * 3600 * 1000 ) );
			if( kompassi_filters.date.end > kompassi_event.end ) {
				// Never end after event end (be nice to timeline)
				kompassi_filters.date.end = new Date( kompassi_event.end );
				kompassi_filters.date.length_hours = kompassi_get_difference_in_hours( kompassi_filters.date.start, kompassi_filters.date.end );
			}
		}

		kompassi_filters.date.filtered = true;
		kompassi_filters.enabled += 1;
	} else {
		kompassi_filters.date.start = new Date( kompassi_event.start );
		kompassi_filters.date.end = new Date( kompassi_event.end );
		kompassi_filters.date.length_hours = kompassi_get_difference_in_hours( kompassi_filters.date.start, kompassi_filters.date.end );
	}
}

/*
 *  Filters: Apply
 *
 */

function kompassi_apply_filters( ) {
	//  Show all and remove notification if exists
	jQuery( '#kompassi_schedule article' ).removeClass( 'filtered multiday-overlap' );
	jQuery( '#kompassi_schedule_notes .filter, #kompassi_programs_continuing' ).remove( );

	kompassi_filters = { };
	filter_count = 0;

	//  Iterate through each filter
	jQuery( '#kompassi_schedule_filters .filter' ).each( function( index ) {
		filter = jQuery( this );

		// Dimension filters
		if( filter.hasClass( 'filter-dimension' ) ) {
			if( filter.val( ) !== '0' ) {
				jQuery( '#kompassi_schedule article:visible' ).filter( function( ) {
					prog_dimension = jQuery( this ).attr( 'data-' + filter.attr( 'data-dimension' ) );
					return prog_dimension !== filter.val( );
				} ).addClass( 'filtered' );
				filter_count += 1;
			}
		}

		// Text filter
		search_targets = {
			'title': 100,
			'formatted_hosts': 10,
			'description': 1
		};
		if( filter.hasClass( 'filter-text' ) ) {
			if( filter.val( ) !== '' ) {
				jQuery( '#kompassi_schedule article:visible' ).each( function( index ) {
					program = jQuery( this );
					program_relevance = 0;
					words = filter.val( ).toLowerCase( ).split( ' ' ); // words to look for
					jQuery.each( search_targets, function( target, target_relevance_score ) {
						text = program.find( '.' + target ).first( ).text( ).toLowerCase( );
						jQuery.each( words, function( ) {
							if( text.includes( this ) ) {
								program_relevance += target_relevance_score;
							}
						} );
					} );
					if( program_relevance > 0 ) {
						program.css( 'order', '-' + program_relevance ); // Sort text searches by relevance
					} else {
						program.addClass( 'filtered' );
					}
				} );
				jQuery( '#kompassi_schedule_notes' ).append( '<div class="filter not-timeline">' + __( 'Search results are sorted by relevance, not chronologically, when using text search.', 'kompassi-integration' ) + '</div>' );
				filter_count += 1;
			}
		}
	} );

	// Show how many filters from the dropdown area are activated
	if( filter_count > 0 ) {
		block.find( '.filters-toggle .indicator' ).text( filter_count );
	} else {
		block.find( '.filters-toggle .indicator' ).empty( );
	}

	kompassi_filters.enabled = filter_count;

	// Date filter
	kompassi_update_date_view_parameters( );
	jQuery( '#kompassi_schedule article:visible' ).each( function( index ) {
		program = jQuery( this );
		program_start = parseInt( program.attr( 'data-start' ) );
		program_end = parseInt( program.attr( 'data-end' ) );
		if( program_start > kompassi_filters.date.end / 1000 || program_end <= kompassi_filters.date.start / 1000 ) {
			program.addClass( 'filtered' );
		}
		if( program_start < kompassi_filters.date.start / 1000 && program_end > kompassi_filters.date.start / 1000 ) {
			program.addClass( 'multiday-overlap' );
		}
	} );

	// Favorite filter
	if( block.find( '.favorites-toggle' ).hasClass( 'active' ) ) {
		jQuery( '#kompassi_schedule article:not(.is-favorite)' ).addClass( 'filtered' );
		kompassi_filters.enabled += 1;
	}

	//  If on timeline, refresh the layout
	if( kompassi_get_display_type( ) == 'timeline' ) {
		kompassi_revert_timeline_layout( );
		kompassi_setup_timeline_layout( );
	}

	// If there is no program that matches the search, show notification
	if( jQuery( '#kompassi_schedule article:not(.filtered)' ).length == 0 ) {
		jQuery( '#kompassi_schedule_notes' ).append( '<div class="filter">' + __( 'Nothing matched your search!', 'kompassi-integration' ) + '</div>' );
	}

	// If there is no text search and there is a date search, and there is programs that have started before the filtered timerange, show notification
	if( block.find( '.date-toggle.active' ).length > 0 ) {
		if( parseInt( kompassi_options.schedule_start_of_day ) !== 0 || parseInt( kompassi_options.schedule_end_of_day ) !== 0 ) {
			start_of_day = parseInt( kompassi_options.schedule_start_of_day );
			end_of_day = parseInt( kompassi_options.schedule_end_of_day );
			// translators: start of day hour, end of day hour
			jQuery( '#kompassi_schedule_notes' ).append( '<div class="filter not-timeline">' + sprintf( __( 'Note: This view shows programs starting between %1$s and %2$s.', 'kompassi-integration' ), start_of_day, end_of_day ) + '</div>' );
		}
		// TODO: Show note about the Start/End of Day times
		if( jQuery( '#kompassi_schedule_filters [name="filter_text"]' ).val( ).length < 1 && jQuery( '#kompassi_schedule article.multiday-overlap' ).length > 0 ) {
			count = jQuery( '#kompassi_schedule article.multiday-overlap:visible' ).length;
			// translators: amount of repositioned events
			jQuery( '#kompassi_schedule_notes' ).append( '<div class="filter not-timeline">' + sprintf( _n( '%d program which started before the timerange is listed at the end of the results.', '%d programs which started before the timerange are listed at the end of the results.', count, 'kompassi-integration' ), count ) + '<a href="#kompassi_programs_continuing">' + ' ' + _x( 'Jump there!', 'link to another position in the page', 'kompassi-integration' ) + '</a></div>' );
			jQuery( '#kompassi_schedule article.multiday-overlap' ).first( ).before( '<h3 id="kompassi_programs_continuing"">' + __( 'Programs continuing', 'kompassi-integration' ) + '</h3>' );
		}
	}

	//
	if( kompassi_filters.enabled > 0 ) {
		jQuery( '#kompassi_schedule_filters .clear-filters' ).show( );
	} else {
		jQuery( '#kompassi_schedule_filters .clear-filters' ).hide( );
	}

	kompassi_update_url_hash( );
	kompassi_update_event_count( );
}

/*
 *  Setup display
 *
 */

function kompassi_setup_display( display_type = false ) {
	if( display_type === false ) {
		display_type = kompassi_get_display_type( );
	}

	jQuery( '#kompassi_schedule' ).removeClass( 'list timeline' ).addClass( display_type );
	if( display_type == 'timeline' ) {
		kompassi_setup_timeline_layout( );
		jQuery( '#kompassi_schedule_notes .filter.not-timeline' ).hide( );
	} else {
		kompassi_revert_timeline_layout( );
		jQuery( '#kompassi_schedule_notes .filter.not-timeline' ).show( );
	}

	jQuery( '#kompassi_schedule_display a' ).removeClass( 'active' );
	jQuery( '#kompassi_schedule_display [data-display="' + display_type + '"]' ).addClass( 'active' );
}

/*
 *  Timeline: Setup layout
 *
 */

function kompassi_setup_timeline_layout( ) {
	rows = [ 'day hints', 'time hints' ];

	kompassi_update_date_view_parameters( );

	prev_group = '';
	var grouping_row = 1;

	length = kompassi_filters.date.length_hours * 60;

	jQuery( '#kompassi_schedule article:visible' ).sort( kompassi_sort_by_group ).each( function( index ) {
		program = jQuery( this );

		// Count the width % and offset % for program
		width = program.attr( 'data-length' ) / length * 100;
		offset_in_s = program.attr( 'data-start' ) - ( kompassi_filters.date.start.valueOf( ) / 1000 );
		offset_in_m = offset_in_s / 60;
		offset = offset_in_m / length * 100;

		// See if we need to add a group heading
		if( program.find( '.' + timeline_grouping ).text( ) != prev_group ) {
			rows.push( 'group: ' + program.find( '.' + timeline_grouping ).text( ) );
			group = jQuery( '<p class="group-name">' + program.find( '.' + timeline_grouping ).text( ) + '</p>' );
			grouping_row = rows.length - 1;
			group.css( 'top', 'calc( ' + grouping_row + ' * var(--kompassi-schedule-timeline-row-height)' );
			jQuery( '#kompassi_schedule' ).append( group );
		}

		current_row = grouping_row;

		has_row = false;
		while( has_row == false ) {
			if( typeof rows[current_row] === 'undefined' ) {
				// Row does not exist, create new
				rows.push( program.attr( 'data-end' ) );
				rownum = rows.length - 1;
				has_row = true;
			}
			if( rows[current_row] <= program.attr( 'data-start' ) ) {
				// Rows last event ends before or at the same time as this one starts
				rows[current_row] = program.attr( 'data-end' );
				rownum = current_row;
				has_row = true;
			}
			current_row = current_row + 1;
		}
		// End grouping

		program.css( 'width', 'calc( ' + width + '% - 5px )' );
		program.css( 'min-width', 'calc( ' + width + '% - 5px )' );
		program.css( 'left', 'calc( ' + offset + '% + 3px )' );
		program.css( 'top', 'calc( ' + rownum + ' * var(--kompassi-schedule-timeline-row-height)' ); // Grouping
		if( offset < 0 ) {
			program.find( '.title' ).css( 'position', 'absolute' ).css( 'left', ( ( -1 * program.position( ).left ) + 6 ) + 'px' );
		}

		prev_group = program.find( '.' + timeline_grouping ).text( ); // Grouping
	} );

	// Make the schedule high enough to contain all rows
	jQuery( '#kompassi_schedule' ).css( 'height', 'calc( var(--kompassi-schedule-timeline-row-height) * ' + ( rows.length ) + ' )' );

	// Rulers
	for( i = 0; i < Math.ceil( kompassi_filters.date.length_hours ); i++ ) {
		offset = 100 / Math.ceil( kompassi_filters.date.length_hours );
		label = ( kompassi_filters.date.start.getHours( ) + i ) % 24;
		label.toString( ).padStart( 2, '0' );
		jQuery( '#kompassi_schedule' ).append( '<div class="ruler ' + ( i % 2 == 0 ? 'even' : 'odd' ) + '" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% );">' + label + '</div>' );
		if( label == '00' || i == 0 ) {
			d = kompassi_filters.date.start.valueOf( ) / 1000 + ( i * 60 * 60 );
			jQuery( '#kompassi_schedule' ).append( '<strong class="day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% );">' + kompassi_get_date_formatted( d ) + '</div>' );
		}
	}
}

/*
 *  Timeline: Revert layout
 *
 */

function kompassi_revert_timeline_layout( ) {
	jQuery( '#kompassi_schedule' ).css( 'height', 'auto' );
	jQuery( '#kompassi_schedule article' ).attr( 'style', '' );
	jQuery( '#kompassi_schedule .title' ).css( 'left', '' ).css( 'position', '' );
	jQuery( '#kompassi_schedule .day_hint, #kompassi_schedule .ruler, #kompassi_schedule .group-name' ).remove( );
}

/*
 *  Modal
 *
 */


/*  Open  */

function kompassi_show_modal( program ) {
	modal = program.clone( );
	modal.attr( 'id', 'kompassi_modal' ).attr( 'style', '' ).addClass( 'kompassi_block_schedule' );
	modal.children( '.title' ).css( 'position', '' );
	modal.find( '.actions' ).addClass( 'kompassi-button-group has-icon-only' ).append( '<a class="close kompassi-icon-close" />' );

	// Modal header
	modal.children( '.title, .actions' ).wrapAll( '<div class="header" />' );
	// Modal content
	content = jQuery( '<div class="content" />' ).appendTo( modal );
	modal.children( ':not(.header)' ).detach( ).appendTo( content );
	content.children( '.short_blurb, .description' ).wrapAll( '<div class="main" />' );
	meta = jQuery( '<div class="meta" />' );
	content.children( '.dimension' ).wrapAll( '<div class="dimensions" />' );
	content.children( ':not(.main)' ).detach( ).appendTo( meta );
	meta.appendTo( content );
	content.appendTo( modal );

	modal.appendTo( jQuery( 'body' ) );
	jQuery( 'body' ).append( '<div id="kompassi_modal_bg" />' ).css( 'overflow', 'hidden' );

	kompassi_update_url_hash( );
}

/*  Close  */

function kompassi_close_modal( ) {
	jQuery( '#kompassi_modal_bg, #kompassi_modal' ).remove( );
	jQuery( 'body' ).css( 'overflow', 'auto' );
	kompassi_update_url_hash( );
}

/*
 *  Popover
 *
 */

function kompassi_popover( program, posX ) {
	popover = jQuery( '<div id="kompassi_program_popover" class="kompassi_block_schedule" />' );
	markup = jQuery( program ).find( '.title' ).prop( 'outerHTML' );
	markup += jQuery( program ).find( '.times' ).prop( 'outerHTML' );
	if( jQuery( program ).find( '.short_blurb' ).text( ).length > 0 ) {
		markup += jQuery( program ).find( '.short_blurb' ).prop( 'outerHTML' );
	}
	popover.html( markup );
	jQuery( 'body' ).append( popover );
	offset_top = parseInt( jQuery( program ).offset( ).top ) - parseInt( jQuery( window ).scrollTop( ) );
	popover.css( 'top', 'calc( ' + offset_top + 'px - ' + popover.outerHeight( ) + 'px - 0.5em )' );
	popover.css( 'left', 'calc( ' + posX + 'px - ' + popover.outerWidth( ) / 2  + 'px )');
}

/*
 *
 *
 */

function kompassi_schedule_timeline_sticky_header( ) {
	return; // TODO
	jQuery( '#kompassi_schedule.timeline' ).each( function( ) {
		var top = this.offsetTop;
		var bottom = top + this.scrollHeight;
		var scroll = window.scrollY;

		if( scroll > top && scroll < bottom ) {
			jQuery( this ).find( '.day_hint' ).addClass( 'sticky' );
			//tables[i].children[0].style.left = tables[i].offsetLeft + 'px';
			//tables[i].children[0].style.width = tables[i].offsetWidth + 'px';
		} else {
			jQuery( this ).find( '.day_hint' ).removeClass( 'sticky' );
		}
	} );
}

//  Helper functions
function kompassi_get_display_type( display_type = '' ) {
	if( display_type !== '' ) {
		return display_type;
	} else {
		if( jQuery( '#kompassi_schedule' ).hasClass( 'list' ) ) { display_type = 'list'; }
		if( jQuery( '#kompassi_schedule' ).hasClass( 'timeline' ) ) { display_type = 'timeline'; }
	}
	return display_type;
}

/**
 *  Returns a date formatted in human readable format.
 *
 *  @param {int} timestamp Unix timestamp
 *  @param {bool} weekday Whether to return the weekday name or not
 *  @param {bool} date Whether to return the date or not
 *
 *  @return {string} Formatted date
 *
 */

function kompassi_get_date_formatted( timestamp, weekday = true, date = true ) {
	datetime_obj = new Date( timestamp * 1000 );
	const dayNames = [
		_x( 'Sun', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Mon', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Tue', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Wed', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Thu', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Fri', 'day abbreviation', 'kompassi-integration' ),
		_x( 'Sat', 'day abbreviation', 'kompassi-integration' )
	];
	formatted = '';
	if( weekday == true ) {
		formatted += dayNames[datetime_obj.getDay( )];
	}
	if( weekday == true && date == true ) {
		formatted += ' ';
	}
	if( date == true ) {
		formatted += datetime_obj.getDate( ) + '.' + ( datetime_obj.getMonth( ) + 1 ) + '.';
	}
	return formatted;
}

/**
 *  Returns difference of two timestamps in hours
 *
 *  @param {Date} a Date object
 *  @param {Date} b Date object
 *
 *  @return {int} Difference of timestamps in hours
 *
 */

function kompassi_get_difference_in_hours( a, b ) {
	ms_to_hour = 1000 * 60 * 60;
	difference = b - a;
	return difference / ms_to_hour;
}

/**
 *
 *
 */

function kompassi_update_url_hash( ) {
	opts = [];

	// If program modal is open, dismiss other options
	if( jQuery( '#kompassi_modal' ).length > 0 ) {
		opts.push( 'prog:' + jQuery( '#kompassi_modal' ).attr( 'data-id' ) );
	} else {
		// Date
		if( jQuery( '.date-toggle.active' ).length > 0 ) {
			opts.push( 'date:' + jQuery( '.date-toggle.active' ).first( ).attr( 'data-date' ) );
		}

		// Favorites
		if( jQuery( '.favorites-toggle' ).hasClass( 'active' ) ) {
			opts.push( 'favorites:1' );
		}

		// Filters
		jQuery( '[name^="filter_"]' ).each( function( ) {
			filter = jQuery( this );
			opt_name = filter.attr( 'name' ).substring( 7 ); // Strip filter_
			if( filter.prop( 'tagName' ) == 'SELECT' ) {
				if( filter.val( ) != 0 ) {
					opts.push( opt_name + ':' + filter.val( ) );
				}
			} else if( filter.prop( 'tagName' ) == 'INPUT' ) {
				if( filter.val( ) ) {
					opts.push( opt_name + ':' + filter.val( ) );
				}
			}
		} );
	}

	window.location.hash = opts.join( '/' );
}

/**
 */

function kompassi_sort_by_group( a, b ) {
	if( jQuery( a ).find( '.' + timeline_grouping ).text( ) > jQuery( b ).find( '.' + timeline_grouping ).text( ) ) {
		return 1;
	}
	return -1;
}

function filter_unique( value, index, array ) {
  return array.indexOf( value ) === index;
}
