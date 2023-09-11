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
	block = jQuery( '#kompassi_block_programme' );

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
	 *  Populate attribute filter data
	 *  - Get every single unique value for specified attributes
	 *
	 */

	attribute_filters = [
		{ key: 'room_name', label: __( 'Room name', 'kompassi-integration' ) },
		{ key: 'category_title', label: __( 'Category', 'kompassi-integration' ) }
	];
	jQuery( attribute_filters ).each( function( index ) {
		values = [];
		jQuery( '#kompassi_programme article .' + this.key ).each( function( ) {
			values.push( jQuery( this ).text( ) );
		} );
		attribute_filters[index]['values'] = values.filter( filter_unique ).sort( );
	} );

	/*
	 *  Add actions markup for items
	 *
	 */

	jQuery( '#kompassi_programme article' ).each( function( ) {
		actions = jQuery( '<div class="actions" style="grid-area: actions;" />' );
		actions.append( '<button class="favorite" />' );
		jQuery( this ).find( '.description' ).before( actions );
	} );

	/*
	 *  Get date/time related information about programme
	 *  - Earliest starting time for programme
	 *  - Latest ending time for programme
	 *  - List of dates the programme spans through
	 *
	 */

	jQuery( '#kompassi_programme article' ).each( function( ) {
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

	toolbar = jQuery( '<section id="kompassi_programme_toolbar" />' );
	toolbar.prependTo( block );

	/*  Date filter  */
	/*  TODO: Only if multiday event  */
	select = jQuery( '<select class="filter filter-date" name="filter_date" />' );
	select.append( jQuery( '<option value="0">-- ' + __( 'All dates', 'kompassi-integration' ) + ' --</option>' ) );
	jQuery.each( dates, function( timestamp, label ) {
		select.append( jQuery( '<option value="' + timestamp + '">' + label + '</option>' ) );
	} );
	// toolbar.append( select );

	date_section = jQuery( '<section id="kompassi_programme_dates" />' );
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

	filters_section = jQuery( '<section id="kompassi_programme_filters" />' );
	toggle_favorites = jQuery( '<a class="favorites-toggle">' + __( 'Favorites', 'kompassi-integration' ) + '</a>' ).appendTo( filters_section );
	toggle_filters = jQuery( '<a class="filters-toggle">' + _x( 'Filter', 'verb (shown before filters)', 'kompassi-integration' ) + '<span class="indicator"></span></a>' ).appendTo( filters_section );
	filters_section.appendTo( toolbar );

	toggle_favorites.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		kompassi_apply_filters( );
	} );

	toggle_filters.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		jQuery( '#kompassi_programme_filter' ).toggle( );
	} );

	/*
	 *  Generate filter area markup
	 *  - Shown when filters toggle is active
	 *
	 */

	if( block.attr( 'data-show-filters' ) == 'true' ) {
		filters = jQuery( '<section id="kompassi_programme_filter" />' );

		//  Text filter
		filters.append( jQuery( '<input class="filter filter-text" name="filter_text" placeholder="' + __( 'Text search (title, description)', 'kompassi-integration' ) + '" />' ) );

		//  Single attribute filters
		jQuery.each( attribute_filters, function( ) {
			select = jQuery( '<select class="filter filter-attribute" name="filter_' + this.key + '" data-attribute="' + this.key + '" />' );
			select.append( jQuery( '<option value="0">-- ' + this.label + ' --</option>' ) );
			jQuery.each( this.values, function( index, value ) {
				select.append( jQuery( '<option value="' + value + '">' + value + '</option>' ) );
			} );
			filters.append( select );

			// Datalist approach
			/*
			input = jQuery( '<input class="filter datalist filter-attribute list="filter_' + this.key + '" list="filter_' + this.key + '" data-attribute="' + this.key + '" />' );
			datalist = jQuery( '<datalist id="filter_' + this.key + '" />' );
			datalist.append( jQuery( '<option value="0">-- ' + this.label + ' --</option>' ) );
			jQuery.each( this.values, function( index, value ) {
				datalist.append( jQuery( '<option value="' + value + '" />' ) );
			} );
			filters.append( input );
			filters.append( datalist );
			*/
		} );

		//  Show filters
		filters.insertAfter( toolbar );

		// Handle filtering
		filters.on( 'change', 'select.filter, .filter[type="checkbox"]', kompassi_apply_filters );
		filters.on( 'keyup', '.filter-text', kompassi_apply_filters );
	}

 	/*  Display style section  */

	if( block.attr( 'data-show-display-styles' ) == 'true' ) {
		styles = {
			'table': _x( 'Table', 'display style', 'kompassi-integration' ),
			'list': _x( 'List', 'display style', 'kompassi-integration' ),
			'expanded': _x( 'Expanded List', 'display style', 'kompassi-integration' ),
			'timeline': _x( 'Timeline', 'display style', 'kompassi-integration' )
		};
		ds = jQuery( '<section id="kompassi_programme_display" />' );
		jQuery.each( styles, function( style, label ) {
			link = jQuery( '<a class="' + style + '">&nbsp;<span>' + label + '</span></a>' );
			ds.append( link );
			if( jQuery( '#kompassi_programme' ).hasClass( style ) ) {
				link.addClass( 'active' );
			}
		} );
		toolbar.append( ds );

		// Change display type
		jQuery( '#kompassi_programme_display' ).on( 'click', 'a', function( ) {
			display_type = jQuery( this ).attr( 'class' );
			jQuery( '#kompassi_programme' ).removeClass( 'table list expanded timeline' ).addClass( jQuery( this ).attr( 'class' ) );
			kompassi_revert_timeline_layout( );
			if( kompassi_get_display_type( ) == 'timeline' ) {
				kompassi_setup_timeline_layout( );
			}

			jQuery( this ).addClass( 'active' );
			jQuery( '#kompassi_programme_display a:not(.' + display_type + ')' ).removeClass( 'active' );
		} );
	}

	// FAVORITES
	block.on( 'click', 'article.kompassi-programme .favorite', kompassi_toggle_favorite );
	if( block.attr( 'data-show-favorites-only' ) == 'true' ) {
		if( block.find( '.favorites-toggle' ) ) {
			block.find( '.favorites-toggle' ).addClass( 'active' ).trigger( 'click' );
		} else {
			// When filters are not enabled...
			jQuery( '#kompassi_programme article:not(.is-favorite)' ).addClass( 'hidden' );
		}
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
		clone.attr( 'id', 'kompassi_programme_modal' ).attr( 'style', '' ).addClass( 'kompassi_block_programme' );
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
	Cookies.set( 'kompassi_integration', JSON.stringify( cookie ), { expires: 365, sameSite: 'strict', secure: true } );
}

