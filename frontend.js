__ = wp.i18n.__;
_x = wp.i18n._x;
_n = wp.i18n._n;
var display_type = '';
var time_start = 0;
var time_end = 0;
var time_total = 0;
var dates = {};
var date_filtered = false;
var popover_timeout = '';
var cookie;
var filter_count_total = 0;
var timeline_grouping = 'room_name';
var url_opts = new URLSearchParams( window.location.search );

jQuery( function( e ) {
	block = jQuery( '#kompassi_block_schedule' );

	/*
	 *  Set up cookie for user preferences, including favorites
	 *
	 */

	cookie = Cookies.get( 'kompassi_integration' );
	if( cookie == undefined ) {
		cookie = { favorites: [] };
		Cookies.set( 'kompassi_integration', JSON.stringify( cookie ), { expires: 365, sameSite: 'strict', secure: true } );
	} else {
		cookie = JSON.parse( cookie );
		jQuery.each( cookie.favorites, function( ) {
			jQuery( '#' + this ).addClass( 'is-favorite' );
		} );
	}

	/*
	 *  Add actions markup for items
	 *
	 */

	jQuery( '#kompassi_schedule article' ).each( function( ) {
		actions = jQuery( '<div class="actions" style="grid-area: actions;" />' );
		actions.append( '<button class="favorite" />' );
		jQuery( this ).find( '.description' ).before( actions );
	} );

	/*
	 *  Get date/time related information about program
	 *  - Earliest starting time for program
	 *  - Latest ending time for program
	 *  - List of dates the program spans through
	 *
	 */

	jQuery( '#kompassi_schedule article' ).each( function( ) {
		if( time_start == 0 ) {
			time_start = jQuery( this ).attr( 'data-start-timestamp' );
		}
		if( time_end < jQuery( this ).attr( 'data-end-timestamp' ) ) {
			time_end = jQuery( this ).attr( 'data-end-timestamp' );
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

	// Get list of dates
	i = ts.setHours( 0 ).valueOf( ) / 1000;
	while( i < time_end ) {
		dates[i] = kompassi_get_date_formatted( i, false );
		i += 24 * 60 * 60;
	}

	/*
	 *  Generate toolbar markup
	 *
	 */

	toolbar = jQuery( '<section id="kompassi_schedule_toolbar" />' );
	toolbar.prependTo( block );

	/*  Date filter  */
	/*  TODO: Now #17  */
	date_section = jQuery( '<section id="kompassi_schedule_dates" />' );
	jQuery.each( dates, function( timestamp, label ) {
		timestamp_start = parseInt( timestamp );
		timestamp_end = timestamp_start + ( 24 * 60 * 60 );
		date_toggle = jQuery( '<a class="date-toggle no-icon" data-start-timestamp="' + timestamp_start + '" data-end-timestamp="' + timestamp_end + '">' + label + '</a>' );
		date_toggle.on( 'click', function( ) {
			if( jQuery( this ).hasClass( 'active' ) ) {
				jQuery( this ).removeClass( 'active' );
			} else {
				date_section.find( '.date-toggle' ).removeClass( 'active' );
				jQuery( this ).addClass( 'active' );
			}
			kompassi_apply_filters( );
		} );
		date_section.append( date_toggle );
	} );

	date_section.appendTo( toolbar );

	/*  Filter section  */
	filters_section = jQuery( '<section id="kompassi_schedule_filters" />' );
	toggle_favorites = jQuery( '<a class="favorites-toggle">' + __( 'Favorites', 'kompassi-integration' ) + '</a>' ).appendTo( filters_section );
	toggle_filters = jQuery( '<a class="filters-toggle">' + _x( 'Filter', 'verb (shown before filters)', 'kompassi-integration' ) + '<span class="indicator"></span></a>' ).appendTo( filters_section );
	filters_section.appendTo( toolbar );

	toggle_favorites.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		kompassi_apply_filters( );
	} );

	// Toggle favorites from URL options
	if( url_opts.has( 'favorites' ) ) {
		if( !jQuery( '.favorites-toggle' ).hasClass( 'active' ) ) {
			jQuery( '.favorites-toggle' ).trigger( 'click' );
		}
	}

	toggle_filters.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		jQuery( '#kompassi_schedule_filter' ).toggle( );
	} );

	/*
	 *  Generate filter popup
	 *  - Shown when filters toggle is active
	 *
	 */

	if( block.attr( 'data-show-filters' ) == 'true' ) {
		filters = jQuery( '<section id="kompassi_schedule_filter" />' );

		//  Text filter
		filters.append( jQuery( '<input class="filter filter-text" name="filter_text" placeholder="' + __( 'Text search (title, description)', 'kompassi-integration' ) + '" />' ) );

		//  Dimension filters
		//  TODO: Possibility to hide dimensions from this list
		jQuery.each( kompassi_schedule_dimensions, function( dimension_slug, dimension ) {
			select = jQuery( '<select class="filter filter-dimension" name="filter_' + dimension_slug + '" data-dimension="' + dimension_slug + '" />' );
			select.append( jQuery( '<option value="0">-- ' + dimension.display_name + ' --</option>' ) );
			jQuery.each( this.values, function( value_slug, data ) {
				select.append( jQuery( '<option value="' + value_slug + '">' + data.display_name + '</option>' ) );
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
		filters.on( 'keyup', '.filter-text', kompassi_apply_filters );
	}

	/*  Show event count  */
	jQuery( '<section id="kompassi_event_count" />' ).appendTo( toolbar );
	kompassi_update_event_count( );

 	/*
 	 *  Display styles
 	 *
 	 */

	if( block.attr( 'data-show-display-styles' ) == 'true' ) {
		styles = {
			'list': _x( 'List', 'display style', 'kompassi-integration' ),
			'timeline': _x( 'Timeline', 'display style', 'kompassi-integration' )
		};
		ds = jQuery( '<section id="kompassi_schedule_display" />' );
		jQuery.each( styles, function( style, label ) {
			link = jQuery( '<a class="' + style + '">&nbsp;<span>' + label + '</span></a>' );
			ds.append( link );
			if( jQuery( '#kompassi_schedule' ).hasClass( style ) ) {
				link.addClass( 'active' );
			}
		} );
		toolbar.append( ds );
		if( url_opts.has( 'display' ) && Object.keys( styles ).indexOf( url_opts.get( 'display' ) ) > -1 ) {
			kompassi_setup_display( url_opts.get( 'display' ) );
		}

		// Change display type
		jQuery( '#kompassi_schedule_display' ).on( 'click', 'a', function( ) {
			if( jQuery( this ).hasClass( 'active' ) ) {
				return;
			}

			kompassi_setup_display( jQuery( this ).attr( 'class' ) );
		} );
	}

	// FAVORITES
	jQuery( 'body' ).on( 'click', 'article.kompassi-program .favorite', kompassi_toggle_favorite );
	if( block.attr( 'data-show-favorites-only' ) == 'true' ) {
		if( block.find( '.favorites-toggle' ) ) {
			block.find( '.favorites-toggle' ).addClass( 'active' ).trigger( 'click' );
		} else {
			// When filters are not enabled...
			jQuery( '#kompassi_schedule article:not(.is-favorite)' ).addClass( 'filtered' );
		}
	}

	/*
	 *  Popover for program
	 *
	 */

	jQuery( '#kompassi_schedule article' ).on( 'mouseover', function( e ) {
		if( !jQuery( '#kompassi_schedule' ).hasClass( 'timeline' ) ) {
			return;
		}
		clearTimeout( popover_timeout );
		popover_timeout = setTimeout( kompassi_popover, 300, this, e.pageX );
	} );
	jQuery( '#kompassi_schedule article' ).on( 'mouseout', function( e ) {
		clearTimeout( popover_timeout );
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
		modal = jQuery( this ).clone( );
		modal.attr( 'id', 'kompassi_modal' ).attr( 'style', '' ).addClass( 'kompassi_block_schedule' );
		modal.find( '.actions' ).append( '<button class="close" />' );

		modal.children( '.short_blurb, .visual' ).remove( );
		modal.children( '.title, .room_name, .times, .actions' ).wrapAll( '<div class="modal_header" />' );
		modal.children( ':not(.modal_header, .description)' ).wrapAll( '<div class="modal_footer" />' );

		modal.appendTo( jQuery( 'body' ) );
		jQuery( 'body' ).append( '<div id="kompassi_modal_bg" />' ).css( 'overflow', 'hidden' );

		kompassi_setup_modal_layout( );
	} );

	// Resetup modal layout on resize
	jQuery( window ).on( 'resize', kompassi_setup_modal_layout );

	// Close modals when clicking on modal bg or close button or when pressing Esc
	jQuery( 'body' ).on( 'click', '#kompassi_schedule_modal_bg, #kompassi_modal .actions .close', kompassi_close_modal );
	jQuery( 'body' ).on( 'keyup', function( e ) {
		if( e.keyCode == 27 ) {
			kompassi_close_modal( e );
		}
	} );

	kompassi_setup_display( );
} );

/*
 *  Filter: Toggle Favorites
 *
 */

function kompassi_toggle_favorite( ) {
	art_id = jQuery( this ).closest( 'article.kompassi-program' ).attr( 'data-id' );
	jQuery( 'article.kompassi-program[data-id="' + art_id + '"]' ).toggleClass( 'is-favorite' );
	if( cookie.favorites.includes( art_id ) ) {
		cookie.favorites = cookie.favorites.filter( function( id ) { return id !== art_id; } );
	} else {
		cookie.favorites.push( art_id );
	}
	Cookies.set( 'kompassi_integration', JSON.stringify( cookie ), { expires: 365, sameSite: 'strict', secure: true } );
}

/*
 *  Get and show (visible) event count
 *
 */

function kompassi_update_event_count( ) {
	event_count = jQuery( '#kompassi_schedule article:not(.filtered)' ).length;
	if( filter_count_total > 0 ) {
		// translators: count of programmes visible
		event_count_label = _n( '%s programme visible', '%s programmes visible', event_count, 'kompassi-integration' );
	} else {
		// translators: count of programmes
		event_count_label = _n( '%s programme', '%s programmes', event_count, 'kompassi-integration' );
	}
	event_count_label = event_count_label.replace( '%s', event_count );
	jQuery( '#kompassi_schedule_toolbar #kompassi_event_count' ).html( event_count_label );
}

/*
 *  Setup display
 *
 */

function kompassi_setup_display( display_type = false ) {
	if( display_type === false ) {
		display_type = kompassi_get_display_type( );
	}

	jQuery( '#kompassi_schedule' ).removeClass( 'table list expanded timeline' ).addClass( display_type );
	if( display_type == 'timeline' ) {
		kompassi_setup_timeline_layout( );
		jQuery( '.kompassi-filter-note.not-timeline' ).hide( );
	} else {
		kompassi_revert_timeline_layout( );
		jQuery( '.kompassi-filter-note.not-timeline' ).show( );
	}

	jQuery( '#kompassi_schedule_display a' ).removeClass( 'active' );
	jQuery( '#kompassi_schedule_display a.' + display_type ).addClass( 'active' );
}

/*
 *  Timeline: Setup layout
 *
 */

function kompassi_setup_timeline_layout( ) {
	rows = [ 'day hints', 'time hints' ];

	prev_group = '';
	var grouping_row = 1;

	jQuery( '#kompassi_schedule article' ).sort( kompassi_sort_by_group ).each( function( index ) {
		p = jQuery( this );
		if( p.hasClass( 'filtered' ) ) {
			return;
		}

		added = false;

		if( date_filtered ) {
			// time_start_filtered = jQuery( '[name="filter_date"]' ).val( );
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
		// TODO: #7 – If favorites enabled...

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
		if( p.find( '.' + timeline_grouping ).text( ) != prev_group ) {
			rows.push( 'group: ' + p.find( '.' + timeline_grouping ).text( ) );
			group = jQuery( '<p class="group-name">' + p.find( '.' + timeline_grouping ).text( ) + '</p>' );
			grouping_row = rows.length - 1;
			group.css( 'top', 'calc( ' + grouping_row + ' * var(--kompassi-program-timeline-row-height)' );
			jQuery( '#kompassi_schedule' ).append( group );
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
		p.css( 'top', 'calc( ' + rownum + ' * var(--kompassi-program-timeline-row-height)' );
		if( offset < 0 ) {
			p.find( '.title' ).css( 'position', 'absolute' ).css( 'left', ( ( -1 * p.position( ).left ) + 6 ) + 'px' );
		}

		prev_group = p.find( '.' + timeline_grouping ).text( );
	} );

	jQuery( '#kompassi_schedule' ).css( 'height', 'calc( var(--kompassi-program-timeline-row-height) * ' + ( rows.length ) + ' )' )

	first_hour = new Date( time_start_filtered * 1000 ).getHours( );
	for( i = 0; i < Math.ceil( time_total_filtered / 60 / 60 ); i++ ) {
		offset = 100 / Math.ceil( time_total_filtered / 60 / 60 );
		label = i + first_hour;
		label = label % 24;
		if( label < 10 ) {
			label = '0' + label;
		}
		jQuery( '#kompassi_schedule' ).append( '<div class="ruler" style="top: var(--kompassi-program-timeline-row-height); left: calc( ' + offset + ' * ' + i + '% ); width: calc( ' + offset + '% )">' + label + '</div>' );
		if( label == '00' || i == 0 ) {
			d = parseInt( time_start_filtered ) + ( i * 60 * 60 );
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
 *  Filters: Apply
 *
 */

function kompassi_apply_filters( ) {
	//  Show all and remove notification if exists
	jQuery( '#kompassi_schedule article' ).removeClass( 'filtered multiday-overlap' );
	jQuery( '.kompassi-filter-note' ).remove( );

	filter_count = 0;
	filter_count_total = 0;

	//  Iterate through each filter
	jQuery( '#kompassi_schedule_filter .filter' ).each( function( index ) {
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
				jQuery( '#kompassi_schedule' ).before( '<div class="kompassi-filter-note not-timeline">' + __( 'Search results are sorted by relevance, not chronologically, when using text search.', 'kompassi-integration' ) + '</div>' );
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

	filter_count_total = filter_count;

	// Date filter
	if( block.find( '.date-toggle.active' ).length > 0 ) {
		time_start_filtered = parseInt( block.find( '.date-toggle.active' ).first( ).attr( 'data-start-timestamp' ) );
		time_end_filtered = parseInt( block.find( '.date-toggle.active' ).first( ).attr( 'data-end-timestamp' ) );
		jQuery( '#kompassi_schedule article' ).each( function( index ) {
			program = jQuery( this );
			program_start = parseInt( program.attr( 'data-start-timestamp' ) );
			program_end = parseInt( program.attr( 'data-end-timestamp' ) );
			if( program_start > time_end_filtered || program_end <= time_start_filtered ) {
				program.addClass( 'filtered' );
			}
			if( program_start < time_start_filtered && program_end > time_start_filtered ) {
				program.addClass( 'multiday-overlap' );
			}
		} );
		date_filtered = true;
		filter_count_total += 1;
	} else {
		date_filtered = false;
	}

	// Favorite filter
	if( block.find( '.favorites-toggle' ).hasClass( 'active' ) ) {
		jQuery( '#kompassi_schedule article:not(.is-favorite)' ).addClass( 'filtered' );
		filter_count_total += 1;
	}

	//  If on timeline, refresh the layout
	if( kompassi_get_display_type( ) == 'timeline' ) {
		kompassi_revert_timeline_layout( );
		kompassi_setup_timeline_layout( );
	}

	// If there is no program that matches the search, show notification
	if( jQuery( '#kompassi_schedule article:not(.filtered)' ).length == 0 ) {
		jQuery( '#kompassi_schedule' ).before( '<div class="kompassi-filter-note">' + __( 'Nothing matched your search!', 'kompassi-integration' ) + '</div>' );
	}

	// If there is no text search and there is a date search, and there is programmes that have started before the filtered timerange, show notification
	if( date_filtered ) {
		if( jQuery( '#kompassi_schedule_filter [name="filter_text"]' ).val( ).length < 1 && jQuery( '#kompassi_schedule article.multiday-overlap' ).length > 0 ) {
			jQuery( '#kompassi_schedule' ).before( '<div class="kompassi-filter-note not-timeline">' + __( 'Programmes which have started before the filtered timerange are listed at the end of the results.', 'kompassi-integration' ) + '<a href="#kompassi_programmes_still_continuing">' + ' ' + _x( 'Jump there!', 'link to another position in the page', 'kompassi-integration') + '</a></div>' );
			jQuery( '#kompassi_schedule article.multiday-overlap' ).first( ).before( '<h3 class="kompassi-filter-note not-timeline" id="kompassi_programmes_still_continuing"">' + __( 'Programmes still continuing', 'kompassi-integration' ) + '</h3>' );
		}
		// TODO: Show how many programmes from other days are not shown?
	}

	//
	if( filter_count_total > 0 ) {
		jQuery( '#kompassi_schedule_filter .clear-filters' ).show( );
	} else {
		jQuery( '#kompassi_schedule_filter .clear-filters' ).hide( );
	}

	kompassi_update_event_count( );
}

/*
 *  Modal
 *
 */

function kompassi_setup_modal_layout( ) {
	modal = jQuery( '#kompassi_modal' );
	head = modal.children( '.modal_header' );
	foot = modal.children( '.modal_footer' );
	desc = modal.children( '.description' );
	head.css( 'width', modal.width( ) );
	foot.css( 'bottom', '0' ).css( 'width', modal.width( ) );
	desc.css( 'margin-top', head.outerHeight( ) );
	desc.css( 'margin-bottom', foot.outerHeight( ) );
	desc.css( 'height', modal.outerHeight( ) - head.outerHeight( ) - foot.outerHeight( ) );
}

/*
 *  Modal: Close
 *
 */

function kompassi_close_modal( ) {
	jQuery( '#kompassi_modal_bg, #kompassi_modal' ).remove( );
	jQuery( 'body' ).css( 'overflow', 'auto' );
}

/*
 *  Show popover
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

//  Helper functions
function kompassi_get_display_type( display_type = '' ) {
	if( display_type !== '' ) {
		return display_type;
	} else {
//		if( jQuery( '#kompassi_schedule' ).hasClass( 'table' ) ) { display_type = 'table'; }
		if( jQuery( '#kompassi_schedule' ).hasClass( 'list' ) ) { display_type = 'list'; }
//		if( jQuery( '#kompassi_schedule' ).hasClass( 'expanded' ) ) { display_type = 'expanded'; }
		if( jQuery( '#kompassi_schedule' ).hasClass( 'timeline' ) ) { display_type = 'timeline'; }
	}
	return display_type;
}

function kompassi_get_date_formatted( timestamp, weekday = true ) {
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
	if( weekday == true ) {
		return dayNames[datetime_obj.getDay( )] + ' ' + datetime_obj.getDate( ) + '.' + ( datetime_obj.getMonth( ) + 1 ) + '.';
	} else {
		return datetime_obj.getDate( ) + '.' + ( datetime_obj.getMonth( ) + 1 ) + '.';
	}
}

function kompassi_sort_by_group( a, b ) {
	if( jQuery( a ).find( '.' + timeline_grouping ).text( ) > jQuery( b ).find( '.' + timeline_grouping ).text( ) ) {
		return 1;
	}
	return -1;
}

function filter_unique( value, index, array ) {
  return array.indexOf( value ) === index;
}
