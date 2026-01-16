var __ = wp.i18n.__;
var _x = wp.i18n._x;
var _n = wp.i18n._n;
var sprintf = wp.i18n.sprintf;

let kompassi_schedule = {
	'event': {},
	'filters': {},
	'timeouts': {},
	'init': true,
};

dayjs.locale( kompassi_schedule_options.locale );

wp.hooks.addFilter( 'kompassi_init_storage', 'kompassi_schedule', function( storage ) {
	storage['favorites'] = [];
	return storage;
} );

document.addEventListener( 'DOMContentLoaded', function( event ) {
	/*
	 *  Get date/time related information about program
	 *  - Earliest starting time for program
	 *  - Latest ending time for program
	 *  - List of dates the program spans through
	 *
	 */

	let schedule = document.getElementById( 'kompassi_schedule' );
 	dayjs.tz.setDefault( schedule.dataset.timezone );

	kompassi_schedule.event.start = dayjs( schedule.dataset.start );
	kompassi_schedule.event.end = dayjs( schedule.dataset.end );

	//  Always start and end with even hours
	if( kompassi_schedule.event.start.tz( schedule.dataset.timezone ).minute( ) != 0 ) {
		kompassi_schedule.event.start = kompassi_schedule.event.start.tz( schedule.dataset.timezone ).startOf( 'hour' );
	}
	if( kompassi_schedule.event.end.minute( ) != 0 ) {
		kompassi_schedule.event.end = kompassi_schedule.event.end.add( 1, 'hour' ).startOf( 'hour' );
	}

	/** **/
	kompassi_schedule_init( );
	kompassi_schedule_get_favorites_from_storage( );

	//  Apply options from block options or URL
	let block = document.getElementById( 'kompassi_block_schedule' );
	let block_options = JSON.parse( block.dataset.wpContext );
	let filters = { ...kompassi_get_options( block_options.defaultFilters ), ...kompassi_get_url_options( ) };
	kompassi_schedule_update_filters_from_options( filters );

} );

/**
 *  Reset init state when navigating with back/forwards
 *
 */

window.addEventListener( 'popstate', function( event ) {
	kompassi_schedule.init = true;
	event.preventDefault( );
} );

/**
 *  Initializes the schedule markup
 *
 */

