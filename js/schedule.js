__ = wp.i18n.__;
_x = wp.i18n._x;
_n = wp.i18n._n;
sprintf = wp.i18n.sprintf;

//let kompassi_common; /* ? */
//let kompassi_storage; /* ? */

let kompassi_schedule = {
	'event': {},
	'filters': {},
	'timeouts': {},
};

dayjs.locale( kompassi_schedule_options.locale );

wp.hooks.addFilter( 'kompassi_init_storage', 'kompassi_schedule', function( storage ) {
	storage['favorites'] = [];
	return storage;
} );

document.addEventListener( 'DOMContentLoaded', function( event ) {
jQuery( function( e ) { // TODO
	/*
	 *  Get date/time related information about program
	 *  - Earliest starting time for program
	 *  - Latest ending time for program
	 *  - List of dates the program spans through
	 *
	 */

	kompassi_schedule.event.start = dayjs( document.getElementById( 'kompassi_schedule' ).dataset.start );
	kompassi_schedule.event.end = dayjs( document.getElementById( 'kompassi_schedule' ).dataset.end );

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
} );

/**
 *  Initializes the schedule markup
 *
 */

function kompassi_schedule_init( ) {
	let block = document.getElementById( 'kompassi_block_schedule' );
	let schedule = document.getElementById( 'kompassi_schedule' );

	//  MARKUP

	//  Container for notes
	let notes = document.createElement( 'section' );
	notes.id = 'kompassi_schedule_notes';
	notes.classList.add( 'kompassi-notes' );
	block.prepend( notes );

	//  Schedule toolbar
	kompassi_schedule_init_toolbar( );

	//  Add favorite action to each article
	let programs = schedule.querySelectorAll( 'article' );
	for( let program of programs ) {
		let title = program.querySelector( '.title' );
		title.insertAdjacentHTML( 'afterend', '<a class="favorite kompassi-icon-favorite" title="' + _x( 'Favorite', 'button label', 'kompassi-integration' ) + '"/>' );
	}

	//  On completely white backgrounds, switch the --kompassi-bg color to an alternative
	kompassi_check_bg_contrast( block );

	//  EVENTS

	//  Events (click): Favorite
	schedule.addEventListener( 'click', function( event ) {
		if( event.target.classList.contains( 'favorite' ) ) {
			kompassi_schedule_toggle_favorite( event.target );
		}
	} );

	//  Events (mouseover, mouseout): Popover
	schedule.addEventListener( 'mouseover', function( event ) {
		if( schedule.dataset.display != 'timeline' ) {
			return;
		}

		program = event.target.closest( 'article' );

		if( !program ) {
			return;
		}

		clearTimeout( kompassi_schedule.timeouts['popover'] );

		options = {
			title: program.querySelector( '.title' ).textContent,
			content: program.querySelector( '.times' ).innerHTML // TODO: What data to show?
		}
		kompassi_schedule.timeouts['popover'] = setTimeout( kompassi_popover, 300, options, event, program );
	} );

	schedule.addEventListener( 'mouseout', function( event ) {
		clearTimeout( kompassi_schedule.timeouts['popover'] );
		program = event.target.closest( 'article' );
		popover = document.getElementById( 'kompassi_popover' );
		if( program && popover ) {
			popover.remove( );
		}
	} );

	//  Events (click): Modal
	jQuery( '#kompassi_schedule article' ).on( 'click', function( e ) {
		// If shift key is pressed and we are not on timeline, open the details inline
		if( kompassi_common.shift_pressed && 'timeline' != jQuery( '#kompassi_schedule' ).data( 'display' ) ) {
			return;
		}

		// This is a link, open it
		if( e.target.tagName == 'A' && !jQuery( e.target ).hasClass( 'favorite' ) ) {
			return;
		}

		// Prevent details from opening
		e.preventDefault( );

		if( jQuery( e.target ).hasClass( 'favorite' ) ) {
			return;
		}
		kompassi_schedule_program_modal( this );
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
			let programs = document.querySelectorAll( '#kompassi_schedule article.is-favorite' );
			for( let program of programs ) {
				program.classList.remove( 'is-favorite' );
			}
			kompassi_schedule_get_favorites_from_storage( );
		}

		kompassi_close_modal( );
		kompassi_schedule_update_url_hash( );
	} );
}

/**
 *  Initializes the schedule toolbar
 *
 */

function kompassi_schedule_init_toolbar( ) {
	let block = document.getElementById( 'kompassi_block_schedule' );
	let toolbar = document.createElement( 'section' );
	toolbar.id = 'kompassi_schedule_toolbar';
	block.prepend( toolbar );

	/*  Date filter  */
	let date_toggles = document.createElement( 'section' );
	date_toggles.id = 'kompassi_schedule_dates';
	date_toggles.classList.add( 'kompassi-button-group' );

	//  Only show "Now" during event
	now = dayjs( );
	if( now > kompassi_schedule.event.start.subtract( 2, 'hour' ) && now < kompassi_schedule.event.end ) {
		let toggle = document.createElement( 'a' );
		toggle.classList.add( 'date-toggle', 'no-icon' );
		toggle.dataset.date = 'now';
		toggle.textContent = _x( 'Now', 'date filter', 'kompassi-integration' );
		date_toggles.append( toggle );
	}

	//  Get list of dates
	let date = kompassi_schedule.event.start;
	while( date.format( 'YYYY-MM-DD' ) <= kompassi_schedule.event.end.format( 'YYYY-MM-DD' ) ) {
		let toggle = document.createElement( 'a' );
		toggle.classList.add( 'date-toggle', 'no-icon' );
		toggle.dataset.date = date.format( 'YYYY-MM-DD' );
		toggle.title = date.format( 'ddd l' );
		toggle.textContent = date.format( 'ddd' );
		// TODO: Need to take into account start/end of day, as the current time might not equal current date view
		if( date.format( 'YYYY-MM-DD' ) < now.format( 'YYYY-MM-DD' ) ) {
			toggle.classList.add( 'past' );
		} else if( date.format( 'YYYY-MM-DD' ) == now.format( 'YYYY-MM-DD' ) ) {
			toggle.classList.add( 'current' );
		} else {
			toggle.classList.add( 'future' );
		}
		date_toggles.append( toggle );
		date = date.add( 1, 'day' );
	}

	date_toggles.addEventListener( 'click', function( event ) {
		let activated_toggle = event.target;
		if( !activated_toggle.classList.contains( 'date-toggle' ) ) {
			return;
		}

		if( activated_toggle.classList.contains( 'active' ) ) {
			activated_toggle.classList.removeClass( 'active' );
		} else {
			let toggles = toggle.closest( 'section' ).querySelectorAll( '.date-toggle' );
			for( let toggle of toggles ) {
				if( toggle.dataset.date != activated_toggle.dataset.date ) {
					toggle.classList.remove( 'active' );
				} else {
					toggle.classList.add( 'active' );
				}
			}
		}
		kompassi_schedule_apply_filters( );
	} );

	toolbar.append( date_toggles );

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
		if( kompassi_schedule_options.hidden_dimensions.indexOf( dimension.slug ) > -1 ) {
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
	let display = document.createElement( 'section' );
	display.id = 'kompassi_schedule_display';
	display.classList.add( 'kompassi-button-group', 'has-icon-and-label' );
	for( let style in styles ) {
		let toggle = document.createElement( 'a' );
		toggle.classList.add( 'kompassi-icon-' + style );
		toggle.dataset.display = style;
		toggle.textContent = styles[style];
		display.append( toggle );

		toggle.addEventListener( 'click', function( event ) {
			if( event.target.classList.contains( 'active' ) ) {
				return;
			}

			let toggles = document.querySelectorAll( '#kompassi_schedule_display a' );
			for( let toggle of toggles ) {
				if( toggle.dataset.display != event.target.dataset.display ) {
					toggle.classList.remove( 'active' );
				} else {
					toggle.classList.add( 'active' );
				}

				kompassi_schedule_setup_display( event.target.dataset.display );
				kompassi_schedule_update_url_hash( );
			}
		} );
	}
	toolbar.append( display );
}

/**
 *  Gets favorite programs from localStorage
 *
 */

function kompassi_schedule_get_favorites_from_storage( ) {
	for( let program of kompassi_storage.favorites ) {
		document.getElementById( program ).classList.add( 'is-favorite' );
	};
}

/**
 *  Toggles the favorite filter
 *
 */

function kompassi_schedule_toggle_favorite( element ) {
	let program = element.closest( '.kompassi-program' ).id;
	let elements = document.querySelectorAll( '.kompassi-program[data-id="' + program + '"]' );
	for( let element of elements ) {
		element.classList.toggle( 'is-favorite' );
	}

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
		document.querySelector( '.filters-toggle' ).classList.add( 'active' );
		document.getElementById( 'kompassi_schedule_filters' ).classList.add( 'visible' );
	}

	// Date
	if( opts.date ) {
		let date_toggle = document.querySelector( '.date-toggle[data-date="' + opts.date + '"]');
		if( date_toggle ) {
			date_toggle.classList.add( 'active' );
			filters_set = true;
		}
	} else {
		let date_toggles = document.querySelectorAll( '#kompassi_schedule .date-toggle' );
		for( let toggle of date_toggles ) {
			toggle.classList.remove( 'active' );
		}
	}

	// Favorites
	let favorites_toggle = document.querySelector( '#kompassi_schedule .favorites-toggle' );
	if( opts.favorites ) {
		if( favorites_toggle ) {
			favorites_toggle.classList.add( 'active' );
		}
		filters_set = true;
	} else {
		if( favorites_toggle ) {
			favorites_toggle.classList.remove( 'active' );
		}
	}

	// Open program modal
	if( opts.prog ) {
		prog = document.getElementById( opts.prog );
		if( prog ) {
			kompassi_schedule_program_modal( prog );
		}
	} else {
		if( document.getElementById( 'kompassi_modal' ) ) {
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
	note = document.querySelector( '#kompassi_schedule_notes .program-count' );
	if( note ) {
		note.remove( );
	}
	program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
	if( kompassi_schedule.filters.enabled > 0 ) {
		notes = document.getElementById( 'kompassi_schedule_notes' );
		if( program_count > 0 ) {
			// translators: count of programs visible
			program_count_label = sprintf( _n( '%s program visible.', '%s programs visible.', program_count, 'kompassi-integration' ), program_count );
			notes.insertAdjacentHTML( 'afterbegin', '<span class="program-count">' + program_count_label + '</span>' );
		} else {
			notes.insertAdjacentHTML( 'afterbegin', '<span class="program-count">' + __( 'Nothing matched your search!', 'kompassi-integration' ) + '</span>' );
		}
	}
}

/**
 *  Updates date view parameters
 *
 */

function kompassi_schedule_update_date_view_parameters( ) {
	document.getElementById( 'kompassi_schedule' ).classList.remove( 'now' );

	kompassi_schedule.filters.date = { };
	date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
	if( date_filter ) {
		// Date selected
		if( date_filter.dataset.date == 'now' ) {
			// TODO: Allow user to select how much program to show?
			now_view_length = 2;
			kompassi_schedule.filters.date.start = dayjs( );
			kompassi_schedule.filters.date.end = kompassi_schedule.filters.date.start.add( now_view_length, 'hour' );
			kompassi_schedule.filters.date.length_hours = now_view_length;

			//
			document.getElementById( 'kompassi_schedule' ).classList.add( 'now' );
		} else {
			date = dayjs( date_filter.dataset.date );

			start_of_day = parseInt( kompassi_schedule_options.schedule_start_of_day );
			end_of_day = parseInt( kompassi_schedule_options.schedule_end_of_day );
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
		programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
		if( kompassi_schedule.filters.enabled > 0 && programs_visible ) {
			let starts = [];
			let ends = [];

			for( let program of programs_visible ) {
				starts.push( parseInt( program.dataset.start ) );
				ends.push( parseInt( program.dataset.end ) );
			}
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
	programs = document.querySelectorAll( '#kompassi_schedule article' );
	for( let program of programs ) {
		program.classList.remove( 'filtered', 'continues' );
	}
	// TODO: Do these on setup_display?
	let filter_notes = document.querySelectorAll( '#kompassi_schedule_notes .filter' );
	for( let note of filter_notes ) {
		note.remove( );
	}
	continuing = document.getElementById( '#kompassi_programs_continuing' );
	if( continuing ) {
		continuing.remove( );
	}

	kompassi_schedule.filters = { };
	let filter_count = 0;

	//  Iterate through each filter
	let filters = document.querySelectorAll( '#kompassi_schedule_filters .filter' );
	for( let filter of filters ) {
		// Dimension filters
		if( filter.classList.contains( 'filter-dimension' ) ) {
			if( filter.value.length > 0 ) {
				let filter_dimension = filter.dataset.dimension;
				let programs = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
				for( let program of programs ) {
					let match = false;

					if( program.hasAttribute( 'data-' + filter_dimension ) ) {
						let program_dimensions = program.getAttribute( 'data-' + filter_dimension ).split( ',' );
						let dimension_match = false;
						for( let dimension of program_dimensions ) {
							if( filter.value.includes( dimension ) ) {
								dimension_match = true;
								break;
							}
						}

						if( dimension_match ) {
							match = true;
						}

						if( filter.classList.contains( 'flag-negative' ) ) {
							match = !match;
						}
					}

					if( !match ) {
						program.classList.add( 'filtered' );
					}
				}
				filter_count += 1;
			}
			jQuery( filter ).multiselect( 'reload' );
		}

		// Text filter
		if( filter.classList.contains( 'filter-text' ) ) {
			if( filter.value !== '' ) {
				let words = filter.value.toLowerCase( ).split( ' ' ).filter( function( el ) { return el.length > 0; } ); // words to look for

				let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
				for( let program of programs_visible ) {
					let program_relevance = 0;
					let word_matches = 0;
					for( let target in kompassi_schedule_options.search_targets ) {
						let text = program.getElementsByClassName( target )[0].textContent.toLowerCase( );
						for( let word of words ) {
							if( text.includes( word ) ) {
								program_relevance += kompassi_schedule_options.search_targets[target];
								word_matches += 1;
							}
						}
					}
					if( program_relevance > 0 && word_matches == words.length ) {
						program.style.order = '-' + program_relevance;
					} else {
						program.classList.add( 'filtered' );
					}
				}
				filter_count += 1;
			} else {
				for( let program of document.querySelectorAll( '#kompassi_schedule article' ) ) {
					program.style.order = null;
				}
			}
		}
	}

	// Show how many filters from the dropdown area are activated
	if( filter_count > 0 ) {
		document.querySelector( '#kompassi_block_schedule .filters-toggle .kompassi-indicator' ).textContent = filter_count;
	} else {
		document.querySelector( '#kompassi_block_schedule .filters-toggle .kompassi-indicator' ).textContent = '';
	}

	kompassi_schedule.filters.enabled = filter_count;

	// Favorite filter
	if( document.querySelector( '#kompassi_block_schedule .favorites-toggle' ).classList.contains( 'active' ) ) {
		not_favorite_programs = document.querySelectorAll( '#kompassi_schedule article:not(.is-favorite)' );
		for( let program of not_favorite_programs ) {
			program.classList.add( 'filtered' );
		}
		kompassi_schedule.filters.enabled += 1;
	}

	// Date filter
	kompassi_schedule_update_date_view_parameters( );

	programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
	for( let program of programs_visible ) {
		let program_start = parseInt( program.dataset.start );
		let program_end = parseInt( program.dataset.end );
		if( program_start > kompassi_schedule.filters.date.end.unix( ) || program_end <= kompassi_schedule.filters.date.start.unix( ) ) {
			program.classList.add( 'filtered' );
		}
		if( program_start < kompassi_schedule.filters.date.start.unix( ) && program_end > kompassi_schedule.filters.date.start.unix( ) ) {
			// TODO: When on "Now" view, all programs that started before this exact minute should be "continues"!
			program.classList.add( 'continues' );
		}
	}

	// If there is no text search and there is a date search, and there is programs that have started before the filtered timerange, show notification
	date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
	if( date_filter ) {
		if( kompassi_schedule_options.schedule_start_of_day != 0 || kompassi_schedule_options.schedule_end_of_day != 0 ) {
			// Do not show message on "Now" view
			if( date_filter.dataset.date != 'now' ) {
				program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
				if( program_count > 0 ) {
					// translators: start of day hour, end of day hour
					notes = document.getElementById( 'kompassi_schedule_notes' );
					notes.insertAdjacentHTML( 'beforeend', '<span class="filter programs-between display-not-timeline">' + sprintf( __( 'Showing programs starting between %1$s and %2$s.', 'kompassi-integration' ), kompassi_schedule_options.schedule_start_of_day, kompassi_schedule_options.schedule_end_of_day ) + '</span>' );
				}
			}
		}
		// Show note about the Start/End of Day times
		text_filter = document.querySelector( '#kompassi_schedule_filters [name="filter_text"]' );
		continuing = document.querySelectorAll( '#kompassi_schedule article.continues' );
		if( text_filter.value.length < 1 && continuing.length > 0 ) {
			count = jQuery( '#kompassi_schedule article.continues:visible' ).length;
			// translators: amount of repositioned events
			jQuery( '#kompassi_schedule_notes' ).append( '<span class="filter programs-continuing display-not-timeline"><a class="kompassi-jump-to" href="#kompassi_programs_continuing">' + sprintf( _n( 'Show %d program that started earlier', 'Show %d programs that started earlier', count, 'kompassi-integration' ), count ) + '</a></span>' );
			jQuery( '#kompassi_schedule article.continues' ).first( ).before( '<h3 id="kompassi_programs_continuing">' + __( 'Programs continuing', 'kompassi-integration' ) + '</h3>' );
		}
	}

	//
	filters = document.getElementById( 'kompassi_schedule_filters' );
	if( kompassi_schedule.filters.enabled > 0 ) {
		filters.classList.add( 'has-filters-enabled' );
	} else {
		filters.classList.remove( 'has-filters-enabled' );
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
	let display_type;
	let schedule = document.getElementById( 'kompassi_schedule' );

	if( display ) {
		display_type = display;
		schedule.dataset.display = display_type;
	} else {
		display_type = schedule.dataset.display;
	}

	//  Refresh display layout
	//  TODO: wp hook
	kompassi_schedule_revert_display_layouts( );
	if( display_type == 'list' ) {
		kompassi_schedule_setup_list_layout( );
	}
	if( display_type == 'timeline' ) {
		kompassi_schedule_setup_timeline_layout( );
	}

	//  Hide/show relevant notes
	//  TODO: Are these not always written anyway?
	let notes = document.getElementById( 'kompassi_schedule_notes' );
	let hide = notes.querySelectorAll( '.display-not-' + display_type );
	let show = notes.querySelectorAll( '.display-only-' + display_type );
	for( let note of hide ) {
		note.style.display = 'none';
	}
	for( let note of show ) {
		note.style.display = 'block';
	}

	//  Make selected display type toggle active
	let toggles = document.querySelectorAll( '#kompassi_schedule_display a' );
	for( let toggle of toggles ) {
		if( toggle.dataset.display == display_type ) {
			toggle.classList.add( 'active' );
		} else {
			toggle.classList.remove( 'active' );
		}
	}

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
	let schedule = document.getElementById( 'kompassi_schedule' );
	let rows = [ 'day hints', 'time hints' ];

	kompassi_schedule_update_date_view_parameters( );

	let prev_group = undefined;
	let group_index = 0;
	let check_index = 2;
	let group_name = false;

	// Calculate shown view in minutes
	let length = kompassi_schedule.filters.date.length_hours * 60;

	let programs = schedule.querySelectorAll( 'article:not(.filtered)' );
	programs = [...programs].sort( kompassi_schedule_sort_by_group );
	for( let program of programs ) {
		// Count the width % and offset % for program
		let width = program.dataset.length / length * 100;
		let offset_in_s = program.dataset.start - kompassi_schedule.filters.date.start.unix( );
		let offset_in_m = offset_in_s / 60;
		let offset = offset_in_m / length * 100;
		let grouping = false;

		// See if we need to add a group heading
		if( kompassi_schedule_options.timeline_grouping.length > 0 && kompassi_schedule_dimensions.some( e => e.slug == kompassi_schedule_options.timeline_grouping ) ) {
			grouping = kompassi_schedule_options.timeline_grouping;
		}

		if( grouping ) {
			group_name = program.querySelector( '.' + grouping ).textContent;
			if( group_name != prev_group ) {
				check_index = rows.push( 'group: ' + group_name );
				group_index = check_index;
				let group = document.createElement( 'p' );
				group.classList.add( 'group-name' );
				group.style.top = 'calc( ' + ( rows.length - 1 ) + ' * var(--kompassi-schedule-timeline-row-height)';
				// TODO: Case: All items have no grouping value or have multiple
				if( group_name.length == 0 ) {
					group.innerHTML = __( 'Ungrouped', 'kompassi-integration' );
				} else {
					group.innerHTML = group_name;
				}
				schedule.appendChild( group );
			} else {
				check_index = group_index;
			}
		} else {
			check_index = 2;
		}
		// End grouping

		has_row = false;
		while( has_row == false ) {
			if( rows.length == check_index - 1 ) {
				// Row does not exist, create new
				rows.push( parseInt( program.dataset.end ) );
				program_row = rows.length - 1;
				has_row = true;
			} else if( rows[check_index] <= program.dataset.start ) {
				// Rows last event ends before or at the same time as this one starts
				rows[check_index] = parseInt( program.dataset.end );
				program_row = check_index;
				has_row = true;
			}
			check_index += 1;
		}

		program.style.width = 'calc( ' + width + '% - 9px )';
		program.style.minWidth = 'calc( ' + width + '% - 9px )';
		program.style.left = 'calc( ' + offset + '% + 3px )';
		program.style.top = 'calc( ' + program_row + ' * var(--kompassi-schedule-timeline-row-height) )'; // Grouping
		if( offset < 0 ) {
			program.querySelector( '.title' ).style.left = ( ( -1 * program.left ) + 6 ) + 'px';
		}

		if( grouping ) {
			prev_group = group_name;
		}
	}

	// Make the schedule high enough to contain all rows
	schedule.style.height = 'calc( var(--kompassi-schedule-timeline-row-height) * ' + ( rows.length ) + ' )';

	// Rulers
	let headers = document.createElement( 'div' );
	headers.classList.add( 'headers' );
	j = 0;
	offset = 100 / Math.ceil( kompassi_schedule.filters.date.length_hours );
	for( i = 0; i < Math.ceil( kompassi_schedule.filters.date.length_hours ); i++ ) {
		let time_label = kompassi_schedule.filters.date.start.add( i, 'hour' ).format( 'H' );
		schedule.insertAdjacentHTML( 'beforeend', '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );"></div>' );
		let hint = document.createElement( 'div' );
		hint.classList.add( 'hint', 'time_hint' );
		hint.style.left = 'calc( ' + offset + ' * ' + i + '%)';
		hint.style.width = 'calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 )';
		hint.textContent = time_label;
		headers.appendChild( hint );
		if( time_label == '0' || i == 0 ) {
			let day_label = kompassi_schedule.filters.date.start.add( j, 'day' ).format( 'LL' );
			let hint = document.createElement( 'strong' );
			hint.classList.add( 'hint', 'day_hint' );
			hint.style.top = 0;
			hint.style.left = 'calc( ' + offset + ' * ' + i + '% )';
			hint.style.zIndex = j;
			let label = document.createElement( 'span' );
			label.textContent = day_label;
			hint.appendChild( label );
			headers.appendChild( hint );
			j += 1;
		}
	}
	schedule.prepend( headers );

	// Current time indicator
	kompassi_schedule_timeline_update_time_indicator( );

	// Reset zoom
	kompassi_schedule_timeline_zoom_set( 1 );

	// Enable zooming
	schedule.dataset.scale = 1;
	var hammer = new Hammer( schedule, { touchAction: 'pan-x pan-y' } );
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
	schedule.addEventListener( 'wheel', function( event ) {
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

function kompassi_schedule_timeline_update_time_indicator( ) {
	schedule = document.getElementById( 'kompassi_schedule' );

	time_now = dayjs( );
	if( time_now >= kompassi_schedule.filters.date.start && time_now <= kompassi_schedule.filters.date.end ) {
		current_offset = time_now.diff( kompassi_schedule.filters.date.start, 'minute' );
		percentage_offset = current_offset / length * 100;

		current = document.createElement( 'div' );
		current.classList.add( 'current-time' );
		current.style.left = percentage_offset + '%';
		schedule.prepend( current );
	} else {
		indicator = schedule.querySelector( '.current-time' );
		if( indicator ) {
			indicator.remove( );
		}
	}

	kompassi_schedule.timeouts['current_time'] = setTimeout( kompassi_schedule_timeline_update_time_indicator, 60000 );
}

function kompassi_schedule_timeline_zoom( direction ) {
	schedule = document.getElementById( 'kompassi_schedule' );
   if( direction < 0 ) {
		scale = schedule.dataset.scale + 0.5;
   } else if( direction > 0 ) {
		scale = schedule.dataset.scale - 0.5;
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
	schedule = document.getElementById( 'kompassi_schedule' );
	schedule.dataset.scale = scale;
	schedule.style.width = ( scale * 100 ) + '%';
	kompassi_schedule_timeline_reposition_labels( );
}

function kompassi_schedule_timeline_pan( direction_x, direction_y, ev ) {
	// ev.pointerType == 'mouse'
	pan_speed_x = 20;
	pan_speed_y = 10;

	if( direction_x !== 0 ) {
		wrapper = document.getElementById( 'kompassi_schedule' ).querySelector( '.kompassi_schedule_wrapper' );
		wrapper.scrollLeft = wrapper.scrollLeft + ( direction_x * pan_speed_x );
		kompassi_schedule_timeline_reposition_labels( );
	}
	if( direction_y !== 0 ) {
		wrapper = window;
		wrapper.scrollTop = parseInt( wrapper.scrollTop ) + ( direction_y * pan_speed_y );
	}
}

function kompassi_schedule_timeline_reposition_labels( ) {
	// Reposition headers
	day_hints = document.querySelectorAll( '#kompassi_schedule .day_hint' );
	for( hint of day_hints ) {
		content_width = hint.querySelector( 'span' ).offsetWidth;
		scroll = hint.closest( '.kompassi_schedule_wrapper' ).scrollLeft;
		offset = hint.offsetLeft;

		if( scroll > offset ) {
			hint.style.paddingLeft = ( scroll - offset ) + 'px';
		} else {
			hint.style.paddingLeft = null;
		}
	}

	// Reposition program titles that are left of visible area
	for( program of document.querySelectorAll( '#kompassi_schedule article' ) ) {
		program_pos = parseInt( program.style.left );

		if( !isNaN( program_pos ) && program_pos < scroll ) {
			program_pad = scroll - program_pos;
			program.querySelector( '.title' ).style.marginLeft = program_pad + 'px';
			program.classList.add( 'continues' );
		} else {
			program.querySelector( '.title' ).style.marginLeft = 0;
			program.classList.remove( 'continues' );
		}
	}
}

/**
 *  Revert display layouts
 *
 */

function kompassi_schedule_revert_display_layouts( ) {
	// Timeline
	schedule = document.getElementById( 'kompassi_schedule' );
	schedule.style.height = 'auto';
	for( program of schedule.querySelectorAll( 'article' ) ) {
		program.style.width = null;
		program.style.minWidth = null;
		program.style.left = null;
		program.style.top = null;
		title = program.querySelector( '.title' );
		title.style.left = null;
		title.style.position = null;
		title.style.marginLeft = null;
	}
	elements = schedule.querySelectorAll( '.headers, .ruler, .group-name, .current-time' );
	for( el of elements ) {
		el.remove( );
	}
	clearTimeout( kompassi_schedule.timeouts['current_time'] );
}

/**
 *  Opens program modal
 *
 *  @param {Object} program jQuery object of the program number
 *
 */

function kompassi_schedule_program_modal( program ) {
	program = jQuery( program )[0]; // TODO: Get DOM element
	kompassi_close_modal( );

	let program_color = program.style.getPropertyValue( '--kompassi-program-color' );
	let program_icon = program.style.getPropertyValue( '--kompassi-program-icon' );

	let styles = '';
	if( program_color ) {
		styles += '--kompassi-program-color: ' + program_color + '; ';
	}
	if( program_icon ) {
		styles += '--kompassi-program-icon: ' + program_icon + '; ';
	}

	let actions = program.querySelector( '.actions' ).cloneNode( true );
	let favorite = program.querySelector( '.favorite' ).cloneNode( true );
	actions.prepend( favorite );

	options = {
		attrs: {
			'class': program.className,
			'data-id': program.dataset.id,
			'style': styles,
		},
		title: program.querySelector( '.title' ).textContent,
		actions: actions.innerHTML,
		content: program.querySelector( '.main' ).innerHTML,
		footer: program.querySelector( '.meta' ).innerHTML,
	}
	kompassi_show_modal( options );

	// Swipe
	let hammer_modal = new Hammer( document.getElementById( 'kompassi_modal' ), { touchAction: 'swipe' } );
	hammer_modal.on( 'swipe', function( ev ) {
		let modal = document.getElementById( 'kompassi_modal' );
		current_prog = modal.dataset.id;

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
		rest_route: 'kompassi-integration/v1/docs/schedule_help/' + kompassi_schedule_options.locale,
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
	let favorites = [];
	let titles = [];

	let favorite_programs = document.querySelectorAll( '#kompassi_schedule article.is-favorite' );
	for( let program of favorite_programs ) {
		favorites.push( program.dataset.id );
		titles.push( program.querySelector( '.title' ).textContent );
	}
	let cur = String( window.location );
	let export_link = cur.split( '#' )[0] + '#favorite:' + favorites.join( ',' );
	let markup = '<p>';
	markup += __( 'Create an import link to export your favorites to another device.', 'kompassi-integration' ) + ' ';
	markup += __( 'Favorites to be exported:', 'kompassi-integration' );
	markup += '</p>';
	markup += '<ul class="program-title-list">';
	for( let title of titles ) {
		markup += '<li>' + title + '</li>';
	}
	markup += '</ul>';
	let actions = '<a onClick="kompassi_href_to_clipboard(event,this);" href="' + export_link + '">' + __( 'Copy import link to clipboard', 'kompassi-integration' ) + '</a>';
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
	let schedule = document.getElementById( 'kompassi_block_schedule' );

	if( schedule.dataset.display != 'timeline' ) {
		return;
	}

	let wrapper = schedule.querySelector( '.kompassi_schedule_wrapper' );
	let headers = schedule.querySelector( '.headers' );

	let schedule_top = schedule.offsetTop + wrapper.offsetTop;
	let schedule_bottom = schedule_top + wrapper.scrollHeight;
	let scroll = window.scrollY;
	let buffer = headers.offsetHeight;

	if( scroll > schedule_top + buffer && scroll < schedule_bottom - buffer ) {
		headers.classList.add( 'sticky' );
		headers.style.top = scroll - schedule_top;
	} else {
		headers.classList.remove( 'sticky' );
		headers.style.top = 0;
	}
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
	let opts = [];

	// If program modal is open, show prog
	let modal = document.getElementById( 'kompassi_modal' );
	if( modal && modal.classList.contains( 'kompassi-program' ) ) {
		opts.push( 'prog:' + modal.dataset.id );
	}

	let block = document.getElementById( 'kompassi_block_schedule' );
	// Date
	let date_filter = block.querySelector( '.date-toggle.active' );
	if( date_filter ) {
		opts.push( 'date:' + date_filter.dataset.date );
	}

	// Favorites
	let favorites = document.querySelector( '.favorites-toggle' );
	if( favorites && favorites.classList.contains( 'active' ) ) {
		opts.push( 'favorites:1' );
	}

	// Filters
	let filters = block.querySelectorAll( '#kompassi_schedule_filters .filter' );
	for( let filter of filters ) {
		let opt_name = filter.dataset.filter;
		if( filter.tagName == 'SELECT' ) {
			if( filter.value.length > 0 ) {
				opts.push( opt_name + ':' + filter.value );
			}
		} else if( filter.tagName == 'INPUT' ) {
			if( filter.value ) {
				opts.push( opt_name + ':' + filter.value );
			}
		}
	}

	// Display
	opts.push( 'display:' + document.getElementById( 'kompassi_schedule' ).dataset.display );

	return opts;
}

/**
 *  Updates the URL hash based on selected options
 *
 */

function kompassi_schedule_update_url_hash( ) {
	let opts = kompassi_schedule_collect_url_hash( );
	kompassi_set_url_options( opts );
}

/**
 *  Sorting function to sort program by group (and alphabetically inside groups)
 *
 */

function kompassi_schedule_sort_by_group( a, b ) {
	if( kompassi_schedule_options.timeline_grouping.length > 0 ) {
		let a_text = a.querySelector( '.' + kompassi_schedule_options.timeline_grouping ).textContent;
		let b_text = b.querySelector( '.' + kompassi_schedule_options.timeline_grouping ).textContent;
		if( a_text > b_text ) {
			return 1;
		} else if( a_text < b_text ) {
			return -1;
		}
	}

	if( a.dataset.start > b.dataset.start ) {
		return 1;
	}

	return -1;
}
