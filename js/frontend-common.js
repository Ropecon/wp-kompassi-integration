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
		id = options.id;
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
			this.closest( '.kompassi-dropdown-menu' ).querySelector( 'a' ).classList.toggle( 'active' );
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

/*  Close logic  */

window.addEventListener( 'click', function( event ) {
	let dropdown = event.target.closest( '.kompassi-dropdown' );
	let close_dropdowns;
	if( !dropdown ) {
		// Close all dropdowns
		close_dropdowns = document.querySelectorAll( '.kompassi-dropdown.open' );
	} else {
		// jos klikattu dd on auki, suljetaan muut dd
		if( dropdown.classList.contains( 'open' ) ) {
			dropdown.classList.add( 'current' );
			close_dropdowns = document.querySelectorAll( '.kompassi-dropdown.open:not(.current)' );
		}
	}

	if( close_dropdowns ) {
		for( let dd of close_dropdowns ) {
			dd.classList.remove( 'open' );
		}
	}

	if( dropdown ) {
		dropdown.classList.remove( 'current' );
	}
} );


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

	return modal;
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

	let offset_top = element.getBoundingClientRect().top + window.pageYOffset;
	popover.style.top = 'calc( ' + offset_top + 'px - ' + popover.offsetHeight + 'px - 0.5em )';
	popover.style.left = 'calc( ' + event.pageX + 'px - ' + popover.offsetWidth / 2  + 'px )';
}

/*
 *  Dropdown list
 *
 */

function kompassi_dropdown( options ) {
	let wrapper = document.createElement( 'div' );
	wrapper.classList.add( 'kompassi-dropdown' );
	if( options.classes ) {
		wrapper.classList.add( ...options.classes );
	}
	if( options.dataset ) {
		for( let data in options.dataset ) {
			wrapper.setAttribute( 'data-' + data, options.dataset[data] );
		}
	}

	let button = document.createElement( 'button' );
	button.textContent = options.label;
	button.addEventListener( 'click', function( event ) {
		wrapper.classList.toggle( 'open' );
	} );
	let indicator = document.createElement( 'span' );
	indicator.classList.add( 'kompassi-indicator' );
	button.append( indicator );

	let list = document.createElement( 'ul' );
	if( options.description ) {
		let item = document.createElement( 'li' );
		item.classList.add( 'description' );
		item.textContent = options.description;
		list.append( item );
	}

	for( let option in options.values ) {
		let item = document.createElement( 'li' );
		let input = document.createElement( 'input' );
		let label = document.createElement( 'label' );
		input.name = options.slug + '[]';
		input.id = options.slug + '_' + options.values[option].slug;
		input.type = 'checkbox';
		input.value = options.values[option].slug;
		label.textContent = options.values[option].title;
		label.setAttribute( 'for', options.slug + '_' + options.values[option].slug );
		label.prepend( input );

		item.append( label );
		list.append( item );

		input.addEventListener( 'change', function( event ) {
			let options = list.querySelectorAll( 'input' );
			let selected = 0;
			for( let option of options ) {
				if( option.checked ) {
					selected += 1;
				}
			}
			if( selected > 0 ) {
				button.classList.add( 'active' );
				indicator.textContent = selected;
			} else {
				button.classList.remove( 'active' );
				indicator.textContent = null;
			}
		} );
	}

	wrapper.append( button );
	wrapper.append( list );
	return wrapper;
}

/*
 *  Get URL options
 *
 */

function kompassi_get_url_options( ) {
	let url_options = {};
	let hash = new URL( window.location ).hash.substring( 1 ).split( '/' );
	for( let option of hash ) {
		option = option.split( ':' );
		if( !option[1] ) {
			url_options[option[0]] = true;
		} else {
			url_options[option[0]] = option[1];
		}
	}

	return url_options;
}

/*
 *  Push options to URL
 *
 */

function kompassi_set_url_options( opts = [] ) {
	let url = new URL( location );
	url.hash = opts.join( '/' );
	window.history.pushState( { 'opts': opts }, '', url );
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
	let kompassi_ajax_opts = { retryLimit: 3 }

	/*  Prepend REST URL base to rest_route  */
	opts.url = kompassi_common.rest_url_base + opts.rest_route;

	/*  Fire AJAX query  */
	kompassi_ajax( Object.assign( kompassi_ajax_opts, opts ) );
}

async function kompassi_ajax( opts ) {
	try {
		const response = await fetch( opts.url );
		if( !response.ok ) {
			throw new Error( 'Response:' + response.status );
		}

		response.json( ).then( function( r ) {
			opts.success( r );
		} );
	} catch( error ) {
		opts.retryLimit--;
		if( this.retryLimit ) {
			kompassi_ajax( opts );
			return;
		} else {
			console.log( 'Error: ' + error.message, error );
			if( opts.errorAction instanceof Function ) {
				opts.errorAction( );
			}
		}
	}
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

window.addEventListener( 'keydown', function( event ) {
	if( event.keyCode == 16 ) {
		kompassi_common.shift_pressed = true;
	}
} );

window.addEventListener( 'keyup', function( event ) {
	if( event.keyCode == 16 ) {
		kompassi_common.shift_pressed = false;
	}
} );
