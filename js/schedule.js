__ = wp.i18n.__;
_x = wp.i18n._x;
_n = wp.i18n._n;
sprintf = wp.i18n.sprintf;

var kompassi_common;
var kompassi_storage;

var kompassi_schedule = {
	'event': {},
	'filters': {},
	'timeouts': {},
};

dayjs.locale( kompassi_options.locale );

wp.hooks.addFilter( 'kompassi_init_storage', 'kompassi_schedule', function( storage ) {
	storage['favorites'] = [];
	return storage;
} );

jQuery( function( e ) {
	/*
	 *  Get date/time related information about program
	 *  - Earliest starting time for program
	 *  - Latest ending time for program
	 *  - List of dates the program spans through
	 *
	 */

	kompassi_schedule.event.start = dayjs( jQuery( '#kompassi_schedule' ).data( 'start' ) );
	kompassi_schedule.event.end = dayjs( jQuery( '#kompassi_schedule' ).data( 'end' ) );

	//  Always start and end with even hours
	if( kompassi_schedule.event.start.minute( ) != 0 ) {
		kompassi_schedule.event.start = kompassi_schedule.event.start.startOf( 'hour' );
	}
	if( kompassi_schedule.event.end.minute( ) != 0 ) {
		kompassi_schedule.event.end = kompassi_schedule.event.end.add( 1, 'hour' ).startOf( 'hour' );
	}

	/** **/
	kompassi_schedule_get_favorites_from_storage( );
	kompassi_schedule_init( );

	//  Apply options from URL
	kompassi_schedule_update_filters_from_options( kompassi_get_url_options( ) );
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
		title = jQuery( this ).find( 'summary .title' );
		actions = jQuery( this ).find( '.actions' );
		favorite = jQuery( '<a class="favorite kompassi-icon-favorite" title="' + _x( 'Favorite', 'button label', 'kompassi-integration' ) + '"/>' );
		favorite.insertAfter( title );
	} );

	//  Container for notes
	jQuery( '<section id="kompassi_schedule_notes" class="kompassi-notes" />' ).insertAfter( filters );

	//  EVENTS

	//  Events (click): Favorite
	jQuery( 'body' ).on( 'click', '#kompassi_schedule article .favorite, #kompassi_modal.kompassi-program .favorite', kompassi_schedule_toggle_favorite );

	//  Events (mouseover, mouseout): Popover
	jQuery( '#kompassi_schedule article' ).on( 'mouseover', function( e ) {
		if( jQuery( '#kompassi_schedule' ).data( 'display' ) != 'timeline' ) {
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
		// If shift key is pressed and we are not on timeline, open the details inline
		if( kompassi_common.shift_pressed && 'timeline' != jQuery( '#kompassi_schedule' ).data( 'display' ) ) {
			return;
		}

		// This is a link, open it
		if( e.target.tagName == 'A' ) {
			return;
		}

		// Prevent details from opening
		e.preventDefault( );

		if( jQuery( e.target ).hasClass( 'favorite' ) ) {
			return;
		}
		kompassi_schedule_program_modal( jQuery( this ) );
	} );

	//  Events (keyup): Modal navigation
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( jQuery( '#kompassi_modal.kompassi-program' ).length > 0 ) {
			current_prog = jQuery( '#kompassi_modal.kompassi-program' ).data( 'id' );
			open_prog = false;

			if( e.keyCode == 37 ) {
				open_prog = kompassi_schedule_get_next_visible_program( current_prog, -1 );
			}
			if( e.keyCode == 39 ) {
				open_prog = kompassi_schedule_get_next_visible_program( current_prog );
			}

			if( open_prog ) {
				kompassi_schedule_program_modal( open_prog );
			}
		}
	} );

	//  Events (click, keyup): Close modal
	jQuery( 'body' ).on( 'click', '#kompassi_modal_underlay, #kompassi_modal .header .close', function( e ) {
		kompassi_close_modal( );
		kompassi_schedule_update_url_hash( );
	} );
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( e.keyCode == 27 ) {
			kompassi_close_modal( );
			kompassi_schedule_update_url_hash( );
		}
	} );

	//  Events (scroll): Sticky header for timeline
	jQuery( window ).on( 'scroll', kompassi_schedule_timeline_sticky_header );

	//  Events (popstate): Refresh view on back/forward/history
	jQuery( window ).on( 'popstate', function( e ) {
		kompassi_schedule_update_filters_from_options( kompassi_get_url_options( ) );
	} );

	//  Events (click): Jump to -links
	jQuery( 'body' ).on( 'click', '.kompassi-jump-to', function( e ) {
		target = jQuery( this ).attr( 'href' );
		jQuery( target )[0].scrollIntoView( );
		e.preventDefault( );
	} );

	//  Events (click): Import
	jQuery( 'body' ).on( 'click', '.kompassi-schedule-import a', function( ) {
		url_options = kompassi_get_url_options( );

		favorites_updated = false;
		if( jQuery( this ).hasClass( 'replace' ) ) {
			kompassi_storage.favorites = url_options.favorite.split( ',' );
			favorites_updated = true;
		}
		if( jQuery( this ).hasClass( 'append' ) ) {
			old_favorites = kompassi_storage.favorites;
			new_favorites = url_options.favorite.split( ',' );
			new_favorites.filter( function( item ) {
				return old_favorites.indexOf( item );
			} );
			merged_favorites = old_favorites.concat( new_favorites );
			kompassi_storage.favorites = merged_favorites;

			if( old_favorites !== merged_favorites ) {
				favorites_updated = true;
			}
		}

		if( favorites_updated ) {
			kompassi_update_storage( );
			jQuery( '#kompassi_schedule article' ).removeClass( 'is-favorite' );
			kompassi_schedule_get_favorites_from_storage( );
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
	//  Only show "Now" during event
	now = dayjs( );
	if( now > kompassi_schedule.event.start.subtract( 2, 'hour' ) && now < kompassi_schedule.event.end ) {
		date_now_toggle = jQuery( '<a class="date-toggle no-icon" data-date="now">' + _x( 'Now', 'date filter', 'kompassi-integration' ) + '</a>' );
		date_section.append( date_now_toggle );
	}

	//  Get list of dates
	date = kompassi_schedule.event.start;
	while( date.format( 'YYYY-MM-DD' ) <= kompassi_schedule.event.end.format( 'YYYY-MM-DD' ) ) {
		date_toggle = jQuery( '<a class="date-toggle no-icon" data-date="' + date.format( 'YYYY-MM-DD' ) + '" title="' + date.format( 'ddd l' ) + '">' + date.format( 'ddd' ) + '</a>' );
		if( date.format( 'YYYY-MM-DD' ) < now.format( 'YYYY-MM-DD' ) ) {
			date_toggle.addClass( 'past' );
		} else if( date.format( 'YYYY-MM-DD' ) == now.format( 'YYYY-MM-DD' ) ) {
			date_toggle.addClass( 'current' );
		} else {
			date_toggle.addClass( 'future' );
		}
		date_section.append( date_toggle );
		date = date.add( 1, 'day' );
	}

	jQuery( date_section ).on( 'click', '.date-toggle', function( ) {
		if( jQuery( this ).hasClass( 'active' ) ) {
			jQuery( this ).removeClass( 'active' );
		} else {
			date_section.find( '.date-toggle' ).removeClass( 'active' );
			jQuery( this ).addClass( 'active' );
		}
		kompassi_schedule_apply_filters( );
	} );

	date_section.appendTo( toolbar );

	/*  Filtering section  */
	filtering_section = jQuery( '<section id="kompassi_schedule_filtering" class="kompassi-button-group has-icon-and-label" />' );
	toggle_favorites = jQuery( '<a class="favorites-toggle kompassi-icon-favorite">' + __( 'Favorites', 'kompassi-integration' ) + '</a>' ).appendTo( filtering_section );
	toggle_filters = jQuery( '<a class="filters-toggle kompassi-icon-filter">' + _x( 'Filter', 'verb (shown before filters)', 'kompassi-integration' ) + '<span class="kompassi-indicator"></span></a>' ).appendTo( filtering_section );
	filtering_section.appendTo( toolbar );

	toggle_favorites.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		kompassi_schedule_apply_filters( );
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
	filters.append( jQuery( '<div class="input"><input class="filter filter-text" name="filter_text" data-filter="text" placeholder="' + __( 'Text...', 'kompassi-integration' ) + '" /></div>' ) );

	//  Dimension filters
	jQuery.each( kompassi_schedule_dimensions, function( index, dimension ) {
		if( dimension.isListFilter == false ) {
			return;
		}
		if( kompassi_options.hidden_dimensions.indexOf( dimension.slug ) > -1 ) {
			return;
		}
		select = jQuery( '<select class="filter filter-dimension" name="filter_' + dimension.slug + '" data-filter="' + dimension.slug + '" data-dimension="' + dimension.slug + '" placeholder="' + dimension.title + '" multiple="multiple" />' );
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
			onPlaceholder: kompassi_schedule_update_multiselect_label,
			onOptionClick: kompassi_schedule_update_multiselect_label,
			onControlOpen: function( element ) {
				if( typeof this.texts.options_header !== 'undefined' && jQuery( element ).next( ).find( '.ms-options-header' ).length == 0 ) {
					header = jQuery( '<div class="ms-options-header">' + this.texts.options_header + '</div>' );
					jQuery( element ).next( ).find( '.ms-options' ).prepend( header );
				}
			}
		};

		// Negative selection filter
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
		kompassi_schedule_apply_filters( );
	} );
	filters.append( clear_filters );

	//  Show filters
	filters.insertAfter( toolbar );

	//  Handle filtering
	filters.on( 'change', '.filter-dimension', kompassi_schedule_apply_filters );
	filters.on( 'keyup', '.filter-text', function( ) {
		clearTimeout( kompassi_schedule.timeouts['text-filter'] );
		kompassi_schedule.timeouts['text-filter'] = setTimeout( kompassi_schedule_apply_filters, 300 );
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
			} else {
				jQuery( '#kompassi_schedule_display a' ).removeClass( 'active' );
				jQuery( this ).addClass( 'active' );

				kompassi_schedule_setup_display( jQuery( this ).data( 'display' ) );
				kompassi_schedule_update_url_hash( );
			}
		} );
	} );
	toolbar.append( ds );
}