function kompassi_schedule_init( ) {
	let block = document.getElementById( 'kompassi_block_schedule' );
	let block_options = JSON.parse( block.dataset.wpContext );
	let schedule = document.getElementById( 'kompassi_schedule' );

	//  MARKUP

	//  Container for notes
	let notes = document.createElement( 'section' );
	notes.id = 'kompassi_schedule_notes';
	notes.classList.add( 'kompassi-notes' );
	if( !block_options.showToolbar ) {
		notes.style.display = 'none';
	}
	block.prepend( notes );

	//  Schedule toolbar
	kompassi_schedule_init_toolbar( block_options.showToolbar );

	//  Add favorite action and order to each article
	let programs = schedule.querySelectorAll( 'article' );
	let order = 1;
	for( let program of programs ) {
		let title = program.querySelector( '.title' );
		title.insertAdjacentHTML( 'afterend', '<a class="favorite kompassi-icon-favorite" title="' + _x( 'Favorite', 'button label', 'kompassi-integration' ) + '"/>' );
		program.dataset.order = order;
		order += 1;
	}

	//  When background matches the underlying 1:1, switch the --kompassi-bg color to an alternative
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
		if( schedule.dataset.display != 'timeline' && schedule.dataset.display != 'timetable' ) {
			return;
		}

		let program = event.target.closest( 'article' );

		if( !program ) {
			return;
		}

		clearTimeout( kompassi_schedule.timeouts['popover'] );

		let options = {
			title: program.querySelector( '.title' ).textContent,
			content: program.querySelector( '.times' ).innerHTML
		}
		kompassi_schedule.timeouts['popover'] = setTimeout( kompassi_popover, 300, options, event, program );
	} );

	schedule.addEventListener( 'mouseout', function( event ) {
		clearTimeout( kompassi_schedule.timeouts['popover'] );
		let program = event.target.closest( 'article' );
		let popover = document.getElementById( 'kompassi_popover' );
		if( program && popover ) {
			popover.remove( );
		}
	} );

	//  Events (click): Modal
	schedule.addEventListener( 'click', function( event ) {
		// If shift key is pressed and we are not on timeline, open the details inline
		if( kompassi_common.shift_pressed && 'timeline' != schedule.dataset.display ) {
			return;
		}

		// Clicking a link, open
		if( event.target.tagName == 'A' && !event.target.classList.contains( 'favorite' ) ) {
			return;
		}

		event.preventDefault( );

		// Favorite
		if( event.target.classList.contains( 'favorite' ) ) {
			return;
		}

		// Open modal
		let program = event.target.closest( 'article.kompassi-program' );
		if( program ) {
			kompassi_schedule_program_modal( program );
		}
	} );

	//  Events (keyup): Modal navigation
	document.body.addEventListener( 'keyup', function( event ) {
		let modal = document.getElementById( 'kompassi_modal' );
		if( !modal || !modal.classList.contains( 'kompassi-program' ) ) {
			return;
		}

		let current_program = modal.dataset.id;
		let open_program = false;

		if( event.keyCode == 37 ) {
			open_program = kompassi_schedule_get_next_visible_program( current_program, -1 );
		} else if( event.keyCode == 39 ) {
			open_program = kompassi_schedule_get_next_visible_program( current_program );
		}

		if( open_program ) {
			kompassi_schedule_program_modal( open_program );
		}
	} );

	//  Events (click, keyup): Close modal
	document.body.addEventListener( 'click', function( event ) {
		if( event.target.id == 'kompassi_modal_underlay' ||
			( event.target.classList.contains( 'close' ) && event.target.closest( '#kompassi_modal' ) ) ) {
			kompassi_close_modal( );
			kompassi_schedule_update_url_hash( );
			kompassi_schedule.modal_hammer.destroy( );
			}
	} );
	document.body.addEventListener( 'keyup', function( event ) {
		if( event.keyCode == 27 ) {
			kompassi_close_modal( );
			kompassi_schedule_update_url_hash( );
			kompassi_schedule.modal_hammer.destroy( );
		}
	} );

	//  Events (scroll): Sticky header for timeline
	window.addEventListener( 'scroll', kompassi_schedule_timeline_sticky_header );

	//  Events (popstate): Refresh view on back/forward/history
	window.addEventListener( 'popstate', function( event ) {
		kompassi_schedule_update_filters_from_options( kompassi_get_url_options( ) );
	} );

	//  Events (click): Jump to -links
	document.body.addEventListener( 'click', function( ) {
		if( event.target.classList.contains( 'kompassi-jump-to' ) ) {
			let target = event.target.getAttribute( 'href' ).split( '#' );
			document.getElementById( target[target.length - 1] ).scrollIntoView( );
			event.preventDefault( );
		}
	} );

	//  Events (click): Import
	document.body.addEventListener( 'click', function( event ) {
		if( event.target.tagName != 'A' || !event.target.closest( '.kompassi-schedule-import' ) ) {
			return;
		}

		let url_options = kompassi_get_url_options( );

		let favorites_updated = false;
		if( event.target.classList.contains( 'replace' ) ) {
			kompassi_storage.favorites = url_options.favorite.split( ',' );
			favorites_updated = true;
		}
		if( event.target.classList.contains( 'append' ) ) {
			let old_favorites = kompassi_storage.favorites;
			let new_favorites = url_options.favorite.split( ',' );
			new_favorites.filter( function( item ) {
				return old_favorites.indexOf( item );
			} );
			let merged_favorites = old_favorites.concat( new_favorites );
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

	//  Events (click): Related links
	document.body.addEventListener( 'click', function( event ) {
		if( event.target.classList.contains( 'related-link' ) ) {
			if( event.target.getAttribute( 'href' ).length > 0 ) {
				kompassi_schedule_program_modal( event.target.getAttribute( 'href' ) );
			}
			event.preventDefault( );
		}
	} );
}

/**
 *  Initializes the schedule toolbar
 *
 */

function kompassi_schedule_init_toolbar( is_enabled ) {
	let block = document.getElementById( 'kompassi_block_schedule' );
	let toolbar = document.createElement( 'section' );
	if( !is_enabled ) {
		toolbar.style.display = 'none';
	}
	toolbar.id = 'kompassi_schedule_toolbar';
	block.prepend( toolbar );

	/*  Date filter  */
	let date_toggles = document.createElement( 'section' );
	date_toggles.id = 'kompassi_schedule_dates';
	date_toggles.classList.add( 'kompassi-button-group' );

	//  Only show "Now" during event
	let now = dayjs( );
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
			activated_toggle.classList.remove( 'active' );
		} else {
			let toggles = activated_toggle.closest( 'section' ).querySelectorAll( '.date-toggle' );
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
	let filtering = document.createElement( 'section' );
	filtering.id = 'kompassi_schedule_filtering';
	filtering.classList.add( 'kompassi-button-group', 'has-icon-and-label' );
	let favorites_toggle = document.createElement( 'a' );
	favorites_toggle.classList.add( 'favorites-toggle', 'kompassi-icon-favorite' );
	favorites_toggle.textContent = __( 'Favorites', 'kompassi-integration' );
	filtering.append( favorites_toggle );
	let filters_toggle = document.createElement( 'a' );
	filters_toggle.classList.add( 'filters-toggle', 'kompassi-icon-filter' );
	filters_toggle.textContent = _x( 'Filter', 'verb (shown before filters)', 'kompassi-integration' );
	let filters_indicator = document.createElement( 'span' );
	filters_indicator.classList.add( 'kompassi-indicator' );
	filters_toggle.append( filters_indicator );
	filtering.append( filters_toggle );
	toolbar.append( filtering );

	favorites_toggle.addEventListener( 'click', function( event ) {
		event.target.classList.toggle( 'active' );
		kompassi_schedule_apply_filters( );
	} );

	filters_toggle.addEventListener( 'click', function( event ) {
		event.target.classList.toggle( 'active' );
		let filter_popup = document.getElementById( 'kompassi_schedule_filters' );
		filter_popup.classList.toggle( 'visible' );
	} );

	/*  Dropdown menu  */
	let dropdown_items = { };
	// Legend modal
	let legend_modal_data = kompassi_schedule_get_legend_modal_data( );
	if( legend_modal_data.length > 0 ) {
		dropdown_items['legend'] = {
			label: __( 'Legend', 'kompassi-integration' ),
			callback: function( ) {
				let content = '<dl class="dimension-colors">';
				for( let row of kompassi_schedule_get_legend_modal_data( ) ) {
					content += row;
				}
				content += '</dl>';

				let options = {
					title: __( 'Legend', 'kompassi-integration' ),
					content: content,
					attrs: {
						class: 'kompassi-legend'
					}
				}
				kompassi_show_modal( options );
			}
		}
	}
	// Help modal
	dropdown_items['help'] = { label: __( 'Help', 'kompassi-integration' ), callback: kompassi_schedule_help_modal };
	// Export modal
	dropdown_items['export'] = { label: __( 'Export Favorites', 'kompassi-integration' ), callback: kompassi_schedule_export_modal };
	wp.hooks.applyFilters( 'kompassi_schedule_dropdown_menu_items', dropdown_items );
	let dropdown = kompassi_dropdown_menu( dropdown_items, { id: 'kompassi_schedule_menu' } );
	toolbar.append( dropdown );

	/*  Filter popup  */
	let filter_popup = document.createElement( 'section' );
	filter_popup.id = 'kompassi_schedule_filters';
	if( !is_enabled ) {
		filter_popup.style.display = 'none';
	}

	//  Text filter
	let text_filter = document.createElement( 'input' );
	text_filter.classList.add( 'filter', 'filter-text' );
	text_filter.name = 'filter_text';
	text_filter.dataset.filter = 'text';
	text_filter.placeholder = __( 'Text...', 'kompassi-integration' );
	let text_filter_wrapper = document.createElement( 'div' );
	text_filter_wrapper.classList.add( 'input' );
	text_filter_wrapper.append( text_filter );
	filter_popup.append( text_filter_wrapper );

	//  Dimension filters
	for( let dimension of kompassi_schedule_dimensions ) {
		if( dimension.isListFilter == false || dimension.slug == 'state' ) {
			continue;
		}
		if( kompassi_schedule_options.hidden_dimensions.indexOf( dimension.slug ) > -1 ) {
			continue;
		}
		if( dimension.values.length == 0 ) {
			continue;
		}

		let dropdown_options = {
			slug: dimension.slug,
			label: dimension.title,
			values: dimension.values,
			classes: [ 'filter', 'filter-dimension' ],
			dataset: { dimension: dimension.slug, filter: dimension.slug }
		};

		if( dimension.isNegativeSelection ) {
			dropdown_options.classes.push( 'flag-negative' );
			dropdown_options.description = __( 'Program matching selection will be hidden from results.', 'kompassi-integration' );
		}

		filter_popup.append( kompassi_dropdown( dropdown_options ) );
	}
	// Divide into an ideal columns amount
	let ideal_columns_amount = kompassi_schedule_get_ideal_filter_columns_amount( filter_popup.children.length );
	if( ideal_columns_amount != 4 ) {
		filter_popup.style.setProperty( '--kompassi-schedule-filters-columns', ideal_columns_amount );
	}

	// Clear filters
	let clear_toggle = document.createElement( 'a' );
	clear_toggle.classList.add( 'clear-filters', 'kompassi-icon-clear-filters' );
	clear_toggle.title = __( 'Clear filters', 'kompassi-integration' );

	clear_toggle.addEventListener( 'click', function( event ) {
		let filters = filter_popup.querySelectorAll( '.filter' );
		for( let filter of filters ) {
			if( filter.classList.contains( 'kompassi-dropdown' ) ) {
				let options = filter.querySelectorAll( 'input' );
				for( let option of options ) {
					option.checked = false;
				}
				// Refresh dropdown button
				let change_event = new Event( 'change', { view: window, bubbles: true, cancelable: true } );
				options[0].dispatchEvent( change_event );
			} else if( filter.classList.contains( 'filter-text' ) ) {
				filter.value = null;
			}
		}
		kompassi_schedule_apply_filters( );
	} );

	filter_popup.append( clear_toggle );

	//  Show filters
	block.insertBefore( filter_popup, document.getElementById( 'kompassi_schedule_notes' ) );

	//  Handle filtering
	filter_popup.addEventListener( 'change', function( event ) {
		if( event.target.closest( 'div' ).classList.contains( 'kompassi-dropdown' ) ) {
			kompassi_schedule_apply_filters( );
		}
	} );
	filter_popup.addEventListener( 'keyup', function( event ) {
		clearTimeout( kompassi_schedule.timeouts['text-filter'] );
		kompassi_schedule.timeouts['text-filter'] = setTimeout( kompassi_schedule_apply_filters, 300 );
	} );

	/*  Display styles  */
	let display_styles = {
		'list': _x( 'List', 'display style', 'kompassi-integration' ),
		'timeline': _x( 'Timeline', 'display style', 'kompassi-integration' ),
		'timetable': _x( 'Timetable', 'display style', 'kompassi-integration' ),
	};
	let display = document.createElement( 'section' );
	display.id = 'kompassi_schedule_display';
	display.classList.add( 'kompassi-button-group', 'has-icon-and-label' );
	for( let style in display_styles ) {
		let toggle = document.createElement( 'a' );
		toggle.classList.add( 'kompassi-icon-' + style );
		toggle.dataset.display = style;
		toggle.textContent = display_styles[style];
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
			}
			kompassi_schedule_setup_display( event.target.dataset.display );
			kompassi_schedule_update_url_hash( );
		} );
	}
	toolbar.append( display );

	return toolbar;
}

