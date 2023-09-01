jQuery( function( e ) {
	jQuery( '.event' ).on( 'click', function( e ) {
		var event_id = jQuery( this ).attr( 'id' );
		jQuery( '#info-' + event_id ).show( );
		jQuery( 'body' ).css( 'overflow', 'hidden' );
	} );

	jQuery( '.info' ).on( 'click', hide_info );
	jQuery( document ).on( 'keyup', hide_info );

	// TODO: When pressing Esc, close info window

	setInterval( function( ) {
		var time = Date.now( ) / 1000;
		var offset = ( parseInt( time ) - begin ) * 100 / ( end - begin );

		jQuery( '#now' ).css( 'left', 'calc( ' + offset + '% - 1px )' );
	}, 30 * 1000 );


} );

function hide_info( ) {
	jQuery( '.info' ).hide( );
	jQuery( 'body' ).css( 'overflow', 'auto' );
}