/**
 *  Gets favorite programs from localStorage
 *
 */

function kompassi_schedule_get_favorites_from_storage( ) {
	jQuery.each( kompassi_storage.favorites, function( ) {
		jQuery( '#' + this ).addClass( 'is-favorite' );
	} );
}

/**
 *  Toggles the favorite filter
 *
 */

function kompassi_schedule_toggle_favorite( ) {
	program = jQuery( this ).closest( '.kompassi-program' ).data( 'id' );
	jQuery( '.kompassi-program[data-id="' + program + '"]' ).toggleClass( 'is-favorite' );

	if( kompassi_storage.favorites.includes( program ) ) {
		kompassi_storage.favorites = kompassi_storage.favorites.filter( function( id ) { return id !== program; } );
	} else {
		kompassi_storage.favorites.push( program );
	}
	kompassi_update_storage( );
}

/**
 *  Applies options
 *
 */

function kompassi_schedule_update_filters_from_options( opts = {} ) {
	filters_set = false;

	// Import
	if( opts.favorite ) {
		kompassi_schedule_import_modal( opts.favorite );
		return;
	}

	// Filters
	filters = jQuery( '#kompassi_schedule_filters .filter' );
	filters.each( function( ) {
		filter = jQuery( this );
		filter_name = filter.data( 'filter' );
		if( filter.prop( 'tagName' ) == 'SELECT' ) {
			if( opts[filter_name] ) {
				filter.find( 'option' ).each( function( ) {
					if( opts[filter_name].includes( jQuery( this ).val( ) ) ) {
						jQuery( this ).attr( 'selected', 'selected' );
						filters_set = true;
					} else {
						jQuery( this ).removeAttr( 'selected' );
					}
				} );
			} else {
				filter.find( 'option' ).removeAttr( 'selected' );
			}
			filter.multiselect( 'reload' );
		} else if( filter.prop( 'tagName' ) == 'INPUT' ) {
			if( opts[filter_name] ) {
				filter.val( decodeURIComponent( opts[filter_name] ) );
				filters_set = true;
			} else {
				filter.val( '' );
			}
		}
	} );

	// If any filters are set, open filters toolbar
	if( filters_set == true ) {
		jQuery( '.filters-toggle' ).addClass( 'active' );
		jQuery( '#kompassi_schedule_filters' ).addClass( 'visible' );
	}

	// Date
	if( opts.date ) {
		if( jQuery( '.date-toggle[data-date="' + opts.date + '"]' ).length > 0 ) {
		 	jQuery( '.date-toggle[data-date="' + opts.date + '"]' ).addClass( 'active' );
			filters_set = true;
		}
	} else {
		jQuery( '.date-toggle' ).removeClass( 'active' );
	}

	// Favorites
	if( opts.favorites ) {
		jQuery( '.favorites-toggle' ).addClass( 'active' );
		filters_set = true;
	} else {
		jQuery( '.favorites-toggle' ).removeClass( 'active' );
	}

	// Open program modal
	if( opts.prog ) {
		if( jQuery( '#' + opts.prog ).length > 0 ) {
			kompassi_schedule_program_modal( jQuery( '#' + opts.prog ) );
		}
	} else {
		if( jQuery( '#kompassi_modal.kompassi-program' ).length > 0 ) {
			kompassi_close_modal( );
		}
	}

	// Display type
	if( opts.display ) {
		kompassi_schedule_setup_display( opts.display );
	}

	// Apply filters
	kompassi_schedule_apply_filters( );
}

