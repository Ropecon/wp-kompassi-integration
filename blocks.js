var el = wp.element.createElement;
var __ = wp.i18n.__;

/**
 *
 *
 */

wp.blocks.registerBlockType(
  'kompassi-integration/programme',
  {
	  title: __( 'Programme', 'kompassi-integration' ),
	  category: 'kompassi',
	  supports: {
		  align: true
	  },
	  attributes: {
	  },
	  edit: function( props ) {
		  return( [
			  el( 'div', { }, __( 'Programme', 'kompassi-integration' ) ),
		  ] );
	  },
	  save: function( props ) {
		  return null;
	  }
  }
);
