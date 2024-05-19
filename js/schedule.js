__ = wp.i18n.__;
_x = wp.i18n._x;
_n = wp.i18n._n;
sprintf = wp.i18n.sprintf;

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
		actions = jQuery( this ).find( '.actions' );
		actions.prepend( '<a class="favorite kompassi-icon-favorite" title="' + _x( 'Favorite', 'button label', 'kompassi-integration' ) + '"/>' );
	} );

	/*
	 *  Get date/time related information about program
	 *  - Earliest starting time for program
	 *  - Latest ending time for program
	 *  - List of dates the program spans through
	 *
	 */

	kompassi_event.start = new Date( parseInt( jQuery( '#kompassi_schedule article' ).first( ).data( 'start' ) ) * 1000 );
	kompassi_event.end = new Date( kompassi_event.start );
	jQuery( '#kompassi_schedule article' ).each( function( ) {
		if( kompassi_event.end / 1000 < jQuery( this ).data( 'end' ) ) {
			kompassi_event.end.setTime( parseInt( jQuery( this ).data( 'end' ) * 1000 ) );
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

	/*  Help  */
	help_section = jQuery( '<section id="kompassi_schedule_help" class="kompassi-button-group has-icon-only" />' );
	help_button = jQuery( '<a class="schedule-help kompassi-icon-help" title="' + __( 'Help', 'kompassi-integration' ) + '">&nbsp;</a>' ).appendTo( help_section );
	help_section.appendTo( toolbar );

	help_button.on( 'click', function( ) {
		kompassi_schedule_help_modal( );
	} );

	/*  Filter popup  */
	filters = jQuery( '<section id="kompassi_schedule_filters" />' );

	//  Text filter
	filters.append( jQuery( '<input class="filter filter-text" name="filter_text" placeholder="' + __( 'Text search (title, description)', 'kompassi-integration' ) + '" />' ) );

	//  Dimension filters
	jQuery.each( kompassi_schedule_dimensions, function( index, dimension ) {
		if( kompassi_options.hidden_dimensions.indexOf( dimension.slug ) > -1 ) {
			return;
		}
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
		if( jQuery( '#kompassi_schedule' ).data( 'display' ) == style ) {
			link.addClass( 'active' );
		}
	} );
	toolbar.append( ds );

	// Change display type
	jQuery( '#kompassi_schedule_display' ).on( 'click', 'a', function( ) {
		if( jQuery( this ).hasClass( 'active' ) ) {
			return;
		}

		kompassi_setup_display( jQuery( this ).data( 'display' ) );
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

	jQuery( 'body' ).on( 'click', '.kompassi-program .favorite', kompassi_toggle_favorite );

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
				filter.val( decodeURIComponent( opt[1] ) );
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
			kompassi_program_modal( jQuery( '#' + kompassi_user_options.prog ) );
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
		options = {
			title: jQuery( this ).find( '.title' ).text( ),
			content: jQuery( this ).find( '.times' ).html( )
		};
		kompassi_timeouts['popover'] = setTimeout( kompassi_popover, 300, options, e, this );
	} );
	// TODO: Tie this to popover
	jQuery( '#kompassi_schedule article' ).on( 'mouseout', function( e ) {
		clearTimeout( kompassi_timeouts['popover'] );
		jQuery( '#kompassi_popover' ).remove( );
	} );

	/*
	 *  Modal for program
	 *
	 */

	jQuery( '#kompassi_schedule article' ).on( 'click', function( e ) {
		if( jQuery( e.target ).closest( 'div' ).hasClass( 'actions' ) ) {
			return;
		}
		kompassi_program_modal( jQuery( this ) );
	} );

	// Close modals when clicking on modal bg or close button or when pressing Esc
	jQuery( 'body' ).on( 'click', '#kompassi_modal_bg, #kompassi_modal .header .close', kompassi_close_modal );
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( e.keyCode == 27 ) {
			kompassi_close_modal( e );
		}
	} );

	// Setup display
	kompassi_setup_display( );
	//jQuery( window ).on( 'scroll', kompassi_schedule_timeline_sticky_header );

	jQuery( window ).on( 'scroll', kompassi_schedule_timeline_sticky_header );
} );

/*
 *  Filter: Toggle Favorites
 *
 */