/**
 *  Shows visible program count
 *
 */

function kompassi_schedule_update_program_count( ) {
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

function kompassi_schedule_update_date_view_parameters( ) {
	jQuery( '#kompassi_schedule' ).removeClass( 'now' );

	kompassi_schedule.filters.date = { };
	if( jQuery( '#kompassi_block_schedule' ).find( '.date-toggle.active' ).length > 0 ) {
		// Date selected
		selected_date = jQuery( '#kompassi_block_schedule' ).find( '.date-toggle.active' ).first( );
		if( selected_date.data( 'date' ) == 'now' ) {
			// TODO: Allow user to select how much program to show?
			now_view_length = 2;
			kompassi_schedule.filters.date.start = dayjs( );
			kompassi_schedule.filters.date.end = kompassi_schedule.filters.date.start.add( now_view_length, 'hour' );
			kompassi_schedule.filters.date.length_hours = now_view_length;

			//
			jQuery( '#kompassi_schedule' ).addClass( 'now' );
		} else {
			date = dayjs( selected_date.data( 'date' ) );

			start_of_day = parseInt( kompassi_options.schedule_start_of_day );
			end_of_day = parseInt( kompassi_options.schedule_end_of_day );
			if( isNaN( start_of_day ) ) { start_of_day = 0; }
			if( isNaN( end_of_day ) ) { end_of_day = 0; }

			// Calculate Start of Day
			kompassi_schedule.filters.date.start = date.set( 'hour', start_of_day );
			if( kompassi_schedule.filters.date.start < kompassi_schedule.event.start ) {

				// Never start before event start (be nice to timeline)
				kompassi_schedule.filters.date.start = kompassi_schedule.event.start;
				start_of_day = kompassi_schedule.filters.date.start.get( 'hour' );
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
			kompassi_schedule.filters.date.end = kompassi_schedule.filters.date.start.add( kompassi_schedule.filters.date.length_hours, 'hour' );
			if( kompassi_schedule.filters.date.end > kompassi_schedule.event.end ) {
				// Never end after event end (be nice to timeline)
				kompassi_schedule.filters.date.end = kompassi_schedule.event.end;
				kompassi_schedule.filters.date.length_hours = kompassi_schedule.filters.date.end.diff( kompassi_schedule.filters.date.start, 'hour' );
			}
		}

		kompassi_schedule.filters.date.filtered = true;
		kompassi_schedule.filters.enabled += 1;
	} else {
		// No date selected
		kompassi_schedule.filters.date.start = kompassi_schedule.event.start;
		kompassi_schedule.filters.date.end = kompassi_schedule.event.end;

		// Restrict view to filtered programs
		if( kompassi_schedule.filters.enabled > 0 && jQuery( '#kompassi_schedule article:visible' ).length > 0 ) {
			starts = [];
			ends = [];

			jQuery( '#kompassi_schedule article:visible' ).each( function ( ) {
				starts.push( jQuery( this ).data( 'start' ) );
				ends.push( jQuery( this ).data( 'end' ) );
			} );

			kompassi_schedule.filters.date.start = dayjs.unix( Math.min( ...starts ) );
			kompassi_schedule.filters.date.end = dayjs.unix( Math.max( ...ends ) );
		}
	}

	// Always start and end on whole hours
	kompassi_schedule.filters.date.start = kompassi_schedule.filters.date.start.startOf( 'hour' );
	kompassi_schedule.filters.date.end = kompassi_schedule.filters.date.end.add( 1, 'hour' ).startOf( 'hour' );
	kompassi_schedule.filters.date.length_hours = kompassi_schedule.filters.date.end.diff( kompassi_schedule.filters.date.start, 'hour' );
}

/**
 *  Applies filters to program listing
 *
 */

function kompassi_schedule_apply_filters( ) {
	//  Show all and remove notification if exists
	jQuery( '#kompassi_schedule article' ).removeClass( 'filtered continues' );
	// TODO: Do this on setup_display?
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
			filter.multiselect( 'reload' );
		}

		// Text filter
		search_targets = {
			'title': 100,
			'cachedHosts': 10,
			'description': 1
		};
		if( filter.hasClass( 'filter-text' ) ) {
			if( filter.val( ) !== '' ) {
				words = filter.val( ).toLowerCase( ).split( ' ' ).filter( function( el ) { return el.length > 0; } ); // words to look for

				jQuery( '#kompassi_schedule article:visible' ).each( function( index ) {
					program = jQuery( this );
					program_relevance = 0;
					word_matches = 0;
					jQuery.each( search_targets, function( target, target_relevance_score ) {
						text = program.find( '.' + target ).first( ).text( ).toLowerCase( );
						jQuery.each( words, function( ) {
							if( text.includes( this ) ) {
								program_relevance += target_relevance_score;
								word_matches += 1;
							}
						} );
					} );
					if( program_relevance > 0 && word_matches == words.length ) {
						program.css( 'order', '-' + program_relevance ); // Sort text searches by relevance
					} else {
						program.addClass( 'filtered' );
					}
				} );
				filter_count += 1;
			} else {
				jQuery( '#kompassi_schedule article' ).css( { 'order': '' } );
			}
		}
	} );

	// Show how many filters from the dropdown area are activated
	if( filter_count > 0 ) {
		jQuery( '#kompassi_block_schedule' ).find( '.filters-toggle .kompassi-indicator' ).text( filter_count );
	} else {
		jQuery( '#kompassi_block_schedule' ).find( '.filters-toggle .kompassi-indicator' ).empty( );
	}

	kompassi_schedule.filters.enabled = filter_count;

	// Favorite filter
	if( jQuery( '#kompassi_block_schedule' ).find( '.favorites-toggle' ).hasClass( 'active' ) ) {
		jQuery( '#kompassi_schedule article:not(.is-favorite)' ).addClass( 'filtered' );
		kompassi_schedule.filters.enabled += 1;
	}

	// Date filter
	kompassi_schedule_update_date_view_parameters( );

	jQuery( '#kompassi_schedule article:visible' ).each( function( index ) {
		program = jQuery( this );
		program_start = parseInt( program.data( 'start' ) );
		program_end = parseInt( program.data( 'end' ) );
		if( program_start > kompassi_schedule.filters.date.end.unix( ) || program_end <= kompassi_schedule.filters.date.start.unix( ) ) {
			program.addClass( 'filtered' );
		}
		if( program_start < kompassi_schedule.filters.date.start.unix( ) && program_end > kompassi_schedule.filters.date.start.unix( ) ) {
			// TODO: When on "Now" view, all programs that started before this exact minute should be "continues"!
			program.addClass( 'continues' );
		}
	} );

	// If there is no text search and there is a date search, and there is programs that have started before the filtered timerange, show notification
	if( jQuery( '#kompassi_block_schedule' ).find( '.date-toggle.active' ).length > 0 ) {
		if( kompassi_options.schedule_start_of_day != 0 || kompassi_options.schedule_end_of_day != 0 ) {
			// Do not show message on "Now" view
			if( jQuery( '#kompassi_block_schedule' ).find( '.date-toggle.active' ).first( ).data( 'date' ) != 'now' ) {
				program_count = jQuery( '#kompassi_schedule article:not(.filtered)' ).length;
				if( program_count > 0 ) {
					// translators: start of day hour, end of day hour
					jQuery( '#kompassi_schedule_notes' ).append( '<span class="filter programs-between display-not-timeline">' + sprintf( __( 'Showing programs starting between %1$s and %2$s.', 'kompassi-integration' ), kompassi_options.schedule_start_of_day, kompassi_options.schedule_end_of_day ) + '</span>' );
				}
			}
		}
		// Show note about the Start/End of Day times
		if( jQuery( '#kompassi_schedule_filters [name="filter_text"]' ).val( ).length < 1 && jQuery( '#kompassi_schedule article.continues' ).length > 0 ) {
			count = jQuery( '#kompassi_schedule article.continues:visible' ).length;
			// translators: amount of repositioned events
			jQuery( '#kompassi_schedule_notes' ).append( '<span class="filter programs-continuing display-not-timeline"><a class="kompassi-jump-to" href="#kompassi_programs_continuing">' + sprintf( _n( 'Show %d program that started earlier', 'Show %d programs that started earlier', count, 'kompassi-integration' ), count ) + '</a></span>' );
			jQuery( '#kompassi_schedule article.continues' ).first( ).before( '<h3 id="kompassi_programs_continuing">' + __( 'Programs continuing', 'kompassi-integration' ) + '</h3>' );
		}
	}

	//
	if( kompassi_schedule.filters.enabled > 0 ) {
		jQuery( '#kompassi_schedule_filters' ).addClass( 'has-filters-enabled' );
	} else {
		jQuery( '#kompassi_schedule_filters' ).removeClass( 'has-filters-enabled' );
	}

	kompassi_schedule_setup_display( );
	kompassi_schedule_update_url_hash( );
}

