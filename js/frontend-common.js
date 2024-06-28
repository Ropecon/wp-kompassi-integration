var kompassi_cookie;

/*
 *  Cookie
 *
 */

kompassi_cookie = Cookies.get( 'kompassi_integration' );
if( kompassi_cookie == undefined ) {
	kompassi_cookie = {
		favorites: []
	};
	Cookies.set( 'kompassi_integration', JSON.stringify( kompassi_cookie ), { expires: 365, sameSite: 'strict', secure: true } );
} else {
	kompassi_cookie = JSON.parse( kompassi_cookie );
}

/*
 *  Modal
 *
 */

/*  Open  */

function kompassi_show_modal( options ) {
	modal = jQuery( '<div id="kompassi_modal" />' );
	if( typeof options.attrs == 'object' && Object.keys(options.attrs).length > 0 ) {
		for( [attr, value] of Object.entries( options.attrs ) ) {
			modal.attr( attr, value );
		}
	}
	header = jQuery( '<div class="header" />' ).appendTo( modal );
	title = jQuery( '<div class="title">' + options.title + '</div>' ).appendTo( header );
	header_actions = jQuery( '<div class="actions" />' ).appendTo( header );
	// header_actions from options
	header_actions.append( '<a class="close kompassi-icon-close" title="' + _x( 'Close', 'button label', 'kompassi-integration' ) + '" />' );
	content = jQuery( '<div class="content" />' ).appendTo( modal );
	if( typeof options.actions !== 'undefined' ) {
		content.append( '<div class="actions kompassi-button-group has-icon-and-label">' + options.actions + '</div>' );
	}
	content.append( '<div class="main">' + options.content + '</div>' );
	if( typeof options.meta !== 'undefined' ) {
		content.append( '<div class="meta">' + options.meta + '</div>' );
	}

	modal.appendTo( jQuery( 'body' ) );
	jQuery( 'body' ).append( '<div id="kompassi_modal_bg" />' ).css( 'overflow', 'hidden' );

	return;
}

/*  Close  */

function kompassi_close_modal( ) {
	jQuery( '#kompassi_modal_bg, #kompassi_modal' ).remove( );
	jQuery( 'body' ).css( 'overflow', 'auto' );
}

/*
 *  Popover
 *
 */

function kompassi_popover( options, event, element ) {
	popover = jQuery( '<div id="kompassi_popover" />' );
	popover.append( '<p><strong>' + options.title + '</strong></p>' );
	popover.append( '<p>' + options.content + '</p>' );

	jQuery( 'body' ).append( popover );

	offset_top = parseInt( jQuery( element ).offset( ).top ) - parseInt( jQuery( window ).scrollTop( ) );
	popover.css( 'top', 'calc( ' + offset_top + 'px - ' + popover.outerHeight( ) + 'px - 0.5em )' );
	popover.css( 'left', 'calc( ' + event.pageX + 'px - ' + popover.outerWidth( ) / 2  + 'px )');

}

/*
 *  Get URL options
 *
 */

function kompassi_get_url_options( ) {
	url_options = {};
	hash = new URL( window.location ).hash.substring( 1 ).split( '/' );
	jQuery( hash ).each( function( opt_pair ) {
		opt = this.split( ':' );
		if( !opt[1] ) {
			url_options[opt[0]] = true;
		} else {
			url_options[opt[0]] = opt[1];
		}
	} );
	return url_options;
}

/*
 *  Push options to URL
 *
 */

function kompassi_set_url_options( opts = [] ) {
	window.location.hash = opts.join( '/' );
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
 */

function filter_unique( value, index, array ) {
	 return array.indexOf( value ) === index;
}