function kompassi_toggle_favorite( ) {
	art_id = jQuery( this ).closest( '.kompassi-program' ).data( 'id' );
	jQuery( '.kompassi-program[data-id="' + art_id + '"]' ).toggleClass( 'is-favorite' );
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
		if( selected_date.data( 'date' ) == 'next' ) {
			kompassi_filters.date.start = new Date( );
			// This is for debugging purposes...
			if( kompassi_user_options.now ) {
				kompassi_filters.date.start.setTime( kompassi_user_options.now * 1000 ).setMinutes( 0, 0, 0 );
			}
			// TODO: Allow user to select how much program to show?
			kompassi_filters.date.length_hours = 2;
		} else {
			timestamp = selected_date.data( 'timestamp' );
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

		if( kompassi_filters.enabled > 0 && jQuery( '#kompassi_schedule article:visible' ).length > 0 ) {
			starts = [];
			ends = [];

			jQuery( '#kompassi_schedule article:visible' ).each( function ( ) {
				starts.push( jQuery( this ).data( 'start' ) );
				ends.push( jQuery( this ).data( 'end' ) );
			} );

			kompassi_filters.date.start = new Date( Math.min( ...starts ) * 1000 );
			kompassi_filters.date.end = new Date( Math.max( ...ends ) * 1000 );
		}

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
					prog_dimension = jQuery( this ).data( '' + filter.data( 'dimension' ) );
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
		program_start = parseInt( program.data( 'start' ) );
		program_end = parseInt( program.data( 'end' ) );
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

	kompassi_update_url_hash( );
}

/*
 *  Timeline: Setup layout
 *
 */

function kompassi_setup_timeline_layout( ) {
	rows = [ 'day hints', 'time hints' ];

	kompassi_update_date_view_parameters( );

	prev_group = undefined;
	group_index = 0;

	length = kompassi_filters.date.length_hours * 60;

	jQuery( '#kompassi_schedule article:visible' ).sort( kompassi_sort_by_group ).each( function( index ) {
		program = jQuery( this );

		// Count the width % and offset % for program
		width = program.data( 'length' ) / length * 100;
		offset_in_s = program.data( 'start' ) - ( kompassi_filters.date.start.valueOf( ) / 1000 );
		offset_in_m = offset_in_s / 60;
		offset = offset_in_m / length * 100;

		// See if we need to add a group headings
		if( kompassi_options.timeline_grouping.length > 0 && kompassi_schedule_dimensions.some( e => e.slug == kompassi_options.timeline_grouping ) ) {
			grouping = kompassi_options.timeline_grouping;
		} else {
			grouping = false;
		}

		if( grouping ) {
			group_name = program.find( '.' + grouping ).text( );
			if( group_name != prev_group ) {
				check_index = rows.push( 'group: ' + group_name );
				group_index = check_index;
				// TODO: Case: All items have no grouping value or have multiple
				if( group_name.length == 0 ) {
					group = jQuery( '<p class="group-name">' + __( 'Ungrouped', 'kompassi-integration' ) + '</p>' );
				} else {
					group = jQuery( '<p class="group-name">' + group_name + '</p>' );
				}
				group.css( 'top', 'calc( ' + ( rows.length - 1 ) + ' * var(--kompassi-schedule-timeline-row-height)' );
				jQuery( '#kompassi_schedule' ).append( group );
			} else {
				check_index = group_index;
			}
		} else {
			check_index = 2;
		}

		has_row = false;
		while( has_row == false && check_index < 200 ) {
			if( rows.length == check_index - 1 ) {
				// Row does not exist, create new
				rows.push( parseInt( program.data( 'end' ) ) );
				program_row = rows.length - 1;
				has_row = true;
			} else if( rows[check_index] <= program.data( 'start' ) ) {
				// Rows last event ends before or at the same time as this one starts
				rows[check_index] = parseInt( program.data( 'end' ) );
				program_row = check_index;
				has_row = true;
			}
			check_index += 1;
		}
		// End grouping

		program.css( 'width', 'calc( ' + width + '% - 5px )' );
		program.css( 'min-width', 'calc( ' + width + '% - 5px )' );
		program.css( 'left', 'calc( ' + offset + '% + 3px )' );
		program.css( 'top', 'calc( ' + program_row + ' * var(--kompassi-schedule-timeline-row-height)' ); // Grouping
		if( offset < 0 ) {
			program.find( '.title' ).css( 'position', 'absolute' ).css( 'left', ( ( -1 * program.position( ).left ) + 6 ) + 'px' );
		}

		if( grouping ) {
			prev_group = group_name;
		}
	} );

	// Make the schedule high enough to contain all rows
	jQuery( '#kompassi_schedule' ).css( 'height', 'calc( var(--kompassi-schedule-timeline-row-height) * ' + ( rows.length ) + ' )' );

	// Rulers
	headers = jQuery( '<div class="headers" />' );
	j = 1;
	for( i = 0; i < Math.ceil( kompassi_filters.date.length_hours ); i++ ) {
		offset = 100 / Math.ceil( kompassi_filters.date.length_hours );
		label = ( kompassi_filters.date.start.getHours( ) + i ) % 24;
		label.toString( ).padStart( 2, '0' );
		jQuery( '#kompassi_schedule' ).append( '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% );" />' ); // + label + '</div>' );
		headers.append( '<div class="hint time_hint" style="left: calc( ' + offset + ' * ' + i + '%); width: calc( ' + offset + '% );">' + label + '</div>' );
		if( label == '00' || i == 0 ) {
			d = kompassi_filters.date.start.valueOf( ) / 1000 + ( i * 60 * 60 );
			headers.append( '<strong class="hint day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% ); width: calc( 100% - ' + ( 24 - i ) * offset + '% ); z-index: ' + j + ';"><span>' + kompassi_get_date_formatted( d ) + '</span></div>' );
			j += 1;
		}
	}
	jQuery( '#kompassi_schedule' ).prepend( headers );

	//
	jQuery( '#kompassi_schedule' ).data( 'scale', 1 );
	var hammer = new Hammer( jQuery( '#kompassi_schedule' )[0], { touchAction: 'pan-x pan-y' } );
	hammer.get( 'pinch' ).set( { enable: true } );
	hammer.get( 'pan' ).set( { direction: Hammer.DIRECTION_ALL } );

	// Zoom (pinch)
	hammer.on( 'pinch', function( ev ) {
		if( ev.additionalEvent == 'pinchin' ) {
			kompassi_timeline_zoom( 1 );
		} else {
			kompassi_timeline_zoom( -1 );
		}
	} );

	// Zoom (mouse)
	jQuery( '#kompassi_schedule' )[0].addEventListener( 'wheel', function( event ) {
		if( event.shiftKey ) {
			kompassi_timeline_zoom( event.deltaY );
		}
	} );

	// Pan
	hammer.on( 'pan', function( ev ) {
		switch( ev.additionalEvent ) {
			case 'panleft':
				kompassi_timeline_pan( 1, 0, ev );
				break;
			case 'panright':
				kompassi_timeline_pan( -1, 0, ev );
				break;
			case 'panup':
				kompassi_timeline_pan( 0, 1, ev );
				break;
			case 'pandown':
				kompassi_timeline_pan( 0, -1, ev );
				break;
		}
	} );
}

function kompassi_timeline_zoom( direction ) {
	elem = jQuery( '#kompassi_schedule' );
   if( direction < 0 ) {
      scale = elem.data( 'scale' ) + 0.5;
   } else if( direction > 0 ) {
      scale = elem.data( 'scale' ) - 0.5;
   }

	min_hours_to_show = 2;
	max_scale = kompassi_filters.date.length_hours / min_hours_to_show;

   if( scale < 1 ) {
      scale = 1;
   } else if( scale > max_scale ) {
      scale = max_scale;
   }

	kompassi_timeline_zoom_set( scale );
}

function kompassi_timeline_zoom_set( scale ) {
	elem = jQuery( '#kompassi_schedule' );
	elem.data( 'scale', scale );
	elem.css( 'width', ( scale * 100 ) + '%' );
	kompassi_timeline_reposition_headers( );
}

function kompassi_timeline_pan( direction_x, direction_y, ev ) {
	if( ev.pointerType === 'mouse' ) {
		pan_speed = 20;
	} else {
		pan_speed = 20;
	}
	if( direction_x !== 0 ) {
		wrapper = jQuery( '#kompassi_schedule' ).parent( '.kompassi_schedule_wrapper' );
		wrapper.scrollLeft( wrapper.scrollLeft( ) + ( direction_x * pan_speed ) );
		kompassi_timeline_reposition_headers( );
	}
	if( direction_y !== 0 ) {
		wrapper = jQuery( window );
		wrapper.scrollTop( parseInt( wrapper.scrollTop( ) ) + ( direction_y * pan_speed ) );
	}
}

function kompassi_timeline_reposition_headers( ) {
	jQuery( '#kompassi_schedule .day_hint' ).each( function( ) {
		content_width = jQuery( this ).find( 'span' ).first( ).outerWidth( );
		scroll = wrapper.scrollLeft( );
		offset = jQuery( this )[0].offsetLeft;
		next_offset = jQuery( this ).next( )[0].offsetLeft;

		if( scroll > offset ) {
			jQuery( this ).css( 'padding-left', ( scroll - offset ) + 'px' );
		} else {
			jQuery( this ).css( 'padding-left', '' );
		}
	} );
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
 *  Open program modal
 *
 */

function kompassi_program_modal( program ) {
	options = {
		attrs: {
			'class': program.attr( 'class' ),
			'data-id': program.data( 'id' ),
		},
		title: program.children( '.title' ).text( ),
		actions: program.children( '.actions' ).html( ),
		content: program.children( '.main' ).html( ),
		meta: program.children( '.meta' ).html( ),
	}
	kompassi_show_modal( options );
}

/*
 *  Display schedule help modal
 *
 */

function kompassi_schedule_help_modal( ) {
	help = '<strong>' + __( 'List View', 'kompassi-integration' ) + '</strong>';
	help += '<p>' + __( 'When using text search, results are sorted by relevance rather than chronologically.', 'kompassi-integration' ) + '</p>';
	help += '<p>' + __( 'When limiting search results by date, programs which have started in previous days that are still continuing are listed at the end of the search results.', 'kompassi-integration' ) + '</p>';
	help += '<strong>' + __( 'Timeline View', 'kompassi-integration' ) + '</strong>';
	help += '<p>' + __( 'You can zoom and pan the timeline view:', 'kompassi-integration' ) + '</p>';
	help += '<p>' + __( 'On desktop, use <em>Shift + mouse wheel</em> to zoom.', 'kompassi-integration' ) + '</p>';
	help += '<p>' + __( 'On a touch screen, pinch to zoom.', 'kompassi-integration' ) + '</p>';
	help += '<p>' + __( 'Drag to pan on all devices.', 'kompassi-integration' ) + '</p>';

	options = {
		title: __( 'Help!', 'kompassi-integration' ),
		content: help
	}
	kompassi_show_modal( options );
}

/*
 *
 *
 */

function kompassi_schedule_timeline_sticky_header( ) {
	jQuery( '#kompassi_block_schedule' ).each( function( ) {
		var schedule_top = this.offsetTop + jQuery( this ).find( '.kompassi_schedule_wrapper' ).first( )[0].offsetTop;
		var schedule_bottom = schedule_top + jQuery( this ).find( '.kompassi_schedule_wrapper' ).first( )[0].scrollHeight;
		var scroll = window.scrollY;

		var buffer = jQuery( this ).find( '.headers' ).first( ).outerHeight( );

		if( scroll > schedule_top + buffer && scroll < schedule_bottom - buffer ) {
			jQuery( this ).find( '.headers' ).addClass( 'sticky' );
			jQuery( this ).find( '.headers' ).css( 'top', scroll - schedule_top );
		} else {
			jQuery( this ).find( '.headers' ).removeClass( 'sticky' );
			jQuery( this ).find( '.headers' ).css( 'top', 0 );
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
		opts.push( 'prog:' + jQuery( '#kompassi_modal' ).data( 'id' ) );
	} else {
		// Date
		if( jQuery( '.date-toggle.active' ).length > 0 ) {
			opts.push( 'date:' + jQuery( '.date-toggle.active' ).first( ).data( 'date' ) );
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

		// Display
		opts.push( 'display:' + kompassi_get_display_type( ) );
	}

	window.location.hash = opts.join( '/' );
}

/**
 */

function kompassi_sort_by_group( a, b ) {
	if( kompassi_options.timeline_grouping.length > 0 ) {
		if( jQuery( a ).find( '.' + kompassi_options.timeline_grouping ).text( ) > jQuery( b ).find( '.' + kompassi_options.timeline_grouping ).text( ) ) {
			return 1;
		} else if( jQuery( a ).find( '.' + kompassi_options.timeline_grouping ).text( ) < jQuery( b ).find( '.' + kompassi_options.timeline_grouping ).text( ) ) {
			return -1;
		}
	}

	if( a.getAttribute( 'data-start' ) > b.getAttribute( 'data-start' ) ) {
		return 1;
	}
	return -1;
}

function filter_unique( value, index, array ) {
  return array.indexOf( value ) === index;
}