/**
 *  Update multiselect labels
 *  - Show indicator
 *  - Show select label instead of "Multiple selected"
 *
 *  @param {Object} element JS element to update
 *
 */

function kompassi_schedule_update_multiselect_label( element ) {
	options = jQuery( element ).find( 'option' ).length;
	selected_options = jQuery( element ).next( ).find( '.selected' ).length;

	html = this.texts.select_label;
	if( selected_options > 0 ) {
		html += ' <span class="kompassi-indicator">' + selected_options + '</span>';
	}
	jQuery( element ).next( ).find( 'button' ).first( ).html( html );
}

/*
 *  Setup display
 *
 */

function kompassi_schedule_setup_display( display = false ) {
	if( display ) {
		display_type = display;
	} else {
		display_type = jQuery( '#kompassi_schedule' ).data( 'display' );
	}
	jQuery( '#kompassi_schedule' ).data( 'display', display_type );
	jQuery( '#kompassi_schedule' ).attr( 'data-display', display_type );

	//  Refresh display layout
	//  TODO
	kompassi_schedule_revert_display_layouts( );
	if( display_type == 'list' ) {
		kompassi_schedule_setup_list_layout( );
	}
	if( display_type == 'timeline' ) {
		kompassi_schedule_setup_timeline_layout( );
	}

	//  Hide/show relevant notes
	jQuery( '#kompassi_schedule_notes .display-not-' + display_type ).hide( );
	jQuery( '#kompassi_schedule_notes .display-only-' + display_type ).show( );

	//  Make selected display type selector active
	jQuery( '#kompassi_schedule_display a' ).removeClass( 'active' );
	jQuery( '#kompassi_schedule_display [data-display="' + display_type + '"]' ).addClass( 'active' );

	//  Update visible program count
	kompassi_schedule_update_program_count( );
}

