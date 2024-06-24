__ = wp.i18n.__;
_x = wp.i18n._x;
_n = wp.i18n._n;
sprintf = wp.i18n.sprintf;

var kompassi_schedule = {
	'event': {},
	'filters': {},
	'timeouts': {},
};

jQuery( function( e ) {
	/*
	 *  Get date/time related information about program
	 *  - Earliest starting time for program
	 *  - Latest ending time for program
	 *  - List of dates the program spans through
	 *
	 */

	kompassi_schedule.event.start = new Date( parseInt( jQuery( '#kompassi_schedule article' ).first( ).data( 'start' ) ) * 1000 );
	kompassi_schedule.event.end = new Date( kompassi_schedule.event.start );
	jQuery( '#kompassi_schedule article' ).each( function( ) {
		if( kompassi_schedule.event.end / 1000 < jQuery( this ).data( 'end' ) ) {
			kompassi_schedule.event.end.setTime( parseInt( jQuery( this ).data( 'end' ) * 1000 ) );
		}
	} );

	//  Always start and end with even hours
	kompassi_schedule.event.start.setMinutes( 0, 0, 0 );
	kompassi_schedule.event.end.setMinutes( 0, 0, 0 );

	// Get list of dates
	dates_start = new Date( kompassi_schedule.event.start );
	i = dates_start.setHours( 0 ).valueOf( );
	kompassi_schedule.event.dates = {};
	while( i < kompassi_schedule.event.end ) {
		kompassi_schedule.event.dates[i] = {
			'long': kompassi_get_date_formatted( i / 1000, true, true ),
			'short': kompassi_get_date_formatted( i / 1000, true, false ),
			'ymd': dayjs( i ).format( 'YYYY-MM-DD' )
		};
		i += 24 * 60 * 60 * 1000;
	}

	/** **/
	kompassi_schedule_cookie_init( );
	kompassi_schedule_init( );
	kompassi_schedule_refresh( );
} );

/**
 *  Initializes the schedule markup
 *
 */

function kompassi_schedule_init( ) {
	//  MARKUP

	//  Schedule toolbar
	kompassi_schedule_init_toolbar( );

	//  Add favorite action to each article
	jQuery( '#kompassi_schedule article' ).each( function( ) {
		actions = jQuery( this ).find( '.actions' );
		favorite = jQuery( '<a class="favorite kompassi-icon-favorite" title="' + _x( 'Favorite', 'button label', 'kompassi-integration' ) + '"/>' );
		actions.prepend( favorite );
		favorite.on( 'click', kompassi_toggle_favorite );
	} );

	//  Container for notes
	jQuery( '<section id="kompassi_schedule_notes" />' ).insertAfter( filters );

	//  EVENTS

	//  Events (mouseover, mouseout): Popover
	jQuery( '#kompassi_schedule article' ).on( 'mouseover', function( e ) {
		if( !jQuery( '#kompassi_schedule' ).hasClass( 'timeline' ) ) {
			return;
		}
		clearTimeout( kompassi_schedule.timeouts['popover'] );
		options = {
			title: jQuery( this ).find( '.title' ).text( ),
			content: jQuery( this ).find( '.times' ).html( )
		};
		kompassi_schedule.timeouts['popover'] = setTimeout( kompassi_popover, 300, options, e, this );
	} );
	// TODO: Tie this to popover
	jQuery( '#kompassi_schedule article' ).on( 'mouseout', function( e ) {
		clearTimeout( kompassi_schedule.timeouts['popover'] );
		jQuery( '#kompassi_popover' ).remove( );
	} );

	//  Events (click): Modal
	jQuery( '#kompassi_schedule article' ).on( 'click', function( e ) {
		if( jQuery( e.target ).closest( 'div' ).hasClass( 'actions' ) ) {
			return;
		}
		kompassi_program_modal( jQuery( this ) );
	} );

	//  Events (keyup): Modal navigation
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( jQuery( '#kompassi_modal.kompassi-program' ).length > 0 ) {
			current_prog = jQuery( '#kompassi_modal.kompassi-program' ).data( 'id' );
			open_prog = false;

			if( e.keyCode == 37 ) {
				open_prog = kompassi_get_next_visible_program( current_prog, -1 );
			}
			if( e.keyCode == 39 ) {
				open_prog = kompassi_get_next_visible_program( current_prog );
			}

			if( open_prog ) {
				kompassi_program_modal( open_prog );
			}
		}
	} );

	//  Events (click, keyup): Close modal
	jQuery( 'body' ).on( 'click', '#kompassi_modal_bg, #kompassi_modal .header .close', function( e ) {
		kompassi_close_modal( );
		kompassi_update_url_hash( );
	} );
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( e.keyCode == 27 ) {
			kompassi_close_modal( );
			kompassi_update_url_hash( );
		}
	} );

	//  Events (scroll): Sticky header for timeline
	jQuery( window ).on( 'scroll', kompassi_schedule_timeline_sticky_header );

	//  Events (popstate): Refresh view on back/forward/history
	jQuery( window ).on( 'hashchange', function( e ) {
		kompassi_schedule_refresh( );
	} );

	//  Events (click): Import
	jQuery( 'body' ).on( 'click', '.kompassi-schedule-import a', function( ) {
		url_options = kompassi_get_url_options( );

		favorites_updated = false;
		if( jQuery( this ).hasClass( 'replace' ) ) {
			kompassi_cookie.favorites = url_options.favorite.split( ',' );
			favorites_updated = true;
		}
		if( jQuery( this ).hasClass( 'append' ) ) {
			old_favorites = kompassi_cookie.favorites;
			new_favorites = url_options.favorite.split( ',' );
			new_favorites.filter( function( item ) {
				return old_favorites.indexOf( item );
			} );
			merged_favorites = old_favorites.concat( new_favorites );
			kompassi_cookie.favorites = merged_favorites;

			if( old_favorites !== merged_favorites ) {
				favorites_updated = true;
			}
		}

		if( favorites_updated ) {
			kompassi_update_cookie( );

			jQuery( '#kompassi_schedule article' ).removeClass( 'is-favorite' );
			jQuery.each( kompassi_cookie.favorites, function( ) {
				jQuery( '#' + this ).addClass( 'is-favorite' );
			} );
		}

		kompassi_close_modal( );
		kompassi_update_url_hash( );
	} );
}

