const __ = wp.i18n.__;
const _x = wp.i18n._x;
const _n = wp.i18n._n;
const sprintf = wp.i18n.sprintf;
<<<<<<< HEAD

<<<<<<< HEAD
=======
//let kompassi_common; /* ? */
//let kompassi_storage; /* ? */
=======
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)

>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
jQuery( function( e ) { // TODO
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
	kompassi_schedule_init( );
	kompassi_schedule_get_favorites_from_storage( );

	//  Apply options from URL
	kompassi_schedule_update_filters_from_options( kompassi_get_url_options( ) );
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
	let programs = schedule.children;
	for( let program of programs ) {
		let title = program.querySelector( '.title' );
		title.insertAdjacentHTML( 'afterend', '<a class="favorite kompassi-icon-favorite" title="' + _x( 'Favorite', 'button label', 'kompassi-integration' ) + '"/>' );
	}

<<<<<<< HEAD
<<<<<<< HEAD
	//  When background matches the underlying 1:1, switch the --kompassi-bg color to an alternative
=======
	//  On completely white backgrounds, switch the --kompassi-bg color to an alternative
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	//  When background matches the underlying 1:1, switch the --kompassi-bg color to an alternative
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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

<<<<<<< HEAD
<<<<<<< HEAD
		let program = event.target.closest( 'article' );
=======
		program = event.target.closest( 'article' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let program = event.target.closest( 'article' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)

		if( !program ) {
			return;
		}

		clearTimeout( kompassi_schedule.timeouts['popover'] );

<<<<<<< HEAD
<<<<<<< HEAD
		let options = {
=======
		options = {
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let options = {
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
			title: program.querySelector( '.title' ).textContent,
			content: program.querySelector( '.times' ).innerHTML // TODO: What data to show?
		}
		kompassi_schedule.timeouts['popover'] = setTimeout( kompassi_popover, 300, options, event, program );
	} );

	schedule.addEventListener( 'mouseout', function( event ) {
		clearTimeout( kompassi_schedule.timeouts['popover'] );
<<<<<<< HEAD
<<<<<<< HEAD
		let program = event.target.closest( 'article' );
		let popover = document.getElementById( 'kompassi_popover' );
=======
		program = event.target.closest( 'article' );
		popover = document.getElementById( 'kompassi_popover' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let program = event.target.closest( 'article' );
		let popover = document.getElementById( 'kompassi_popover' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD

		// Open modal
		kompassi_schedule_program_modal( event.target.closest( 'article' ) );
=======
		kompassi_schedule_program_modal( this );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======

		// Open modal
		kompassi_schedule_program_modal( event.target.closest( 'article' ) );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
		}
	} );
	document.body.addEventListener( 'keyup', function( event ) {
		if( event.keyCode == 27 ) {
			kompassi_close_modal( );
			kompassi_schedule_update_url_hash( );
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
			activated_toggle.classList.removeClass( 'active' );
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
	let dropdown = kompassi_dropdown_menu(
		{
			help: { label: __( 'Help', 'kompassi-integration' ), callback: kompassi_schedule_help_modal },
			export: { label: __( 'Export Favorites', 'kompassi-integration' ), callback: kompassi_schedule_export_modal },
		},
		{
			id: 'kompassi_schedule_menu'
		}
	);
	toolbar.append( dropdown );

	/*  Filter popup  */
	let filter_popup = document.createElement( 'section' );
	filter_popup.id = 'kompassi_schedule_filters';

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
		if( dimension.isListFilter == false ) {
			continue;
		}
		if( kompassi_schedule_options.hidden_dimensions.indexOf( dimension.slug ) > -1 ) {
			continue;
		}

<<<<<<< HEAD
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
=======
		let select = document.createElement( 'select' );
		select.classList.add( 'filter', 'filter-dimension' );
		select.setAttribute( 'name', 'filter_' + dimension.slug );
		select.dataset.filter = dimension.slug;
		select.dataset.dimension = dimension.slug;
		select.dataset.placeholder = dimension.title;
		select.setAttribute( 'multiple', 'multiple' );

		for( let value of dimension.values ) {
			let option = document.createElement( 'option' );
			option.value = value.slug;
			option.textContent = value.title;
			select.append( option );
		}

		let select_wrapper = document.createElement( 'div' );
		select_wrapper.classList.add( 'select' );
		select_wrapper.dataset.dimension = dimension.slug;
		select_wrapper.append( select );
		filter_popup.append( select_wrapper );

		// TODO: Replace jQuery-multiselect
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
			select.classList.add( 'flag-negative' );
			options.texts.options_header = __( 'Program matching selection will be hidden from results.', 'kompassi-integration' );
		}

		jQuery( select ).multiselect( options );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	}

	// Clear filters
	let clear_toggle = document.createElement( 'a' );
	clear_toggle.classList.add( 'clear-filters', 'kompassi-icon-clear-filters' );
	clear_toggle.title = __( 'Clear filters', 'kompassi-integration' );

	clear_toggle.addEventListener( 'click', function( event ) {
<<<<<<< HEAD
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
=======
		let filters = filter_popup.querySelectorAll( 'input, select' );
		for( let filter of filters ) {
			if( filter.classList.contains( 'filter-dimension' ) ) {
				for( let option of filter.children ) {
					option.removeAttribute( 'selected' );
				}
				// TODO: Replace jQuery-multiselect
				jQuery( select ).multiselect( 'reload' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
		if( event.target.closest( 'div' ).classList.contains( 'kompassi-dropdown' ) ) {
=======
		if( event.target.closest( 'div.select' ).querySelector( 'select' ).classList.contains( 'filter-dimension' ) ) {
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
		'timeline': _x( 'Timeline', 'display style', 'kompassi-integration' )
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
<<<<<<< HEAD
		if( filter.tagName == 'DIV' && filter.classList.contains( 'filter-dimension' ) ) {
			let options = filter.querySelectorAll( 'input' );
			if( opts[filter_name] ) {
				for( let option of options ) {
					if( opts[filter_name].includes( option.value ) ) {
						option.checked = true;
						filters_set = true;
					} else {
						option.checked = false;
=======
		if( filter.tagName == 'SELECT' ) {
			let options = filter.querySelectorAll( 'option' );
			if( opts[filter_name] ) {
				for( let option of options ) {
					if( opts[filter_name].includes( option.value ) ) {
						option.selected = true;
						filters_set = true;
					} else {
						option.selected = false;
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
					}
				}
			} else {
				for( let option of options ) {
<<<<<<< HEAD
					option.checked = false;
				}
			}
			// Refresh dropdown button
			let change_event = new Event( 'change', { view: window, bubbles: true, cancelable: true } );
			options[0].dispatchEvent( change_event );
=======
					option.selected = false;
				}
			}
			// TODO: Replace jQuery-multiselect
			jQuery( filter ).multiselect( 'reload' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
		let program = document.getElementById( opts.prog );
		if( program ) {
			kompassi_schedule_program_modal( program );
=======
		prog = document.getElementById( opts.prog );
		if( prog ) {
			kompassi_schedule_program_modal( prog );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let program = document.getElementById( opts.prog );
		if( program ) {
			kompassi_schedule_program_modal( program );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
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
=======
	note = document.querySelector( '#kompassi_schedule_notes .program-count' );
=======
	let note = document.querySelector( '#kompassi_schedule_notes .program-count' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	if( note ) {
		note.remove( );
	}
	let program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
	if( kompassi_schedule.filters.enabled > 0 ) {
		let notes = document.getElementById( 'kompassi_schedule_notes' );
		if( program_count > 0 ) {
			// translators: count of programs visible
<<<<<<< HEAD
			program_count_label = sprintf( _n( '%s program visible.', '%s programs visible.', program_count, 'kompassi-integration' ), program_count );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
			let program_count_label = sprintf( _n( '%s program visible.', '%s programs visible.', program_count, 'kompassi-integration' ), program_count );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
	let date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
=======
	date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	if( date_filter ) {
		// Date selected
		if( date_filter.dataset.date == 'now' ) {
			// TODO: Allow user to select how much program to show?
			let now_view_length = 2;
			kompassi_schedule.filters.date.start = dayjs( );
			kompassi_schedule.filters.date.end = kompassi_schedule.filters.date.start.add( now_view_length, 'hour' );
			kompassi_schedule.filters.date.length_hours = now_view_length;

			//
			document.getElementById( 'kompassi_schedule' ).classList.add( 'now' );
		} else {
<<<<<<< HEAD
<<<<<<< HEAD
			let date = dayjs( date_filter.dataset.date );
=======
			date = dayjs( date_filter.dataset.date );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
			let date = dayjs( date_filter.dataset.date );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)

			let start_of_day = parseInt( kompassi_schedule_options.schedule_start_of_day );
			let end_of_day = parseInt( kompassi_schedule_options.schedule_end_of_day );
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
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
		let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
		if( kompassi_schedule.filters.enabled > 0 && programs_visible ) {
			let starts = [];
			let ends = [];

			for( let program of programs_visible ) {
				starts.push( parseInt( program.dataset.start ) );
				ends.push( parseInt( program.dataset.end ) );
			}
			kompassi_schedule.filters.date.start = dayjs.unix( Math.min( ...starts ) );
			kompassi_schedule.filters.date.end = dayjs.unix( Math.max( ...ends ) );
=======
=======
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		if( kompassi_schedule.filters.enabled > 0 && jQuery( '#kompassi_schedule article:visible' ).length > 0 ) {
			starts = [];
			ends = [];

			jQuery( '#kompassi_schedule article:visible' ).each( function ( ) {
				starts.push( dayjs( jQuery( this ).data( 'start' ) ).unix( ) );
				ends.push( dayjs( jQuery( this ).data( 'end' ) ).unix( ) );
			} );
=======
		programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
=======
		let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
>>>>>>> 73dd98d (Rewrite as vanilla JS instead of jQuery, part 3)
		if( kompassi_schedule.filters.enabled > 0 && programs_visible ) {
			let starts = [];
			let ends = [];
>>>>>>> 46a54de (Rewrite as vanilla JS instead of jQuery, part 1)

<<<<<<< HEAD
<<<<<<< HEAD
			kompassi_schedule.filters.date.start = dayjs( Math.min( ...starts ) );
			kompassi_schedule.filters.date.end = dayjs( Math.max( ...ends ) );
>>>>>>> 3410b6c (Show correct times even when site timezone and event timezone do not match (closes #69))
=======
=======
			for( let program of programs_visible ) {
				starts.push( parseInt( program.dataset.start ) );
				ends.push( parseInt( program.dataset.end ) );
			}
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
			kompassi_schedule.filters.date.start = dayjs.unix( Math.min( ...starts ) );
			kompassi_schedule.filters.date.end = dayjs.unix( Math.max( ...ends ) );
>>>>>>> 87bbf09 (Fix: Timeline view does not work with filters)
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
<<<<<<< HEAD
<<<<<<< HEAD
	let programs = document.getElementById( 'kompassi_schedule' ).querySelectorAll( 'article' );
=======
	programs = document.querySelectorAll( '#kompassi_schedule article' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let programs = document.getElementById( 'kompassi_schedule' ).children;
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	for( let program of programs ) {
		program.classList.remove( 'filtered', 'continues' );
	}
	// TODO: Do these on setup_display?
	let filter_notes = document.querySelectorAll( '#kompassi_schedule_notes .filter' );
	for( let note of filter_notes ) {
		note.remove( );
	}
<<<<<<< HEAD
<<<<<<< HEAD
	let continuing = document.getElementById( 'kompassi_programs_continuing' );
=======
	continuing = document.getElementById( '#kompassi_programs_continuing' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let continuing = document.getElementById( 'kompassi_programs_continuing' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
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

=======
			if( filter.value.length > 0 ) {
				let filter_dimension = filter.dataset.dimension;
				let programs = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
				for( let program of programs ) {
					let match = false;

>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
					if( program.hasAttribute( 'data-' + filter_dimension ) ) {
						let program_dimensions = program.getAttribute( 'data-' + filter_dimension ).split( ',' );
						let dimension_match = false;
						for( let dimension of program_dimensions ) {
<<<<<<< HEAD
							if( filter_values.includes( dimension ) ) {
=======
							if( filter.value.includes( dimension ) ) {
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
								dimension_match = true;
								break;
							}
						}
<<<<<<< HEAD
<<<<<<< HEAD
						if( dimension_match ) {
							match = true;
						}
=======

						if( dimension_match ) {
							match = true;
						}

>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
						if( dimension_match ) {
							match = true;
						}
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
=======
			// TODO: Replace jQuery-multiselect
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
			jQuery( filter ).multiselect( 'reload' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
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
<<<<<<< HEAD
<<<<<<< HEAD
				let programs = document.getElementById( 'kompassi_schedule' ).querySelectorAll( 'article' );
				for( let program of programs ) {
=======
				for( let program of document.querySelectorAll( '#kompassi_schedule article' ) ) {
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
				let programs = document.getElementById( 'kompassi_schedule' ).children;
				for( let program of programs ) {
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		let not_favorite_programs = document.querySelectorAll( '#kompassi_schedule article:not(.is-favorite)' );
		for( let program of not_favorite_programs ) {
=======
		for( let program of document.querySelectorAll( '#kompassi_schedule article:not(.is-favorite)' ) ) {
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
			program.classList.add( 'filtered' );
		}
		kompassi_schedule.filters.enabled += 1;
	}

	// Date filter
	kompassi_schedule_update_date_view_parameters( );

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
	let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
	for( let program of programs_visible ) {
		let program_start = parseInt( program.dataset.start );
		let program_end = parseInt( program.dataset.end );
		if( program_start > kompassi_schedule.filters.date.end.unix( ) || program_end <= kompassi_schedule.filters.date.start.unix( ) ) {
			program.classList.add( 'filtered' );
=======
=======
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	jQuery( '#kompassi_schedule article:visible' ).each( function( index ) {
		program = jQuery( this );
		program_start = program.data( 'start' );
		program_end = program.data( 'end' );
		if( program_start > kompassi_schedule.filters.date.end || program_end <= kompassi_schedule.filters.date.start ) {
			program.addClass( 'filtered' );
<<<<<<< HEAD
>>>>>>> 3410b6c (Show correct times even when site timezone and event timezone do not match (closes #69))
=======
=======
	programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
=======
	let programs_visible = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' );
>>>>>>> 73dd98d (Rewrite as vanilla JS instead of jQuery, part 3)
	for( let program of programs_visible ) {
		let program_start = parseInt( program.dataset.start );
		let program_end = parseInt( program.dataset.end );
		if( program_start > kompassi_schedule.filters.date.end.unix( ) || program_end <= kompassi_schedule.filters.date.start.unix( ) ) {
			program.classList.add( 'filtered' );
>>>>>>> 46a54de (Rewrite as vanilla JS instead of jQuery, part 1)
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
		}
		if( program_start < kompassi_schedule.filters.date.start && program_end > kompassi_schedule.filters.date.start ) {
			// TODO: When on "Now" view, all programs that started before this exact minute should be "continues"!
			program.classList.add( 'continues' );
		}
	}

	// If there is no text search and there is a date search, and there is programs that have started before the filtered timerange, show notification
<<<<<<< HEAD
<<<<<<< HEAD
	let date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
=======
	date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let date_filter = document.querySelector( '#kompassi_block_schedule .date-toggle.active' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	if( date_filter ) {
		if( kompassi_schedule_options.schedule_start_of_day != 0 || kompassi_schedule_options.schedule_end_of_day != 0 ) {
			// Do not show message on "Now" view
			if( date_filter.dataset.date != 'now' ) {
<<<<<<< HEAD
<<<<<<< HEAD
				let program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
				if( program_count > 0 ) {
					// translators: start of day hour, end of day hour
					let notes = document.getElementById( 'kompassi_schedule_notes' );
=======
				program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
				if( program_count > 0 ) {
					// translators: start of day hour, end of day hour
					notes = document.getElementById( 'kompassi_schedule_notes' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
				let program_count = document.querySelectorAll( '#kompassi_schedule article:not(.filtered)' ).length;
				if( program_count > 0 ) {
					// translators: start of day hour, end of day hour
					let notes = document.getElementById( 'kompassi_schedule_notes' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
					notes.insertAdjacentHTML( 'beforeend', '<span class="filter programs-between display-not-timeline">' + sprintf( __( 'Showing programs starting between %1$s and %2$s.', 'kompassi-integration' ), kompassi_schedule_options.schedule_start_of_day, kompassi_schedule_options.schedule_end_of_day ) + '</span>' );
				}
			}
		}
		// Show note about the Start/End of Day times
		let text_filter = document.querySelector( '#kompassi_schedule_filters [name="filter_text"]' );
		let continuing = document.querySelectorAll( '#kompassi_schedule article.continues' );
		if( text_filter.value.length < 1 && continuing.length > 0 ) {
			let count = document.querySelectorAll( '#kompassi_schedule article.continues:not(.filtered)' ).length;
			// translators: amount of repositioned events
			let notes = document.getElementById( 'kompassi_schedule_notes' );
			notes.insertAdjacentHTML( 'beforeend', '<span class="filter programs-continuing display-not-timeline"><a class="kompassi-jump-to" href="#kompassi_programs_continuing">' + sprintf( _n( 'Show %d program that started earlier', 'Show %d programs that started earlier', count, 'kompassi-integration' ), count ) + '</a></span>' );
			let first_continuing = document.querySelector( '#kompassi_schedule article.continues' );
			first_continuing.insertAdjacentHTML( 'beforebegin', '<h3 id="kompassi_programs_continuing">' + __( 'Programs continuing', 'kompassi-integration' ) + '</h3>' );
		}
	}

	//
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
	let filter_popup = document.getElementById( 'kompassi_schedule_filters' );
	if( kompassi_schedule.filters.enabled > 0 ) {
		filter_popup.classList.add( 'has-filters-enabled' );
	} else {
		filter_popup.classList.remove( 'has-filters-enabled' );
=======
	filters = document.getElementById( 'kompassi_schedule_filters' );
=======
	let filters = document.getElementById( 'kompassi_schedule_filters' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
=======
	let filter_popup = document.getElementById( 'kompassi_schedule_filters' );
>>>>>>> 22c60f2 (Small fixes)
	if( kompassi_schedule.filters.enabled > 0 ) {
		filter_popup.classList.add( 'has-filters-enabled' );
	} else {
<<<<<<< HEAD
		filters.classList.remove( 'has-filters-enabled' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		filter_popup.classList.remove( 'has-filters-enabled' );
>>>>>>> 22c60f2 (Small fixes)
	}

	kompassi_schedule_setup_display( );
	kompassi_schedule_update_url_hash( );
}

<<<<<<< HEAD
=======
/**
 *  Update multiselect labels
 *  - Show indicator
 *  - Show select label instead of "Multiple selected"
 *  TODO: Replace jQuery-multiselect
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

>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
		let width = program.dataset.length / length * 100;
		let offset_in_s = program.dataset.start - kompassi_schedule.filters.date.start.unix( );
		let offset_in_m = offset_in_s / 60;
		let offset = offset_in_m / length * 100;
		let grouping = false;
		let has_row = false;
		let program_row;
=======
=======
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
		width = program.data( 'length' ) / length * 100;
		start = dayjs( program.data( 'start' ) );
		offset_min = start.diff( kompassi_schedule.filters.date.start, 'minute' );
		offset = offset_min / length * 100;
<<<<<<< HEAD
>>>>>>> 3410b6c (Show correct times even when site timezone and event timezone do not match (closes #69))
=======
=======
		let width = program.dataset.length / length * 100;
		let offset_in_s = program.dataset.start - kompassi_schedule.filters.date.start.unix( );
		let offset_in_m = offset_in_s / 60;
		let offset = offset_in_m / length * 100;
		let grouping = false;
<<<<<<< HEAD
>>>>>>> 46a54de (Rewrite as vanilla JS instead of jQuery, part 1)
<<<<<<< HEAD
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
=======
		let has_row = false;
		let program_row;
>>>>>>> 73dd98d (Rewrite as vanilla JS instead of jQuery, part 3)
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)

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
<<<<<<< HEAD
<<<<<<< HEAD
				schedule.append( group );
=======
				schedule.appendChild( group );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
				schedule.append( group );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
				rows.push( parseInt( program.dataset.end ) );
				program_row = rows.length - 1;
				has_row = true;
			} else if( rows[check_index] <= program.dataset.start ) {
				// Rows last event ends before or at the same time as this one starts
				rows[check_index] = parseInt( program.dataset.end );
=======
=======
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
				rows.push( dayjs( program.data( 'end' ) ).unix( ) );
				program_row = rows.length - 1;
				has_row = true;
			} else if( rows[check_index] <= dayjs( program.data( 'start' ) ).unix( ) ) {
				// Rows last event ends before or at the same time as this one starts
				rows[check_index] = dayjs( program.data( 'end' ) ).unix( );
<<<<<<< HEAD
>>>>>>> 3410b6c (Show correct times even when site timezone and event timezone do not match (closes #69))
=======
=======
				rows.push( parseInt( program.dataset.end ) );
				program_row = rows.length - 1;
				has_row = true;
			} else if( rows[check_index] <= program.dataset.start ) {
				// Rows last event ends before or at the same time as this one starts
				rows[check_index] = parseInt( program.dataset.end );
>>>>>>> 46a54de (Rewrite as vanilla JS instead of jQuery, part 1)
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
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
<<<<<<< HEAD
<<<<<<< HEAD
	let headers = document.createElement( 'div' );
	headers.classList.add( 'headers' );
<<<<<<< HEAD
	let days = 0;
	let offset = 100 / Math.ceil( kompassi_schedule.filters.date.length_hours );
	for( let hours = 0; hours < Math.ceil( kompassi_schedule.filters.date.length_hours ); hours++ ) {
		let time_label = kompassi_schedule.filters.date.start.add( hours, 'hour' ).format( 'H' );
		schedule.insertAdjacentHTML( 'beforeend', '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + hours + '% ); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );"></div>' );
		let hint = document.createElement( 'div' );
		hint.classList.add( 'hint', 'time_hint' );
		hint.style.left = 'calc( ' + offset + ' * ' + hours + '%)';
		hint.style.width = 'calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 )';
		hint.textContent = time_label;
		headers.appendChild( hint );
		if( time_label == '0' || hours == 0 ) {
			let day_label = kompassi_schedule.filters.date.start.add( days, 'day' ).format( 'LL' );
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
=======
	headers = jQuery( '<div class="headers" />' );
=======
	let headers = document.createElement( 'div' );
	headers.classList.add( 'headers' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
<<<<<<< HEAD
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	j = 0;
	offset = 100 / Math.ceil( kompassi_schedule.filters.date.length_hours );
	for( i = 0; i < Math.ceil( kompassi_schedule.filters.date.length_hours ); i++ ) {
<<<<<<< HEAD
		label = kompassi_schedule.filters.date.start.add( i, 'hour' ).format( 'H' );
		jQuery( '#kompassi_schedule' ).append( '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );" />' ); // + label + '</div>' );
		headers.append( '<div class="hint time_hint" style="left: calc( ' + offset + ' * ' + i + '%); width: ' + offset + '%;">' + label + '</div>' );
		if( label == '0' || i == 0 ) {
			day = kompassi_schedule.filters.date.start.add( j, 'day' ).format( 'LL' );
			headers.append( '<strong class="hint day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% ); z-index: ' + j + ';"><span>' + day + '</span></div>' );
=======
		let time_label = kompassi_schedule.filters.date.start.add( i, 'hour' ).format( 'H' );
		schedule.insertAdjacentHTML( 'beforeend', '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );"></div>' );
=======
	let days = 0;
	let offset = 100 / Math.ceil( kompassi_schedule.filters.date.length_hours );
	for( let hours = 0; i < Math.ceil( kompassi_schedule.filters.date.length_hours ); i++ ) {
		let time_label = kompassi_schedule.filters.date.start.add( hours, 'hour' ).format( 'H' );
		schedule.insertAdjacentHTML( 'beforeend', '<div class="ruler" style="top: var(--kompassi-schedule-timeline-row-height); left: calc( ' + offset + ' * ' + hours + '% ); width: calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 );"></div>' );
>>>>>>> 73dd98d (Rewrite as vanilla JS instead of jQuery, part 3)
		let hint = document.createElement( 'div' );
		hint.classList.add( 'hint', 'time_hint' );
		hint.style.left = 'calc( ' + offset + ' * ' + hours + '%)';
		hint.style.width = 'calc( ' + offset + '% - var(--kompassi-schedule-timeline-row-padding) * 2 )';
		hint.textContent = time_label;
		headers.appendChild( hint );
		if( time_label == '0' || hours == 0 ) {
			let day_label = kompassi_schedule.filters.date.start.add( days, 'day' ).format( 'LL' );
			let hint = document.createElement( 'strong' );
			hint.classList.add( 'hint', 'day_hint' );
			hint.style.top = 0;
			hint.style.left = 'calc( ' + offset + ' * ' + hours + '% )';
			hint.style.zIndex = days;
			let label = document.createElement( 'span' );
			label.textContent = day_label;
			hint.appendChild( label );
			headers.appendChild( hint );
<<<<<<< HEAD
>>>>>>> 46a54de (Rewrite as vanilla JS instead of jQuery, part 1)
			j += 1;
<<<<<<< HEAD
>>>>>>> 2f2776b (Fix: Programs visible behind/between timeline headers)
=======
=======
			days += 1;
>>>>>>> 73dd98d (Rewrite as vanilla JS instead of jQuery, part 3)
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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

<<<<<<< HEAD
<<<<<<< HEAD
function kompassi_schedule_timeline_update_time_indicator( ) { /* TODO: Not working? */
	let schedule = document.getElementById( 'kompassi_schedule' );

	let now = dayjs( );
	if( now >= kompassi_schedule.filters.date.start && now <= kompassi_schedule.filters.date.end ) {
		let current_offset = now.diff( kompassi_schedule.filters.date.start, 'minute' );
		let percentage_offset = current_offset / length * 100;

		let current = document.createElement( 'div' );
=======
function kompassi_schedule_timeline_update_time_indicator( ) {
	schedule = document.getElementById( 'kompassi_schedule' );
=======
function kompassi_schedule_timeline_update_time_indicator( ) { /* TODO: Not working? */
	let schedule = document.getElementById( 'kompassi_schedule' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)

	let now = dayjs( );
	if( now >= kompassi_schedule.filters.date.start && now <= kompassi_schedule.filters.date.end ) {
		let current_offset = now.diff( kompassi_schedule.filters.date.start, 'minute' );
		let percentage_offset = current_offset / length * 100;

<<<<<<< HEAD
		current = document.createElement( 'div' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let current = document.createElement( 'div' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		current.classList.add( 'current-time' );
		current.style.left = percentage_offset + '%';
		schedule.prepend( current );
	} else {
<<<<<<< HEAD
<<<<<<< HEAD
		let indicator = schedule.querySelector( '.current-time' );
=======
		indicator = schedule.querySelector( '.current-time' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let indicator = schedule.querySelector( '.current-time' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		if( indicator ) {
			indicator.remove( );
		}
	}

	kompassi_schedule.timeouts['current_time'] = setTimeout( kompassi_schedule_timeline_update_time_indicator, 60000 );
}

function kompassi_schedule_timeline_zoom( direction ) {
<<<<<<< HEAD
<<<<<<< HEAD
	let schedule = document.getElementById( 'kompassi_schedule' );
	let scale = schedule.dataset.scale;

   if( direction < 0 ) {
		scale += 0.5;
   } else if( direction > 0 ) {
		scale -= 0.5;
=======
	schedule = document.getElementById( 'kompassi_schedule' );
=======
	let schedule = document.getElementById( 'kompassi_schedule' );
	let scale = schedule.dataset.scale;

>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
   if( direction < 0 ) {
		scale += 0.5;
   } else if( direction > 0 ) {
<<<<<<< HEAD
		scale = schedule.dataset.scale - 0.5;
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		scale -= 0.5;
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
	let schedule = document.getElementById( 'kompassi_schedule' );
=======
	schedule = document.getElementById( 'kompassi_schedule' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let schedule = document.getElementById( 'kompassi_schedule' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	schedule.dataset.scale = scale;
	schedule.style.width = ( scale * 100 ) + '%';
	kompassi_schedule_timeline_reposition_labels( );
}

function kompassi_schedule_timeline_pan( direction_x, direction_y, ev ) {
	// ev.pointerType == 'mouse'
	let pan_speed_x = 20;
	let pan_speed_y = 10;

	if( direction_x !== 0 ) {
<<<<<<< HEAD
<<<<<<< HEAD
		let wrapper = document.getElementById( 'kompassi_schedule' ).querySelector( '.kompassi_schedule_wrapper' );
=======
		wrapper = document.getElementById( 'kompassi_schedule' ).querySelector( '.kompassi_schedule_wrapper' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let wrapper = document.getElementById( 'kompassi_schedule' ).querySelector( '.kompassi_schedule_wrapper' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		wrapper.scrollLeft = wrapper.scrollLeft + ( direction_x * pan_speed_x );
		kompassi_schedule_timeline_reposition_labels( );
	}
	if( direction_y !== 0 ) {
<<<<<<< HEAD
<<<<<<< HEAD
		let wrapper = window;
=======
		wrapper = window;
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let wrapper = window;
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		wrapper.scrollTop = parseInt( wrapper.scrollTop ) + ( direction_y * pan_speed_y );
	}
}

function kompassi_schedule_timeline_reposition_labels( ) {
	// Reposition headers
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	let day_hints = document.querySelectorAll( '#kompassi_schedule .day_hint' );
	for( let hint of day_hints ) {
		let scroll = hint.closest( '.kompassi_schedule_wrapper' ).scrollLeft;
		let offset = hint.offsetLeft;
<<<<<<< HEAD
=======
	day_hints = document.querySelectorAll( '#kompassi_schedule .day_hint' );
	for( hint of day_hints ) {
		content_width = hint.querySelector( 'span' ).offsetWidth;
		scroll = hint.closest( '.kompassi_schedule_wrapper' ).scrollLeft;
		offset = hint.offsetLeft;
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)

		if( scroll > offset ) {
			hint.style.paddingLeft = ( scroll - offset ) + 'px';
		} else {
			hint.style.paddingLeft = null;
		}
	}

	// Reposition program titles that are left of visible area
<<<<<<< HEAD
<<<<<<< HEAD
	let programs = document.getElementById( 'kompassi_schedule' ).querySelectorAll( 'article' );
	for( let program of programs ) {
		let program_pos = parseInt( program.style.left );

		if( !isNaN( program_pos ) && program_pos < scroll ) {
			let program_pad = scroll - program_pos;
=======
	for( program of document.querySelectorAll( '#kompassi_schedule article' ) ) {
		program_pos = parseInt( program.style.left );

		if( !isNaN( program_pos ) && program_pos < scroll ) {
			program_pad = scroll - program_pos;
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let programs = document.getElementById( 'kompassi_schedule' ).children;
	for( let program of programs ) {
		let program_pos = parseInt( program.style.left );

		if( !isNaN( program_pos ) && program_pos < scroll ) {
			let program_pad = scroll - program_pos;
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
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
<<<<<<< HEAD
<<<<<<< HEAD
	let schedule = document.getElementById( 'kompassi_schedule' );
	schedule.style.height = 'auto';
	let programs = schedule.querySelectorAll( 'article' );
	for( let program of programs ) {
=======
	schedule = document.getElementById( 'kompassi_schedule' );
	schedule.style.height = 'auto';
	for( program of schedule.querySelectorAll( 'article' ) ) {
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let schedule = document.getElementById( 'kompassi_schedule' );
	schedule.style.height = 'auto';
	let programs = schedule.children;
	for( let program of programs ) {
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		program.style.width = null;
		program.style.minWidth = null;
		program.style.left = null;
		program.style.top = null;
<<<<<<< HEAD
<<<<<<< HEAD
		let title = program.querySelector( '.title' );
=======
		title = program.querySelector( '.title' );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let title = program.querySelector( '.title' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
		title.style.left = null;
		title.style.position = null;
		title.style.marginLeft = null;
	}
<<<<<<< HEAD
<<<<<<< HEAD
	let elements = schedule.querySelectorAll( '.headers, .ruler, .group-name, .current-time' );
	for( let element of elements ) {
		element.remove( );
=======
	elements = schedule.querySelectorAll( '.headers, .ruler, .group-name, .current-time' );
	for( el of elements ) {
		el.remove( );
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
	let elements = schedule.querySelectorAll( '.headers, .ruler, .group-name, .current-time' );
	for( let element of elements ) {
		element.remove( );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
	}
	clearTimeout( kompassi_schedule.timeouts['current_time'] );
}

/**
 *  Opens program modal
 *
 *  @param {Object} program DOM object of the program number
 *
 */

function kompassi_schedule_program_modal( program ) {
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
	kompassi_show_modal( options );

	// Swipe
	let hammer_modal = new Hammer( document.getElementById( 'kompassi_modal' ), { touchAction: 'swipe' } );
	hammer_modal.on( 'swipe', function( ev ) {
		let modal = document.getElementById( 'kompassi_modal' );
<<<<<<< HEAD
<<<<<<< HEAD
		let current_program = modal.dataset.id;
		let open_program = null;
=======
		current_prog = modal.dataset.id;
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
=======
		let current_program = modal.dataset.id;
		let open_program = null;
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)

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
<<<<<<< HEAD
<<<<<<< HEAD
	programs = programs.split( ',' );
=======
	let programs = programs.split( ',' );
>>>>>>> c77b970 (Rewrite as vanilla JS instead of jQuery, part 3)
=======
	programs = programs.split( ',' );
>>>>>>> 22c60f2 (Small fixes)
	let valid_programs = [];
	for( let program of programs ) {
		let element = document.getElementById( program );
		if( element ) {
			valid_programs.push( element.querySelector( '.title' ).textContent );
		}
	}

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

/**
 *  Makes the timeline header sticky
 *
 */

function kompassi_schedule_timeline_sticky_header( ) {
<<<<<<< HEAD
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

=======
	schedule = document.getElementById( 'kompassi_block_schedule' );
	wrapper = schedule.querySelector( '.kompassi_schedule_wrapper' );
	headers = wrapper.querySelector( '.headers' );

	let schedule_top = schedule.offsetTop + wrapper.offsetTop;
	let schedule_bottom = schedule_top + wrapper.scrollHeight;
	let scroll = window.scrollY;
	let buffer = headers.offsetHeight;

>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
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
<<<<<<< HEAD
		if( filter.tagName == 'DIV' && filter.classList.contains( 'kompassi-dropdown' ) ) {
			let options = filter.querySelectorAll( 'input:checked' );
			let selected = [];
			for( let option of options ) {
				selected.push( option.value );
			}
			if( selected.length > 0 ) {
				opts.push( opt_name + ':' + selected.join( ',' ) );
			}
=======
		if( filter.tagName == 'SELECT' ) {
			if( filter.value.length > 0 ) {
				opts.push( opt_name + ':' + filter.value );
			}
>>>>>>> 93d549d (Rewrite as vanilla JS instead of jQuery, part 1)
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