/**
 *  Sets up list display layout
 *  TODO: #36
 *
 */

function kompassi_schedule_setup_list_layout( ) {
}


/**
 *  Sets up timeline display layout
 *
 */

function kompassi_schedule_setup_timeline_layout( ) {
	rows = [ 'day hints', 'time hints' ];

	kompassi_schedule_update_date_view_parameters( );

	prev_group = undefined;
	group_index = 0;

	// Calculate shown view in minutes
	length = kompassi_schedule.filters.date.length_hours * 60;

	jQuery( '#kompassi_schedule article:visible' ).sort( kompassi_schedule_sort_by_group ).each( function( index ) {
		program = jQuery( this );

		// Count the width % and offset % for program
		width = program.data( 'length' ) / length * 100;
		offset_in_s = program.data( 'start' ) - ( kompassi_schedule.filters.date.start.unix( ) );
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

		program.css( 'width', 'calc( ' + width + '% - 9px )' );
		program.css( 'min-width', 'calc( ' + width + '% - 9px )' );
		program.css( 'left', 'calc( ' + offset + '% + 3px )' );
		program.css( 'top', 'calc( ' + program_row + ' * var(--kompassi-schedule-timeline-row-height)' ); // Grouping
		if( offset < 0 ) {
			program.find( '.title' ).css( 'left', ( ( -1 * program.position( ).left ) + 6 ) + 'px' );
		}

		if( grouping ) {
			prev_group = group_name;
		}
	} );

	// Make the schedule high enough to contain all rows
	jQuery( '#kompassi_schedule' ).css( 'height', 'calc( var(--kompassi-schedule-timeline-row-height) * ' + ( rows.length ) + ' )' );

	// Rulers
	headers = jQuery( '<div class="headers" />' );
	j = 0;
	offset = 100 / Math.ceil( kompassi_schedule.filters.date.length_hours );
	for( i = 0; i < Math.ceil( kompassi_schedule.filters.date.length_hours ); i++ ) {
		label = kompassi_schedule.filters.date.start.add( i, 'hour' ).format( 'H' );
		jQuery( '#kompassi_schedule' ).append( '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );" />' ); // + label + '</div>' );
		headers.append( '<div class="hint time_hint" style="left: calc( ' + offset + ' * ' + i + '%); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );">' + label + '</div>' );
		if( label == '0' || i == 0 ) {
			day = kompassi_schedule.filters.date.start.add( j, 'day' ).format( 'LL' );
			headers.append( '<strong class="hint day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% ); z-index: ' + j + ';"><span>' + day + '</span></div>' );
			j += 1;
		}
	}
	jQuery( '#kompassi_schedule' ).prepend( headers );

	// Reset zoom
	kompassi_schedule_timeline_zoom_set( 1 );

	// Enable zooming
	jQuery( '#kompassi_schedule' ).data( 'scale', 1 );
	var hammer = new Hammer( jQuery( '#kompassi_schedule' )[0], { touchAction: 'pan-x pan-y' } );
	hammer.get( 'pinch' ).set( { enable: true } );
	hammer.get( 'pan' ).set( { direction: Hammer.DIRECTION_ALL } );

	// Zoom (pinch)
	hammer.on( 'pinch', function( ev ) {
		if( ev.additionalEvent == 'pinchin' ) {
			kompassi_schedule_timeline_zoom( 1 );
		} else {
			kompassi_schedule_timeline_zoom( -1 );
		}
	} );

	// Zoom (mouse)
	jQuery( '#kompassi_schedule' )[0].addEventListener( 'wheel', function( event ) {
		if( event.shiftKey ) {
			kompassi_schedule_timeline_zoom( event.deltaY );
		}
	} );

	// Pan
	hammer.on( 'pan', function( ev ) {
		switch( ev.additionalEvent ) {
			case 'panleft':
				kompassi_schedule_timeline_pan( 1, 0, ev );
				break;
			case 'panright':
				kompassi_schedule_timeline_pan( -1, 0, ev );
				break;
			case 'panup':
				kompassi_schedule_timeline_pan( 0, 1, ev );
				break;
			case 'pandown':
				kompassi_schedule_timeline_pan( 0, -1, ev );
				break;
		}
	} );
}

