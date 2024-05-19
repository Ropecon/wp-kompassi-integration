/*
 *  Modal
 *
 */

/*  Open  */

function kompassi_show_modal( options ) {
	modal = jQuery( '<div id="kompassi_modal" />' );
	if( typeof options.attrs !== 'undefined' && options.attrs.length > 0 ) {
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

	kompassi_update_url_hash( );

	return;

	// Actions
	actions.find( 'a' ).each( function( ) {
		jQuery( this ).text( jQuery( this ).attr( 'title' ) );
	} );
}

/*  Close  */

function kompassi_close_modal( ) {
	jQuery( '#kompassi_modal_bg, #kompassi_modal' ).remove( );
	jQuery( 'body' ).css( 'overflow', 'auto' );
	kompassi_update_url_hash( );
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
