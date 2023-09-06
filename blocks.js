var el = wp.element.createElement;
var __ = wp.i18n.__;
var _x = wp.i18n._x;

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
		  default_display: { type: 'string', default: 'list' },
        show_filters: { type: 'boolean', default: true },
        show_display_styles: { type: 'boolean', default: true },
        show_favorites_only: { type: 'boolean', default: false }
	  },
	  edit: function( props ) {
		  return( [
			  el( 'div', { }, __( 'Programme', 'kompassi-integration' ) ),
			  el( wp.blockEditor.InspectorControls, null,
				  el( wp.components.PanelBody, { title: __( 'Options', 'kompassi-integration' ) },
					  el( wp.components.SelectControl, {
						  label: __( 'Default Display', 'kompassi-integration' ),
						  options: [
							  { label: _x( 'Table', 'display style', 'kompassi-integration' ), value: 'table' },
							  { label: _x( 'List', 'display style', 'kompassi-integration' ), value: 'list' },
							  { label: _x( 'Expanded List', 'display style', 'kompassi-integration' ), value: 'expanded' },
							  { label: _x( 'Timeline', 'display style', 'kompassi-integration' ), value: 'timeline' }
						  ],
						  value: props.attributes.default_display,
						  onChange: function( value ) {
							  props.setAttributes( { default_display: value } );
						  }
                  } ),
                  el( wp.components.PanelRow, null,
                  	el( wp.components.ToggleControl, {
                  		label: __( 'Show Filters', 'kompassi-integration' ),
                  		checked: props.attributes.show_filters,
                  		onChange: function( value ) {
                  			props.setAttributes( { show_filters: !props.attributes.show_filters } );
                  		}
                  	} )
                  ),
                  el( wp.components.PanelRow, null,
                  	el( wp.components.ToggleControl, {
                  		label: __( 'Show Display Styles', 'kompassi-integration' ),
                  		checked: props.attributes.show_display_styles,
                  		onChange: function( value ) {
                  			props.setAttributes( { show_display_styles: !props.attributes.show_display_styles } );
                  		}
                  	} )
                  ),
                  el( wp.components.PanelRow, null,
                  	el( wp.components.ToggleControl, {
                  		label: __( 'Show Favorites Only', 'kompassi-integration' ),
                  		checked: props.attributes.show_favorites_only,
                  		onChange: function( value ) {
                  			props.setAttributes( { show_favorites_only: !props.attributes.show_favorites_only } );
                  		}
                  	} )
                  ),
				  )
			  )
		  ] );
	  },
	  save: function( props ) {
		  return null;
	  }
  }
);