/**
 *  Initializes the schedule toolbar
 *
 */

function kompassi_schedule_init_toolbar( ) {
	toolbar = jQuery( '<section id="kompassi_schedule_toolbar" />' );
	toolbar.prependTo( jQuery( '#kompassi_block_schedule' ) );

	/*  Date filter  */
	date_section = jQuery( '<section id="kompassi_schedule_dates" class="kompassi-button-group" />' );
	//  TODO: Only show "Next" if there is anything to show?
	date_next_toggle = jQuery( '<a class="date-toggle no-icon" data-date="next">' + _x( 'Next', 'date filter', 'kompassi-integration' ) + '</a>' );
	date_section.append( date_next_toggle );
	jQuery.each( kompassi_schedule.event.dates, function( timestamp, labels ) {
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

	/*  Dropdown menu  */
	dropdown = kompassi_dropdown_menu(
		{
			help: { label: __( 'Help', 'kompassi-integration' ), callback: kompassi_schedule_help_modal },
			export: { label: __( 'Export Favorites', 'kompassi-integration' ), callback: kompassi_schedule_export_modal },
		},
		{
			id: 'kompassi_schedule_menu'
		}
	);
	dropdown.appendTo( toolbar );

	/*  Filter popup  */
	filters = jQuery( '<section id="kompassi_schedule_filters" />' );

	//  Text filter
	filters.append( jQuery( '<input class="filter filter-text" name="filter_text" placeholder="' + __( 'Text...', 'kompassi-integration' ) + '" />' ) );

	//  Dimension filters
	jQuery.each( kompassi_schedule_dimensions, function( index, dimension ) {
		if( dimension.isListFilter == false ) {
			return;
		}
		if( kompassi_options.hidden_dimensions.indexOf( dimension.slug ) > -1 ) {
			return;
		}
		select = jQuery( '<select class="filter filter-dimension" name="filter_' + dimension.slug + '" data-dimension="' + dimension.slug + '" placeholder="' + dimension.title + '" multiple="multiple" />' );
		jQuery.each( this.values, function( index, value ) {
			select.append( jQuery( '<option value="' + value.slug + '">' + value.title + '</option>' ) );
		} );
		wrapper = jQuery( '<div class="select" />' ).append( select );
		filters.append( wrapper );

		options = {
			texts: {
				placeholder: dimension.title,
				select_label: dimension.title,
			},
			maxWidth: 500,
			onPlaceholder: kompassi_update_multiselect_label,
			onOptionClick: kompassi_update_multiselect_label,
			onControlOpen: function( element ) {
				if( typeof this.texts.options_header !== 'undefined' && jQuery( element ).next( ).find( '.ms-options-header' ).length == 0 ) {
					header = jQuery( '<div class="ms-options-header">' + this.texts.options_header + '</div>' );
					jQuery( element ).next( ).find( '.ms-options' ).prepend( header );
				}
			}
		};

		// Negative selectin filter
		if( dimension.isNegativeSelection == true ) {
			select.addClass( 'flag-negative' );
			options.texts.options_header = __( 'Program matching selection will be hidden from results.', 'kompassi-integration' );
		}

		select.multiselect( options );
	} );

	// Clear filters
	clear_filters = jQuery( '<a href="#" class="clear-filters kompassi-icon-clear-filters" title="' + __( 'Clear filters', 'kompassi-integration' ) + '"/>' );
	clear_filters.on( 'click', function( ) {
		jQuery( filters ).find( 'input, select' ).each( function( index ) {
			if( jQuery( this ).hasClass( 'filter-dimension' ) ) {
				select = jQuery( this );
				select.children( 'option' ).each( function( ) {
					jQuery( this ).removeAttr( 'selected' );
				} );
				select.multiselect( 'reload' );
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
		clearTimeout( kompassi_schedule.timeouts['text-filter'] );
		kompassi_schedule.timeouts['text-filter'] = setTimeout( kompassi_apply_filters, 300 );
	} );

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
		link.on( 'click', function( ) {
			if( jQuery( this ).hasClass( 'active' ) ) {
				return;
			}

			kompassi_setup_display( jQuery( this ).data( 'display' ) );
		} );
	} );
	toolbar.append( ds );
}

/**
 *  Gets favorite programs from cookie
 *
 */

function kompassi_schedule_cookie_init( ) {
	jQuery.each( kompassi_cookie.favorites, function( ) {
		jQuery( '#' + this ).addClass( 'is-favorite' );
	} );
}

/**
 *  Refreshes the schedule view
 *
 */

function kompassi_schedule_refresh( ) {
	url_options = kompassi_get_url_options( );

	// Import
	if( url_options.favorite ) {
		kompassi_schedule_import_modal( url_options.favorite );
		return;
	}

	//  Apply options from URL
	kompassi_schedule_apply_options( url_options );

	//  Update program count
	kompassi_update_program_count( );

	//  Setup display
	if( url_options.display && Object.keys( styles ).indexOf( url_options.display ) > -1 ) {
		kompassi_setup_display( url_options.display );
	} else {
		kompassi_setup_display( );
	}
}

/**
 *  Toggles the favorite filter
 *
 */

function kompassi_toggle_favorite( ) {
	program = jQuery( this ).closest( '.kompassi-program' ).data( 'id' );
	jQuery( '.kompassi-program[data-id="' + program + '"]' ).toggleClass( 'is-favorite' );
	if( kompassi_cookie.favorites.includes( program ) ) {
		kompassi_cookie.favorites = kompassi_cookie.favorites.filter( function( id ) { return id !== program; } );
	} else {
		kompassi_cookie.favorites.push( program );
	}
	kompassi_update_cookie( );
}

/**
 *  Applies options from URL hash
 *
 */

function kompassi_schedule_apply_options( opts ) {
	filters_from_url = false;

	jQuery( opts ).each( function( k, v ) {
		// Filters
		filter = jQuery( '[name="filter_' + k + '"]' );
		if( filter.length > 0 ) {
			if( filter.prop( 'tagName' ) == 'SELECT' ) {
				v.split( ',' ).forEach( function( value, index, array ) {
					filter.find( '[value="' + value + '"]').attr( 'selected', 'selected' );
				} );
				filter.multiselect( 'reload' );
			} else if( filter.prop( 'tagName' ) == 'INPUT' ) {
				filter.val( decodeURIComponent( v ) );
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
	if( opts.date ) {
		if( jQuery( '.date-toggle[data-date="' + opts.date + '"]' ).length > 0 ) {
		 	jQuery( '.date-toggle[data-date="' + opts.date + '"]' ).addClass( 'active' );
			filters_from_url = true;
		}
	}

	// Favorites
	if( opts.favorites ) {
		jQuery( '.favorites-toggle' ).addClass( 'active' );
		filters_from_url = true;
	}

	// Apply filters
	if( filters_from_url == true ) {
		kompassi_apply_filters( );
	}

	// Open program modal
	if( opts.prog ) {
		if( jQuery( '#' + opts.prog ).length > 0 ) {
			kompassi_program_modal( jQuery( '#' + opts.prog ) );
		}
	} else {
		if( jQuery( '#kompassi_modal.kompassi-program' ).length > 0 ) {
			kompassi_close_modal( );
		}
	}
}

/**
 *  Shows visible program count
 *
 */

function kompassi_update_program_count( ) {
	jQuery( '#kompassi_schedule_notes .program-count' ).remove( );
	program_count = jQuery( '#kompassi_schedule article:not(.filtered)' ).length;
	if( kompassi_schedule.filters.enabled > 0 ) {
		if( program_count > 0 ) {
			// translators: count of programs visible
			program_count_label = sprintf( _n( '%s program visible.', '%s programs visible.', program_count, 'kompassi-integration' ), program_count );
			jQuery( '#kompassi_schedule_notes' ).prepend( '<span class="program-count">' + program_count_label + '</span>' );
		} else {
			jQuery( '#kompassi_schedule_notes' ).prepend( '<span class="program-count">' + __( 'Nothing matched your search!', 'kompassi-integration' ) + '</span>' );
		}
	}
}

/**
 *  Updates date view parameters
 *
 */

function kompassi_update_date_view_parameters( ) {
	kompassi_schedule.filters.date = { };
	if( jQuery( '#kompassi_block_schedule' ).find( '.date-toggle.active' ).length > 0 ) {
		selected_date = jQuery( '#kompassi_block_schedule' ).find( '.date-toggle.active' ).first( );
		if( selected_date.data( 'date' ) == 'next' ) {
			kompassi_schedule.filters.date.start = new Date( );
			// This is for debugging purposes...
			// if( kompassi_user_options.now ) {
			//	kompassi_schedule.filters.date.start.setTime( kompassi_user_options.now * 1000 ).setMinutes( 0, 0, 0 );
			// }
			// TODO: Allow user to select how much program to show?
			kompassi_schedule.filters.date.length_hours = 2;
		} else {
			timestamp = selected_date.data( 'timestamp' );
			start_of_day = parseInt( kompassi_options.schedule_start_of_day );
			end_of_day = parseInt( kompassi_options.schedule_end_of_day );

			// Calculate Start of Day
			kompassi_schedule.filters.date.start = new Date( parseInt( timestamp ) + ( start_of_day * 3600 ) * 1000 );
			if( kompassi_schedule.filters.date.start < kompassi_schedule.event.start ) {
				// Never start before event start (be nice to timeline)
				kompassi_schedule.filters.date.start = new Date( kompassi_schedule.event.start );
				start_of_day = kompassi_schedule.filters.date.start.getHours( );
			}

			// Calculate Length of Day
			if( end_of_day > start_of_day ) {
				// During the same day
				kompassi_schedule.filters.date.length_hours = end_of_day - start_of_day;
			} else if( end_of_day < start_of_day ) {
				// Wraps over to next date
				kompassi_schedule.filters.date.length_hours = 24 - start_of_day + end_of_day;
			} else {
				// Exactly 24 hours
				kompassi_schedule.filters.date.length_hours = 24;
			}

			// Calculate End of Day
			kompassi_schedule.filters.date.end = new Date( kompassi_schedule.filters.date.start.valueOf( ) + ( kompassi_schedule.filters.date.length_hours * 3600 * 1000 ) );
			if( kompassi_schedule.filters.date.end > kompassi_schedule.event.end ) {
				// Never end after event end (be nice to timeline)
				kompassi_schedule.filters.date.end = new Date( kompassi_schedule.event.end );
				kompassi_schedule.filters.date.length_hours = kompassi_get_difference_in_hours( kompassi_schedule.filters.date.start, kompassi_schedule.filters.date.end );
			}
		}

		kompassi_schedule.filters.date.filtered = true;
		kompassi_schedule.filters.enabled += 1;
	} else {
		kompassi_schedule.filters.date.start = new Date( kompassi_schedule.event.start );
		kompassi_schedule.filters.date.end = new Date( kompassi_schedule.event.end );

		if( kompassi_schedule.filters.enabled > 0 && jQuery( '#kompassi_schedule article:visible' ).length > 0 ) {
			starts = [];
			ends = [];

			jQuery( '#kompassi_schedule article:visible' ).each( function ( ) {
				starts.push( jQuery( this ).data( 'start' ) );
				ends.push( jQuery( this ).data( 'end' ) );
			} );

			kompassi_schedule.filters.date.start = new Date( Math.min( ...starts ) * 1000 );
			kompassi_schedule.filters.date.end = new Date( Math.max( ...ends ) * 1000 );
		}

		kompassi_schedule.filters.date.length_hours = kompassi_get_difference_in_hours( kompassi_schedule.filters.date.start, kompassi_schedule.filters.date.end );
	}
}

/**
 *  Applies filters
 *
 */

function kompassi_apply_filters( ) {
	//  Show all and remove notification if exists
	jQuery( '#kompassi_schedule article' ).removeClass( 'filtered multiday-overlap' );
	jQuery( '#kompassi_schedule_notes .filter, #kompassi_programs_continuing' ).remove( );

	kompassi_schedule.filters = { };
	filter_count = 0;

	//  Iterate through each filter
	jQuery( '#kompassi_schedule_filters .filter' ).each( function( index ) {
		filter = jQuery( this );

		// Dimension filters
		if( filter.hasClass( 'filter-dimension' ) ) {
			if( filter.val( ).length > 0 ) {
				filter_dimension = filter.data( 'dimension' );
				jQuery( '#kompassi_schedule article:visible' ).filter( function( ) {
					if( typeof jQuery( this ).data( filter_dimension ) == 'undefined' ) {
						match = false;
					} else {
						prog_dimensions = jQuery( this ).data( filter_dimension ).split( ',' );
						dimension_matches = prog_dimensions.filter( function( v ) {
							return filter.val( ).includes( v );
						} );

						if( dimension_matches.length < 1 ) {
							match = false;
						} else {
							match = true;
						}
					}
					if( filter.hasClass( 'flag-negative' ) ) {
						return match;
					} else {
						return !match;
					}
				} ).addClass( 'filtered' );
				filter_count += 1;
			}
		}

		// Text filter
		search_targets = {
			'title': 100,
			'cachedHosts': 10,
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
				filter_count += 1;
			} else {
				jQuery( '#kompassi_schedule article' ).css( 'order', 0 );
			}
		}
	} );

	// Show how many filters from the dropdown area are activated
	if( filter_count > 0 ) {
		jQuery( '#kompassi_block_schedule' ).find( '.filters-toggle .indicator' ).text( filter_count );
	} else {
		jQuery( '#kompassi_block_schedule' ).find( '.filters-toggle .indicator' ).empty( );
	}

	kompassi_schedule.filters.enabled = filter_count;

	// Date filter
	kompassi_update_date_view_parameters( );
	jQuery( '#kompassi_schedule article:visible' ).each( function( index ) {
		program = jQuery( this );
		program_start = parseInt( program.data( 'start' ) );
		program_end = parseInt( program.data( 'end' ) );
		if( program_start > kompassi_schedule.filters.date.end / 1000 || program_end <= kompassi_schedule.filters.date.start / 1000 ) {
			program.addClass( 'filtered' );
		}
		if( program_start < kompassi_schedule.filters.date.start / 1000 && program_end > kompassi_schedule.filters.date.start / 1000 ) {
			program.addClass( 'multiday-overlap' );
		}
	} );

	// Favorite filter
	if( jQuery( '#kompassi_block_schedule' ).find( '.favorites-toggle' ).hasClass( 'active' ) ) {
		jQuery( '#kompassi_schedule article:not(.is-favorite)' ).addClass( 'filtered' );
		kompassi_schedule.filters.enabled += 1;
	}

	//  If on timeline, refresh the layout
	if( kompassi_get_display_type( ) == 'timeline' ) {
		kompassi_revert_display_layouts( );
		kompassi_setup_timeline_layout( );
	}

	// If there is no text search and there is a date search, and there is programs that have started before the filtered timerange, show notification
	if( jQuery( '#kompassi_block_schedule' ).find( '.date-toggle.active' ).length > 0 ) {
		if( parseInt( kompassi_options.schedule_start_of_day ) !== 0 || parseInt( kompassi_options.schedule_end_of_day ) !== 0 ) {
			start_of_day = parseInt( kompassi_options.schedule_start_of_day );
			end_of_day = parseInt( kompassi_options.schedule_end_of_day );
			program_count = jQuery( '#kompassi_schedule article:not(.filtered)' ).length;
			if( program_count > 0 ) {
				// translators: start of day hour, end of day hour
				jQuery( '#kompassi_schedule_notes' ).append( '<span class="filter programs-between display-not-timeline">' + sprintf( __( 'Showing programs starting between %1$s and %2$s.', 'kompassi-integration' ), start_of_day, end_of_day ) + '</span>' );
			}
		}
		// Show note about the Start/End of Day times
		if( jQuery( '#kompassi_schedule_filters [name="filter_text"]' ).val( ).length < 1 && jQuery( '#kompassi_schedule article.multiday-overlap' ).length > 0 ) {
			count = jQuery( '#kompassi_schedule article.multiday-overlap:visible' ).length;
			// translators: amount of repositioned events
			jQuery( '#kompassi_schedule_notes' ).append( '<span class="filter programs-continuing display-not-timeline"><a href="#kompassi_programs_continuing">' + sprintf( _n( 'Show %d program starting earlier', 'Show %d programs starting earlier', count, 'kompassi-integration' ), count ) + '</a></span>' );
			jQuery( '#kompassi_schedule article.multiday-overlap' ).first( ).before( '<h3 id="kompassi_programs_continuing"">' + __( 'Programs continuing', 'kompassi-integration' ) + '</h3>' );
		}
	}

	//
	if( kompassi_schedule.filters.enabled > 0 ) {
		jQuery( '#kompassi_schedule_filters' ).addClass( 'has-filters-enabled' );
	} else {
		jQuery( '#kompassi_schedule_filters' ).removeClass( 'has-filters-enabled' );
	}

	kompassi_update_url_hash( );
	kompassi_update_program_count( );

	jQuery( '#kompassi_schedule_notes .display-not-' + kompassi_get_display_type( ) ).hide( );
	jQuery( '#kompassi_schedule_notes .display-only-' + kompassi_get_display_type( ) ).show( );
}

/**
 *  Update multiselect labels
 *
 *  @param {Object} element JS element to update
 *
 */

function kompassi_update_multiselect_label( element ) {
	options = jQuery( element ).find( 'option' ).length;
	selected_options = jQuery( element ).next( ).find( '.selected' ).length;

	html = this.texts.select_label;
	if( selected_options > 0 ) {
		html += ' <span class="indicator">' + selected_options + '</span>';
	}
	jQuery( element ).next( ).find( 'button' ).first( ).html( html );
	jQuery( element ).data( 'indicator', selected_options );
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
	kompassi_revert_display_layouts( );
	if( display_type == 'list' ) {
		kompassi_setup_list_layout( );
	}
	if( display_type == 'timeline' ) {
		kompassi_setup_timeline_layout( );
	}

	jQuery( '#kompassi_schedule_notes .display-not-' + display_type ).hide( );
	jQuery( '#kompassi_schedule_notes .display-only-' + display_type ).show( );

	jQuery( '#kompassi_schedule_display a' ).removeClass( 'active' );
	jQuery( '#kompassi_schedule_display [data-display="' + display_type + '"]' ).addClass( 'active' );

	kompassi_update_url_hash( );
}

/**
 *  Sets up list display layout
 *
 */

function kompassi_setup_list_layout( ) {

}


/**
 *  Sets up timeline display layout
 *
 */

function kompassi_setup_timeline_layout( ) {
	rows = [ 'day hints', 'time hints' ];

	kompassi_update_date_view_parameters( );

	prev_group = undefined;
	group_index = 0;

	length = kompassi_schedule.filters.date.length_hours * 60;

	jQuery( '#kompassi_schedule article:visible' ).sort( kompassi_sort_by_group ).each( function( index ) {
		program = jQuery( this );

		// Count the width % and offset % for program
		width = program.data( 'length' ) / length * 100;
		offset_in_s = program.data( 'start' ) - ( kompassi_schedule.filters.date.start.valueOf( ) / 1000 );
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
		while( has_row == false ) {
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
	for( i = 0; i < Math.ceil( kompassi_schedule.filters.date.length_hours ); i++ ) {
		offset = 100 / Math.ceil( kompassi_schedule.filters.date.length_hours );
		label = ( kompassi_schedule.filters.date.start.getHours( ) + i ) % 24;
		label.toString( ).padStart( 2, '0' );
		jQuery( '#kompassi_schedule' ).append( '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% );" />' ); // + label + '</div>' );
		headers.append( '<div class="hint time_hint" style="left: calc( ' + offset + ' * ' + i + '%); width: calc( ' + offset + '% );">' + label + '</div>' );
		if( label == '00' || i == 0 ) {
			d = kompassi_schedule.filters.date.start.valueOf( ) / 1000 + ( i * 60 * 60 );
			headers.append( '<strong class="hint day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% ); z-index: ' + j + ';"><span>' + kompassi_get_date_formatted( d ) + '</span></div>' );
			j += 1;
		}
	}
	jQuery( '#kompassi_schedule' ).prepend( headers );

	// Enable zooming
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
	max_scale = kompassi_schedule.filters.date.length_hours / min_hours_to_show;

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
		scroll = jQuery( this ).closest( '.kompassi_schedule_wrapper ').scrollLeft( );
		offset = jQuery( this )[0].offsetLeft;
		next_offset = jQuery( this ).next( )[0].offsetLeft;

		if( scroll > offset ) {
			jQuery( this ).css( 'padding-left', ( scroll - offset ) + 'px' );
		} else {
			jQuery( this ).css( 'padding-left', '' );
		}
	} );
}

/**
 *  Revert display layouts
 *
 */

function kompassi_revert_display_layouts( ) {
	// Timeline
	jQuery( '#kompassi_schedule' ).css( 'height', 'auto' );
	jQuery( '#kompassi_schedule article' ).attr( 'style', '' );
	jQuery( '#kompassi_schedule .title' ).css( 'left', '' ).css( 'position', '' );
	jQuery( '#kompassi_schedule .headers, #kompassi_schedule .ruler, #kompassi_schedule .group-name' ).remove( );
}

/**
 *  Opens program modal
 *
 *  @param {Object} program jQuery object of the program number
 *
 */

function kompassi_program_modal( program ) {
	kompassi_close_modal( );

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

	// Swipe
	var hammer_modal = new Hammer( jQuery( '#kompassi_modal.kompassi-program' )[0], { touchAction: 'swipe' } );
	hammer_modal.on( 'swipe', function( ev ) {
		current_prog = jQuery( '#kompassi_modal.kompassi-program' ).data( 'id' );

		if( ev.direction == '4' ) {
			open_prog = kompassi_get_next_visible_program( current_prog, -1 );
		}
		if( ev.direction == '2' ) {
			open_prog = kompassi_get_next_visible_program( current_prog );
		}

		if( open_prog ) {
			kompassi_program_modal( open_prog );
		}
	} );

	kompassi_update_url_hash( );
}

/**
 *  Displays schedule help modal
 *
 */

function kompassi_schedule_help_modal( ) {
	help = '<strong class="kompassi-icon-list">' + __( 'List View', 'kompassi-integration' ) + '</strong>';
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

/**
 *  Displays export modal
 *
 */

function kompassi_schedule_export_modal( ) {
	favorites = [];
	titles = [];
	jQuery( 'article.is-favorite' ).each( function( ) {
		favorites.push( jQuery( this ).data( 'id' ) );
		titles.push( jQuery( this ).find( '.title' ).text( ) );
	} );
	cur = String( window.location );
	export_link = cur.split( '#' )[0] + '#favorite:' + favorites.join( ',' );
	markup = '<p>';
	markup += __( 'Create an export link to import your favorites to another device.', 'kompassi-integration' ) + ' ';
	markup += __( 'Favorites to be exported:', 'kompassi-integration' );
	markup += '</p>';
	markup += '<ul class="program-title-list">';
	titles.forEach( function( value, index, array ) {
		markup += '<li>' + value + '</li>';
	} );
	markup += '</ul>';
	actions = '<a onClick="kompassi_href_to_clipboard(event,this);" href="' + export_link + '">' + __( 'Copy export link to clipboard', 'kompassi-integration' ) + '</a>';
	options = {
		attrs: {
			class: 'kompassi-schedule-export small-modal actions-bottom-right'
		},
		title: __( 'Export Favorites', 'kompassi-integration' ),
		actions: actions,
		content: markup,
	}
	kompassi_show_modal( options );
}

/**
 *  Displays import modal
 *
 */

function kompassi_schedule_import_modal( programs ) {
	programs = programs.split( ',' );
	valid_programs = [];
	programs.forEach( function( value, index, array ) {
		if( jQuery( '#' + value ).length > 0 ) {
			valid_programs.push( jQuery( '#' + value ).find( '.title' ).text( ) );
		}
	} );

	markup = '<p>' + sprintf( _n( 'You are about to import %s program as favorite:', 'You are about to import %s programs as favorites:', valid_programs.length, 'kompassi-integration' ), valid_programs.length ) + '</p>';
	markup += '<ul class="program-title-list">';
	valid_programs.forEach( function( value, index, array ) {
		markup += '<li>' + value + '</li>';
	} );
	markup += '</ul>';

	actions = '<a class="kompassi-button replace">' + __( 'Replace Favorites', 'kompassi-integration' ) + '</a>';
	actions += '<a class="kompassi-button append">' + __( 'Append to Favorites', 'kompassi-integration' ) + '</a>';
	options = {
		attrs: {
			class: 'kompassi-schedule-import small-modal actions-bottom-right'
		},
		title: __( 'Import Favorites', 'kompassi-integration' ),
		actions: actions,
		content: markup
	};
	kompassi_show_modal( options );
}

/**
 *  Makes the timeline header sticky
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

//
//  Helper functions
//

/**
 *  Returns the previous or next (filtered) program number
 *
 *  @param {string} current Current program slug
 *  @param {boolean} reverse Whether to reverse the order, eg. return the previous program number
 *
 *  @returns {Object} jQuery object of the next/previous program number
 */

function kompassi_get_next_visible_program( current = false, reverse = false ) {
	if( reverse ) {
		// Prev
		open_prog = jQuery( '#kompassi_schedule article#' + current ).prevAll( 'article:visible' ).first( );
		if( open_prog.length == 0 ) {
			open_prog = jQuery( '#kompassi_schedule article#' + current ).nextAll( 'article:visible' ).last( );
		}
	} else {
		// Next
		open_prog = jQuery( '#kompassi_schedule article#' + current ).nextAll( 'article:visible' ).first( );
		if( open_prog.length == 0 ) {
			open_prog = jQuery( '#kompassi_schedule article#' + current ).prevAll( 'article:visible' ).last( );
		}
	}

	if( open_prog.length == 0 ) {
		return false;
	}

	return open_prog;
}

/**
 *  Returns the current display type
 *
 *  @returns {string} Current display type
 *
 */

function kompassi_get_display_type( ) {
	if( jQuery( '#kompassi_schedule' ).hasClass( 'list' ) ) { display_type = 'list'; }
	if( jQuery( '#kompassi_schedule' ).hasClass( 'timeline' ) ) { display_type = 'timeline'; }

	return display_type;
}

/**
 *  Returns a date formatted in human readable format.
 *
 *  @param {number} timestamp Unix timestamp
 *  @param {boolean} weekday Whether to return the weekday name or not
 *  @param {boolean} date Whether to return the date or not
 *
 *  @returns {string} Formatted date
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
 *  @returns {number} Difference of timestamps in hours
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

	// If program modal is open, show prog
	if( jQuery( '#kompassi_modal.kompassi-program' ).length > 0 ) {
		opts.push( 'prog:' + jQuery( '#kompassi_modal' ).data( 'id' ) );
	}

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
			if( filter.val( ).length > 0 ) {
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

	window.location.hash = opts.join( '/' );
}

/**
 *  Sorting function to sort program by group (and alphabetically inside groups)
 *
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
