var kompassi_common = {};

/*
 *  localStorage
 *
 */

var kompassi_storage;

kompassi_storage = localStorage.getItem( 'kompassi_' + kompassi_common.event_slug );
if( kompassi_storage == null ) {
	kompassi_storage = {};
	kompassi_storage = wp.hooks.applyFilters( 'kompassi_init_storage', kompassi_storage );
} else {
	kompassi_storage = JSON.parse( kompassi_storage );
}

function kompassi_update_storage( ) {
	localStorage.setItem( 'kompassi_' + kompassi_common.event_slug, JSON.stringify( kompassi_storage ) );
}

/*
 *  Dropdown menu
 *
 */

function kompassi_dropdown_menu( menu_items, options = {} ) {
	if( typeof options.title == 'undefined' ) {
		options.title = __( 'More actions', 'kompassi-integration' );
	}
	if( typeof options.icon == 'undefined' ) {
		options.icon = 'kompassi-icon-ellipsis';
	} else {
		options.icon = 'kompassi-icon-' + options.icon;
	}
	if( typeof options.id == 'undefined' ) {
		id = '';
	} else {
		id = 'id="' + options.id + '"';
	}

	menu = jQuery( '<section ' + id + ' class="kompassi-dropdown-menu" />' );
	menu_button = jQuery( '<a class="' + options.icon + '" title="' + options.title + '" />' );
	menu.append( menu_button );
	list = jQuery( '<ul class="kompassi-dropdown-menu-items" />' );
	Object.keys( menu_items ).forEach( function( item ) {
		list_item = jQuery( '<li><a>' + menu_items[item].label + '</a></li>' );
		list.append( list_item );
		list_item.on( 'click', menu_items[item].callback );
		list_item.on( 'click', function( ) {
			jQuery( this ).closest( '.kompassi-dropdown-menu' ).children( 'a' ).removeClass( 'active' );
			jQuery( this ).closest( '.kompassi-dropdown-menu' ).removeClass( 'open' );
		} );
	} );
	menu.append( list );

	menu_button.on( 'click', function( ) {
		jQuery( this ).toggleClass( 'active' );
		jQuery( this ).parent( ).toggleClass( 'open' );
	} );
	return menu;
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
	modal.addClass( 'kompassi-integration' );

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
	if( typeof options.footer !== 'undefined' ) {
		content.append( '<div class="footer">' + options.footer + '</div>' );
	}

	modal.appendTo( jQuery( 'body' ) );
	jQuery( 'body' ).css( { 'overflow': 'hidden', 'user-select': 'none' } ).append( '<div id="kompassi_modal_underlay" />' );
}

/*  Close  */

function kompassi_close_modal( ) {
	jQuery( '#kompassi_modal_underlay, #kompassi_modal' ).remove( );
	jQuery( 'body' ).css( { 'overflow': 'auto', 'user-select': '' } );
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
 *
 */

function filter_unique( value, index, array ) {
	 return array.indexOf( value ) === index;
}

/*
 *  Copies the href of given link to clipboard
 *
 */

async function kompassi_href_to_clipboard( event, link ) {
	try {
		await navigator.clipboard.writeText( link.getAttribute( 'href' ) );
	} catch( error ) {
		console.log( error );
	}
	event.preventDefault( );
}

/*
 *  Run an AJAX query with default options and retries on error
 *
 */

function kompassi_ajax_query( opts ) {
	kompassi_ajax_opts = {
		type: 'GET',
		retryLimit: 3,
		data: { },
		beforeSend: function( xhr ) {
			// TODO: Allow overriding default nonce for extra security
			// xhr.setRequestHeader( 'X-WP-Nonce', kompassi_common.rest_nonce );
		},
		error: function( xhr, textStatus, errorThrown ) {
			this.retryLimit--;
			if( this.retryLimit ) {
				jQuery.ajax( this );
				return;
			} else {
				console.log( errorThrown );
				/*  On errors, the "real" action should be a function in .errorAction  */
				if( this.errorAction instanceof Function ) {
					this.errorAction( );
				}
			}
			return;
		},
		errorActionMessage: __( 'Error processing AJAX query.', 'kompassi-integration' ),
	}

	/*  Prepend REST URL base to rest_route  */
	opts.url = kompassi_common.rest_url_base + opts.rest_route;

	/*  Fire AJAX query  */
	return jQuery.ajax( Object.assign( kompassi_ajax_opts, opts ) );
}

/*
 *  Check if the computed background color for given element matches the background color
 *  If yes, add the class "fix-bg-contrast" to switch to a different color
 *
 */

function kompassi_check_bg_contrast( elem ) {
	original = elem;
	if( elem.length == 1 ) {
		ourBackgroundColor = window.getComputedStyle( elem[0] ).getPropertyValue( '--kompassi-bg' );
		do {
			cs = window.getComputedStyle( elem[0] );
			if( cs.background != 'none' ) {
				if( cs.backgroundColor == ourBackgroundColor ) {
					original.addClass( 'fix-bg-contrast' );
				}
			} else {
				elem = elem.parent( );
			}
		} while( cs.background == 'none' );
	}
}

/*
 *  Detect whether modifier keys are pressed
 *
 */

jQuery( function( e ) {
	jQuery( window ).on( 'keydown', function( e ) {
		if( e.keyCode == 16 ) {
			kompassi_common.shift_pressed = true;
		}
	} );
	jQuery( window ).on( 'keyup', function( e ) {
		if( e.keyCode == 16 ) {
			kompassi_common.shift_pressed = false;
		}
	} );
} );