/**
 *  Gets favorite programs from localStorage
 *
 */

function kompassi_schedule_get_favorites_from_storage( ) {
	for( let program of kompassi_storage.favorites ) {
		if( document.getElementById( program ) ) {
			document.getElementById( program ).classList.add( 'is-favorite' );
		}
	};
}

/**
 *  Toggles the favorite filter
 *
 */

function kompassi_schedule_toggle_favorite( element ) {
	let program = element.closest( '.kompassi-program' ).dataset.id;
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
	let filters_set = false;

	// Import
	if( opts.favorite ) {
		kompassi_schedule_import_modal( opts.favorite );
		return;
	}

	// Filters
	let filters = document.querySelectorAll( '#kompassi_schedule_filters .filter' );
	for( let filter of filters ) {
		let filter_name = filter.dataset.filter;
		if( filter.tagName == 'DIV' && filter.classList.contains( 'filter-dimension' ) ) {
			let options = filter.querySelectorAll( 'input' );
			if( opts[filter_name] ) {
				for( let option of options ) {
					if( opts[filter_name].includes( option.value ) ) {
						option.checked = true;
						filters_set = true;
					} else {
						option.checked = false;
					}
				}
			} else {
				for( let option of options ) {
					option.checked = false;
				}
			}
			// Refresh dropdown button
			let change_event = new Event( 'change', { view: window, bubbles: true, cancelable: true } );
			options[0].dispatchEvent( change_event );
		} else if( filter.tagName == 'INPUT' ) {
			if( opts[filter_name] ) {
				filter.value = decodeURIComponent( opts[filter_name] );
				filters_set = true;
			} else {
				filter.value = null;
			}
		}
	}

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
		let program = document.getElementById( opts.prog );
		if( program ) {
			kompassi_schedule_program_modal( program );
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

	kompassi_schedule.init = false;

	// Apply filters
	kompassi_schedule_apply_filters( );
}

/**
 *  Shows visible program count
 *
 */

function kompassi_schedule_update_program_count( ) {
	let note = document.querySelector( '#kompassi_schedule_notes .program-count' );
	if( note ) {
		note.remove( );
	}
	let program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
	if( kompassi_schedule.filters.enabled > 0 ) {
		let notes = document.getElementById( 'kompassi_schedule_notes' );
		if( program_count > 0 ) {
			// translators: count of programs visible
			let program_count_label = sprintf( _n( '%s program visible.', '%s programs visible.', program_count, 'kompassi-integration' ), program_count );
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
	let schedule = document.getElementById( 'kompassi_schedule' );
	schedule.classList.remove( 'now' );

	kompassi_schedule.filters.date = { };
	let date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
	if( date_filter ) {
		// Date selected
		if( date_filter.dataset.date == 'now' ) {
			// TODO: Allow user to select how much program to show?
			let now_view_length = 2;
			kompassi_schedule.filters.date.start = dayjs( );
			kompassi_schedule.filters.date.end = kompassi_schedule.filters.date.start.add( now_view_length, 'hour' );
			kompassi_schedule.filters.date.length_hours = now_view_length;

			//
			schedule.classList.add( 'now' );
		} else {
			let date = dayjs( dayjs( date_filter.dataset.date ).tz( schedule.dataset.timezone, true ).toISOString( ) );

			let start_of_day = parseInt( kompassi_schedule_options.start_of_day );
			let end_of_day = parseInt( kompassi_schedule_options.end_of_day );
			if( isNaN( start_of_day ) ) { start_of_day = 0; }
			if( isNaN( end_of_day ) ) { end_of_day = 0; }

			// Calculate Start of Day
			kompassi_schedule.filters.date.start = date.tz( schedule.dataset.timezone ).set( 'hour', start_of_day );
			if( kompassi_schedule.filters.date.start < kompassi_schedule.event.start ) {
				kompassi_schedule.filters.date.start = kompassi_schedule.event.start;
				start_of_day = kompassi_schedule.filters.date.start.tz( schedule.dataset.timezone ).get( 'hour' );
			}

			// Calculate Length of Day
			// TODO: This returns wrong values if timezone is not the same as event timezone
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
		let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
		if( kompassi_schedule.filters.enabled > 0 && programs_visible ) {
			let starts = [];
			let ends = [];

			for( let program of programs_visible ) {
				starts.push( dayjs( program.dataset.start ) );
				ends.push( dayjs( program.dataset.end ) );
			}
			kompassi_schedule.filters.date.start = dayjs( Math.min( ...starts ) );
			kompassi_schedule.filters.date.end = dayjs( Math.max( ...ends ) );
		}
	}

	// Always start and end on whole hours
	kompassi_schedule.filters.date.start = kompassi_schedule.filters.date.start.tz( schedule.dataset.timezone ).startOf( 'hour' );
	kompassi_schedule.filters.date.end = kompassi_schedule.filters.date.end.tz( schedule.dataset.timezone ).add( 1, 'hour' ).startOf( 'hour' );
	kompassi_schedule.filters.date.length_hours = kompassi_schedule.filters.date.end.diff( kompassi_schedule.filters.date.start, 'hour' );
}

/**
 *  Applies filters to program listing
 *
 */

function kompassi_schedule_apply_filters( ) {
	if( kompassi_schedule.init ) {
		return;
	}

	let block = document.getElementById( 'kompassi_block_schedule' );
	let block_options = JSON.parse( block.dataset.wpContext );
	let schedule = document.getElementById( 'kompassi_schedule' );

	//  Show all and remove notification if exists
	let programs = document.getElementById( 'kompassi_schedule' ).querySelectorAll( 'article' );
	for( let program of programs ) {
		program.classList.remove( 'filtered', 'continues' );
	}
	// TODO: Do these on setup_display?
	let filter_notes = document.querySelectorAll( '#kompassi_schedule_notes .filter' );
	for( let note of filter_notes ) {
		note.remove( );
	}
	let continuing = document.getElementById( 'kompassi_programs_continuing' );
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
			let selected = filter.querySelectorAll( 'input:checked' );
			if( selected.length > 0 ) {
				let filter_dimension = filter.dataset.dimension;
				let filter_values = [];
				for( let sel of selected ) {
					filter_values.push( sel.value );
				}

				let programs = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
				for( let program of programs ) {
					let match = false;

					if( program.hasAttribute( 'data-' + filter_dimension ) ) {
						let program_dimensions = program.getAttribute( 'data-' + filter_dimension ).split( ',' );
						let dimension_match = false;
						for( let dimension of program_dimensions ) {
							if( filter_values.includes( dimension ) ) {
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
		}

		// Text filter
		if( filter.classList.contains( 'filter-text' ) ) {
			if( filter.value !== '' ) {
				let words = filter.value.toLowerCase( ).split( ' ' ).filter( function( el ) { return el.length > 0; } ); // words to look for

				let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
				for( let program of programs_visible ) {
					let program_relevance = 0;
					let word_matches = {};
					for( let target in kompassi_schedule_options.search_targets ) {
						let element = program.getElementsByClassName( target )[0];
						if( element ) {
							text = element.textContent.toLowerCase( );
							for( let word of words ) {
								if( text.includes( word ) ) {
									program_relevance += kompassi_schedule_options.search_targets[target];
									word_matches[word] = true;
								}
							}
						}
					}
					if( program_relevance > 0 && Object.keys(word_matches).length == words.length ) {
						program.style.order = ( -1 * program_relevance );
					} else {
						program.classList.add( 'filtered' );
					}
				}
				filter_count += 1;
			} else {
				let programs = document.getElementById( 'kompassi_schedule' ).querySelectorAll( 'article' );
				for( let program of programs ) {
					program.style.order = program.dataset.order;
				}
			}
		}
	}

	// Show how many filters from the dropdown area are activated
	if( block_options.showToolbar ) {
		if( filter_count > 0 ) {
			document.querySelector( '#kompassi_block_schedule .filters-toggle .kompassi-indicator' ).textContent = filter_count;
		} else {
			document.querySelector( '#kompassi_block_schedule .filters-toggle .kompassi-indicator' ).textContent = '';
		}
	}

	kompassi_schedule.filters.enabled = filter_count;

	// Favorite filter
	// TODO: Favorite filter might be enabled from block options
	if( block_options.showToolbar ) {
		if( document.querySelector( '#kompassi_block_schedule .favorites-toggle' ).classList.contains( 'active' ) ) {
			let not_favorite_programs = document.querySelectorAll( '#kompassi_schedule article:not(.is-favorite)' );
			for( let program of not_favorite_programs ) {
				program.classList.add( 'filtered' );
			}
			kompassi_schedule.filters.enabled += 1;
		}
	}

	// Date filter
	kompassi_schedule_update_date_view_parameters( );

	let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
	for( let program of programs_visible ) {
		let program_start = dayjs( program.dataset.start );
		let program_end = dayjs( program.dataset.end );
		if( program_start > kompassi_schedule.filters.date.end || program_end <= kompassi_schedule.filters.date.start ) {
			program.classList.add( 'filtered' );
		}
		if( program_start < kompassi_schedule.filters.date.start && program_end > kompassi_schedule.filters.date.start ) {
			// TODO: When on "Now" view, all programs that started before this exact minute should be "continues"!
			program.classList.add( 'continues' );
		}
	}

	// If there is no text search and there is a date search, and there is programs that have started before the filtered timerange, show notification
	// TODO: Timetable?
	let date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
	if( date_filter ) {
		if( kompassi_schedule_options.start_of_day != 0 || kompassi_schedule_options.end_of_day != 0 ) {
			// Do not show message on "Now" view
			if( date_filter.dataset.date != 'now' ) {
				let program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
				if( program_count > 0 ) {
					let notes = document.getElementById( 'kompassi_schedule_notes' );
					// translators: start of day hour, end of day hour
					notes.insertAdjacentHTML( 'beforeend', '<span class="filter programs-between display-only-list">' + sprintf( __( 'Showing programs starting between %1$s and %2$s.', 'kompassi-integration' ), kompassi_schedule_options.start_of_day, kompassi_schedule_options.end_of_day ) + '</span>' );
				}
			}
		}
		// Show note about the Start/End of Day times
		let text_filter = document.querySelector( '#kompassi_schedule_filters [name="filter_text"]' );
		let continuing = document.querySelectorAll( '#kompassi_schedule article.continues' );
		if( text_filter.value.length < 1 && continuing.length > 0 ) {
			let count = document.querySelectorAll( '#kompassi_schedule article.continues:not(.filtered)' ).length;
			let notes = document.getElementById( 'kompassi_schedule_notes' );
			if( schedule.dataset.display == 'list' ) {
				// translators: amount of repositioned events
				notes.insertAdjacentHTML( 'beforeend', '<span class="filter programs-continuing display-only-list"><a class="kompassi-jump-to" href="#kompassi_programs_continuing">' + sprintf( _n( 'Show %d program that started earlier', 'Show %d programs that started earlier', count, 'kompassi-integration' ), count ) + '</a></span>' );
				let first_continuing = document.querySelector( '#kompassi_schedule article.continues' );
				first_continuing.insertAdjacentHTML( 'beforebegin', '<h3 id="kompassi_programs_continuing">' + __( 'Programs continuing', 'kompassi-integration' ) + '</h3>' );
			}
		}
	}

	//
	if( block_options.showToolbar ) {
		let filter_popup = document.getElementById( 'kompassi_schedule_filters' );
		if( kompassi_schedule.filters.enabled > 0 ) {
			filter_popup.classList.add( 'has-filters-enabled' );
		} else {
			filter_popup.classList.remove( 'has-filters-enabled' );
		}
	}

	kompassi_schedule_setup_display( );
	kompassi_schedule_update_url_hash( );
}

//
//  DISPLAY STYLES
//

/*
 *  Setup display
 *
 */

function kompassi_schedule_setup_display( display = false ) {
	let display_type;
	let schedule = document.getElementById( 'kompassi_schedule' );
	let previous_display_type = schedule.dataset.display;

	if( display ) {
		display_type = display;
		schedule.dataset.display = display_type;
	} else {
		display_type = schedule.dataset.display;
	}

	//  Refresh display layout
	wp.hooks.doAction( 'kompassi_schedule_revert_' + previous_display_type + '_layout' );
	wp.hooks.doAction( 'kompassi_schedule_setup_' + display_type + '_layout' );

	//  Hide/show relevant notes
	let notes = document.getElementById( 'kompassi_schedule_notes' );
	let hide = notes.querySelectorAll( '.display-not-' + display_type );
	let show = notes.querySelectorAll( '[class*="display-only"]' );
	for( let note of hide ) {
		note.style.display = 'none';
	}
	for( let note of show ) {
		if( !note.classList.contains( 'display-only-' + display_type ) ) {
			note.style.display = 'none';
		}
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
 *  TIMELINE
 *
 */

/**
 *  Sets up timeline display layout
 *
 */

wp.hooks.addAction( 'kompassi_schedule_setup_timeline_layout', 'kompassi_integration_schedule', function( ) {
	let block = document.getElementById( 'kompassi_block_schedule' );
	let block_options = JSON.parse( block.dataset.wpContext );

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
	programs = [...programs].sort( kompassi_schedule_create_sort_function_to_sort_by_dimension( block_options.timelineGrouping ) );

	for( let program of programs ) {
		// Count the width % and offset % for program
		let width = program.dataset.length / length * 100;
		let start = dayjs( program.dataset.start ).tz( schedule.dataset.timezone );
		let offset_min = start.diff( kompassi_schedule.filters.date.start, 'minute' );
		let offset = offset_min / length * 100;
		let grouping = false;
		let has_row = false;
		let program_row;

		// See if we need to add a group heading
		if( block_options.timelineGrouping.length > 0 && kompassi_schedule_dimensions.some( e => e.slug == block_options.timelineGrouping ) ) {
			grouping = block_options.timelineGrouping;
		}

		if( grouping ) {
			let current_program_grouping = program.querySelector( '.' + grouping );
			if( !current_program_grouping ) {
				group_name = __( 'Ungrouped', 'kompassi-integration' );
				group_name = false;
			} else {
				// TODO: Currently, we pick the first dimension value
				// This might not always be the "correct" one to choose
				group_name = program.querySelector( '.dimension.' + grouping + ' > :first-child' ).textContent;
			}
			if( group_name != prev_group && group_name != false ) {
				check_index = rows.push( 'group: ' + group_name );
				group_index = check_index;
				let group = document.createElement( 'p' );
				group.classList.add( 'group-name' );
				group.style.top = 'calc( ' + ( rows.length - 1 ) + ' * var(--kompassi-schedule-timeline-row-height)';
				// TODO: Case: All items have no grouping value or have multiple
				group.innerHTML = group_name;
				schedule.append( group );
			} else {
				check_index = group_index;
			}
		} else {
			check_index = 2;
		}
		// End grouping

		while( has_row == false ) {
			if( rows.length == check_index - 1 ) {
				// Row does not exist, create new
				rows.push( dayjs( program.dataset.end ) );
				program_row = rows.length - 1;
				has_row = true;
			} else if( rows[check_index] <= dayjs( program.dataset.start ) ) {
				// Rows last event ends before or at the same time as this one starts
				rows[check_index] = dayjs( program.dataset.end );
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
			// TODO
			let program_styles = window.getComputedStyle( program );
			let title = program.querySelector( '.title' );
			title.style.left = ( -1 * parseFloat( program_styles.left ) ) + 'px';
			title.style.position = 'relative';
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
	let days = 0;
	let offset = 100 / Math.ceil( kompassi_schedule.filters.date.length_hours );
	for( let hours = 0; hours < Math.ceil( kompassi_schedule.filters.date.length_hours ); hours++ ) {
		let time_label = kompassi_schedule.filters.date.start.add( hours, 'hour' ).tz( schedule.dataset.timezone ).format( 'H' );
		schedule.insertAdjacentHTML( 'beforeend', '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + hours + '% ); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );"></div>' );
		let hint = document.createElement( 'div' );
		hint.classList.add( 'hint', 'time_hint' );
		hint.style.left = 'calc( ' + offset + ' * ' + hours + '%)';
		hint.textContent = time_label;
		headers.appendChild( hint );
		if( time_label == '0' || hours == 0 ) {
			let day_label = kompassi_schedule.filters.date.start.add( days, 'day' ).tz( schedule.dataset.timezone ).format( 'LL' );
			let hint = document.createElement( 'strong' );
			hint.classList.add( 'hint', 'day_hint' );
			hint.style.top = 0;
			hint.style.left = 'calc( ' + offset + ' * ' + hours + '% )';
			hint.style.zIndex = days;
			let label = document.createElement( 'span' );
			label.textContent = day_label;
			hint.appendChild( label );
			headers.appendChild( hint );
			days += 1;
		}
	}
	schedule.prepend( headers );

	// Current time indicator
	kompassi_schedule_timeline_update_time_indicator( );

	// Reset zoom
	kompassi_schedule_timeline_zoom_set( 1 );

	// Enable zooming
	schedule.dataset.scale = 1;
	kompassi_schedule.timeline_hammer = new Hammer( schedule, { touchAction: 'pan-x pan-y' } );
	kompassi_schedule.timeline_hammer.get( 'pinch' ).set( { enable: true } );
	kompassi_schedule.timeline_hammer.get( 'pan' ).set( { direction: Hammer.DIRECTION_ALL } );

	// Zoom (pinch)
	kompassi_schedule.timeline_hammer.on( 'pinch', function( ev ) {
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
	kompassi_schedule.timeline_hammer.on( 'pan', function( ev ) {
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
} );

function kompassi_schedule_timeline_update_time_indicator( ) { /* TODO: Not working? */
	let schedule = document.getElementById( 'kompassi_schedule' );

	let now = dayjs( );
	if( now >= kompassi_schedule.filters.date.start && now <= kompassi_schedule.filters.date.end ) {
		let current_offset = now.diff( kompassi_schedule.filters.date.start, 'minute' );
		let percentage_offset = current_offset / length * 100;

		let current = document.createElement( 'div' );
		current.classList.add( 'current-time' );
		current.style.left = percentage_offset + '%';
		schedule.prepend( current );
	} else {
		let indicator = schedule.querySelector( '.current-time' );
		if( indicator ) {
			indicator.remove( );
		}
	}

	kompassi_schedule.timeouts['current_time'] = setTimeout( kompassi_schedule_timeline_update_time_indicator, 60000 );
}

function kompassi_schedule_timeline_zoom( direction ) {
	let schedule = document.getElementById( 'kompassi_schedule' );
	let scale = parseFloat( schedule.dataset.scale );

   if( direction < 0 ) {
		scale += 0.5;
   } else if( direction > 0 ) {
		scale -= 0.5;
   }

	let min_hours_to_show = 2;
	let max_scale = kompassi_schedule.filters.date.length_hours / min_hours_to_show;

   if( scale < 1 ) {
      scale = 1;
   } else if( scale > max_scale ) {
      scale = max_scale;
   }

	kompassi_schedule_timeline_zoom_set( scale );
}

function kompassi_schedule_timeline_zoom_set( scale ) {
	let schedule = document.getElementById( 'kompassi_schedule' );
	schedule.dataset.scale = scale;
	schedule.style.width = ( scale * 100 ) + '%';
	kompassi_schedule_timeline_reposition_labels( );
}

function kompassi_schedule_timeline_pan( direction_x, direction_y, ev ) {
	// ev.pointerType == 'mouse'
	let pan_speed_x = 20;
	let pan_speed_y = 10;

	if( direction_x !== 0 ) {
		let wrapper = document.getElementById( 'kompassi_block_schedule' ).querySelector( '.kompassi_schedule_wrapper' );
		wrapper.scrollLeft = wrapper.scrollLeft + ( direction_x * pan_speed_x );
		kompassi_schedule_timeline_reposition_labels( );
	}
	if( direction_y !== 0 ) {
		let wrapper = window;
		wrapper.scrollTop = parseInt( wrapper.scrollTop ) + ( direction_y * pan_speed_y );
	}
}

function kompassi_schedule_timeline_reposition_labels( ) {
	// Reposition headers
	let day_hints = document.querySelectorAll( '#kompassi_schedule .day_hint' );
	for( let hint of day_hints ) {
		let scroll = hint.closest( '.kompassi_schedule_wrapper' ).scrollLeft;
		let offset = hint.offsetLeft;

		if( scroll > offset ) {
			hint.style.paddingLeft = ( scroll - offset ) + 'px';
		} else {
			hint.style.paddingLeft = null;
		}
	}

	// Reposition program titles that are left of visible area
	let programs = document.getElementById( 'kompassi_schedule' ).querySelectorAll( 'article' );
	for( let program of programs ) {
		let program_pos = parseInt( program.style.left );

		if( !isNaN( program_pos ) && program_pos < scroll ) {
			let program_pad = scroll - program_pos;
			program.querySelector( '.title' ).style.marginLeft = program_pad + 'px';
			program.classList.add( 'continues' );
		} else {
			program.querySelector( '.title' ).style.marginLeft = 0;
			program.classList.remove( 'continues' );
		}
	}
}

/**
 *  Revert timeline display layout
 *
 */

wp.hooks.addAction( 'kompassi_schedule_revert_timeline_layout', 'kompassi_integration_schedule', function( ) {
	let schedule = document.getElementById( 'kompassi_schedule' );
	let programs = schedule.querySelectorAll( 'article' );

	// Timeline
	schedule.style.height = 'auto';
	for( let program of programs ) {
		program.style.width = null;
		program.style.minWidth = null;
		program.style.left = null;
		program.style.top = null;
		let title = program.querySelector( '.title' );
		title.style.left = null;
		title.style.position = null;
		title.style.marginLeft = null;
	}
	let elements = schedule.querySelectorAll( '.headers, .ruler, .group-name, .current-time' );
	for( let element of elements ) {
		element.remove( );
	}
	clearTimeout( kompassi_schedule.timeouts['current_time'] );
	if( kompassi_schedule.timeline_hammer ) {
		kompassi_schedule.timeline_hammer.destroy( );
	}
} );

/**
 *  Makes the timeline header sticky
 *
 */

function kompassi_schedule_timeline_sticky_header( ) {
	let schedule = document.getElementById( 'kompassi_schedule' );

	if( schedule.dataset.display != 'timeline' ) {
		return;
	}

	let block = schedule.closest( '#kompassi_block_schedule')
	let wrapper = schedule.closest( '.kompassi_schedule_wrapper' );
	let headers = schedule.querySelector( '.headers' );

	let schedule_top = block.offsetTop + wrapper.offsetTop + schedule.offsetTop;
	let schedule_bottom = schedule_top + wrapper.scrollHeight;
	let scroll = window.scrollY;
	let buffer = headers.offsetHeight;

	if( scroll > schedule_top + buffer && scroll < schedule_bottom - buffer ) {
		headers.classList.add( 'sticky' );
		headers.style.top = scroll - schedule_top + 'px';
	} else {
		headers.classList.remove( 'sticky' );
		headers.style.top = 0;
	}
}

/**
 *  TIMETABLE
 *
 */

/**
 *  Sets up timetable display layout
 *
 */

wp.hooks.addAction( 'kompassi_schedule_setup_timetable_layout', 'kompassi_integration_schedule', function( ) {
	if( kompassi_schedule.init ) {
		return;
	}
	let block = document.getElementById( 'kompassi_block_schedule' );
	let block_options = JSON.parse( block.dataset.wpContext );

	let schedule = document.getElementById( 'kompassi_schedule' );
	let minutes_in_row = 5;
	let primary_grouping = block_options.timetablePrimaryGrouping;
	let secondary_grouping = block_options.timetableSecondaryGrouping;

	if( block.querySelector( '.favorites-toggle' ).classList.contains( 'active' ) ) {
		// Favorites enabled, primary grouping is favorites
		primary_grouping = 'favorites';
	}

	let programs = schedule.querySelectorAll( 'article:not(.filtered)' );

	let tables = {};
	let primary_groups = kompassi_schedule_group_programs( programs, primary_grouping );
	for( let group in primary_groups ) {
		let date_groups = kompassi_schedule_group_programs( primary_groups[group]['programs'], 'date_user_start_end' );
		for( let date in date_groups ) {
			let table_key = primary_groups[group].title + '-' + date;
			tables[table_key] = {
				'title': primary_groups[group].title,
				'start': dayjs.tz( date_groups[date]['start'] ),
				'end': dayjs.tz( date_groups[date]['end'] ),
				'headings': { }
			}
			if( secondary_grouping ) {
				let table_programs = [];
				let table_heading_index = 2;
				let last_title;
				let secondary_groups = kompassi_schedule_group_programs( date_groups[date]['programs'], secondary_grouping );
				for( let secondary in secondary_groups ) {
					if( secondary_groups[secondary]['title'] != last_title ) {
						tables[table_key]['headings'][table_heading_index] = secondary_groups[secondary]['title'];
						last_title = secondary_groups[secondary]['title'];
					}

					table_sections = kompassi_schedule_find_timeslots( secondary_groups[secondary] );
					for( let section of table_sections ) {
						table_programs.push( section );
						table_heading_index += 1;

					}
					tables[table_key]['programs'] = table_programs;
				}
			} else {
				tables[table_key]['programs'] = kompassi_schedule_find_timeslots( date_groups[date] );
			}
		}
	}

	for( let tbl in tables ) {
		let table = document.createElement( 'div' );
		let columns = tables[tbl]['programs'];
		table.style.gridTemplateColumns = 'var(--kompassi-schedule-timetable-time-width) repeat( ' + columns.length + ', minmax(var(--kompassi-schedule-timetable-group-min-width), 1fr ) )';
		table.className = 'table';

		// Initialize table wrapper and toolbar
		let table_wrapper = kompassi_schedule_timetable_table( tables[tbl], block_options );
		table_wrapper.append( table );
		schedule.append( table_wrapper );

		// Position programs
		for( let column in columns ) {
			for( let program of columns[column]['programs'] ) {
				let program_start = dayjs( program.dataset.start );
				let table_start = tables[tbl].start;
				let offset_in_rows = Math.round( ( program_start.diff( table_start, 'minute' ) / minutes_in_row ) + 1 );
				if( secondary_grouping ) {
					offset_in_rows += 1;
				}
				let program_length_in_rows = parseInt( program.dataset.length / minutes_in_row );
				let col = parseInt( column ) + 2; // column indexing starts at 0, column 1 reserved for times
				program.style.gridColumn = col + ' / ' + col;
				program.style.gridRow = offset_in_rows + ' / ' + ( offset_in_rows + program_length_in_rows );

				table.append( program );

				// If the program doesn't start at top of the hour, print an extra time
				if( program_start.tz( schedule.dataset.timezone ).format( 'm' ) != 0 ) {
					let time = document.createElement( 'span' );
					time.innerHTML = '<span>' + program_start.format( 'HH.' ) + '</span>' + program_start.format( 'mm' );
					time.style.gridColumn = '1 / 1';
					time.style.gridRow = offset_in_rows + ' / ' + offset_in_rows;
					time.className = 'time time-minute';

					table.append( time );
				}
				table.addEventListener( 'scrollend', function( event ) {
					clearTimeout( kompassi_schedule.timeouts['timetable_check_scroll'] );
					kompassi_schedule.timeouts['timetable_check_scroll'] = setTimeout( kompassi_schedule_timetable_check_scroll, 50 );
				} );
			}
		}

		/* Print headings */
		if( secondary_grouping ) {
			for( let group_heading in tables[tbl]['headings'] ) {
				let heading = document.createElement( 'span' );
				heading.style.gridColumn = group_heading + ' / ' + group_heading;
				heading.style.gridRow = '1 / 1';
				heading.className = 'heading';
				heading.textContent = tables[tbl]['headings'][group_heading];

				table.append( heading );
			}
		}
		/* Print times */
		kompassi_schedule_timetable_table_times( tables[tbl], table, block_options, minutes_in_row );
	}

	kompassi_schedule_timetable_check_scroll( );
	// TODO: When window is resized, check to see if table navigation buttons are required and if visual aids should be shown
	window.addEventListener( 'resize', function( event ) {
		clearTimeout( kompassi_schedule.timeouts['timetable_check_scroll'] );
		kompassi_schedule.timeouts['timetable_check_scroll'] = setTimeout( kompassi_schedule_timetable_check_scroll, 50 );
	} );
} );

function kompassi_schedule_timetable_table( table, block_options ) {
	let table_wrapper = document.createElement( 'div' );
	table_wrapper.className = 'table-wrapper';
	let table_toolbar = document.createElement( 'div' );
	table_toolbar.className = 'table-toolbar';
	let table_name = document.createElement( 'div' );
	table_name.className = 'kompassi-subheading';
	if( block_options.timetablePrimaryGrouping ) {
		table_name.innerHTML = '<div><strong>' + table.title + '</strong> <em>' + dayjs( table.start ).format( 'LL' ) + '</em></div>';
	} else {
		table_name.innerHTML = '<div><strong>' + dayjs( table.start ).format( 'LL' ) + '</strong></div>';
	}
	table_toolbar.append( table_name );
	let table_controls = document.createElement( 'div' );
	table_controls.className = 'kompassi-button-group has-icon-only table-controls';
	let table_control_left = document.createElement( 'a' );
	table_control_left.className = 'kompassi-icon-arrow-left';
	table_control_left.dataset.action = 'scroll-left';
	table_controls.append( table_control_left );
	let table_control_right = document.createElement( 'a' );
	table_control_right.className = 'kompassi-icon-arrow-right';
	table_control_right.dataset.action = 'scroll-right';
	table_controls.append( table_control_right );
	table_toolbar.append( table_controls );
	table_wrapper.append( table_toolbar );

	table_control_left.addEventListener( 'click', function( event ) {
		let table = event.target.closest( '.table-wrapper' ).querySelector( '.table' );
		table.scrollBy( -200, 0 );
	} );
	table_control_right.addEventListener( 'click', function( ) {
		let table = event.target.closest( '.table-wrapper' ).querySelector( '.table' );
		table.scrollBy( 200, 0 );
	} );
	return table_wrapper;
}

function kompassi_schedule_timetable_table_times( day, table, block_options, minutes_in_row ) {
	day.start = dayjs( day.start );
	day.end = dayjs( day.end );

	let times = day.start.startOf( 'hour' );
	let row = 1;
	if( block_options.timetableSecondaryGrouping ) {
		row += 1;
	}
	let is_odd = true;
	let increment = 60 / minutes_in_row;
	while( times < day.end.endOf( 'hour' ) ) {
		let evenodd_class;
		if( is_odd ) {
			evenodd_class = 'odd';
		} else {
			evenodd_class = 'even';
		}
		let time = document.createElement( 'span' );
		time.innerHTML = '<span>' + times.format( 'HH' ) + '</span>';
		time.style.gridColumn = '1 / 1';
		time.style.gridRow = row + ' / ' + ( row + increment );
		time.className = 'time time-hour time-' + evenodd_class;
		if( row == 1 ) {
			time.classList.add( 'first' );
		}
		table.append( time );

		let time_bar = document.createElement( 'span' );
		time_bar.style.gridColumn = '1 / -1';
		time_bar.style.gridRow = row + ' / ' + ( row + increment );
		time_bar.className = 'time-bar time-' + evenodd_class;
		if( row == 1 ) {
			time_bar.classList.add( 'first' );
		}
		table.append( time_bar );

		times = times.add( 1, 'hour' );
		row += increment;
		is_odd = !is_odd;
	}
}

function kompassi_schedule_timetable_check_scroll( ) {
	let table_wrappers = document.querySelectorAll( '#kompassi_schedule[data-display="timetable"] .table-wrapper' );
	for( let wrapper of table_wrappers ) {
		let table = wrapper.querySelector( '.table' );
		table.classList.remove( 'can-scroll-left', 'can-scroll-right' );
		let controls = wrapper.querySelector( '.table-toolbar .table-controls' );
		if( table.scrollWidth > table.offsetWidth ) {
			controls.style.display = 'block';

			var left_scroll = wrapper.querySelectorAll( '[data-action="scroll-left"]' )[0];
			var right_scroll = wrapper.querySelectorAll( '[data-action="scroll-right"]' )[0];
			if( table.scrollLeft > 0 ) {
				left_scroll.classList.add( 'active' );
				table.classList.add( 'can-scroll-left' );
			} else {
				left_scroll.classList.remove( 'active' );
			}
			if( table.scrollLeft == table.scrollLeftMax ) {
				right_scroll.classList.remove( 'active' );
			} else {
				right_scroll.classList.add( 'active' );
			}
		} else {
			controls.style.display = 'none';
		}
	}
}

/**
 *  Revert timetable display layout
 *
 */

wp.hooks.addAction( 'kompassi_schedule_revert_timetable_layout', 'kompassi_integration_schedule', function( ) {
	let schedule = document.getElementById( 'kompassi_schedule' );
	let programs = schedule.querySelectorAll( 'article' );

	// Timetable
	for( let program of programs ) {
		program.style.gridRow = '';
		program.style.gridColumn = '';
		schedule.append( program );
	}
	groups = schedule.querySelectorAll( '.table-wrapper' );
	for( let group of groups ) {
		group.remove( );
	}
} );

//
//  Modals
//

/**
 *  Opens program modal
 *
 *  @param {Object} program DOM object of the program number
 *
 */

function kompassi_schedule_program_modal( program ) {
	kompassi_close_modal( );

	let program_styles = window.getComputedStyle( program );

	let program_color = program_styles.getPropertyValue( '--kompassi-program-color' );
	let program_icon = program_styles.getPropertyValue( '--kompassi-program-icon' );

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
	wp.hooks.applyFilters( 'kompassi_schedule_program_modal_actions', actions, program );

	let options = {
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
	if( program.dataset.state ) {
		options.attrs['data-state'] = program.dataset.state;
	}
	modal = kompassi_show_modal( options );

	favorite = modal.querySelector( '.actions .favorite' );
	favorite.addEventListener( 'click', function( event ) {
		kompassi_schedule_toggle_favorite( event.target );
	} );

	// Swipe
	kompassi_schedule.modal_hammer = new Hammer( document.getElementById( 'kompassi_modal' ), { touchAction: 'swipe' } );
	kompassi_schedule.modal_hammer.on( 'swipe', function( ev ) {
		let modal = document.getElementById( 'kompassi_modal' );
		let current_program = modal.dataset.id;
		let open_program = null;

		if( ev.direction == '4' ) {
			open_program = kompassi_schedule_get_next_visible_program( current_program, -1 );
		}
		if( ev.direction == '2' ) {
			open_program = kompassi_schedule_get_next_visible_program( current_program );
		}

		if( open_program ) {
			kompassi_schedule_program_modal( open_program );
		}
	} );

	kompassi_schedule_update_url_hash( );
}

/**
 *  Returns schedule legend modal data
 *
 */

function kompassi_schedule_get_legend_modal_data( ) {
	let legend = [];
	for( let dimension of kompassi_schedule_dimensions ) {
		if( dimension.isListFilter == false || dimension.slug == 'state' ) {
			continue;
		}
		if( kompassi_schedule_options.hidden_dimensions.indexOf( dimension.slug ) > -1 ) {
			continue;
		}
		if( dimension.values.length == 0 ) {
			continue;
		}

		for( let value of dimension.values ) {
			if( value.color ) {
				legend.push( '<dt><span style="background-color: ' + value.color + ';"></span></dt><dd>' + dimension.title + ': ' + value.title + '</dd>' );
			}
		}
	}

	return legend;
}

/**
 *  Displays schedule help modal
 *
 */

function kompassi_schedule_help_modal( ) {
	let opts = {
		rest_route: 'kompassi-integration/v1/docs/schedule_help/' + kompassi_schedule_options.locale,
		success: function( response ) {
			var sdc = new showdown.Converter( );
			let options = {
				title: __( 'Help!', 'kompassi-integration' ),
				content: sdc.makeHtml( response.content ),
				attrs: {
					class: 'kompassi-document'
				},
			};
			if( response.status !== false ) {
				kompassi_show_modal( options );
			} else {
				// TODO: Show modal error
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
	let options = {
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
	let valid_programs = [];
	for( let program of programs ) {
		let element = document.getElementById( program );
		if( element ) {
			valid_programs.push( element.querySelector( '.title' ).textContent );
		}
	}

	// translators: amount of programs to be imported
	let markup = '<p>' + sprintf( _n( 'You are about to import %s program as favorite:', 'You are about to import %s programs as favorites:', valid_programs.length, 'kompassi-integration' ), valid_programs.length ) + '</p>';
	markup += '<ul class="program-title-list">';
	for( let program of valid_programs ) {
		markup += '<li>' + program + '</li>';
	}
	markup += '</ul>';

	let actions = '<a class="kompassi-button replace">' + __( 'Replace Favorites', 'kompassi-integration' ) + '</a>';
	actions += '<a class="kompassi-button append">' + __( 'Append to Favorites', 'kompassi-integration' ) + '</a>';
	let options = {
		attrs: {
			class: 'kompassi-schedule-import small-modal actions-bottom-right'
		},
		title: __( 'Import Favorites', 'kompassi-integration' ),
		actions: actions,
		content: markup
	};
	kompassi_show_modal( options );
}

//
//  Helper functions
//

/**
 *  Returns passed program grouped by given grouping
 *
 */

function kompassi_schedule_group_programs( programs, grouping ) {
	if( grouping == false || grouping == undefined ) {
		return { '': { 'programs': programs } };
	}
	if( grouping == 'favorites' ) {
		return { '': { 'programs': programs, 'title': __( 'Favorites', 'kompassi-integration' ) } };
	}

	let grouped = { };

	programs = Array.from( programs );
	for( let program of programs ) {
		let key;
		if( program.dataset[grouping] ) {
			// Use dataset value for grouping
			key = program.dataset[grouping];
			if( program.querySelector( '.dimension.' + grouping + ' > :first-child' ) ) {
				title = program.querySelector( '.dimension.' + grouping + ' > :first-child' ).textContent;
			} else {
				title = '';
			}
		} else {
			// Allow custom grouping, eg. date
			( { key, title } = wp.hooks.applyFilters( 'kompassi_schedule_grouping_' + grouping, { 'key': 'no-group', 'title': __( 'No group', 'kompassi-integration' ) }, program ) );
		}

		if( !grouped[key] ) {
			grouped[key] = { 'programs': [], 'start': undefined, 'end': undefined };
		}

		grouped[key]['programs'].push( program );
		if( grouped[key]['start'] == undefined || dayjs( program.dataset.start ) < grouped[key]['start'] ) {
			grouped[key]['start'] = dayjs( program.dataset.start );
		}
		if( grouped[key]['end'] == undefined || dayjs( program.dataset.end ) > grouped[key]['end'] ) {
			grouped[key]['end'] = dayjs( program.dataset.end );
		}
		if( grouped[key]['title'] == undefined ) {
			grouped[key]['title'] = title;
		}
	}

	// Sort by key
	grouped = Object.values( grouped );
	let sort_function = wp.hooks.applyFilters( 'kompassi_schedule_grouping_sort_function_' + grouping, kompassi_schedule_grouping_sort_title );
	grouped = [...grouped].sort( sort_function );

	return grouped;
}

function kompassi_schedule_grouping_sort_title( a, b ) {
	return a.title.localeCompare( b.title );
}


/**
 *  Find a timeslots for a program
 *
 */

function kompassi_schedule_find_timeslots( program_group ) {
	let timeslotted = [];

	for( let program of program_group['programs'] ) {
		let found_slot = false;
		let check_index = 0;
		while( found_slot == false ) {
			if( timeslotted[check_index] == undefined ) {
				// Row does not exist, create new
				timeslotted[check_index] = {
					'programs': [ program ],
					'end': dayjs( program.dataset.end ),
					'title': program_group.title
				};
				found_slot = true;
			} else if( timeslotted[check_index]['end'] <= dayjs( program.dataset.start ) ) {
				// Groups last event ends before or at the same time as this one starts
				timeslotted[check_index]['end'] = dayjs( program.dataset.end );
				timeslotted[check_index]['programs'].push( program );
				found_slot = true;
			}
			check_index += 1;
		}
	}
	return timeslotted;
}

/**
 *  Add "date_user_start_end" grouping
 *  Filter: kompassi_schedule_grouping_sort_function_{grouping}
 *
 */

wp.hooks.addFilter( 'kompassi_schedule_grouping_date_user_start_end', 'kompassi_schedule', function( values, program ) {
	// TODO: Use the user-defined start/end of day times here
	// kompassi_schedule_options.start_of_day
	// kompassi_schedule_options.end_of_day
	values.key = dayjs( program.dataset.start ).format( 'YYYY-MM-DD' );
	values.title = values.key;
	return values;
} );

/**
 *  Returns the previous or next (filtered) program number
 *
 *  @param {string} current Current program slug
 *  @param {boolean} reverse Whether to reverse the order, eg. return the previous program number
 *
 *  @returns {Object} DOM object of the next/previous program number
 */

function kompassi_schedule_get_next_visible_program( current = false, reverse = false ) {
	if( !current ) {
		return false;
	}

	let current_program = document.getElementById( current );
	let open_program = false;

	if( reverse ) {
		// Prev
		do {
			let previous = current_program.previousElementSibling;
			if( previous && !previous.classList.contains( '.filtered' ) ) {
				open_program = previous;
			} else if( !previous ) {
				// get last
				let schedule = document.getElementById( 'kompassi_schedule' );
				open_program = schedule.lastElementChild;
			}
		} while( !open_program );
	} else {
		// Next
		do {
			let next = current_program.nextElementSibling;
			if( next && !next.classList.contains( '.filtered' ) ) {
				open_program = next;
			} else if( !next ) {
				// get last
				let schedule = document.getElementById( 'kompassi_schedule' );
				open_program = schedule.firstElementChild;
			}
		} while( !open_program );
	}

	if( !open_program ) {
		return false;
	}

	return open_program;
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
		if( filter.tagName == 'DIV' && filter.classList.contains( 'kompassi-dropdown' ) ) {
			let options = filter.querySelectorAll( 'input:checked' );
			let selected = [];
			for( let option of options ) {
				selected.push( option.value );
			}
			if( selected.length > 0 ) {
				opts.push( opt_name + ':' + selected.join( ',' ) );
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

function kompassi_schedule_create_sort_function_to_sort_by_dimension( dimension ) {
	return function( a, b ) {
		if( dimension.length > 0 ) {
			let a_group = a.querySelector( '.' + dimension );
			let b_group = b.querySelector( '.' + dimension );

			if( ( !a_group && !b_group ) || ( !a_group && b_group ) ) {
				return -1;
			} else if( a_group && !b_group ) {
				return 1;
			}

			let a_text = a_group.textContent;
			let b_text = b_group.textContent;

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
}

/*
 *  Get the ideal amount of columns for filters
 *
 */

function kompassi_schedule_get_ideal_filter_columns_amount( items ) {
  if( items % 4 === 0 ) {
	  return 4;
  }
  for( let fours = Math.floor( items / 4 ); fours >= 0; fours-- ) {
	 if( ( items - fours * 4 ) % 3 === 0 ) {
		const threes = ( items - fours * 4 ) / 3;
      return fours >= threes ? 4 : 3;
    }
  }
  return 3;
}