function kompassi_schedule_timeline_zoom( direction ) {
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

	kompassi_schedule_timeline_zoom_set( scale );
}

function kompassi_schedule_timeline_zoom_set( scale ) {
	elem = jQuery( '#kompassi_schedule' );
	elem.data( 'scale', scale );
	elem.css( 'width', ( scale * 100 ) + '%' );
	kompassi_schedule_timeline_reposition_labels( );
}

function kompassi_schedule_timeline_pan( direction_x, direction_y, ev ) {
	// ev.pointerType == 'mouse'
	pan_speed_x = 20;
	pan_speed_y = 10;

	if( direction_x !== 0 ) {
		wrapper = jQuery( '#kompassi_schedule' ).parent( '.kompassi_schedule_wrapper' );
		wrapper.scrollLeft( wrapper.scrollLeft( ) + ( direction_x * pan_speed_x ) );
		kompassi_schedule_timeline_reposition_labels( );
	}
	if( direction_y !== 0 ) {
		wrapper = jQuery( window );
		wrapper.scrollTop( parseInt( wrapper.scrollTop( ) ) + ( direction_y * pan_speed_y ) );
	}
}

function kompassi_schedule_timeline_reposition_labels( ) {
	// Reposition headers
	jQuery( '#kompassi_schedule .day_hint' ).each( function( ) {
		content_width = jQuery( this ).find( 'span' ).first( ).outerWidth( );
		scroll = jQuery( this ).closest( '.kompassi_schedule_wrapper' ).scrollLeft( );
		offset = jQuery( this )[0].offsetLeft;
		next_offset = jQuery( this ).next( )[0].offsetLeft;

		if( scroll > offset ) {
			jQuery( this ).css( 'padding-left', ( scroll - offset ) + 'px' );
		} else {
			jQuery( this ).css( 'padding-left', '' );
		}
	} );

	// Reposition program titles that are left of visible area
	jQuery( '#kompassi_schedule article' ).each( function( ) {
		program_pos = parseInt( jQuery( this ).css( 'left' ) );

		if( !isNaN( program_pos ) && program_pos < scroll ) {
			program_pad = scroll - program_pos;
			jQuery( this ).find( '.title' ).css( 'margin-left', program_pad + 'px' );
			jQuery( this ).addClass( 'continues' );
		} else {
			jQuery( this ).find( '.title' ).css( 'margin-left', 0 );
			jQuery( this ).removeClass( 'continues' );
		}
	} );
}