function kompassi_close_modal( ) {
	jQuery( '#kompassi_programme_modal_bg, #kompassi_programme_modal' ).remove( );
	jQuery( 'body' ).css( 'overflow', 'auto' );
}

// TODO: #6 - Get this value from filters?
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
			d = parseInt( time_start_filtered ) + ( i * 60 * 60 );
			jQuery( '#kompassi_programme' ).append( '<strong class="day_hint" style="top: 0; left: calc( ' + offset + ' * ' + i + '% );">' + kompassi_get_date_formatted( d ) + '</div>' );
		}
	}
}

function kompassi_apply_filters( ) {
	//  Show all
	jQuery( '#kompassi_programme article' ).removeClass( 'hidden multiday-overlap' );

	filter_count = 0;

	//  Iterate through each filter
	jQuery( '#kompassi_programme_filter .filter' ).each( function( index ) {
		filter = jQuery( this );

		// Attribute filters
		if( filter.hasClass( 'filter-attribute' ) ) {
			if( filter.val( ) !== '0' ) {
				jQuery( '#kompassi_programme article' ).filter( function( ) { return jQuery( this ).find( '.' + filter.attr( 'data-attribute' ) ).text( ) !== filter.val( ); } ).addClass( 'hidden' );
				// jQuery( '#kompassi_programme article:not([' + jQuery( this ).attr( 'data-attr' ) + '="' + this.value + '"])' ).addClass( 'hidden' );
				filter_count += 1;
			}
		}

		// Tag filters
		// TODO: #8

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
				filter_count += 1;
			}
		}
	} );

	// Date filter
	if( block.find( '.date-toggle.active' ).length > 0 ) {
		time_start_filtered = parseInt( block.find( '.date-toggle.active' ).first( ).attr( 'data-start-timestamp' ) );
		time_end_filtered = parseInt( block.find( '.date-toggle.active' ).first( ).attr( 'data-end-timestamp' ) );
		console.log( time_start_filtered, time_end_filtered );
		jQuery( '#kompassi_programme article' ).each( function( index ) {
			program = jQuery( this );
			program_start = parseInt( program.attr( 'data-start-timestamp' ) );
			program_end = parseInt( program.attr( 'data-end-timestamp' ) );
			if( program_start > time_end_filtered || program_end <= time_start_filtered ) {
				program.addClass( 'hidden' );
			}
			if( program_start < time_start_filtered && program_end > time_start_filtered ) {
				program.addClass( 'multiday-overlap' );
			}
			// TODO: When not on the timeline display, do not show multiday programmes?
		} );
		date_filtered = true;
	} else {
		date_filtered = false;
	}

	if( filter_count > 0 ) {
		block.find( '.filters-toggle .indicator' ).text( filter_count );
	} else {
		block.find( '.filters-toggle .indicator' ).empty( );
	}

	// Favorite filter
	if( block.find( '.favorites-toggle' ).hasClass( 'active' ) ) {
		jQuery( '#kompassi_programme article:not(.is-favorite)' ).addClass( 'hidden' );
	}

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
	popover = jQuery( '<div id="kompassi_programme_popover" class="kompassi_block_programme" />' );
	markup = '<div class="title">' + jQuery( program ).find( '.title' ).html( ) + '</div>';
	markup += jQuery( program ).find( '.times' ).prop( 'outerHTML' );
	popover.html( markup );
	jQuery( 'body' ).append( popover );
	offset_top = parseInt( jQuery( program ).offset( ).top ) - parseInt( jQuery( window ).scrollTop( ) );
	popover.css( 'top', 'calc( ' + offset_top + 'px - ' + popover.outerHeight( ) + 'px - 0.5em )' );
	popover.css( 'left', 'calc( ' + posX + 'px - ' + popover.outerWidth( ) / 2  + 'px )');
}

//  Helper functions
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
	if( jQuery( a ).find( '.' + grouping ).text( ) > jQuery( b ).find( '.' + grouping ).text( ) ) {
		return 1;
	}
	return -1;
}

function filter_unique( value, index, array ) {
  return array.indexOf( value ) === index;
}
