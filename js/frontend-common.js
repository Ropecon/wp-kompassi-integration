/*
 *  localStorage
 *
 */

let kompassi_storage;

kompassi_storage = localStorage.getItem( 'kompassi_' + kompassi_common.event_slug );
if( kompassi_storage == null ) {
	kompassi_storage = {};
	kompassi_storage = wp.hooks.applyFilters( 'kompassi_init_storage', kompassi_storage );
	kompassi_storage['favorites'] = []; // TODO
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
	let id = '';

	if( typeof options.title == 'undefined' ) {
		options.title = __( 'More actions', 'kompassi-integration' );
	}
	if( typeof options.icon == 'undefined' ) {
		options.icon = 'kompassi-icon-ellipsis';
	} else {
		options.icon = 'kompassi-icon-' + options.icon;
	}
	if( typeof options.id != 'undefined' ) {
		id = 'id="' + options.id + '"';
	}

	let menu = document.createElement( 'section' );
	menu.id = id;
	menu.classList.add( 'kompassi-dropdown-menu' );
	let menu_button = document.createElement( 'a' );
	menu_button.classList.add( options.icon );
	menu_button.title = options.title;
	menu.append( menu_button );

	let list = document.createElement( 'ul' );
	list.classList.add( 'kompassi-dropdown-menu-items' );
	for( let item in menu_items ) {
		let list_item = document.createElement( 'li' );
		let list_link = document.createElement( 'a' );
		list_link.textContent = menu_items[item].label;
		list_item.append( list_link );
		list.append( list_item );

		list_item.addEventListener( 'click', menu_items[item].callback );
		list_item.addEventListener( 'click', function( event ) {
//			let links = this.closest( '.kompassi-dropdown-menu' ).children;
//			for( let link of links ) {
//				link.classList.remove( 'active' );
//			}
			this.closest( '.kompassi-dropdown-menu' ).classList.remove( 'open' );
		} );
	}

	menu.append( list );

	menu_button.addEventListener( 'click', function( event ) {
		this.classList.toggle( 'active' );
		this.closest( 'section' ).classList.toggle( 'open' );
	} );

	return menu;
}

/*
 *  Modal
 *
 */

/*  Open  */

function kompassi_show_modal( options ) {
	let modal = document.createElement( 'div' );
	modal.id = 'kompassi_modal';
	if( typeof options.attrs == 'object' && Object.keys(options.attrs).length > 0 ) {
		for( let attr in options.attrs ) {
			modal.setAttribute( attr, options.attrs[attr] );
		}
	}
	modal.classList.add( 'kompassi-integration' );

	let header = document.createElement( 'div' );
	header.classList.add( 'header' );
	modal.append( header );

	let title = document.createElement( 'div' );
	title.classList.add( 'title' );
	title.textContent = options.title;
	header.append( title );

	let header_actions = document.createElement( 'div' );
	header.append( header_actions );
	// TODO: header_actions from options ?
	let close = document.createElement( 'a' );
	close.classList.add( 'close', 'kompassi-icon-close' );
	close.textContent = _x( 'Close', 'button label', 'kompassi-integration' );
	header_actions.append( close );

	let content = document.createElement( 'div' );
	content.classList.add( 'content' );
	modal.append( content );

	if( typeof options.actions !== 'undefined' ) {
		let content_actions = document.createElement( 'div' );
		content_actions.classList.add( 'actions', 'kompassi-button-group', 'has-icon-and-label' );
		content_actions.innerHTML = options.actions;
		content.append( content_actions );
	}

	let main = document.createElement( 'div' );
	main.classList.add( 'main' );
	main.innerHTML = options.content;
	content.append( main );

	if( typeof options.footer !== 'undefined' ) {
		let footer = document.createElement( 'div' );
		footer.classList.add( 'footer' );
		footer.innerHTML = options.footer;
		content.append( footer );
	}

	document.body.append( modal );
	document.body.style.overflow = 'hidden';
	document.body.style.userSelect = 'none';

	let underlay = document.createElement( 'div' );
	underlay.id = 'kompassi_modal_underlay';
	document.body.append( underlay );
}

/*  Close  */

function kompassi_close_modal( ) {
	let modal = document.getElementById( 'kompassi_modal' );
	if( modal ) {
		modal.remove( );
	}

	let underlay = document.getElementById( 'kompassi_modal_underlay')
	if( underlay ) {
		underlay.remove( );
	}

	document.body.style.overflow = 'auto';
	document.body.style.userSelect = null;
}

/*
 *  Popover
 *
 */

function kompassi_popover( options, event, element ) {
	let popover = document.createElement( 'div' );
	popover.id = 'kompassi_popover';
	popover.classList.add( 'kompassi-integration' );
	popover.insertAdjacentHTML( 'beforeend', '<p><strong>' + options.title + '</strong></p><p>' + options.content + '</p>' );

	document.body.append( popover );

	offset_top = parseInt( jQuery( element ).offset( ).top ) - parseInt( jQuery( window ).scrollTop( ) ); // TODO
	popover.style.top = 'calc( ' + offset_top + 'px - ' + popover.offsetHeight + 'px - 0.5em )';
	popover.style.left = 'calc( ' + event.pageX + 'px - ' + popover.offsetWidth / 2  + 'px )';
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

function kompassi_check_bg_contrast( element ) {
	if( element ) {
		let original = element;
		let ourBackgroundColor = window.getComputedStyle( element ).getPropertyValue( '--kompassi-bg' );
		let computed;
		do {
			computed = window.getComputedStyle( element );
			if( computed.background != 'none' ) {
				if( computed.backgroundColor == ourBackgroundColor ) {
					original.classList.add( 'fix-bg-contrast' );
				}
			} else {
				element = element.parentNode;
			}
		} while( computed.background == 'none' );
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