/**
 *  Revert display layouts
 *
 */

function kompassi_schedule_revert_display_layouts( ) {
	// Timeline
	jQuery( '#kompassi_schedule' ).css( 'height', 'auto' );
	jQuery( '#kompassi_schedule article' ).css( { 'width': '', 'min-width': '', 'left': '', 'top': '' } );
	jQuery( '#kompassi_schedule .title' ).css( { 'left': '', 'position': '', 'margin-left': '' } );
	jQuery( '#kompassi_schedule .headers, #kompassi_schedule .ruler, #kompassi_schedule .group-name' ).remove( );
}

/**
 *  Opens program modal
 *
 *  @param {Object} program jQuery object of the program number
 *
 */

function kompassi_schedule_program_modal( program ) {
	kompassi_close_modal( );

	styles = '';
	if( program.css( '--kompassi-program-color' ) !== undefined ) {
		styles += '--kompassi-program-color: ' + program.css( '--kompassi-program-color' ) + '; ';
	}
	if( program.css( '--kompassi-program-icon' ) !== undefined ) {
		styles += '--kompassi-program-icon: ' + program.css( '--kompassi-program-icon' ) + '; ';
	}

	actions = program.find( '.actions' ).clone( );
	actions.prepend( program.find( '.favorite' ).clone( ) );

	options = {
		attrs: {
			'class': program.attr( 'class' ),
			'data-id': program.data( 'id' ),
			'style': styles,
		},
		title: program.find( '.title' ).text( ),
		actions: actions.html( ),
		content: program.find( '.main' ).html( ),
		footer: program.find( '.meta' ).html( ),
	}
	kompassi_show_modal( options );

	// Swipe
	var hammer_modal = new Hammer( jQuery( '#kompassi_modal.kompassi-program' )[0], { touchAction: 'swipe' } );
	hammer_modal.on( 'swipe', function( ev ) {
		current_prog = jQuery( '#kompassi_modal.kompassi-program' ).data( 'id' );

		if( ev.direction == '4' ) {
			open_prog = kompassi_schedule_get_next_visible_program( current_prog, -1 );
		}
		if( ev.direction == '2' ) {
			open_prog = kompassi_schedule_get_next_visible_program( current_prog );
		}

		if( open_prog ) {
			kompassi_schedule_program_modal( open_prog );
		}
	} );

	kompassi_schedule_update_url_hash( );
}

/**
 *  Displays schedule help modal
 *
 */

function kompassi_schedule_help_modal( ) {
	opts = {
		rest_route: 'kompassi-integration/v1/docs/schedule_	help/' + kompassi_options.locale,
		success: function( response ) {
			var sdc = new showdown.Converter( );
			options = {
				title: __( 'Help!', 'kompassi-integration' ),
				content: sdc.makeHtml( response.content ),
				attrs: {
					class: 'kompassi-document'
				},
			};
			if( response.status !== false ) {
				kompassi_show_modal( options );
			}
		},
	};
	kompassi_ajax_query( opts );
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
	markup += __( 'Create an import link to export your favorites to another device.', 'kompassi-integration' ) + ' ';
	markup += __( 'Favorites to be exported:', 'kompassi-integration' );
	markup += '</p>';
	markup += '<ul class="program-title-list">';
	titles.forEach( function( value, index, array ) {
		markup += '<li>' + value + '</li>';
	} );
	markup += '</ul>';
	actions = '<a onClick="kompassi_href_to_clipboard(event,this);" href="' + export_link + '">' + __( 'Copy import link to clipboard', 'kompassi-integration' ) + '</a>';
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

function kompassi_schedule_get_next_visible_program( current = false, reverse = false ) {
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
 *  Gets URL hash components from filters
 *
 */

function kompassi_schedule_collect_url_hash( ) {
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
	jQuery( '#kompassi_schedule_filters .filter' ).each( function( ) {
		filter = jQuery( this );
		opt_name = filter.data( 'filter' );
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
	opts.push( 'display:' + jQuery( '#kompassi_schedule' ).data( 'display' ) );

	return opts;
}

/**
 *  Updates the URL hash based on selected options
 *
 */

function kompassi_schedule_update_url_hash( ) {
	opts = kompassi_schedule_collect_url_hash( );
	kompassi_set_url_options( opts );
}

/**
 *  Sorting function to sort program by group (and alphabetically inside groups)
 *
 */

function kompassi_schedule_sort_by_group( a, b ) {
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
